/**
 * E2E #1 — Venta Completa
 *
 * Flujo: abrir mesa → tomar comanda → calcular cuenta → cobrar
 * Verifica: INV-001, INV-007, INV-010, RN-037, SK-005/006
 *
 * Requiere PostgreSQL corriendo con datos seed (npm run db:seed).
 * Ejecución: npx jest --config jest.integration.config.ts --no-coverage
 */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function agent(app: INestApplication) {
  return request(app.getHttpServer());
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('E2E: Venta Completa — mesa → comanda → cobro → ticket', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  // IDs descubiertos durante beforeAll
  let establecimientoId: string;
  let empleadoId: string;
  let mesaId: string;
  let servicioId: string;
  let productoId: number; // precioConIva en céntimos no importa, solo el id

  // Resultado del cobro
  let cobroResult: {
    ticketId: string;
    codigoCompleto: string;
    total: number;
    cambio: number;
    hashVerifactu: string;
  };

  // ── Bootstrap ───────────────────────────────────────────────────────────────

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    // ── Paso 0: Descubrir IDs del establecimiento ────────────────────────────
    const setupRes = await agent(app).get('/api/v1/setup/info').expect(200);
    establecimientoId = setupRes.body.establecimiento.id;
    empleadoId = setupRes.body.empleados[0].id;

    // ── Paso 1: Catálogo → primer producto disponible ────────────────────────
    const catRes = await agent(app).get('/api/v1/productos/catalogo').expect(200);
    const productos = catRes.body.productos as Array<{ id: string; nombre: string }>;
    expect(productos.length).toBeGreaterThan(0);
    productoId = productos[0].id as unknown as number;

    // ── Paso 2: Asegurar que la mesa 1 está libre (resiliente ante abortos) ──
    await prisma.servicio.updateMany({
      where: { mesa: { numero: 1 }, abierto: true },
      data: { abierto: false },
    });
    await prisma.mesa.updateMany({
      where: { numero: 1 },
      data: { estado: 'libre' },
    });

    // ── Paso 3: Obtener mesa libre del mapa de sala ──────────────────────────
    const mapaRes = await agent(app)
      .get(`/api/v1/mesas/establecimiento/${establecimientoId}/mapa`)
      .expect(200);

    const allMesas: Array<{ id: string; numero: number; estado: string }> =
      (mapaRes.body as Array<{ mesas: unknown[] }>).flatMap((z) => z.mesas as any[]);

    const mesa = allMesas.find((m) => m.estado === 'libre');
    expect(mesa).toBeDefined();
    mesaId = mesa!.id;

    // ── Paso 4: Abrir mesa → obtener servicioId ──────────────────────────────
    const abrirRes = await agent(app)
      .post(`/api/v1/mesas/${mesaId}/abrir`)
      .send({ camareroId: empleadoId, comensales: 2 })
      .expect(201);

    servicioId = abrirRes.body.idServicio;
    expect(servicioId).toBeDefined();

    // ── Paso 5: Tomar comanda (2 unidades del primer producto) ───────────────
    await agent(app)
      .post('/api/v1/comandas')
      .send({
        servicioId,
        camareroId: empleadoId,
        lineas: [{ productoId, cantidad: 2 }],
      })
      .expect(201);

    // ── Paso 6: Calcular cuenta ──────────────────────────────────────────────
    const cuentaRes = await agent(app)
      .get(`/api/v1/comandas/servicio/${servicioId}/cuenta`)
      .expect(200);

    const total: number = cuentaRes.body.total;
    expect(total).toBeGreaterThan(0);

    // ── Paso 7: Cobrar (efectivo con algo de cambio) ─────────────────────────
    const importePagado = Math.ceil(total) + 5;
    const cobrarRes = await agent(app)
      .post(`/api/v1/cobros/servicio/${servicioId}`)
      .send({ formasPago: [{ forma: 'efectivo', importe: importePagado }] })
      .expect(201);

    cobroResult = cobrarRes.body;
  }, 60_000);

  afterAll(async () => {
    await app.close();
  });

  // ─── Criterios de aceptación ────────────────────────────────────────────────

  it('AC-01 INV-007: hashVerifactu es un SHA-256 de 64 caracteres hex', () => {
    expect(cobroResult.hashVerifactu).toMatch(/^[0-9a-f]{64}$/);
  });

  it('AC-02 INV-001: codigoCompleto tiene el formato V-YYYY-NNNNNN', () => {
    expect(cobroResult.codigoCompleto).toMatch(/^V-\d{4}-\d{6}$/);
  });

  it('AC-03 RN-037: el cambio devuelto equivale a pagado − total', () => {
    const importePagado = Math.ceil(cobroResult.total) + 5;
    expect(cobroResult.cambio).toBeCloseTo(importePagado - cobroResult.total, 2);
  });

  it('AC-04 INV-010: la mesa queda en estado libre tras el cobro', async () => {
    const mapaRes = await agent(app)
      .get(`/api/v1/mesas/establecimiento/${establecimientoId}/mapa`)
      .expect(200);

    const allMesas: Array<{ id: string; estado: string }> = (
      mapaRes.body as Array<{ mesas: unknown[] }>
    ).flatMap((z) => z.mesas as any[]);

    const mesa = allMesas.find((m) => m.id === mesaId);
    expect(mesa?.estado).toBe('libre');
  });

  it('AC-05 INV-008: GET /cobros/tickets/:id devuelve el hash VeriFactu correcto', async () => {
    const ticketRes = await agent(app)
      .get(`/api/v1/cobros/tickets/${cobroResult.ticketId}`)
      .expect(200);

    expect(ticketRes.body.verifactu).not.toBeNull();
    expect(ticketRes.body.verifactu.hash).toBe(cobroResult.hashVerifactu);
    expect(ticketRes.body.codigoCompleto).toBe(cobroResult.codigoCompleto);
  });

  it('AC-06 SK-006: el servicio queda cerrado en base de datos', async () => {
    const svc = await prisma.servicio.findUnique({ where: { id: servicioId } });
    expect(svc?.abierto).toBe(false);
  });
});
