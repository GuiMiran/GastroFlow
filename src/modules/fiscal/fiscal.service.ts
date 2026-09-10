import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Modelo303GeneradoEvent } from '../../common/events/domain-events';
import { round2 } from '../../common/types/iva';

/**
 * SK-040: calcular_iva_trimestral
 * SK-041: generar_modelo_303
 * SK-042: generar_libro_registro
 *
 * RN-080: IVA repercutido – IVA soportado = cuota
 * RN-082: trimestres T1(ene-mar), T2(abr-jun), T3(jul-sep), T4(oct-dic)
 * INV-032: Libro registro completo
 */

const TRIMESTRES: Record<number, { desde: [number, number]; hasta: [number, number] }> = {
  1: { desde: [0, 1], hasta: [2, 31] },   // ene-mar
  2: { desde: [3, 1], hasta: [5, 30] },   // abr-jun
  3: { desde: [6, 1], hasta: [8, 30] },   // jul-sep
  4: { desde: [9, 1], hasta: [11, 31] },  // oct-dic
};

@Injectable()
export class FiscalService {
  private readonly logger = new Logger(FiscalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * SK-040: Calcula IVA repercutido y soportado del trimestre
   * RN-080: resultado = repercutido – soportado
   */
  async calcularIvaTrimestral(year: number, trimestre: number) {
    const { desde, hasta } = this.rangoTrimestre(year, trimestre);

    // IVA Repercutido (ventas/tickets)
    const emitidas = await this.prisma.libroRegistroEmitida.aggregate({
      _sum: { baseImponible: true, cuotaIva: true, total: true },
      where: {
        fechaExpedicion: { gte: desde, lte: hasta },
      },
    });

    // IVA Soportado (compras/facturas proveedores)
    const recibidas = await this.prisma.libroRegistroRecibida.aggregate({
      _sum: { baseImponible: true, cuotaIva: true, total: true },
      where: {
        fechaRecepcion: { gte: desde, lte: hasta },
      },
    });

    const ivaRepercutido = Number(emitidas._sum.cuotaIva ?? 0);
    const ivaSoportado = Number(recibidas._sum.cuotaIva ?? 0);
    const resultado = round2(ivaRepercutido - ivaSoportado); // RN-080

    return {
      year,
      trimestre,
      desde,
      hasta,
      ventas: {
        base: Number(emitidas._sum.baseImponible ?? 0),
        cuota: ivaRepercutido,
        total: Number(emitidas._sum.total ?? 0),
      },
      compras: {
        base: Number(recibidas._sum.baseImponible ?? 0),
        cuota: ivaSoportado,
        total: Number(recibidas._sum.total ?? 0),
      },
      resultado, // + a ingresar, - a devolver
    };
  }

  /**
   * SK-041: Genera datos para Modelo 303
   * Estructura simplificada de las casillas principales
   */
  async generarModelo303(year: number, trimestre: number) {
    const iva = await this.calcularIvaTrimestral(year, trimestre);

    // Desglose por tipo IVA de emitidas
    const { desde, hasta } = this.rangoTrimestre(year, trimestre);

    const tickets = await this.prisma.ticket.findMany({
      where: {
        createdAt: { gte: desde, lte: hasta },
        tipo: { not: 'rectificativa' },
      },
    });

    const desglose = {
      base21: round2(tickets.reduce((s, t) => s + Number(t.baseImponible21), 0)),
      cuota21: round2(tickets.reduce((s, t) => s + Number(t.cuotaIva21), 0)),
      base10: round2(tickets.reduce((s, t) => s + Number(t.baseImponible10), 0)),
      cuota10: round2(tickets.reduce((s, t) => s + Number(t.cuotaIva10), 0)),
      base4: round2(tickets.reduce((s, t) => s + Number(t.baseImponible4), 0)),
      cuota4: round2(tickets.reduce((s, t) => s + Number(t.cuotaIva4), 0)),
    };

    const modelo303 = {
      ejercicio: year,
      periodo: `${trimestre}T`,
      // Casillas IVA devengado (repercutido)
      casilla01_base21: desglose.base21,
      casilla02_tipo: 21,
      casilla03_cuota21: desglose.cuota21,
      casilla04_base10: desglose.base10,
      casilla05_tipo: 10,
      casilla06_cuota10: desglose.cuota10,
      casilla07_base4: desglose.base4,
      casilla08_tipo: 4,
      casilla09_cuota4: desglose.cuota4,
      casilla27_totalDevengado: iva.ventas.cuota,
      // Casillas IVA deducible (soportado)
      casilla28_baseSoportado: iva.compras.base,
      casilla29_cuotaSoportado: iva.compras.cuota,
      // Resultado
      casilla46_resultado: iva.resultado,
      casilla71_resultadoFinal: iva.resultado,
    };

    this.logger.log(
      `SK-041 OK: Modelo 303 ${year}-${trimestre}T resultado=${iva.resultado}€`,
    );

    this.eventEmitter.emit(
      Modelo303GeneradoEvent.event,
      new Modelo303GeneradoEvent(trimestre, iva.resultado),
    );

    return modelo303;
  }

  /**
   * SK-042: Genera libro registro de facturas emitidas y recibidas
   * INV-032: secuencial, completo, sin huecos
   */
  async generarLibroRegistro(year: number, trimestre: number) {
    const { desde, hasta } = this.rangoTrimestre(year, trimestre);

    const emitidas = await this.prisma.libroRegistroEmitida.findMany({
      where: { fechaExpedicion: { gte: desde, lte: hasta } },
      include: { ticket: true },
      orderBy: { fechaExpedicion: 'asc' },
    });

    const recibidas = await this.prisma.libroRegistroRecibida.findMany({
      where: { fechaRecepcion: { gte: desde, lte: hasta } },
      include: { facturaCompra: true },
      orderBy: { fechaRecepcion: 'asc' },
    });

    return {
      year,
      trimestre,
      emitidas: emitidas.map((e) => ({
        fecha: e.fechaExpedicion,
        documento: e.ticket.codigoCompleto,
        tipo: e.tipoDocumento,
        base: Number(e.baseImponible),
        cuota: Number(e.cuotaIva),
        total: Number(e.total),
      })),
      recibidas: recibidas.map((r) => ({
        fecha: r.fechaRecepcion,
        factura: r.facturaCompra.numeroFactura,
        base: Number(r.baseImponible),
        cuota: Number(r.cuotaIva),
        total: Number(r.total),
      })),
    };
  }

  private rangoTrimestre(year: number, trimestre: number) {
    const t = TRIMESTRES[trimestre];
    if (!t) throw new Error(`Trimestre inválido: ${trimestre}`);
    return {
      desde: new Date(year, t.desde[0], t.desde[1]),
      hasta: new Date(year, t.hasta[0], t.hasta[1], 23, 59, 59),
    };
  }
}
