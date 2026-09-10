import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  TicketEmitidoEvent,
  StockBajoMinimoEvent,
  StockNegativoEvent,
} from '../../common/events/domain-events';

/**
 * SK-010: descontar_stock (listener de EVT-004 TicketEmitido)
 * SK-011: consultar_stock
 * SK-012: alertar_minimo
 *
 * RN-060: Stock se descuenta al emitir ticket (no al tomar comanda)
 * INV-020: stock_actual = Σ entradas - Σ salidas (siempre consistente)
 * INV-021: alertar cuando stock < mínimo
 */
@Injectable()
export class InventarioService {
  private readonly logger = new Logger(InventarioService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Listar almacenes del establecimiento
   */
  async listarAlmacenes(establecimientoId: string) {
    return this.prisma.almacen.findMany({
      where: { establecimientoId, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * EVT-004 → SK-010: Descontar stock basado en escandallos
   *
   * Por cada línea del ticket:
   *   1. Buscar escandallo del producto
   *   2. Por cada ingrediente del escandallo: descontar cantidad × linea.cantidad
   *   3. Registrar movimiento de stock (salida)
   *   4. Si stock < mínimo → EVT-020
   *   5. Si stock < 0 → EVT-021
   */
  @OnEvent(TicketEmitidoEvent.event)
  async onTicketEmitido(event: TicketEmitidoEvent) {
    // Obtener líneas del servicio
    const lineas = await this.prisma.lineaComanda.findMany({
      where: {
        comanda: { servicioId: event.servicioId, estado: { not: 'anulada' } },
        anulada: false,
      },
      include: {
        producto: {
          include: {
            escandallo: {
              include: {
                ingredientes: { include: { ingrediente: true } },
              },
            },
          },
        },
      },
    });

    for (const linea of lineas) {
      const escandallo = linea.producto.escandallo;
      if (!escandallo) continue; // Producto sin escandallo, no descuenta stock

      for (const ei of escandallo.ingredientes) {
        const cantidadDescontar = Number(ei.cantidadNeta) * linea.cantidad;

        // Buscar stock en almacén principal
        const stock = await this.prisma.stock.findFirst({
          where: { ingredienteId: ei.ingredienteId },
        });

        if (!stock) {
          this.logger.warn(
            `SK-010: No hay registro de stock para ingrediente ${ei.ingredienteId}`,
          );
          continue;
        }

        // Registrar movimiento salida
        await this.prisma.movimientoStock.create({
          data: {
            ingredienteId: ei.ingredienteId,
            tipo: 'salida_venta',
            cantidad: -cantidadDescontar,
            origenDocumento: `ticket:${event.idTicket}`,
          },
        });

        // Actualizar stock actual
        const nuevoStock = Number(stock.cantidad) - cantidadDescontar;
        await this.prisma.stock.update({
          where: { id: stock.id },
          data: { cantidad: nuevoStock },
        });

        // INV-021: Alertar si bajo mínimo
        if (nuevoStock < Number(ei.ingrediente.stockMinimo)) {
          this.eventEmitter.emit(
            StockBajoMinimoEvent.event,
            new StockBajoMinimoEvent(ei.ingredienteId, nuevoStock, Number(ei.ingrediente.stockMinimo)),
          );
        }

        // EVT-021: Stock negativo
        if (nuevoStock < 0) {
          this.eventEmitter.emit(
            StockNegativoEvent.event,
            new StockNegativoEvent(ei.ingredienteId, nuevoStock),
          );
        }
      }
    }

    this.logger.log(`SK-010 OK: Stock descontado para ticket ${event.idTicket}`);
  }

  /**
   * SK-011: Consultar stock actual con alertas
   */
  async consultarStock(almacenId?: string) {
    const where = almacenId ? { almacenId } : {};

    const stocks = await this.prisma.stock.findMany({
      where,
      include: { ingrediente: true, almacen: true },
    });

    return stocks.map((s) => ({
      ingredienteId: s.ingredienteId,
      nombre: s.ingrediente.nombre,
      unidad: s.ingrediente.unidadMedida,
      actual: Number(s.cantidad),
      minimo: Number(s.ingrediente.stockMinimo),
      almacen: s.almacen.nombre,
      alerta: Number(s.cantidad) < Number(s.ingrediente.stockMinimo),
      negativo: Number(s.cantidad) < 0,
    }));
  }

  /**
   * HU-M2-INV-003: Inventario manual (conteo)
   * SK-022: registrar_conteo_inventario
   *
   * Registra conteo real, calcula desviación, ajusta stock
   * EVT-024: InventarioFisicoRealizado
   */
  async registrarConteo(params: {
    almacenId: string;
    conteos: Array<{
      ingredienteId: string;
      cantidadContada: number;
    }>;
  }) {
    const { almacenId, conteos } = params;
    const desviaciones: Array<{ ingredienteId: string; nombre: string; teorico: number; real: number; diferencia: number }> = [];

    for (const conteo of conteos) {
      const stock = await this.prisma.stock.findUnique({
        where: {
          ingredienteId_almacenId: {
            ingredienteId: conteo.ingredienteId,
            almacenId,
          },
        },
        include: { ingrediente: true },
      });

      const stockTeorico = stock ? Number(stock.cantidad) : 0;
      const diferencia = conteo.cantidadContada - stockTeorico;

      desviaciones.push({
        ingredienteId: conteo.ingredienteId,
        nombre: stock?.ingrediente.nombre ?? conteo.ingredienteId,
        teorico: stockTeorico,
        real: conteo.cantidadContada,
        diferencia,
      });

      if (Math.abs(diferencia) > 0.001) {
        // Registrar movimiento de ajuste
        await this.prisma.movimientoStock.create({
          data: {
            ingredienteId: conteo.ingredienteId,
            tipo: 'ajuste_inventario',
            cantidad: diferencia,
            origenDocumento: `inventario:${almacenId}:${new Date().toISOString()}`,
          },
        });

        // Actualizar stock
        if (stock) {
          await this.prisma.stock.update({
            where: { id: stock.id },
            data: { cantidad: conteo.cantidadContada },
          });
        } else {
          await this.prisma.stock.create({
            data: {
              ingredienteId: conteo.ingredienteId,
              almacenId,
              cantidad: conteo.cantidadContada,
            },
          });
        }
      }
    }

    // EVT-024: InventarioFisicoRealizado
    const { InventarioFisicoRealizadoEvent } = await import('../../common/events/domain-events');
    this.eventEmitter.emit(
      InventarioFisicoRealizadoEvent.event,
      new InventarioFisicoRealizadoEvent(
        almacenId,
        desviaciones.map((d) => ({ ingredienteId: d.ingredienteId, diferencia: d.diferencia })),
      ),
    );

    this.logger.log(`INV-003 OK: Conteo en almacén ${almacenId}, ${desviaciones.length} ingredientes, ${desviaciones.filter((d) => Math.abs(d.diferencia) > 0.001).length} desviaciones`);

    return { almacenId, desviaciones };
  }

  /**
   * HU-M2-INV-005: Traspaso entre almacenes
   * INV-017: Σ stock_almacenes = stock_total
   */
  async traspasoStock(params: {
    ingredienteId: string;
    almacenOrigenId: string;
    almacenDestinoId: string;
    cantidad: number;
  }) {
    const { ingredienteId, almacenOrigenId, almacenDestinoId, cantidad } = params;

    if (cantidad <= 0) {
      throw new BadRequestException('La cantidad debe ser > 0.');
    }

    const stockOrigen = await this.prisma.stock.findUnique({
      where: { ingredienteId_almacenId: { ingredienteId, almacenId: almacenOrigenId } },
    });

    if (!stockOrigen || Number(stockOrigen.cantidad) < cantidad) {
      throw new BadRequestException('Stock insuficiente en almacén origen.');
    }

    await this.prisma.$transaction(async (tx) => {
      // Descontar de origen
      await tx.stock.update({
        where: { id: stockOrigen.id },
        data: { cantidad: { decrement: cantidad } },
      });

      // Incrementar en destino (upsert)
      await tx.stock.upsert({
        where: { ingredienteId_almacenId: { ingredienteId, almacenId: almacenDestinoId } },
        update: { cantidad: { increment: cantidad } },
        create: { ingredienteId, almacenId: almacenDestinoId, cantidad },
      });

      // Registrar movimientos
      await tx.movimientoStock.createMany({
        data: [
          {
            ingredienteId,
            tipo: 'traspaso_salida',
            cantidad: -cantidad,
            origenDocumento: `traspaso:${almacenOrigenId}→${almacenDestinoId}`,
          },
          {
            ingredienteId,
            tipo: 'traspaso_entrada',
            cantidad,
            origenDocumento: `traspaso:${almacenOrigenId}→${almacenDestinoId}`,
          },
        ],
      });
    });

    this.logger.log(`INV-005 OK: Traspaso ${cantidad} de ${almacenOrigenId} → ${almacenDestinoId}`);
    return { ok: true };
  }
}
