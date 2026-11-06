import React, { useState } from 'react';
import { Establishment, PromoDeal, UserProfile } from "../types/types";
import { Plus, SlidersHorizontal, Star, Sparkles, MapPin, Search, Filter, ChevronDown, Store, ShoppingBag, Shirt, Smartphone, Tag, Building2, Truck, ChevronRight, X, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { matchesEstablishment } from "../services/search";
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import SegmentPageHero from '../components/shared/SegmentPageHero';
import EstablishmentCard from '../components/shared/EstablishmentCard';

interface LojasPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion: (cat: 'loja') => void;
  currentUser?: UserProfile | null;
  // When set to 'pecas_auto', narrows the listing to that sub-segment only
  segmentFilter?: string | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const storeCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-store-1',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1000&q=80',
    title: 'Moda, Calçado & Boutiques Exclusivas',
    subtitle: 'Roupas de tendência, vestidos de gala, calçado e acessórios de marcas nacionais e importadas em Maputo.',
    badge: 'Vestuário & Acessórios'
  },
  {
    id: 'slide-store-2',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1000&q=80',
    title: 'Smartphones, Acessórios & Tecnologia',
    subtitle: 'Telemóveis de última geração, computadores, auriculares e reparações nas melhores lojas tecnológicas.',
    badge: 'Electrónica & Gadgets'
  },
  {
    id: 'slide-store-3',
    image: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1000&q=80',
    title: 'Capulanas Tradicionais & Artigos Artesanais',
    subtitle: 'A melhor seleção de tecidos regionais, capulanas genuínas, lembranças e artesanato moçambicano.',
    badge: 'Cultura & Arte'
  },
  {
    id: 'slide-store-4',
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1000&q=80',
    title: 'Sapatarias & Desporto Urbano',
    subtitle: 'Ténis desportivos, sapatos formais e botas para todos os tamanhos com pronta entrega.',
    badge: 'Desporto & Calçado'
  },
  {
    id: 'slide-store-5',
    image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=1000&q=80',
    title: 'Doce Amor — Floraria, Buquês & Ornamentação',
    subtitle: 'Rosas vermelhas, caixas surpresa, arranjos de mesas e ornamentação completa para eventos e casamentos com delivery expresso.',
    badge: 'Flores & Ornamentações VIP'
  }
];

const autoPecasCarouselSlides: CarouselSlide[] = [
  {
    id: 'ap1',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1000&q=80',
    title: 'Óleos Sintéticos, Filtros & Valvolinas',
    subtitle: 'Kits de manutenção para motores Toyota, Nissan, Isuzu e Ford com óleos Shell, Castrol e Total.',
    badge: 'Lubrificantes & Filtros'
  },
  {
    id: 'ap2',
    image: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1000&q=80',
    title: 'Baterias 12V Willard, Dixon & Moura',
    subtitle: 'Baterias de alta capacidade com arranque a frio reforçado e garantia de fábrica de 12 meses em Maputo.',
    badge: 'Baterias & Elétrica Auto'
  },
  {
    id: 'ap3',
    image: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=1000&q=80',
    title: 'Pneus R14 a R17, Jantes & Suspensão',
    subtitle: 'Pneus reforçados, amortecedores Monroe e calços de travão com pronta entrega para oficinas e frotas.',
    badge: 'Pneus & Travões'
  }
];

export default function LojasPage({ 
  establishments, 
  deals, 
  onSelectEstablishment, 
  onAddPromotion, 
  currentUser, 
  segmentFilter,
  searchQuery,
  onClearSearch,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: LojasPageProps) {
  const isAutoPecas = segmentFilter === 'pecas_auto';
  const isFloricultura = segmentFilter === 'floricultura';

  const baseLojas = isAutoPecas
    ? establishments.filter(e => e.category === 'pecas_auto' || e.segment?.toLowerCase().includes('auto') || e.segment?.toLowerCase().includes('peça'))
    : isFloricultura
    ? establishments.filter(e => (e.segment?.toLowerCase().includes('flor') || e.name.toLowerCase().includes('flor') || (e.features && e.features.some(f => f.toLowerCase().includes('flor')))))
    : establishments.filter(e => e.category === 'loja');

  // Helper to ensure exactly 10 items for uniform carousel track matching LandingPage speed & rhythm
  const getTop10 = () => {
    const list = baseLojas.length > 0 ? baseLojas : establishments.filter(e => isAutoPecas ? e.category === 'pecas_auto' : e.category === 'loja');
    if (list.length === 0) return [];
    if (list.length >= 10) return list.slice(0, 10);
    const result: Establishment[] = [];
    while (result.length < 10) {
      result.push(...list);
    }
    return result.slice(0, 10);
  };

  const top10Items = getTop10();

  // Filter logic using incoming search query from LandingPage
  const filteredLojas = searchQuery && searchQuery.trim()
    ? baseLojas.filter(loja => matchesEstablishment(loja, searchQuery))
    : baseLojas;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">

      <SegmentPageHero
        gradientClass={isAutoPecas ? "from-slate-950 via-slate-900 to-indigo-950" : isFloricultura ? "from-pink-950 via-slate-900 to-emerald-950" : "from-indigo-950 via-slate-900 to-indigo-deep"}
        badgeIcon={Store}
        badgeLabel={isAutoPecas ? "Explorar · Lojas Cadastradas de Auto Peças" : isFloricultura ? "Explorar · Floriculturas & Arranjos Florais" : "Explorar · Lojas, Comércio & Artigos"}
        badgeColorClass={isAutoPecas ? "bg-blue-500/20 text-blue-200 border-blue-400/30" : isFloricultura ? "bg-pink-500/20 text-pink-200 border-pink-400/30" : "bg-indigo-500/20 text-indigo-200 border-indigo-400/30"}
        title={isAutoPecas ? 'Auto Peças & Acessórios Automóveis em Maputo' : isFloricultura ? 'Floriculturas & Decoração Floral em Maputo' : 'Lojas & Boutiques de Maputo'}
        subtitle={isAutoPecas ? 'Catálogo exclusivo de lojas de peças automóveis, óleos de motor, baterias, calços de travão, amortecedores, pneus e componentes elétricos em Maputo e Matola.' : isFloricultura ? 'Encontre floriculturas, arranjos para presentes, buquês de rosas, plantas decorativas e ornamentação para eventos e casamentos em Maputo.' : 'Pesquise facilmente lojas de vestuário, telemóveis, sapatos, capulanas, electrodomésticos e utilidades na Cidade e Província de Maputo.'}
        tags={isAutoPecas ? [
          { icon: Tag, label: 'Atacado & Retalho Auto', colorClass: 'text-blue-300' },
          { icon: Truck, label: 'Entrega em Oficinas', colorClass: 'text-slate-300' },
          { icon: Building2, label: 'Garantia de Origem', colorClass: 'text-blue-200' }
        ] : [
          { icon: Shirt, label: 'Vestuário & Moda', colorClass: 'text-blue-200' },
          { icon: Smartphone, label: 'Telemóveis & Tech', colorClass: 'text-slate-200' },
          { icon: Tag, label: 'Atacado & Retalho', colorClass: 'text-blue-300' }
        ]}
        carouselSlides={isAutoPecas ? autoPecasCarouselSlides : storeCarouselSlides}
        carouselKey={isAutoPecas ? "pecas_auto" : "lojas"}
        currentUser={currentUser}
        onNavigate={onNavigate}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        onInquireClick={onInquireClick}
      />

      {/* Active Search Filter Banner (Synchronized from Landing Page) */}
      {searchQuery && searchQuery.trim() && (
        <div className="px-[6vw] mb-6 max-w-7xl mx-auto w-full">
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-[#0B254B] flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B254B]">
                  Filtro Ativo da Pesquisa Central:
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Resultados para <span className="bg-slate-200 px-2 py-0.5 rounded-md text-[#0B254B]">"{searchQuery}"</span> ({filteredLojas.length} encontradas)
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

      {/* Geographic Focus Band */}
      <div className="px-[6vw] mb-10 max-w-7xl mx-auto w-full">
        <div className="bg-slate-100 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
          <div>
            <h3 className="font-serif font-semibold text-lg text-slate-900 mb-1">
              Catálogo de Estabelecimentos Oficiais
            </h3>
            <p className="text-xs text-slate-600">
              {filteredLojas.length} {filteredLojas.length === 1 ? 'loja disponível' : 'lojas disponíveis'} em Maputo e Matola
            </p>
          </div>
          
          <button 
            onClick={() => onAddPromotion('loja')}
            className="py-2.5 px-4 bg-[#103B75] hover:bg-[#0B254B] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Anunciar Promoção de Loja</span>
          </button>
        </div>
      </div>

      {/* Top 10 promotions scroll track (Rhythm, speed & card format identical to Landing Page) */}
      <section className="py-8 border-y border-slate-200 bg-slate-100/70 mb-12 overflow-hidden">
        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
              {isAutoPecas ? 'Peças em destaque esta semana' : 'Lojas em destaque esta semana'}
            </h2>
          </div>
          <button 
            onClick={() => onAddPromotion('loja')}
            className="text-[11px] font-bold text-paper bg-indigo-deep hover:bg-indigo-brand/90 py-2 px-4 rounded-xl transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sugerir Destaque no Top 10</span>
          </button>
        </div>

        {/* Infinite Scroll Track with Illustrative Photos & Identical Velocity */}
        <div className="relative flex overflow-hidden py-2">
          <div className="marquee-track flex gap-4 pr-4">
            {[...top10Items, ...top10Items].map((item, idx) => (
              <div 
                key={`marquee-${isAutoPecas ? 'pecas' : 'lojas'}-${item.id}-${idx}-${idx >= top10Items.length ? 'dup' : 'orig'}`}
                onClick={() => onSelectEstablishment(item)}
                className="w-68 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group flex-shrink-0 cursor-pointer select-none"
              >
                {/* Photo Display */}
                <div className="h-38 bg-slate-800 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-serif italic text-white opacity-40 text-xl" style={{ backgroundColor: item.coverColor }}>
                      {item.name}
                    </div>
                  )}

                  <span className="absolute top-2.5 left-2.5 bg-slate-900/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                    Top #{(idx % top10Items.length) + 1}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div>
                    <span className="text-[10px] font-bold text-[#0B254B] flex items-center gap-1 mb-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{item.zone}</span>
                    </span>
                    <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors truncate mb-1">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <span className="text-[11px] font-bold text-[#0B254B]">Ver Estabelecimento</span>
                    <ChevronRight className="w-4 h-4 text-[#0B254B] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Grid Section */}
      <section className="px-[6vw] mb-16 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
          <div>
            <h2 className="font-serif font-semibold text-2xl text-slate-900">Estabelecimentos Seleccionados</h2>
            <p className="text-xs text-slate-500 mt-1">Clique para ver localização exata, pontos de referência e contacto de WhatsApp</p>
          </div>
          <div className="text-xs font-semibold text-slate-500">
            {filteredLojas.length} de {baseLojas.length} lojas
          </div>
        </div>

        {filteredLojas.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">Nenhuma loja encontrada para este filtro de busca.</p>
            {onClearSearch && (
              <button 
                onClick={onClearSearch} 
                className="btn py-2 px-4 bg-[#0B254B] hover:bg-[#0c2e5c] text-white text-xs rounded-xl font-semibold cursor-pointer"
              >
                Resetar Filtros e Ver Todas Lojas
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredLojas.map((loja, idx) => (
              <EstablishmentCard
                key={`loja-card-${loja.id}-${idx}`}
                est={loja}
                theme="indigo"
                badges={[
                  { label: loja.category === 'pecas_auto' ? 'Auto Peças' : loja.salesType === 'grosso' ? 'Venda a Grosso' : loja.salesType === 'retalho' ? 'Retalho' : 'Grosso & Retalho' },
                  ...(loja.hasIntegratedDelivery ? [{ label: 'Entrega Sincronizada', icon: Truck }] : [])
                ]}
                detailSlot={
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B254B] shrink-0" />
                      <span className="truncate">Localização: {loja.address}</span>
                    </div>
                    {loja.locationLandmarks && (
                      <div className="text-slate-500 italic line-clamp-1">
                        Ponto de referência: {loja.locationLandmarks}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEstablishment(loja);
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
                      <span>Frete & Produtos</span>
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
                onClick={() => onSelectEstablishment(loja)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Statistical Section */}
      <section className="px-[6vw] max-w-7xl mx-auto w-full">
        <div className="border-b border-slate-200 pb-4 mb-6">
          <h2 className="font-serif font-bold text-2xl text-slate-900">Estatísticas e mais procurados</h2>
          <p className="text-xs text-slate-500 mt-1">Dados reais obtidos através de visitas e buscas no Axofácil!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#103B75] border-b border-slate-200 pb-3 mb-4">
              Produtos mais comprados
            </h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-800">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span><span className="font-bold text-[#103B75] mr-1.5">1.</span>Capulana estampada</span>
                <span className="text-slate-500">312 compras</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span><span className="font-bold text-[#103B75] mr-1.5">2.</span>Extensão elétrica</span>
                <span className="text-slate-500">204 compras</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="font-bold text-[#103B75] mr-1.5">3.</span>Ténis desportivo</span>
                <span className="text-slate-500">188 compras</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#103B75] border-b border-slate-200 pb-3 mb-4">
              Lojas mais visitadas
            </h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-800">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span><span className="font-bold text-[#103B75] mr-1.5">1.</span>Loja Baixa Têxtil</span>
                <span className="text-slate-500">1.240 visitas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span><span className="font-bold text-[#103B75] mr-1.5">2.</span>Loja Ekonomia</span>
                <span className="text-slate-500">980 visitas</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="font-bold text-[#103B75] mr-1.5">3.</span>Loja Kanimambo</span>
                <span className="text-slate-500">870 visitas</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-[#103B75] border-b border-slate-200 pb-3 mb-4">
              Lojas mais pesquisadas
            </h3>
            <div className="space-y-3.5 text-xs font-medium text-slate-800">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span><span className="font-bold text-[#103B75] mr-1.5">1.</span>Loja Ekonomia</span>
                <span className="text-slate-500">615 buscas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span><span className="font-bold text-[#103B75] mr-1.5">2.</span>Casa das Peças</span>
                <span className="text-slate-500">540 buscas</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="font-bold text-[#103B75] mr-1.5">3.</span>Loja Bela Vista</span>
                <span className="text-slate-500">490 buscas</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}

