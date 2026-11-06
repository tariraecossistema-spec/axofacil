import React, { useState } from 'react';
import { 
  X, Users, Smartphone, Sparkles, CheckCircle2, Copy, Share2, 
  CreditCard, ShieldCheck, HeartHandshake, ArrowRight, Clock, DollarSign
} from 'lucide-react';
import { notify } from "../../services/dialogs";

interface TravelXitiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripTitle?: string;
  totalAmountMT?: number;
}

export default function TravelXitiqueModal({
  isOpen,
  onClose,
  tripTitle = 'Viagem em Grupo (Voo + Estadia + Passe)',
  totalAmountMT = 48000
}: TravelXitiqueModalProps) {
  const [groupName, setGroupName] = useState('Viagem de Amigos / Família');
  const [participantsCount, setParticipantsCount] = useState(4);
  const [paymentMode, setPaymentMode] = useState<'split_instant' | 'xitique_savings'>('split_instant');
  const [installments, setInstallments] = useState(3);
  const [organizerPhone, setOrganizerPhone] = useState('843005000');
  const [organizerName, setOrganizerName] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const amountPerPerson = Math.ceil(totalAmountMT / participantsCount);
  const installmentPerPerson = Math.ceil(amountPerPerson / installments);

  const handleGenerateGroupPool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizerName.trim()) {
      notify('Por favor introduza o nome do organizador do grupo.', 'error');
      return;
    }

    const uniqueGroupId = `XIT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const link = `${window.location.origin}/xitique/${uniqueGroupId}?quota=${amountPerPerson}&total=${totalAmountMT}`;
    setGeneratedLink(link);
    notify('Grupo de Viagem & Xitique criado com sucesso! Partilhe o link com o grupo.', 'success');
  };

  const handleCopyLink = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      notify('Link copiado para a área de transferência!', 'success');
    }
  };

  const handleShareWhatsApp = () => {
    if (!generatedLink) return;
    const text = `🛫 *Xitique de Viagem Axofácil!* %0A` +
      `Grupo: *${groupName}* %0A` +
      `Destino: *${tripTitle}* %0A` +
      `Quota por pessoa: *${amountPerPerson.toLocaleString('pt-PT')} MT* %0A` +
      `Paga a tua parte por M-Pesa/e-Mola aqui: ${generatedLink}`;
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 my-auto flex flex-col">
        
        {/* Header */}
        <div className="bg-linear-to-r from-slate-950 via-indigo-950 to-cyan-950 text-white p-5 sm:p-6 sticky top-0 z-20 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                  Exclusivo Axofácil! & Inovação Africana
                </span>
              </div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-white">
                Xitique de Viagem & Split M-Pesa
              </h2>
              <p className="text-xs text-slate-300">
                Divida bilhetes e pacotes em grupo ou poupe em conjunto sem juros.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto text-xs">
          
          {/* Concept explanation banner */}
          <div className="bg-linear-to-br from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-2xl space-y-2">
            <div className="font-bold text-amber-950 flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>Como funciona a Poupança Comunitária & Divisão de Viagens?</span>
            </div>
            <p className="text-amber-800 leading-relaxed">
              Inspirado no tradicional <strong>Xitique moçambicano</strong> e no <em>Stokvel</em> africano, este sistema permite que famílias, amigos ou colegas de trabalho reservem voos e férias bloqueando os preços atuais, pagando em quotas divididas por <strong>M-Pesa</strong> ou <strong>e-Mola</strong>.
            </p>
          </div>

          {!generatedLink ? (
            <form onSubmit={handleGenerateGroupPool} className="space-y-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Nome do Grupo / Ocasião *
                </label>
                <input
                  type="text"
                  required
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Ex: Férias Ponta do Ouro com Amigos"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-semibold text-slate-900 outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Nome do Organizador / Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="Ex: Carlos Machel"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-semibold text-slate-900 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Contacto M-Pesa / WhatsApp do Organizador *
                  </label>
                  <input
                    type="tel"
                    required
                    value={organizerPhone}
                    onChange={(e) => setOrganizerPhone(e.target.value)}
                    placeholder="84xxxxxxx ou 86xxxxxxx"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-mono font-bold text-slate-900 outline-hidden"
                  />
                </div>
              </div>

              {/* Number of Members & Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Número de Participantes ({participantsCount} pessoas)
                  </label>
                  <input
                    type="range"
                    min="2"
                    max="20"
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(parseInt(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                    <span>2 pessoas</span>
                    <span>10 pessoas</span>
                    <span>20 pessoas</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Modalidade de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMode('split_instant')}
                      className={`p-2 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                        paymentMode === 'split_instant'
                          ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Divisão Direta
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMode('xitique_savings')}
                      className={`p-2 rounded-xl text-center border font-bold transition-all cursor-pointer ${
                        paymentMode === 'xitique_savings'
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      Xitique 3x Quotas
                    </button>
                  </div>
                </div>
              </div>

              {/* Calculation Summary Card */}
              <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-300">Valor Total da Viagem:</span>
                  <span className="font-serif font-black text-lg text-white">
                    {totalAmountMT.toLocaleString('pt-PT')} MT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Quota por Cada Membro:</span>
                    <span className="font-bold text-amber-400 text-base font-mono">
                      {amountPerPerson.toLocaleString('pt-PT')} MT
                    </span>
                  </div>
                  {paymentMode === 'xitique_savings' && (
                    <div>
                      <span className="text-slate-400 block text-[11px]">Em 3 Prestações Mensais:</span>
                      <span className="font-bold text-emerald-400 text-base font-mono">
                        {installmentPerPerson.toLocaleString('pt-PT')} MT /mês
                      </span>
                    </div>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Garantia de bloqueio de tarifa aérea e quartos sem custo adicional.</span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <Users className="w-4 h-4" />
                  <span>Criar Grupo de Viagem & Gerar Links M-Pesa</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h3 className="font-serif font-bold text-lg text-emerald-950">
                  Xitique de Viagem Criado com Sucesso!
                </h3>
                <p className="text-emerald-800 text-xs max-w-md mx-auto">
                  Cada um dos <strong>{participantsCount} participantes</strong> pode pagar a sua quota de <strong>{amountPerPerson.toLocaleString('pt-PT')} MT</strong> diretamente via M-Pesa através do link exclusivo abaixo:
                </p>
              </div>

              {/* Share Box */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-700 font-bold">
                  Link de Pagamento Compartilhado do Grupo:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={generatedLink}
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 text-xs font-mono text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="bg-slate-800 hover:bg-slate-700 text-white p-2.5 rounded-xl cursor-pointer shrink-0"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Partilhar no Grupo WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      notify('Notificação de cobrança M-Pesa enviada aos membros!', 'info');
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    <span>Solicitar Débito M-Pesa</span>
                  </button>
                </div>
              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setGeneratedLink(null)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-semibold cursor-pointer"
                >
                  Criar outro grupo de viagem
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
