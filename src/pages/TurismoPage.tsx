import React, { useState } from 'react';
import { Establishment, PromoDeal, UserProfile, ProductItem, FlightSchedule } from "../types/types";
import { 
  Plane, Globe2, Church, Ticket, Bus, ChevronRight, Users, CalendarDays, 
  Truck, PackageCheck, Warehouse, MapPin, Phone, MessageSquare, ShieldCheck, 
  Clock, Award, Star, CheckCircle2, ArrowRight, Sparkles, SlidersHorizontal, 
  Info, Luggage, Navigation, CreditCard, ShoppingBag, Search, PlaneTakeoff,
  PlaneLanding, QrCode, RefreshCw, Smartphone, Compass, HeartHandshake, FileText, X
} from 'lucide-react';
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import SegmentPageHero from '../components/shared/SegmentPageHero';
import TurismoReservationModal from '../components/modals/TurismoReservationModal';
import FlightSearchBox from '../components/shared/FlightSearchBox';
import AirportLiveBoard from '../components/shared/AirportLiveBoard';
import FlightBookingModal from '../components/modals/FlightBookingModal';
import ManageFlightBookingModal from '../components/modals/ManageFlightBookingModal';
import MultimodalHub from '../components/shared/MultimodalHub';
import TravelXitiqueModal from '../components/modals/TravelXitiqueModal';
import BorderAndEVisaAssistantModal from '../components/modals/BorderAndEVisaAssistantModal';
import { searchFlights, FLIGHT_SCHEDULES } from "../data/flightData";

interface TurismoPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion: (cat: 'turismo') => void;
  currentUser?: UserProfile | null;
  setCurrentUser?: (user: UserProfile) => void;
  onOpenAuth?: (tab: 'login' | 'criar') => void;
  onAddToCart?: (product: ProductItem, est: Establishment, quantity?: number) => void;
  onOpenPurchases?: () => void;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

// Verified promotional carousel slides for Turismo & Logística featuring Mozambique & Africa
const turismoCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-tur-0',
    image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80',
    title: 'Sincronização & Compra de Bilhetes de Viagens Aéreas',
    subtitle: 'Compre passagens diretamente da nossa plataforma com ligação aos Aeroportos de Maputo, Beira, Nampula, África Austral e do Mundo.',
    badge: 'Aeroportos & Bilhética Aérea'
  },
  {
    id: 'slide-tur-1',
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1200&q=80',
    title: 'Praias de Moçambique, Farol & Ponta do Ouro',
    subtitle: 'Roteiros de sonho no litoral moçambicano com transporte climatizado, alojamento à beira-mar e mergulho.',
    badge: 'Moçambique & Praias'
  },
  {
    id: 'slide-tur-2',
    image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1200&q=80',
    title: 'Ilha de Inhaca & Farol Histórico na Baía de Maputo',
    subtitle: 'Travessia de barco pela Baía de Maputo, visita ao Farol de Inhaca, corais de Santa Maria e mariscos frescos.',
    badge: 'Património & Ilhas'
  },
  {
    id: 'slide-tur-3',
    image: 'https://images.unsplash.com/photo-1548625361-165b48cb943d?auto=format&fit=crop&w=1200&q=80',
    title: 'Circuito Religioso de Maputo & Peregrinação a Namaacha',
    subtitle: 'Visitas guiadas à Sé Catedral de Maputo, Igreja da Polana e Santuário de Nossa Senhora de Fátima.',
    badge: 'Turismo Religioso'
  },
  {
    id: 'slide-tur-4',
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    title: 'Safari Reserva Especial de Maputo & Vida Selvagem Africana',
    subtitle: 'Expedição 4x4 na savana moçambicana, manadas de elefantes, lagoas e biodiversidade africana.',
    badge: 'Safaris & Natureza'
  },
  {
    id: 'slide-tur-5',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1200&q=80',
    title: 'Logística Axofácil! — Entregas e Cargas Entre Lojas e Mercados',
    subtitle: 'A mesma frota expressa liga e abastece todas as lojas parceiras em Maputo, Matola e províncias.',
    badge: 'Logística & Entregas'
  }
];

const TURISMO_FILTERS: { label: string; icon: React.ElementType; tourismType?: string; isFlightSection?: boolean; isMultimodalSection?: boolean }[] = [
  { label: 'Passe Multimodal Inteligente (Voo+4x4+Lodge)', icon: Compass, isMultimodalSection: true },
  { label: 'Bilhetes Aéreos & Aeroportos', icon: Plane, isFlightSection: true },
  { label: 'Todos os Serviços & Roteiros', icon: SlidersHorizontal },
  { label: 'Roteiros Moçambique & Praias', icon: Bus, tourismType: 'domestico' },
  { label: 'Turismo Religioso', icon: Church, tourismType: 'religioso' },
  { label: 'Turismo Internacional', icon: Globe2, tourismType: 'internacional' },
  { label: 'Logística & Entregas', icon: Truck, tourismType: 'logistica' }
];

export default function TurismoPage({ 
  establishments, 
  deals, 
  onSelectEstablishment, 
  onAddPromotion, 
  currentUser,
  setCurrentUser,
  onOpenAuth,
  onAddToCart,
  onOpenPurchases,
  searchQuery,
  onClearSearch,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: TurismoPageProps) {
  const [activeFilter, setActiveFilter] = useState('Passe Multimodal Inteligente (Voo+4x4+Lodge)');
  const [selectedReservationProduct, setSelectedReservationProduct] = useState<ProductItem | null>(null);
  
  // Xitique & e-Visa modal states
  const [isXitiqueModalOpen, setIsXitiqueModalOpen] = useState(false);
  const [xitiqueConfig, setXitiqueConfig] = useState<{ title: string; amountMT: number }>({
    title: 'Passe Multimodal Moçambique',
    amountMT: 24000
  });
  const [isEVisaModalOpen, setIsEVisaModalOpen] = useState(false);
  
  // Flight state
  const [flightSubTab, setFlightSubTab] = useState<'search' | 'live_board'>('search');
  const [selectedFlightForBooking, setSelectedFlightForBooking] = useState<{
    outbound: FlightSchedule;
    returnFlight?: FlightSchedule;
    tripType: 'one_way' | 'round_trip';
    outboundDate: string;
    returnDate?: string;
    cabinClass: 'economy' | 'premium_economy' | 'business';
    passengersCount: number;
  } | null>(null);
  const [isManageBookingOpen, setIsManageBookingOpen] = useState(false);

  // Flight search results
  const [flightSearchResults, setFlightSearchResults] = useState<{
    outbound: FlightSchedule[];
    inbound: FlightSchedule[];
    searchParams: any;
  } | null>(() => {
    // Initial search: Maputo to Joanesburgo
    const res = searchFlights({
      originCode: 'MPM',
      destinationCode: 'JNB',
      tripType: 'round_trip',
      outboundDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      returnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      cabinClass: 'economy',
      passengersCount: 1,
      stopsFilter: 'all',
      airlineCode: 'all'
    });
    return {
      outbound: res.outbound,
      inbound: res.inbound,
      searchParams: {
        originCode: 'MPM',
        destinationCode: 'JNB',
        tripType: 'round_trip',
        outboundDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        returnDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        cabinClass: 'economy',
        passengersCount: 1
      }
    };
  });

  const handleSelectFilter = (filterLabel: string) => {
    setActiveFilter(filterLabel);
    const catalogEl = document.getElementById('turismo-catalogo-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFlightSearch = (params: any) => {
    const res = searchFlights(params);
    setFlightSearchResults({
      outbound: res.outbound,
      inbound: res.inbound,
      searchParams: params
    });
    const resultsEl = document.getElementById('flight-results-section');
    if (resultsEl) {
      resultsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Single-store model: Find the official Ache Turismo store
  const store = establishments.find(e => e.id === 't1' || e.category === 'turismo') || null;
  const activeDef = TURISMO_FILTERS.find(f => f.label === activeFilter);

  // Filter the catalog items of the single store
  const allCatalogItems: ProductItem[] = store?.productsCatalog || [];

  const filteredCatalog = allCatalogItems.filter(item => {
    if (activeDef?.tourismType && item.tourismType !== activeDef.tourismType) {
      return false;
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchDest = (item.destination || '').toLowerCase().includes(q);
      const matchCat = (item.category || '').toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchDest && !matchCat) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">

      {/* SEGMENT HERO BANNER */}
      <SegmentPageHero
        gradientClass="from-[#0B254B] via-[#081E3D] to-[#051429]"
        badgeIcon={Plane}
        badgeLabel="Agência & Balcão Oficial · Turismo e Logística"
        badgeColorClass="bg-white/15 text-white border-white/25"
        title="Turismo, Viagens & Bilhética Aérea"
        subtitle="Sincronização direta de compra de bilhetes com o Aeroporto Internacional de Maputo, rotas de África Austral e internacionais, pacotes turísticos em Moçambique e rede de logística expressa."
        tags={[
          { icon: Plane, label: 'Bilhética Aérea Sincronizada', colorClass: 'text-slate-700' },
          { icon: Globe2, label: 'Receptivo no Aeroporto', colorClass: 'text-slate-700' },
          { icon: Bus, label: 'Frota Própria Climatizada', colorClass: 'text-slate-700' },
          { icon: Truck, label: 'Logística Entre Lojas', colorClass: 'text-slate-700' }
        ]}
        carouselSlides={turismoCarouselSlides}
        carouselKey="turismo"
        currentUser={currentUser}
        onNavigate={onNavigate}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        onInquireClick={onInquireClick}
      />

      {/* OFFICIAL STORE PROFILE SUMMARY HEADER CARD - Fundo Branco & Botões Diferenciados */}
      <section className="px-[6vw] -mt-8 relative z-20 mb-8 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
          <div className="bg-white p-6 sm:p-8 text-slate-900 border-b border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              
              {/* Left Identity */}
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#0B254B] text-white text-xs font-bold py-1 px-3 rounded-full shadow-2xs">
                    <Award className="w-3.5 h-3.5" /> Balcão Oficial
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold py-1 px-2.5 rounded-full">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0B254B]" /> Sincronizado com Aeroportos Nacionais
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-slate-800 font-bold bg-slate-100 py-1 px-2.5 rounded-full border border-slate-200">
                    <Star className="w-3.5 h-3.5 fill-[#103B75] text-[#103B75]" /> 4.9 (148 emissões de bilhetes)
                  </span>
                </div>

                <div>
                  <h1 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
                    Turismo, Viagens & Bilhética Aérea Axofácil!
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    Compre passagens aéreas para voos domésticos (Maputo, Beira, Nampula, Pemba) e internacionais (Joanesburgo, Lisboa, Luanda, Doha) com pagamento direto por M-Pesa, e-Mola ou SIMO e emissão instantânea de E-Ticket.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1 font-medium">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-[#0B254B] shrink-0" />
                    <span>Aeroporto Internacional de Maputo & Av. 24 de Julho nº 1100</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                    <span>Emissão Online 24/7 · Balcão Presencial (07:30 – 18:30)</span>
                  </div>
                </div>
              </div>

              {/* Right Action Callouts com Botões Cinzentos e Azul Escuro Diferenciados */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 w-full md:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setXitiqueConfig({ title: 'Pacote de Viagem Moçambique', amountMT: 24000 });
                    setIsXitiqueModalOpen(true);
                  }}
                  className="bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:scale-102"
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>Xitique & Split M-Pesa</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsEVisaModalOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm py-3 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0B254B]" />
                  <span>e-Visa & Alfândegas MZ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsManageBookingOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-semibold text-xs sm:text-sm py-3 px-5 rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                >
                  <Search className="w-4 h-4 text-[#0B254B]" />
                  <span>Gerir Reserva / Check-in</span>
                </button>
              </div>

            </div>
          </div>

          {/* Quick Highlight Strips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 bg-slate-50 text-xs">
            <div className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-[#0B254B] flex items-center justify-center shrink-0 font-bold">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Passe Multimodal</div>
                <div className="text-[11px] text-slate-500">Voo + 4x4 + Barco + Hotel num bilhete</div>
              </div>
            </div>

            <div className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-[#0B254B] flex items-center justify-center shrink-0 font-bold">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">M-Pesa & Xitique</div>
                <div className="text-[11px] text-slate-500">Divida ou poupe em grupo</div>
              </div>
            </div>

            <div className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-[#0B254B] flex items-center justify-center shrink-0 font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">e-Visa Moçambique</div>
                <div className="text-[11px] text-slate-500">Isenção para 28 países & Alfândega</div>
              </div>
            </div>

            <div className="p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-[#0B254B] flex items-center justify-center shrink-0 font-bold">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-slate-900">Logística Integrada</div>
                <div className="text-[11px] text-slate-500">Frota expressa de cargas e transfers</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY FILTER TABS */}
      <div className="px-[6vw] mb-8 flex flex-wrap gap-2 max-w-7xl mx-auto w-full">
        {TURISMO_FILTERS.map((filter, idx) => {
          const Icon = filter.icon;
          const isSelected = activeFilter === filter.label;
          return (
            <button
              key={`tur-filter-${filter.label}-${idx}`}
              onClick={() => handleSelectFilter(filter.label)}
              className={`py-2.5 px-5 rounded-full text-xs font-semibold cursor-pointer transition-all border flex items-center gap-2 ${
                isSelected
                  ? 'bg-cyan-700 text-white border-cyan-700 shadow-md shadow-cyan-700/20 ring-2 ring-cyan-500/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 1. MULTIMODAL SUPERPASS SECTION */}
      {/* ========================================================================= */}
      {activeFilter === 'Passe Multimodal Inteligente (Voo+4x4+Lodge)' && (
        <section className="px-[6vw] mb-12 max-w-7xl mx-auto w-full">
          <MultimodalHub
            onOpenXitique={(title, amount) => {
              setXitiqueConfig({ title, amountMT: amount });
              setIsXitiqueModalOpen(true);
            }}
            onOpenEVisa={() => setIsEVisaModalOpen(true)}
          />
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. FLIGHT BOOKING & AIRPORT SYNCHRONIZATION MODULE */}
      {/* ========================================================================= */}
      {activeFilter === 'Bilhetes Aéreos & Aeroportos' && (
        <section className="px-[6vw] mb-12 max-w-7xl mx-auto w-full space-y-8">
          
          {/* Sub Tab Switcher: Flight Search vs Live Airport Board */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFlightSubTab('search')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  flightSubTab === 'search'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Pesquisa & Compra de Voos</span>
              </button>

              <button
                type="button"
                onClick={() => setFlightSubTab('live_board')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  flightSubTab === 'live_board'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 text-cyan-400" />
                <span>Painel FIDS em Direto (Aeroporto de Maputo MPM)</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsManageBookingOpen(true)}
              className="text-xs font-bold text-cyan-700 hover:text-cyan-900 flex items-center gap-1.5 cursor-pointer underline"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Gerir Reserva / Imprimir Cartão de Embarque</span>
            </button>
          </div>

          {/* VIEW 1: SEARCH & BOOK FLIGHTS */}
          {flightSubTab === 'search' && (
            <div className="space-y-8">
              {/* Flight Search Box */}
              <FlightSearchBox
                onSearch={handleFlightSearch}
                initialOrigin={flightSearchResults?.searchParams?.originCode || 'MPM'}
                initialDestination={flightSearchResults?.searchParams?.destinationCode || 'JNB'}
              />

              {/* Flight Search Results */}
              <div id="flight-results-section" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif font-bold text-xl text-slate-900 flex items-center gap-2">
                      <span>Voos Encontrados</span>
                      {flightSearchResults?.outbound && (
                        <span className="text-xs font-bold bg-cyan-100 text-cyan-800 py-0.5 px-2 rounded-full">
                          {flightSearchResults.outbound.length} voo{flightSearchResults.outbound.length > 1 ? 's' : ''} disponível{flightSearchResults.outbound.length > 1 ? 'is' : ''}
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Preços oficiais sincronizados em Meticais (MT) com taxas incluídas.
                    </p>
                  </div>
                </div>

                {/* Outbound Flights List */}
                <div className="space-y-4">
                  {flightSearchResults?.outbound?.map((flight, flIdx) => (
                    <div
                      key={`flight-item-${flight.id}-${flIdx}`}
                      className="bg-white rounded-3xl border-2 border-slate-200 hover:border-cyan-500/60 shadow-sm hover:shadow-lg transition-all p-5 sm:p-6 space-y-4"
                    >
                      {/* Top Bar with Airline & Aircraft */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-xl ${flight.airline.logoBgColor || 'bg-slate-800'} text-white font-bold text-xs flex items-center justify-center shadow-2xs`}>
                            {flight.airline.code}
                          </span>
                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{flight.airline.name}</span>
                              <span className="font-mono text-xs text-slate-500 font-normal">({flight.flightNumber})</span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Aeronave: {flight.aircraft} · {flight.terminal}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="bg-slate-100 text-[#0B254B] border border-slate-200 py-0.5 px-2.5 rounded-full font-bold">
                            {flight.stops === 0 ? '✓ Voo Direto' : `${flight.stops} Escala (${flight.stopCities?.join(', ')})`}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {flight.mealIncluded || 'Snack a Bordo'}
                          </span>
                        </div>
                      </div>

                      {/* Flight Route and Timings */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* Departure */}
                        <div className="sm:col-span-4 space-y-0.5">
                          <div className="text-2xl font-bold font-mono text-slate-900">{flight.departureTime}</div>
                          <div className="font-bold text-sm text-slate-800">
                            {flight.origin.city} ({flight.origin.code})
                          </div>
                          <div className="text-[11px] text-slate-500">{flight.origin.name}</div>
                        </div>

                        {/* Duration Center Graphic */}
                        <div className="sm:col-span-4 text-center space-y-1">
                          <div className="text-xs font-semibold text-slate-500">{flight.durationFormatted}</div>
                          <div className="relative flex items-center justify-center">
                            <div className="w-full h-0.5 bg-slate-200"></div>
                            <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center absolute">
                              <Plane className="w-3.5 h-3.5 text-[#103B75]" />
                            </div>
                          </div>
                          <div className="text-[10px] text-slate-400">
                            Bagagem: {flight.baggageAllowance.checkedBagsCount}x {flight.baggageAllowance.checkedKg}kg Porão
                          </div>
                        </div>

                        {/* Arrival */}
                        <div className="sm:col-span-4 sm:text-right space-y-0.5">
                          <div className="text-2xl font-bold font-mono text-slate-900">{flight.arrivalTime}</div>
                          <div className="font-bold text-sm text-slate-800">
                            {flight.destination.city} ({flight.destination.code})
                          </div>
                          <div className="text-[11px] text-slate-500">{flight.destination.name}</div>
                        </div>
                      </div>

                      {/* Price & Booking Bottom Bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-slate-100">
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          <div className="flex items-center gap-1 font-semibold text-[#103B75]">
                            <Luggage className="w-4 h-4" />
                            <span>1x 7kg Mão + {flight.baggageAllowance.checkedKg}kg Despachada</span>
                          </div>
                          <div className="text-slate-400">|</div>
                          <div>Assentos Restantes: <strong className="text-slate-900">{flight.availableSeatsEconomy}</strong></div>
                        </div>

                        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">Por Passageiro</span>
                            <div className="font-serif font-black text-xl text-slate-900">
                              {(flight.basePriceEconomyMT + flight.taxesMT).toLocaleString('pt-PT')} <span className="text-xs font-sans text-slate-600 font-bold">MT</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => setSelectedFlightForBooking({
                              outbound: flight,
                              returnFlight: flightSearchResults?.inbound?.[0],
                              tripType: flightSearchResults?.searchParams?.tripType || 'round_trip',
                              outboundDate: flightSearchResults?.searchParams?.outboundDate || new Date().toISOString().split('T')[0],
                              returnDate: flightSearchResults?.searchParams?.returnDate,
                              cabinClass: flightSearchResults?.searchParams?.cabinClass || 'economy',
                              passengersCount: flightSearchResults?.searchParams?.passengersCount || 1
                            })}
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                          >
                            <Ticket className="w-4 h-4" />
                            <span>Reservar & Emitir Bilhete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: LIVE AIRPORT FLIGHT BOARD */}
          {flightSubTab === 'live_board' && (
            <AirportLiveBoard 
              onSelectFlightToBook={(flight) => setSelectedFlightForBooking({
                outbound: flight,
                tripType: 'one_way',
                outboundDate: new Date().toISOString().split('T')[0],
                cabinClass: 'economy',
                passengersCount: 1
              })}
            />
          )}

        </section>
      )}

      {/* Active Search Filter Banner (Synchronized from Landing Page) */}
      {searchQuery && searchQuery.trim() && (
        <div className="px-[6vw] mb-6 max-w-7xl mx-auto w-full">
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-200 text-[#0B254B] flex items-center justify-center font-bold">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#0B254B]">
                  Filtro Ativo da Pesquisa Central:
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  Resultados para <span className="bg-slate-200 px-2 py-0.5 rounded-md text-[#0B254B]">"{searchQuery}"</span> ({filteredCatalog.length} encontrados)
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

      {/* MAIN CATALOG OF PACKAGES & SERVICES */}
      {activeFilter !== 'Bilhetes Aéreos & Aeroportos' && (
        <section id="turismo-catalogo-section" className="px-[6vw] mb-16 max-w-7xl mx-auto w-full scroll-mt-24">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                Catálogo de Serviços & Roteiros Turísticos
              </h2>
              <p className="text-xs text-slate-500">
                {filteredCatalog.length} serviço{filteredCatalog.length === 1 ? '' : 's'} ou pacote{filteredCatalog.length === 1 ? '' : 's'} encontrado{filteredCatalog.length === 1 ? '' : 's'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => store && onSelectEstablishment(store)}
              className="text-xs font-bold text-cyan-800 hover:text-cyan-950 flex items-center gap-1 underline cursor-pointer"
            >
              <span>Ver detalhes no balcão da loja</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredCatalog.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
              <SlidersHorizontal className="w-8 h-8 text-slate-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-600">Nenhum pacote encontrado para o filtro seleccionado.</p>
              <button
                onClick={() => {
                  if (onClearSearch) onClearSearch();
                  setActiveFilter('Todos os Serviços & Roteiros');
                }}
                className="text-xs text-cyan-700 font-bold mt-2 underline cursor-pointer"
              >
                Limpar Filtros & Ver Todos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalog.map((item, idx) => {
                const isLogistics = item.tourismType === 'logistica';
                const isInternational = item.tourismType === 'internacional';
                const isReligioso = item.tourismType === 'religioso';
                const isBilhete = item.tourismType === 'bilhete';

                return (
                  <div
                    key={`tur-item-${item.id}-${idx}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Header */}
                      <div className="relative h-48 sm:h-52 overflow-hidden bg-slate-100">
                        <img
                          src={item.imageUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-linear-to-t from-slate-950/80 via-transparent to-black/20" />
                        
                        {/* Category Badge */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full text-white shadow-xs ${
                            isLogistics ? 'bg-slate-700' :
                            isInternational ? 'bg-[#0B254B]' :
                            isReligioso ? 'bg-slate-800' :
                            isBilhete ? 'bg-[#103B75]' :
                            'bg-[#0B254B]'
                          }`}>
                            {item.category}
                          </span>
                        </div>

                        {/* Destination / Unit Badge */}
                        {item.destination && (
                          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs">
                            <span className="flex items-center gap-1 font-semibold truncate bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
                              <MapPin className="w-3 h-3 text-white shrink-0" />
                              <span className="truncate">{item.destination}</span>
                            </span>
                            {item.durationLabel && (
                              <span className="bg-black/60 backdrop-blur-xs px-2 py-1 rounded-lg text-[10px] font-bold text-blue-100">
                                {item.durationLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Body Content */}
                      <div className="p-4 sm:p-5 space-y-3">
                        <div>
                          <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 leading-snug">
                            {item.name}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1.5 line-clamp-3 leading-relaxed">
                            {item.description}
                          </p>
                        </div>

                        {/* Feature Inclusions Chips */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {item.includesTransport && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 py-0.5 px-2 rounded-md flex items-center gap-1">
                              <Bus className="w-2.5 h-2.5" /> Transporte Próprio
                            </span>
                          )}
                          {item.includesAirportPickup && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-[#0B254B] border border-slate-200 py-0.5 px-2 rounded-md flex items-center gap-1">
                              <Plane className="w-2.5 h-2.5" /> Receptivo Aeroporto
                            </span>
                          )}
                          {item.includesGuide && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 py-0.5 px-2 rounded-md flex items-center gap-1">
                              <Users className="w-2.5 h-2.5" /> Guia Acompanhante
                            </span>
                          )}
                          {item.includesLodging && (
                            <span className="text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200 py-0.5 px-2 rounded-md flex items-center gap-1">
                              <Warehouse className="w-2.5 h-2.5" /> Alojamento Incluso
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer with Price and Actions */}
                    <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 mt-3">
                      <div className="flex items-baseline justify-between mb-3 pt-3">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-500 block uppercase">
                            {item.unitLabel ? item.unitLabel : 'Preço Oficial'}
                          </span>
                          <span className="font-serif font-extrabold text-xl text-slate-900">
                            {item.priceMT.toLocaleString('pt-PT')} <span className="text-xs font-sans text-slate-600">MT</span>
                          </span>
                        </div>
                        {item.upfrontPercentage && (
                          <span className="text-[10px] text-[#103B75] bg-blue-50 border border-blue-200 font-bold px-2 py-1 rounded-md">
                            Sinal: {item.upfrontPercentage}%
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReservationProduct(item)}
                          className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-3 rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:border-cyan-700"
                          title="Ver detalhes e agendar data"
                        >
                          <CalendarDays className="w-3.5 h-3.5 text-cyan-700" />
                          <span>Agendar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedReservationProduct(item)}
                          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
                          title="Reservar e efetuar pagamento de sinal ou total"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Reservar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* DETAILED INFORMATION SECTION: RECEPTIVO NO AEROPORTO & FROTA */}
      <section className="px-[6vw] mb-12 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          
          {/* Box 1: Receptivo & Aeroporto */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0B254B] border border-slate-200 flex items-center justify-center">
                <Plane className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                Receptivo no Aeroporto de Maputo
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                A nossa equipa oficial aguarda os passageiros na porta de desembarque do Aeroporto Internacional de Maputo com placa identificativa, assistência com bagagem e transfer direto em minibus climatizados para o hotel ou destino escolhido.
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#103B75] shrink-0" />
                  <span>Transfer pontual com motoristas credenciados</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#103B75] shrink-0" />
                  <span>Veículos climatizados com capacidade para até 30 passageiros</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#103B75] shrink-0" />
                  <span>Apoio completo para bagagens e check-in em hotéis parceiros</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href="https://wa.me/258843005000?text=Olá,%20preciso%20de%20agendamento%20de%20transfer%20e%20receptivo%20no%20aeroporto"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#103B75] hover:text-[#0B254B] underline"
              >
                <span>Solicitar agendamento de transfer aeroporto</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Box 2: Rede de Logística Integrada */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0B254B] border border-slate-200 flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                Rede de Logística Integrada
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Utilizando a mesma frota e estrutura do turismo, garantimos entregas ágeis e seguras entre lojas, supermercados, bares e estaleiros de construção cadastrados na plataforma em toda a Grande Maputo e Matola.
              </p>
              <div className="space-y-2 pt-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#103B75] shrink-0" />
                  <span>Transporte de mercadorias e reposição de stock entre lojas</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#103B75] shrink-0" />
                  <span>Rota fixa diária e económica Baixa ↔ Matola</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#103B75] shrink-0" />
                  <span>Carrinhas de carga com capacidade de até 1.500 kg por viagem</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <a
                href="https://wa.me/258843005000?text=Olá,%20gostaria%20de%20contratar%20serviço%20de%20logística%20entre%20lojas"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#103B75] hover:text-[#0B254B] underline"
              >
                <span>Contratar rota de transporte ou entrega para a sua loja</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* BANNER INFORMATIVO FINAL & CONTACTO OFICIAL */}
      <section className="px-[6vw] max-w-7xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-950 via-[#0B254B] to-[#103B75] border border-blue-400/30 p-8 sm:p-12 text-white shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="inline-flex items-center gap-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/30 text-xs font-bold py-1 px-3 rounded-full">
              <Award className="w-3.5 h-3.5" /> Atendimento Personalizado
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white">
              Planeie a sua viagem aérea ou transporte com a equipa Axofácil!
            </h2>
            <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
              Deseja reservar passagens para delegações empresariais, turismo em grupo para Bilene ou Bazaruto, ou precisa de despacho aéreo de encomendas? Fale diretamente com o nosso gestor de operações aéreas.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="https://wa.me/258843005000?text=Olá,%20gostaria%20de%20um%20orçamento%20personalizado%20para%20Turismo%20e%20Bilhetes%20Aéreos"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white hover:bg-slate-100 text-[#0B254B] font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-[#0B254B]" />
                <span>Contactar Gestor de Operações Aéreas</span>
              </a>
              <a
                href="tel:+258843005000"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>Ligar: +258 84 300 5000</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* FLIGHT BOOKING & CHECKOUT MODAL */}
      {selectedFlightForBooking && (
        <FlightBookingModal
          isOpen={Boolean(selectedFlightForBooking)}
          onClose={() => setSelectedFlightForBooking(null)}
          outboundFlight={selectedFlightForBooking.outbound}
          returnFlight={selectedFlightForBooking.returnFlight}
          tripType={selectedFlightForBooking.tripType}
          outboundDate={selectedFlightForBooking.outboundDate}
          returnDate={selectedFlightForBooking.returnDate}
          cabinClass={selectedFlightForBooking.cabinClass}
          passengersCount={selectedFlightForBooking.passengersCount}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onOpenPurchases={onOpenPurchases}
        />
      )}

      {/* MANAGE BOOKING & ONLINE CHECK-IN MODAL */}
      <ManageFlightBookingModal
        isOpen={isManageBookingOpen}
        onClose={() => setIsManageBookingOpen(false)}
      />

      {/* TOURISM PACKAGES RESERVATION MODAL */}
      {selectedReservationProduct && store && (
        <TurismoReservationModal
          isOpen={Boolean(selectedReservationProduct)}
          onClose={() => setSelectedReservationProduct(null)}
          product={selectedReservationProduct}
          establishment={store}
          currentUser={currentUser}
          onOpenAuth={onOpenAuth}
          onAddToCart={onAddToCart}
          onOpenPurchases={onOpenPurchases}
        />
      )}

      {/* XITIQUE DE VIAGEM & SPLIT M-PESA MODAL */}
      <TravelXitiqueModal
        isOpen={isXitiqueModalOpen}
        onClose={() => setIsXitiqueModalOpen(false)}
        tripTitle={xitiqueConfig.title}
        totalAmountMT={xitiqueConfig.amountMT}
      />

      {/* E-VISA & CUSTOMS ASSISTANT MODAL */}
      <BorderAndEVisaAssistantModal
        isOpen={isEVisaModalOpen}
        onClose={() => setIsEVisaModalOpen(false)}
      />

    </div>
  );
}
