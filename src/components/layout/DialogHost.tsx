import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { ConfirmRequest, ToastItem, subscribeConfirm, subscribeToasts, dismissToast } from "../../services/dialogs";

export default function DialogHost() {
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const unsubConfirm = subscribeConfirm(setConfirmReq);
    const unsubToasts = subscribeToasts(setToasts);
    return () => {
      unsubConfirm();
      unsubToasts();
    };
  }, []);

  const handleResolve = (value: boolean) => {
    if (confirmReq) {
      confirmReq.resolve(value);
      setConfirmReq(null);
    }
  };

  return (
    <>
      {/* Confirm Modal */}
      {confirmReq && (
        <div
          className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => handleResolve(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${confirmReq.danger ? 'bg-red-50' : 'bg-indigo-50'}`}>
              <AlertTriangle className={`w-6 h-6 ${confirmReq.danger ? 'text-red-600' : 'text-indigo-600'}`} />
            </div>
            {confirmReq.title && (
              <h3 className="font-serif font-bold text-lg text-ink mb-1.5">{confirmReq.title}</h3>
            )}
            <p className="text-sm text-ink/70 whitespace-pre-line leading-relaxed mb-6">{confirmReq.message}</p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleResolve(false)}
                className="py-2 px-4 rounded-lg text-sm font-semibold text-ink/70 bg-sand-2/40 hover:bg-sand-2/70 cursor-pointer transition-all"
              >
                {confirmReq.cancelLabel || 'Cancelar'}
              </button>
              <button
                onClick={() => handleResolve(true)}
                className={`py-2 px-4 rounded-lg text-sm font-bold text-white cursor-pointer transition-all shadow-sm ${
                  confirmReq.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-deep hover:bg-indigo-900'
                }`}
              >
                {confirmReq.confirmLabel || 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Stack */}
      <div className="fixed top-4 right-4 z-[1000000] flex flex-col gap-2 max-w-[min(92vw,380px)]">
        {toasts.map((t, idx) => (
          <div
            key={`toast-${t.id || 'toast'}-${idx}`}
            className={`flex items-start gap-2.5 rounded-xl shadow-lg border p-3.5 pr-3 animate-fadeIn ${
              t.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : t.type === 'info'
                ? 'bg-indigo-50 border-indigo-200 text-indigo-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            {t.type === 'error' ? (
              <XCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-red-600" />
            ) : t.type === 'info' ? (
              <Info className="w-4.5 h-4.5 shrink-0 mt-0.5 text-indigo-600" />
            ) : (
              <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5 text-emerald-600" />
            )}
            <p className="text-xs font-semibold leading-snug flex-1">{t.message}</p>
            <button onClick={() => dismissToast(t.id)} className="cursor-pointer opacity-60 hover:opacity-100 shrink-0">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
