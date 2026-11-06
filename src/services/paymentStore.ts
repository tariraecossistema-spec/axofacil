import { PaymentOrderRecord } from '../types/types';
import { recordOfflineChange } from './offlineSync';
import { syncPaymentOrderToSupabase, updatePaymentOrderStatusInSupabase } from './supabase';

const PAYMENT_ORDERS_KEY = 'axofacil_pedidos_pagamento';

export const INITIAL_PAYMENT_ORDERS: PaymentOrderRecord[] = [];

export function loadPaymentOrders(): PaymentOrderRecord[] {
  if (typeof localStorage === 'undefined') return [];
  const stored = localStorage.getItem(PAYMENT_ORDERS_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePaymentOrders(orders: PaymentOrderRecord[]): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(PAYMENT_ORDERS_KEY, JSON.stringify(orders));
  recordOfflineChange();
  window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
}

export function createPaymentOrder(order: Omit<PaymentOrderRecord, 'id' | 'createdAt' | 'status'>): PaymentOrderRecord {
  const all = loadPaymentOrders();
  const uuidSegment = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().split('-')[0].toUpperCase()
    : Date.now().toString(36).toUpperCase();

  const newOrder: PaymentOrderRecord = {
    ...order,
    targetType: order.targetType === 'loja' ? 'loja' : 'plataforma',
    id: `PAG-${uuidSegment}`,
    status: 'pendente',
    createdAt: new Date().toISOString()
  };

  all.unshift(newOrder);
  savePaymentOrders(all);

  syncPaymentOrderToSupabase(newOrder as unknown as Record<string, unknown>).catch((err) => {
    console.error('Erro ao registar pedido de pagamento na base de dados:', err);
  });

  return newOrder;
}

export function updatePaymentOrderStatus(
  orderId: string,
  status: 'confirmado' | 'rejeitado',
  notes?: string
): PaymentOrderRecord | null {
  const all = loadPaymentOrders();
  const index = all.findIndex((o) => o.id === orderId);
  if (index === -1) return null;

  all[index].status = status;
  if (status === 'confirmado') {
    all[index].confirmedAt = new Date().toISOString();
  }
  if (notes) {
    if (status === 'rejeitado') {
      all[index].rejectionReason = notes;
    }
    all[index].adminNotes = notes;
  }

  savePaymentOrders(all);
  updatePaymentOrderStatusInSupabase(orderId, status, notes).catch((err) => {
    console.error('Erro ao actualizar estado do pagamento na base de dados:', err);
  });

  return all[index];
}

export function deletePaymentOrder(orderId: string): PaymentOrderRecord[] {
  const all = loadPaymentOrders();
  const updated = all.filter((o) => o.id !== orderId);
  savePaymentOrders(updated);
  return updated;
}

export function clearAllPaymentOrders(): void {
  savePaymentOrders([]);
}
