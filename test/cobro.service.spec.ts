/**
 * CobroService — Tests unitarios (L2 mock)
 *
 * Cubre:
 *   SK-005 (cobrarServicio) — OP-004, INV-001, INV-008, INV-014, EVT-004
 *   RN-033 (total > 0), RN-037 (cambio)
 *   INV-010 (mesa→libre tras cobro)
 */
import { BadRequestException } from '@nestjs/common';
import { CobroService } from '../src/modules/tpv/services/cobro.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { VeriFactuService } from '../src/modules/verifactu/verifactu.service';
import { ComandaService } from '../src/modules/tpv/services/comanda.service';

// Importar el real CobroService — rutas relativas correctas desde test/
// La ruta real es src/modules/tpv/services/cobro.service
// => import from '../src/modules/tpv/services/cobro.service'

// ─── Helpers ─────────────────────────────────────────────────

const MOCK_CUENTA = {
  servicioId: 'svc-1',
  lineas: [{ id: 'lc-1', productoNombre: 'Cerveza', cantidad: 2, precioUnitario: 5, subtotal: 10 }],
  desglose: { base4: 0, iva4: 0, base10: 9.09, iva10: 0.91, base21: 0, iva21: 0 },
  totalSinIva: 9.09,
  totalIva: 0.91,
  total: 10.0,
};

const MOCK_SERVICIO = {
  id: 'svc-1',
  abierto: true,
  mesaId: 'm1',
  mesa: { id: 'm1', numero: 1, zona: { establecimientoId: 'estab-1' } },
};

function buildMocks() {
  const mockTx: Record<string, any> = {
    servicio: { findUniqueOrThrow: jest.fn().mockResolvedValue(MOCK_SERVICIO), update: jest.fn() },
    comanda: { count: jest.fn().mockResolvedValue(1) },
    establecimiento: { findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'estab-1', nif: 'B12345678', nombre: 'Bar El Rincón' }) },
    serieFacturacion: { findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'sf-1', prefijo: 'V', year: 2026 }) },
    ticket: { create: jest.fn().mockResolvedValue({ id: 'tkt-1' }) },
    mesa: { update: jest.fn() },
    libroRegistroEmitida: { create: jest.fn() },
  };

  const mockPrisma = {
    $transaction: jest.fn((fn: any) => fn(mockTx)),
    lineaComanda: { findMany: jest.fn() },
  } as unknown as PrismaService;

  const mockVeriFactu = {
    obtenerSiguienteNumero: jest.fn().mockResolvedValue({ numero: 1, codigoCompleto: 'V-2026-000001' }),
    crearRegistro: jest.fn().mockResolvedValue({ hashActual: 'a'.repeat(64), hashAnterior: 'GENESIS' }),
  } as unknown as VeriFactuService;

  const mockComandaService = {
    calcularCuenta: jest.fn().mockResolvedValue(MOCK_CUENTA),
  } as unknown as ComandaService;

  const mockEventEmitter = { emit: jest.fn() } as any;

  return { mockTx, mockPrisma, mockVeriFactu, mockComandaService, mockEventEmitter };
}

// ─── Suite ───────────────────────────────────────────────────
describe('CobroService', () => {
  let service: CobroService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();

    // Importar CobroService dinámicamente para poder reemplazar mocks sin contaminar globals
    const { CobroService: CS } = jest.requireActual('../src/modules/tpv/services/cobro.service');
    service = new CS(
      mocks.mockPrisma,
      mocks.mockVeriFactu,
      mocks.mockComandaService,
      mocks.mockEventEmitter,
    );
  });

  // ──────────────────────────────────────────────────
  // cobrarServicio() — precondiciones
  // ──────────────────────────────────────────────────
  describe('cobrarServicio() — precondiciones', () => {
    it('OP-004: rechaza si el servicio no está activo', async () => {
      mocks.mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ ...MOCK_SERVICIO, abierto: false });

      await expect(
        service.cobrarServicio({
          servicioId: 'svc-1',
          formasPago: [{ forma: 'efectivo', importe: 10 }],
        }),
      ).rejects.toThrow('OP-004 ERROR: Servicio no activo.');
    });

    it('OP-004: rechaza si el servicio no tiene comandas', async () => {
      mocks.mockTx.comanda.count.mockResolvedValue(0);

      await expect(
        service.cobrarServicio({
          servicioId: 'svc-1',
          formasPago: [{ forma: 'efectivo', importe: 10 }],
        }),
      ).rejects.toThrow('No hay comandas en este servicio.');
    });

    it('INV-014: rechaza pago insuficiente', async () => {
      await expect(
        service.cobrarServicio({
          servicioId: 'svc-1',
          formasPago: [{ forma: 'efectivo', importe: 5.0 }], // total es 10.0
        }),
      ).rejects.toThrow('Pago insuficiente');
    });

    it('RN-033: rechaza si la cuenta tiene total ≤ 0', async () => {
      mocks.mockComandaService.calcularCuenta = jest.fn().mockResolvedValue({ ...MOCK_CUENTA, total: 0 });

      await expect(
        service.cobrarServicio({
          servicioId: 'svc-1',
          formasPago: [{ forma: 'efectivo', importe: 0 }],
        }),
      ).rejects.toThrow('Total debe ser > 0');
    });
  });

  // ──────────────────────────────────────────────────
  // cobrarServicio() — postcondiciones
  // ──────────────────────────────────────────────────
  describe('cobrarServicio() — postcondiciones', () => {
    it('OK: devuelve codigoCompleto, total, hashVerifactu y cambio', async () => {
      const res = await service.cobrarServicio({
        servicioId: 'svc-1',
        formasPago: [{ forma: 'efectivo', importe: 15.0 }], // paga de más → cambio 5€
      });

      expect(res.codigoCompleto).toBe('V-2026-000001');
      expect(res.total).toBe(10.0);
      expect(res.cambio).toBe(5.0);
      expect(res.hashVerifactu).toMatch(/^[0-9a-f]{64}$/);
    });

    it('INV-001: llama a verifactu.obtenerSiguienteNumero para numeración secuencial', async () => {
      await service.cobrarServicio({
        servicioId: 'svc-1',
        formasPago: [{ forma: 'tarjeta', importe: 10.0 }],
      });

      expect(mocks.mockVeriFactu.obtenerSiguienteNumero).toHaveBeenCalledTimes(1);
    });

    it('INV-007/008: llama a verifactu.crearRegistro para encadenar hash', async () => {
      await service.cobrarServicio({
        servicioId: 'svc-1',
        formasPago: [{ forma: 'tarjeta', importe: 10.0 }],
      });

      expect(mocks.mockVeriFactu.crearRegistro).toHaveBeenCalledWith(
        'tkt-1',
        expect.objectContaining({ codigoCompleto: 'V-2026-000001', nifEmisor: 'B12345678' }),
        expect.anything(),
      );
    });

    it('INV-010: actualiza mesa a estado libre tras cobro', async () => {
      await service.cobrarServicio({
        servicioId: 'svc-1',
        formasPago: [{ forma: 'efectivo', importe: 10.0 }],
      });

      expect(mocks.mockTx.mesa.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { estado: 'libre' } }),
      );
    });

    it('EVT-004: emite TicketEmitidoEvent al completar cobro', async () => {
      await service.cobrarServicio({
        servicioId: 'svc-1',
        formasPago: [{ forma: 'efectivo', importe: 10.0 }],
      });

      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith('ticket.emitido', expect.anything());
    });

    it('RN-037: cambio correcto con pago mixto (efectivo + tarjeta)', async () => {
      const res = await service.cobrarServicio({
        servicioId: 'svc-1',
        formasPago: [
          { forma: 'efectivo', importe: 6.0 },
          { forma: 'tarjeta', importe: 5.0 },
        ],
      });

      // Total pagado 11€, cuenta 10€ → cambio 1€
      expect(res.cambio).toBe(1.0);
    });
  });
});
