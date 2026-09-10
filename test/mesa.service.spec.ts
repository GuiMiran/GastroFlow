/**
 * MesaService — Tests unitarios
 *
 * Cubre:
 *   SK-001 (abrirMesa) — OP-001, RN-030, INV-010, INV-011, EVT-001
 *   SAL-003 (moverServicio) — precondiciones de mesa libre
 *   SAL-004 (unirServicios) — fusión de comandas
 */
import { BadRequestException } from '@nestjs/common';
import { MesaService } from '../src/modules/tpv/services/mesa.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ─── Mocks ───────────────────────────────────────────────────
const mockTx = {
  mesa: {
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
  servicio: {
    findFirst: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  comanda: {
    updateMany: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn((fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
  servicio: { create: jest.fn() },
  zona: { findMany: jest.fn() },
} as unknown as PrismaService;

const mockEventEmitter = { emit: jest.fn() } as any;

// ─── Suite ───────────────────────────────────────────────────
describe('MesaService', () => {
  let service: MesaService;

  beforeAll(() => {
    service = new MesaService(mockPrisma, mockEventEmitter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    (mockPrisma.$transaction as jest.Mock).mockImplementation(
      (fn: (tx: typeof mockTx) => unknown) => fn(mockTx),
    );
  });

  // ──────────────────────────────────────────────────
  // abrirMesa()
  // ──────────────────────────────────────────────────
  describe('abrirMesa()', () => {
    it('OP-001: rechaza mesa en estado ocupada', async () => {
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({
        id: 'm1',
        numero: 1,
        estado: 'ocupada',
      });

      await expect(
        service.abrirMesa({ mesaId: 'm1', camareroId: 'c1', comensales: 2 }),
      ).rejects.toThrow('OP-001 ERROR');
    });

    it('OP-001: rechaza mesa en estado en_limpieza', async () => {
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({
        id: 'm1',
        numero: 1,
        estado: 'en_limpieza',
      });

      await expect(
        service.abrirMesa({ mesaId: 'm1', camareroId: 'c1', comensales: 2 }),
      ).rejects.toThrow('OP-001 ERROR');
    });

    it('RN-030: rechaza si la mesa ya tiene un servicio activo', async () => {
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm1', numero: 1, estado: 'libre' });
      mockTx.servicio.findFirst.mockResolvedValue({ id: 'svc-existente', abierto: true });

      await expect(
        service.abrirMesa({ mesaId: 'm1', camareroId: 'c1', comensales: 2 }),
      ).rejects.toThrow('RN-030');
    });

    it('SK-001: abre mesa libre y devuelve idServicio + estado ocupada', async () => {
      const horaApertura = new Date('2025-01-15T13:00:00Z');
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm1', numero: 1, estado: 'libre' });
      mockTx.servicio.findFirst.mockResolvedValue(null);
      mockTx.servicio.create.mockResolvedValue({ id: 'svc-nuevo', horaApertura });
      mockTx.mesa.update.mockResolvedValue({});

      const res = await service.abrirMesa({ mesaId: 'm1', camareroId: 'c1', comensales: 3 });

      expect(res.idServicio).toBe('svc-nuevo');
      expect(res.mesaEstado).toBe('ocupada');
      expect(res.hora).toBe(horaApertura);
    });

    it('INV-010: también permite abrir mesa en estado reservada', async () => {
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm2', numero: 2, estado: 'reservada' });
      mockTx.servicio.findFirst.mockResolvedValue(null);
      mockTx.servicio.create.mockResolvedValue({ id: 'svc-2', horaApertura: new Date() });
      mockTx.mesa.update.mockResolvedValue({});

      const res = await service.abrirMesa({ mesaId: 'm2', camareroId: 'c1', comensales: 4 });

      expect(res.idServicio).toBe('svc-2');
    });

    it('EVT-001: emite MesaAbiertaEvent tras abrir mesa', async () => {
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm3', numero: 3, estado: 'libre' });
      mockTx.servicio.findFirst.mockResolvedValue(null);
      mockTx.servicio.create.mockResolvedValue({ id: 'svc-3', horaApertura: new Date() });
      mockTx.mesa.update.mockResolvedValue({});

      await service.abrirMesa({ mesaId: 'm3', camareroId: 'c1', comensales: 2 });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('mesa.abierta', expect.anything());
    });
  });

  // ──────────────────────────────────────────────────
  // moverServicio()
  // ──────────────────────────────────────────────────
  describe('moverServicio()', () => {
    it('SAL-003: rechaza si el servicio no está activo', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({
        id: 'svc-1',
        abierto: false,
        mesaId: 'm1',
        mesa: { numero: 1, estado: 'ocupada' },
      });

      await expect(
        service.moverServicio({ servicioId: 'svc-1', mesaDestinoId: 'm2' }),
      ).rejects.toThrow('SAL-003: El servicio no está activo.');
    });

    it('SAL-003: rechaza si la mesa destino es la misma que la actual', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({
        id: 'svc-1',
        abierto: true,
        mesaId: 'm1',
        mesa: { numero: 1, estado: 'ocupada' },
      });

      await expect(
        service.moverServicio({ servicioId: 'svc-1', mesaDestinoId: 'm1' }),
      ).rejects.toThrow('La mesa destino es la misma');
    });

    it('SAL-003: rechaza si la mesa destino no está libre', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({
        id: 'svc-1',
        abierto: true,
        mesaId: 'm1',
        mesa: { numero: 1, estado: 'ocupada' },
      });
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm2', numero: 2, estado: 'ocupada' });

      await expect(
        service.moverServicio({ servicioId: 'svc-1', mesaDestinoId: 'm2' }),
      ).rejects.toThrow('SAL-003');
    });

    it('SAL-003: rechaza si la mesa destino ya tiene servicio activo', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({
        id: 'svc-1',
        abierto: true,
        mesaId: 'm1',
        mesa: { numero: 1, estado: 'ocupada' },
      });
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm2', numero: 2, estado: 'libre' });
      mockTx.servicio.findFirst.mockResolvedValue({ id: 'svc-conflicto', abierto: true });

      await expect(
        service.moverServicio({ servicioId: 'svc-1', mesaDestinoId: 'm2' }),
      ).rejects.toThrow('SAL-003');
    });

    it('SAL-003: mueve el servicio a la mesa destino libre correctamente', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({
        id: 'svc-1',
        abierto: true,
        mesaId: 'm1',
        mesa: { numero: 1, estado: 'ocupada' },
      });
      mockTx.mesa.findUniqueOrThrow.mockResolvedValue({ id: 'm2', numero: 2, estado: 'libre' });
      mockTx.servicio.findFirst.mockResolvedValue(null);
      mockTx.servicio.update.mockResolvedValue({});
      mockTx.mesa.update.mockResolvedValue({});

      const res = await service.moverServicio({ servicioId: 'svc-1', mesaDestinoId: 'm2' });

      expect(res.ok).toBe(true);
      expect(res.mesaDestino).toBe(2);
    });
  });

  // ──────────────────────────────────────────────────
  // unirServicios()
  // ──────────────────────────────────────────────────
  describe('unirServicios()', () => {
    it('SAL-004: rechaza si origen y destino son el mismo servicio', async () => {
      await expect(
        service.unirServicios({ servicioOrigenId: 'svc-1', servicioDestinoId: 'svc-1' }),
      ).rejects.toThrow('SAL-004');
    });
  });

  describe('obtenerMapaSala()', () => {
    it('carga solo los campos necesarios para pintar el mapa de sala', async () => {
      (mockPrisma.zona.findMany as jest.Mock).mockResolvedValue([]);

      await service.obtenerMapaSala('est-1');

      expect(mockPrisma.zona.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { establecimientoId: 'est-1', activa: true },
        select: expect.objectContaining({
          id: true,
          nombre: true,
          mesas: expect.objectContaining({
            select: expect.objectContaining({
              id: true,
              numero: true,
              capacidad: true,
              estado: true,
              servicios: expect.objectContaining({ select: { id: true, abierto: true } }),
            }),
          }),
        }),
      }));
    });
  });
});
