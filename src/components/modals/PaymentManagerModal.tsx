import React, { useState, useEffect } from 'react';
import { PaymentOrderRecord } from "../../types/types";
import { loadPaymentOrders, updatePaymentOrderStatus } from "../../services/paymentStore";
import { X, CheckCircle2, AlertTriangle, Eye, ShieldCheck, Filter, Clock, Check, Search, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishmentIdFilter?: string; // If merchant dashboard, filter by store
}

export default function PaymentManagerModal({ isOpen, onClose, establishmentIdFilter }: PaymentManagerModalProps) {
  const [orders, setOrders] = useState<PaymentOrderRecord[]>([]);
  const [filterStatus, setFilterStatus] = useState<'pendente' | 'confirmado' | 'rejeitado' | 'todos'>('pendente');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionModalOrder, setRejectionModalOrder] = useState<PaymentOrderRecord | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshData();
    }
  }, [isOpen]);

  const refreshData = () => {
    let all = loadPaymentOrders();
    if (establishmentIdFilter) {
      all = all.filter(o => o.establishmentId === establishmentIdFilter);
    }
    setOrders(all);
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'todos' && order.status !== filterStatus) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        order.customerName.toLowerCase().includes(term) ||
        order.customerPhone.includes(term) ||
        order.referenceNumber.toLowerCase().includes(term) ||
        order.establishmentName.toLowerCase().includes(term)
      );
    }
    return true;
  });

  const handleApprove = (orderId: string) => {
    updatePaymentOrderStatus(orderId, 'confirmado');
    refreshData();
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionModalOrder) return;
    updatePaymentOrderStatus(rejectionModalOrder.id, 'rejeitado', rejectionReasonInput.trim() || 'Referência de pagamento não foi localizada no extrato bancário/operadora.');
    setRejectionModalOrder(null);
    setRejectionReasonInput('');
    refreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink/70 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-paper w-full max-w-4xl rounded-3xl shadow-2xl border border-ink/10 overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-deep text-white flex justify-between items-center border-b border-white/10 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold py-1 px-3 rounded-full border border-emerald-400/30 mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Painel de Validação de Pagamentos</span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Gestão de Comprovativos & Pedidos
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-paper/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 bg-sand-1/60 border-b border-ink/10 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
            <button
              onClick={() => setFilterStatus('pendente')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'pendente'
                  ? 'bg-amber-500 text-amber-950 font-extrabold shadow-xs'
                  : 'bg-paper text-ink/70 hover:bg-sand-2'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pendentes ({orders.filter(o => o.status === 'pendente').length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('confirmado')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'confirmado'
                  ? 'bg-emerald-600 text-white font-extrabold shadow-xs'
                  : 'bg-paper text-ink/70 hover:bg-sand-2'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Confirmados ({orders.filter(o => o.status === 'confirmado').length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('rejeitado')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'rejeitado'
                  ? 'bg-rose-600 text-white font-extrabold shadow-xs'
                  : 'bg-paper text-ink/70 hover:bg-sand-2'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Rejeitados ({orders.filter(o => o.status === 'rejeitado').length})</span>
            </button>

            <button
              onClick={() => setFilterStatus('todos')}
              className={`py-2 px-3.5 rounded-xl transition-all cursor-pointer ${
                filterStatus === 'todos'
                  ? 'bg-indigo-deep text-paper font-extrabold shadow-xs'
                  : 'bg-paper text-ink/70 hover:bg-sand-2'
              }`}
            >
              Todos ({orders.length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-ink/40 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Pesquisar por cliente, ref ou contacto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-indigo-brand w-full sm:w-64"
            />
          </div>
        </div>

        {/* List of Orders */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-ink/60">
              <FileText className="w-10 h-10 text-ink/30 mx-auto" />
              <p className="font-bold">Nenhum pedido de pagamento nesta categoria</p>
            </div>
          ) : (
            filteredOrders.map((order, idx) => {
              const dateFormatted = new Date(order.createdAt).toLocaleDateString('pt-PT', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              });

              return (
                <div
                  key={`${order.id || 'pmt'}-${idx}`}
                  className="p-4 bg-sand-1/40 rounded-2xl border border-ink/10 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-ink/10 pb-2.5">
                    <div>
                      <div className="font-bold text-sm text-ink">{order.customerName}</div>
                      <div className="text-xs text-ink/60">
                        Tel: <strong className="text-ink font-semibold">{order.customerPhone}</strong> • ID: {order.id} • {dateFormatted}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-lg uppercase bg-indigo-50 text-indigo-deep border border-indigo-200">
                        {order.paymentMethod.toUpperCase()}
                      </span>

                      {order.status === 'pendente' && (
                        <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-2.5 py-1 rounded-full">
                          Pendente
                        </span>
                      )}
                      {order.status === 'confirmado' && (
                        <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-2.5 py-1 rounded-full">
                          Confirmado
                        </span>
                      )}
                      {order.status === 'rejeitado' && (
                        <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold px-2.5 py-1 rounded-full">
                          Rejeitado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Items & Amount */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs items-center">
                    <div className="sm:col-span-6 space-y-0.5">
                      <span className="text-ink/60 font-medium">Destino / Loja:</span>
                      <div className="font-bold text-ink">{order.establishmentName}</div>
                      <div className="text-ink/70">{order.orderItemsSummary}</div>
                    </div>

                    <div className="sm:col-span-3 space-y-0.5">
                      <span className="text-ink/60 font-medium">Ref. Transação:</span>
                      <div className="font-mono font-bold text-indigo-deep text-sm">{order.referenceNumber}</div>
                    </div>

                    <div className="sm:col-span-3 text-left sm:text-right space-y-0.5">
                      <span className="text-ink/60 font-medium">Valor Total em MT:</span>
                      <div className="font-serif font-bold text-lg text-terracotta">{order.totalAmountMT} MT</div>
                    </div>
                  </div>

                  {/* Actions & Proof */}
                  <div className="pt-2 border-t border-ink/10 flex flex-wrap justify-between items-center gap-2">
                    <div>
                      {order.proofUrl ? (
                        <button
                          type="button"
                          onClick={() => setPreviewImageUrl(order.proofUrl || null)}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-brand text-xs font-bold rounded-xl border border-indigo-200 inline-flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Comprovativo (Foto)</span>
                        </button>
                      ) : (
                        <span className="text-[11px] text-ink/50 italic">Sem foto do comprovativo</span>
                      )}
                    </div>

                    {order.status === 'pendente' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setRejectionModalOrder(order)}
                          className="py-1.5 px-3.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl border border-rose-300 transition-all cursor-pointer"
                        >
                          Rejeitar
                        </button>

                        <button
                          onClick={() => handleApprove(order.id)}
                          className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          <span>Confirmar Pagamento</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>

      {/* Rejection Modal Input */}
      {rejectionModalOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-ink/80 font-sans">
          <div className="bg-paper p-6 rounded-3xl max-w-md w-full space-y-4 border border-ink/10 shadow-2xl">
            <h3 className="font-serif font-bold text-lg text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              Rejeitar Pagamento — {rejectionModalOrder.customerName}
            </h3>
            <p className="text-xs text-ink/70">
              Indique o motivo da rejeição para que o cliente possa verificar os dados no seu painel.
            </p>
            <textarea
              required
              rows={3}
              placeholder="Ex: A referência inserida não corresponde a nenhuma transferência no extrato M-Pesa."
              value={rejectionReasonInput}
              onChange={(e) => setRejectionReasonInput(e.target.value)}
              className="w-full p-3 bg-paper border border-ink/20 rounded-xl text-xs text-ink focus:outline-none focus:border-rose-600"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectionModalOrder(null)}
                className="py-2 px-4 bg-sand-2 text-ink text-xs font-bold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                className="py-2 px-5 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Confirmar Rejeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Image Preview Modal */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-ink/90 font-sans">
          <div className="relative max-w-2xl w-full bg-paper p-4 rounded-3xl shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-ink/10 pb-2">
              <span className="font-bold text-xs text-ink">Comprovativo de Transação</span>
              <button
                onClick={() => setPreviewImageUrl(null)}
                className="p-1 text-ink/60 hover:text-ink cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewImageUrl}
              alt="Comprovativo"
              className="max-h-[75vh] w-full object-contain rounded-2xl bg-black/5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
