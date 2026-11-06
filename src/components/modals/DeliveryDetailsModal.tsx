import React, { useState } from 'react';
import { 
  X, Truck, ShieldCheck, Lock, MapPin, 
  Banknote, ArrowRight, CheckCircle2, Phone, MessageSquare
} from 'lucide-react';

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister: () => void;
}

export default function DeliveryDetailsModal({
  isOpen,
  onClose,
  onOpenRegister
}: DeliveryDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'garantias' | 'tarifas' | 'rotas'>('garantias');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-6 text-slate-900">
        
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
            <Truck className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#103B75] bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              Rede de Entregas & Fretes Axofácil!
            </span>
            <h3 className="font-bold text-xl sm:text-2xl text-slate-900 mt-1">
              Garantias e Regulamento de Entregas
            </h3>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-100 pb-3 mb-5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('garantias')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'garantias' 
                ? 'bg-[#0B254B] text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Garantias Anti-Burla
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('tarifas')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'tarifas' 
                ? 'bg-[#0B254B] text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Preços & Meticais
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rotas')}
            className={`px-3 py-1.5 rounded-xl cursor-pointer transition-all ${
              activeTab === 'rotas' 
                ? 'bg-[#0B254B] text-white' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Zonas e Cobertura
          </button>
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px] text-xs">
          {activeTab === 'garantias' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#103B75] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Verificação Documental</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Estafetas com selo verificado apresentam Carta de Condução e BI registados na plataforma para assegurar a idoneidade das encomendas.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-start gap-3">
                <Lock className="w-5 h-5 text-[#103B75] shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Acordo Directo e Seguro</h4>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Os valores de frete são combinados antes do levantamento do pacote, eliminando cobranças surpresa na entrega ao cliente.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tarifas' && (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="font-bold text-[#103B75]">Como funciona a remuneração?</p>
                <p className="text-slate-600 mt-1 leading-relaxed">
                  O estafeta recebe 100% da quantia acordada para a rota. A subscrição de 300 MT/mês serve apenas para manter o perfil listado activamente para lojas e clientes.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block font-extrabold text-sm text-slate-900">Moto-Táxi</span>
                  <span className="text-[11px] text-slate-500">Pequenas encomendas & compras</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <span className="block font-extrabold text-sm text-slate-900">Furgão / Pick-up</span>
                  <span className="text-[11px] text-slate-500">Materiais, móveis & cargas pesadas</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rotas' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#103B75] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Grande Maputo & Matola</p>
                  <p className="text-slate-600">Baixa, Polana, Sommerschield, Central, Matola Rio, Malhampsene, Zimpeto, Marracuene e Boane.</p>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#103B75] shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900">Rotas Interurbanas</p>
                  <p className="text-slate-600">Fretes programados para Xai-Xai, Chókwè, Inhambane e Beira mediante marcação prévia.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com Acções */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 py-2.5 px-4 rounded-xl cursor-pointer"
          >
            Fechar
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenRegister();
            }}
            className="text-xs font-bold bg-[#0B254B] hover:bg-[#061833] text-white py-2.5 px-5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Quero Cadastrar-me (300 MT/mês)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
