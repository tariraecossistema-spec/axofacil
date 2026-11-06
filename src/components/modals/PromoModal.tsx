import React, { useState } from 'react';
import { UserProfile, PromoDeal, Establishment } from "../../types/types";
import { X, Sparkles, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PromoModalProps {
  category: 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'turismo';
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  setActivePage: (page: any) => void;
  deals: PromoDeal[];
  setDeals: (dls: PromoDeal[]) => void;
  establishments: Establishment[];
}

export default function PromoModal({ category, isOpen, onClose, currentUser, setActivePage, deals, setDeals, establishments }: PromoModalProps) {
  const [promoText, setPromoText] = useState('');
  const [requestedRank, setRequestedRank] = useState(1);
  const [swatchColor, setSwatchColor] = useState('#C97A3B');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // Filter establishments that match current user's role to associate the deal
  const myEstablishments = establishments.filter(
    e => e.category === category && (currentUser ? (e.contactPhone === currentUser.emailOrPhone || e.name.toLowerCase() === currentUser.name.toLowerCase()) : false)
  );

  const matchedEst = myEstablishments[0] || establishments.find(e => e.category === category);

  const handlePublishDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoText.trim()) return;

    // Build the deal
    const dealId = 'deal_' + Date.now();
    const newDeal: PromoDeal = {
      id: dealId,
      establishmentId: matchedEst ? matchedEst.id : (category === 'loja' ? 'l1' : category === 'bar' ? 'b1' : category === 'turismo' ? 't1' : 'h1'),
      title: matchedEst ? matchedEst.name : (category === 'loja' ? 'Loja Baixa Têxtil' : category === 'bar' ? 'Kanimambo Bar' : category === 'turismo' ? 'Axofácil! Turismo & Viagens' : 'Pensão Girassol'),
      subtitle: promoText,
      category: category,
      rank: requestedRank,
      color: swatchColor
    };

    // Update existing deals, removing any previous deal for this rank or pushing
    const filteredDeals = deals.filter(d => !(d.category === category && d.rank === requestedRank));
    const updated = [newDeal, ...filteredDeals].sort((a, b) => a.rank - b.rank);
    
    setDeals(updated);
    localStorage.setItem('axofacil_deals', JSON.stringify(updated));

    // Also update the associated establishment's promotion text!
    if (matchedEst) {
      const updatedEsts = establishments.map(est => {
        if (est.id === matchedEst.id) {
          return {
            ...est,
            promotion: promoText
          };
        }
        return est;
      });
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEsts));
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2500);
  };

  const getCatColor = () => {
    return category === 'loja' ? 'indigo-brand' : category === 'bar' ? 'terracotta' : category === 'turismo' ? 'cyan-700' : 'coral-brand';
  };

  const colorsList = category === 'loja' 
    ? ['#0B254B', '#1E3A8A', '#061833', '#3B82F6']
    : category === 'bar'
      ? ['#C97A3B', '#E39A57', '#a1561b', '#fca350']
      : category === 'turismo'
        ? ['#0E7490', '#22B8CF', '#0B5A70', '#67D6E8']
        : ['#D9553F', '#EE7E67', '#a8321e', '#ff9885'];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-indigo-deep/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        {/* Background Click Close */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-paper border border-ink/12 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative z-10 p-6 md:p-8 flex flex-col"
        >
          {/* Header */}
          <div className="flex justify-between items-start border-b border-ink/10 pb-4 mb-5">
            <div>
              <h2 className="font-serif font-bold text-xl text-indigo-deep">
                {category === 'loja' ? 'Promoção de Lojas' : category === 'bar' ? 'Promoção de Bares' : category === 'turismo' ? 'Promoção de Pacotes de Turismo' : 'Promoção de Hospedagens'}
              </h2>
              <p className="text-xs text-ink/50 mt-1">Sugerir oferta ou enviar imagem para o Top 10 em destaque</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-sand-2/40 text-ink/40 hover:text-ink cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* CHECK IF LOGGED IN BUSINESS */}
          {!currentUser ? (
            <div className="space-y-5 py-2">
              <div className="bg-[#F5DFC4] border border-[#7A4A15]/15 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#7A4A15] uppercase tracking-wider mb-0.5">Conta Comercial Necessária</h4>
                  <p className="text-xs text-ink/75 leading-relaxed">
                    Apenas estabelecimentos parceiros com conta comercial ativa no Axofácil! podem sugerir promoções para o Top 10 da cidade.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => { onClose(); setActivePage('auth'); }}
                  className="btn btn-primary py-3 text-xs font-semibold text-center rounded-xl cursor-pointer"
                >
                  Entrar ou Criar Perfil Comercial
                </button>
                <button
                  onClick={onClose}
                  className="btn bg-paper border border-ink/12 py-3 text-xs font-semibold text-ink text-center rounded-xl hover:bg-sand-2/10 cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : currentUser.role === 'cliente' ? (
            <div className="space-y-5 py-2">
              <div className="bg-[#F5DFC4] border border-[#7A4A15]/15 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-[#7A4A15] uppercase tracking-wider mb-0.5">Perfil de Cliente</h4>
                  <p className="text-xs text-ink/75 leading-relaxed">
                    Você está logado como Cliente. Sugestões de promoção são restritas aos donos de estabelecimentos e administradores comerciais de Maputo.
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="btn btn-primary py-3 w-full text-xs font-semibold rounded-xl cursor-pointer"
              >
                Entendido
              </button>
            </div>
          ) : (
            /* SUBMIT PROMOTION FORM */
            <div>
              {submitted ? (
                <div className="text-center py-8 space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-indigo-deep">Promoção Enviada!</h3>
                  <p className="text-xs text-ink/60 leading-relaxed max-w-xs mx-auto">
                    A tua oferta especial foi recebida, publicada no Top {requestedRank} e já está visível para todos os clientes em tempo real!
                  </p>
                </div>
              ) : (
                <form onSubmit={handlePublishDeal} className="space-y-4">
                  
                  {matchedEst && (
                    <div className="text-xs bg-sand-2/20 p-3 rounded-lg border border-ink/5">
                      <span className="text-ink/40">Negócio Associado: </span>
                      <span className="font-bold text-indigo-deep">{matchedEst.name}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1.5">Rank Desejado no Top 10</label>
                    <select 
                      value={requestedRank} 
                      onChange={(e) => setRequestedRank(Number(e.target.value))}
                      className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n, idx) => (
                        <option key={`rank-opt-${n}-${idx}`} value={n}>Posição #{n}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1.5">Slogan / Texto da Promoção</label>
                    <input 
                      type="text" 
                      placeholder="ex: Laurentina Dose Dupla das 18h às 20h"
                      value={promoText}
                      onChange={(e) => setPromoText(e.target.value)}
                      required
                      maxLength={40}
                      className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                    />
                    <span className="text-[10px] text-ink/40 mt-1 block">Máximo 40 caracteres para caber perfeitamente no carrossel.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1.5">Escolha a Cor do Cartão</label>
                    <div className="flex gap-2">
                      {colorsList.map((c, cIdx) => (
                        <button
                          key={`color-swatch-${c}-${cIdx}`}
                          type="button"
                          onClick={() => setSwatchColor(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${
                            swatchColor === c ? 'border-indigo-deep scale-110 shadow-xs' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full btn btn-primary py-3.5 rounded-xl font-semibold text-xs mt-6 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-sand" />
                    <span>Publicar Oferta Especial</span>
                  </button>
                </form>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
