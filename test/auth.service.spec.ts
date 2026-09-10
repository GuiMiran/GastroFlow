/**
 * M0-PLATFORM — Tests unitarios de AuthService y EmpleadoService
 *
 * Cubre:
 *   HU-M0-ROL-001: PIN login (bloqueo tras 3 fallos, 60s)
 *   HU-M0-ROL-002: Email/password login (bloqueo tras 5 fallos, 15min)
 *   HU-M0-ROL-003: Gestión empleados (RBAC, baja con servicios activos)
 *   HU-M0-ROL-002 AC-02: Contraseña mínimo 8 chars
 */
import { BadRequestException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/modules/auth/auth.service';
import { EmpleadoService } from '../src/modules/empleado/empleado.service';
import { RolEmpleado } from '../src/modules/auth/auth.types';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  empleado: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
} as unknown as PrismaService;

const mockJwt = {
  sign: jest.fn().mockReturnValue('jwt-token'),
  verify: jest.fn(),
} as unknown as JwtService;

// ─── AuthService ──────────────────────────────────────────────────────────────

describe('AuthService — loginPin (HU-M0-ROL-001)', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockPrisma, mockJwt);
    jest.clearAllMocks();
  });

  it('devuelve token si PIN es correcto', async () => {
    const pinHash = await bcrypt.hash('1234', 10);
    (mockPrisma.empleado.findMany as jest.Mock).mockResolvedValue([
      { id: 'emp-1', nombre: 'Carlos', rol: 'CAMARERO', pinHash },
    ]);

    const result = await service.loginPin('est-1', '1234');

    expect(result.accessToken).toBe('jwt-token');
    expect(result.empleadoId).toBe('emp-1');
    expect(result.rol).toBe('CAMARERO');
  });

  it('lanza UnauthorizedException si PIN incorrecto', async () => {
    const pinHash = await bcrypt.hash('9999', 10);
    (mockPrisma.empleado.findMany as jest.Mock).mockResolvedValue([
      { id: 'emp-1', nombre: 'Carlos', rol: 'CAMARERO', pinHash },
    ]);

    await expect(service.loginPin('est-1', '1234')).rejects.toThrow(UnauthorizedException);
  });

  it('bloquea tras 3 fallos consecutivos (AC-03 HU-M0-ROL-001)', async () => {
    (mockPrisma.empleado.findMany as jest.Mock).mockResolvedValue([
      { id: 'emp-1', nombre: 'Carlos', rol: 'CAMARERO', pinHash: await bcrypt.hash('9999', 10) },
    ]);

    // 3 intentos fallidos
    for (let i = 0; i < 3; i++) {
      await expect(service.loginPin('est-1', '1234')).rejects.toThrow(UnauthorizedException);
    }

    // El 4º debe lanzar error de bloqueo
    await expect(service.loginPin('est-1', '1234')).rejects.toThrow(
      /Demasiados intentos fallidos/,
    );
  });

  it('devuelve JWT con establecimientoId correcto', async () => {
    const pinHash = await bcrypt.hash('5678', 10);
    (mockPrisma.empleado.findMany as jest.Mock).mockResolvedValue([
      { id: 'emp-2', nombre: 'Ana', rol: 'CAJERO', pinHash },
    ]);

    const result = await service.loginPin('est-42', '5678');
    expect(result.establecimientoId).toBe('est-42');
    expect(mockJwt.sign).toHaveBeenCalledWith(
      expect.objectContaining({ establecimientoId: 'est-42', rol: 'CAJERO' }),
    );
  });
});

describe('AuthService — loginPassword (HU-M0-ROL-002)', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockPrisma, mockJwt);
    jest.clearAllMocks();
  });

  it('devuelve token si credenciales correctas', async () => {
    const passwordHash = await bcrypt.hash('Segura123!', 10);
    (mockPrisma.empleado.findUnique as jest.Mock).mockResolvedValue({
      id: 'emp-10',
      nombre: 'Gerente',
      rol: RolEmpleado.GERENTE,
      passwordHash,
      activo: true,
      establecimientoId: 'est-1',
    });

    const result = await service.loginPassword('gerente@rest.es', 'Segura123!');
    expect(result.rol).toBe(RolEmpleado.GERENTE);
    expect(result.accessToken).toBe('jwt-token');
  });

  it('lanza UnauthorizedException si contraseña incorrecta', async () => {
    const passwordHash = await bcrypt.hash('Correcta!', 10);
    (mockPrisma.empleado.findUnique as jest.Mock).mockResolvedValue({
      id: 'emp-10',
      nombre: 'Gerente',
      rol: 'GERENTE',
      passwordHash,
      activo: true,
      establecimientoId: 'est-1',
    });

    await expect(service.loginPassword('gerente@rest.es', 'Incorrecta!')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('lanza UnauthorizedException si empleado no existe', async () => {
    (mockPrisma.empleado.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(service.loginPassword('fake@rest.es', 'paso1234')).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('bloquea tras 5 fallos consecutivos (AC-03 HU-M0-ROL-002)', async () => {
    const passwordHash = await bcrypt.hash('Correcta!', 10);
    (mockPrisma.empleado.findUnique as jest.Mock).mockResolvedValue({
      id: 'emp-10',
      nombre: 'Gerente',
      rol: 'GERENTE',
      passwordHash,
      activo: true,
      establecimientoId: 'est-1',
    });

    for (let i = 0; i < 5; i++) {
      await expect(service.loginPassword('gerente@rest.es', 'Mal!')).rejects.toThrow(
        UnauthorizedException,
      );
    }

    await expect(service.loginPassword('gerente@rest.es', 'Mal!')).rejects.toThrow(
      /Demasiados intentos fallidos/,
    );
  });
});

describe('AuthService — hashPassword (HU-M0-ROL-002 AC-02)', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(mockPrisma, mockJwt);
  });

  it('rechaaza contraseñas menores de 8 caracteres', async () => {
    await expect(service.hashPassword('short')).rejects.toThrow(/8 caracteres/);
  });

  it('acepta contraseñas de 8+ caracteres', async () => {
    const hash = await service.hashPassword('Valida1!');
    expect(hash).toBeTruthy();
    expect(hash).not.toBe('Valida1!');
  });
});

// ─── EmpleadoService ──────────────────────────────────────────────────────────

describe('EmpleadoService — crear empleado (HU-M0-ROL-003)', () => {
  let service: EmpleadoService;
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma, mockJwt);
    service = new EmpleadoService(mockPrisma, authService);
    jest.clearAllMocks();
  });

  it('crea empleado correctamente con PIN', async () => {
    (mockPrisma.empleado.create as jest.Mock).mockResolvedValue({
      id: 'emp-new',
      nombre: 'Luis',
      rol: 'CAMARERO',
    });
    (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const result = await service.crear(
      'est-1',
      { nombre: 'Luis', apellidos: 'García', nif: '12345678A', puesto: 'camarero', rol: RolEmpleado.CAMARERO, pin: '1234' },
      'emp-admin',
      RolEmpleado.ADMIN,
    );

    expect(result.id).toBe('emp-new');
    expect(mockPrisma.empleado.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ rol: 'CAMARERO', pinHash: expect.stringContaining('$2b$') }),
      }),
    );
  });

  it('lanza BadRequestException si PIN no tiene 4 dígitos (AC-01)', async () => {
    await expect(
      service.crear(
        'est-1',
        { nombre: 'Luis', apellidos: 'García', nif: '12345678A', puesto: 'camarero', rol: RolEmpleado.CAMARERO, pin: '12' },
        'emp-admin',
        RolEmpleado.ADMIN,
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('AC-05: GERENTE no puede crear empleados ADMIN', async () => {
    await expect(
      service.crear(
        'est-1',
        { nombre: 'Super', apellidos: 'User', nif: '99999999Z', puesto: 'admin', rol: RolEmpleado.ADMIN },
        'emp-gerente',
        RolEmpleado.GERENTE,
      ),
    ).rejects.toThrow(ForbiddenException);
  });
});

describe('EmpleadoService — baja empleado (HU-M0-ROL-003 AC-03)', () => {
  let service: EmpleadoService;
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma, mockJwt);
    service = new EmpleadoService(mockPrisma, authService);
    jest.clearAllMocks();
  });

  it('bloquea baja si empleado tiene servicios activos', async () => {
    (mockPrisma.empleado.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'emp-1',
      nombre: 'Ana',
      establecimientoId: 'est-1',
      servicios: [{ id: 'svc-1' }], // activos
    });

    await expect(service.darDeBaja('emp-1', 'emp-admin')).rejects.toThrow(BadRequestException);
  });

  it('da de baja si no hay servicios activos', async () => {
    (mockPrisma.empleado.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'emp-1',
      nombre: 'Ana',
      establecimientoId: 'est-1',
      servicios: [], // ninguno activo
    });
    (mockPrisma.empleado.update as jest.Mock).mockResolvedValue({ id: 'emp-1', activo: false });
    (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const result = await service.darDeBaja('emp-1', 'emp-admin');
    expect(result.activo).toBe(false);
  });
});

describe('EmpleadoService — actualizar rol (HU-M0-ROL-003 AC-05)', () => {
  let service: EmpleadoService;
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService(mockPrisma, mockJwt);
    service = new EmpleadoService(mockPrisma, authService);
    jest.clearAllMocks();
  });

  it('GERENTE no puede modificar un ADMIN', async () => {
    (mockPrisma.empleado.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'emp-admin',
      rol: RolEmpleado.ADMIN,
      establecimientoId: 'est-1',
      pinHash: null,
      passwordHash: null,
    });

    await expect(
      service.actualizar('emp-admin', { rol: RolEmpleado.GERENTE }, 'emp-gerente', RolEmpleado.GERENTE),
    ).rejects.toThrow(ForbiddenException);
  });

  it('ADMIN puede cambiar rol de cualquier empleado', async () => {
    (mockPrisma.empleado.findUniqueOrThrow as jest.Mock).mockResolvedValue({
      id: 'emp-1',
      rol: RolEmpleado.CAMARERO,
      establecimientoId: 'est-1',
      pinHash: null,
      passwordHash: null,
    });
    (mockPrisma.empleado.update as jest.Mock).mockResolvedValue({
      id: 'emp-1',
      rol: RolEmpleado.CAJERO,
    });
    (mockPrisma.auditLog.create as jest.Mock).mockResolvedValue({});

    const result = await service.actualizar(
      'emp-1',
      { rol: RolEmpleado.CAJERO },
      'emp-admin',
      RolEmpleado.ADMIN,
    );
    expect(result.rol).toBe(RolEmpleado.CAJERO);
  });
});
