// ─── AccountingAgent ─────────────────────────────────────────────
// Cierre de caja diario: ventas vs facturas emitidas.

export interface OrderItem {
  name: string;
  price: number;
  qty: number;
  category?: string;
}

export interface Order {
  id: string;
  customerId?: string;
  items: OrderItem[];
  status: string;
}

export interface Customer {
  id: string;
  name: string;
  nif: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  customerId: string;
  customer?: Customer;
  items: OrderItem[];
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
}

export interface JournalEntry {
  account: string;
  accountName: string;
  debit: number;
  credit: number;
}

/** Single source of truth for 21 % VAT. Import this everywhere; never hardcode 0.21. */
export const VAT_RATE = 0.21;

/**
 * Invariant B-1 — Derives totals from line items.
 * subtotal = Σ(item.price × item.qty); vat = subtotal × VAT_RATE; total = subtotal + vat
 */
export function computeInvoiceFigures(items: OrderItem[]): {
  subtotal: number;
  vat: number;
  total: number;
} {
  const subtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);
  const vat = subtotal * VAT_RATE;
  const total = subtotal + vat;
  return { subtotal, vat, total };
}

/**
 * Invariant B-2 — Returns error if order has no customerId.
 */
export function validateInvoiceable(order: Order): { valid: boolean; error?: string } {
  if (!order.customerId) {
    return { valid: false, error: 'El pedido necesita un cliente asignado.' };
  }
  return { valid: true };
}

/**
 * Invariant B-5 — Returns exactly 3 balanced double-entry journal entries.
 * sum(debit) === sum(credit) === invoice.total
 */
export function generateJournalEntries(invoice: Invoice): JournalEntry[] {
  return [
    { account: '430', accountName: 'Clientes', debit: invoice.total, credit: 0 },
    { account: '700', accountName: 'Ventas', debit: 0, credit: invoice.subtotal },
    { account: '477', accountName: 'IVA Repercutido', debit: 0, credit: invoice.vat },
  ];
}

export interface DailyClosure {
  totalRevenue: number;
  totalVat: number;
  totalSubtotal: number;
  invoiceCount: number;
  pendingCount: number;
  chartData: { name: string; ventas: number; iva: number }[];
}

/**
 * Aggregates data for AccountingView.
 * chartData is an array of { name, ventas, iva } for recharts BarChart.
 */
export function computeDailyClosure(invoices: Invoice[], orders: Order[]): DailyClosure {
  const totalSubtotal = invoices.reduce((s, inv) => s + inv.subtotal, 0);
  const totalVat = invoices.reduce((s, inv) => s + inv.vat, 0);
  const totalRevenue = invoices.reduce((s, inv) => s + inv.total, 0);
  const invoiceCount = invoices.length;
  const pendingCount = orders.filter((o) => o.status !== 'invoiced').length;

  const chartData = invoices.map((inv) => ({
    name: inv.invoiceNumber,
    ventas: inv.subtotal,
    iva: inv.vat,
  }));

  return { totalRevenue, totalVat, totalSubtotal, invoiceCount, pendingCount, chartData };
}

const currencyFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

/**
 * Formats number as Spanish Euro currency.
 * Must be used for ALL monetary display in components.
 */
export function formatCurrency(value: number): string {
  return currencyFormatter.format(value);
}
