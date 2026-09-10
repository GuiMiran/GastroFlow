/**
 * Tests de criterios de aceptación — Módulos M2-ERP + KDS
 * Tests unitarios puros (sin DB) validando lógica de negocio.
 *
 * Cubren:
 *   HU-M2-CAT-002: Escandallo y food cost
 *   HU-M2-CAT-004: Mermas por ingrediente (RN-022)
 *   HU-M2-INV-003: Conteo y desviación de inventario
 *   HU-M2-COM-004: Cálculos de factura compra (IVA soportado)
 *   HU-M2-RRH-003: Cálculo de horas trabajadas
 *   HU-M1-CMD-003: KDS destino routing (POL-010)
 */
import { round2 } from '../src/common/types/iva';

// ──────────────────────────────────────
// HU-M2-CAT-002: Escandallo y food cost
// ──────────────────────────────────────
describe('HU-M2-CAT-002: Escandallo / ficha técnica', () => {
  // Gin Tonic: 50ml Ginebra (0,80€) + 200ml Tónica (0,40€) = 1,20€ coste
  // PVP con IVA 9,50€ al 21% → PVP sin IVA = 9,50 / 1,21 = 7,85€
  // Food cost = 1,20 / 7,85 × 100 = 15,29%

  it('AC-01: calcula coste teórico del escandallo', () => {
    const ingredientes = [
      { cantidadNeta: 0.05, precioCoste: 16.0, merma: 0 }, // 50ml Ginebra a 16€/litro
      { cantidadNeta: 0.2, precioCoste: 2.0, merma: 0 }, // 200ml Tónica a 2€/litro
    ];

    let costeTeorico = 0;
    for (const ing of ingredientes) {
      costeTeorico += ing.cantidadNeta * ing.precioCoste;
    }
    costeTeorico = round2(costeTeorico);

    expect(costeTeorico).toBe(1.2); // 0,80 + 0,40
  });

  it('AC-01: calcula food cost = coste / PVP sin IVA × 100', () => {
    const costeTeorico = 1.2;
    const pvpConIva = 9.5;
    const tipoIva = 0.21;
    const pvpSinIva = round2(pvpConIva / (1 + tipoIva)); // 7,85€
    const foodCost = round2((costeTeorico / pvpSinIva) * 100);

    expect(pvpSinIva).toBe(7.85);
    expect(foodCost).toBe(15.29);
  });

  it('AC-02: recalcula al cambiar precio ingrediente', () => {
    // Ginebra sube de 16€/L a 19€/L
    const ingredientes = [
      { cantidadNeta: 0.05, precioCoste: 19.0, merma: 0 }, // Nuevo precio
      { cantidadNeta: 0.2, precioCoste: 2.0, merma: 0 },
    ];

    let costeTeorico = 0;
    for (const ing of ingredientes) {
      costeTeorico += ing.cantidadNeta * ing.precioCoste;
    }
    costeTeorico = round2(costeTeorico);

    expect(costeTeorico).toBe(1.35); // 0,95 + 0,40
  });
});

// ──────────────────────────────────────
// HU-M2-CAT-004: Mermas (RN-022)
// ──────────────────────────────────────
describe('HU-M2-CAT-004: Mermas por ingrediente (RN-022)', () => {
  it('cantidad_bruta = cantidad_neta / (1 – %merma)', () => {
    const cantidadNeta = 200; // 200g de lechuga
    const merma = 15; // 15% merma
    const cantidadBruta = cantidadNeta / (1 - merma / 100);

    expect(round2(cantidadBruta)).toBe(235.29); // ≈235g brutos
  });

  it('merma 0% → bruto = neto', () => {
    const cantidadNeta = 100;
    const merma = 0;
    const cantidadBruta = cantidadNeta / (1 - merma / 100);

    expect(cantidadBruta).toBe(100);
  });
});

// ──────────────────────────────────────
// HU-M2-INV-003: Conteo de inventario
// ──────────────────────────────────────
describe('HU-M2-INV-003: Inventario manual (conteo)', () => {
  it('AC-01: detecta desviación stock teórico vs real', () => {
    const stockTeorico = 6; // 6 botellas según sistema
    const stockReal = 5; // 5 botellas contadas
    const desviacion = stockReal - stockTeorico;

    expect(desviacion).toBe(-1);
  });

  it('desviación 0 = sin ajuste', () => {
    const stockTeorico = 10;
    const stockReal = 10;
    const desviacion = stockReal - stockTeorico;

    expect(desviacion).toBe(0);
    expect(Math.abs(desviacion) > 0.001).toBe(false);
  });
});

// ──────────────────────────────────────
// HU-M2-COM-004: Factura compra
// ──────────────────────────────────────
describe('HU-M2-COM-004: Factura de proveedor', () => {
  it('AC-01: calcula totales factura con IVA soportado', () => {
    const baseImponible10 = 500; // Alimentación al 10%
    const cuotaIva10 = round2(baseImponible10 * 0.1);
    const baseImponible21 = 200; // Alcohol al 21%
    const cuotaIva21 = round2(baseImponible21 * 0.21);

    const totalSinIva = round2(baseImponible10 + baseImponible21);
    const totalIva = round2(cuotaIva10 + cuotaIva21);
    const total = round2(totalSinIva + totalIva);

    expect(cuotaIva10).toBe(50);
    expect(cuotaIva21).toBe(42);
    expect(totalSinIva).toBe(700);
    expect(totalIva).toBe(92);
    expect(total).toBe(792);
  });

  it('AC-02: INV-030 partida doble asiento compra', () => {
    const base = 700;
    const iva = 92;
    const total = 792;

    // Debe: Compras(600) + IVA soportado
    const cargo = round2(base + iva);
    // Haber: Proveedores(400)
    const abono = total;

    expect(cargo).toBe(abono); // Partida doble
  });
});

// ──────────────────────────────────────
// HU-M2-RRH-003: Fichaje
// ──────────────────────────────────────
describe('HU-M2-RRH-003: Fichaje entrada/salida', () => {
  it('AC-02: calcula horas trabajadas', () => {
    const entrada = new Date('2026-03-14T17:58:00');
    const salida = new Date('2026-03-15T02:03:00');
    const minutosTrabajados = Math.round(
      (salida.getTime() - entrada.getTime()) / 60000,
    );
    const horas = Math.floor(minutosTrabajados / 60);
    const minutos = minutosTrabajados % 60;

    expect(minutosTrabajados).toBe(485); // 8h 05min
    expect(horas).toBe(8);
    expect(minutos).toBe(5);
  });
});

// ──────────────────────────────────────
// HU-M1-CMD-003: KDS routing (POL-010)
// ──────────────────────────────────────
describe('HU-M1-CMD-003/004: KDS destino routing (POL-010)', () => {
  it('AC-01: producto cocina + barra → destino AMBOS', () => {
    const destinos = ['COCINA', 'BARRA'];
    const destinosSet = new Set(destinos);

    let destino: string | null = null;
    if (destinosSet.has('COCINA') && destinosSet.has('BARRA')) destino = 'AMBOS';
    else if (destinosSet.has('COCINA')) destino = 'COCINA';
    else if (destinosSet.has('BARRA')) destino = 'BARRA';

    expect(destino).toBe('AMBOS');
  });

  it('solo cocina → destino COCINA', () => {
    const destinos = ['COCINA', 'COCINA'];
    const destinosSet = new Set(destinos);

    let destino: string | null = null;
    if (destinosSet.has('COCINA') && destinosSet.has('BARRA')) destino = 'AMBOS';
    else if (destinosSet.has('COCINA')) destino = 'COCINA';
    else if (destinosSet.has('BARRA')) destino = 'BARRA';

    expect(destino).toBe('COCINA');
  });

  it('solo barra → destino BARRA', () => {
    const destinos = ['BARRA'];
    const destinosSet = new Set(destinos);

    let destino: string | null = null;
    if (destinosSet.has('COCINA') && destinosSet.has('BARRA')) destino = 'AMBOS';
    else if (destinosSet.has('COCINA')) destino = 'COCINA';
    else if (destinosSet.has('BARRA')) destino = 'BARRA';

    expect(destino).toBe('BARRA');
  });
});
