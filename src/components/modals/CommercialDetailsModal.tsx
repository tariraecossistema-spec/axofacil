import React, { useState } from 'react';
import { 
  X, CheckCircle2, Store, ShieldCheck, TrendingUp, 
  MessageCircle, Banknote, ArrowRight, Sparkles, Building2, 
  HelpCircle, ChevronRight, Phone
} from 'lucide-react';

interface CommercialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegister: () => void;
  onSelectPartner: () => void;
}

export default function CommercialDetailsModal({
  isOpen,
  onClose,
  onSelectRegister,
  onSelectPartner
}: CommercialDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'vantagens' | 'passos' | 'custos' | 'perguntas'>('vantagens');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-6 text-slate-900">
        
        {/* Fechar */}
        <button 
          onClick={onClose}
          type="button"
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabeçalho */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#0B254B] text-white flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#103B75] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Guia do Comerciante · Axofácil!
            </span>
            <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mt-1">
              Como Funciona a Adesão ao Directório
            </h3>
          </div>
        </div>

        {/* Tabs de Navegação Rápida */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-5 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('vantagens')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 ${
              activeTab === 'vantagens' 
                ? 'bg-[#0B254B] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Vantagens Chave
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('passos')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 ${
              activeTab === 'passos' 
                ? 'bg-[#0B254B] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Passo a Passo
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('custos')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 ${
              activeTab === 'custos' 
                ? 'bg-[#0B254B] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Preçário & Retorno
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('perguntas')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all shrink-0 ${
              activeTab === 'perguntas' 
                ? 'bg-[#0B254B] text-white shadow-xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Perguntas Frequentes
          </button>
        </div>

        {/* Conteúdo das Tabs */}
        <div className="min-h-[220px]">
          {activeTab === 'vantagens' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#103B75] flex items-center justify-center shrink-0 mt-0.5">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Zero Comissão por Venda</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Diferente de marketplaces que retiram 15% a 25% de cada venda, no Axofácil! 100% da transação com o seu cliente é sua.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Contacto Directo por WhatsApp</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Os clientes clicam e iniciam a conversa imediatamente com o seu número de Moçambique (+258), com foto e referência do artigo já anexados.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Presença nas 11 Províncias</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    Consumidores e empresas que procuram fornecedores na Cidade de Maputo, Matola, Beira, Nampula e Tete encontram a sua loja organizada por segmento.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'passos' && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-[#103B75] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Criar Conta Comercial ou Contactar Equipa</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Preencha o nome do seu negócio, categoria, província e contacto WhatsApp comercial.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-[#103B75] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Carregar Catálogo e Preçário em Meticais</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Adicione fotos dos produtos, preços em Meticais (MT) e descrições dos serviços que oferece.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 bg-white">
                <span className="w-6 h-6 rounded-full bg-[#103B75] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">Publicação e Ativação Imediata</p>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    O seu negócio fica acessível no directório, nas pesquisas locais e nos mapas interactivos.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'custos' && (
            <div className="space-y-3">
              <div className="p-4 bg-blue-50/60 border border-blue-200 rounded-2xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-[#103B75]">Modelo Transparente de Subscrição</span>
                  <span className="text-xs font-extrabold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-blue-200">
                    A partir de 500 MT/mês
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Não existem taxas ocultas, nem percentagens sobre as vendas. Aceitamos liquidação cómoda através de <strong>M-Pesa</strong>, <strong>e-Mola</strong> ou transferência bancária.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <span className="text-lg font-extrabold text-slate-900 block">100% Retorno</span>
                  <span className="text-[11px] text-slate-500">Sem retenção de valores</span>
                </div>
                <div className="p-3 border border-slate-200 rounded-xl bg-slate-50">
                  <span className="text-lg font-extrabold text-slate-900 block">Sem Fidelização</span>
                  <span className="text-[11px] text-slate-500">Cancele quando desejar</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'perguntas' && (
            <div className="space-y-2.5 text-xs text-left">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">Preciso de ter computador para gerir a loja?</p>
                <p className="text-slate-600 mt-0.5">Não. Todo o catálogo pode ser actualizado directamente pelo seu telemóvel.</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-900">E se eu não tiver tempo para registar os produtos?</p>
                <p className="text-slate-600 mt-0.5">A nossa equipa comercial presta assistência na inclusão e formatação do seu catálogo inicial.</p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Acções */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectPartner();
            }}
            className="w-full sm:w-auto text-xs font-bold text-slate-700 hover:text-slate-900 py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors cursor-pointer text-center"
          >
            Quero Inclusão Assistida ↗
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectRegister();
            }}
            className="w-full sm:w-auto text-xs font-bold bg-[#103B75] hover:bg-[#0B254B] text-white py-2.5 px-6 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Registar Minha Conta Comercial</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
