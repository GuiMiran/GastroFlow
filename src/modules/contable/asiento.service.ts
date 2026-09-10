import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TicketEmitidoEvent,
  FacturaCompraRegistradaEvent,
  AsientoContableCreado,
} from '../../common/events/domain-events';
import { round2 } from '../../common/types/iva';

/**
 * SK-030: generar_asiento_automatico
 * SK-031: consultar_balance
 * SK-032: exportar_diario
 *
 * INV-030: Partida doble — Σ cargo = Σ abono (siempre)
 * RN-081: Cuentas PGC Pymes hostelería
 */

const PGC = {
  CAJA: '570',
  BANCOS: '572',
  VENTAS: '700',
  IVA_REPERCUTIDO: '477',
  IVA_SOPORTADO: '472',
  PROVEEDORES: '400',
  COMPRAS: '600',
} as const;

@Injectable()
export class AsientoService {
  private readonly logger = new Logger(AsientoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent(TicketEmitidoEvent.event)
  async onTicketEmitido(event: TicketEmitidoEvent) {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id: event.idTicket },
      include: {
        serieFacturacion: true,
        cliente: { select: { nombre: true } },
      },
    });
    const establecimientoId = ticket.serieFacturacion.establecimientoId;
    const clienteRef = ticket.cliente?.nombre ? ` — ${ticket.cliente.nombre}` : '';
    const concepto = `Venta${clienteRef} — Fra. ${ticket.codigoCompleto}`;

    const apuntes = this.generarApuntesVenta(event, ticket.codigoCompleto);
    const asiento = await this.crearAsiento({
      establecimientoId,
      origen: `ticket:${event.idTicket}`,
      concepto,
      fecha: new Date(),
      apuntes,
    });

    // INV-009: vincular asiento al ticket (ticket.asientoContableId jamás puede ser null)
    await this.prisma.ticket.update({
      where: { id: event.idTicket },
      data: { asientoContableId: asiento.id },
    });
    this.logger.log(`INV-009 OK: ticket ${event.idTicket} → asiento ${asiento.id}`);
  }

  @OnEvent(FacturaCompraRegistradaEvent.event)
  async onFacturaCompra(event: FacturaCompraRegistradaEvent) {
    const factura = await this.prisma.facturaCompra.findUniqueOrThrow({
      where: { id: event.facturaId },
      include: { proveedor: true },
    });
    const establecimientoId = factura.proveedor.establecimientoId;

    const base = round2(
      Number(factura.baseImponible4) + Number(factura.baseImponible10) + Number(factura.baseImponible21),
    );
    const iva = round2(
      Number(factura.cuotaIva4) + Number(factura.cuotaIva10) + Number(factura.cuotaIva21),
    );
    const total = Number(factura.total);

    const apuntes: ApunteInput[] = [
      { cuentaPgc: PGC.COMPRAS, cargo: base, abono: 0, concepto: 'Compra mercaderías' },
      { cuentaPgc: PGC.IVA_SOPORTADO, cargo: iva, abono: 0, concepto: 'IVA soportado' },
      { cuentaPgc: PGC.PROVEEDORES, cargo: 0, abono: total, concepto: `Proveedor ${event.proveedorId}` },
    ];

    await this.crearAsiento({
      establecimientoId,
      origen: `factura_compra:${event.facturaId}`,
      concepto: `Factura proveedor ${event.proveedorId}`,
      fecha: new Date(),
      apuntes,
    });
  }

  private async crearAsiento(params: {
    establecimientoId: string;
    origen: string;
    concepto: string;
    fecha: Date;
    apuntes: ApunteInput[];
  }) {
    const totalCargo = round2(params.apuntes.reduce((s, a) => s + a.cargo, 0));
    const totalAbono = round2(params.apuntes.reduce((s, a) => s + a.abono, 0));

    // INV-030: Partida doble estricta
    if (Math.abs(totalCargo - totalAbono) > 0.01) {
      this.logger.error(
        `INV-030 VIOLACIÓN: cargo=${totalCargo} ≠ abono=${totalAbono} origen=${params.origen}`,
      );
      throw new Error(`INV-030: Partida doble violada. Cargo=${totalCargo}, Abono=${totalAbono}`);
    }

    // Siguiente número secuencial para el establecimiento
    const yearStart = new Date(params.fecha.getFullYear(), 0, 1);
    const yearEnd = new Date(params.fecha.getFullYear() + 1, 0, 1);
    const count = await this.prisma.asientoContable.count({
      where: {
        establecimientoId: params.establecimientoId,
        fecha: { gte: yearStart, lt: yearEnd },
      },
    });

    const asiento = await this.prisma.asientoContable.create({
      data: {
        establecimientoId: params.establecimientoId,
        numero: count + 1,
        fecha: params.fecha,
        concepto: params.concepto,
        origen: params.origen,
        apuntes: {
          create: params.apuntes.map((a) => ({
            cuentaPgc: a.cuentaPgc,
            cargo: a.cargo,
            abono: a.abono,
            concepto: a.concepto,
          })),
        },
      },
    });

    this.logger.log(`SK-030 OK: Asiento ${asiento.id} — ${params.concepto} (${totalCargo}€)`);

    this.eventEmitter.emit(
      AsientoContableCreado.event,
      new AsientoContableCreado(asiento.id, params.origen),
    );

    return asiento;
  }

  private generarApuntesVenta(event: TicketEmitidoEvent, codigoCompleto?: string): ApunteInput[] {
    const ref = codigoCompleto ? ` — ${codigoCompleto}` : '';
    const apuntes: ApunteInput[] = [];

    for (const pago of event.formasPago) {
      const cuentaPgc = pago.forma === 'efectivo' ? PGC.CAJA : PGC.BANCOS;
      apuntes.push({
        cuentaPgc,
        cargo: pago.importe,
        abono: 0,
        concepto: `Cobro ${pago.forma}${ref}`,
      });
    }

    // Adjust for change (efectivo overpayment)
    const totalCargo = round2(apuntes.reduce((s, a) => s + a.cargo, 0));
    const cambio = round2(totalCargo - event.total);
    if (cambio > 0) {
      const efectivo = apuntes.find((a) => a.cuentaPgc === PGC.CAJA);
      if (efectivo) {
        efectivo.cargo = round2(efectivo.cargo - cambio);
      }
    }

    const baseTotal = round2(
      event.desglose.base4 + event.desglose.base10 + event.desglose.base21,
    );
    const ivaTotal = round2(
      event.desglose.iva4 + event.desglose.iva10 + event.desglose.iva21,
    );

    apuntes.push({
      cuentaPgc: PGC.VENTAS,
      cargo: 0,
      abono: baseTotal,
      concepto: `Ventas mercaderías${ref}`,
    });

    if (ivaTotal > 0) {
      apuntes.push({
        cuentaPgc: PGC.IVA_REPERCUTIDO,
        cargo: 0,
        abono: ivaTotal,
        concepto: `IVA repercutido${ref}`,
      });
    }

    return apuntes;
  }

  async consultarBalance(params: { desde?: Date; hasta?: Date }) {
    const where: Record<string, unknown> = {};
    if (params.desde || params.hasta) {
      const fecha: Record<string, Date> = {};
      if (params.desde) fecha.gte = params.desde;
      if (params.hasta) fecha.lte = params.hasta;
      where.asiento = { fecha };
    }

    const apuntes = await this.prisma.apunteContable.groupBy({
      by: ['cuentaPgc'],
      _sum: { cargo: true, abono: true },
      where,
    });

    return apuntes.map((a) => ({
      cuenta: a.cuentaPgc,
      totalCargo: Number(a._sum?.cargo ?? 0),
      totalAbono: Number(a._sum?.abono ?? 0),
      saldo: round2(Number(a._sum?.cargo ?? 0) - Number(a._sum?.abono ?? 0)),
    }));
  }

  async exportarDiario(params: { desde: Date; hasta: Date; establecimientoId?: string }) {
    const asientos = await this.prisma.asientoContable.findMany({
      where: {
        fecha: { gte: params.desde, lte: params.hasta },
        ...(params.establecimientoId ? { establecimientoId: params.establecimientoId } : {}),
      },
      include: {
        apuntes: true,
        ticket: { select: { codigoCompleto: true, tipo: true } },
      },
      orderBy: [{ fecha: 'asc' }, { numero: 'asc' }],
    });

    return asientos.map((a) => {
      const totalDebe = round2(a.apuntes.reduce((s, ap) => s + Number(ap.cargo), 0));
      const totalHaber = round2(a.apuntes.reduce((s, ap) => s + Number(ap.abono), 0));
      return {
        id: a.id,
        numero: a.numero,
        fecha: a.fecha,
        concepto: a.concepto,
        origen: a.origen,
        facturaRef: a.ticket?.codigoCompleto ?? null,
        cuadrado: Math.abs(totalDebe - totalHaber) <= 0.01,
        totalDebe,
        totalHaber,
        apuntes: a.apuntes.map((ap) => ({
          id: ap.id,
          cuenta: ap.cuentaPgc,
          concepto: ap.concepto ?? '',
          debe: Number(ap.cargo),
          haber: Number(ap.abono),
        })),
      };
    });
  }

  /**
   * Cierre de Caja Diario: compara total facturado vs total cobrado
   * Detecta descuadres entre tickets emitidos y cobros registrados
   */
  async cierreCaja(params: { establecimientoId: string; fecha?: string }) {
    const dia = params.fecha ? new Date(params.fecha) : new Date();
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59, 999);

    const ticketsAgg = await this.prisma.ticket.aggregate({
      _sum: { total: true },
      _count: { id: true },
      where: {
        fechaEmision: { gte: inicio, lte: fin },
        serieFacturacion: { establecimientoId: params.establecimientoId },
        tipo: { not: 'rectificativa' },
      },
    });

    const cobrosAgg = await this.prisma.cobro.aggregate({
      _sum: { importe: true },
      where: {
        ticket: {
          fechaEmision: { gte: inicio, lte: fin },
          serieFacturacion: { establecimientoId: params.establecimientoId },
        },
      },
    });

    const totalFacturado = round2(Number(ticketsAgg._sum.total ?? 0));
    const totalCobrado = round2(Number(cobrosAgg._sum.importe ?? 0));
    const diferencia = round2(totalFacturado - totalCobrado);

    return {
      fecha: dia.toISOString().slice(0, 10),
      totalFacturado,
      totalCobrado,
      diferencia,
      numFacturas: ticketsAgg._count.id,
      cuadrado: Math.abs(diferencia) <= 0.01,
    };
  }
}

interface ApunteInput {
  cuentaPgc: string;
  cargo: number;
  abono: number;
  concepto: string;
}
