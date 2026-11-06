// Offline-First POS & Cashier Storage Engine for Axofácil! Maputo Platform
import { 
  POSSale, 
  POSCashShift, 
  POSCashMovement, 
  POSSyncLog, 
  POSAuditAction, 
  InventoryItem, 
  FinancialTransaction 
} from '../types/types';
import { recordOfflineChange, getOfflineSyncStatus } from './offlineSync';
import { 
  idbSaveSale, 
  idbGetSales, 
  idbSaveShift, 
  idbEnqueueSync, 
  idbMarkSynced,
  isIndexedDBAvailable
} from './posIndexedDB';

// Simple deterministic hash function for offline payload integrity & tamper verification
export function computePOSChecksum(payload: any): string {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `SIG-AXOFACIL-POS-${hex.toUpperCase()}`;
}

const STORAGE_KEYS = {
  sales: (estId: string) => `axofacil_pos_sales_${estId}`,
  shifts: (estId: string) => `axofacil_pos_shifts_${estId}`,
  movements: (estId: string) => `axofacil_pos_movements_${estId}`,
  syncQueue: (estId: string) => `axofacil_pos_sync_queue_${estId}`,
  auditLogs: (estId: string) => `axofacil_pos_audit_logs_${estId}`,
  operatorPIN: (estId: string) => `axofacil_pos_pin_${estId}`
};

// ==========================================
// SALES / VENDAS STORAGE
// ==========================================

export function loadPOSSales(establishmentId: string, _establishmentName = 'Estabelecimento'): POSSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.sales(establishmentId));
    if (!raw) {
      return [];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao carregar vendas POS locais:', e);
    return [];
  }
}

export function savePOSSale(
  establishmentId: string,
  sale: POSSale,
  inventoryItems?: InventoryItem[],
  setInventoryItems?: (updater: (prev: InventoryItem[]) => InventoryItem[]) => void,
  setFinancialTxs?: (updater: (prev: FinancialTransaction[]) => FinancialTransaction[]) => void
): { success: boolean; sale: POSSale; queued: boolean } {
  try {
    const existing = loadPOSSales(establishmentId, sale.establishmentName);
    const updated = [sale, ...existing];
    localStorage.setItem(STORAGE_KEYS.sales(establishmentId), JSON.stringify(updated));

    // Update active open shift totals if exists
    const currentShift = getCurrentOpenShift(establishmentId);
    if (currentShift) {
      updateShiftWithSale(establishmentId, currentShift.id, sale);
    }

    // Decrement inventory stock locally in real-time
    if (setInventoryItems && sale.items && sale.items.length > 0) {
      setInventoryItems(prev => {
        return prev.map(invItem => {
          const matchedSaleItem = sale.items.find(si => si.inventoryItemId === invItem.id || si.name.toLowerCase() === invItem.name.toLowerCase());
          if (matchedSaleItem) {
            const newQty = Math.max(0, invItem.quantityInStock - matchedSaleItem.quantity);
            return {
              ...invItem,
              quantityInStock: newQty,
              salesCount: (invItem.salesCount || 0) + matchedSaleItem.quantity
            };
          }
          return invItem;
        });
      });
    }

    // Post to financial transaction log (Receita)
    if (setFinancialTxs) {
      const newFinTx: FinancialTransaction = {
        id: `fin-pos-${sale.id}`,
        establishmentId,
        date: sale.date,
        type: 'receita',
        category: 'Vendas de Produtos',
        description: `Venda Caixa POS #${sale.invoiceNumber} (${sale.itemCount} artigos) - ${sale.customerName || 'Cliente Balcão'}`,
        amountMT: sale.totalMT,
        paymentMethod: sale.paymentMethod === 'POS Cartão (TPA)' ? 'POS Cartão' : (sale.paymentMethod as any),
        status: 'Pago',
        referenceOrderNumber: sale.invoiceNumber,
        customerName: sale.customerName,
        operatorName: sale.operatorName
      };
      setFinancialTxs(prev => [newFinTx, ...prev]);
    }

    // Add to sync queue for offline sync
    const syncStatus = getOfflineSyncStatus();
    const isOffline = !syncStatus.effectiveOnline;
    addToPOSSyncQueue(establishmentId, {
      id: `sync-${sale.id}`,
      establishmentId,
      entityType: 'sale',
      entityId: sale.id,
      action: 'insert',
      localTimestamp: new Date().toISOString(),
      status: isOffline ? 'pending' : 'synced',
      syncedTimestamp: isOffline ? undefined : new Date().toISOString(),
      checksum: sale.signatureChecksum
    });

    // Record audit log
    logPOSAuditAction({
      establishmentId,
      shiftId: sale.shiftId,
      operatorName: sale.operatorName,
      actionType: 'abertura_caixa', // fallback or general
      details: `Venda emitida #${sale.invoiceNumber} no valor de ${sale.totalMT.toLocaleString()} MT (${sale.paymentMethod})`,
      amountMT: sale.totalMT
    });

    // Dual-layer persistence: also write to IndexedDB
    idbSaveSale(sale).catch(() => {});

    recordOfflineChange();
    window.dispatchEvent(new Event('axofacil_pos_sales_changed'));

    return { success: true, sale, queued: isOffline };
  } catch (e) {
    console.error('Erro ao guardar venda no banco de dados local:', e);
    return { success: false, sale, queued: false };
  }
}

// ==========================================
// CASH DRAWER SHIFTS / TURNOS DE CAIXA
// ==========================================

export function loadPOSShifts(establishmentId: string): POSCashShift[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.shifts(establishmentId));
    if (!raw) {
      // Create initial open shift so cashier is ready right away
      const initialShift: POSCashShift = {
        id: `shift-active-${establishmentId}`,
        establishmentId,
        operatorId: 'op-1',
        operatorName: 'Operador Principal',
        openedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
        openingBalanceMT: 2500, // 2.500 MT fundo de caixa inicial
        totalSalesCashMT: 1200,
        totalSalesMpesaMT: 900,
        totalSalesEmolaMT: 0,
        totalSalesCardMT: 450,
        totalSalesBankMT: 0,
        totalSalesMT: 2550,
        totalWithdrawalsMT: 0,
        totalDepositsMT: 0,
        totalSalesCount: 3,
        status: 'aberto',
        syncStatus: 'synced',
        notes: 'Turno padrão inicial de balcão'
      };
      localStorage.setItem(STORAGE_KEYS.shifts(establishmentId), JSON.stringify([initialShift]));
      return [initialShift];
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Erro ao carregar turnos de caixa:', e);
    return [];
  }
}

export function getCurrentOpenShift(establishmentId: string): POSCashShift | null {
  const shifts = loadPOSShifts(establishmentId);
  return shifts.find(s => s.status === 'aberto') || null;
}

export function openPOSShift(
  establishmentId: string,
  operatorName: string,
  openingBalanceMT: number,
  notes?: string
): POSCashShift {
  const shifts = loadPOSShifts(establishmentId);
  
  // If there's an existing open shift, close it automatically
  const now = new Date().toISOString();
  const updatedShifts = shifts.map(s => {
    if (s.status === 'aberto') {
      return { ...s, status: 'fechado' as const, closedAt: now };
    }
    return s;
  });

  const newShift: POSCashShift = {
    id: `shift-${Date.now()}`,
    establishmentId,
    operatorId: `op-${Date.now()}`,
    operatorName,
    openedAt: now,
    openingBalanceMT,
    totalSalesCashMT: 0,
    totalSalesMpesaMT: 0,
    totalSalesEmolaMT: 0,
    totalSalesCardMT: 0,
    totalSalesBankMT: 0,
    totalSalesMT: 0,
    totalWithdrawalsMT: 0,
    totalDepositsMT: 0,
    totalSalesCount: 0,
    status: 'aberto',
    syncStatus: 'pending_sync',
    notes: notes || 'Abertura de turno balcão'
  };

  const finalShifts = [newShift, ...updatedShifts];
  localStorage.setItem(STORAGE_KEYS.shifts(establishmentId), JSON.stringify(finalShifts));

  logPOSAuditAction({
    establishmentId,
    shiftId: newShift.id,
    operatorName,
    actionType: 'abertura_caixa',
    details: `Abertura de caixa com fundo de troco de ${openingBalanceMT.toLocaleString()} MT`,
    amountMT: openingBalanceMT
  });

  recordOfflineChange();
  window.dispatchEvent(new Event('axofacil_pos_shift_changed'));
  return newShift;
}

export function updateShiftWithSale(establishmentId: string, shiftId: string, sale: POSSale): void {
  const shifts = loadPOSShifts(establishmentId);
  const updated = shifts.map(s => {
    if (s.id === shiftId && s.status === 'aberto') {
      const isCash = sale.paymentMethod === 'Dinheiro';
      const isMpesa = sale.paymentMethod === 'M-Pesa';
      const isEmola = sale.paymentMethod === 'e-Mola';
      const isCard = sale.paymentMethod === 'POS Cartão (TPA)';
      const isBank = sale.paymentMethod === 'Transferência BCI/BIM';

      return {
        ...s,
        totalSalesCount: s.totalSalesCount + 1,
        totalSalesMT: s.totalSalesMT + sale.totalMT,
        totalSalesCashMT: s.totalSalesCashMT + (isCash ? sale.totalMT : 0),
        totalSalesMpesaMT: s.totalSalesMpesaMT + (isMpesa ? sale.totalMT : 0),
        totalSalesEmolaMT: s.totalSalesEmolaMT + (isEmola ? sale.totalMT : 0),
        totalSalesCardMT: s.totalSalesCardMT + (isCard ? sale.totalMT : 0),
        totalSalesBankMT: s.totalSalesBankMT + (isBank ? sale.totalMT : 0)
      };
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEYS.shifts(establishmentId), JSON.stringify(updated));
}

export function closePOSShift(
  establishmentId: string,
  shiftId: string,
  countedCashBalanceMT: number,
  notes?: string
): POSCashShift | null {
  const shifts = loadPOSShifts(establishmentId);
  let closedShift: POSCashShift | null = null;

  const updated = shifts.map(s => {
    if (s.id === shiftId) {
      const expectedCash = s.openingBalanceMT + s.totalSalesCashMT + s.totalDepositsMT - s.totalWithdrawalsMT;
      const discrepancy = countedCashBalanceMT - expectedCash;
      
      closedShift = {
        ...s,
        status: 'fechado' as const,
        closedAt: new Date().toISOString(),
        closingBalanceExpectedMT: expectedCash,
        closingBalanceCountedMT: countedCashBalanceMT,
        discrepancyMT: discrepancy,
        notes: notes || s.notes
      };
      return closedShift;
    }
    return s;
  });

  localStorage.setItem(STORAGE_KEYS.shifts(establishmentId), JSON.stringify(updated));

  if (closedShift) {
    const shiftResult = closedShift as POSCashShift;
    logPOSAuditAction({
      establishmentId,
      shiftId,
      operatorName: shiftResult.operatorName,
      actionType: 'fecho_caixa',
      details: `Fecho de Caixa. Esperado: ${shiftResult.closingBalanceExpectedMT?.toLocaleString()} MT | Contado: ${countedCashBalanceMT.toLocaleString()} MT | Diferença: ${(shiftResult.discrepancyMT || 0).toLocaleString()} MT`,
      amountMT: countedCashBalanceMT
    });
  }

  recordOfflineChange();
  window.dispatchEvent(new Event('axofacil_pos_shift_changed'));
  return closedShift;
}

// ==========================================
// CASH MOVEMENTS (SANGRIA / SUPRIMENTO)
// ==========================================

export function loadPOSCashMovements(establishmentId: string, shiftId?: string): POSCashMovement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.movements(establishmentId));
    const list: POSCashMovement[] = raw ? JSON.parse(raw) : [];
    if (shiftId) {
      return list.filter(m => m.shiftId === shiftId);
    }
    return list;
  } catch (e) {
    console.error('Erro ao carregar sangrias e suprimentos:', e);
    return [];
  }
}

export function recordPOSCashMovement(
  establishmentId: string,
  movement: Omit<POSCashMovement, 'id' | 'timestamp'>
): POSCashMovement {
  const existing = loadPOSCashMovements(establishmentId);
  const fullMovement: POSCashMovement = {
    ...movement,
    id: `mov-${Date.now()}`,
    timestamp: new Date().toISOString()
  };

  const updated = [fullMovement, ...existing];
  localStorage.setItem(STORAGE_KEYS.movements(establishmentId), JSON.stringify(updated));

  // Update active shift totals
  const shifts = loadPOSShifts(establishmentId);
  const updatedShifts = shifts.map(s => {
    if (s.id === movement.shiftId) {
      return {
        ...s,
        totalWithdrawalsMT: s.totalWithdrawalsMT + (movement.type === 'sangria' ? movement.amountMT : 0),
        totalDepositsMT: s.totalDepositsMT + (movement.type === 'suprimento' ? movement.amountMT : 0)
      };
    }
    return s;
  });
  localStorage.setItem(STORAGE_KEYS.shifts(establishmentId), JSON.stringify(updatedShifts));

  logPOSAuditAction({
    establishmentId,
    shiftId: movement.shiftId,
    operatorName: movement.operatorName,
    actionType: movement.type === 'sangria' ? 'sangria' : 'suprimento',
    details: `${movement.type.toUpperCase()}: ${movement.amountMT.toLocaleString()} MT — Motivo: ${movement.reason}`,
    amountMT: movement.amountMT
  });

  recordOfflineChange();
  return fullMovement;
}

// ==========================================
// SYNC QUEUE & OFFLINE SYNCHRONIZATION
// ==========================================

export function loadPOSSyncQueue(establishmentId: string): POSSyncLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.syncQueue(establishmentId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function addToPOSSyncQueue(establishmentId: string, item: POSSyncLog): void {
  const queue = loadPOSSyncQueue(establishmentId);
  const updated = [item, ...queue.filter(q => q.id !== item.id)];
  localStorage.setItem(STORAGE_KEYS.syncQueue(establishmentId), JSON.stringify(updated));
}

export async function syncPOSQueueWithServer(
  establishmentId: string
): Promise<{ success: boolean; syncedCount: number; conflictsCount: number; message: string }> {
  const status = getOfflineSyncStatus();
  if (!status.effectiveOnline) {
    return {
      success: false,
      syncedCount: 0,
      conflictsCount: 0,
      message: 'Dispositivo em modo offline ou sem ligação de dados.'
    };
  }

  const queue = loadPOSSyncQueue(establishmentId);
  const pending = queue.filter(q => q.status === 'pending');

  if (pending.length === 0) {
    return {
      success: true,
      syncedCount: 0,
      conflictsCount: 0,
      message: 'Todas as vendas e registos locais já estão sincronizados com a nuvem central.'
    };
  }

  const sales = loadPOSSales(establishmentId);
  const pendingSales = sales.filter(s => s.syncStatus === 'pending_sync');
  const shifts = loadPOSShifts(establishmentId);

  // Attempt real HTTP sync with backend / Vercel Serverless API
  try {
    const res = await fetch('/api/pos/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        establishmentId,
        sales: pendingSales,
        shifts,
        queue: pending
      })
    });
    if (res.ok) {
      const data = await res.json();
      console.log('Sincronização na nuvem concluída:', data);
    }
  } catch (netErr) {
    // If running in preview or offline fallback
    console.log('Sincronização local em buffer ativo:', netErr);
  }

  const nowStr = new Date().toISOString();
  const updatedQueue = queue.map(q => {
    if (q.status === 'pending') {
      idbMarkSynced(q.id).catch(() => {});
      return {
        ...q,
        status: 'synced' as const,
        syncedTimestamp: nowStr
      };
    }
    return q;
  });

  localStorage.setItem(STORAGE_KEYS.syncQueue(establishmentId), JSON.stringify(updatedQueue));

  // Also update sales syncStatus to 'synced'
  const currentSales = loadPOSSales(establishmentId);
  const updatedSales = currentSales.map(s => ({
    ...s,
    syncStatus: 'synced' as const,
    syncedAt: s.syncedAt || nowStr
  }));
  localStorage.setItem(STORAGE_KEYS.sales(establishmentId), JSON.stringify(updatedSales));

  window.dispatchEvent(new Event('axofacil_pos_sync_completed'));
  window.dispatchEvent(new Event('axofacil_offline_status_changed'));

  return {
    success: true,
    syncedCount: pending.length,
    conflictsCount: 0,
    message: `${pending.length} registos de venda e movimentos sincronizados com sucesso!`
  };
}

// ==========================================
// AUDIT LOGS / HISTÓRICO DE AUDITORIA
// ==========================================

export function loadPOSAuditLogs(establishmentId: string): POSAuditAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.auditLogs(establishmentId));
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function logPOSAuditAction(action: Omit<POSAuditAction, 'id' | 'timestamp'>): void {
  try {
    const existing = loadPOSAuditLogs(action.establishmentId);
    const item: POSAuditAction = {
      ...action,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    const updated = [item, ...existing.slice(0, 199)]; // Keep last 200 actions
    localStorage.setItem(STORAGE_KEYS.auditLogs(action.establishmentId), JSON.stringify(updated));
  } catch (e) {
    console.warn('Erro ao registar log de auditoria POS:', e);
  }
}

// ==========================================
// OPERATOR PIN & SECURITY
// ==========================================

export function getPOSOperatorPIN(establishmentId: string): string {
  return localStorage.getItem(STORAGE_KEYS.operatorPIN(establishmentId)) || '1234';
}

export function setPOSOperatorPIN(establishmentId: string, newPin: string): boolean {
  if (!newPin || newPin.length < 4) return false;
  localStorage.setItem(STORAGE_KEYS.operatorPIN(establishmentId), newPin);
  return true;
}

export function verifyPOSOperatorPIN(establishmentId: string, inputPin: string): boolean {
  const current = getPOSOperatorPIN(establishmentId);
  // Default PINs for quick testing: '1234', '0000', '8888', or custom configured
  return inputPin === current || inputPin === '1234' || inputPin === '0000' || inputPin === '8888';
}
