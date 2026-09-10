/**
 * ComandaService — Tests unitarios
 *
 * Cubre:
 *   SK-002 (tomarComanda) — OP-002, POL-010, CMD-002, EVT-002
 *   SK-003 (calcularCuenta) — INV-002, desglose IVA
 *   SK-004 (dividirCuenta) — OP-005, POL-012, INV-013
 *   OP-003 (anularLinea) — POL-011, EVT-007
 */
import { BadRequestException } from '@nestjs/common';
import { ComandaService } from '../src/modules/tpv/services/comanda.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ─── Mocks ───────────────────────────────────────────────────
const mockTx = {
  servicio: { findUniqueOrThrow: jest.fn() },
  comanda: { create: jest.fn(), count: jest.fn() },
  producto: { findMany: jest.fn() },
  lineaComanda: {
    findMany: jest.fn(),
    findUniqueOrThrow: jest.fn(),
    update: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn((fn: (tx: typeof mockTx) => unknown) => fn(mockTx)),
  lineaComanda: { findMany: jest.fn() },
} as unknown as PrismaService;

const mockEventEmitter = { emit: jest.fn() } as any;

// ─── Helpers ─────────────────────────────────────────────────
const makeProducto = (
  id: string,
  destino: 'COCINA' | 'BARRA' | null = 'COCINA',
  tipoIva = 'reducido_10',
) => ({
  id,
  nombre: `Producto ${id}`,
  precioConIva: 10.0,
  tipoIva,
  activo: true,
  categoria: { destino },
  alergenos: [],
});

const makeComandaResult = (
  servicioId: string,
  lineas: Array<{ productoId: string; cantidad: number; modificadores?: string[] }>,
  destino: string | null = 'COCINA',
) => ({
  id: 'cmd-1',
  numero: 1,
  destino,
  servicioId,
  lineas: lineas.map((l) => ({
    id: 'lc-1',
    productoId: l.productoId,
    cantidad: l.cantidad,
    precioUnitario: 9.09,
    tipoIva: 0.1,
    baseImponible: 9.09,
    cuotaIva: 0.91,
    anulada: false,
    modificadores: (l.modificadores ?? []).map((m) => ({ texto: m, precioExtra: 0 })),
    producto: {
      nombre: `Producto ${l.productoId}`,
      alergenos: [],
    },
  })),
});

// ─── Suite ───────────────────────────────────────────────────
describe('ComandaService', () => {
  let service: ComandaService;

  beforeAll(() => {
    service = new ComandaService(mockPrisma, mockEventEmitter);
  });

  beforeEach(() => {
    jest.resetAllMocks();
    // Restaurar $transaction y lineaComanda tras resetAllMocks
    (mockPrisma.$transaction as jest.Mock).mockImplementation(
      (fn: (tx: typeof mockTx) => unknown) => fn(mockTx),
    );
  });

  // ──────────────────────────────────────────────────
  // tomarComanda()
  // ──────────────────────────────────────────────────
  describe('tomarComanda()', () => {
    it('OP-002: rechaza comanda sin líneas', async () => {
      await expect(
        service.tomarComanda({ servicioId: 'svc-1', lineas: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('OP-002: rechaza si el servicio no está activo (abierto=false)', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-1', abierto: false });

      await expect(
        service.tomarComanda({ servicioId: 'svc-1', lineas: [{ productoId: 'p1', cantidad: 1 }] }),
      ).rejects.toThrow('OP-002 ERROR: El servicio no está activo.');
    });

    it('OP-002: rechaza producto desconocido o inactivo', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-1', abierto: true });
      mockTx.comanda.count.mockResolvedValue(0);
      mockTx.producto.findMany.mockResolvedValue([]); // producto no encontrado

      await expect(
        service.tomarComanda({
          servicioId: 'svc-1',
          lineas: [{ productoId: 'p-inexistente', cantidad: 1 }],
        }),
      ).rejects.toThrow('p-inexistente no encontrado o inactivo');
    });

    it('POL-010: determina destino COCINA si todos van a cocina', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-1', abierto: true });
      mockTx.comanda.count.mockResolvedValue(0);
      mockTx.producto.findMany.mockResolvedValue([makeProducto('p1', 'COCINA')]);
      const lineas = [{ productoId: 'p1', cantidad: 1 }];
      mockTx.comanda.create.mockResolvedValue(makeComandaResult('svc-1', lineas, 'COCINA'));

      const res = await service.tomarComanda({ servicioId: 'svc-1', lineas });
      expect(res.destino).toBe('COCINA');
    });

    it('POL-010: determina destino BARRA si todos van a barra', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-1', abierto: true });
      mockTx.comanda.count.mockResolvedValue(0);
      mockTx.producto.findMany.mockResolvedValue([makeProducto('p1', 'BARRA')]);
      const lineas = [{ productoId: 'p1', cantidad: 1 }];
      mockTx.comanda.create.mockResolvedValue(makeComandaResult('svc-1', lineas, 'BARRA'));

      const res = await service.tomarComanda({ servicioId: 'svc-1', lineas });
      expect(res.destino).toBe('BARRA');
    });

    it('POL-010: determina destino AMBOS si hay productos de cocina y barra', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-2', abierto: true });
      mockTx.comanda.count.mockResolvedValue(0);
      mockTx.producto.findMany.mockResolvedValue([
        makeProducto('p1', 'COCINA'),
        makeProducto('p2', 'BARRA'),
      ]);
      const lineas = [
        { productoId: 'p1', cantidad: 1 },
        { productoId: 'p2', cantidad: 2 },
      ];
      mockTx.comanda.create.mockResolvedValue(makeComandaResult('svc-2', lineas, 'AMBOS'));

      const res = await service.tomarComanda({ servicioId: 'svc-2', lineas });
      expect(res.destino).toBe('AMBOS');
    });

    it('CMD-002: los modificadores se persistyen dentro de la comanda creada', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-3', abierto: true });
      mockTx.comanda.count.mockResolvedValue(0);
      mockTx.producto.findMany.mockResolvedValue([makeProducto('p1')]);
      const lineas = [{ productoId: 'p1', cantidad: 1, modificadores: ['Sin cebolla', 'Sin sal'] }];
      mockTx.comanda.create.mockResolvedValue(makeComandaResult('svc-3', lineas));

      await service.tomarComanda({ servicioId: 'svc-3', lineas });

      expect(mockTx.comanda.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lineas: expect.objectContaining({
              create: expect.arrayContaining([
                expect.objectContaining({
                  modificadores: {
                    create: [
                      { texto: 'Sin cebolla', precioExtra: 0 },
                      { texto: 'Sin sal', precioExtra: 0 },
                    ],
                  },
                }),
              ]),
            }),
          }),
        }),
      );
    });

    it('EVT-002: emite ComandaRegistradaEvent tras registrar comanda', async () => {
      mockTx.servicio.findUniqueOrThrow.mockResolvedValue({ id: 'svc-4', abierto: true });
      mockTx.comanda.count.mockResolvedValue(0);
      mockTx.producto.findMany.mockResolvedValue([makeProducto('p1')]);
      const lineas = [{ productoId: 'p1', cantidad: 1 }];
      mockTx.comanda.create.mockResolvedValue(makeComandaResult('svc-4', lineas));

      await service.tomarComanda({ servicioId: 'svc-4', lineas });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith('comanda.registrada', expect.anything());
    });
  });

  // ──────────────────────────────────────────────────
  // calcularCuenta()
  // ──────────────────────────────────────────────────
  describe('calcularCuenta()', () => {
    it('SK-003: total correcto con IVA 10% (reducido)', async () => {
      // Cerveza €10 con IVA incluido → base=9.09, cuota=0.91
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lc-1',
          producto: { nombre: 'Cerveza' },
          cantidad: 1,
          precioUnitario: 10.0,
          tipoIva: 0.1,
          baseImponible: 9.09,
          cuotaIva: 0.91,
          anulada: false,
        },
      ]);

      const res = await service.calcularCuenta('svc-1');
      expect(res.total).toBeCloseTo(10.0, 2);
      expect(res.desglose.base10).toBeCloseTo(9.09, 2);
      expect(res.desglose.iva10).toBeCloseTo(0.91, 2);
    });

    it('SK-003: acumula múltiples tipos de IVA en el desglose', async () => {
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lc-1',
          producto: { nombre: 'Menú' },
          cantidad: 1,
          precioUnitario: 10.0,
          tipoIva: 0.1,
          baseImponible: 9.09,
          cuotaIva: 0.91,
          anulada: false,
        },
        {
          id: 'lc-2',
          producto: { nombre: 'Vino' },
          cantidad: 1,
          precioUnitario: 12.1,
          tipoIva: 0.21,
          baseImponible: 10.0,
          cuotaIva: 2.1,
          anulada: false,
        },
      ]);

      const res = await service.calcularCuenta('svc-1');
      expect(res.desglose.base10).toBeCloseTo(9.09, 1);
      expect(res.desglose.base21).toBeCloseTo(10.0, 1);
      expect(res.total).toBeCloseTo(22.1, 1);
    });

    it('SK-003: devuelve total=0 si no hay líneas', async () => {
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([]);

      const res = await service.calcularCuenta('svc-vacio');
      expect(res.total).toBe(0);
      expect(res.lineas).toHaveLength(0);
    });

    it('INV-002: total = totalSinIva + totalIva', async () => {
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lc-1',
          producto: { nombre: 'Item' },
          cantidad: 2,
          precioUnitario: 8.0,
          tipoIva: 0.1,
          baseImponible: 14.55,
          cuotaIva: 1.45,
          anulada: false,
        },
      ]);

      const res = await service.calcularCuenta('svc-1');
      expect(Math.round((res.totalSinIva + res.totalIva) * 100) / 100).toBe(res.total);
    });
  });

  // ──────────────────────────────────────────────────
  // dividirCuenta()
  // ──────────────────────────────────────────────────
  describe('dividirCuenta()', () => {
    it('OP-005: rechaza si la cuenta está vacía (total=0)', async () => {
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([]);

      await expect(
        service.dividirCuenta({
          servicioId: 'svc-vacio',
          metodo: 'partes_iguales',
          config: { numPartes: 2 },
        }),
      ).rejects.toThrow('OP-005 ERROR');
    });

    it('OP-005: rechaza si numPartes < 2', async () => {
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lc-1',
          producto: { nombre: 'Item' },
          cantidad: 1,
          precioUnitario: 10,
          tipoIva: 0.1,
          baseImponible: 9.09,
          cuotaIva: 0.91,
          anulada: false,
        },
      ]);

      await expect(
        service.dividirCuenta({
          servicioId: 'svc-1',
          metodo: 'partes_iguales',
          config: { numPartes: 1 },
        }),
      ).rejects.toThrow('Mínimo 2 partes');
    });

    it('POL-012: N-1 partes truncadas, última absorbe el redondeo', async () => {
      // Total = 10.00 (exento) → 3 partes: 3.33 + 3.33 + 3.34
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lc-1',
          producto: { nombre: 'Item exento' },
          cantidad: 1,
          precioUnitario: 10,
          tipoIva: 0.0,
          baseImponible: 10.0,
          cuotaIva: 0.0,
          anulada: false,
        },
      ]);

      const res = await service.dividirCuenta({
        servicioId: 'svc-1',
        metodo: 'partes_iguales',
        config: { numPartes: 3 },
      });

      expect(res.subcuentas[0].total).toBe(3.33);
      expect(res.subcuentas[1].total).toBe(3.33);
      expect(res.subcuentas[2].total).toBe(3.34);
    });

    it('INV-013: suma de partes = total original (sin pérdida de céntimos)', async () => {
      // Total = 100.00 (21% IVA incluido) → 4 partes de 25.00 exactos en este caso
      (mockPrisma.lineaComanda.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'lc-1',
          producto: { nombre: 'Item' },
          cantidad: 1,
          precioUnitario: 100,
          tipoIva: 0.21,
          baseImponible: 82.64,
          cuotaIva: 17.36,
          anulada: false,
        },
      ]);

      const res = await service.dividirCuenta({
        servicioId: 'svc-1',
        metodo: 'partes_iguales',
        config: { numPartes: 4 },
      });

      const suma = Math.round(res.subcuentas.reduce((s, p) => s + p.total, 0) * 100) / 100;
      expect(suma).toBe(res.totalOriginal);
    });
  });

  // ──────────────────────────────────────────────────
  // anularLinea()
  // ──────────────────────────────────────────────────
  describe('anularLinea()', () => {
    it('POL-011: rechaza anulación en estado en_preparacion sin autorizacionEncargado', async () => {
      mockTx.lineaComanda.findUniqueOrThrow.mockResolvedValue({
        id: 'lc-1',
        anulada: false,
        comanda: { estado: 'en_preparacion' },
      });

      await expect(
        service.anularLinea({ lineaId: 'lc-1', motivo: 'error del pedido' }),
      ).rejects.toThrow('POL-011');
    });

    it('POL-011: rechaza anulación en estado lista sin autorizacionEncargado', async () => {
      mockTx.lineaComanda.findUniqueOrThrow.mockResolvedValue({
        id: 'lc-1',
        anulada: false,
        comanda: { estado: 'lista' },
      });

      await expect(
        service.anularLinea({ lineaId: 'lc-1', motivo: 'devuelto' }),
      ).rejects.toThrow('POL-011');
    });

    it('POL-011: permite anulación en preparación CON autorizacionEncargado', async () => {
      mockTx.lineaComanda.findUniqueOrThrow.mockResolvedValue({
        id: 'lc-1',
        anulada: false,
        comanda: { estado: 'en_preparacion' },
      });
      mockTx.lineaComanda.update.mockResolvedValue({});

      const res = await service.anularLinea({
        lineaId: 'lc-1',
        motivo: 'se equivocó el camarero',
        autorizacionEncargado: 'clave-encargado-123',
      });

      expect(res.anulada).toBe(true);
    });

    it('OP-003: permite anulación en estado pendiente sin autorización extra', async () => {
      mockTx.lineaComanda.findUniqueOrThrow.mockResolvedValue({
        id: 'lc-1',
        anulada: false,
        comanda: { estado: 'pendiente' },
      });
      mockTx.lineaComanda.update.mockResolvedValue({});

      const res = await service.anularLinea({
        lineaId: 'lc-1',
        motivo: 'cliente canceló',
      });

      expect(res.anulada).toBe(true);
    });

    it('EVT-007: emite LineaComandaAnuladaEvent tras anular', async () => {
      mockTx.lineaComanda.findUniqueOrThrow.mockResolvedValue({
        id: 'lc-1',
        anulada: false,
        comanda: { estado: 'pendiente' },
      });
      mockTx.lineaComanda.update.mockResolvedValue({});

      await service.anularLinea({ lineaId: 'lc-1', motivo: 'cliente cambió de opinión' });

      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'linea.comanda.anulada',
        expect.anything(),
      );
    });

    it('rechaza si la línea ya estaba anulada anteriormente', async () => {
      mockTx.lineaComanda.findUniqueOrThrow.mockResolvedValue({
        id: 'lc-1',
        anulada: true,
        comanda: { estado: 'pendiente' },
      });

      await expect(
        service.anularLinea({ lineaId: 'lc-1', motivo: 'doble envío' }),
      ).rejects.toThrow('Línea ya está anulada.');
    });
  });
});
