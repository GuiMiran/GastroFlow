// ─── TaxLogic ────────────────────────────────────────────────────
// Clasifica automáticamente cada ítem en la categoría impositiva correcta.

import type { OrderItem } from './accounting';

export interface TaxCategory {
  rate: number;
  label: string;
  account: string;
}

export const TAX_CATEGORIES: Record<string, TaxCategory> = {
  FOOD:          { rate: 0.10, label: 'Alimentos (10%)',          account: '700.1' },
  BEVERAGE_AL:   { rate: 0.21, label: 'Bebidas alcohólicas (21%)', account: '700.2' },
  BEVERAGE_SOFT: { rate: 0.10, label: 'Bebidas sin alcohol (10%)', account: '700.3' },
  SERVICE:       { rate: 0.21, label: 'Servicios (21%)',          account: '700.4' },
};

const KEYWORD_MAP: Record<string, string[]> = {
  BEVERAGE_AL:   ['cerveza', 'vino', 'copa', 'cava', 'ron', 'whisky', 'gin', 'cubata'],
  BEVERAGE_SOFT: ['agua', 'refresco', 'zumo', 'café', 'té', 'infusión'],
  SERVICE:       ['cubierto', 'servicio', 'mesa', 'cargo'],
};

/**
 * Classifies a menu item into a tax category using keyword matching on name/category.
 * Falls back to FOOD if no keywords match.
 */
export function classifyItem(item: { name: string; category?: string }): string {
  const haystack = `${item.name} ${item.category ?? ''}`.toLowerCase();

  for (const [categoryKey, keywords] of Object.entries(KEYWORD_MAP)) {
    if (keywords.some((kw) => haystack.includes(kw))) {
      return categoryKey;
    }
  }

  return 'FOOD';
}

export interface TaxBreakdown {
  category: string;
  label: string;
  rate: number;
  subtotal: number;
  vat: number;
}

/**
 * Groups order items by tax category.
 * Returns breakdown for AccountingView display.
 */
export function classifyOrderItems(items: OrderItem[]): TaxBreakdown[] {
  const grouped = new Map<string, number>();

  for (const item of items) {
    const catKey = classifyItem(item);
    const lineTotal = item.price * item.qty;
    grouped.set(catKey, (grouped.get(catKey) ?? 0) + lineTotal);
  }

  return Array.from(grouped.entries()).map(([category, subtotal]) => {
    const cat = TAX_CATEGORIES[category];
    return {
      category,
      label: cat.label,
      rate: cat.rate,
      subtotal,
      vat: subtotal * cat.rate,
    };
  });
}
