import React, { useState } from 'react';
import { Establishment, PromoDeal, UserProfile } from "../types/types";
import { Plus, SlidersHorizontal, Star, Sparkles, MapPin, Search, ChevronDown, GlassWater, Beer, Flame, Music, UtensilsCrossed, Building2, Truck, ChevronRight, X, Award, FlameKindling, PartyPopper } from 'lucide-react';
import { matchesEstablishment } from "../services/search";
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import SegmentPageHero from '../components/shared/SegmentPageHero';
import EstablishmentCard from '../components/shared/EstablishmentCard';
import DrawnHighlight from '../components/shared/DrawnHighlight';

interface BaresPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion: (cat: 'bar') => void;
  currentUser?: UserProfile | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const barCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-bar-1',
    image: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=1000&q=80',
    title: 'Cervejas Estupidamente Geladas & Pressão',
    subtitle: 'Canecas trincando de gelo, 2M, Laurentina, Manica e cervejas artesanais bem frescas.',
    badge: 'Cerveja & Chope'
  },
  {
    id: 'slide-bar-2',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1000&q=80',
    title: 'Cocktails Premium & Mixologia Exclusiva',
    subtitle: 'Caipirinhas de maracujá, gin tónica, mojitos e novidades preparadas por bartenders experientes.',
    badge: 'Cocktails & Gin'
  },
  {
    id: 'slide-bar-3',
    image: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=1000&q=80',
    title: 'Música ao Vivo, DJs & Ambiente de Festa',
    subtitle: 'Noites vibrantes de Marrabenta, Afrobeats, Amapiano e pista de dança cheia em Maputo.',
    badge: 'Vida Noturna & Dança'
  },
  {
    id: 'slide-bar-4',
    image: 'https://images.unsplash.com/photo-1538488881022-4728e3a6f9f1?auto=format&fit=crop&w=1000&q=80',
    title: 'Happy Hours, Lulas Grelhadas & Petiscos',
    subtitle: 'Frango a zambeziana, camarão grelhado, picanha na chapa e tábuas para partilhar com amigos.',
    badge: 'Petiscos & Esplanada'
  }
];

export default function BaresPage({ 
  establishments, 
  deals, 
  onSelectEstablishment, 
  onAddPromotion, 
  currentUser,
  searchQuery,
  onClearSearch,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: BaresPageProps) {
  const [selectedZone, setSelectedZone] = useState('Todas as Zonas');
  const [selectedCategory, setSelectedCategory] = useState('Todos os Estilos');
  const [activeFilter, setActiveFilter] = useState('Todos');

  const bares = establishments.filter(e => e.category === 'bar');
  const barDeals = deals.filter(d => d.category === 'bar').sort((a, b) => a.rank - b.rank);

  // Filter logic
  const filteredBares = bares.filter(bar => {
    // Zone filter
    if (selectedZone !== 'Todas as Zonas') {
      if (selectedZone === 'Baixa da Cidade' && !bar.zone.includes('Baixa')) return false;
      if (selectedZone === 'Polana & Sommerschield' && !bar.zone.includes('Polana') && !bar.zone.includes('Sommerschield')) return false;
      if (selectedZone === 'Costa do Sol' && !bar.zone.includes('Costa do Sol') && !bar.zone.includes('Marginal')) return false;
      if (selectedZone === 'Matola & Arredores' && !bar.zone.includes('Matola')) return false;
    }

    // Category / style filter
    if (selectedCategory !== 'Todos os Estilos') {
      const catLower = selectedCategory.toLowerCase();
      const matchFeature = bar.features.some(f => catLower.includes(f.toLowerCase()) || f.toLowerCase().includes(catLower));
      const matchDesc = bar.description.toLowerCase().includes(catLower) || bar.name.toLowerCase().includes(catLower);
      if (!matchFeature && !matchDesc) return false;
    }

    // Feature filter
    if (activeFilter !== 'Todos') {
      const matchFeature = bar.features.some(feat => feat.toLowerCase() === activeFilter.toLowerCase());
      if (!matchFeature) {
        return false;
      }
    }
    
    // Search filter with smart matcher if searchQuery is provided
    if (searchQuery && searchQuery.trim()) {
      return matchesEstablishment(bar, searchQuery);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">

      <SegmentPageHero
        gradientClass="from-[#0B254B] via-[#081E3D] to-[#051429]"
        badgeIcon={Beer}
        badgeLabel="Explorar · Bares, Lounge & Diversão Noturna"
        badgeColorClass="bg-white/15 text-white border-white/25"
        title="Bares, Lounges & Diversão em Maputo"
        subtitle="Cerveja trincando de gelada, música ao vivo, cocktails e petiscos irresistíveis. Descubra os spots mais populares da Marginal, Baixa e Polana."
        tags={[
          { icon: GlassWater, label: 'Cocktails & Chope', colorClass: 'text-slate-700' },
          { icon: Music, label: 'DJs & Música Vivo', colorClass: 'text-slate-700' },
          { icon: UtensilsCrossed, label: 'Petiscos & Esplanada', colorClass: 'text-slate-700' }
        ]}
        carouselSlides={barCarouselSlides}
        carouselKey="bares"
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
                  Resultados para <span className="bg-slate-200 px-2 py-0.5 rounded-md text-[#0B254B]">"{searchQuery}"</span> ({filteredBares.length} encontrados)
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

      {/* REGIONAL & STYLE DROPDOWNS */}
      <div className="px-[6vw] mb-6 max-w-7xl mx-auto w-full">
        <div className="bg-sand-2/30 border border-ink/12 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-4">
          
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-terracotta block flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-terracotta" />
              <span>1. Seleccionar Região / Zona</span>
            </label>
            <div className="relative">
              <select
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full bg-paper border border-ink/15 rounded-xl py-3 px-4 text-xs font-bold text-ink appearance-none outline-none focus:border-terracotta cursor-pointer shadow-xs"
              >
                <option value="Todas as Zonas">📍 Todas as Regiões de Maputo</option>
                <option value="Baixa da Cidade">🏛️ Baixa da Cidade</option>
                <option value="Polana & Sommerschield">🌳 Polana & Sommerschield</option>
                <option value="Costa do Sol">🏖️ Costa do Sol & Marginal</option>
                <option value="Matola & Arredores">🏢 Matola & Arredores</option>
              </select>
              <ChevronDown className="w-4 h-4 text-ink/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-bold text-terracotta block flex items-center gap-1">
              <GlassWater className="w-3.5 h-3.5 text-terracotta" />
              <span>2. Seleccionar Estilo de Espaço</span>
            </label>
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-paper border border-ink/15 rounded-xl py-3 px-4 text-xs font-bold text-ink appearance-none outline-none focus:border-terracotta cursor-pointer shadow-xs"
              >
                <option value="Todos os Estilos">🍹 Todos os Estilos de Bar</option>
                <option value="Música ao vivo">🎷 Bares com Música ao Vivo</option>
                <option value="Vista para o mar">🌊 Lounges com Vista ao Mar</option>
                <option value="Petiscos">🍢 Gastro Bares & Petiscos</option>
                <option value="Cocktails">🍸 Bares de Cocktails Especializados</option>
              </select>
              <ChevronDown className="w-4 h-4 text-ink/40 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>
      </div>

      {/* Filter Options */}
      <div className="px-[6vw] mb-6 flex flex-wrap gap-2 max-w-7xl mx-auto w-full">
        {['Todos', 'Música ao vivo', 'Vista para o mar', 'Petiscos'].map((filter, idx) => (
          <button
            key={`bar-filter-${filter}-${idx}`}
            onClick={() => setActiveFilter(filter)}
            className={`py-2.5 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
              activeFilter === filter 
                ? 'bg-terracotta text-white border-terracotta shadow-sm shadow-terracotta/20' 
                : 'bg-white text-ink/75 border-ink/12 hover:bg-sand-2/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>


      {/* Main Grid Section */}
      <section className="px-[6vw] mb-16 max-w-7xl mx-auto w-full">
        {filteredBares.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-ink/15">
            <SlidersHorizontal className="w-8 h-8 text-ink/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink/60">Nenhum bar ou espaço encontrado para a pesquisa actual.</p>
            <button 
              onClick={() => { 
                if (onClearSearch) onClearSearch();
                setActiveFilter('Todos'); 
              }} 
              className="text-xs text-terracotta font-bold mt-2 underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBares.map((bar, idx) => (
              <EstablishmentCard
                key={`bar-card-${bar.id}-${idx}`}
                est={bar}
                theme="blue"
                badges={[
                  { label: 'Bar & Lounge' },
                  ...(bar.hasIntegratedDelivery ? [{ label: 'Entrega & Takeaway', icon: Truck }] : []),
                  ...(bar.salesType ? [{ label: bar.salesType === 'grosso' ? 'A Grosso' : bar.salesType === 'retalho' ? 'Retalho' : 'Grosso & Retalho' }] : [])
                ]}
                detailSlot={
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] space-y-1.5">
                    <div className="font-semibold text-slate-800 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-[#0B254B] shrink-0" />
                      <span className="truncate">Localização: {bar.address}</span>
                    </div>
                    {bar.locationLandmarks && (
                      <div className="text-slate-500 italic line-clamp-1">
                        Ponto de referência: {bar.locationLandmarks}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEstablishment(bar);
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
                      <span>Consumo & Frete</span>
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
                onClick={() => onSelectEstablishment(bar)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Statistical Section */}
      <section className="px-[6vw] max-w-7xl mx-auto w-full">
        <div className="border-b border-slate-200 pb-4 mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#0B254B] animate-ping" />
              <h2 className="font-serif font-bold text-2xl text-slate-900">
                <DrawnHighlight variant="rainbow-sweep" gradient={true}>
                  <span>Mais Procurados & Tendências de Maputo</span>
                </DrawnHighlight>
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">Bares, noites mais animadas e bebidas com maior procura no Axofácil!</p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#0B254B] text-xs font-bold shadow-2xs self-start sm:self-auto">
            <Sparkles className="w-3.5 h-3.5 text-[#0B254B]" />
            <span>Atualizado ao Vivo</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Bebidas Mais Pedidas */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-700 via-[#0B254B] to-blue-400" />
            <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Beer className="w-4 h-4 text-[#0B254B]" />
                <span>Bebidas mais pedidas</span>
              </span>
              <span className="text-[10px] font-bold bg-blue-100 text-[#0B254B] px-2 py-0.5 rounded-full">Top 3</span>
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#0B254B] font-black flex items-center justify-center text-[10px]">1</span>
                  <DrawnHighlight variant="underline" gradient={true} strokeWidth={2}>
                    <span className="font-bold text-slate-900">2M Cerveja Trincando</span>
                  </DrawnHighlight>
                </span>
                <span className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">890 pedidos</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span className="font-semibold text-slate-800">Caipirinha de Maracujá</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">410 pedidos</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span className="font-semibold text-slate-800">Tinto da Casa & Sangria</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">260 pedidos</span>
              </div>
            </div>
          </div>

          {/* Card 2: Bares Mais Visitados */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-[#0B254B] to-blue-500" />
            <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>Bares mais visitados</span>
              </span>
              <span className="text-[10px] font-bold bg-teal-100 text-teal-900 px-2 py-0.5 rounded-full">Marginal</span>
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-500/20 text-teal-950 font-black flex items-center justify-center text-[10px]">1</span>
                  <DrawnHighlight variant="underline" gradient={true} strokeWidth={2}>
                    <span className="font-bold text-slate-900">Kanimambo Bar & Lounge</span>
                  </DrawnHighlight>
                </span>
                <span className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">1.510 visitas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-slate-200">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span className="font-semibold text-slate-800">Bar Costa do Sol</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">1.120 visitas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span className="font-semibold text-slate-800">Lounge 21 Sunset</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">940 visitas</span>
              </div>
            </div>
          </div>

          {/* Card 3: Bares Mais Pesquisados */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-[#0B254B] to-indigo-600" />
            <h3 className="text-xs font-black text-slate-900 border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Search className="w-4 h-4 text-indigo-600" />
                <span>Bares mais pesquisados</span>
              </span>
              <span className="text-[10px] font-bold bg-blue-100 text-[#0B254B] px-2 py-0.5 rounded-full">Maputo</span>
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-950 font-black flex items-center justify-center text-[10px]">1</span>
                  <DrawnHighlight variant="underline" gradient={true} strokeWidth={2}>
                    <span className="font-bold text-slate-900">Bar Costa do Sol</span>
                  </DrawnHighlight>
                </span>
                <span className="text-[11px] font-bold bg-slate-100 px-2 py-0.5 rounded-md text-slate-700">700 buscas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">2</span>
                  <span className="font-semibold text-slate-800">Kanimambo Bar</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">655 buscas</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-[10px]">3</span>
                  <span className="font-semibold text-slate-800">Bar do Marisco & Petiscos</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-500">410 buscas</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
