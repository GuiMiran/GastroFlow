import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { Subject } from 'rxjs';
import {
  ComandaRegistradaEvent,
  PlatoListoEvent,
} from '../../../common/events/domain-events';

export interface KdsComanda {
  comandaId: string;
  numero: number;
  mesa: string | null;
  destino: string | null;
  horaEntrada: Date;
  lineas: Array<{
    lineaId: string;
    producto: string;
    cantidad: number;
    modificadores: string[];
    estado: string;
  }>;
}

/**
 * HU-M1-CMD-003: KDS Cocina — Pantalla de cocina en tiempo real
 * HU-M1-CMD-004: KDS Barra — Pantalla de barra
 *
 * Usa Server-Sent Events (SSE) para push en tiempo real.
 * EVT-002 (ComandaRegistrada) → nueva comanda en pantalla
 * Marcar plato listo → EVT-003 (PlatoListo)
 */
@Injectable()
export class KdsService {
  private readonly logger = new Logger(KdsService.name);

  /** Stream SSE para pantallas KDS */
  private readonly kdsStream$ = new Subject<{ type: string; data: unknown }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Observable para suscripción SSE */
  getStream() {
    return this.kdsStream$.asObservable();
  }

  /**
   * EVT-002 → Notificar pantallas KDS de nueva comanda
   */
  @OnEvent(ComandaRegistradaEvent.event)
  async onComandaRegistrada(event: ComandaRegistradaEvent) {
    const comanda = await this.prisma.comanda.findUniqueOrThrow({
      where: { id: event.idComanda },
      include: {
        servicio: { include: { mesa: true } },
        lineas: {
          where: { anulada: false },
          include: { producto: true, modificadores: true },
        },
      },
    });

    const kdsData: KdsComanda = {
      comandaId: comanda.id,
      numero: comanda.numero,
      mesa: comanda.servicio.mesa?.numero?.toString() ?? 'Barra',
      destino: comanda.destino,
      horaEntrada: comanda.createdAt,
      lineas: comanda.lineas.map((l) => ({
        lineaId: l.id,
        producto: l.producto.nombre,
        cantidad: l.cantidad,
        modificadores: l.modificadores.map((m) => m.texto),
        estado: 'pendiente',
      })),
    };

    this.kdsStream$.next({ type: 'comanda_nueva', data: kdsData });
    this.logger.log(`KDS: Comanda #${comanda.numero} → ${comanda.destino}`);
  }

  /**
   * Obtener comandas pendientes para KDS filtradas por destino
   * POL-010: COCINA ve solo cocina+ambos, BARRA ve solo barra+ambos
   */
  async obtenerComandasPendientes(destino: 'COCINA' | 'BARRA') {
    const filtroDestino =
      destino === 'COCINA'
        ? { in: ['COCINA', 'AMBOS'] }
        : { in: ['BARRA', 'AMBOS'] };

    const comandas = await this.prisma.comanda.findMany({
      where: {
        estado: { in: ['enviada', 'en_preparacion'] },
        destino: filtroDestino,
      },
      include: {
        servicio: { include: { mesa: true } },
        lineas: {
          where: { anulada: false },
          include: { producto: true, modificadores: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return comandas.map((c) => ({
      comandaId: c.id,
      numero: c.numero,
      mesa: c.servicio.mesa?.numero?.toString() ?? 'Barra',
      destino: c.destino,
      horaEntrada: c.createdAt,
      estado: c.estado,
      lineas: c.lineas.map((l) => ({
        lineaId: l.id,
        producto: l.producto.nombre,
        cantidad: l.cantidad,
        modificadores: l.modificadores.map((m) => m.texto),
      })),
    }));
  }

  /**
   * Marcar plato como listo → EVT-003 PlatoListoEvent
   * AC-02: El camarero recibe notificación de plato listo para servir
   */
  async marcarPlatoListo(lineaId: string) {
    const linea = await this.prisma.lineaComanda.findUniqueOrThrow({
      where: { id: lineaId },
      include: { comanda: { include: { servicio: { include: { mesa: true } } } } },
    });

    if (linea.anulada) {
      throw new BadRequestException('La línea está anulada.');
    }

    // Notificar via SSE
    const mesaNumero = linea.comanda.servicio.mesa?.numero?.toString() ?? 'Barra';
    this.kdsStream$.next({
      type: 'plato_listo',
      data: { lineaId, comandaId: linea.comandaId, mesa: mesaNumero },
    });

    // EVT-003: PlatoListo
    this.eventEmitter.emit(
      PlatoListoEvent.event,
      new PlatoListoEvent(lineaId, linea.comanda.servicio.mesaId ?? 'barra', new Date()),
    );

    // Si todas las líneas están listas → comanda lista
    await this.verificarComandaCompleta(linea.comandaId);

    this.logger.log(`KDS: Plato listo → línea ${lineaId}, mesa ${mesaNumero}`);
    return { ok: true };
  }

  /**
   * Marcar toda la comanda como lista de golpe
   */
  async marcarComandaLista(comandaId: string) {
    await this.prisma.comanda.update({
      where: { id: comandaId },
      data: { estado: 'lista' },
    });

    const comanda = await this.prisma.comanda.findUniqueOrThrow({
      where: { id: comandaId },
      include: { servicio: { include: { mesa: true } } },
    });

    this.kdsStream$.next({
      type: 'comanda_lista',
      data: {
        comandaId,
        mesa: comanda.servicio.mesa?.numero?.toString() ?? 'Barra',
      },
    });

    this.logger.log(`KDS: Comanda ${comandaId} marcada como lista`);
    return { ok: true };
  }

  private async verificarComandaCompleta(comandaId: string) {
    // Actualizar estado comanda a 'en_preparacion' si estaba 'enviada'
    const comanda = await this.prisma.comanda.findUniqueOrThrow({
      where: { id: comandaId },
    });

    if (comanda.estado === 'enviada') {
      await this.prisma.comanda.update({
        where: { id: comandaId },
        data: { estado: 'en_preparacion' },
      });
    }
  }
}
