/**
 * CajaService — Tests unitarios (L2 mock)
 *
 * Cubre:
 *   OP-010 (abrirTurno) — INV-015, INV-016, EVT-010
 *   OP-012 (registrarMovimiento) — EVT-013
 *   OP-011 / SK-009 (cerrarTurno) — RN-040, EVT-011, EVT-012
 */
import { BadRequestException } from '@nestjs/common';
import { CajaService } from '../src/modules/tpv/services/caja.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

const BASE_TURNO = {
  id: 'turno-1',
  cajaId: 'caja-1',
  cajeroId: 'emp-1',
  fondoCaja: 200,
  abierto: true,
  horaApertura: new Date('2026-03-15T09:00:00Z'),
  caja: { establecimientoId: 'estab-1' },
};

function buildMocks() {
  const mockTx: Record<string, any> = {
    turnoCaja: {
      findFirst: jest.fn(),
      findUniqueOrThrow: jest.fn().mockResolvedValue(BASE_TURNO),
      create: jest.fn().mockResolvedValue({ ...BASE_TURNO }),
      update: jest.fn(),
    },
    movimientoCaja: {
      create: jest.fn().mockResolvedValue({ id: 'mov-1' }),
      aggregate: jest.fn().mockResolvedValue({ _sum: { importe: 0 } }),
    },
    cobro: {
      aggregate: jest.fn().mockResolvedValue({ _sum: { importe: null } }),
    },
  };

  const mockPrisma = {
    $transaction: jest.fn((fn: any) => fn(mockTx)),
    turnoCaja: { findFirst: jest.fn() },
  } as unknown as PrismaService;

  const mockEventEmitter = { emit: jest.fn() } as any;

  return { mockTx, mockPrisma, mockEventEmitter };
}

// ─── Suite ───────────────────────────────────────────────────
describe('CajaService', () => {
  let service: CajaService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    service = new CajaService(mocks.mockPrisma, mocks.mockEventEmitter);
  });

  // ──────────────────────────────────────────────────
  // abrirTurno()
  // ──────────────────────────────────────────────────
  describe('abrirTurno()', () => {
    it('INV-015: rechaza fondo de apertura negativo', async () => {
      await expect(
        service.abrirTurno({ cajaId: 'caja-1', empleadoId: 'emp-1', fondoApertura: -10 }),
      ).rejects.toThrow('INV-015: fondo_apertura debe ser ≥ 0.');
    });

    it('INV-016: rechaza si ya hay un turno abierto', async () => {
      mocks.mockTx.turnoCaja.findFirst.mockResolvedValue({ id: 'turno-existente', abierto: true });

      await expect(
        service.abrirTurno({ cajaId: 'caja-1', empleadoId: 'emp-1', fondoApertura: 100 }),
      ).rejects.toThrow('INV-016: Ya hay un turno abierto en esta caja.');
    });

    it('OP-010: abre turno con fondo=0 (límite INV-015)', async () => {
      mocks.mockTx.turnoCaja.findFirst.mockResolvedValue(null);

      const res = await service.abrirTurno({ cajaId: 'caja-1', empleadoId: 'emp-1', fondoApertura: 0 });

      expect(res.id).toBe('turno-1');
    });

    it('OP-010: abre turno correctamente y emite TurnoCajaAbiertoEvent', async () => {
      mocks.mockTx.turnoCaja.findFirst.mockResolvedValue(null);

      await service.abrirTurno({ cajaId: 'caja-1', empleadoId: 'emp-1', fondoApertura: 200 });

      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith('turno.caja.abierto', expect.anything());
    });
  });

  // ──────────────────────────────────────────────────
  // registrarMovimiento()
  // ──────────────────────────────────────────────────
  describe('registrarMovimiento()', () => {
    it('rechaza importe ≤ 0', async () => {
      await expect(
        service.registrarMovimiento({
          turnoCajaId: 'turno-1',
          tipo: 'salida',
          importe: 0,
          concepto: 'Test',
          empleadoId: 'emp-1',
        }),
      ).rejects.toThrow('Importe debe ser > 0.');
    });

    it('rechaza si el turno está cerrado', async () => {
      mocks.mockTx.turnoCaja.findUniqueOrThrow.mockResolvedValue({ ...BASE_TURNO, abierto: false });

      await expect(
        service.registrarMovimiento({
          turnoCajaId: 'turno-1',
          tipo: 'salida',
          importe: 50,
          concepto: 'Retirada a caja fuerte',
          empleadoId: 'emp-1',
        }),
      ).rejects.toThrow('El turno de caja está cerrado.');
    });

    it('OP-012: registra entrada y emite MovimientoCajaRegistradoEvent', async () => {
      const res = await service.registrarMovimiento({
        turnoCajaId: 'turno-1',
        tipo: 'entrada',
        importe: 100,
        concepto: 'Provisión de cambio',
        empleadoId: 'emp-1',
      });

      expect(res.id).toBe('mov-1');
      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith('movimiento.caja.registrado', expect.anything());
    });
  });

  // ──────────────────────────────────────────────────
  // cerrarTurno()
  // ──────────────────────────────────────────────────
  describe('cerrarTurno()', () => {
    it('OP-011: rechaza si el turno ya está cerrado', async () => {
      mocks.mockTx.turnoCaja.findUniqueOrThrow.mockResolvedValue({ ...BASE_TURNO, abierto: false });

      await expect(
        service.cerrarTurno({ turnoCajaId: 'turno-1', contadoEfectivo: 250, empleadoId: 'emp-1' }),
      ).rejects.toThrow('OP-011 ERROR: Turno ya cerrado.');
    });

    it('RN-040: diferencia = contado - esperado (cero si cuadra)', async () => {
      // fondo=200, cobros=50, movimientos=0 → esperado=250
      mocks.mockTx.cobro.aggregate.mockResolvedValue({ _sum: { importe: 50 } });
      mocks.mockTx.movimientoCaja.aggregate.mockResolvedValue({ _sum: { importe: 0 } });

      const res = await service.cerrarTurno({
        turnoCajaId: 'turno-1',
        contadoEfectivo: 250,
        empleadoId: 'emp-1',
      });

      expect(res.esperado).toBe(250);
      expect(res.contadoEfectivo).toBe(250);
      expect(res.diferencia).toBe(0);
    });

    it('RN-040: diferencia negativa cuando falta efectivo', async () => {
      // fondo=200, cobros=50, movimientos=0 → esperado=250, contado=246 → diferencia=-4
      mocks.mockTx.cobro.aggregate.mockResolvedValue({ _sum: { importe: 50 } });
      mocks.mockTx.movimientoCaja.aggregate.mockResolvedValue({ _sum: { importe: 0 } });

      const res = await service.cerrarTurno({
        turnoCajaId: 'turno-1',
        contadoEfectivo: 246,
        empleadoId: 'emp-1',
      });

      expect(res.diferencia).toBe(-4);
    });

    it('OP-011: emite TurnoCajaCerradoEvent siempre al cerrar', async () => {
      mocks.mockTx.cobro.aggregate.mockResolvedValue({ _sum: { importe: 0 } });
      mocks.mockTx.movimientoCaja.aggregate.mockResolvedValue({ _sum: { importe: 0 } });

      await service.cerrarTurno({ turnoCajaId: 'turno-1', contadoEfectivo: 200, empleadoId: 'emp-1' });

      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith('turno.caja.cerrado', expect.anything());
    });

    it('SK-009: emite ArqueoCajaRealizadoEvent solo cuando hay descuadre > 0.01€', async () => {
      mocks.mockTx.cobro.aggregate.mockResolvedValue({ _sum: { importe: 50 } });
      mocks.mockTx.movimientoCaja.aggregate.mockResolvedValue({ _sum: { importe: 0 } });

      // Diferencia = 246 - 250 = -4 → debe emitir arqueoCajaRealizadoEvent
      await service.cerrarTurno({ turnoCajaId: 'turno-1', contadoEfectivo: 246, empleadoId: 'emp-1' });

      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith('arqueo.caja.realizado', expect.anything());
    });

    it('SK-009: NO emite ArqueoCajaRealizadoEvent cuando cuadra exactamente', async () => {
      mocks.mockTx.cobro.aggregate.mockResolvedValue({ _sum: { importe: 0 } });
      mocks.mockTx.movimientoCaja.aggregate.mockResolvedValue({ _sum: { importe: 0 } });

      // fondo=200, contado=200 → diferencia=0 → no arqueoCajaRealizadoEvent
      await service.cerrarTurno({ turnoCajaId: 'turno-1', contadoEfectivo: 200, empleadoId: 'emp-1' });

      const emitCalls = (mocks.mockEventEmitter.emit as jest.Mock).mock.calls;
      const arqueoEmitido = emitCalls.some(([ev]) => ev === 'arqueo.caja.realizado');
      expect(arqueoEmitido).toBe(false);
    });

    it('RSN-040: retirada de caja reduce el esperado', async () => {
      // fondo=200, cobros=50, retirada=-30 → esperado=220
      mocks.mockTx.cobro.aggregate.mockResolvedValue({ _sum: { importe: 50 } });
      mocks.mockTx.movimientoCaja.aggregate.mockResolvedValue({ _sum: { importe: -30 } });

      const res = await service.cerrarTurno({
        turnoCajaId: 'turno-1',
        contadoEfectivo: 218,
        empleadoId: 'emp-1',
      });

      expect(res.esperado).toBe(220);
      expect(res.diferencia).toBe(-2);
    });
  });
});
