import React, { useState } from 'react';
import { DeliveryPartner, UserProfile, Establishment } from "../types/types";
import { saveDeliveryPartners } from "../data/data";
import { Truck, Bike, Car, MapPin, Phone, Star, ShieldCheck, Plus, CheckCircle, Search, Sparkles, Filter, AlertCircle, MessageCircle, Lock, ShoppingBag, ExternalLink, ChevronRight, Navigation, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import { notify } from "../services/dialogs";
import StoreLocationMap from '../components/shared/StoreLocationMap';
import NowBoardingHeroBanner from '../components/shared/NowBoardingHeroBanner';
import DeliveryDetailsModal from '../components/modals/DeliveryDetailsModal';

interface EntregadoresPageProps {
  couriers: DeliveryPartner[];
  setCouriers: (couriers: DeliveryPartner[]) => void;
  setActivePage: (page: any) => void;
  currentUser?: UserProfile | null;
  establishments?: Establishment[];
  onSelectEstablishment?: (est: Establishment) => void;
  onInquireClick?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

const deliveryCarouselSlides: CarouselSlide[] = [
  {
    id: 'slide-deliv-1',
    image: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=1000&q=80',
    title: 'Moto-Táxi & Estafetas Express',
    subtitle: 'Entregas ultra-rápidas em minutos para documentos, refeições, vestuário e pequenos volumes em Maputo.',
    badge: 'Motos & Express'
  },
  {
    id: 'slide-deliv-2',
    image: 'https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=1000&q=80',
    title: 'Táxis & Transporte Urbano de Lojas',
    subtitle: 'Serviço de táxi e viaturas privadas para transporte seguro de clientes e compras com bagagem.',
    badge: 'Táxis & Carros'
  },
  {
    id: 'd3',
    image: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=1000&q=80',
    title: 'Sincronização Directa com Lojas da Baixa',
    subtitle: 'Estafetas parceiros levam encomendas diretas aos bairros da Matola, Zimpeto, Boane e Costa do Sol.',
    badge: 'Logística Lojas'
  },
  {
    id: 'd4',
    image: 'https://images.unsplash.com/photo-1617347454431-f49d7ff5c3b1?auto=format&fit=crop&w=1000&q=80',
    title: 'Furgões de Carga & Fretes Pesados',
    subtitle: 'Transporte de eletrodomésticos, sacos de cimento, mobília e encomendas volumosas.',
    badge: 'Fretes & Cargas'
  }
];

export default function EntregadoresPage({ 
  couriers, 
  setCouriers, 
  setActivePage, 
  currentUser, 
  establishments = [], 
  onSelectEstablishment,
  onInquireClick,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome
}: EntregadoresPageProps) {
  const [vehicleFilter, setVehicleFilter] = useState<'todos' | 'moto' | 'carro' | 'furgão'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const isSubscriber = currentUser !== null && currentUser !== undefined;
  
  // Filter establishments that opted into integrated delivery
  const syncedEstablishments = establishments.filter(e => e.hasIntegratedDelivery);
  
  // Registration Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [showDeliveryDetails, setShowDeliveryDetails] = useState(false);
  const [name, setName] = useState('');
  const [vehicleType, setVehicleType] = useState<'moto' | 'carro' | 'furgão'>('moto');
  const [plateNumber, setPlateNumber] = useState('');
  const [residenceZone, setResidenceZone] = useState('Alto Maé / Baixa');
  const [phone, setPhone] = useState('+258 84 ');
  const [baseRate, setBaseRate] = useState('200 MT / entrega');
  const [imageUrl, setImageUrl] = useState('');
  const [courierLat, setCourierLat] = useState<number | undefined>(undefined);
  const [courierLng, setCourierLng] = useState<number | undefined>(undefined);

  const filteredCouriers = couriers.filter(c => {
    if (vehicleFilter !== 'todos' && c.vehicleType !== vehicleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.residenceZone.toLowerCase().includes(q) ||
        c.plateNumber.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !plateNumber.trim()) {
      notify('Por favor preencha os dados obrigatórios do veículo e contacto.', 'error');
      return;
    }

    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=Olá%20${encodeURIComponent(name)},%20vi%20o%20seu%20contacto%20no%20Axofácil!%20e%20preciso%20de%20um%20serviço%20de%20entrega`;

    const newCourier: DeliveryPartner = {
      id: 'cour_' + Date.now(),
      name: name.trim(),
      vehicleType,
      plateNumber: plateNumber.trim().toUpperCase(),
      residenceZone: residenceZone.trim(),
      phone: phone.trim(),
      whatsappLink: waLink,
      baseRate: baseRate.trim() || '200 MT',
      rating: 5.0,
      isAvailable: true,
      subscriptionPaid: true,
      latitude: courierLat,
      longitude: courierLng,
      imageUrl: imageUrl.trim() || (
        vehicleType === 'moto' 
          ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
          : vehicleType === 'carro' 
          ? 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1586191582056-a15cd3db9238?auto=format&fit=crop&w=800&q=80'
      )
    };

    const updated = [newCourier, ...couriers];
    setCouriers(updated);
    saveDeliveryPartners(updated);

    notify('Cadastro realizado com sucesso! O seu perfil de entregador já está ativo no portal.');
    setModalOpen(false);
    
    // Reset fields
    setName('');
    setPlateNumber('');
    setPhone('+258 84 ');
    setCourierLat(undefined);
    setCourierLng(undefined);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* 1. Grand NowBoarding Cinematic Header Banner */}
      <NowBoardingHeroBanner 
        category="entregadores"
        pageTitle="Logística & Entregadores Express"
        pageSubtitle="Moto-Táxi, Furgões & Fretes em Maputo e Matola"
        heightClass="min-h-[380px] sm:min-h-[440px]"
        onNavigate={onNavigate}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome || (() => setActivePage('home'))}
        onInquireClick={onInquireClick}
        isLandingPage={false}
        showPromoButton={false}
      />

      {/* Header Banner - Clean & Modern Info Section com Fundo Branco */}
      <section className="bg-white text-slate-900 py-8 sm:py-10 px-[6vw] relative overflow-hidden border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto w-full relative z-10 space-y-6">
          <div className="space-y-3.5 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <Truck className="w-3.5 h-3.5 text-[#0B254B]" />
              <span>Rede Integrada de Entregas & Fretes Moçambique</span>
            </div>
            
            <h1 className="font-serif font-bold text-2xl sm:text-4xl lg:text-5xl tracking-tight text-slate-900 leading-tight">
              Entregadores Parceiros <br />
              <span className="text-[#0B254B] font-medium">Moto-Táxi, Táxis & Fretes</span>
            </h1>

            {/* Texto reduzido com link clicável para detalhes completos */}
            <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-slate-600">
              <span>Logística rápida e estafetas locais para Maputo, Matola e províncias.</span>
              <button
                type="button"
                onClick={() => setShowDeliveryDetails(true)}
                className="text-[#0B254B] hover:text-[#061833] font-bold underline cursor-pointer inline-flex items-center gap-1"
              >
                <span>Ver detalhes, garantias e regulamento</span>
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3 Aspectos Chaves em Destaque com Tipografia Grande */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left">
                <span className="block text-2xl font-extrabold text-[#0B254B] tracking-tight">300 MT<span className="text-xs font-normal text-slate-500">/mês</span></span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">Subscrição de Estafeta</span>
                <span className="text-[11px] text-slate-500">Perfil activo para lojas e clientes</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left">
                <span className="block text-2xl font-extrabold text-[#0B254B] tracking-tight">100% Ganho</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">Sem Retenção de Tarifa</span>
                <span className="text-[11px] text-slate-500">O frete pago é todo seu</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-left">
                <span className="block text-2xl font-extrabold text-[#0B254B] tracking-tight">Directo</span>
                <span className="text-xs font-bold text-slate-900 block mt-0.5">Acordo por WhatsApp</span>
                <span className="text-[11px] text-slate-500">Sem burocracias nem atrasos</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => setModalOpen(true)}
                className="btn bg-[#0B254B] hover:bg-[#061833] text-white font-bold py-2.5 px-5 rounded-xl text-xs flex items-center gap-2 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar-me como Entregador (300 MT/mês)</span>
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('lista-entregadores');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold py-2.5 px-5 rounded-xl text-xs border border-slate-300 cursor-pointer transition-colors shadow-2xs"
              >
                <span>Ver Lista de Estafetas</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Synced Establishments Section (Integrated Delivery Subscription) - Fundo Branco */}
      {syncedEstablishments.length > 0 && (
        <section className="px-[6vw] max-w-7xl mx-auto w-full mt-10">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[10px] font-bold py-1 px-3 rounded-full mb-2 border border-slate-200">
                  <Truck className="w-3.5 h-3.5 text-[#0B254B]" />
                  <span>Sincronização & Merge com Menu de Entregas</span>
                </div>
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-slate-900">
                  Estabelecimentos com Serviço Personalizado de Entrega
                </h2>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Estes supermercados e lojas têm o módulo de entrega direta ativado (Plano VIP + Entrega). O cliente pode calcular o frete e encomendar directamente via WhatsApp.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-700 font-bold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                  {syncedEstablishments.length} Lojas Subscritas
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {syncedEstablishments.slice(0, 6).map((est, idx) => (
                <div 
                  key={`synced-est-${est.id}-${idx}`}
                  onClick={() => onSelectEstablishment && onSelectEstablishment(est)}
                  className="bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-[#0B254B] rounded-2xl p-4 transition-all cursor-pointer group flex flex-col justify-between shadow-2xs"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-slate-200/80 rounded-xl text-[#0B254B]">
                          <ShoppingBag className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 block">
                            {est.category === 'supermercado' ? 'Supermercado' : est.category === 'loja' ? 'Loja' : 'Estabelecimento'}
                          </span>
                          <h3 className="font-serif font-bold text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors line-clamp-1">
                            {est.name}
                          </h3>
                        </div>
                      </div>

                      <span className="bg-slate-200 text-slate-800 border border-slate-300 text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase flex-shrink-0">
                        Entrega Ativa
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 line-clamp-2">
                      {est.description}
                    </p>

                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                      <MapPin className="w-3 h-3 text-[#0B254B]" />
                      <span className="truncate">{est.address}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-bold group-hover:text-[#0B254B]">
                    <span>Calcular frete e comprar</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#0B254B] group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main List Section */}
      <section id="lista-entregadores" className="px-[6vw] max-w-7xl mx-auto w-full mt-10">
        
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-ink/12 p-4 rounded-2xl shadow-xs mb-8">
          
          {/* Vehicle Type Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-ink/50 mr-1 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" />
              <span>Veículo:</span>
            </span>

            <button
              onClick={() => setVehicleFilter('todos')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                vehicleFilter === 'todos' ? 'bg-emerald-900 text-white shadow-xs' : 'bg-sand-2/40 text-ink/70 hover:bg-sand-2'
              }`}
            >
              Todos os Veículos
            </button>

            <button
              onClick={() => setVehicleFilter('moto')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                vehicleFilter === 'moto' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-sand-2/40 text-ink/70 hover:bg-sand-2'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Moto-Táxi</span>
            </button>

            <button
              onClick={() => setVehicleFilter('carro')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                vehicleFilter === 'carro' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-sand-2/40 text-ink/70 hover:bg-sand-2'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>Táxi Móvel</span>
            </button>

            <button
              onClick={() => setVehicleFilter('furgão')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                vehicleFilter === 'furgão' ? 'bg-emerald-800 text-white shadow-xs' : 'bg-sand-2/40 text-ink/70 hover:bg-sand-2'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Furgão / Cargas</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex items-center gap-2 bg-paper border border-ink/15 rounded-xl py-2 px-3 text-xs w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-ink/40 flex-shrink-0" />
            <input 
              type="text" 
              placeholder="Pesquisar por nome, bairro, matrícula..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-ink w-full font-medium"
            />
          </div>

        </div>

        {/* Couriers Grid */}
        {filteredCouriers.length === 0 ? (
          <div className="bg-white border border-ink/12 rounded-2xl p-12 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-ink/30 mx-auto" />
            <p className="text-sm font-semibold text-ink/60">Nenhum entregador encontrado para estes critérios de pesquisa.</p>
            <button
              onClick={() => { setVehicleFilter('todos'); setSearchQuery(''); }}
              className="btn py-2 px-4 bg-emerald-800 text-white text-xs rounded-xl font-semibold cursor-pointer"
            >
              Resetar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCouriers.map((courier, idx) => (
              <div 
                key={`courier-card-${courier.id}-${idx}`} 
                className="bg-white border border-ink/12 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Photo Header */}
                  <div className="h-40 bg-emerald-950 relative overflow-hidden">
                    {courier.imageUrl ? (
                      <img src={courier.imageUrl} alt={courier.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-emerald-400 font-bold text-lg">
                        {courier.name}
                      </div>
                    )}

                    <div className="absolute top-3 left-3 bg-emerald-950/90 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg border border-emerald-500/30 flex items-center gap-1 backdrop-blur-xs">
                      {courier.vehicleType === 'moto' ? <Bike className="w-3.5 h-3.5 text-emerald-400" /> : courier.vehicleType === 'carro' ? <Car className="w-3.5 h-3.5 text-emerald-400" /> : <Truck className="w-3.5 h-3.5 text-emerald-400" />}
                      <span>{courier.vehicleType === 'moto' ? 'Moto-Táxi' : courier.vehicleType === 'carro' ? 'Táxi Móvel' : 'Furgão de Cargas'}</span>
                    </div>

                    <div className="absolute top-3 right-3 bg-[#0B254B] text-white text-[10px] font-bold py-1 px-2 rounded-lg backdrop-blur-xs shadow-xs">
                      ★ {courier.rating}
                    </div>

                    <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-xs text-white text-[10.5px] font-bold py-1 px-2.5 rounded-lg flex justify-between items-center">
                      <span>Matrícula: {courier.plateNumber}</span>
                      <span className="text-emerald-400 text-[9.5px]">🟢 Activo</span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-serif font-bold text-lg text-indigo-deep">{courier.name}</h3>
                      <p className="text-xs text-ink/65 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 flex-shrink-0" />
                        <span>Residência/Base: <strong>{courier.residenceZone}</strong></span>
                      </p>
                    </div>

                    {/* Customer navigation to the courier's base zone — same
                        Google Maps / Waze deep-link pattern used for stores */}
                    {typeof courier.latitude === 'number' && typeof courier.longitude === 'number' && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${courier.latitude},${courier.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-bold text-[10.5px] cursor-pointer transition-all flex items-center justify-center gap-1"
                          title="Navegar até esta zona no Google Maps"
                        >
                          <Navigation className="w-3 h-3 text-blue-600" />
                          <span>Google Maps</span>
                        </a>
                        <a
                          href={`https://waze.com/ul?ll=${courier.latitude},${courier.longitude}&navigate=yes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg font-bold text-[10.5px] cursor-pointer transition-all flex items-center justify-center gap-1"
                          title="Navegar até esta zona no Waze"
                        >
                          <Navigation className="w-3 h-3" />
                          <span>Waze</span>
                        </a>
                      </div>
                    )}

                    <div className="bg-sand-2/30 p-3 rounded-xl border border-ink/8 text-xs space-y-1">
                      <div className="text-ink/60 font-medium">Tarifa / Preço Estimado:</div>
                      <div className="font-serif font-bold text-indigo-deep text-sm">{courier.baseRate}</div>
                    </div>
                  </div>
                </div>

                {/* Footer Action - Gated for Subscribed Users */}
                <div className="p-4 bg-sand-2/20 border-t border-ink/8">
                  {isSubscriber ? (
                    <a 
                      href={courier.whatsappLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-200" />
                      <span>Contratar no WhatsApp ({courier.phone})</span>
                    </a>
                  ) : (
                    <button
                      onClick={() => setActivePage('auth')}
                      className="w-full btn bg-[#0B254B] hover:bg-[#0c2e5c] text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
                    >
                      <Lock className="w-4 h-4 text-blue-200" />
                      <span>🔒 Registar-se para Ver Contacto do Estafeta</span>
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </section>

      {/* Registration Modal for Couriers */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 bg-indigo-deep/50 backdrop-blur-sm z-60 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-paper border border-ink/15 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 p-6 sm:p-8 flex flex-col my-auto"
            >
              <div className="flex justify-between items-start border-b border-ink/10 pb-4 mb-4">
                <div>
                  <h2 className="font-serif font-bold text-xl text-indigo-deep flex items-center gap-2">
                    <Truck className="w-5 h-5 text-emerald-600" />
                    <span>Inscrição de Entregador / Estafeta</span>
                  </h2>
                  <p className="text-xs text-ink/60 mt-1">Sincronize o seu veículo com as lojas da Baixa de Maputo</p>
                </div>
                <button 
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-ink/40 hover:text-ink cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Nome Completo *</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ex: Salomão Sitoe"
                    required
                    className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-emerald-600 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Tipo de Veículo *</label>
                    <select 
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-emerald-600 outline-none"
                    >
                      <option value="moto">🏍️ Moto-Táxi</option>
                      <option value="carro">🚗 Táxi Móvel / Carro</option>
                      <option value="furgão">🚚 Furgão / Caixa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Matrícula do Veículo *</label>
                    <input 
                      type="text" 
                      value={plateNumber}
                      onChange={(e) => setPlateNumber(e.target.value)}
                      placeholder="ex: AAG 842 MP"
                      required
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold uppercase focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Bairro / Zona de Base *</label>
                    <input 
                      type="text" 
                      value={residenceZone}
                      onChange={(e) => setResidenceZone(e.target.value)}
                      placeholder="ex: Alto Maé, Matola, Baixa"
                      required
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-emerald-600 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-ink/70 mb-1">Contacto / WhatsApp *</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ex: +258 84 123 4567"
                      required
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-emerald-600 outline-none"
                    />
                  </div>
                </div>

                {/* Location picker: geocodes the zone above via Nominatim
                    (OpenStreetMap) and lets the courier fine-tune the pin —
                    same free, no-API-key model used for store locations. */}
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Confirmar Localização no Mapa</label>
                  <StoreLocationMap
                    mode="picker"
                    storeName={name.trim() || 'Estafeta'}
                    addressText={residenceZone}
                    latitude={courierLat}
                    longitude={courierLng}
                    onLocationChange={({ lat, lng }) => {
                      setCourierLat(lat);
                      setCourierLng(lng);
                    }}
                    height="220px"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Preço / Tarifa Estimada de Frete</label>
                  <input 
                    type="text" 
                    value={baseRate}
                    onChange={(e) => setBaseRate(e.target.value)}
                    placeholder="ex: 150 - 250 MT (Baixa -> Polana / Sommerschield)"
                    className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-semibold focus:border-emerald-600 outline-none"
                  />
                </div>

                {/* Subscription Fee Info Box */}
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-emerald-900 flex items-center justify-between">
                    <span>Taxa de Inscrição na Plataforma</span>
                    <span className="bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md">300 MT / mês</span>
                  </div>
                  <p className="text-emerald-800 text-[11px] leading-relaxed">
                    A subscrição dá visibilidade contínua ao seu contacto no directório oficial do Axofácil! para todas as lojas e clientes em Maputo.
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-ink/10">
                  <button 
                    type="button" 
                    onClick={() => setModalOpen(false)}
                    className="btn bg-paper border border-ink/15 py-2.5 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Ativar Cadastro & Pagar Subscrição
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Detalhes e Regulamento de Entregas */}
      <DeliveryDetailsModal 
        isOpen={showDeliveryDetails}
        onClose={() => setShowDeliveryDetails(false)}
        onOpenRegister={() => setModalOpen(true)}
      />

    </div>
  );
}
