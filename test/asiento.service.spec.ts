/**
 * AsientoService — Tests unitarios (L2 mock)
 *
 * Cubre:
 *   SK-030 (generar_asiento_automatico) via onTicketEmitido y onFacturaCompra
 *   INV-030 — Partida doble: Σ cargo = Σ abono (siempre)
 *   INV-009 — ticket.asientoContableId NUNCA null tras cobro
 *   RN-081 — Cuentas PGC: 570 (caja), 572 (bancos), 700 (ventas), 477 (IVA rep), 472 (IVA sop), 400 (prov), 600 (compras)
 *   EVT-008 — AsientoContableCreado emitido tras cada asiento
 */
import { AsientoService } from '../src/modules/contable/asiento.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { TicketEmitidoEvent } from '../src/common/events/domain-events';

// ─── Helpers ─────────────────────────────────────────────────

function makeTicketEmitidoEvent(formasPago: Array<{ forma: string; importe: number }>, total = 10.0) {
  return new TicketEmitidoEvent(
    'tkt-1',
    1,
    'V',
    total,
    { base4: 0, iva4: 0, base10: 9.09, iva10: 0.91, base21: 0, iva21: 0 },
    formasPago,
    'a'.repeat(64),
    'svc-1',
    null,
  );
}

function buildMocks() {
  const mockAsiento = { id: 'asiento-1' };
  const mockApuntes: any[] = [];

  const mockPrisma = {
    ticket: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'tkt-1',
        codigoCompleto: 'V-2026-000001',
        serieFacturacion: { establecimientoId: 'estab-1' },
        cliente: null,
      }),
      update: jest.fn(),
    },
    asientoContable: {
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((args: any) => {
        // Capturar apuntes para verificar partida doble
        mockApuntes.push(...(args.data?.apuntes?.create ?? []));
        return Promise.resolve(mockAsiento);
      }),
    },
    facturaCompra: {
      findUniqueOrThrow: jest.fn().mockResolvedValue({
        id: 'fc-1',
        baseImponible4: 0,
        baseImponible10: 50,
        baseImponible21: 0,
        cuotaIva4: 0,
        cuotaIva10: 5,
        cuotaIva21: 0,
        total: 55,
        proveedor: { establecimientoId: 'estab-1' },
      }),
    },
  } as unknown as PrismaService;

  const mockEventEmitter = { emit: jest.fn() } as any;

  return { mockPrisma, mockEventEmitter, mockAsiento, mockApuntes };
}

// ─── Suite ───────────────────────────────────────────────────
describe('AsientoService', () => {
  let service: AsientoService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    service = new AsientoService(mocks.mockPrisma, mocks.mockEventEmitter);
  });

  // ──────────────────────────────────────────────────
  // onTicketEmitido() — cobro efectivo
  // ──────────────────────────────────────────────────
  describe('onTicketEmitido() — pago en efectivo', () => {
    it('INV-030: Σ cargo = Σ abono (partida doble balanceada)', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'efectivo', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      const totalCargo = mocks.mockApuntes.reduce((s: number, a: any) => s + a.cargo, 0);
      const totalAbono = mocks.mockApuntes.reduce((s: number, a: any) => s + a.abono, 0);
      expect(Math.abs(totalCargo - totalAbono)).toBeLessThanOrEqual(0.01);
    });

    it('RN-081: pago efectivo usa cuenta 570 (CAJA)', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'efectivo', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      const cuentaCaja = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '570');
      expect(cuentaCaja).toBeDefined();
      expect(cuentaCaja.cargo).toBeGreaterThan(0);
    });

    it('RN-081: venta registra abono en cuenta 700 (VENTAS)', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'efectivo', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      const cuentaVentas = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '700');
      expect(cuentaVentas).toBeDefined();
      expect(cuentaVentas.abono).toBeGreaterThan(0);
    });

    it('RN-081: IVA repercutido registra abono en cuenta 477', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'efectivo', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      const cuentaIva = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '477');
      expect(cuentaIva).toBeDefined();
      expect(cuentaIva.abono).toBeCloseTo(0.91, 2);
    });

    it('INV-009: actualiza ticket con asientoContableId (nunca null)', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'efectivo', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      expect(mocks.mockPrisma.ticket.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'tkt-1' },
          data: { asientoContableId: 'asiento-1' },
        }),
      );
    });

    it('EVT-008: emite AsientoContableCreado', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'efectivo', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith(
        'asiento.contable.creado',
        expect.anything(),
      );
    });
  });

  // ──────────────────────────────────────────────────
  // onTicketEmitido() — cobro tarjeta
  // ──────────────────────────────────────────────────
  describe('onTicketEmitido() — pago con tarjeta', () => {
    it('RN-081: pago tarjeta usa cuenta 572 (BANCOS), no 570', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'tarjeta', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      const cuentaBancos = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '572');
      const cuentaCaja = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '570');

      expect(cuentaBancos).toBeDefined();
      expect(cuentaBancos.cargo).toBeGreaterThan(0);
      expect(cuentaCaja).toBeUndefined();
    });

    it('INV-030: partida doble balanceada en pago por tarjeta', async () => {
      const event = makeTicketEmitidoEvent([{ forma: 'tarjeta', importe: 10.0 }]);
      await service.onTicketEmitido(event);

      const totalCargo = mocks.mockApuntes.reduce((s: number, a: any) => s + a.cargo, 0);
      const totalAbono = mocks.mockApuntes.reduce((s: number, a: any) => s + a.abono, 0);
      expect(Math.abs(totalCargo - totalAbono)).toBeLessThanOrEqual(0.01);
    });
  });

  // ──────────────────────────────────────────────────
  // onTicketEmitido() — pago mixto efectivo + tarjeta
  // ──────────────────────────────────────────────────
  describe('onTicketEmitido() — pago mixto', () => {
    it('INV-030: partida doble balanceada con pago mixto + cambio', async () => {
      const event = makeTicketEmitidoEvent([
        { forma: 'efectivo', importe: 7.0 },
        { forma: 'tarjeta', importe: 5.0 },
      ], 10.0); // total=10, pagado=12 → cambio=2

      await service.onTicketEmitido(event);

      const totalCargo = mocks.mockApuntes.reduce((s: number, a: any) => s + a.cargo, 0);
      const totalAbono = mocks.mockApuntes.reduce((s: number, a: any) => s + a.abono, 0);
      expect(Math.abs(Math.round(totalCargo * 100) - Math.round(totalAbono * 100))).toBeLessThanOrEqual(1);
    });
  });

  // ──────────────────────────────────────────────────
  // onFacturaCompra()
  // ──────────────────────────────────────────────────
  describe('onFacturaCompra()', () => {
    it('INV-030: partida doble balanceada en factura de proveedor', async () => {
      const { FacturaCompraRegistradaEvent } = await import('../src/common/events/domain-events');
      const event = new FacturaCompraRegistradaEvent('p-1', 'fc-1', 55.0);

      await service.onFacturaCompra(event);

      const totalCargo = mocks.mockApuntes.reduce((s: number, a: any) => s + a.cargo, 0);
      const totalAbono = mocks.mockApuntes.reduce((s: number, a: any) => s + a.abono, 0);
      expect(Math.abs(totalCargo - totalAbono)).toBeLessThanOrEqual(0.01);
    });

    it('RN-081: compra usa cuenta 600 (COMPRAS) y 400 (PROVEEDORES)', async () => {
      const { FacturaCompraRegistradaEvent } = await import('../src/common/events/domain-events');
      const event = new FacturaCompraRegistradaEvent('p-1', 'fc-1', 55.0);

      await service.onFacturaCompra(event);

      const compras = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '600');
      const proveedores = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '400');
      expect(compras).toBeDefined();
      expect(proveedores).toBeDefined();
    });

    it('RN-081: IVA soportado en cuenta 472', async () => {
      const { FacturaCompraRegistradaEvent } = await import('../src/common/events/domain-events');
      const event = new FacturaCompraRegistradaEvent('p-1', 'fc-1', 55.0);

      await service.onFacturaCompra(event);

      const ivaSoportado = mocks.mockApuntes.find((a: any) => a.cuentaPgc === '472');
      expect(ivaSoportado).toBeDefined();
      expect(ivaSoportado.cargo).toBeCloseTo(5.0, 2);
    });
  });
});
