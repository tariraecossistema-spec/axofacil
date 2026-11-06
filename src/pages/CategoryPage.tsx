import React, { useState, useMemo } from 'react';
import { Establishment, PromoDeal, UserProfile } from '../types/types';
import { 
  getCategoryById, 
  findCategoryBySlugOrAlias, 
  CategoryDefinition, 
  SubcategoryDefinition,
  matchesSubcategory 
} from '../data/categories';
import { MOZAMBIQUE_PROVINCES } from '../data/mozambiqueZones';
import EstablishmentCard, { CardBadge, CardTheme } from '../components/shared/EstablishmentCard';
import { 
  Home, 
  ChevronRight, 
  Search, 
  Filter, 
  MapPin, 
  ArrowLeft, 
  Store, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  X, 
  Layers,
  PhoneCall,
  SlidersHorizontal
} from 'lucide-react';
import { matchesEstablishment } from '../services/search';

interface CategoryPageProps {
  categorySlug: string;
  subcategorySlug?: string | null;
  establishments: Establishment[];
  deals?: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion?: (cat: any) => void;
  currentUser?: UserProfile | null;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

export default function CategoryPage({
  categorySlug,
  subcategorySlug,
  establishments,
  deals = [],
  onSelectEstablishment,
  onAddPromotion,
  currentUser,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: CategoryPageProps) {
  // Find category definition from slug or alias
  const categoryDef: CategoryDefinition | undefined = useMemo(() => {
    return findCategoryBySlugOrAlias(categorySlug) || getCategoryById('lojas');
  }, [categorySlug]);

  const category = categoryDef!;

  // Internal state for selected subcategory and filters
  const [activeSubcategorySlug, setActiveSubcategorySlug] = useState<string | null>(subcategorySlug || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('todas');
  const [selectedZone, setSelectedZone] = useState<string>('todas');
  const [filterOnlyOpen, setFilterOnlyOpen] = useState(false);
  const [filterWithDelivery, setFilterWithDelivery] = useState(false);
  const [sortBy, setSortBy] = useState<'destaque' | 'avaliacao' | 'nome'>('destaque');

  // Sync if prop changes
  React.useEffect(() => {
    if (subcategorySlug !== undefined) {
      setActiveSubcategorySlug(subcategorySlug);
    }
  }, [subcategorySlug]);

  const activeSubcategory = useMemo(() => {
    if (!activeSubcategorySlug) return null;
    return category.subcategories.find(s => s.slug === activeSubcategorySlug || s.id === activeSubcategorySlug) || null;
  }, [category, activeSubcategorySlug]);

  // Base list of establishments matching this category
  const baseCategoryEstablishments = useMemo(() => {
    return establishments.filter(est => {
      // Must be active if boolean present
      if (est.isActive === false) return false;
      
      // Match by categoryType or by slug
      if (est.category === category.categoryType) return true;
      if (category.id === 'lojas' && (est.category === 'loja' || est.category === 'pecas_auto' || est.category === 'ferragens')) {
        return true;
      }
      return false;
    });
  }, [establishments, category]);

  // Filter by subcategory, province, zone, search query and toggles
  const filteredEstablishments = useMemo(() => {
    return baseCategoryEstablishments.filter(est => {
      // 1. Subcategory filter
      if (activeSubcategory) {
        const matches = matchesSubcategory(est, activeSubcategory);
        if (!matches) {
          // Fallback check on segment
          const segLower = (est.segment || '').toLowerCase();
          const subLower = activeSubcategory.name.toLowerCase();
          if (!segLower.includes(activeSubcategory.slug) && !subLower.includes(segLower)) {
            return false;
          }
        }
      }

      // 2. Province filter (11 Províncias de Moçambique)
      if (selectedProvince !== 'todas') {
        const provLower = selectedProvince.toLowerCase();
        const estProv = (est.province || '').toLowerCase();
        const estFull = `${est.province || ''} ${est.city || ''} ${est.zone || ''} ${est.address || ''}`.toLowerCase();
        if (!estProv.includes(provLower) && !estFull.includes(provLower)) {
          return false;
        }
      }

      // 3. Zone / District / City filter
      if (selectedZone !== 'todas') {
        const estZone = `${est.zone || ''} ${est.city || ''} ${est.district || ''}`.toLowerCase();
        if (!estZone.includes(selectedZone.toLowerCase())) {
          return false;
        }
      }

      // 4. Status toggles
      if (filterOnlyOpen && est.isOpen === false) {
        return false;
      }
      if (filterWithDelivery && !est.hasIntegratedDelivery) {
        return false;
      }

      // 5. Text search
      if (searchQuery.trim()) {
        const matchesText = matchesEstablishment(est, searchQuery.trim());
        if (!matchesText) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'avaliacao') {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === 'nome') {
        return a.name.localeCompare(b.name);
      }
      // Destaque: Verified first, then high rating
      const aScore = (a.isVerified ? 10 : 0) + (a.rating || 0);
      const bScore = (b.isVerified ? 10 : 0) + (b.rating || 0);
      return bScore - aScore;
    });
  }, [baseCategoryEstablishments, activeSubcategory, selectedZone, filterOnlyOpen, filterWithDelivery, searchQuery, sortBy]);

  // Extract unique zones from establishments in this category
  const availableZones = useMemo(() => {
    const zones = new Set<string>();
    baseCategoryEstablishments.forEach(e => {
      if (e.zone && e.zone.trim()) zones.add(e.zone.trim());
      if (e.city && e.city.trim()) zones.add(e.city.trim());
    });
    return Array.from(zones);
  }, [baseCategoryEstablishments]);

  // Distritos da província seleccionada
  const districtsForSelectedProvince = useMemo(() => {
    if (selectedProvince === 'todas') return [];
    const prov = MOZAMBIQUE_PROVINCES.find(p => p.name === selectedProvince || p.shortName === selectedProvince);
    return prov ? prov.districts : [];
  }, [selectedProvince]);

  // Count establishments per subcategory
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    category.subcategories.forEach(sub => {
      counts[sub.slug] = baseCategoryEstablishments.filter(e => matchesSubcategory(e, sub)).length;
    });
    return counts;
  }, [category, baseCategoryEstablishments]);

  // Card theme selection based on category
  const getCardTheme = (): CardTheme => {
    switch (category.id) {
      case 'supermercados': return 'emerald';
      case 'bares': return 'amber';
      case 'hospedagens': return 'sky';
      case 'construcao': return 'slate';
      case 'turismo': return 'sky';
      case 'entregadores': return 'indigo';
      case 'lojas':
      default:
        return 'indigo';
    }
  };

  const CategoryIcon = category.icon;

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      
      {/* 1. Breadcrumbs Bar */}
      <nav aria-label="Navegação estruturada" className="bg-white border-b border-slate-200 py-2.5 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button 
              onClick={onGoHome}
              className="flex items-center gap-1 font-medium text-slate-600 hover:text-[#0B254B] transition-colors cursor-pointer"
            >
              <Home className="w-3.5 h-3.5 text-slate-500" />
              <span>Início</span>
            </button>

            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />

            <button 
              onClick={() => setActiveSubcategorySlug(null)}
              className={`font-semibold cursor-pointer transition-colors ${
                !activeSubcategory ? 'text-[#0B254B] underline' : 'text-slate-600 hover:text-[#0B254B]'
              }`}
            >
              {category.name}
            </button>

            {activeSubcategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-[#0B254B] bg-slate-100 px-2 py-0.5 rounded-md">
                  {activeSubcategory.name}
                </span>
              </>
            )}
          </div>

          {canGoBack && onGoBack && (
            <button 
              onClick={onGoBack} 
              className="text-slate-600 hover:text-[#0B254B] font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Voltar atrás</span>
            </button>
          )}
        </div>
      </nav>

      {/* 2. Hero & Context Banner */}
      <section className="relative bg-gradient-to-br from-[#0B254B] via-[#0F2E5C] to-[#0A192F] text-white py-10 px-4 sm:px-6 lg:px-8 overflow-hidden shadow-sm">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-xs mb-3 border border-white/15">
                <CategoryIcon className="w-3.5 h-3.5 text-blue-300" />
                <span>{category.badge}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white mb-2">
                {activeSubcategory ? activeSubcategory.name : category.name}
              </h1>
              <p className="text-slate-200 text-sm sm:text-base leading-relaxed">
                {activeSubcategory ? activeSubcategory.description : category.description}
              </p>
            </div>

            {/* Quick Actions / Consultation */}
            <div className="shrink-0 flex items-center gap-3">
              {onInquireClick && (
                <button
                  onClick={onInquireClick}
                  className="px-4 py-2.5 rounded-xl bg-white text-[#0B254B] font-bold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4 text-[#0B254B]" />
                  <span>Pedir Informações</span>
                </button>
              )}
              {onAddPromotion && (
                <button
                  onClick={() => onAddPromotion(category.categoryType)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Negócio</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Search inside this Category */}
          <div className="mt-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Pesquisar lojas, produtos ou marcas em ${category.shortName}...`}
                className="w-full pl-10 pr-10 py-2.5 bg-white/95 text-slate-900 placeholder:text-slate-500 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 border border-white/20 shadow-xs"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Subcategories Pills Bar */}
      <section className="bg-white border-b border-slate-200 sticky top-14 z-20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-300">
            <button
              onClick={() => setActiveSubcategorySlug(null)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubcategorySlug === null
                  ? 'bg-[#0B254B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>Todos os Negócios</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeSubcategorySlug === null ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {baseCategoryEstablishments.length}
              </span>
            </button>

            {category.subcategories.map(sub => {
              const isSelected = activeSubcategorySlug === sub.slug || activeSubcategorySlug === sub.id;
              const count = subcategoryCounts[sub.slug] || 0;

              return (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubcategorySlug(isSelected ? null : sub.slug)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#0B254B] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{sub.name}</span>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Controls & Filters Bar (11 Províncias e Distritos de Moçambique) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
        <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 shadow-xs">
          
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* 1. Selector de Província (11 Províncias) */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700">
              <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="font-semibold">Província:</span>
              <select
                value={selectedProvince}
                onChange={(e) => {
                  setSelectedProvince(e.target.value);
                  setSelectedZone('todas');
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0B254B] cursor-pointer"
              >
                <option value="todas">Todo Moçambique (11 Províncias)</option>
                {MOZAMBIQUE_PROVINCES.map(prov => (
                  <option key={prov.id} value={prov.name}>{prov.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Selector de Distrito / Cidade */}
            {districtsForSelectedProvince.length > 0 ? (
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="font-semibold">Distrito/Cidade:</span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0B254B] cursor-pointer max-w-[200px] truncate"
                >
                  <option value="todas">Todos os Distritos</option>
                  {districtsForSelectedProvince.map(dist => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>
            ) : availableZones.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs text-slate-700">
                <span className="font-semibold">Zona:</span>
                <select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0B254B] cursor-pointer max-w-[180px] truncate"
                >
                  <option value="todas">Todas as Zonas</option>
                  {availableZones.map(zone => (
                    <option key={zone} value={zone}>{zone}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quick Toggles */}
            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterOnlyOpen}
                onChange={(e) => setFilterOnlyOpen(e.target.checked)}
                className="rounded text-[#0B254B] focus:ring-[#0B254B] border-slate-300"
              />
              <span>Aberto agora</span>
            </label>

            <label className="flex items-center gap-1.5 text-xs text-slate-700 font-medium cursor-pointer select-none">
              <input
                type="checkbox"
                checked={filterWithDelivery}
                onChange={(e) => setFilterWithDelivery(e.target.checked)}
                className="rounded text-[#0B254B] focus:ring-[#0B254B] border-slate-300"
              />
              <span>Com entrega</span>
            </label>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 text-xs text-slate-700 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span className="font-medium">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0B254B] cursor-pointer"
            >
              <option value="destaque">Destaques & Verificados</option>
              <option value="avaliacao">Melhor Classificação</option>
              <option value="nome">Nome (A a Z)</option>
            </select>
          </div>

        </div>
      </section>

      {/* 5. Main Establishments Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Results Count Header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs sm:text-sm text-slate-600">
            Mostrando <strong className="text-slate-900">{filteredEstablishments.length}</strong>{' '}
            {filteredEstablishments.length === 1 ? 'estabelecimento' : 'estabelecimentos'} em{' '}
            <span className="text-[#0B254B] font-semibold">{activeSubcategory ? activeSubcategory.name : category.name}</span>
            {selectedProvince !== 'todas' && (
              <span className="text-slate-500 font-medium"> ({selectedProvince})</span>
            )}
          </p>

          {(searchQuery || selectedProvince !== 'todas' || selectedZone !== 'todas' || filterOnlyOpen || filterWithDelivery || activeSubcategorySlug) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedProvince('todas');
                setSelectedZone('todas');
                setFilterOnlyOpen(false);
                setFilterWithDelivery(false);
                setActiveSubcategorySlug(null);
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
            >
              Limpar filtros
            </button>
          )}
        </div>

        {filteredEstablishments.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredEstablishments.map(est => {
              const badges: CardBadge[] = [
                { label: est.segment || category.shortName },
                ...(est.hasIntegratedDelivery ? [{ label: 'Entrega Própria' }] : [])
              ];

              return (
                <EstablishmentCard
                  key={est.id}
                  est={est}
                  theme={getCardTheme()}
                  badges={badges}
                  onClick={() => onSelectEstablishment(est)}
                />
              );
            })}
          </div>
        ) : (
          /* Empty State in Mozambican Portuguese */
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Store className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1">
              Nenhum negócio encontrado nesta selecção
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
              {searchQuery
                ? `Não encontramos resultados para "${searchQuery}" em ${category.name}. Tente outros termos de pesquisa ou remova os filtros.`
                : `Ainda não existem negócios activos cadastrados nesta subcategoria em ${selectedZone !== 'todas' ? selectedZone : 'Moçambique'}.`}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {(searchQuery || selectedZone !== 'todas' || activeSubcategorySlug) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedZone('todas');
                    setActiveSubcategorySlug(null);
                  }}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Ver todos os negócios
                </button>
              )}

              {onAddPromotion && (
                <button
                  onClick={() => onAddPromotion(category.categoryType)}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-[#0B254B] hover:bg-[#103B75] text-white text-xs font-bold transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Registar o meu negócio aqui</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* 6. Merchant Call To Action Banner */}
        <div className="mt-12 bg-gradient-to-r from-slate-900 to-[#0B254B] text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/10 text-white text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              <span>Oportunidade para comerciantes</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white mb-1">
              Tem um negócio em {category.name}?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Registe o seu estabelecimento no Axofácil!, coloque o seu catálogo e receba pedidos de clientes de todo Moçambique directamente no seu telemóvel e WhatsApp.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-3">
            {onAddPromotion ? (
              <button
                onClick={() => onAddPromotion(category.categoryType)}
                className="px-5 py-2.5 rounded-xl bg-white text-[#0B254B] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              >
                Criar Perfil Comercial
              </button>
            ) : onInquireClick ? (
              <button
                onClick={onInquireClick}
                className="px-5 py-2.5 rounded-xl bg-white text-[#0B254B] hover:bg-slate-100 font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer"
              >
                Falar com a Equipa
              </button>
            ) : null}
          </div>
        </div>

      </main>
    </div>
  );
}
