import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { VeriFactuService, VeriFactuDatos } from '../../verifactu/verifactu.service';
import { ComandaService } from './comanda.service';
import { TicketEmitidoEvent, FacturaRectificativaEmitidaEvent } from '../../../common/events/domain-events';
import { round2, decimalToNumber } from '../../../common/types/iva';

/**
 * SK-005: cobrar_servicio
 * SK-006: emitir_ticket_verifactu
 * SK-007: emitir_factura_completa
 * SK-008: emitir_factura_rectificativa
 *
 * OP-004: CobrarMesa — la operación más crítica del sistema
 * OP-006: EmitirFacturaCompleta
 * OP-033: EmitirFacturaRectificativa
 *
 * WF-001 pasos 5→6: cobro → ticket VeriFactu
 */
@Injectable()
export class CobroService {
  private readonly logger = new Logger(CobroService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verifactu: VeriFactuService,
    private readonly comandaService: ComandaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * OP-004: CobrarMesa (SK-005 + SK-006 en una transacción atómica)
   *
   * PRE: servicio activo, ≥1 comanda, cuenta>0, formas de pago≥total
   * POST: ticket con nº secuencial (INV-001), hash VeriFactu (INV-008),
   *        cobro registrado, cambio calculado, mesa→libre, servicio→cerrado
   * ERROR: pago insuficiente→rechazar, error numeración→PARAR
   */
  async cobrarServicio(params: {
    servicioId: string;
    formasPago: Array<{ forma: 'efectivo' | 'tarjeta' | 'bizum' | 'invitacion'; importe: number }>;
    clienteId?: string;
  }) {
    const { servicioId, formasPago, clienteId } = params;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // PRE: servicio activo
      const servicio = await tx.servicio.findUniqueOrThrow({
        where: { id: servicioId },
        include: { mesa: { include: { zona: true } } },
      });
      if (!servicio.abierto) {
        throw new BadRequestException('OP-004 ERROR: Servicio no activo.');
      }

      // PRE: ≥1 comanda
      const comandas = await tx.comanda.count({
        where: { servicioId, estado: { not: 'anulada' } },
      });
      if (comandas === 0) {
        throw new BadRequestException('OP-004 ERROR: No hay comandas en este servicio.');
      }

      // Calcular cuenta
      const cuenta = await this.comandaService.calcularCuenta(servicioId);
      if (cuenta.total <= 0) {
        throw new BadRequestException('OP-004 ERROR: Total debe ser > 0 (RN-033).');
      }

      // INV-014: Σ pagos ≥ total
      const totalPagado = round2(formasPago.reduce((s, fp) => s + fp.importe, 0));
      if (totalPagado < cuenta.total) {
        throw new BadRequestException(
          `OP-004 ERROR: Pago insuficiente. Total=${cuenta.total}, pagado=${totalPagado}.`,
        );
      }
      const cambio = round2(totalPagado - cuenta.total); // RN-037: propinas aparte

      // Obtener establecimiento para datos fiscales
      const establecimiento = await tx.establecimiento.findFirstOrThrow({
        where: {
          zonas: { some: { mesas: { some: { id: servicio.mesaId ?? undefined } } } },
        },
      });

      // SK-006: Obtener serie de facturación y siguiente número
      const serieFacturacion = await tx.serieFacturacion.findFirstOrThrow({
        where: {
          establecimientoId: establecimiento.id,
          prefijo: 'V',
          year: new Date().getFullYear(),
        },
      });

      // INV-001: Número secuencial sin saltos
      const { numero, codigoCompleto } = await this.verifactu.obtenerSiguienteNumero(
        serieFacturacion.id,
        tx,
      );

      // Crear ticket
      const ticket = await tx.ticket.create({
        data: {
          servicioId,
          serieFacturacionId: serieFacturacion.id,
          tipo: 'ticket', // POL-002: simplificada por defecto
          numeroSecuencial: numero,
          codigoCompleto,
          baseImponible4: cuenta.desglose.base4,
          cuotaIva4: cuenta.desglose.iva4,
          baseImponible10: cuenta.desglose.base10,
          cuotaIva10: cuenta.desglose.iva10,
          baseImponible21: cuenta.desglose.base21,
          cuotaIva21: cuenta.desglose.iva21,
          totalSinIva: cuenta.totalSinIva,
          totalIva: cuenta.totalIva,
          total: cuenta.total,
          clienteId: clienteId ?? null,
          cobros: {
            create: formasPago.map((fp) => ({
              formaPago: fp.forma,
              importe: fp.importe,
              cambio: fp.forma === 'efectivo' ? cambio : 0,
            })),
          },
        },
      });

      // INV-007/008: Registro VeriFactu
      const verifactuDatos: VeriFactuDatos = {
        codigoCompleto,
        tipo: 'ticket',
        fechaEmision: new Date().toISOString(),
        nifEmisor: establecimiento.nif,
        nombreEmisor: establecimiento.nombre,
        totalSinIva: cuenta.totalSinIva,
        totalIva: cuenta.totalIva,
        total: cuenta.total,
        desglose: cuenta.desglose,
      };
      const { hashActual } = await this.verifactu.crearRegistro(ticket.id, verifactuDatos, tx);

      // Cerrar servicio
      await tx.servicio.update({
        where: { id: servicioId },
        data: { abierto: false, horaCierre: new Date() },
      });

      // Liberar mesa (INV-010)
      if (servicio.mesaId) {
        await tx.mesa.update({
          where: { id: servicio.mesaId },
          data: { estado: 'libre' },
        });
      }

      // Libro registro emitidas (INV-032)
      await tx.libroRegistroEmitida.create({
        data: {
          ticketId: ticket.id,
          fechaExpedicion: new Date(),
          baseImponible: cuenta.totalSinIva,
          cuotaIva: cuenta.totalIva,
          total: cuenta.total,
          tipoDocumento: 'ticket',
        },
      });

      this.logger.log(
        `OP-004 OK: Cobrado ${codigoCompleto} total=${cuenta.total}€ cambio=${cambio}€ hash=${hashActual.substring(0, 12)}...`,
      );

      // EVT-004: TicketEmitido — dispara cascada (asiento, stock, IVA, puntos)
      this.eventEmitter.emit(
        TicketEmitidoEvent.event,
        new TicketEmitidoEvent(
          ticket.id,
          numero,
          'V',
          cuenta.total,
          cuenta.desglose,
          formasPago.map((fp) => ({ forma: fp.forma, importe: fp.importe })),
          hashActual,
          servicioId,
          clienteId ?? null,
        ),
      );

      return {
        ticketId: ticket.id,
        codigoCompleto,
        total: cuenta.total,
        desglose: cuenta.desglose,
        cambio,
        hashVerifactu: hashActual,
      };
    });
  }

  /**
   * SK-007: emitir_factura_completa
   * OP-006: EmitirFacturaCompleta
   *
   * PRE: ticket cobrado, cliente da NIF válido
   * POST: factura completa con serie propia, datos destinatario, desglose IVA
   */
  async emitirFacturaCompleta(params: {
    ticketId: string;
    destinatarioNif: string;
    destinatarioNombre: string;
    destinatarioDireccion: string;
    establecimientoId: string;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ticketOriginal = await tx.ticket.findUniqueOrThrow({
        where: { id: params.ticketId },
      });

      // Obtener serie de facturas completas
      const serieFactura = await tx.serieFacturacion.findFirstOrThrow({
        where: {
          establecimientoId: params.establecimientoId,
          prefijo: 'F',
          year: new Date().getFullYear(),
        },
      });

      const { numero, codigoCompleto } = await this.verifactu.obtenerSiguienteNumero(
        serieFactura.id,
        tx,
      );

      const factura = await tx.ticket.create({
        data: {
          servicioId: ticketOriginal.servicioId,
          serieFacturacionId: serieFactura.id,
          tipo: 'factura_completa',
          numeroSecuencial: numero,
          codigoCompleto,
          baseImponible4: ticketOriginal.baseImponible4,
          cuotaIva4: ticketOriginal.cuotaIva4,
          baseImponible10: ticketOriginal.baseImponible10,
          cuotaIva10: ticketOriginal.cuotaIva10,
          baseImponible21: ticketOriginal.baseImponible21,
          cuotaIva21: ticketOriginal.cuotaIva21,
          totalSinIva: ticketOriginal.totalSinIva,
          totalIva: ticketOriginal.totalIva,
          total: ticketOriginal.total,
          destinatarioNif: params.destinatarioNif,
          destinatarioNombre: params.destinatarioNombre,
          destinatarioDireccion: params.destinatarioDireccion,
          clienteId: ticketOriginal.clienteId,
        },
      });

      // VeriFactu para la factura
      const establecimiento = await tx.establecimiento.findUniqueOrThrow({
        where: { id: params.establecimientoId },
      });

      await this.verifactu.crearRegistro(
        factura.id,
        {
          codigoCompleto,
          tipo: 'factura_completa',
          fechaEmision: new Date().toISOString(),
          nifEmisor: establecimiento.nif,
          nombreEmisor: establecimiento.nombre,
          totalSinIva: decimalToNumber(factura.totalSinIva),
          totalIva: decimalToNumber(factura.totalIva),
          total: decimalToNumber(factura.total),
          desglose: {
            base4: decimalToNumber(factura.baseImponible4),
            iva4: decimalToNumber(factura.cuotaIva4),
            base10: decimalToNumber(factura.baseImponible10),
            iva10: decimalToNumber(factura.cuotaIva10),
            base21: decimalToNumber(factura.baseImponible21),
            iva21: decimalToNumber(factura.cuotaIva21),
          },
        },
        tx,
      );

      // Libro emitidas
      await tx.libroRegistroEmitida.create({
        data: {
          ticketId: factura.id,
          fechaExpedicion: new Date(),
          baseImponible: decimalToNumber(factura.totalSinIva),
          cuotaIva: decimalToNumber(factura.totalIva),
          total: decimalToNumber(factura.total),
          tipoDocumento: 'factura_completa',
        },
      });

      this.logger.log(`SK-007 OK: Factura completa ${codigoCompleto} para NIF ${params.destinatarioNif}`);

      return { facturaId: factura.id, codigoCompleto };
    });
  }

  /**
   * SK-008: emitir_factura_rectificativa
   * OP-033: EmitirFacturaRectificativa
   *
   * PRE: ticket/factura original existe
   * POST: rectificativa serie "R", referencia a original, registro VeriFactu nuevo
   *
   * RN-035: Ticket original NO se elimina
   * INV-007: Registro VeriFactu original NO se modifica
   */
  async emitirRectificativa(params: {
    ticketOriginalId: string;
    tipoRectificacion: 'sustitucion' | 'diferencias';
    motivo: string;
    establecimientoId: string;
  }) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const original = await tx.ticket.findUniqueOrThrow({
        where: { id: params.ticketOriginalId },
      });

      const serieRect = await tx.serieFacturacion.findFirstOrThrow({
        where: {
          establecimientoId: params.establecimientoId,
          prefijo: 'R',
          year: new Date().getFullYear(),
        },
      });

      const { numero, codigoCompleto } = await this.verifactu.obtenerSiguienteNumero(
        serieRect.id,
        tx,
      );

      // Importes negativos (anulación)
      const rectificativa = await tx.ticket.create({
        data: {
          servicioId: original.servicioId,
          serieFacturacionId: serieRect.id,
          tipo: 'rectificativa',
          numeroSecuencial: numero,
          codigoCompleto,
          ticketOriginalId: original.id,
          motivoRectificacion: params.motivo,
          tipoRectificacion: params.tipoRectificacion,
          // Importes negativos para rectificativa por sustitución
          baseImponible4: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.baseImponible4) : 0,
          cuotaIva4: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.cuotaIva4) : 0,
          baseImponible10: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.baseImponible10) : 0,
          cuotaIva10: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.cuotaIva10) : 0,
          baseImponible21: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.baseImponible21) : 0,
          cuotaIva21: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.cuotaIva21) : 0,
          totalSinIva: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.totalSinIva) : 0,
          totalIva: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.totalIva) : 0,
          total: params.tipoRectificacion === 'sustitucion'
            ? -decimalToNumber(original.total) : 0,
        },
      });

      // VeriFactu para rectificativa (nuevo registro, NO modifica original)
      const establecimiento = await tx.establecimiento.findUniqueOrThrow({
        where: { id: params.establecimientoId },
      });

      await this.verifactu.crearRegistro(
        rectificativa.id,
        {
          codigoCompleto,
          tipo: 'rectificativa',
          fechaEmision: new Date().toISOString(),
          nifEmisor: establecimiento.nif,
          nombreEmisor: establecimiento.nombre,
          totalSinIva: decimalToNumber(rectificativa.totalSinIva),
          totalIva: decimalToNumber(rectificativa.totalIva),
          total: decimalToNumber(rectificativa.total),
          desglose: {
            base4: decimalToNumber(rectificativa.baseImponible4),
            iva4: decimalToNumber(rectificativa.cuotaIva4),
            base10: decimalToNumber(rectificativa.baseImponible10),
            iva10: decimalToNumber(rectificativa.cuotaIva10),
            base21: decimalToNumber(rectificativa.baseImponible21),
            iva21: decimalToNumber(rectificativa.cuotaIva21),
          },
        },
        tx,
      );

      // Libro emitidas
      await tx.libroRegistroEmitida.create({
        data: {
          ticketId: rectificativa.id,
          fechaExpedicion: new Date(),
          baseImponible: decimalToNumber(rectificativa.totalSinIva),
          cuotaIva: decimalToNumber(rectificativa.totalIva),
          total: decimalToNumber(rectificativa.total),
          tipoDocumento: 'rectificativa',
        },
      });

      this.logger.log(
        `SK-008 OK: Rectificativa ${codigoCompleto} para original ${original.codigoCompleto}`,
      );

      // EVT-006
      this.eventEmitter.emit(
        FacturaRectificativaEmitidaEvent.event,
        new FacturaRectificativaEmitidaEvent(
          rectificativa.id,
          original.id,
          params.motivo,
          decimalToNumber(rectificativa.total),
        ),
      );

      return { rectificativaId: rectificativa.id, codigoCompleto };
    });
  }

  /**
   * HU-M1-COB-008: Listado de tickets/facturas del turno de caja
   * GET /cobros/tickets?establecimientoId=&fecha=
   *
   * Devuelve todos los tickets del día (o turno) con el estado del ciclo de vida (HU-M1-COB-009)
   */
  async listarTickets(params: { establecimientoId: string; fecha?: string }) {
    const dia = params.fecha ? new Date(params.fecha) : new Date();
    const inicio = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 0, 0, 0);
    const fin = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), 23, 59, 59, 999);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        fechaEmision: { gte: inicio, lte: fin },
        serieFacturacion: { establecimientoId: params.establecimientoId },
      },
      include: {
        cobros: true,
        cliente: { select: { nombre: true, email: true } },
        asientoContable: { select: { id: true, numero: true } },
        registroVeriFactu: { select: { hashActual: true, createdAt: true } },
        libroRegistroEmitida: { select: { id: true } },
        servicio: {
          include: {
            mesa: { select: { numero: true } },
          },
        },
      },
      orderBy: { fechaEmision: 'desc' },
    });

    return tickets.map((t) => ({
      id: t.id,
      codigoCompleto: t.codigoCompleto,
      tipo: t.tipo,
      fechaEmision: t.fechaEmision,
      mesa: t.servicio?.mesa?.numero ?? null,
      cliente: t.cliente?.nombre ?? null,
      total: Number(t.total),
      totalSinIva: Number(t.totalSinIva),
      totalIva: Number(t.totalIva),
      desglose: {
        base4: Number(t.baseImponible4), iva4: Number(t.cuotaIva4),
        base10: Number(t.baseImponible10), iva10: Number(t.cuotaIva10),
        base21: Number(t.baseImponible21), iva21: Number(t.cuotaIva21),
      },
      formasPago: t.cobros.map((c) => ({ forma: c.formaPago, importe: Number(c.importe) })),
      destinatarioNif: t.destinatarioNif ?? null,
      destinatarioNombre: t.destinatarioNombre ?? null,
      // HU-M1-COB-009: Estado del ciclo de vida
      cicloVida: this.calcularCicloVida(t),
      asiento: t.asientoContable
        ? { id: t.asientoContable.id, numero: t.asientoContable.numero }
        : null,
      verifactu: t.registroVeriFactu
        ? { hash: t.registroVeriFactu.hashActual.substring(0, 16) + '...' }
        : null,
    }));
  }

  /**
   * HU-M1-COB-008 (detalle): Factura completa con lineas de producto para imprimir/WhatsApp
   * GET /cobros/tickets/:id
   */
  async obtenerTicketCompleto(id: string) {
    const ticket = await this.prisma.ticket.findUniqueOrThrow({
      where: { id },
      include: {
        cobros: true,
        cliente: { select: { nombre: true, email: true } },
        asientoContable: { select: { id: true, numero: true } },
        registroVeriFactu: { select: { hashActual: true } },
        servicio: {
          include: {
            mesa: { select: { numero: true } },
            comandas: {
              where: { estado: { not: 'anulada' } },
              include: {
                lineas: {
                  where: { anulada: false },
                  include: { producto: { select: { nombre: true } } },
                },
              },
            },
          },
        },
        serieFacturacion: {
          include: {
            establecimiento: {
              select: { nombre: true, nif: true, direccion: true, ciudad: true },
            },
          },
        },
      },
    });

    const todasLineas = ticket.servicio?.comandas.flatMap((c) => c.lineas) ?? [];

    return {
      id: ticket.id,
      codigoCompleto: ticket.codigoCompleto,
      tipo: ticket.tipo,
      fechaEmision: ticket.fechaEmision,
      mesa: ticket.servicio?.mesa?.numero ?? null,
      establecimiento: {
        nombre: ticket.serieFacturacion.establecimiento.nombre,
        nif: ticket.serieFacturacion.establecimiento.nif,
        direccion: ticket.serieFacturacion.establecimiento.direccion,
        ciudad: ticket.serieFacturacion.establecimiento.ciudad,
      },
      destinatarioNif: ticket.destinatarioNif ?? null,
      destinatarioNombre: ticket.destinatarioNombre ?? null,
      destinatarioDireccion: ticket.destinatarioDireccion ?? null,
      destinatarioEmail: ticket.cliente?.email ?? null,
      total: Number(ticket.total),
      totalSinIva: Number(ticket.totalSinIva),
      totalIva: Number(ticket.totalIva),
      desglose: {
        base4: Number(ticket.baseImponible4), iva4: Number(ticket.cuotaIva4),
        base10: Number(ticket.baseImponible10), iva10: Number(ticket.cuotaIva10),
        base21: Number(ticket.baseImponible21), iva21: Number(ticket.cuotaIva21),
      },
      formasPago: ticket.cobros.map((c) => ({ forma: c.formaPago, importe: Number(c.importe) })),
      lineas: todasLineas.map((l) => ({
        id: l.id,
        nombre: l.producto.nombre,
        cantidad: l.cantidad,
        precioUnitario: Number(l.precioUnitario),
        tipoIva: Number(l.tipoIva),
      })),
      asiento: ticket.asientoContable
        ? { id: ticket.asientoContable.id, numero: ticket.asientoContable.numero }
        : null,
      verifactu: ticket.registroVeriFactu
        ? { hash: ticket.registroVeriFactu.hashActual }
        : null,
    };
  }

  /**
   * HU-M1-COB-009: Calcula el estado del ciclo de vida de la factura
   * EMITIDA → ASIENTO_GENERADO → LIBRO_IVA_REGISTRADO → VERIFACTU_FIRMADA → CONSERVADA
   */
  private calcularCicloVida(ticket: {
    asientoContableId: string | null;
    libroRegistroEmitida: { id: string } | null;
    registroVeriFactu: { hashActual: string } | null;
  }): string {
    if (!ticket.registroVeriFactu) return 'EMITIDA';
    if (!ticket.asientoContableId) return 'VERIFACTU_FIRMADA'; // asiento pendiente (no debería ocurrir tras el fix)
    if (!ticket.libroRegistroEmitida) return 'ASIENTO_GENERADO';
    return 'CONSERVADA'; // todos los estados completos
  }
}

