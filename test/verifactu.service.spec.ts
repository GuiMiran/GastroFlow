/**
 * VeriFactuService — Tests unitarios
 *
 * Cubre:
 *   RN-017 — Hash SHA-256 encadenado
 *   INV-007 — Registro VeriFactu NUNCA se modifica (detección de manipulación)
 *   INV-008 — Cadena hash ininterrumpida
 */
import { createHash } from 'crypto';
import { VeriFactuService, VeriFactuDatos } from '../src/modules/verifactu/verifactu.service';
import { PrismaService } from '../src/common/prisma/prisma.service';

const mockPrisma = {
  registroVeriFactu: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
  },
} as unknown as PrismaService;

const datosBase: VeriFactuDatos = {
  codigoCompleto: 'FAC-2025-000001',
  tipo: 'FACTURA',
  fechaEmision: '2025-01-15',
  nifEmisor: 'B12345678',
  nombreEmisor: 'GastroFlow SL',
  totalSinIva: 100.0,
  totalIva: 21.0,
  total: 121.0,
  desglose: { base4: 0, iva4: 0, base10: 0, iva10: 0, base21: 100.0, iva21: 21.0 },
};

describe('VeriFactuService', () => {
  let service: VeriFactuService;

  beforeAll(() => {
    service = new VeriFactuService(mockPrisma);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  // ──────────────────────────────────────────────────
  // generarHash()
  // ──────────────────────────────────────────────────
  describe('generarHash()', () => {
    it('RN-017: produce un hash SHA-256 válido (hex de 64 chars)', () => {
      const hash = service.generarHash(datosBase, 'GENESIS');
      expect(hash).toMatch(/^[0-9a-f]{64}$/);
    });

    it('RN-017: es determinista — misma entrada produce mismo hash', () => {
      const h1 = service.generarHash(datosBase, 'GENESIS');
      const h2 = service.generarHash(datosBase, 'GENESIS');
      expect(h1).toBe(h2);
    });

    it('RN-017: el hash cambia si cambia hashAnterior (encadenamiento INV-008)', () => {
      const h1 = service.generarHash(datosBase, 'GENESIS');
      const h2 = service.generarHash(datosBase, 'OTRO-HASH-ANTERIOR');
      expect(h1).not.toBe(h2);
    });

    it('RN-017: el hash cambia si cambia cualquier campo del registro', () => {
      const datosModificados = { ...datosBase, total: 120.0 };
      const h1 = service.generarHash(datosBase, 'GENESIS');
      const h2 = service.generarHash(datosModificados, 'GENESIS');
      expect(h1).not.toBe(h2);
    });

    it('INV-008: hash del registro 2 depende del hash del registro 1 (verificación manual)', () => {
      const hash1 = service.generarHash(datosBase, 'GENESIS');
      const datos2: VeriFactuDatos = { ...datosBase, codigoCompleto: 'FAC-2025-000002' };
      const hash2 = service.generarHash(datos2, hash1);

      const expectedHash2 = createHash('sha256')
        .update(JSON.stringify({ ...datos2, hashAnterior: hash1 }))
        .digest('hex');

      expect(hash2).toBe(expectedHash2);
    });
  });

  // ──────────────────────────────────────────────────
  // verificarCadena()
  // ──────────────────────────────────────────────────
  describe('verificarCadena()', () => {
    it('cadena vacía → integra=true, sin errores', async () => {
      (mockPrisma.registroVeriFactu.findMany as jest.Mock).mockResolvedValue([]);
      const result = await service.verificarCadena();
      expect(result.integra).toBe(true);
      expect(result.errores).toHaveLength(0);
    });

    it('INV-008: cadena íntegra de 2 registros → integra=true', async () => {
      const hash1 = service.generarHash(datosBase, 'GENESIS');
      const datos2: VeriFactuDatos = { ...datosBase, codigoCompleto: 'FAC-2025-000002' };
      const hash2 = service.generarHash(datos2, hash1);

      (mockPrisma.registroVeriFactu.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          hashAnterior: 'GENESIS',
          hashActual: hash1,
          datosRegistro: JSON.stringify(datosBase),
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'r2',
          hashAnterior: hash1,
          hashActual: hash2,
          datosRegistro: JSON.stringify(datos2),
          createdAt: new Date('2025-01-02'),
        },
      ]);

      const result = await service.verificarCadena();
      expect(result.integra).toBe(true);
      expect(result.errores).toHaveLength(0);
    });

    it('INV-008: detecta rotura de cadena (hashAnterior incorrecto)', async () => {
      const hash1 = service.generarHash(datosBase, 'GENESIS');
      const datos2: VeriFactuDatos = { ...datosBase, codigoCompleto: 'FAC-2025-000002' };
      // Segundo registro apunta a un hashAnterior manipulado, no al real hash1
      const hashAnteriorFalso = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa0';
      const hash2_malo = service.generarHash(datos2, hashAnteriorFalso);

      (mockPrisma.registroVeriFactu.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          hashAnterior: 'GENESIS',
          hashActual: hash1,
          datosRegistro: JSON.stringify(datosBase),
          createdAt: new Date('2025-01-01'),
        },
        {
          id: 'r2',
          hashAnterior: hashAnteriorFalso,
          hashActual: hash2_malo,
          datosRegistro: JSON.stringify(datos2),
          createdAt: new Date('2025-01-02'),
        },
      ]);

      const result = await service.verificarCadena();
      expect(result.integra).toBe(false);
      expect(result.errores.length).toBeGreaterThan(0);
    });

    it('INV-007: detecta datos manipulados (hash no coincide con datosRegistro)', async () => {
      const hash1Legit = service.generarHash(datosBase, 'GENESIS');
      // Datos en DB han sido modificados a posteriori → hash no coincide
      const datosManipulados: VeriFactuDatos = { ...datosBase, total: 0 };

      (mockPrisma.registroVeriFactu.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'r1',
          hashAnterior: 'GENESIS',
          hashActual: hash1Legit, // hash original
          datosRegistro: JSON.stringify(datosManipulados), // datos alterados
          createdAt: new Date('2025-01-01'),
        },
      ]);

      const result = await service.verificarCadena();
      expect(result.integra).toBe(false);
      expect(result.errores.some((e) => e.includes('corrupto'))).toBe(true);
    });
  });
});
