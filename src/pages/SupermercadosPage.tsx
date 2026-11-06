import React, { useState } from 'react';
import { Establishment, PromoDeal, UserProfile } from "../types/types";
import { ShoppingBag, Truck, MapPin, Search, Filter, Plus, Star, Sparkles, Building2, ChevronRight, Apple, X } from 'lucide-react';
import { matchesEstablishment } from "../services/search";
import HeroCarousel, { CarouselSlide } from '../components/shared/HeroCarousel';
import SegmentPageHero from '../components/shared/SegmentPageHero';
import EstablishmentCard from '../components/shared/EstablishmentCard';

interface SupermercadosPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion: (cat: 'loja') => void;
  currentUser?: UserProfile | null;
  searchQuery?: string;
  onClearSearch?: () => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const supermarketCarouselSlides: CarouselSlide[] = [
  {
    id: 'sup1',
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=1000&q=80',
    title: 'Tomates, Cebolas & Legumes Frescos',
    subtitle: 'Abastecimento diário com tomate de alta qualidade, cebola, pimentos, batata e vegetais locais.',
    badge: 'Hortifrúti & Campo'
  },
  {
    id: 'sup2',
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=1000&q=80',
    title: 'Frutas Seleccionadas & Citrinos',
    subtitle: 'Laranjas sumo, bananas de Inhambane, maçãs e mangas da época a preços imbatíveis.',
    badge: 'Frutas da Época'
  },
  {
    id: 'sup3',
    image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1000&q=80',
    title: 'Cereais, Arroz & Óleo Alimentar em Grosso',
    subtitle: 'Sacos de arroz de 25kg, farinha de milho, feijão, açúcar e óleo para venda por grosso e retalho.',
    badge: 'Atacado Alimentar'
  },
  {
    id: 'sup4',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1000&q=80',
    title: 'Talho, Lacticínios & Congelados',
    subtitle: 'Carne bovina, frango nacional congelado, peixe fresco do mar e produtos lácteos.',
    badge: 'Frescos & Talho'
  }
];

export default function SupermercadosPage({ 
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
}: SupermercadosPageProps) {
  const [provinceFilter, setProvinceFilter] = useState<'todas' | 'cidade' | 'provincia' | 'nacional'>('todas');
  const [salesFilter, setSalesFilter] = useState<'todas' | 'grosso' | 'retalho'>('todas');
  const [deliveryOnlyFilter, setDeliveryOnlyFilter] = useState<boolean>(false);

  const supermercados = establishments.filter(e => e.category === 'supermercado');

  const filteredSupermercados = supermercados.filter(superm => {
    // Delivery Integration Filter
    if (deliveryOnlyFilter && !superm.hasIntegratedDelivery) return false;

    // Province filter
    if (provinceFilter === 'cidade' && superm.province && !superm.province.includes('Cidade')) return false;
    if (provinceFilter === 'provincia' && superm.province && !superm.province.includes('Província de Maputo')) return false;
    if (provinceFilter === 'nacional' && superm.province && (superm.province.includes('Cidade de Maputo') || superm.province.includes('Província de Maputo'))) return false;
    
    // Sales filter
    if (salesFilter === 'grosso' && superm.salesType !== 'grosso' && superm.salesType !== 'ambos') return false;
    if (salesFilter === 'retalho' && superm.salesType !== 'retalho' && superm.salesType !== 'ambos') return false;

    if (searchQuery && searchQuery.trim()) {
      return matchesEstablishment(superm, searchQuery);
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      
      <SegmentPageHero
        gradientClass="from-slate-950 via-[#0B254B] to-[#103B75]"
        badgeIcon={ShoppingBag}
        badgeLabel="Alimentação, Atacado & Venda em Grande Escala"
        badgeColorClass="bg-blue-500/20 text-blue-200 border-blue-400/30"
        title="Supermercados & Entrepostos Alimentares"
        subtitle="Consulte supermercados, hipermercados e atacadistas alimentares em todo o país (Cidade e Província de Maputo, Sofala, Nampula, Gaza e mais). Venda a grosso, retalho e entregas diretas."
        carouselSlides={supermarketCarouselSlides}
        carouselKey="supermercados"
        currentUser={currentUser}
        onNavigate={onNavigate}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        onInquireClick={onInquireClick}
      >
        {/* Quick Province Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-200">
          <span className="text-xs text-slate-500 font-semibold mr-1">Filtrar por Região:</span>
          <button
            onClick={() => setProvinceFilter('todas')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              provinceFilter === 'todas' ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            📍 Todas as Regiões ({supermercados.length})
          </button>
          <button
            onClick={() => setProvinceFilter('cidade')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              provinceFilter === 'cidade' ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            🏙️ Cidade de Maputo
          </button>
          <button
            onClick={() => setProvinceFilter('provincia')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              provinceFilter === 'provincia' ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            🏘️ Província de Maputo (Matola, Boane, Zimpeto)
          </button>
          <button
            onClick={() => setProvinceFilter('nacional')}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              provinceFilter === 'nacional' ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-xs' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
          >
            🇲🇿 Outras Províncias (Sofala, Nampula, Gaza...)
          </button>

          <button
            onClick={() => setDeliveryOnlyFilter(!deliveryOnlyFilter)}
            className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
              deliveryOnlyFilter 
                ? 'bg-slate-800 text-white border-slate-800 font-extrabold shadow-sm' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Entregas Directas Sincronizadas</span>
          </button>
        </div>
      </SegmentPageHero>

      {/* Active Search Filter Banner (Synchronized from Landing Page) */}
      {searchQuery && searchQuery.trim() && (
        <div className="px-[6vw] mt-6 mb-4 max-w-7xl mx-auto w-full">
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
                  Resultados para <span className="bg-slate-200 px-2 py-0.5 rounded-md text-[#0B254B]">"{searchQuery}"</span> ({filteredSupermercados.length} encontrados)
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

      {/* Sales Mode Filter Bar */}
      <div className="px-[6vw] mb-8 max-w-7xl mx-auto w-full">
        <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <span className="font-bold text-slate-900">Modalidade de Venda:</span>
            <button
              onClick={() => setSalesFilter('todas')}
              className={`py-1 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                salesFilter === 'todas' ? 'bg-[#0B254B] text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setSalesFilter('grosso')}
              className={`py-1 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                salesFilter === 'grosso' ? 'bg-[#103B75] text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              🏬 Venda a Grosso (Fardo / Caixas)
            </button>
            <button
              onClick={() => setSalesFilter('retalho')}
              className={`py-1 px-3 rounded-lg font-semibold transition-all cursor-pointer ${
                salesFilter === 'retalho' ? 'bg-[#103B75] text-white' : 'bg-white text-slate-700 hover:text-slate-900 border border-slate-200'
              }`}
            >
              🛒 Compra a Retalho
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-slate-500" />
            <span>Possibilidade de transporte / frete direto na compra</span>
          </div>
        </div>
      </div>

      {/* Supermarkets Grid */}
      <div className="px-[6vw] max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif font-bold text-2xl text-indigo-deep">
            Supermercados Cadastrados ({filteredSupermercados.length})
          </h2>
        </div>

        {filteredSupermercados.length === 0 ? (
          <div className="bg-sand-2/30 border border-dashed border-ink/20 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
            <ShoppingBag className="w-12 h-12 text-ink/30 mx-auto mb-3" />
            <h3 className="font-serif font-bold text-lg text-indigo-deep mb-1">Nenhum supermercado encontrado</h3>
            <p className="text-xs text-ink/65 mb-4">
              Tente alterar os filtros de cidade/província ou pesquise outro termo na barra de busca.
            </p>
            <button
              onClick={() => {
                setProvinceFilter('todas');
                setSalesFilter('todas');
              }}
              className="btn bg-indigo-deep text-paper text-xs font-bold py-2 px-4 rounded-xl cursor-pointer"
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSupermercados.map((superm, idx) => (
              <EstablishmentCard
                key={`superm-card-${superm.id}-${idx}`}
                est={superm}
                theme="emerald"
                badges={[
                  { label: 'Supermercado' },
                  ...(superm.hasIntegratedDelivery ? [{ label: 'Entrega Sincronizada', icon: Truck }] : []),
                  ...(superm.salesType ? [{ label: superm.salesType === 'grosso' ? 'A Grosso' : superm.salesType === 'retalho' ? 'Retalho' : 'Grosso & Retalho' }] : [])
                ]}
                detailSlot={
                  <div className="bg-sand-2/40 p-2.5 rounded-xl border border-ink/8 text-[11px] space-y-1.5">
                    <div className="font-semibold text-indigo-deep flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-emerald-700 shrink-0" />
                      <span className="truncate">Localização: {superm.address}</span>
                    </div>
                    {superm.locationLandmarks && (
                      <div className="text-ink/65 italic line-clamp-1">
                        Ponto de referência: {superm.locationLandmarks}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectEstablishment(superm);
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
                      <span>Frete & Stock</span>
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
                onClick={() => onSelectEstablishment(superm)}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
