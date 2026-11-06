import React, { useState, useEffect } from 'react';
import { PaymentOrderRecord, UserProfile, OrderRecord } from "../../types/types";
import { loadPaymentOrders } from "../../services/paymentStore";
import { loadOrders, saveOrders } from "../../data/data";
import { notify } from "../../services/dialogs";
import { X, Clock, CheckCircle2, AlertTriangle, ShoppingBag, Eye, Store, User, Lock, ShieldCheck, MessageCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface MyPurchasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  onOpenAuth?: (tab?: 'login' | 'criar') => void;
}

export default function MyPurchasesModal({ isOpen, onClose, currentUser, onOpenAuth }: MyPurchasesModalProps) {
  const [paymentOrders, setPaymentOrders] = useState<PaymentOrderRecord[]>([]);
  const [directStoreOrders, setDirectStoreOrders] = useState<OrderRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'todos' | 'directos' | 'pagamentos'>('todos');
  const [adminViewAll, setAdminViewAll] = useState(false);

  const handleCancelOrder = (orderId: string) => {
    const allOrders = loadOrders();
    const updated = allOrders.map(o => o.id === orderId ? { ...o, status: 'Cancelado' as const } : o);
    saveOrders(updated);
    setDirectStoreOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'Cancelado' as const } : o));
    window.dispatchEvent(new CustomEvent('axofacil_orders_updated'));
    notify('A sua encomenda foi cancelada.', 'info');
  };

  useEffect(() => {
    if (isOpen) {
      const allPayments = loadPaymentOrders();
      const allDirects = loadOrders();

      if (!currentUser) {
        setPaymentOrders([]);
        setDirectStoreOrders([]);
        return;
      }

      if (currentUser.role === 'admin' && adminViewAll) {
        setPaymentOrders(allPayments);
        setDirectStoreOrders(allDirects);
        return;
      }

      // Strict user profile isolation
      const rawUserPhone = (currentUser.phone || currentUser.emailOrPhone || '').replace(/\D/g, '');
      const rawUserEmail = (currentUser.email || (currentUser.emailOrPhone.includes('@') ? currentUser.emailOrPhone : '')).toLowerCase().trim();
      const userIdent = currentUser.id || currentUser.emailOrPhone;
      const userName = (currentUser.name || '').toLowerCase().trim();

      const myPayments = allPayments.filter(p => {
        if (p.userId && (p.userId === userIdent || p.userId === currentUser.id || p.userId === currentUser.emailOrPhone)) return true;
        if (rawUserEmail && p.customerEmail && p.customerEmail.toLowerCase().trim() === rawUserEmail) return true;
        if (rawUserPhone && p.customerPhone) {
          const pPhone = p.customerPhone.replace(/\D/g, '');
          if (pPhone && (pPhone === rawUserPhone || pPhone.endsWith(rawUserPhone) || rawUserPhone.endsWith(pPhone))) return true;
        }
        if (userName && p.customerName && p.customerName.toLowerCase().trim() === userName) return true;
        return false;
      });

      const myDirects = allDirects.filter(d => {
        if (d.userId && (d.userId === userIdent || d.userId === currentUser.id || d.userId === currentUser.emailOrPhone)) return true;
        if (rawUserEmail && d.customerEmail && d.customerEmail.toLowerCase().trim() === rawUserEmail) return true;
        if (rawUserPhone && d.customerPhone) {
          const dPhone = d.customerPhone.replace(/\D/g, '');
          if (dPhone && (dPhone === rawUserPhone || dPhone.endsWith(rawUserPhone) || rawUserPhone.endsWith(dPhone))) return true;
        }
        if (userName && d.customerName && d.customerName.toLowerCase().trim() === userName) return true;
        return false;
      });

      setPaymentOrders(myPayments);
      setDirectStoreOrders(myDirects);
    }
  }, [isOpen, currentUser, adminViewAll]);

  if (!isOpen) return null;

  const totalCount = directStoreOrders.length + paymentOrders.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-ink/70 backdrop-blur-xs font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-paper w-full max-w-3xl rounded-3xl shadow-2xl border border-ink/10 overflow-hidden my-auto max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-deep text-white flex justify-between items-center border-b border-white/10 shrink-0">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-indigo-500/20 text-indigo-200 text-xs font-bold py-1 px-3 rounded-full border border-indigo-400/30 mb-1">
              <ShoppingBag className="w-3.5 h-3.5 text-indigo-300" />
              <span>Painel de Compras do Utilizador</span>
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Minhas Compras & Encomendas
            </h2>
            {currentUser && (
              <p className="text-xs text-indigo-200/80 mt-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-sand" />
                <span>Perfil: <strong>{currentUser.name}</strong> ({currentUser.emailOrPhone})</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-paper/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Admin Toggle if Role Admin */}
        {currentUser?.role === 'admin' && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-5 py-2 flex items-center justify-between text-xs text-amber-900 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Modo Administrador Geral
            </span>
            <button
              onClick={() => setAdminViewAll(!adminViewAll)}
              className="text-xs font-bold underline cursor-pointer text-amber-800 hover:text-amber-950"
            >
              {adminViewAll ? 'Ver apenas as minhas compras pessoais' : 'Ver todos os pedidos do sistema'}
            </button>
          </div>
        )}

        {/* Not Logged In State */}
        {!currentUser ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-16 h-16 bg-sand-2 text-indigo-deep rounded-full flex items-center justify-center mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-lg text-ink">Inicie Sessão para Ver as Suas Compras</h3>
            <p className="text-xs text-ink/60 max-w-md mx-auto">
              As compras e agendamentos ficam vinculados exclusivamente à sua conta. Entre ou crie o seu perfil para acompanhar encomendas e recibos.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('login');
                }}
                className="py-2.5 px-5 bg-indigo-deep text-white font-bold text-xs rounded-xl shadow-xs hover:bg-indigo-brand transition-all cursor-pointer"
              >
                Entrar
              </button>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenAuth) onOpenAuth('criar');
                }}
                className="py-2.5 px-5 bg-terracotta text-white font-bold text-xs rounded-xl shadow-xs hover:bg-terracotta/90 transition-all cursor-pointer"
              >
                Criar Conta
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex border-b border-ink/10 bg-sand-2/40 px-5 pt-3 gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('todos')}
                className={`py-2 px-4 rounded-t-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'todos'
                    ? 'bg-paper text-indigo-deep border-t-2 border-indigo-brand shadow-xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Todas as Compras ({totalCount})
              </button>
              <button
                onClick={() => setActiveTab('directos')}
                className={`py-2 px-4 rounded-t-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'directos'
                    ? 'bg-paper text-indigo-deep border-t-2 border-indigo-brand shadow-xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Encomendas nas Lojas ({directStoreOrders.length})
              </button>
              <button
                onClick={() => setActiveTab('pagamentos')}
                className={`py-2 px-4 rounded-t-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'pagamentos'
                    ? 'bg-paper text-indigo-deep border-t-2 border-indigo-brand shadow-xs'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                Pagamentos / Subscrições ({paymentOrders.length})
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {((activeTab === 'todos' || activeTab === 'directos') && directStoreOrders.length > 0) && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-indigo-brand uppercase tracking-wider flex items-center gap-1.5">
                    <Store className="w-4 h-4" />
                    <span>Encomendas Efetuadas nas Lojas</span>
                  </div>

                  {directStoreOrders.map((ord, oIdx) => (
                    <div
                      key={`${ord.id || 'dirord'}-${oIdx}`}
                      className="p-4 bg-white hover:bg-sand-1/30 rounded-2xl border border-ink/12 shadow-2xs transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-ink/10 pb-2.5">
                        <div>
                          <div className="font-bold text-sm text-indigo-deep">{ord.establishmentName}</div>
                          <div className="text-xs text-ink/60">
                            Código: <span className="font-mono font-bold text-ink">{ord.id}</span> • {ord.date} {ord.time && `• ${ord.time}`}
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          ord.status === 'Concluído' 
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' 
                            : ord.status === 'Confirmado' 
                              ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                              : ord.status === 'Cancelado'
                                ? 'bg-rose-100 text-rose-900 border border-rose-300'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}>
                          {ord.status === 'Pendente' ? '⏳ Registado na Loja (Pendente)' : ord.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-ink/60 font-medium">Item / Produto:</span>
                          <div className="font-bold text-ink truncate">{ord.itemsOrService}</div>
                        </div>
                        <div>
                          <span className="text-ink/60 font-medium">Entrega & Pagamento:</span>
                          <div className="font-bold text-indigo-deep">
                            {ord.deliveryOption === 'estafeta_axofacil' ? '🚚 Carrinha' : '🏬 Presencial'} • {ord.paymentMethod}
                          </div>
                        </div>
                        <div className="sm:text-right">
                          <span className="text-ink/60 font-medium">Total:</span>
                          <div className="font-serif font-bold text-base text-terracotta">
                            {ord.totalAmount.toLocaleString()} MT
                          </div>
                        </div>
                      </div>

                      {/* Action Bar: Cancelar Encomenda ou WhatsApp */}
                      <div className="pt-2 border-t border-ink/8 flex flex-wrap justify-between items-center gap-2 text-xs">
                        <div className="text-[11px] text-ink/50">
                          Estado: <strong className="text-ink">{ord.status}</strong>
                        </div>
                        <div className="flex items-center gap-2">
                          {((ord.status || '').toLowerCase() === 'pendente') && (
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(ord.id)}
                              className="py-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                            >
                              Cancelar Encomenda
                            </button>
                          )}
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Gostaria de falar sobre a minha encomenda #${ord.id} (${ord.itemsOrService}) no valor de ${ord.totalAmount} MT.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <MessageCircle className="w-3 h-3 text-emerald-600" />
                            <span>Falar no WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {((activeTab === 'todos' || activeTab === 'pagamentos') && paymentOrders.length > 0) && (
                <div className="space-y-3 pt-3">
                  <div className="text-xs font-bold text-indigo-brand uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Pagamentos & Subscrições Registadas</span>
                  </div>

                  {paymentOrders.map((order, pOrdIdx) => {
                    const dateStr = new Date(order.createdAt).toLocaleDateString('pt-PT', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <div
                        key={`${order.id || 'pmtord'}-${pOrdIdx}`}
                        className="p-4 bg-sand-1/40 hover:bg-sand-1/80 rounded-2xl border border-ink/10 transition-all space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-ink/10 pb-3">
                          <div>
                            <div className="font-bold text-sm text-ink">{order.establishmentName}</div>
                            <div className="text-xs text-ink/60">ID: {order.id} • {dateStr}</div>
                          </div>

                          <div>
                            {order.status === 'pendente' && (
                              <span className="bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                <span>Pendente (Em Validação)</span>
                              </span>
                            )}
                            {order.status === 'confirmado' && (
                              <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Confirmado</span>
                              </span>
                            )}
                            {order.status === 'rejeitado' && (
                              <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>Não Validado</span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-ink/60 font-medium">Itens / Serviços:</span>
                            <div className="font-bold text-ink truncate">{order.orderItemsSummary}</div>
                          </div>
                          <div>
                            <span className="text-ink/60 font-medium">Método & Ref:</span>
                            <div className="font-mono font-bold text-indigo-deep uppercase">
                              {order.paymentMethod.toUpperCase()} • {order.referenceNumber}
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <span className="text-ink/60 font-medium">Valor Total:</span>
                            <div className="font-serif font-bold text-base text-terracotta">
                              {order.totalAmountMT} MT
                            </div>
                          </div>
                        </div>

                        {order.status === 'rejeitado' && order.rejectionReason && (
                          <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-950 space-y-1">
                            <div className="font-bold flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-rose-600" />
                              <span>Motivo da Rejeição:</span>
                            </div>
                            <p>{order.rejectionReason}</p>
                          </div>
                        )}

                        {order.proofUrl && (
                          <div className="pt-1">
                            <a
                              href={order.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs text-indigo-brand font-bold hover:underline"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Ver Imagem do Comprovativo Enviado</span>
                            </a>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {totalCount === 0 && (
                <div className="text-center py-16 space-y-3">
                  <div className="w-16 h-16 bg-sand-2 text-ink/40 rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-ink text-base">Nenhuma compra registada ainda</p>
                  <p className="text-xs text-ink/60 max-w-sm mx-auto">
                    Esta conta ({currentUser.name}) ainda não realizou compras. Assim que efetuar qualquer pedido numa loja, mercado ou hospedagem, o registo aparecerá aqui em tempo real.
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
