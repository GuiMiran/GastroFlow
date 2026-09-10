import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { MesaAbiertaEvent } from '../../../common/events/domain-events';

/**
 * SK-001: abrir_mesa
 * OP-001: AbrirMesa
 *
 * PRE: mesa existe, estado libre/reservada
 * POST: mesa→ocupada, servicio creado con hora
 * ERROR: mesa ya ocupada→rechazar
 *
 * Invariantes: INV-010 (mesa en un solo estado), INV-011 (servicio activo → mesa ocupada)
 * Reglas: RN-030 (una mesa = un servicio activo)
 */
@Injectable()
export class MesaService {
  private readonly logger = new Logger(MesaService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** SK-001: abrir_mesa */
  async abrirMesa(params: {
    mesaId: string;
    camareroId: string;
    comensales: number;
  }) {
    const { mesaId, camareroId, comensales } = params;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const mesa = await tx.mesa.findUniqueOrThrow({
        where: { id: mesaId },
      });

      // PRE: estado libre o reservada
      if (mesa.estado !== 'libre' && mesa.estado !== 'reservada') {
        throw new BadRequestException(
          `OP-001 ERROR: Mesa ${mesa.numero} en estado "${mesa.estado}". Solo se puede abrir si está libre o reservada.`,
        );
      }

      // RN-030: verificar que no haya servicio activo
      const servicioActivo = await tx.servicio.findFirst({
        where: { mesaId, abierto: true },
      });
      if (servicioActivo) {
        throw new BadRequestException(
          `RN-030: Mesa ${mesa.numero} ya tiene un servicio activo (${servicioActivo.id}).`,
        );
      }

      // POST: mesa→ocupada, servicio creado
      const [servicio] = await Promise.all([
        tx.servicio.create({
          data: { mesaId, camareroId, comensales },
        }),
        tx.mesa.update({
          where: { id: mesaId },
          data: { estado: 'ocupada' }, // INV-010
        }),
      ]);

      this.logger.log(`SK-001 OK: Mesa ${mesa.numero} abierta → servicio ${servicio.id}`);

      // EVT-001: MesaAbierta
      this.eventEmitter.emit(
        MesaAbiertaEvent.event,
        new MesaAbiertaEvent(mesaId, servicio.id, camareroId, servicio.horaApertura),
      );

      return {
        idServicio: servicio.id,
        hora: servicio.horaApertura,
        mesaEstado: 'ocupada',
      };
    });
  }

  /**
   * Abrir servicio de barra (RN-031: sin mesa)
   */
  async abrirServicioBarra(camareroId: string) {
    const servicio = await this.prisma.servicio.create({
      data: { camareroId, comensales: 1, mesaId: null },
    });
    return { idServicio: servicio.id };
  }

  /**
   * SAL-003: Mover servicio activo a otra mesa libre
   * PRE: servicio abierto, mesa destino libre y sin servicio activo
   * POST: servicio → mesa destino ocupada; mesa origen → libre
   */
  async moverServicio(params: { servicioId: string; mesaDestinoId: string }) {
    const { servicioId, mesaDestinoId } = params;

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const servicio = await tx.servicio.findUniqueOrThrow({
        where: { id: servicioId },
        include: { mesa: true },
      });

      if (!servicio.abierto) {
        throw new BadRequestException('SAL-003: El servicio no está activo.');
      }

      if (servicio.mesaId === mesaDestinoId) {
        throw new BadRequestException('SAL-003: La mesa destino es la misma que la actual.');
      }

      const mesaDestino = await tx.mesa.findUniqueOrThrow({ where: { id: mesaDestinoId } });

      if (mesaDestino.estado !== 'libre') {
        throw new BadRequestException(
          `SAL-003: Mesa ${mesaDestino.numero} no está libre (estado: ${mesaDestino.estado}).`,
        );
      }

      const conflicto = await tx.servicio.findFirst({
        where: { mesaId: mesaDestinoId, abierto: true },
      });
      if (conflicto) {
        throw new BadRequestException(
          `SAL-003: La mesa ${mesaDestino.numero} ya tiene un servicio activo.`,
        );
      }

      const mesaOrigenId = servicio.mesaId;
      const estadoOrigen = servicio.mesa?.estado ?? 'ocupada';

      await Promise.all([
        tx.servicio.update({ where: { id: servicioId }, data: { mesaId: mesaDestinoId } }),
        tx.mesa.update({ where: { id: mesaDestinoId }, data: { estado: estadoOrigen } }),
        mesaOrigenId
          ? tx.mesa.update({ where: { id: mesaOrigenId }, data: { estado: 'libre' } })
          : Promise.resolve(),
      ]);

      this.logger.log(
        `SAL-003 OK: Servicio ${servicioId} movido de mesa ${servicio.mesa?.numero ?? 'barra'} → mesa ${mesaDestino.numero}`,
      );

      return { ok: true, mesaDestino: mesaDestino.numero };
    });
  }

  /**
   * SAL-004: Unir dos mesas — mover todas las comandas de origen a destino
   * PRE: ambos servicios activos y distintos
   * POST: comandas de origen → destino; servicio origen cerrado; mesa origen → libre
   */
  async unirServicios(params: { servicioOrigenId: string; servicioDestinoId: string }) {
    const { servicioOrigenId, servicioDestinoId } = params;

    if (servicioOrigenId === servicioDestinoId) {
      throw new BadRequestException('SAL-004: Los servicios deben ser distintos.');
    }

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const origen = await tx.servicio.findUniqueOrThrow({
        where: { id: servicioOrigenId },
        include: { mesa: true },
      });
      const destino = await tx.servicio.findUniqueOrThrow({
        where: { id: servicioDestinoId },
        include: { mesa: true },
      });

      if (!origen.abierto || !destino.abierto) {
        throw new BadRequestException('SAL-004: Ambos servicios deben estar activos.');
      }

      // Mover todas las comandas del origen al destino
      await tx.comanda.updateMany({
        where: { servicioId: servicioOrigenId },
        data: { servicioId: servicioDestinoId },
      });

      // Cerrar servicio origen
      await tx.servicio.update({
        where: { id: servicioOrigenId },
        data: { abierto: false, horaCierre: new Date() },
      });

      // Liberar mesa origen
      if (origen.mesaId) {
        await tx.mesa.update({ where: { id: origen.mesaId }, data: { estado: 'libre' } });
      }

      this.logger.log(
        `SAL-004 OK: Mesas ${origen.mesa?.numero ?? 'barra'} unidas con ${destino.mesa?.numero ?? 'barra'} → servicio ${servicioDestinoId}`,
      );

      return { ok: true, servicioId: servicioDestinoId };
    });
  }

  /**
   * Liberar mesa (llamado tras cobro completo)
   */
  async liberarMesa(mesaId: string) {
    await this.prisma.mesa.update({
      where: { id: mesaId },
      data: { estado: 'libre' },
    });
  }

  /**
   * Consultar mapa de sala
   */
  async obtenerMapaSala(establecimientoId: string) {
    return this.prisma.zona.findMany({
      where: { establecimientoId, activa: true },
      select: {
        id: true,
        nombre: true,
        mesas: {
          where: { activa: true },
          orderBy: { numero: 'asc' },
          select: {
            id: true,
            numero: true,
            capacidad: true,
            estado: true,
            servicios: {
              where: { abierto: true },
              select: { id: true, abierto: true },
            },
          },
        },
      },
    });
  }
}
