import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  TurnoCajaAbiertoEvent,
  TurnoCajaCerradoEvent,
  ArqueoCajaRealizadoEvent,
  MovimientoCajaRegistradoEvent,
} from '../../../common/events/domain-events';
import { round2 } from '../../../common/types/iva';

/**
 * SK-009: cuadrar_caja
 * OP-010: AbrirTurnoCaja
 * OP-011: CerrarTurnoCaja (arqueo)
 * OP-012: RegistrarMovimientoCaja
 *
 * INV-015: fondo_apertura ≥ 0
 * INV-016: solo un turno abierto por caja
 * RN-040: diferencia arqueo = contado - esperado
 */
@Injectable()
export class CajaService {
  private readonly logger = new Logger(CajaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * OP-010: AbrirTurnoCaja
   * PRE: caja existe, ningún turno abierto (INV-016)
   * POST: turno abierto con fondo ≥ 0 (INV-015)
   */
  async abrirTurno(params: { cajaId: string; empleadoId: string; fondoApertura: number }) {
    const { cajaId, empleadoId, fondoApertura } = params;

    // INV-015
    if (fondoApertura < 0) {
      throw new BadRequestException('INV-015: fondo_apertura debe ser ≥ 0.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // INV-016: solo un turno abierto por caja
      const turnoAbierto = await tx.turnoCaja.findFirst({
        where: { cajaId, abierto: true },
      });
      if (turnoAbierto) {
        throw new BadRequestException('INV-016: Ya hay un turno abierto en esta caja.');
      }

      const turno = await tx.turnoCaja.create({
        data: {
          cajaId,
          cajeroId: empleadoId,
          fondoCaja: fondoApertura,
          abierto: true,
          horaApertura: new Date(),
        },
      });

      this.logger.log(`OP-010 OK: Turno ${turno.id} abierto en caja ${cajaId} fondo=${fondoApertura}€`);

      this.eventEmitter.emit(
        TurnoCajaAbiertoEvent.event,
        new TurnoCajaAbiertoEvent(turno.id, cajaId, empleadoId, fondoApertura),
      );

      return turno;
    });
  }

  /**
   * Consultar turno actualmente abierto para una caja.
   * Usado por el frontend al arrancar para recuperar el estado tras recarga.
   */
  async findTurnoActivo(cajaId: string) {
    return this.prisma.turnoCaja.findFirst({
      where: { cajaId, abierto: true },
      select: { id: true, fondoCaja: true, horaApertura: true },
    });
  }

  /**
   * OP-012: RegistrarMovimientoCaja
   * Entradas/salidas manuales de caja (ej: retirada a caja fuerte)
   */
  async registrarMovimiento(params: {
    turnoCajaId: string;
    tipo: 'entrada' | 'salida';
    importe: number;
    concepto: string;
    empleadoId: string;
  }) {
    const { turnoCajaId, tipo, importe, concepto, empleadoId } = params;

    if (importe <= 0) {
      throw new BadRequestException('Importe debe ser > 0.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const turno = await tx.turnoCaja.findUniqueOrThrow({ where: { id: turnoCajaId } });
      if (!turno.abierto) {
        throw new BadRequestException('El turno de caja está cerrado.');
      }

      const movimiento = await tx.movimientoCaja.create({
        data: {
          turnoCajaId,
          tipo,
          importe: tipo === 'salida' ? -importe : importe,
          concepto,
        },
      });

      this.logger.log(`OP-012 OK: ${tipo} ${importe}€ — ${concepto}`);

      this.eventEmitter.emit(
        MovimientoCajaRegistradoEvent.event,
        new MovimientoCajaRegistradoEvent(turnoCajaId, tipo, importe, concepto),
      );

      return movimiento;
    });
  }

  /**
   * OP-011: CerrarTurnoCaja (SK-009 cuadrar_caja)
   * PRE: turno abierto
   * POST: esperado calculado, diferencia = contado - esperado (RN-040)
   *
   * Suma: fondo_apertura + cobros_efectivo + entradas - salidas = esperado
   */
  async cerrarTurno(params: {
    turnoCajaId: string;
    contadoEfectivo: number;
    empleadoId: string;
  }) {
    const { turnoCajaId, contadoEfectivo, empleadoId } = params;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const turno = await tx.turnoCaja.findUniqueOrThrow({
        where: { id: turnoCajaId },
        include: { caja: true },
      });
      if (!turno.abierto) {
        throw new BadRequestException('OP-011 ERROR: Turno ya cerrado.');
      }

      // Calcular esperado: fondo + cobros en efectivo del turno + movimientos manuales
      const cobrosEfectivo = await tx.cobro.aggregate({
        _sum: { importe: true },
        where: {
          formaPago: 'efectivo',
          createdAt: { gte: turno.horaApertura },
          ticket: {
            servicio: {
              mesa: {
                zona: { establecimientoId: turno.caja.establecimientoId },
              },
            },
          },
        },
      });

      const movimientos = await tx.movimientoCaja.aggregate({
        _sum: { importe: true },
        where: { turnoCajaId },
      });

      const fondoApertura = Number(turno.fondoCaja);
      const totalCobrosEfectivo = Number(cobrosEfectivo._sum.importe ?? 0);
      const totalMovimientos = Number(movimientos._sum.importe ?? 0);

      const esperado = round2(fondoApertura + totalCobrosEfectivo + totalMovimientos);
      const diferencia = round2(contadoEfectivo - esperado); // RN-040

      // Cerrar turno
      await tx.turnoCaja.update({
        where: { id: turnoCajaId },
        data: {
          abierto: false,
          horaCierre: new Date(),
          efectivoReal: contadoEfectivo,
          efectivoEsperado: esperado,
          descuadre: diferencia,
        },
      });

      this.logger.log(
        `OP-011 OK: Turno cerrado. Esperado=${esperado}€ Contado=${contadoEfectivo}€ Diferencia=${diferencia}€`,
      );

      this.eventEmitter.emit(
        TurnoCajaCerradoEvent.event,
        new TurnoCajaCerradoEvent(turnoCajaId, turno.cajaId, esperado, contadoEfectivo, diferencia),
      );

      if (Math.abs(diferencia) > 0.01) {
        this.eventEmitter.emit(
          ArqueoCajaRealizadoEvent.event,
          new ArqueoCajaRealizadoEvent(turnoCajaId, esperado, contadoEfectivo, diferencia),
        );
      }

      return { esperado, contadoEfectivo, diferencia };
    });
  }
}
