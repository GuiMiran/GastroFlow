/**
 * KdsService — Tests unitarios (L2 mock)
 *
 * Cubre:
 *   HU-M1-CMD-003/004 — KDS Cocina / Barra
 *   POL-010 — filtro de destino COCINA/BARRA/AMBOS
 *   EVT-002 → onComandaRegistrada → push SSE
 *   marcarPlatoListo → EVT-003 PlatoListo + push SSE
 */
import { BadRequestException } from '@nestjs/common';
import { KdsService } from '../src/modules/tpv/services/kds.service';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { ComandaRegistradaEvent } from '../src/common/events/domain-events';

// ─── Factory de comandas mock ─────────────────────────────────
function makeComandaDB(id: string, destino: string, mesa: number | null = 5) {
  return {
    id,
    numero: 1,
    destino,
    estado: 'enviada',
    createdAt: new Date(),
    servicio: { mesa: mesa !== null ? { numero: mesa } : null },
    lineas: [
      {
        id: 'lc-1',
        producto: { nombre: 'Cerveza' },
        cantidad: 2,
        modificadores: [{ texto: 'Sin hielo' }],
      },
    ],
  };
}

function buildMocks() {
  const mockPrisma = {
    comanda: {
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    lineaComanda: {
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
    },
  } as unknown as PrismaService;

  const mockEventEmitter = { emit: jest.fn() } as any;

  return { mockPrisma, mockEventEmitter };
}

// ─── Suite ───────────────────────────────────────────────────
describe('KdsService', () => {
  let service: KdsService;
  let mocks: ReturnType<typeof buildMocks>;

  beforeEach(() => {
    mocks = buildMocks();
    service = new KdsService(mocks.mockPrisma, mocks.mockEventEmitter);
  });

  // ──────────────────────────────────────────────────
  // obtenerComandasPendientes()
  // ──────────────────────────────────────────────────
  describe('obtenerComandasPendientes()', () => {
    it('POL-010: COCINA recibe comandas con destino COCINA y AMBOS, no BARRA', async () => {
      (mocks.mockPrisma.comanda.findMany as jest.Mock).mockResolvedValue([
        makeComandaDB('cmd-1', 'COCINA'),
        makeComandaDB('cmd-2', 'AMBOS'),
      ]);

      const res = await service.obtenerComandasPendientes('COCINA');

      expect(res).toHaveLength(2);
      expect(res.every((c) => ['COCINA', 'AMBOS'].includes(c.destino!))).toBe(true);

      // Verificar que el filtro aplicado a Prisma incluye COCINA y AMBOS
      expect(mocks.mockPrisma.comanda.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            destino: { in: ['COCINA', 'AMBOS'] },
          }),
        }),
      );
    });

    it('POL-010: BARRA recibe comandas con destino BARRA y AMBOS, no COCINA', async () => {
      (mocks.mockPrisma.comanda.findMany as jest.Mock).mockResolvedValue([
        makeComandaDB('cmd-3', 'BARRA'),
        makeComandaDB('cmd-4', 'AMBOS'),
      ]);

      await service.obtenerComandasPendientes('BARRA');

      expect(mocks.mockPrisma.comanda.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            destino: { in: ['BARRA', 'AMBOS'] },
          }),
        }),
      );
    });

    it('devuelve mesa=Barra cuando el servicio es de barra (mesa=null)', async () => {
      (mocks.mockPrisma.comanda.findMany as jest.Mock).mockResolvedValue([
        makeComandaDB('cmd-barra', 'BARRA', null),
      ]);

      const res = await service.obtenerComandasPendientes('BARRA');

      expect(res[0].mesa).toBe('Barra');
    });

    it('devuelve lista vacía si no hay comandas pendientes', async () => {
      (mocks.mockPrisma.comanda.findMany as jest.Mock).mockResolvedValue([]);

      const res = await service.obtenerComandasPendientes('COCINA');

      expect(res).toHaveLength(0);
    });
  });

  // ──────────────────────────────────────────────────
  // onComandaRegistrada() — handler de EVT-002
  // ──────────────────────────────────────────────────
  describe('onComandaRegistrada()', () => {
    it('EVT-002: publica en el stream SSE al recibir evento de comanda registrada', async () => {
      (mocks.mockPrisma.comanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        makeComandaDB('cmd-1', 'COCINA'),
      );

      const streamSpy = jest.spyOn((service as any).kdsStream$, 'next');

      const event = new ComandaRegistradaEvent('cmd-1', 'svc-1', [
        { productoId: 'p1', cantidad: 2, precioUnitario: 5, tipoIva: 0.1 },
      ]);

      await service.onComandaRegistrada(event);

      expect(streamSpy).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'comanda_nueva' }),
      );
    });

    it('EVT-002: los modificadores aparecen en el payload SSE', async () => {
      (mocks.mockPrisma.comanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        makeComandaDB('cmd-1', 'BARRA'),
      );

      const streamSpy = jest.spyOn((service as any).kdsStream$, 'next');

      const event = new ComandaRegistradaEvent('cmd-1', 'svc-1', []);
      await service.onComandaRegistrada(event);

      const payload = streamSpy.mock.calls[0][0] as any;
      expect(payload.data.lineas[0].modificadores).toContain('Sin hielo');
    });
  });

  // ──────────────────────────────────────────────────
  // marcarPlatoListo()
  // ──────────────────────────────────────────────────
  describe('marcarPlatoListo()', () => {
    function buildLineaMock(anulada = false) {
      return {
        id: 'lc-1',
        comandaId: 'cmd-1',
        anulada,
        comanda: {
          servicio: {
            mesaId: 'm1',
            mesa: { numero: 5 },
          },
        },
      };
    }

    it('rechaza si la línea ya está anulada', async () => {
      (mocks.mockPrisma.lineaComanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        buildLineaMock(true),
      );

      await expect(service.marcarPlatoListo('lc-1')).rejects.toThrow('La línea está anulada.');
    });

    it('EVT-003: emite PlatoListoEvent al marcar plato listo', async () => {
      (mocks.mockPrisma.lineaComanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        buildLineaMock(),
      );
      (mocks.mockPrisma.comanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        { id: 'cmd-1', estado: 'en_preparacion' },
      );

      await service.marcarPlatoListo('lc-1');

      expect(mocks.mockEventEmitter.emit).toHaveBeenCalledWith('plato.listo', expect.anything());
    });

    it('SSE: publica tipo plato_listo en kdsStream$ con identificadores correctos', async () => {
      (mocks.mockPrisma.lineaComanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        buildLineaMock(),
      );
      (mocks.mockPrisma.comanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        { id: 'cmd-1', estado: 'en_preparacion' },
      );

      const streamSpy = jest.spyOn((service as any).kdsStream$, 'next');

      await service.marcarPlatoListo('lc-1');

      expect(streamSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'plato_listo',
          data: expect.objectContaining({ lineaId: 'lc-1', comandaId: 'cmd-1' }),
        }),
      );
    });

    it('OK: devuelve { ok: true } tras marcar', async () => {
      (mocks.mockPrisma.lineaComanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        buildLineaMock(),
      );
      (mocks.mockPrisma.comanda.findUniqueOrThrow as jest.Mock).mockResolvedValue(
        { id: 'cmd-1', estado: 'en_preparacion' },
      );

      const res = await service.marcarPlatoListo('lc-1');

      expect(res).toEqual({ ok: true });
    });
  });
});
