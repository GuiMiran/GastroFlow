import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  EmpleadoFichoEvent,
  ConflictoTurnoDetectadoEvent,
} from '../../common/events/domain-events';

/**
 * HU-M2-RRH-001: Alta de empleados
 * HU-M2-RRH-002: Cuadrantes de turnos
 * HU-M2-RRH-003: Fichaje entrada/salida
 *
 * SK-030: generar_cuadrante_semanal
 * RN-036: RD 8/2019 registro jornada obligatorio
 * INV-020 (RRHH): un empleado no puede tener dos turnos solapados
 * EVT-040: EmpleadoFicho
 * EVT-041: ConflictoTurnoDetectado
 */
@Injectable()
export class RrhhService {
  private readonly logger = new Logger(RrhhService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ─── HU-M2-RRH-001: Empleados ───

  async crearEmpleado(params: {
    establecimientoId: string;
    nombre: string;
    apellidos: string;
    nif: string;
    email?: string;
    telefono?: string;
    puesto: string;
  }) {
    const empleado = await this.prisma.empleado.create({
      data: {
        establecimientoId: params.establecimientoId,
        nombre: params.nombre,
        apellidos: params.apellidos,
        nif: params.nif,
        email: params.email,
        telefono: params.telefono,
        puesto: params.puesto,
      },
    });
    this.logger.log(`RRH-001 OK: Empleado "${params.nombre} ${params.apellidos}" creado`);
    return empleado;
  }

  async actualizarEmpleado(
    empleadoId: string,
    data: {
      nombre?: string;
      apellidos?: string;
      email?: string;
      telefono?: string;
      puesto?: string;
      activo?: boolean;
    },
  ) {
    return this.prisma.empleado.update({
      where: { id: empleadoId },
      data,
    });
  }

  async listarEmpleados(establecimientoId: string) {
    return this.prisma.empleado.findMany({
      where: { establecimientoId, activo: true },
      orderBy: { nombre: 'asc' },
    });
  }

  async obtenerEmpleado(empleadoId: string) {
    return this.prisma.empleado.findUniqueOrThrow({
      where: { id: empleadoId },
      include: {
        turnos: {
          where: { fecha: { gte: new Date() } },
          orderBy: { fecha: 'asc' },
          take: 20,
        },
        fichajes: {
          orderBy: { hora: 'desc' },
          take: 10,
        },
      },
    });
  }

  // ─── HU-M2-RRH-002: Cuadrantes de turnos ───

  /**
   * SK-030: generar_cuadrante_semanal
   * INV-020 (RRHH): detectar solapamientos
   * EVT-041: ConflictoTurnoDetectado
   */
  async asignarTurno(params: {
    empleadoId: string;
    fecha: Date;
    horaInicio: Date;
    horaFin: Date;
  }) {
    // Detectar conflictos: ¿el empleado ya tiene turno solapado?
    const conflictos = await this.prisma.turno.findMany({
      where: {
        empleadoId: params.empleadoId,
        fecha: params.fecha,
        OR: [
          {
            horaInicio: { lt: params.horaFin },
            horaFin: { gt: params.horaInicio },
          },
        ],
      },
    });

    if (conflictos.length > 0) {
      this.eventEmitter.emit(
        ConflictoTurnoDetectadoEvent.event,
        new ConflictoTurnoDetectadoEvent(
          params.empleadoId,
          `Solapamiento con turno existente ${conflictos[0].id}`,
        ),
      );
      throw new BadRequestException(
        `Conflicto de turno: el empleado ya tiene turno solapado el ${params.fecha.toISOString().split('T')[0]}.`,
      );
    }

    const turno = await this.prisma.turno.create({
      data: {
        empleadoId: params.empleadoId,
        fecha: params.fecha,
        horaInicio: params.horaInicio,
        horaFin: params.horaFin,
      },
    });

    this.logger.log(`RRH-002 OK: Turno asignado a ${params.empleadoId} el ${params.fecha}`);
    return turno;
  }

  async obtenerCuadrante(params: {
    establecimientoId: string;
    fechaInicio: Date;
    fechaFin: Date;
  }) {
    const empleados = await this.prisma.empleado.findMany({
      where: { establecimientoId: params.establecimientoId, activo: true },
      include: {
        turnos: {
          where: {
            fecha: { gte: params.fechaInicio, lte: params.fechaFin },
          },
          orderBy: { fecha: 'asc' },
        },
      },
      orderBy: { nombre: 'asc' },
    });

    return empleados.map((e) => ({
      empleadoId: e.id,
      nombre: `${e.nombre} ${e.apellidos}`,
      puesto: e.puesto,
      turnos: e.turnos.map((t) => ({
        id: t.id,
        fecha: t.fecha,
        horaInicio: t.horaInicio,
        horaFin: t.horaFin,
      })),
    }));
  }

  // ─── HU-M2-RRH-003: Fichaje entrada/salida ───

  /**
   * RN-036: RD 8/2019 registro jornada obligatorio
   * EVT-040: EmpleadoFicho
   */
  async registrarFichaje(params: { empleadoId: string; tipo: 'entrada' | 'salida' }) {
    const ahora = new Date();

    const fichaje = await this.prisma.fichaje.create({
      data: {
        empleadoId: params.empleadoId,
        tipo: params.tipo,
        hora: ahora,
      },
    });

    this.eventEmitter.emit(
      EmpleadoFichoEvent.event,
      new EmpleadoFichoEvent(params.empleadoId, params.tipo, ahora),
    );

    this.logger.log(`RRH-003 OK: Fichaje ${params.tipo} empleado ${params.empleadoId} a las ${ahora.toISOString()}`);

    // Si es salida, calcular horas trabajadas desde último fichaje entrada
    if (params.tipo === 'salida') {
      const ultimaEntrada = await this.prisma.fichaje.findFirst({
        where: {
          empleadoId: params.empleadoId,
          tipo: 'entrada',
          hora: { lt: ahora },
        },
        orderBy: { hora: 'desc' },
      });

      if (ultimaEntrada) {
        const minutosTrabajados = Math.round(
          (ahora.getTime() - ultimaEntrada.hora.getTime()) / 60000,
        );
        const horas = Math.floor(minutosTrabajados / 60);
        const minutos = minutosTrabajados % 60;
        return {
          ...fichaje,
          horasTrabajadas: `${horas}h ${minutos}min`,
          minutosTrabajados,
        };
      }
    }

    return fichaje;
  }

  async listarFichajes(params: {
    empleadoId: string;
    fechaInicio?: Date;
    fechaFin?: Date;
  }) {
    const where: Prisma.FichajeWhereInput = {
      empleadoId: params.empleadoId,
    };

    if (params.fechaInicio || params.fechaFin) {
      where.hora = {};
      if (params.fechaInicio) where.hora.gte = params.fechaInicio;
      if (params.fechaFin) where.hora.lte = params.fechaFin;
    }

    return this.prisma.fichaje.findMany({
      where,
      orderBy: { hora: 'desc' },
    });
  }
}
