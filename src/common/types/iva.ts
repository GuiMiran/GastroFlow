import { Prisma } from '@prisma/client';

type Decimal = Prisma.Decimal;

// ─── IVA Types (RN-001, POL-001) ───

export const TIPOS_IVA = {
  GENERAL_21: 0.21,
  REDUCIDO_10: 0.10,
  SUPERREDUCIDO_4: 0.04,
  EXENTO_0: 0.00,
} as const;

export type TipoIvaValue = (typeof TIPOS_IVA)[keyof typeof TIPOS_IVA];

/**
 * RN-002: En B2C el precio de carta INCLUYE IVA.
 * base = precio / (1 + tipo_iva)
 */
export function calcularBaseImponible(precioConIva: number, tipoIva: number): number {
  return round2(precioConIva / (1 + tipoIva));
}

/**
 * Cuota IVA = precioConIva - base
 * Calculada como diferencia para evitar descuadres de redondeo.
 * INV-003: tolerancia ±0,01€
 */
export function calcularCuotaIva(baseImponible: number, tipoIva: number, precioConIva?: number): number {
  if (precioConIva !== undefined) {
    return round2(precioConIva - baseImponible);
  }
  return round2(baseImponible * tipoIva);
}

/**
 * Redondeo bancario a 2 decimales
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Convierte Prisma Decimal a number
 */
export function decimalToNumber(d: Decimal | number): number {
  if (typeof d === 'number') return d;
  return d.toNumber();
}

/**
 * Desglose IVA de un conjunto de líneas
 * RN-003: desglosar cada base y cuota por tipo
 */
export interface DesgloseIva {
  base0: number;
  iva0: number;
  base4: number;
  iva4: number;
  base10: number;
  iva10: number;
  base21: number;
  iva21: number;
  totalSinIva: number;
  totalIva: number;
  total: number;
}

export interface LineaParaDesglose {
  precioUnitario: number;
  cantidad: number;
  tipoIva: number;
  descuento?: number;
}

/**
 * Calcula el desglose IVA de múltiples líneas
 */
export function calcularDesgloseIva(lineas: LineaParaDesglose[]): DesgloseIva {
  const desglose: DesgloseIva = {
    base0: 0, iva0: 0,
    base4: 0, iva4: 0,
    base10: 0, iva10: 0,
    base21: 0, iva21: 0,
    totalSinIva: 0, totalIva: 0, total: 0,
  };

  for (const linea of lineas) {
    const importeBruto = linea.precioUnitario * linea.cantidad;
    const descuento = linea.descuento ?? 0;
    const importeNeto = importeBruto - descuento; // RN-038: IVA después del descuento
    const base = calcularBaseImponible(importeNeto, linea.tipoIva);
    const cuota = calcularCuotaIva(base, linea.tipoIva, importeNeto);

    if (linea.tipoIva === TIPOS_IVA.EXENTO_0) {
      desglose.base0 = round2(desglose.base0 + base);
      desglose.iva0 = round2(desglose.iva0 + cuota);
    } else if (linea.tipoIva === TIPOS_IVA.SUPERREDUCIDO_4) {
      desglose.base4 = round2(desglose.base4 + base);
      desglose.iva4 = round2(desglose.iva4 + cuota);
    } else if (linea.tipoIva === TIPOS_IVA.REDUCIDO_10) {
      desglose.base10 = round2(desglose.base10 + base);
      desglose.iva10 = round2(desglose.iva10 + cuota);
    } else {
      desglose.base21 = round2(desglose.base21 + base);
      desglose.iva21 = round2(desglose.iva21 + cuota);
    }
  }

  desglose.totalSinIva = round2(desglose.base0 + desglose.base4 + desglose.base10 + desglose.base21);
  desglose.totalIva = round2(desglose.iva0 + desglose.iva4 + desglose.iva10 + desglose.iva21);
  desglose.total = round2(desglose.totalSinIva + desglose.totalIva);

  return desglose;
}
