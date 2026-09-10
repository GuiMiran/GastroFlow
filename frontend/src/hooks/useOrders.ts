// ─── useOrders ───────────────────────────────────────────────────
// Enriched order data + actions for components.

import { useCallback } from 'react';
import { useApp } from './useApp';
import {
  computeInvoiceFigures,
  validateInvoiceable,
  formatCurrency,
  type Order,
  type Invoice,
  type Customer,
} from '../utils/accounting';
import { generateInvoiceNumber } from '../utils/invoiceGen';

export interface EnrichedOrder extends Order {
  subtotal: number;
  vat: number;
  total: number;
  customer?: Customer;
  invoice?: Invoice;
}

export interface OrderStats {
  totalOrders: number;
  pendingCount: number;
  invoicedCount: number;
}

/** Placeholder customer lookup — replace with real data source later. */
const EMPTY_CUSTOMER: Customer = { id: '', name: '', nif: '' };

export function useOrders() {
  const { appState, dispatch, notify } = useApp();
  const { orders, invoices } = appState;

  // Enrich each order with computed totals + joined invoice
  const enrichedOrders: EnrichedOrder[] = orders.map((order) => {
    const { subtotal, vat, total } = computeInvoiceFigures(order.items);
    const invoice = invoices.find((inv) => inv.orderId === order.id);
    return { ...order, subtotal, vat, total, invoice };
  });

  const stats: OrderStats = {
    totalOrders: orders.length,
    pendingCount: orders.filter((o) => o.status !== 'invoiced').length,
    invoicedCount: orders.filter((o) => o.status === 'invoiced').length,
  };

  const updateOrderStatus = useCallback(
    (orderId: string, status: string) => {
      dispatch({ type: 'UPDATE_ORDER_STATUS', payload: { orderId, status } });
    },
    [dispatch],
  );

  const assignCustomer = useCallback(
    (orderId: string, customerId: string) => {
      dispatch({ type: 'ASSIGN_CUSTOMER', payload: { orderId, customerId } });
      notify('Cliente asignado correctamente', 'success');
    },
    [dispatch, notify],
  );

  const generateInvoice = useCallback(
    (orderId: string, customer: Customer) => {
      const order = orders.find((o) => o.id === orderId);
      if (!order) return;

      const validation = validateInvoiceable(order);
      if (!validation.valid) {
        notify(validation.error!, 'error');
        return;
      }

      const { subtotal, vat, total } = computeInvoiceFigures(order.items);
      const invoiceNumber = generateInvoiceNumber(invoices);

      const invoice: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber,
        orderId: order.id,
        customerId: order.customerId!,
        customer,
        items: order.items,
        subtotal,
        vat,
        total,
        createdAt: new Date().toISOString(),
      };

      dispatch({ type: 'ADD_INVOICE', payload: invoice });
      notify(`Factura ${invoiceNumber} generada — ${formatCurrency(total)}`, 'success');
    },
    [orders, invoices, dispatch, notify],
  );

  return { enrichedOrders, stats, updateOrderStatus, assignCustomer, generateInvoice };
}
