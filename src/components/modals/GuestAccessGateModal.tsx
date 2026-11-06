import React from 'react';
import { ShieldCheck, Phone, MapPin, ShoppingBag, Truck, X, Sparkles, LogIn, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuestAccessGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: () => void;
  onLogin: () => void;
  onGoogleAuth?: () => void;
  featureName?: string;
}

export default function GuestAccessGateModal({
  isOpen,
  onClose,
  onRegister,
  onLogin,
  onGoogleAuth,
  featureName = 'Informações Adicionais da Loja'
}: GuestAccessGateModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="bg-paper border border-ink/15 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl relative text-ink my-8"
        >
          {/* Top Banner Header */}
          <div className="bg-gradient-to-r from-indigo-deep via-indigo-brand to-indigo-deep p-6 text-paper relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#FBF6EC_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-paper/10 hover:bg-paper/20 text-paper transition-all cursor-pointer"
              title="Fechar janela"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full tracking-wider flex items-center gap-1 shadow-xs">
                <Lock className="w-3 h-3 text-slate-950" />
                <span>Modo de Leitura Básico</span>
              </span>
              <span className="text-[11px] font-bold text-amber-200/90">
                Axofácil! Maputo Security
              </span>
            </div>

            <h2 className="font-serif font-bold text-2xl text-paper tracking-tight leading-snug">
              Crie uma conta para aceder a {featureName}
            </h2>
            <p className="text-xs text-paper/85 mt-2 leading-relaxed">
              Inicie sessão ou crie uma conta gratuita para consultar contactos directos, localização GPS, catálogo completo e fazer encomendas.
            </p>
          </div>

          {/* Modal Content */}
          <div className="p-6 space-y-5">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-deep flex items-center gap-1.5 border-b border-ink/10 pb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Benefícios do Registo Gratuito no Portal Axofácil!:</span>
            </div>

            {/* Feature Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-sand-2/30 border border-ink/8 p-3 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-brand/10 text-indigo-brand shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Contactos Directos</h4>
                  <p className="text-[11px] text-ink/65 leading-tight mt-0.5">
                    Aceda ao número de telefone e WhatsApp verificado do gestor da loja.
                  </p>
                </div>
              </div>

              <div className="bg-sand-2/30 border border-ink/8 p-3 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-terracotta/10 text-terracotta shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Navegação GPS Exacta</h4>
                  <p className="text-[11px] text-ink/65 leading-tight mt-0.5">
                    Veja a localização exacta no mapa, bairro e rota até ao local.
                  </p>
                </div>
              </div>

              <div className="bg-sand-2/30 border border-ink/8 p-3 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-600/10 text-emerald-700 shrink-0">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Encomendas & Carrinho</h4>
                  <p className="text-[11px] text-ink/65 leading-tight mt-0.5">
                    Adicione artigos ao carrinho, escolha quantidades e faça compras.
                  </p>
                </div>
              </div>

              <div className="bg-sand-2/30 border border-ink/8 p-3 rounded-2xl flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-800 shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-ink">Cálculo de Entregas</h4>
                  <p className="text-[11px] text-ink/65 leading-tight mt-0.5">
                    Estime o frete com estafetas parceiros para entrega em Maputo/Matola.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-2.5 pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={onGoogleAuth || onRegister}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2.5 shadow-sm group"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Login com Google IA</span>
              </button>

              <button
                type="button"
                onClick={onRegister}
                className="w-full py-3 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-2xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 group"
              >
                <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
                <span>Criar Conta com E-mail / Telemóvel</span>
              </button>

              <button
                type="button"
                onClick={onLogin}
                className="w-full py-2.5 px-4 bg-paper hover:bg-sand-2/60 text-indigo-deep border border-indigo-deep/20 font-bold text-xs rounded-2xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-indigo-brand" />
                <span>Já tem conta? Iniciar Sessão com Palavra-passe</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-center text-xs text-ink/50 hover:text-ink/80 cursor-pointer font-medium transition-colors"
              >
                Continuar no modo de consulta básica
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
