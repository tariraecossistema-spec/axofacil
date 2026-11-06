import React, { useState, useEffect } from 'react';
import { getOfflineSyncStatus, toggleForcedOfflineMode, syncOfflineDataWithServer, SyncStatusState } from "../../services/offlineSync";
import { Wifi, WifiOff, RefreshCw, CheckCircle2, HardDrive, Sparkles, CloudCheck, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../../types/types';

interface OfflineBannerProps {
  currentUser?: UserProfile | null;
}

export default function OfflineBanner({ currentUser }: OfflineBannerProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>(getOfflineSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [syncedCountMsg, setSyncedCountMsg] = useState(0);

  useEffect(() => {
    const handleStatusUpdate = () => {
      setSyncStatus(getOfflineSyncStatus());
    };

    window.addEventListener('online', handleStatusUpdate);
    window.addEventListener('offline', handleStatusUpdate);
    window.addEventListener('axofacil_offline_status_changed', handleStatusUpdate);

    return () => {
      window.removeEventListener('online', handleStatusUpdate);
      window.removeEventListener('offline', handleStatusUpdate);
      window.removeEventListener('axofacil_offline_status_changed', handleStatusUpdate);
    };
  }, []);

  // Regra de Visibilidade:
  // A barra apenas aparece quando o utilizador está autenticado / tem perfil criado
  // (seja Administrador ou cliente/comerciante com perfil), e NUNCA na navegação normal de visitantes anónimos.
  // IMPORTANTE: este return acontece SEMPRE depois de todos os hooks acima, para nunca mudar
  // o número de hooks executados entre renders (evita o erro React #310 ao logar).
  if (!currentUser) {
    return null;
  }

  const handleManualSync = async () => {
    setIsSyncing(true);
    const res = await syncOfflineDataWithServer();
    setIsSyncing(false);
    if (res.success) {
      setSyncedCountMsg(res.syncedCount);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 4000);
    }
  };

  const handleToggleOffline = () => {
    toggleForcedOfflineMode();
  };

  return (
    <div className="w-full text-xs font-sans select-none">
      {/* Toast Notification on Successful Sync */}
      {showSuccessToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-emerald-900 text-white p-4 rounded-2xl shadow-xl border border-emerald-400/40 flex items-center gap-3 animate-slideUp">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
          <div>
            <div className="font-bold text-sm text-emerald-100">Sincronização Concluída!</div>
            <div className="text-xs text-emerald-200">
              {syncedCountMsg > 0
                ? `${syncedCountMsg} alterações guardadas localmente foram enviadas ao servidor central.`
                : 'A sua conta já está completamente atualizada com o servidor.'}
            </div>
          </div>
        </div>
      )}

      {/* Main Bar */}
      {!syncStatus.effectiveOnline ? (
        <div className="bg-amber-950 text-amber-100 py-2.5 px-[6vw] border-b border-amber-800/60 shadow-inner flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg animate-pulse">
              <WifiOff className="w-4 h-4" />
            </span>
            <div>
              <span className="font-bold text-amber-300">⚡ Modo Offline Ativo (Sem Dados Móveis / Internet)</span>
              <p className="text-[11px] text-amber-200/80">
                Aceda ao seu perfil, faça gestão do inventário, controlo financeiro, equipas e pedidos offline. 
                <strong className="text-amber-100 font-bold ml-1">Tudo é gravado localmente</strong> e será enviado para o servidor assim que se ligar à internet.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {syncStatus.pendingOfflineChanges > 0 && (
              <span className="bg-amber-900/90 text-amber-200 border border-amber-700 text-[10.5px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-amber-400" />
                <span>{syncStatus.pendingOfflineChanges} dados pendentes</span>
              </span>
            )}

            <button
              onClick={handleToggleOffline}
              className="py-1 px-3 bg-amber-800 hover:bg-amber-700 text-amber-100 text-[11px] font-bold rounded-lg border border-amber-600 transition-all cursor-pointer"
            >
              Ligar Conexão
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/90 text-emerald-100 py-1.5 px-[6vw] border-b border-emerald-800/50 flex flex-wrap justify-between items-center gap-2 text-[11px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-emerald-300 flex items-center gap-1">
              <Wifi className="w-3.5 h-3.5" /> Conectado ao Servidor Central
            </span>
            <span className="hidden md:inline text-emerald-200/70">
              • Todos os dados do perfil, inventário e finanças estão sincronizados.
            </span>
          </div>

          <div className="flex items-center gap-3">
            {syncStatus.lastSyncedAt && (
              <span className="text-emerald-300/60 hidden sm:inline text-[10px]">
                Última sync: {syncStatus.lastSyncedAt}
              </span>
            )}

            {syncStatus.pendingOfflineChanges > 0 ? (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="py-0.5 px-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-md border border-emerald-500 transition-all cursor-pointer flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sincronizar {syncStatus.pendingOfflineChanges} alteração(ões)</span>
              </button>
            ) : (
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                className="py-0.5 px-2 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 font-medium rounded-md border border-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                title="Sincronizar manualmente com o servidor"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sincronizado</span>
              </button>
            )}

            <button
              onClick={handleToggleOffline}
              className="py-0.5 px-2 bg-amber-900/60 hover:bg-amber-800 text-amber-200 text-[10px] font-semibold rounded-md border border-amber-700/60 transition-all cursor-pointer"
              title="Testar funcionamento da plataforma no modo offline sem internet"
            >
              Simular Offline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
