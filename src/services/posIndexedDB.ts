// Production-Grade IndexedDB Storage Engine for Axofácil! Maputo POS (Offline-First)
// Provides unlimited offline storage, high-speed indexed lookups, and crash resilience.

import { POSSale, POSCashShift, POSCashMovement, POSSyncLog, POSAuditAction, InventoryItem } from '../types/types';

const DB_NAME = 'AxofacilMaputo_POS_ProductionDB';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

export function isIndexedDBAvailable(): boolean {
  return typeof window !== 'undefined' && 'indexedDB' in window;
}

export function openPOSDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      return resolve(dbInstance);
    }

    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB não está disponível neste navegador'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Sales Store
      if (!db.objectStoreNames.contains('sales')) {
        const salesStore = db.createObjectStore('sales', { keyPath: 'id' });
        salesStore.createIndex('establishmentId', 'establishmentId', { unique: false });
        salesStore.createIndex('date', 'date', { unique: false });
        salesStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        salesStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: false });
      }

      // 2. Shifts Store
      if (!db.objectStoreNames.contains('shifts')) {
        const shiftsStore = db.createObjectStore('shifts', { keyPath: 'id' });
        shiftsStore.createIndex('establishmentId', 'establishmentId', { unique: false });
        shiftsStore.createIndex('status', 'status', { unique: false });
      }

      // 3. Cash Movements Store (Sangrias / Suprimentos)
      if (!db.objectStoreNames.contains('movements')) {
        const movStore = db.createObjectStore('movements', { keyPath: 'id' });
        movStore.createIndex('establishmentId', 'establishmentId', { unique: false });
        movStore.createIndex('shiftId', 'shiftId', { unique: false });
      }

      // 4. Sync Queue Store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const queueStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
        queueStore.createIndex('establishmentId', 'establishmentId', { unique: false });
        queueStore.createIndex('status', 'status', { unique: false });
      }

      // 5. Audit Logs Store
      if (!db.objectStoreNames.contains('auditLogs')) {
        const auditStore = db.createObjectStore('auditLogs', { keyPath: 'id' });
        auditStore.createIndex('establishmentId', 'establishmentId', { unique: false });
        auditStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // 6. Cached Products Catalog (Fast offline barcode lookups)
      if (!db.objectStoreNames.contains('products')) {
        const prodStore = db.createObjectStore('products', { keyPath: 'id' });
        prodStore.createIndex('establishmentId', 'establishmentId', { unique: false });
        prodStore.createIndex('barcode', 'barcode', { unique: false });
        prodStore.createIndex('sku', 'sku', { unique: false });
      }
    };

    request.onsuccess = (event: Event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event: Event) => {
      console.warn('Falha ao abrir IndexedDB para POS:', (event.target as IDBOpenDBRequest).error);
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

// Generic transaction helper
async function runTx<T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  action: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  const db = await openPOSDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = action(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ----------------------------------------------------
// IndexedDB Sales API
// ----------------------------------------------------
export async function idbSaveSale(sale: POSSale): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await runTx('sales', 'readwrite', (store) => store.put(sale));
  } catch (err) {
    console.warn('idbSaveSale fallback:', err);
  }
}

export async function idbGetSales(establishmentId: string): Promise<POSSale[]> {
  if (!isIndexedDBAvailable()) return [];
  try {
    const db = await openPOSDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('sales', 'readonly');
      const store = tx.objectStore('sales');
      const index = store.index('establishmentId');
      const request = index.getAll(IDBKeyRange.only(establishmentId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

// ----------------------------------------------------
// IndexedDB Shifts API
// ----------------------------------------------------
export async function idbSaveShift(shift: POSCashShift): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await runTx('shifts', 'readwrite', (store) => store.put(shift));
  } catch (err) {
    console.warn('idbSaveShift fallback:', err);
  }
}

export async function idbGetShifts(establishmentId: string): Promise<POSCashShift[]> {
  if (!isIndexedDBAvailable()) return [];
  try {
    const db = await openPOSDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('shifts', 'readonly');
      const store = tx.objectStore('shifts');
      const index = store.index('establishmentId');
      const request = index.getAll(IDBKeyRange.only(establishmentId));

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

// ----------------------------------------------------
// IndexedDB Sync Queue API
// ----------------------------------------------------
export async function idbEnqueueSync(item: POSSyncLog): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    await runTx('syncQueue', 'readwrite', (store) => store.put(item));
  } catch (err) {
    console.warn('idbEnqueueSync fallback:', err);
  }
}

export async function idbGetPendingSync(establishmentId: string): Promise<POSSyncLog[]> {
  if (!isIndexedDBAvailable()) return [];
  try {
    const db = await openPOSDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction('syncQueue', 'readonly');
      const store = tx.objectStore('syncQueue');
      const index = store.index('establishmentId');
      const request = index.getAll(IDBKeyRange.only(establishmentId));

      request.onsuccess = () => {
        const all = request.result || [];
        resolve(all.filter(i => i.status === 'pending'));
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    return [];
  }
}

export async function idbMarkSynced(syncId: string): Promise<void> {
  if (!isIndexedDBAvailable()) return;
  try {
    const db = await openPOSDatabase();
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');
    const getReq = store.get(syncId);

    getReq.onsuccess = () => {
      const item = getReq.result;
      if (item) {
        item.status = 'synced';
        item.syncedTimestamp = new Date().toISOString();
        store.put(item);
      }
    };
  } catch (err) {
    console.warn('idbMarkSynced fallback:', err);
  }
}

// ----------------------------------------------------
// IndexedDB Products Cache
// ----------------------------------------------------
export async function idbCacheProducts(establishmentId: string, items: InventoryItem[]): Promise<void> {
  if (!isIndexedDBAvailable() || !items.length) return;
  try {
    const db = await openPOSDatabase();
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    for (const item of items) {
      store.put({ ...item, establishmentId });
    }
  } catch (err) {
    console.warn('idbCacheProducts fallback:', err);
  }
}
