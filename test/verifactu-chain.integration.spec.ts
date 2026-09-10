/**
 * E2E #2 — Cadena VeriFactu (INV-007/008)
 *
 * Verifica que dos tickets consecutivos forman una cadena hash ininterrumpida
 * y que la detección de manipulación funciona correctamente.
 *
 * Flujo:
 *   1. Venta #1 → ticket1, hash1
 *   2. Venta #2 → ticket2, hash2 (hashAnterior == hash1)
 *   3. verificarCadena() → { integra: true }
 *   4. Tamper hashAnterior de ticket2 → verificarCadena() → { integra: false }
 *   5. Restaurar → verificarCadena() → { integra: true }
 *
 * Requiere PostgreSQL corriendo con datos seed.
 * Ejecución: npx jest --config jest.integration.config.ts --no-coverage
 */
import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { VeriFactuService } from '../src/modules/verifactu/verifactu.service';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function agent(app: INestApplication) {
  return request(app.getHttpServer());
}

/** Ejecuta el flujo completo de una venta y devuelve los datos del cobro */
async function doSaleFlow(
  app: INestApplication,
  prisma: PrismaService,
  params: {
    establecimientoId: string;
    empleadoId: string;
    productoId: string;
    mesaNumero: number; // resiliencia: qué mesa usar
  },
): Promise<{ ticketId: string; hashVerifactu: string; servicioId: string }> {
  const { establecimientoId, empleadoId, productoId, mesaNumero } = params;

  // Asegurar que la mesa está libre ante posibles fallos de ejecuciones previas
  await prisma.servicio.updateMany({
    where: { mesa: { numero: mesaNumero }, abierto: true },
    data: { abierto: false },
  });
  await prisma.mesa.updateMany({
    where: { numero: mesaNumero },
    data: { estado: 'libre' },
  });

  // Obtener ID de la mesa por número
  const mapaRes = await agent(app)
    .get(`/api/v1/mesas/establecimiento/${establecimientoId}/mapa`)
    .expect(200);

  const allMesas: Array<{ id: string; numero: number; estado: string }> = (
    mapaRes.body as Array<{ mesas: unknown[] }>
  ).flatMap((z) => z.mesas as any[]);

  const mesa = allMesas.find((m) => m.numero === mesaNumero && m.estado === 'libre');
  if (!mesa) throw new Error(`Mesa ${mesaNumero} no está libre`);

  // Abrir mesa
  const abrirRes = await agent(app)
    .post(`/api/v1/mesas/${mesa.id}/abrir`)
    .send({ camareroId: empleadoId, comensales: 1 })
    .expect(201);

  const servicioId: string = abrirRes.body.idServicio;

  // Tomar comanda
  await agent(app)
    .post('/api/v1/comandas')
    .send({ servicioId, camareroId: empleadoId, lineas: [{ productoId, cantidad: 1 }] })
    .expect(201);

  // Calcular cuenta
  const cuentaRes = await agent(app)
    .get(`/api/v1/comandas/servicio/${servicioId}/cuenta`)
    .expect(200);

  const total: number = cuentaRes.body.total;

  // Cobrar
  const cobrarRes = await agent(app)
    .post(`/api/v1/cobros/servicio/${servicioId}`)
    .send({ formasPago: [{ forma: 'efectivo', importe: total }] })
    .expect(201);

  return {
    ticketId: cobrarRes.body.ticketId,
    hashVerifactu: cobrarRes.body.hashVerifactu,
    servicioId,
  };
}

// ─── Suite ───────────────────────────────────────────────────────────────────

describe('E2E: Cadena VeriFactu — INV-007/008 integridad e inmutabilidad', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let verifactu: VeriFactuService;

  let establecimientoId: string;
  let empleadoId: string;
  let productoId: string;

  let hash1: string;
  let hash2: string;
  let registroId2: string; // ID del RegistroVeriFactu del ticket2 (para tamper)
  let hashAnteriorOriginal: string; // guardado para restaurar tras tamper

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
    verifactu = moduleFixture.get(VeriFactuService);

    // ── Paso 0: Descubrir IDs del establecimiento ────────────────────────────
    const setupRes = await agent(app).get('/api/v1/setup/info').expect(200);
    establecimientoId = setupRes.body.establecimiento.id;
    empleadoId = setupRes.body.empleados[0].id;

    // ── Paso 1: Catálogo → primer producto ───────────────────────────────────
    const catRes = await agent(app).get('/api/v1/productos/catalogo').expect(200);
    const productos = catRes.body.productos as Array<{ id: string }>;
    expect(productos.length).toBeGreaterThan(0);
    productoId = productos[0].id;

    // ── Paso 2: Venta #1 (mesa 2) ────────────────────────────────────────────
    const sale1 = await doSaleFlow(app, prisma, {
      establecimientoId,
      empleadoId,
      productoId,
      mesaNumero: 2,
    });
    hash1 = sale1.hashVerifactu;

    // ── Paso 3: Venta #2 (mesa 2 — ya libre tras cobro anterior) ─────────────
    const sale2 = await doSaleFlow(app, prisma, {
      establecimientoId,
      empleadoId,
      productoId,
      mesaNumero: 2,
    });
    hash2 = sale2.hashVerifactu;

    // ── Obtener el RegistroVeriFactu del ticket2 para tamper tests ────────────
    const reg2 = await prisma.registroVeriFactu.findFirst({
      where: { ticketId: sale2.ticketId },
    });
    expect(reg2).not.toBeNull();
    registroId2 = reg2!.id;
    hashAnteriorOriginal = reg2!.hashAnterior;
  }, 90_000);

  afterAll(async () => {
    // Restaurar hashAnterior por si el test de tamper dejó el registro corrupto
    if (registroId2 && hashAnteriorOriginal) {
      await prisma.registroVeriFactu.update({
        where: { id: registroId2 },
        data: { hashAnterior: hashAnteriorOriginal },
      });
    }
    await app.close();
  });

  // ─── Criterios de aceptación ────────────────────────────────────────────────

  it('INV-007: ambos tickets tienen hashVerifactu de 64 caracteres hex', () => {
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
    expect(hash2).toMatch(/^[0-9a-f]{64}$/);
  });

  it('INV-008: ticket2.hashAnterior apunta al hash del ticket1 (cadena encadenada)', async () => {
    const reg2 = await prisma.registroVeriFactu.findUniqueOrThrow({
      where: { id: registroId2 },
    });
    // El hashAnterior del ticket2 DEBE ser el hashActual del ticket1
    // (pueden existir registros intermedios de otras pruebas, pero los run secuenciales
    // dentro de esta suite están consecutivos)
    expect(reg2.hashAnterior).toBe(hash1);
    expect(reg2.hashActual).toBe(hash2);
  });

  it('INV-008: verificarCadena() devuelve { integra: true } con la cadena intacta', async () => {
    const resultado = await verifactu.verificarCadena();
    expect(resultado.integra).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('RN-017: hashAnterior manipulado rompe la cadena y es detectado; restauración la repara', async () => {
    // 1. Tamper: corromper el hashAnterior del ticket2
    await prisma.registroVeriFactu.update({
      where: { id: registroId2 },
      data: { hashAnterior: 'aaaa0000000000000000000000000000000000000000000000000000aaaa0000' },
    });

    const broken = await verifactu.verificarCadena();
    expect(broken.integra).toBe(false);
    expect(broken.errores.length).toBeGreaterThan(0);

    // 2. Restaurar hashAnterior original
    await prisma.registroVeriFactu.update({
      where: { id: registroId2 },
      data: { hashAnterior: hashAnteriorOriginal },
    });

    const restored = await verifactu.verificarCadena();
    expect(restored.integra).toBe(true);
    expect(restored.errores).toHaveLength(0);
  });
});
