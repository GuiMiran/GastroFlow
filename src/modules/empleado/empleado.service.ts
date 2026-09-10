/**
 * M0-PLATFORM — EmpleadoService
 * Alta, modificación y baja de empleados con auditoría (HU-M0-ROL-003)
 */
import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { RolEmpleado } from '../auth/auth.types';

export interface CrearEmpleadoDto {
  nombre: string;
  apellidos: string;
  nif: string;
  puesto: string;
  rol: RolEmpleado;
  emailLogin?: string;
  password?: string;  // mínimo 8 chars si se proporciona
  pin?: string;       // exactamente 4 dígitos
  email?: string;
  telefono?: string;
}

export interface ActualizarEmpleadoDto {
  nombre?: string;
  apellidos?: string;
  nif?: string;
  puesto?: string;
  rol?: RolEmpleado;
  emailLogin?: string;
  password?: string;
  pin?: string;
  email?: string;
  telefono?: string;
}

@Injectable()
export class EmpleadoService {
  private readonly logger = new Logger(EmpleadoService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  // ── Crear empleado (HU-M0-ROL-003, AC-01) ─────────────────────────────────

  async crear(
    establecimientoId: string,
    dto: CrearEmpleadoDto,
    actorId: string,
    actorRol: RolEmpleado,
  ) {
    // AC-05: Solo ADMIN puede crear ADMIN
    if (dto.rol === RolEmpleado.ADMIN && actorRol !== RolEmpleado.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede crear empleados con rol ADMIN');
    }

    let pinHash: string | undefined;
    let passwordHash: string | undefined;

    if (dto.pin) {
      if (!/^\d{4}$/.test(dto.pin)) {
        throw new BadRequestException('El PIN debe ser exactamente 4 dígitos');
      }
      pinHash = await this.authService.hashPin(dto.pin);
    }

    if (dto.password) {
      passwordHash = await this.authService.hashPassword(dto.password);
    }

    const empleado = await this.prisma.empleado.create({
      data: {
        establecimientoId,
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        nif: dto.nif,
        puesto: dto.puesto,
        rol: dto.rol,
        emailLogin: dto.emailLogin,
        email: dto.email,
        telefono: dto.telefono,
        pinHash: pinHash ?? null,
        passwordHash: passwordHash ?? null,
      },
    });

    await this.auditoria(establecimientoId, actorId, 'CREATE_EMPLEADO', 'Empleado', empleado.id, {
      rol: dto.rol,
      por: actorId,
    });

    this.logger.log(`M0-ROL-003 OK: Empleado ${empleado.id} creado (${dto.rol}) por ${actorId}`);
    return empleado;
  }

  // ── Actualizar empleado (HU-M0-ROL-003, AC-04) ────────────────────────────

  async actualizar(
    empleadoId: string,
    dto: ActualizarEmpleadoDto,
    actorId: string,
    actorRol: RolEmpleado,
  ) {
    const emp = await this.prisma.empleado.findUniqueOrThrow({
      where: { id: empleadoId },
    });

    // AC-05: GERENTE no puede cambiar rol de un ADMIN
    if (actorRol === RolEmpleado.GERENTE && emp.rol === RolEmpleado.ADMIN) {
      throw new ForbiddenException('GERENTE no puede modificar empleados con rol ADMIN');
    }
    // AC-05: Solo ADMIN puede asignar rol ADMIN
    if (dto.rol === RolEmpleado.ADMIN && actorRol !== RolEmpleado.ADMIN) {
      throw new ForbiddenException('Solo ADMIN puede asignar rol ADMIN');
    }

    let pinHash = emp.pinHash;
    let passwordHash = emp.passwordHash;

    if (dto.pin !== undefined) {
      if (!/^\d{4}$/.test(dto.pin)) {
        throw new BadRequestException('El PIN debe ser exactamente 4 dígitos');
      }
      pinHash = await this.authService.hashPin(dto.pin);
    }
    if (dto.password !== undefined) {
      passwordHash = await this.authService.hashPassword(dto.password);
    }

    const actualizado = await this.prisma.empleado.update({
      where: { id: empleadoId },
      data: {
        nombre: dto.nombre,
        apellidos: dto.apellidos,
        nif: dto.nif,
        puesto: dto.puesto,
        rol: dto.rol,
        emailLogin: dto.emailLogin,
        email: dto.email,
        telefono: dto.telefono,
        pinHash,
        passwordHash,
      },
    });

    if (dto.rol && dto.rol !== emp.rol) {
      await this.auditoria(emp.establecimientoId, actorId, 'UPDATE_ROL', 'Empleado', empleadoId, {
        rolAnterior: emp.rol,
        rolNuevo: dto.rol,
      });
      this.logger.log(`M0-ROL-003 AC-04: Rol empleado ${empleadoId} cambiado ${emp.rol}→${dto.rol} por ${actorId}`);
    }

    return actualizado;
  }

  // ── Dar de baja (HU-M0-ROL-003, AC-03) ────────────────────────────────────

  async darDeBaja(empleadoId: string, actorId: string) {
    const emp = await this.prisma.empleado.findUniqueOrThrow({
      where: { id: empleadoId },
      include: { servicios: { where: { abierto: true } } },
    });

    // AC-03: No se puede dar de baja si tiene servicios activos
    if (emp.servicios.length > 0) {
      throw new BadRequestException(
        `El empleado ${emp.nombre} tiene ${emp.servicios.length} servicio(s) activo(s)`,
      );
    }

    const actualizado = await this.prisma.empleado.update({
      where: { id: empleadoId },
      data: { activo: false, fechaBaja: new Date() },
    });

    await this.auditoria(emp.establecimientoId, actorId, 'BAJA_EMPLEADO', 'Empleado', empleadoId);
    this.logger.log(`M0-ROL-003 OK: Empleado ${empleadoId} dado de baja por ${actorId}`);
    return actualizado;
  }

  // ── Listar empleados ────────────────────────────────────────────────────────

  async listar(establecimientoId: string) {
    return this.prisma.empleado.findMany({
      where: { establecimientoId, activo: true },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        nif: true,
        puesto: true,
        rol: true,
        emailLogin: true,
        email: true,
        telefono: true,
        fechaAlta: true,
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // ── Obtener empleado ────────────────────────────────────────────────────────

  async obtener(empleadoId: string) {
    const emp = await this.prisma.empleado.findUnique({
      where: { id: empleadoId },
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        nif: true,
        puesto: true,
        rol: true,
        emailLogin: true,
        email: true,
        telefono: true,
        activo: true,
        fechaAlta: true,
        fechaBaja: true,
        establecimientoId: true,
      },
    });
    if (!emp) throw new NotFoundException('Empleado no encontrado');
    return emp;
  }

  // ── Auditoría ──────────────────────────────────────────────────────────────

  private async auditoria(
    establecimientoId: string,
    empleadoId: string,
    accion: string,
    entidad?: string,
    entidadId?: string,
    detalle?: object,
  ) {
    await this.prisma.auditLog.create({
      data: { establecimientoId, empleadoId, accion, entidad, entidadId, detalle },
    });
  }
}
