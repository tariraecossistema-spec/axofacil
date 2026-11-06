// Offline & Synchronization Manager for Axofácil! Maputo Platform

export interface SyncStatusState {
  isOnline: boolean;
  isForcedOffline: boolean;
  effectiveOnline: boolean;
  pendingOfflineChanges: number;
  lastSyncedAt: string | null;
  isSyncing: boolean;
}

const STORAGE_KEYS = {
  FORCED_OFFLINE: 'axofacil_forced_offline_mode',
  PENDING_CHANGES: 'axofacil_pending_offline_changes',
  LAST_SYNCED: 'axofacil_last_synced_time'
};

export function getOfflineSyncStatus(): SyncStatusState {
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const isForcedOffline = localStorage.getItem(STORAGE_KEYS.FORCED_OFFLINE) === 'true';
  const effectiveOnline = isOnline && !isForcedOffline;
  
  const pendingCount = parseInt(localStorage.getItem(STORAGE_KEYS.PENDING_CHANGES) || '0', 10);
  const lastSynced = localStorage.getItem(STORAGE_KEYS.LAST_SYNCED) || null;

  return {
    isOnline,
    isForcedOffline,
    effectiveOnline,
    pendingOfflineChanges: pendingCount,
    lastSyncedAt: lastSynced,
    isSyncing: false
  };
}

export function recordOfflineChange(): number {
  const current = parseInt(localStorage.getItem(STORAGE_KEYS.PENDING_CHANGES) || '0', 10);
  const next = current + 1;
  localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, next.toString());
  window.dispatchEvent(new Event('axofacil_offline_status_changed'));
  return next;
}

export function toggleForcedOfflineMode(): boolean {
  const current = localStorage.getItem(STORAGE_KEYS.FORCED_OFFLINE) === 'true';
  const next = !current;
  localStorage.setItem(STORAGE_KEYS.FORCED_OFFLINE, next.toString());
  window.dispatchEvent(new Event('axofacil_offline_status_changed'));
  return next;
}

export async function syncOfflineDataWithServer(): Promise<{ success: boolean; syncedCount: number }> {
  const status = getOfflineSyncStatus();
  if (!status.effectiveOnline) {
    return { success: false, syncedCount: 0 };
  }

  const countToSync = status.pendingOfflineChanges;

  // Simulate network synchronization with cloud hosting server
  await new Promise(resolve => setTimeout(resolve, 1500));

  const nowStr = new Date().toLocaleDateString('pt-PT') + ' às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  localStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, '0');
  localStorage.setItem(STORAGE_KEYS.LAST_SYNCED, nowStr);

  window.dispatchEvent(new Event('axofacil_offline_status_changed'));

  return { success: true, syncedCount: countToSync };
}
