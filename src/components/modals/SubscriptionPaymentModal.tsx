import React, { useState, useEffect } from 'react';
import { UserProfile, PaymentOrderRecord } from '../../types/types';
import { 
  X, ShieldCheck, CheckCircle2, Copy, Check, Smartphone, Building2, 
  Sparkles, ArrowRight, MessageSquare, AlertCircle, Info, Upload, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createPaymentOrder } from '../../services/paymentStore';
import { notify } from '../../services/dialogs';
import FileUpload from '../shared/FileUpload';
import { loadPlatformSettings } from '../../services/platformConfig';

interface SubscriptionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  defaultPlan?: 'bronze' | 'prata' | 'ouro' | 'cliente_mensal' | 'cliente_semestral' | 'cliente_anual';
  isTrialOffer?: boolean;
  onTrialBypass?: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionPaymentModal({
  isOpen,
  onClose,
  currentUser,
  defaultPlan = 'prata',
  isTrialOffer = true,
  onTrialBypass,
  onSuccess
}: SubscriptionPaymentModalProps) {
  // Plan selection
  const [selectedPlanType, setSelectedPlanType] = useState<'business' | 'client'>(
    currentUser && currentUser.role === 'cliente' ? 'client' : 'business'
  );

  const [businessPlan, setBusinessPlan] = useState<'bronze' | 'prata' | 'ouro'>(
    defaultPlan === 'bronze' || defaultPlan === 'prata' || defaultPlan === 'ouro' ? defaultPlan : 'prata'
  );

  const [clientPlan, setClientPlan] = useState<'mensal' | 'semestral' | 'anual'>(
    defaultPlan === 'cliente_mensal' ? 'mensal' : defaultPlan === 'cliente_semestral' ? 'semestral' : 'anual'
  );

  // Popup de aviso dos 15 dias grátis: o utilizador vê o popup e pode ignorá-lo para seguir com o pagamento
  const [showTrialPopup, setShowTrialPopup] = useState(isTrialOffer);

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'emola' | 'mpesa' | 'transferencia_bancaria'>('emola');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [payerName, setPayerName] = useState(currentUser?.name || currentUser?.displayName || currentUser?.storeName || '');
  const [payerPhone, setPayerPhone] = useState(currentUser?.emailOrPhone || currentUser?.phone || '');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirmedRecord, setConfirmedRecord] = useState<PaymentOrderRecord | null>(null);

  // Sincronizar dados do utilizador e plano padrão sempre que a modal abre ou o utilizador muda
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setPayerName(currentUser.name || currentUser.displayName || currentUser.storeName || '');
        setPayerPhone(currentUser.emailOrPhone || currentUser.phone || '');
        if (currentUser.role === 'cliente') {
          setSelectedPlanType('client');
        } else {
          setSelectedPlanType('business');
        }
      }

      if (defaultPlan === 'bronze' || defaultPlan === 'prata' || defaultPlan === 'ouro') {
        setBusinessPlan(defaultPlan);
      } else if (defaultPlan === 'cliente_mensal') {
        setClientPlan('mensal');
        setSelectedPlanType('client');
      } else if (defaultPlan === 'cliente_semestral') {
        setClientPlan('semestral');
        setSelectedPlanType('client');
      } else if (defaultPlan === 'cliente_anual') {
        setClientPlan('anual');
        setSelectedPlanType('client');
      }

      // Abre com o popup de 15 dias grátis ativo se isTrialOffer for true
      setShowTrialPopup(isTrialOffer);
      setIsSubmitted(false);
      setConfirmedRecord(null);
    }
  }, [isOpen, currentUser, defaultPlan, isTrialOffer]);

  if (!isOpen) return null;

  // Plan Pricing & Payment Accounts — lidos das definições editáveis no
  // painel administrativo (Registos & Perfis > Definições da Plataforma)
  const platformSettings = loadPlatformSettings();
  const { businessPlans, clientPlans, paymentAccounts } = platformSettings;

  const getPlanDetails = () => {
    if (selectedPlanType === 'business') {
      if (businessPlan === 'bronze') {
        return { ...businessPlans.bronze, duration: '30 dias', period: 'Mensal' };
      }
      if (businessPlan === 'prata') {
        return { ...businessPlans.prata, duration: '30 dias', period: 'Mensal' };
      }
      return { ...businessPlans.ouro, duration: '30 dias', period: 'Mensal' };
    } else {
      if (clientPlan === 'mensal') {
        return { ...clientPlans.mensal, duration: '30 dias', period: 'Mensal' };
      }
      if (clientPlan === 'semestral') {
        return { ...clientPlans.semestral, duration: '180 dias', period: 'Semestral' };
      }
      return { ...clientPlans.anual, duration: '365 dias', period: 'Anual' };
    }
  };

  const plan = getPlanDetails();

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!payerName.trim()) {
      notify('Por favor, indique o seu nome ou nome do estabelecimento.', 'warning');
      return;
    }

    if (!referenceNumber.trim()) {
      notify('Por favor, insira o código de confirmação da transação (M-Pesa / e-Mola / BIM).', 'warning');
      return;
    }

    const order = createPaymentOrder({
      customerName: payerName.trim(),
      customerPhone: payerPhone.trim(),
      customerEmail: currentUser?.email || '',
      targetType: 'plataforma',
      establishmentName: currentUser?.storeName || (selectedPlanType === 'business' ? 'Subscrição Comercial Axofácil' : 'Acesso Cliente Axofácil'),
      orderItemsSummary: `${plan.name} (${plan.priceMT} MT - ${plan.period})`,
      subtotalAmountMT: plan.priceMT,
      deliveryFeeMT: 0,
      totalAmountMT: plan.priceMT,
      paymentMethod: paymentMethod,
      referenceNumber: referenceNumber.trim().toUpperCase(),
      proofUrl: proofUrl || undefined,
      deliveryOption: 'pickup'
    });

    setConfirmedRecord(order);
    setIsSubmitted(true);
    notify('Pedido de subscrição enviado. Aguarda validação.', 'success');

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm font-sans">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl relative z-10 overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-[#15243f] to-slate-900 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-serif font-black text-base sm:text-lg text-white">
                  {showTrialPopup ? '🎁 Oferta Especial de Boas-Vindas' : 'Fluxo de Pagamento da Subscrição'}
                </h3>
                <p className="text-[11px] text-slate-300">
                  {showTrialPopup ? '15 Dias 100% Grátis · Pode ignorar e seguir com o pagamento' : 'e-Mola, M-Pesa ou Transferência Bancária BIM'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
            {/* TELA 1: POP-UP DE 15 DIAS GRÁTIS (Pode ser ignorado para seguir com o fluxo de pagamento) */}
            {showTrialPopup && !isSubmitted ? (
              <div className="space-y-5 py-2 animate-fadeIn">
                <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                      <Sparkles className="w-7 h-7 animate-pulse" />
                    </div>
                    <div className="space-y-2 flex-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10.5px] font-black uppercase tracking-wider">
                        🎁 15 Dias 100% Grátis
                      </div>
                      <h4 className="font-serif font-black text-lg sm:text-xl text-white leading-snug">
                        Experimente a Axofácil! Sem Custos nos Primeiros 15 Dias!
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        A sua nova conta tem direito aos <strong>primeiros 15 dias grátis</strong> para explorar o diretório, cadastrar produtos, publicar promoções e receber contactos.
                      </p>
                      <p className="text-xs text-amber-300 font-medium">
                        💡 Pode usufruir do teste gratuito agora OU ignorar este aviso e seguir diretamente para o pagamento manual do plano escolhido ({plan.name} · {plan.priceMT} MT).
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3 relative z-10">
                    <button
                      type="button"
                      onClick={() => {
                        if (onTrialBypass) {
                          onTrialBypass();
                        } else {
                          notify('🎉 Período experimental de 15 dias ativado! Bom trabalho.', 'success');
                          onClose();
                        }
                      }}
                      className="flex-1 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CheckCircle2 className="w-4 h-4 text-slate-950" />
                      <span>Começar com 15 Dias Grátis</span>
                      <ArrowRight className="w-4 h-4 text-slate-950" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowTrialPopup(false)}
                      className="flex-1 py-3.5 px-4 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span>Ignorar e Seguir para Pagamento</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-600 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-slate-500" />
                    <span>Deseja pagar antecipadamente por e-Mola, M-Pesa ou BIM?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowTrialPopup(false)}
                    className="text-xs font-bold text-[#103B75] hover:underline cursor-pointer"
                  >
                    Ver Meios de Pagamento →
                  </button>
                </div>
              </div>
            ) : isSubmitted && confirmedRecord ? (
              <div className="text-center py-6 space-y-4 animate-fadeIn">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-9 h-9 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-serif font-black text-xl text-slate-900">
                    Comprovativo Registado!
                  </h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                    A referência <strong>{confirmedRecord.referenceNumber}</strong> para <strong>{plan.name}</strong> ({plan.priceMT} MT) foi submetida com sucesso ao sistema financeiro da Axofácil!.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left max-w-md mx-auto space-y-2">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">ID da Ordem:</span>
                    <span className="font-mono font-bold text-slate-800">{confirmedRecord.id}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Valor Pago:</span>
                    <span className="font-bold text-slate-900">{confirmedRecord.totalAmountMT} MT</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5">
                    <span className="text-slate-500">Método Utilizado:</span>
                    <span className="font-bold uppercase text-slate-800">{confirmedRecord.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estado de Validação:</span>
                    <span className="font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                      Pendente de Aprovação
                    </span>
                  </div>
                </div>

                {/* Direct WhatsApp Confirmation Button */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                  <a
                    href={`https://wa.me/258871425316?text=${encodeURIComponent(
                      `Olá Administração Axofácil!, acabei de submeter o pagamento manual de subscrição:\n` +
                      `• Ordem: ${confirmedRecord.id}\n` +
                      `• Titular: ${payerName}\n` +
                      `• Plano: ${plan.name}\n` +
                      `• Valor: ${plan.priceMT} MT\n` +
                      `• Referência: ${confirmedRecord.referenceNumber}\n` +
                      `Peço por favor a activação imediata da conta.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Enviar Comprovativo no WhatsApp</span>
                  </a>

                  <button
                    onClick={onClose}
                    className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* 15 Days Free Trial Announcement Banner */}
                {isTrialOffer && (
                  <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 border-2 border-emerald-500/40 rounded-3xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="flex items-start gap-3.5 relative z-10">
                      <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/40 shrink-0">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <div className="space-y-1.5 flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                          🎁 15 Dias 100% Grátis
                        </div>
                        <h4 className="font-serif font-black text-base sm:text-lg text-white leading-snug">
                          Experimente a Plataforma AxoFácil Sem Pagar Agora!
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          O seu perfil recém-criado tem direito aos <strong>primeiros 15 dias grátis</strong> para cadastrar produtos, publicar promoções e receber pedidos.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row gap-2 relative z-10">
                      <button
                        type="button"
                        onClick={() => {
                          if (onTrialBypass) {
                            onTrialBypass();
                          } else {
                            notify('🎉 Período experimental de 15 dias ativado! Bom trabalho.', 'success');
                            onClose();
                          }
                        }}
                        className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl text-xs font-black transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4 text-slate-950" />
                        <span>Avançar com 15 Dias Grátis (Começar Agora)</span>
                        <ArrowRight className="w-4 h-4 text-slate-950" />
                      </button>
                    </div>

                    <p className="text-[11px] text-emerald-300/80 text-center mt-2 font-medium">
                      💡 Ou, se desejar garantir a subscrição contínua já paga, preencha o pagamento abaixo:
                    </p>
                  </div>
                )}

                {/* 1. Account / Plan Type Switcher */}
                <div>
                  <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold mb-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPlanType('business')}
                      className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                        selectedPlanType === 'business'
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🏢 Estabelecimento / Loja
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedPlanType('client')}
                      className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                        selectedPlanType === 'client'
                          ? 'bg-white text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      👤 Acesso de Cliente
                    </button>
                  </div>

                  {/* Plan Cards */}
                  {selectedPlanType === 'business' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => setBusinessPlan('bronze')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          businessPlan === 'bronze'
                            ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Base</span>
                        <div className="font-serif font-bold text-sm text-slate-900 mt-0.5">{businessPlans.bronze.priceMT} MT</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Directório e contacto</p>
                      </div>

                      <div
                        onClick={() => setBusinessPlan('prata')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                          businessPlan === 'prata'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded block w-max">
                          Destaque
                        </span>
                        <div className="font-serif font-bold text-sm text-slate-900 mt-0.5">{businessPlans.prata.priceMT.toLocaleString()} MT</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Top da lista e promoções</p>
                      </div>

                      <div
                        onClick={() => setBusinessPlan('ouro')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all relative overflow-hidden ${
                          businessPlan === 'ouro'
                            ? 'border-[#15243f] bg-[#15243f]/5 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-white bg-[#15243f] px-1 py-0.2 rounded block w-max">
                          VIP + Frete
                        </span>
                        <div className="font-serif font-bold text-sm text-slate-900 mt-0.5">{businessPlans.ouro.priceMT.toLocaleString()} MT</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Contactos de estafetas</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      <div
                        onClick={() => setClientPlan('mensal')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          clientPlan === 'mensal'
                            ? 'border-amber-600 bg-amber-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Mensal</span>
                        <div className="font-serif font-bold text-sm text-slate-900 mt-0.5">{clientPlans.mensal.priceMT} MT</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">30 dias de acesso total</p>
                      </div>

                      <div
                        onClick={() => setClientPlan('semestral')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          clientPlan === 'semestral'
                            ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded block w-max">
                          6 Meses
                        </span>
                        <div className="font-serif font-bold text-sm text-slate-900 mt-0.5">{clientPlans.semestral.priceMT} MT</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Poupança de 50%</p>
                      </div>

                      <div
                        onClick={() => setClientPlan('anual')}
                        className={`p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                          clientPlan === 'anual'
                            ? 'border-[#15243f] bg-[#15243f]/5 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <span className="text-[9px] font-black uppercase text-white bg-[#15243f] px-1 py-0.2 rounded block w-max">
                          12 Meses
                        </span>
                        <div className="font-serif font-bold text-sm text-slate-900 mt-0.5">{clientPlans.anual.priceMT.toLocaleString()} MT</div>
                        <p className="text-[10px] text-slate-500 mt-0.5">Acesso 365 dias</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Manual Payment Accounts Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Escolha o Canal de Pagamento Manual:
                  </label>

                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('emola')}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        paymentMethod === 'emola'
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                      <div className="font-bold text-xs text-slate-900">e-Mola</div>
                      <div className="text-[10px] text-slate-500">Movitel</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mpesa')}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        paymentMethod === 'mpesa'
                          ? 'border-red-500 bg-red-50/50 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Smartphone className="w-5 h-5 text-red-600 mx-auto mb-1" />
                      <div className="font-bold text-xs text-slate-900">M-Pesa</div>
                      <div className="text-[10px] text-slate-500">Vodacom</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transferencia_bancaria')}
                      className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                        paymentMethod === 'transferencia_bancaria'
                          ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Building2 className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                      <div className="font-bold text-xs text-slate-900">Millennium BIM</div>
                      <div className="text-[10px] text-slate-500">Transferência</div>
                    </button>
                  </div>

                  {/* Payment Account Credentials & Copy Buttons */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    {paymentMethod === 'emola' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Número e-Mola:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-sm">{paymentAccounts.emola.numero}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(paymentAccounts.emola.numero, 'emola')}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'emola' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'emola' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11.5px] text-slate-600 flex justify-between">
                          <span>Titular da Conta:</span>
                          <span className="font-bold text-slate-900">{paymentAccounts.emola.titular}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          📱 <strong>Instruções USSD:</strong> Marque <strong>*898#</strong> &gt; Opção 1 (Transferir Dinheiro) &gt; Inserir número <strong>{paymentAccounts.emola.numero}</strong> &gt; Valor <strong>{plan.priceMT} MT</strong>.
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'mpesa' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Número M-Pesa:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-sm">{paymentAccounts.mpesa.numero} / {paymentAccounts.emola.numero}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(paymentAccounts.mpesa.numero, 'mpesa')}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'mpesa' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'mpesa' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11.5px] text-slate-600 flex justify-between">
                          <span>Titular da Conta:</span>
                          <span className="font-bold text-slate-900">{paymentAccounts.mpesa.titular}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200/80">
                          📱 <strong>Instruções USSD:</strong> Marque <strong>*150#</strong> &gt; Opção 1 (Transferir Dinheiro) &gt; Inserir número <strong>{paymentAccounts.mpesa.numero}</strong> &gt; Valor <strong>{plan.priceMT} MT</strong>.
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'transferencia_bancaria' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-600">Nº de Conta BIM:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm">{paymentAccounts.banco.numero}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(paymentAccounts.banco.numero, 'bim')}
                              className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              {copiedField === 'bim' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedField === 'bim' ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        </div>
                        <div className="text-[11.5px] text-slate-600 flex justify-between">
                          <span>Titular:</span>
                          <span className="font-bold text-slate-900">{paymentAccounts.banco.titular}</span>
                        </div>
                        <div className="text-[11.5px] text-slate-600 flex justify-between">
                          <span>NIB / Iban:</span>
                          <span className="font-mono font-bold text-slate-900 text-xs">{paymentAccounts.banco.numero}</span>
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Total a Transferir:</span>
                      <span className="font-serif font-black text-base text-slate-950">
                        {plan.priceMT} MT
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Payer Info & Reference Code Input */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Nome do Titular / Loja:
                    </label>
                    <input
                      type="text"
                      required
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="Ex: Pastelaria Maputo"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:border-amber-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Código de Referência da Transação:
                    </label>
                    <input
                      type="text"
                      required
                      value={referenceNumber}
                      onChange={(e) => setReferenceNumber(e.target.value)}
                      placeholder="Ex: MP260905.8891 ou EML871"
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:border-amber-500 outline-none placeholder:font-sans placeholder:normal-case"
                    />
                  </div>
                </div>

                {/* 4. Optional Proof Upload */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Anexar Foto do Comprovativo / Screenshot (Opcional):
                  </label>
                  <FileUpload
                    onUploadSuccess={(url) => setProofUrl(url)}
                    currentUrl={proofUrl}
                    label="Anexar Comprovativo de Pagamento (M-Pesa / e-Mola / Banco)"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    {isTrialOffer && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onTrialBypass) {
                            onTrialBypass();
                          } else {
                            notify('🎉 Período experimental de 15 dias ativado! Bom trabalho.', 'success');
                            onClose();
                          }
                        }}
                        className="px-3.5 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Avançar com 15 Dias Grátis</span>
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="flex-1 py-3 px-4 bg-[#15243f] hover:bg-[#0A1E3F] text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Confirmar Pagamento ({plan.priceMT} MT)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
