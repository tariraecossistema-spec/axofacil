import React, { useState } from 'react';
import { Establishment, PromoDeal, UserProfile } from "../types/types";
import { Plus, SlidersHorizontal, Star, Sparkles, MapPin, Search, Filter, ChevronDown, Store, Hammer, Truck, ShieldCheck, Phone, ArrowRight, UserPlus, LogIn, Key, Wrench, Boxes, Building2, ChevronRight, X } from 'lucide-react';
import { motion } from 'motion/react';
import { matchesEstablishment } from "../services/search";
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import SegmentPageHero from '../components/shared/SegmentPageHero';
import EstablishmentCard from '../components/shared/EstablishmentCard';

interface ConstrucaoPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion?: (cat: 'construcao') => void;
  setActivePage?: (page: any) => void;
  currentUser?: UserProfile | null;
  // When set to 'ferragens', narrows the listing to that sub-segment only
  // (arrives via SegmentSelector's "Ferragens & Ferramentas" tile)
  segmentFilter?: string | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const constructionCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-const-1',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80',
    title: 'Cimento Limpopo & Chapas IBR / Onduladas',
    subtitle: 'Sacos de cimento 42.5N, chapas galvanizadas, varão de ferro reforçado e malha sol para a sua obra.',
    badge: 'Cimento & Estruturas'
  },
  {
    id: 'slide-const-2',
    image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1000&q=80',
    title: 'Camiões de Areia Vermelha, Brita & Saibro',
    subtitle: 'Entrega rápida de metros cúbicos de areia grossa, areia de rio, brita 1 e 2 diretamente na sua obra.',
    badge: 'Estaleiro & Inertes'
  },
  {
    id: 'slide-const-3',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1000&q=80',
    title: 'Blocos de Cimento, Tijolos & Pavés',
    subtitle: 'Blocos de 15 e 20 reforçados, tijolos baiano, pavês de jardim e lancis para pavimentação.',
    badge: 'Alvenaria & Blocos'
  },
  {
    id: 'slide-const-4',
    image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
    title: 'Tubagens PVC, Tintas & Ferragens',
    subtitle: 'Canalização, quadros eléctricos, tintas para fachadas, betoneiras e ferramentas profissionais.',
    badge: 'Ferragens & Canalização'
  }
];

export default function ConstrucaoPage({ 
  establishments, 
  deals, 
  onSelectEstablishment, 
  setActivePage, 
  currentUser, 
  segmentFilter,
  searchQuery,
  onClearSearch,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: ConstrucaoPageProps) {
  const construcaoEsts = segmentFilter === 'ferragens'
    ? establishments.filter(e => e.category === 'ferragens')
    : establishments.filter(e => e.category === 'construcao' || e.category === 'ferragens');

  // Filter logic using search query from LandingPage
  const filteredEsts = searchQuery && searchQuery.trim()
    ? construcaoEsts.filter(est => matchesEstablishment(est, searchQuery))
    : construcaoEsts;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">

      <SegmentPageHero
        gradientClass="from-[#0B254B] via-[#081E3D] to-[#051429]"
        badgeIcon={Hammer}
        badgeLabel="Opção 6 · Vendas & Estaleiros"
        badgeColorClass="bg-white/15 text-white border-white/25"
        title="Material de Construção & Estaleiros"
        subtitle="Encontre fornecedores diretos, ferragens e estaleiros em Maputo, Matola, Zimpeto, Boane e Gaza. Cotar cimento, chapas de zinco, varão de aço, areia, brita, blocos e ferramentas nunca foi tão rápido."
        tags={[
          { icon: Boxes, label: 'Cimento & Blocos', colorClass: 'text-slate-700' },
          { icon: Truck, label: 'Areia, Brita & Fretes', colorClass: 'text-slate-700' },
          { icon: Wrench, label: 'Ferragens & Chapas', colorClass: 'text-slate-700' }
        ]}
        carouselSlides={constructionCarouselSlides}
        carouselKey="construcao"
        currentUser={currentUser}
        onNavigate={onNavigate}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        onInquireClick={onInquireClick}
      >
        {/* Business Owner Quick Banner */}
        {setActivePage && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs mt-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-slate-200 rounded-xl flex items-center justify-center text-[#0B254B] shrink-0">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">É proprietário de um Estaleiro ou Ferragem?</h4>
                <p className="text-[11px] text-slate-600">Registe a sua empresa, atualize o catálogo de preços, receba pedidos diretos por M-Pesa e faça gestão do caixa e inventário no seu Painel.</p>
              </div>
            </div>

            <button
              onClick={() => setActivePage('auth')}
              className="bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs py-1.5 px-3 rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
            >
              <span>Inscrever o Meu Estaleiro</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Conciso Explanatory Menu / Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-4">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
              <span>🧱 Cimento & Cal</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Limpopo, Mozal 32.5N e 42.5N a grosso e retalho.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
              <span>🛖 Chapas & Aço</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Chapas galvanizadas 0.40mm, caneladas e varão 12mm.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
              <span>🪨 Areia & Brita</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Areia grossa de rio e brita por carrada de camião.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs">
            <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
              <span>🧱 Blocos de Estaleiro</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Blocos de 15cm e 20cm vibrados com frete para a obra.
            </p>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 shadow-2xs col-span-2 sm:col-span-1">
            <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5">
              <span>🛠️ Ferragens & PVC</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-tight">
              Tintas, ferramentas Bosch, tubos PVC e louça sanitária.
            </p>
          </div>
        </div>
      </SegmentPageHero>

      {/* Active Search Filter Banner (Synchronized from Landing Page) */}
      {searchQuery && searchQuery.trim() && (
        <div className="px-[6vw] mt-6 mb-4 max-w-7xl mx-auto w-full">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#0B254B] flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B254B]">
                  Filtro Ativo da Pesquisa Central:
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Resultados para <span className="bg-blue-100 px-2 py-0.5 rounded-md text-[#0B254B]">"{searchQuery}"</span> ({filteredEsts.length} encontrados)
                </p>
              </div>
            </div>
            {onClearSearch && (
              <button
                onClick={onClearSearch}
                className="text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer self-end sm:self-auto"
              >
                <X className="w-3.5 h-3.5 text-slate-500" />
                <span>Limpar Filtro</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
        
        {/* Results Bar */}
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs">
          <div>
            <h3 className="font-serif font-bold text-lg text-slate-900">
              Estaleiros e Ferragens Cadastrados
            </h3>
            <p className="text-xs text-slate-600">
              {filteredEsts.length} {filteredEsts.length === 1 ? 'fornecedor disponível' : 'fornecedores disponíveis'} com contacto direto e catálogo
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#0B254B] bg-slate-100 py-1.5 px-3 rounded-xl border border-slate-200 font-bold">
            <Truck className="w-4 h-4 text-[#0B254B]" />
            <span>Entrega de Material na Sua Obra</span>
          </div>
        </div>

        {/* Listings Grid */}
        {filteredEsts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEsts.map((est, idx) => (
              <EstablishmentCard
                key={`const-card-${est.id}-${idx}`}
                est={est}
                theme="slate"
                badges={[
                  { label: est.salesType === 'grosso' ? 'Atacado / Grosso' : est.salesType === 'retalho' ? 'Retalho' : 'Grosso & Retalho' },
                  ...(est.hasIntegratedDelivery ? [{ label: 'Entrega na Obra', icon: Truck }] : [])
                ]}
                detailSlot={
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B254B] shrink-0" />
                      <span className="truncate">Localização: {est.address}</span>
                    </div>
                    {est.locationLandmarks && (
                      <div className="text-slate-500 italic line-clamp-1">
                        Ponto de referência: {est.locationLandmarks}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEstablishment(est);
                      }}
                      className="w-full text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 py-1 px-2 rounded-lg flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                    >
                      <MapPin className="w-3 h-3 text-[#0B254B]" />
                      <span>Ver Mapa Interativo GPS (Google Maps & Waze)</span>
                    </button>
                  </div>
                }
                footerSlot={
                  <div className="flex items-center justify-between border-t border-slate-200 pt-2.5 -mx-4 -mb-4 px-4 pb-4 bg-slate-50/60">
                    <div className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300/80 px-2.5 py-1 rounded-xl text-[10.5px] font-bold shadow-2xs transition-colors">
                      <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>Frete de Obra</span>
                    </div>
                    <button
                      type="button"
                      className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                    >
                      <span>Ver detalhes</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                }
                onClick={() => onSelectEstablishment(est)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-16 h-16 bg-blue-50 text-[#0B254B] rounded-full flex items-center justify-center mx-auto">
              <Hammer className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-bold text-xl text-slate-900">
              Nenhum estaleiro ou ferragem encontrado com estes filtros
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tente alterar a pesquisa de material (ex: digite "cimento", "chapa", "varão" ou "areia") ou escolha "Todas as Regiões".
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
