// ─── InvoiceGen ──────────────────────────────────────────────────
// Renderiza documentos profesionales listos para imprimir o enviar por WhatsApp.

import { formatCurrency, type Invoice, type Customer, type OrderItem } from './accounting';

// Unicode escape sequences — evita problemas de codificación de fichero en Windows
const EM = {
  receipt:  '\u{1F9FE}', // 🧾
  doc:      '\u{1F4C4}', // 📄
  calendar: '\u{1F4C5}', // 📅
  person:   '\u{1F464}', // 👤
  id:       '\u{1F194}', // 🆔
  food:     '\u{1F37D}', // 🍽
  money:    '\u{1F4B0}', // 💰
  label:    '\u{1F3F7}', // 🏷
  thanks:   '\u{1F64F}', // 🙏
  phone:    '\u{1F4F2}', // 📲
};

/**
 * Returns next sequential invoice number.
 * Format: GF-YYYY-NNNN (e.g. GF-2026-0101)
 */
export function generateInvoiceNumber(existingInvoices: Invoice[]): string {
  const year = new Date().getFullYear();
  const seq = String(existingInvoices.length + 1).padStart(4, '0');
  return `GF-${year}-${seq}`;
}

// ─── WhatsApp plain-text ─────────────────────────────────────────

const SEP = '━━━━━━━━━━━━━━━━━━';

function formatItemLine(name: string, qty: number, lineTotal: number): string {
  const label = qty > 1 ? `${name} (x${qty})` : name;
  const formatted = formatCurrency(lineTotal);
  const totalWidth = 38;
  const usedWidth = label.length + formatted.length;
  const dots = '.'.repeat(Math.max(3, totalWidth - usedWidth));
  return `\u2022 ${label} ${dots} ${formatted}`;
}

/**
 * Returns WhatsApp-ready plain text with emoji formatting.
 * Used for wa.me deep-link.
 */
export function renderInvoiceText(invoice: Invoice): string {
  const date = new Date(invoice.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const customerName = invoice.customer?.name ?? '\u2014';
  const customerNif = invoice.customer?.nif ?? '\u2014';

  const detailLines = invoice.items.map((item) =>
    formatItemLine(item.name, item.qty, item.price * item.qty),
  );

  return [
    `${EM.receipt} *GASTROFLOW \u2014 FACTURA*`,
    '',
    `${EM.doc} N\u00BA: ${invoice.invoiceNumber}`,
    `${EM.calendar} Fecha: ${date}`,
    '',
    `${EM.person} *Cliente:* ${customerName}`,
    `${EM.id} *NIF:* ${customerNif}`,
    '',
    SEP,
    `${EM.food} *Detalle de consumo*`,
    SEP,
    '',
    ...detailLines,
    '',
    SEP,
    '',
    `${EM.money} Base Imponible: ${formatCurrency(invoice.subtotal)}`,
    `${EM.receipt} IVA: ${formatCurrency(invoice.vat)}`,
    '',
    SEP,
    `${EM.label} *TOTAL: ${formatCurrency(invoice.total)}*`,
    SEP,
    '',
    `${EM.thanks} Gracias por su visita`,
    `${EM.phone} *GastroFlow v1.0*`,
  ].join('\n');
}

/**
 * Builds a wa.me deep-link with the invoice text pre-filled.
 */
export function buildWhatsAppLink(invoice: Invoice): string {
  return `https://wa.me/?text=${encodeURIComponent(renderInvoiceText(invoice))}`;
}

// ─── Printable HTML ──────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Returns printable HTML string injected into an iframe for window.print().
 * Styled with inline CSS for print compatibility.
 */
export function renderInvoiceHTML(invoice: Invoice, customer: Customer): string {
  const date = new Date(invoice.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const rows = invoice.items
    .map(
      (item) => `
      <tr>
        <td style="padding:6px 0;border-bottom:1px solid #e2e8f0">${escapeHtml(item.name)}</td>
        <td style="padding:6px 8px;text-align:center;border-bottom:1px solid #e2e8f0">${item.qty}</td>
        <td style="padding:6px 0;text-align:right;border-bottom:1px solid #e2e8f0">${formatCurrency(item.price)}</td>
        <td style="padding:6px 0;text-align:right;border-bottom:1px solid #e2e8f0">${formatCurrency(item.price * item.qty)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Factura ${escapeHtml(invoice.invoiceNumber)}</title>
  <style>
    @media print { body { margin: 0; } }
    body { font-family: 'Inter', Arial, sans-serif; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 40px 32px; }
    h1 { font-size: 1.4rem; margin: 0 0 4px; }
    .subtitle { color: #64748b; font-size: 0.85rem; margin-bottom: 24px; }
    .meta { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .meta-block { font-size: 0.85rem; line-height: 1.6; }
    .meta-block strong { display: block; font-size: 0.75rem; text-transform: uppercase; color: #64748b; margin-bottom: 2px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.88rem; margin-bottom: 24px; }
    th { text-align: left; padding: 8px 0; border-bottom: 2px solid #1e293b; font-size: 0.75rem; text-transform: uppercase; color: #64748b; }
    th:nth-child(2) { text-align: center; }
    th:nth-child(3), th:nth-child(4) { text-align: right; }
    .totals { text-align: right; font-size: 0.92rem; line-height: 2; }
    .totals .grand { font-size: 1.3rem; font-weight: 800; }
    .footer { margin-top: 32px; text-align: center; font-size: 0.8rem; color: #94a3b8; }
  </style>
</head>
<body>
  <h1>GastroFlow</h1>
  <p class="subtitle">Factura ${escapeHtml(invoice.invoiceNumber)}</p>

  <div class="meta">
    <div class="meta-block">
      <strong>Cliente</strong>
      ${escapeHtml(customer.name)}<br>
      NIF: ${escapeHtml(customer.nif)}
    </div>
    <div class="meta-block" style="text-align:right">
      <strong>Fecha</strong>
      ${date}
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Concepto</th><th>Ud.</th><th>Precio</th><th>Importe</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    Base imponible: ${formatCurrency(invoice.subtotal)}<br>
    IVA (21 %): ${formatCurrency(invoice.vat)}<br>
    <span class="grand">TOTAL: ${formatCurrency(invoice.total)}</span>
  </div>

  <p class="footer">Gracias por su visita — GastroFlow</p>
</body>
</html>`;
}
