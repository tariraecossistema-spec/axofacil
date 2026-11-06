import React, { useState } from 'react';
import { Establishment, PromoDeal, UserProfile } from "../types/types";
import { Plus, SlidersHorizontal, Star, Sparkles, MapPin, Search, Hotel, BedDouble, Key, Waves, Building2, Truck, ChevronRight, X } from 'lucide-react';
import { matchesEstablishment } from "../services/search";
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import SegmentPageHero from '../components/shared/SegmentPageHero';
import EstablishmentCard from '../components/shared/EstablishmentCard';

interface HospedagensPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion: (cat: 'hospedagem') => void;
  currentUser?: UserProfile | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const lodgingCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-hosp-1',
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1000&q=80',
    title: 'Hotéis Executivos & Suites Climatizadas',
    subtitle: 'Quartos modernos com Wi-Fi de alta velocidade, pequeno-almoço incluído e serviço de quarto.',
    badge: 'Hotéis & Suites'
  },
  {
    id: 'slide-hosp-2',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80',
    title: 'Resorts com Piscina & Vista Marítima',
    subtitle: 'Desfrute da orla de Maputo e Costa do Sol com piscinas tropicais e áreas de lazer relaxantes.',
    badge: 'Resorts & Lazer'
  },
  {
    id: 'slide-hosp-3',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1000&q=80',
    title: 'Pensões Aconchegantes & Bed & Breakfast',
    subtitle: 'Acomodações acolhedoras para viagens de negócios ou descanso familiar a preços acessíveis.',
    badge: 'Pensões & B&B'
  },
  {
    id: 'slide-hosp-4',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    title: 'Lodges Ecológicos & Escapadinhas na Província',
    subtitle: 'Refúgios na natureza, bangalôs à beira-mar e tranquilidade total para o seu fim de semana.',
    badge: 'Lodges & Natureza'
  }
];

export default function HospedagensPage({ 
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
}: HospedagensPageProps) {
  const [activeFilter, setActiveFilter] = useState('Todas');

  const hospedagens = establishments.filter(e => e.category === 'hospedagem');
  const hospDeals = deals.filter(d => d.category === 'hospedagem').sort((a, b) => a.rank - b.rank);

  // Filter logic
  const filteredHospedagens = hospedagens.filter(hosp => {
    // Feature filter
    if (activeFilter !== 'Todas') {
      const matchFeature = hosp.features.some(feat => feat.toLowerCase() === activeFilter.toLowerCase());
      if (!matchFeature) {
        return false;
      }
    }
    
    if (searchQuery && searchQuery.trim()) {
      return matchesEstablishment(hosp, searchQuery);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">

      <SegmentPageHero
        gradientClass="from-[#0B254B] via-[#081E3D] to-[#051429]"
        badgeIcon={Hotel}
        badgeLabel="Explorar · Hotéis, Hospedagens & Alojamento"
        badgeColorClass="bg-white/15 text-white border-white/25"
        title="Hotéis & Hospedagens em Maputo"
        subtitle="Do centro executivo à orla marítima — reserve quartos, suites e pensões familiares com conforto garantido e preços transparentes."
        tags={[
          { icon: BedDouble, label: 'Suites & Ar Condicionado', colorClass: 'text-slate-700' },
          { icon: Waves, label: 'Piscina & Vista Mar', colorClass: 'text-slate-700' },
          { icon: Key, label: 'Reservas & Check-in Rápido', colorClass: 'text-slate-700' }
        ]}
        carouselSlides={lodgingCarouselSlides}
        carouselKey="hospedagens"
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
                  Resultados para <span className="bg-slate-200 px-2 py-0.5 rounded-md text-[#0B254B]">"{searchQuery}"</span> ({filteredHospedagens.length} encontrados)
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

      {/* Filter Options */}
      <div className="px-[6vw] mb-6 flex flex-wrap gap-2 max-w-7xl mx-auto w-full">
        {['Todas', 'Perto da Baixa', 'Vista para o mar', 'Económicas'].map((filter, idx) => (
          <button
            key={`hosp-filter-${filter}-${idx}`}
            onClick={() => setActiveFilter(filter)}
            className={`py-2.5 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all border ${
              activeFilter === filter 
                ? 'bg-coral-brand text-white border-coral-brand shadow-sm shadow-coral-brand/20' 
                : 'bg-white text-ink/75 border-ink/12 hover:bg-sand-2/20'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Main Grid Section */}
      <section className="px-[6vw] mb-16 max-w-7xl mx-auto w-full">
        {filteredHospedagens.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-ink/15">
            <SlidersHorizontal className="w-8 h-8 text-ink/30 mx-auto mb-3" />
            <p className="text-sm font-semibold text-ink/60">Nenhuma hospedagem encontrada para a pesquisa actual.</p>
            <button 
              onClick={() => { 
                if (onClearSearch) onClearSearch();
                setActiveFilter('Todas'); 
              }} 
              className="text-xs text-coral-brand font-bold mt-2 underline cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredHospedagens.map((hosp, idx) => (
              <EstablishmentCard
                key={`hosp-card-${hosp.id}-${idx}`}
                est={hosp}
                theme="sky"
                badges={[
                  { label: 'Hospedagem & Hotel' },
                  ...(hosp.hasIntegratedDelivery ? [{ label: 'Transfer & Transporte', icon: Truck }] : []),
                  ...(hosp.salesType ? [{ label: hosp.salesType === 'grosso' ? 'A Grosso' : hosp.salesType === 'retalho' ? 'Retalho' : 'Grosso & Retalho' }] : [])
                ]}
                detailSlot={
                  <div className="bg-sand-2/40 p-2.5 rounded-xl border border-ink/8 text-[11px] space-y-1.5">
                    <div className="font-semibold text-sky-950 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-sky-700 shrink-0" />
                      <span className="truncate">Localização: {hosp.address}</span>
                    </div>
                    {hosp.locationLandmarks && (
                      <div className="text-ink/65 italic line-clamp-1">
                        Ponto de referência: {hosp.locationLandmarks}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEstablishment(hosp);
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
                      <span>Transporte & Estadia</span>
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
                onClick={() => onSelectEstablishment(hosp)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Statistical Section */}
      <section className="px-[6vw] max-w-7xl mx-auto w-full">
        <div className="border-b border-ink/12 pb-4 mb-6">
          <h2 className="font-serif font-bold text-2xl text-indigo-deep">Mais procurados</h2>
          <p className="text-xs text-ink/50 mt-1">Com base em visitas e pesquisas dentro do Axofácil!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-coral-brand border-b border-ink/10 pb-3 mb-4">
              Mais reservadas
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span><span className="font-bold text-terracotta mr-1.5">1.</span>Pensão Girassol</span>
                <span className="text-ink/50">410 reservas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span><span className="font-bold text-terracotta mr-1.5">2.</span>Hospedagem Marisol</span>
                <span className="text-ink/50">365 reservas</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="font-bold text-terracotta mr-1.5">3.</span>Residencial Vista Mar</span>
                <span className="text-ink/50">290 reservas</span>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-coral-brand border-b border-ink/10 pb-3 mb-4">
              Mais visitadas (perfil)
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span><span className="font-bold text-terracotta mr-1.5">1.</span>Hospedagem Marisol</span>
                <span className="text-ink/50">1.050 visitas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span><span className="font-bold text-terracotta mr-1.5">2.</span>Pensão Girassol</span>
                <span className="text-ink/50">890 visitas</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="font-bold text-terracotta mr-1.5">3.</span>Pensão Central</span>
                <span className="text-ink/50">640 visitas</span>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-coral-brand border-b border-ink/10 pb-3 mb-4">
              Mais pesquisadas
            </h3>
            <div className="space-y-3.5 text-xs font-medium">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span><span className="font-bold text-terracotta mr-1.5">1.</span>Pensão Girassol</span>
                <span className="text-ink/50">520 buscas</span>
              </div>
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-ink/8">
                <span><span className="font-bold text-terracotta mr-1.5">2.</span>Residencial Vista Mar</span>
                <span className="text-ink/50">480 buscas</span>
              </div>
              <div className="flex justify-between items-center">
                <span><span className="font-bold text-terracotta mr-1.5">3.</span>Hospedagem Marisol</span>
                <span className="text-ink/50">455 buscas</span>
              </div>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
