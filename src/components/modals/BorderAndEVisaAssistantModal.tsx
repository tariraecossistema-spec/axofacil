import React, { useState } from 'react';
import { 
  X, Globe, ShieldCheck, FileText, CheckCircle2, AlertTriangle, 
  DollarSign, Plane, MapPin, Search, Download, ExternalLink, HelpCircle
} from 'lucide-react';
import { notify } from "../../services/dialogs";

interface BorderAndEVisaAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 28 Visa-exempt countries for tourism in Mozambique (Decree 10/2023)
const VISA_EXEMPT_COUNTRIES = [
  'África do Sul', 'Portugal', 'Brasil', 'Angola', 'Estados Unidos', 'Reino Unido', 
  'Alemanha', 'França', 'Itália', 'Espanha', 'Canadá', 'Japão', 'China', 'Rússia',
  'Emirados Árabes Unidos', 'Arábia Saudita', 'Bélgica', 'Suíça', 'Suécia', 'Noruega',
  'Dinamarca', 'Finlândia', 'Holanda', 'Coreia do Sul', 'Singapura', 'Indonésia', 'Costa do Marfim', 'Gana'
];

export default function BorderAndEVisaAssistantModal({
  isOpen,
  onClose
}: BorderAndEVisaAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'evisa' | 'customs' | 'health'>('evisa');
  const [searchCountry, setSearchCountry] = useState('');
  const [selectedNationality, setSelectedNationality] = useState('Moçambique');

  if (!isOpen) return null;

  const filteredCountries = VISA_EXEMPT_COUNTRIES.filter(c => 
    c.toLowerCase().includes(searchCountry.toLowerCase())
  );

  const isExempt = VISA_EXEMPT_COUNTRIES.some(
    c => c.toLowerCase() === selectedNationality.toLowerCase()
  ) || selectedNationality.toLowerCase().includes('moçambique');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 my-auto flex flex-col">
        
        {/* Header */}
        <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 sticky top-0 z-20 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full">
                  Portal Oficial do Viajante
                </span>
              </div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-white">
                Assistente de e-Visa, Fronteiras & Alfândegas de Moçambique
              </h2>
              <p className="text-xs text-slate-300">
                Regulamentos oficiais, isenção de vistos e franquias aduaneiras em tempo real.
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('evisa')}
            className={`pb-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'evisa'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>e-Visa & Isenção de Visto (Decreto 10/2023)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('customs')}
            className={`pb-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'customs'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Alfândegas & Limites de Moeda / Bagagem</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('health')}
            className={`pb-3 font-bold text-xs border-b-2 flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'border-cyan-600 text-cyan-700'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Requisitos Sanitários & Vacinas</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto text-xs">
          
          {/* TAB 1: EVISA & ISENÇÃO */}
          {activeTab === 'evisa' && (
            <div className="space-y-4">
              <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl space-y-2">
                <div className="font-bold text-cyan-950 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-700" />
                  <span>Isenção de Visto de Turismo & Negócios para 28 Países</span>
                </div>
                <p className="text-cyan-900 leading-relaxed">
                  Cidadãos de 28 países estratégicos estão isentos de visto para estadias até <strong>30 dias</strong> (prorrogáveis até 90 dias). Apenas necessitam de pagar a taxa de pré-registo online de <strong>650 MT</strong> na plataforma oficial <em>evisa.gov.mz</em> antes do embarque.
                </p>
              </div>

              {/* Country Checker */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <label className="block text-slate-700 font-bold">
                  Verifique a sua nacionalidade:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={selectedNationality}
                    onChange={(e) => setSelectedNationality(e.target.value)}
                    placeholder="Ex: Portugal, África do Sul, Brasil..."
                    className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 font-semibold text-slate-800 outline-hidden"
                  />
                </div>

                <div className="p-3 rounded-xl border flex items-center gap-3 bg-white">
                  {isExempt ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      <span>País Isento de Visto Consular! Necessita apenas de passaporte válido (mínimo 6 meses) e taxa de pré-registo de 650 MT.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-800 font-bold">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>Requer e-Visa prévio solicitado online através do portal oficial de Moçambique com carta convite ou reserva de hotel confirmada.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 28 Countries Grid */}
              <div className="space-y-2">
                <div className="font-bold text-slate-800">
                  Lista dos 28 Países Isentos (Decreto nº 10/2023):
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  {VISA_EXEMPT_COUNTRIES.map((country, idx) => (
                    <div key={`cntry-${idx}`} className="bg-slate-100 p-2 rounded-lg font-medium text-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="truncate">{country}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Official Link */}
              <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-2xl">
                <div>
                  <div className="font-bold text-white text-xs">Portal Oficial e-Visa Moçambique</div>
                  <div className="text-[11px] text-slate-400">Serviço Nacional de Migração (SENAMI)</div>
                </div>
                <a
                  href="https://evisa.gov.mz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition-all text-xs"
                >
                  <span>Aceder evisa.gov.mz</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMS & CURRENCY LIMITS */}
          {activeTab === 'customs' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    <span>Entrada e Saída de Divisas</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Viajantes podem transportar até <strong>10.000 USD</strong> (ou equivalente em Meticais/ZAR/EUR) em numerário sem necessidade de declaração cambial prévia ao Banco de Moçambique. Valores superiores exigem declaração oficial de alfândega.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Plane className="w-4 h-4 text-cyan-600" />
                    <span>Franquia de Bens Pessoais (Duty-Free)</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Isenção aduaneira para bens de uso pessoal novos até <strong>$200 USD</strong> no Aeroporto de Maputo (MPM), 1 litro de bebidas espirituosas, 2,5 litros de vinho e até 200 cigarros.
                  </p>
                </div>
              </div>

              {/* Items requiring declaration */}
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl space-y-2 text-amber-950">
                <div className="font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Artigos que Exigem Declaração Obrigatória nas Alfândegas:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-amber-900">
                  <li>Drones e equipamentos de filmagem profissional (requer autorização prévia do IACM).</li>
                  <li>Mais de 1 computador portátil pessoal novo em caixa selada para fins comerciais.</li>
                  <li>Espécies protegidas de flora e fauna, marfim e minerais brutos sem licença do MIREME.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: HEALTH & VACCINES */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="font-bold text-slate-900 text-sm">
                  Certificados de Vacinação & Saúde em Moçambique:
                </div>
                <div className="space-y-2 text-slate-700">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block">Febre Amarela:</strong>
                    Exigido o Certificado Internacional de Vacinação apenas para viajantes provenientes de países com risco endémico de transmissão (ex: Quénia, Uganda, Brasil, Angola, RDC).
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <strong className="text-slate-900 block">Profilaxia da Malária:</strong>
                    Recomenda-se o uso de repelente e consulta médica para aconselhamento preventivo em zonas costeiras e de savana (Ponta do Ouro, Bilene, Bazaruto, Gorongosa).
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
