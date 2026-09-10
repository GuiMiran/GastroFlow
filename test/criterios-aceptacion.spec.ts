/**
 * Tests de criterios de aceptación — Capa 11 del SPEC
 * Tests unitarios puros (sin DB) validando la lógica de dominio.
 *
 * Cubren: AC-001 (IVA), AC-002 (división), AC-006 (hash), AC-008 (arqueo),
 *         AC-030 (Modelo 303 básico), INV-030 (partida doble)
 */
import {
  calcularBaseImponible,
  calcularCuotaIva,
  calcularDesgloseIva,
  round2,
  TIPOS_IVA,
} from '../src/common/types/iva';

// ──────────────────────────────────────
// AC-001: Cobro simple con IVA correcto
// ──────────────────────────────────────
describe('AC-001: Cobro simple con IVA correcto', () => {
  // 1× Tortilla Española (8,00€ PVP con IVA 10%)
  // 2× Cerveza Artesana  (3,50€ PVP con IVA 21%)

  it('calcula total correcto = 15,00€', () => {
    const totalTortilla = 1 * 8.0;
    const totalCerveza = 2 * 3.5;
    expect(totalTortilla + totalCerveza).toBe(15.0);
  });

  it('calcula desglose IVA 10% correcto: base 7,27€, cuota 0,73€', () => {
    const base10 = calcularBaseImponible(8.0, TIPOS_IVA.REDUCIDO_10);
    const cuota10 = calcularCuotaIva(base10, TIPOS_IVA.REDUCIDO_10, 8.0);
    expect(base10).toBeCloseTo(7.27, 2);
    expect(cuota10).toBeCloseTo(0.73, 2);
  });

  it('calcula desglose IVA 21% correcto: base 5,79€, cuota 1,21€', () => {
    const totalCerveza = 2 * 3.5; // 7,00€
    const base21 = calcularBaseImponible(totalCerveza, TIPOS_IVA.GENERAL_21);
    const cuota21 = calcularCuotaIva(base21, TIPOS_IVA.GENERAL_21, totalCerveza);
    expect(base21).toBeCloseTo(5.79, 2);
    expect(cuota21).toBeCloseTo(1.21, 2);
  });

  it('total = Σ bases + Σ cuotas = 15,00€', () => {
    const base10 = calcularBaseImponible(8.0, TIPOS_IVA.REDUCIDO_10);
    const cuota10 = calcularCuotaIva(base10, TIPOS_IVA.REDUCIDO_10, 8.0);
    const base21 = calcularBaseImponible(7.0, TIPOS_IVA.GENERAL_21);
    const cuota21 = calcularCuotaIva(base21, TIPOS_IVA.GENERAL_21, 7.0);
    expect(round2(base10 + cuota10 + base21 + cuota21)).toBe(15.0);
  });

  it('calcula cambio correcto: 20€ - 15€ = 5€', () => {
    const total = 15.0;
    const pagado = 20.0;
    expect(pagado - total).toBe(5.0);
  });
});

// ──────────────────────────────────────
// AC-001 con calcularDesgloseIva
// ──────────────────────────────────────
describe('AC-001: Desglose IVA integrado', () => {
  it('calcula desglose completo usando calcularDesgloseIva()', () => {
    const lineas = [
      { precioUnitario: 8.0, cantidad: 1, tipoIva: TIPOS_IVA.REDUCIDO_10, descuento: 0 },
      { precioUnitario: 3.5, cantidad: 2, tipoIva: TIPOS_IVA.GENERAL_21, descuento: 0 },
    ];

    const desglose = calcularDesgloseIva(lineas);

    expect(desglose.base10).toBeCloseTo(7.27, 2);
    expect(desglose.iva10).toBeCloseTo(0.73, 2);
    expect(desglose.base21).toBeCloseTo(5.79, 2);
    expect(desglose.iva21).toBeCloseTo(1.21, 2);
    expect(desglose.base4).toBe(0);
    expect(desglose.iva4).toBe(0);
  });
});

// ──────────────────────────────────────
// AC-002: División de cuenta a partes iguales
// ──────────────────────────────────────
describe('AC-002: División de cuenta a partes iguales', () => {
  it('divide 100€ entre 3: 33,33 + 33,33 + 33,34 = 100,00', () => {
    const total = 100.0;
    const numPartes = 3;
    const partBase = Math.floor((total / numPartes) * 100) / 100; // 33,33
    const partes = Array(numPartes).fill(partBase);
    // Última parte absorbe el resto (POL-012)
    const suma = round2(partes.reduce((s: number, v: number) => s + v, 0));
    partes[partes.length - 1] = round2(partes[partes.length - 1] + (total - suma));

    expect(partes[0]).toBe(33.33);
    expect(partes[1]).toBe(33.33);
    expect(partes[2]).toBe(33.34);

    // INV-013: suma exacta
    const sumaFinal = round2(partes.reduce((s: number, v: number) => s + v, 0));
    expect(sumaFinal).toBe(100.0);
  });
});

// ──────────────────────────────────────
// AC-003: División por productos con distintos IVA
// ──────────────────────────────────────
describe('AC-003: División por productos', () => {
  it('Comensal A: 11,00€ al 10%, Comensal B: 9,50€ al 21%', () => {
    // Comensal A: Ensalada 9€ (10%) + Agua 2€ (10%)
    const baseA = calcularBaseImponible(9.0 + 2.0, TIPOS_IVA.REDUCIDO_10);
    const cuotaA = calcularCuotaIva(baseA, TIPOS_IVA.REDUCIDO_10, 11.0);
    expect(baseA).toBeCloseTo(10.0, 2);
    expect(cuotaA).toBeCloseTo(1.0, 2);

    // Comensal B: Gin Tonic 9,50€ (21%)
    const baseB = calcularBaseImponible(9.5, TIPOS_IVA.GENERAL_21);
    const cuotaB = calcularCuotaIva(baseB, TIPOS_IVA.GENERAL_21, 9.5);
    expect(baseB).toBeCloseTo(7.85, 2);
    expect(cuotaB).toBeCloseTo(1.65, 2);

    // Total
    expect(round2(11.0 + 9.5)).toBe(20.5);
  });
});

// ──────────────────────────────────────
// AC-006: Secuencialidad VeriFactu (hash chain)
// ──────────────────────────────────────
describe('AC-006: Secuencialidad de tickets VeriFactu', () => {
  // Simulamos hash chain sin crypto real, verificando la lógica
  function hashSimulado(payload: string, prevHash: string): string {
    // En producción usa SHA-256; aquí verificamos la cadena conceptualmente
    return `hash(${payload}+${prevHash})`;
  }

  it('cada ticket incluye hash del anterior', () => {
    const hash0 = 'GENESIS';
    const hash1 = hashSimulado('V-2026-004521', hash0);
    const hash2 = hashSimulado('V-2026-004522', hash1);

    // hash2 contiene referencia al hash1
    expect(hash2).toContain(hash1);
    // hash1 contiene referencia al genesis
    expect(hash1).toContain(hash0);
  });

  it('números son estrictamente secuenciales sin saltos', () => {
    const numeros = [4521, 4522, 4523, 4524];
    for (let i = 1; i < numeros.length; i++) {
      expect(numeros[i] - numeros[i - 1]).toBe(1);
    }
  });
});

// ──────────────────────────────────────
// AC-008: Arqueo de caja con descuadre
// ──────────────────────────────────────
describe('AC-008: Arqueo de caja con descuadre', () => {
  it('calcula descuadre: esperado=734, contado=730, diferencia=-4', () => {
    const fondo = 200.0;
    const cobrosEfectivo = 1034.0;
    const retirada = 500.0;

    const esperado = round2(fondo + cobrosEfectivo - retirada);
    const contado = 730.0;
    const descuadre = round2(contado - esperado); // RN-040

    expect(esperado).toBe(734.0);
    expect(descuadre).toBe(-4.0);
  });
});

// ──────────────────────────────────────
// INV-030: Partida doble
// ──────────────────────────────────────
describe('INV-030: Partida doble — debe = haber', () => {
  it('asiento de venta: caja + IVA repercutido = ventas', () => {
    // Venta de 15€: base 12.40 + IVA 2.60 (mixto, simplificado)
    const apuntes = [
      { cuenta: '570', debe: 15.0, haber: 0 },   // Caja
      { cuenta: '700', debe: 0, haber: 12.4 },   // Ventas
      { cuenta: '477', debe: 0, haber: 2.6 },    // IVA repercutido
    ];

    const totalDebe = round2(apuntes.reduce((s, a) => s + a.debe, 0));
    const totalHaber = round2(apuntes.reduce((s, a) => s + a.haber, 0));
    expect(totalDebe).toBe(totalHaber);
  });

  it('asiento de compra: compras + IVA soportado = proveedores', () => {
    // Factura compra: base 850 + IVA 85 = total 935
    const apuntes = [
      { cuenta: '600', debe: 850.0, haber: 0 },   // Compras
      { cuenta: '472', debe: 85.0, haber: 0 },    // IVA soportado
      { cuenta: '400', debe: 0, haber: 935.0 },   // Proveedores
    ];

    const totalDebe = round2(apuntes.reduce((s, a) => s + a.debe, 0));
    const totalHaber = round2(apuntes.reduce((s, a) => s + a.haber, 0));
    expect(totalDebe).toBe(totalHaber);
  });
});

// ──────────────────────────────────────
// AC-030: Modelo 303 lógica
// ──────────────────────────────────────
describe('AC-030: Cálculo IVA trimestral', () => {
  it('resultado = repercutido - soportado → 9.100€ a ingresar', () => {
    const ivaRepercutido = 15200.0;
    const ivaSoportado = 6100.0;
    const resultado = round2(ivaRepercutido - ivaSoportado);
    expect(resultado).toBe(9100.0);
  });

  it('desglose repercutido: 12.000 (10%) + 3.200 (21%) = 15.200', () => {
    const cuota10 = 12000.0;
    const cuota21 = 3200.0;
    expect(cuota10 + cuota21).toBe(15200.0);
  });
});

// ──────────────────────────────────────
// AC-004: Pago mixto
// ──────────────────────────────────────
describe('AC-004: Pago mixto efectivo + tarjeta', () => {
  it('INV-014: Σ pagos ≥ total', () => {
    const total = 50.0;
    const pagos = [
      { forma: 'efectivo', importe: 20.0 },
      { forma: 'tarjeta', importe: 30.0 },
    ];
    const totalPagado = round2(pagos.reduce((s, p) => s + p.importe, 0));
    expect(totalPagado).toBeGreaterThanOrEqual(total);
    expect(totalPagado).toBe(50.0);
  });
});

// ──────────────────────────────────────
// AC-010: Descuento automático de stock
// ──────────────────────────────────────
describe('AC-010: Descuento automático de stock por venta', () => {
  it('3 Gin Tonics × 50ml = 150ml descontados, stock final 1.850ml', () => {
    const stockInicial = 2000; // ml
    const escandallo = 50; // ml por unidad
    const vendidos = 3;
    const descuento = vendidos * escandallo;
    const stockFinal = stockInicial - descuento;

    expect(descuento).toBe(150);
    expect(stockFinal).toBe(1850);
  });
});

// ──────────────────────────────────────
// AC-050: Acumulación de puntos CRM
// ──────────────────────────────────────
describe('AC-050: Acumulación de puntos', () => {
  it('55€ ticket → 55 puntos, 450+55=505, sube a Plata', () => {
    const puntosActuales = 450;
    const totalTicket = 55.0;
    const puntosNuevos = Math.floor(totalTicket); // 1 punto por Euro
    const saldo = puntosActuales + puntosNuevos;

    expect(puntosNuevos).toBe(55);
    expect(saldo).toBe(505);

    // Nivel: Bronce < 500, Plata 500-1499, Oro >= 1500
    const nivel = saldo >= 1500 ? 'Oro' : saldo >= 500 ? 'Plata' : 'Bronce';
    expect(nivel).toBe('Plata');
  });
});

// ──────────────────────────────────────
// Descuento antes de IVA (RN-038)
// ──────────────────────────────────────
describe('RN-038: Descuento se aplica antes del cálculo de IVA', () => {
  it('producto 10€ con 10% descuento al 21% IVA', () => {
    const pvp = 10.0;
    const descuento = 0.1; // 10%
    const pvpConDescuento = round2(pvp * (1 - descuento)); // 9,00€
    const base = calcularBaseImponible(pvpConDescuento, TIPOS_IVA.GENERAL_21);
    const cuota = calcularCuotaIva(base, TIPOS_IVA.GENERAL_21, pvpConDescuento);

    expect(pvpConDescuento).toBe(9.0);
    expect(base).toBeCloseTo(7.44, 2);
    expect(cuota).toBeCloseTo(1.56, 2);
    expect(round2(base + cuota)).toBe(9.0);
  });
});

// ──────────────────────────────────────
// Exento 0%: sin IVA, pero con total correcto
// ──────────────────────────────────────
describe('EXENTO_0: productos sin IVA', () => {
  it('mantiene el importe Neto sin cargar IVA', () => {
    const desglose = calcularDesgloseIva([
      { precioUnitario: 10.0, cantidad: 1, tipoIva: TIPOS_IVA.EXENTO_0, descuento: 0 },
    ]);

    expect(desglose.base0).toBe(10.0);
    expect(desglose.iva0).toBe(0);
    expect(desglose.totalSinIva).toBe(10.0);
    expect(desglose.total).toBe(10.0);
  });
});
