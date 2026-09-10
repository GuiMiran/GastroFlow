/**
 * M0-PLATFORM — AuthService
 * Autenticación por PIN (sala) y email/password (backoffice).
 * Genera JWT de 24h. (HU-M0-ROL-001, HU-M0-ROL-002)
 */
import {
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { JwtPayload, LoginResponse, RolEmpleado } from './auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  /** Contadores de intentos fallidos en memoria (para bloqueo temporal sin Redis) */
  private readonly pinFailures = new Map<string, { count: number; until?: Date }>();
  private readonly passFailures = new Map<string, { count: number; until?: Date }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ── PIN Login (HU-M0-ROL-001) ──────────────────────────────────────────────

  async loginPin(
    establecimientoId: string,
    pin: string,
  ): Promise<LoginResponse> {
    const lockKey = `pin:${establecimientoId}:${pin.slice(0, 1)}`; // por establecimiento+primer dígito para no revelar empleado
    this.checkLock(this.pinFailures, lockKey, 3, 60);

    const empleados = await this.prisma.empleado.findMany({
      where: { establecimientoId, activo: true, pinHash: { not: null } },
      select: { id: true, nombre: true, rol: true, pinHash: true },
    });

    for (const emp of empleados) {
      if (emp.pinHash && await bcrypt.compare(pin, emp.pinHash)) {
        this.pinFailures.delete(lockKey);
        this.logger.log(`M0-ROL-001 OK: PIN login empleado ${emp.id} (${emp.rol})`);
        return this.buildResponse(emp.id, emp.nombre, emp.rol as RolEmpleado, establecimientoId);
      }
    }

    this.registerFailure(this.pinFailures, lockKey, 3, 60);
    throw new UnauthorizedException('PIN incorrecto');
  }

  // ── Email/Password Login (HU-M0-ROL-002) ───────────────────────────────────

  async loginPassword(
    emailLogin: string,
    password: string,
  ): Promise<LoginResponse> {
    const lockKey = `pass:${emailLogin}`;
    this.checkLock(this.passFailures, lockKey, 5, 15 * 60);

    const emp = await this.prisma.empleado.findUnique({
      where: { emailLogin },
      select: {
        id: true,
        nombre: true,
        rol: true,
        passwordHash: true,
        activo: true,
        establecimientoId: true,
      },
    });

    if (!emp || !emp.activo || !emp.passwordHash) {
      this.registerFailure(this.passFailures, lockKey, 5, 15 * 60);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const ok = await bcrypt.compare(password, emp.passwordHash);
    if (!ok) {
      this.registerFailure(this.passFailures, lockKey, 5, 15 * 60);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    this.passFailures.delete(lockKey);
    this.logger.log(`M0-ROL-002 OK: Password login empleado ${emp.id} (${emp.rol})`);
    return this.buildResponse(emp.id, emp.nombre, emp.rol as RolEmpleado, emp.establecimientoId);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private buildResponse(
    empleadoId: string,
    nombre: string,
    rol: RolEmpleado,
    establecimientoId: string,
  ): LoginResponse {
    const payload: JwtPayload = { sub: empleadoId, establecimientoId, rol, nombre };
    return {
      accessToken: this.jwt.sign(payload),
      empleadoId,
      nombre,
      rol,
      establecimientoId,
    };
  }

  private checkLock(
    map: Map<string, { count: number; until?: Date }>,
    key: string,
    max: number,
    lockSeconds: number,
  ): void {
    const entry = map.get(key);
    if (!entry) return;
    if (entry.count >= max && entry.until && entry.until > new Date()) {
      const secsLeft = Math.ceil((entry.until.getTime() - Date.now()) / 1000);
      throw new UnauthorizedException(
        `Demasiados intentos fallidos. Reintenta en ${secsLeft}s`,
      );
    }
    if (entry.until && entry.until <= new Date()) {
      map.delete(key); // bloqueo expirado
    }
  }

  private registerFailure(
    map: Map<string, { count: number; until?: Date }>,
    key: string,
    max: number,
    lockSeconds: number,
  ): void {
    const entry = map.get(key) ?? { count: 0 };
    entry.count += 1;
    if (entry.count >= max) {
      entry.until = new Date(Date.now() + lockSeconds * 1000);
    }
    map.set(key, entry);
  }

  // ── Utilidad: hashear PIN o password ───────────────────────────────────────

  async hashPin(pin: string): Promise<string> {
    return bcrypt.hash(pin, 10);
  }

  async hashPassword(password: string): Promise<string> {
    if (password.length < 8) {
      throw new Error('La contraseña debe tener al menos 8 caracteres (AC-02 M0-ROL-002)');
    }
    return bcrypt.hash(password, 10);
  }
}
