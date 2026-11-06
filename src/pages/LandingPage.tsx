import React, { useState, useRef, useEffect } from 'react';
import { Establishment, PromoDeal, UserProfile } from "../types/types";
import { uploadFileToStorage as uploadToImgBB } from "../services/supabase";
import { canManageEstablishment } from "../services/ownership";
import DrawnHighlight from "../components/shared/DrawnHighlight";
import { matchesEstablishment, cleanAccents } from "../services/search";
import { 
  Search, ArrowRight, Camera, MapPin, 
  Sparkles, ShieldCheck, Plane, 
  Truck, ShoppingBag, ShoppingCart, Beer, Building2, 
  Hammer, Wrench, CheckCircle2, Award, Compass, GlassWater, BedDouble,
  MessageCircle, Navigation, Zap, Phone, Star, Tag, X, Image as ImageIcon,
  Loader2, Eye, Store, ArrowUpRight, Check, Briefcase, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import NowBoardingHeroBanner from '../components/shared/NowBoardingHeroBanner';
import PartnerInterestModal from '../components/modals/PartnerInterestModal';
import CommercialDetailsModal from '../components/modals/CommercialDetailsModal';

interface LandingPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  setActivePage: (page: any) => void;
  setSearchQuery: (query: string) => void;
  onSelectEstablishment: (est: Establishment) => void;
  onUpdateEstablishmentImage?: (id: string, newUrl: string) => void;
  onAddPromotion?: (category: 'loja' | 'bar' | 'hospedagem') => void;
  currentUser?: UserProfile | null;
  onSelectSegment?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

const POPULAR_ZONES = [
  'Baixa de Maputo',
  'Polana Cimento',
  'Sommerschield',
  'Costa do Sol',
  'Matola',
  'Zimpeto',
  'Ponta do Ouro',
  'Bilene'
];

const QUICK_SEARCH_CHIPS = [
  { label: '🌾 Arroz & Óleo Fardo', query: 'arroz', target: 'supermercados' },
  { label: '🔋 Baterias 12V & Peças', query: 'baterias', target: 'pecas_auto' },
  { label: '🏨 Hotéis & Suítes', query: 'quarto', target: 'hospedagens' },
  { label: '✈️ Voos & Turismo', query: 'turismo', target: 'turismo' },
  { label: '🍺 Cerveja 2M Gelada', query: '2M', target: 'bares' },
  { label: '🏗️ Cimento 42.5N & Chapas', query: 'cimento', target: 'construcao' },
  { label: '👗 Capulanas & Fardos', query: 'capulana', target: 'lojas' },
  { label: '🌹 Buquês & Flores', query: 'flores', target: 'lojas' }
];

export default function LandingPage({ 
  establishments, 
  deals,
  setActivePage, 
  setSearchQuery, 
  onSelectEstablishment,
  onUpdateEstablishmentImage,
  onAddPromotion,
  currentUser,
  onSelectSegment,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: LandingPageProps) {
  const [localSearch, setLocalSearch] = useState('');
  const [targetCategory, setTargetCategory] = useState<'todos' | 'lojas' | 'pecas_auto' | 'supermercados' | 'bares' | 'hospedagens' | 'turismo' | 'construcao' | 'entregadores'>('todos');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showCommercialDetails, setShowCommercialDetails] = useState(false);

  // Helper to open a specific establishment directly
  const openStoreDirectly = (est: Establishment) => {
    setIsSearchFocused(false);
    
    // Determine category page
    if (est.category === 'loja' && (
      est.name.toLowerCase().includes('auto') || 
      est.name.toLowerCase().includes('peças') || 
      est.name.toLowerCase().includes('pecas') ||
      est.description?.toLowerCase().includes('peças') ||
      est.features.some(f => f.toLowerCase().includes('peças') || f.toLowerCase().includes('auto'))
    )) {
      if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
      else setActivePage('lojas');
    } else if (est.category === 'loja') {
      setActivePage('lojas');
    } else if (est.category === 'supermercado') {
      setActivePage('supermercados');
    } else if (est.category === 'bar') {
      setActivePage('bares');
    } else if (est.category === 'hospedagem') {
      setActivePage('hospedagens');
    } else if (est.category === 'construcao' || est.category === 'ferragens') {
      setActivePage('construcao');
    } else if (est.category === 'turismo') {
      setActivePage('turismo');
    } else if (est.category === 'pecas_auto') {
      if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
      else setActivePage('lojas');
    } else {
      setActivePage('lojas');
    }

    setSearchQuery('');
    onSelectEstablishment(est);
  };

  // Helper to route product search to the stores that have that product
  const routeSearch = (queryText: string, targetMenuOverride?: string) => {
    setIsSearchFocused(false);
    const rawQ = queryText.trim();
    if (!rawQ) {
      const selected = targetMenuOverride || targetCategory;
      setActivePage(selected !== 'todos' ? selected : 'lojas');
      return;
    }

    const q = rawQ.toLowerCase().trim();
    const cleanQ = cleanAccents(rawQ);

    // 1. Check if user typed a specific store name (with and without accents)
    const exactStore = establishments.find(e => 
      e.name.toLowerCase() === q || cleanAccents(e.name) === cleanQ
    );
    if (exactStore) {
      openStoreDirectly(exactStore);
      return;
    }

    // Check partial store name match (e.g. "Doce Amor", "Hotel Polana", "Supermercado X", "Bar Y", "Matola Construções")
    const storeMatches = establishments.filter(e => {
      const eNameClean = cleanAccents(e.name);
      return eNameClean.includes(cleanQ) || cleanQ.includes(eNameClean);
    });

    // Common generic product/category words that should NOT trigger single store redirect if ambiguous
    const genericProductTerms = [
      'cimento', 'arroz', 'oleo', 'óleo', 'bateria', 'baterias', 'pneu', 'pneus',
      'cerveja', 'quarto', 'hotel', 'flores', 'rosa', 'rosas', 'sapato', 'sapatos',
      'capulana', 'capulanas', 'chapa', 'chapas', 'farinha', 'acucar', 'açúcar',
      'voo', 'voos', 'passagem', 'passagens', 'frete', 'fretes', 'tijolo', 'tijolos',
      'massa', 'leite', 'carne', 'peixe', 'vinho', 'whisky', 'gin', 'areia', 'brita'
    ];
    const isGeneric = genericProductTerms.some(term => q === term || q.startsWith(term + ' ') || q.endsWith(' ' + term));

    if (storeMatches.length === 1 && !isGeneric) {
      openStoreDirectly(storeMatches[0]);
      return;
    }

    // 2. Product Name / Multi-store Search:
    // Apply the search query filter to show only stores carrying this product
    setSearchQuery(rawQ);

    const selected = targetMenuOverride || targetCategory;
    if (selected && selected !== 'todos') {
      if (selected === 'pecas_auto') {
        if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
        else setActivePage('lojas');
      } else {
        setActivePage(selected as any);
      }
      return;
    }

    // Find all establishments that have this product or match search
    const storesWithProduct = establishments.filter(est => matchesEstablishment(est, rawQ));

    // Determine dominant category among stores that match
    const categoryCounts: Record<string, number> = {};
    storesWithProduct.forEach(est => {
      const cat = (est.category === 'ferragens' || est.category === 'construcao') ? 'construcao' : est.category;
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    let bestCategory: string | null = null;
    let maxCount = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxCount) {
        maxCount = count;
        bestCategory = cat;
      }
    });

    if (bestCategory) {
      if (bestCategory === 'pecas_auto') {
        if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
        else setActivePage('lojas');
      } else {
        setActivePage(bestCategory as any);
      }
      return;
    }

    // Keyword heuristics if no stores explicitly matched
    if (cleanQ.includes('peca') || cleanQ.includes('peça') || cleanQ.includes('bateria') || cleanQ.includes('pneu') || cleanQ.includes('oleo') || cleanQ.includes('óleo') || cleanQ.includes('travao') || cleanQ.includes('travão') || cleanQ.includes('amortecedor') || cleanQ.includes('filtro') || cleanQ.includes('motor')) {
      if (onSelectSegment) onSelectSegment('lojas', 'pecas_auto');
      else setActivePage('lojas');
    } else if (cleanQ.includes('bar') || cleanQ.includes('cerveja') || cleanQ.includes('2m') || cleanQ.includes('laurentina') || cleanQ.includes('lounge') || cleanQ.includes('bebida') || cleanQ.includes('petiscos')) {
      setActivePage('bares');
    } else if (cleanQ.includes('hospedagem') || cleanQ.includes('hotel') || cleanQ.includes('pensao') || cleanQ.includes('quarto') || cleanQ.includes('suite') || cleanQ.includes('dormir')) {
      setActivePage('hospedagens');
    } else if (cleanQ.includes('cimento') || cleanQ.includes('chapa') || cleanQ.includes('varao') || cleanQ.includes('areia') || cleanQ.includes('brita') || cleanQ.includes('bloco') || cleanQ.includes('estaleiro') || cleanQ.includes('constru')) {
      setActivePage('construcao');
    } else if (cleanQ.includes('mercado') || cleanQ.includes('supermercado') || cleanQ.includes('arroz') || cleanQ.includes('oleo') || cleanQ.includes('acucar') || cleanQ.includes('fardo') || cleanQ.includes('frescos')) {
      setActivePage('supermercados');
    } else if (cleanQ.includes('frete') || cleanQ.includes('entreg') || cleanQ.includes('estafeta') || cleanQ.includes('carga')) {
      setActivePage('entregadores');
    } else {
      setActivePage('lojas');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!localSearch.trim()) {
      routeSearch('');
      return;
    }
    routeSearch(localSearch);
  };

  const handleZoneClick = (zone: string) => {
    setLocalSearch(zone);
    routeSearch(zone);
  };

  const handleQuickChipClick = (chip: typeof QUICK_SEARCH_CHIPS[0]) => {
    setLocalSearch(chip.query);
    routeSearch(chip.query, chip.target);
  };

  // Live matching computations for store name and product name
  const qClean = localSearch.trim().toLowerCase();

  const matchingStores = React.useMemo(() => {
    if (qClean.length < 1) return [];
    return establishments.filter(est => 
      est.name.toLowerCase().includes(qClean) ||
      est.zone.toLowerCase().includes(qClean) ||
      est.features.some(f => f.toLowerCase().includes(qClean)) ||
      est.description?.toLowerCase().includes(qClean)
    ).slice(0, 4);
  }, [establishments, qClean]);

  const matchingProducts = React.useMemo(() => {
    if (qClean.length < 1) return [];
    const results: Array<{
      id: string;
      name: string;
      priceMT?: number;
      promoPriceMT?: number;
      imageUrl?: string;
      category?: string;
      unitLabel?: string;
      establishment: Establishment;
    }> = [];

    const seen = new Set<string>();

    for (const est of establishments) {
      if (est.productsCatalog) {
        for (const p of est.productsCatalog) {
          const pName = p.name.toLowerCase();
          const pCat = (p.category || '').toLowerCase();
          const pDesc = (p.description || '').toLowerCase();
          if (pName.includes(qClean) || pCat.includes(qClean) || pDesc.includes(qClean)) {
            const key = `${p.name.toLowerCase()}-${est.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                id: p.id || `prod-${results.length}`,
                name: p.name,
                priceMT: p.priceMT,
                promoPriceMT: p.promoPriceMT,
                imageUrl: p.imageUrl,
                category: p.category,
                unitLabel: p.unitLabel,
                establishment: est
              });
            }
          }
          if (results.length >= 6) break;
        }
      }
      if (results.length >= 6) break;

      // Also search plain productsList array
      if (est.productsList && est.productsList.length > 0) {
        for (let i = 0; i < est.productsList.length; i++) {
          const pItem = est.productsList[i];
          if (pItem.toLowerCase().includes(qClean)) {
            const key = `${pItem.toLowerCase()}-${est.id}`;
            if (!seen.has(key)) {
              seen.add(key);
              results.push({
                id: `item-${i}-${est.id}`,
                name: pItem,
                category: est.category,
                establishment: est
              });
            }
          }
          if (results.length >= 6) break;
        }
      }
      if (results.length >= 6) break;
    }

    return results;
  }, [establishments, qClean]);



  // Image Upload handler for cards using ImgBB API
  const handleCardImageUpload = async (estId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(estId);
    try {
      const imageUrl = await uploadToImgBB(file);
      if (onUpdateEstablishmentImage) {
        onUpdateEstablishmentImage(estId, imageUrl);
      }
    } catch (err) {
      console.error('Failed to upload card image:', err);
    } finally {
      setUploadingId(null);
    }
  };

  // Estabelecimentos em destaque activos na plataforma
  const featuredEstablishments = establishments.filter(e => e.isActive !== false).slice(0, 6);

  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900 pb-16">
      
      {/* 1. Grand NowBoarding.travel Cinematic Banner */}
      <NowBoardingHeroBanner 
        pageTitle="Guia Oficial de Maputo & Moçambique"
        pageSubtitle="Turismo, Lojas, Hotéis & Serviços"
        heightClass="min-h-[460px] sm:min-h-[520px]"
        onInquireClick={onInquireClick ? onInquireClick : () => {
          const el = document.getElementById('search-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onPromoClick={() => {
          if (onSelectSegment) {
            onSelectSegment('promocoes', undefined);
          } else {
            setActivePage('promocoes');
          }
        }}
        onNavigate={(page, filter) => {
          if (onSelectSegment && filter) {
            onSelectSegment(page, filter);
          } else {
            setActivePage(page);
          }
        }}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        isLandingPage={true}
        showPromoButton={true}
      />

      {/* ========================================================================= */}
      {/* 2. UNIFIED GLOBAL SEARCH — Fundo 100% Branco com elementos elegantes     */}
      {/* ========================================================================= */}
      <section id="search-section" className="relative w-full bg-white text-slate-900 py-8 sm:py-10 px-[5vw] lg:px-[7vw] border-b border-slate-200">
        {/* Content Container - Centered, Balanced & Elegant */}
        <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col items-center text-center space-y-5">

          <p className="font-serif text-lg sm:text-2xl text-slate-900 font-bold max-w-2xl">
            O que precisa hoje, e onde vai buscar?
          </p>

          {/* Interactive Search Console Bar with Category Selector & Visual Image Search */}
          <div ref={searchContainerRef} className="relative w-full max-w-3xl space-y-3 z-30">
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white text-slate-900 rounded-2xl p-2 sm:p-2.5 shadow-lg border-2 border-slate-200 focus-within:border-[#103B75] transition-all relative">
              
              {/* Category Selector Dropdown */}
              <div className="relative border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-2 shrink-0">
                <select
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value as any)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs sm:text-sm font-bold py-2 px-3 rounded-xl border border-slate-200 outline-none cursor-pointer w-full sm:w-auto transition-colors"
                  title="Selecione o menu específico ou deixe em Todos os Serviços"
                >
                  <option value="todos">🌐 Todos os Menus</option>
                  <option value="lojas">🛍️ Lojas & Boutiques</option>
                  <option value="pecas_auto">🚗 Peças Auto & Oficinas</option>
                  <option value="supermercados">🛒 Supermercados</option>
                  <option value="hospedagens">🏨 Hospedagens & Hotéis</option>
                  <option value="turismo">✈️ Turismo & Voos</option>
                  <option value="bares">🍻 Bares & Lounges</option>
                  <option value="construcao">🏗️ Construção & Estaleiros</option>
                  <option value="entregadores">🚚 Estafetas & Fretes</option>
                </select>
              </div>

              {/* Text Input */}
              <div className="flex items-center gap-2 flex-grow px-2 py-1">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Nome da loja (ex: Doce Amor, VIP) ou produto (ex: cimento, arroz)..."
                  value={localSearch}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setLocalSearch(e.target.value);
                    setIsSearchFocused(true);
                  }}
                  className="border-none outline-none font-sans text-xs sm:text-sm md:text-base flex-grow bg-transparent text-slate-900 placeholder:text-slate-400 w-full font-medium"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSearch('');
                      setIsSearchFocused(false);
                    }}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded-full cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>


              {/* Submit Search Button (colored background with white text) */}
              <button 
                type="submit"
                className="bg-[#103B75] hover:bg-[#0B254B] text-white font-bold py-2.5 sm:py-3 px-5 sm:px-6 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-all flex-shrink-0 cursor-pointer shadow-md active:scale-95"
              >
                <span>Pesquisar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* LIVE SEARCH AUTOCOMPLETE DROPDOWN */}
            <AnimatePresence>
              {isSearchFocused && localSearch.trim().length >= 1 && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl p-4 text-left z-50 text-slate-900 max-h-[480px] overflow-y-auto divide-y divide-slate-100"
                >
                  {/* Results Count Header */}
                  <div className="pb-3 flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold flex items-center gap-1.5 text-[#103B75]">
                      <Sparkles className="w-3.5 h-3.5 text-[#103B75]" />
                      Resultados para "{localSearch}"
                    </span>
                    <span>
                      {matchingStores.length} {matchingStores.length === 1 ? 'loja' : 'lojas'} · {matchingProducts.length} {matchingProducts.length === 1 ? 'produto' : 'produtos'}
                    </span>
                  </div>

                  {/* 1. STORES FOUND (Direct store redirection) */}
                  {matchingStores.length > 0 && (
                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-[#103B75]" />
                          Lojas & Estabelecimentos (Ir direto)
                        </span>
                        <span className="text-[10px] text-[#103B75] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                          Abre a loja diretamente
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {matchingStores.map(store => (
                          <button
                            key={store.id}
                            type="button"
                            onClick={() => openStoreDirectly(store)}
                            className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-[#103B75] hover:bg-blue-50/50 transition-all text-left cursor-pointer group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                              {store.imageUrl ? (
                                <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white text-[10px] font-bold">
                                  {store.name.substring(0, 2)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-900 truncate group-hover:text-[#103B75]">
                                {store.name}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3 shrink-0" />
                                {store.zone}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. PRODUCTS FOUND (Catalog items) */}
                  {matchingProducts.length > 0 && (
                    <div className="py-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase flex items-center gap-1.5">
                          <ShoppingBag className="w-3.5 h-3.5 text-[#103B75]" />
                          Produtos & Artigos nos Catálogos
                        </span>
                        <span className="text-[10px] text-[#103B75] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 font-bold">
                          {matchingProducts.length} encontrados
                        </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {matchingProducts.map((prod, pIdx) => (
                          <div
                            key={`prod-hit-${pIdx}`}
                            onClick={() => openStoreDirectly(prod.establishment)}
                            className="py-2 flex items-center justify-between gap-3 hover:bg-slate-50 p-2 rounded-lg cursor-pointer transition-colors"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                              <p className="text-[10px] text-slate-500 truncate">Vendido por: {prod.establishment.name} ({prod.establishment.zone})</p>
                            </div>
                            {prod.priceMT && (
                              <span className="text-xs font-bold text-[#103B75] shrink-0">
                                {prod.priceMT.toLocaleString()} MT
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {matchingStores.length === 0 && matchingProducts.length === 0 && (
                    <div className="py-6 text-center text-slate-500 space-y-1">
                      <p className="text-xs text-slate-700">
                        Nenhum resultado direto com o nome exato <strong>"{localSearch}"</strong>.
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Clique em pesquisar abaixo para varrer todos os catálogos e filtros da plataforma.
                      </p>
                    </div>
                  )}

                  {/* BOTTOM ACTION BUTTON */}
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => routeSearch(localSearch)}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#103B75] hover:bg-[#0B254B] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all"
                    >
                      <Search className="w-4 h-4" />
                      <span>Ver todas as lojas que têm "{localSearch}"</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Quick Suggestion Chips (Synchronized with corresponding menus) */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600 pt-1">
            <span className="text-slate-500 text-[11px] mr-1">
              Populares agora:
            </span>
            {QUICK_SEARCH_CHIPS.map((chip, idx) => (
              <button
                key={`quick-chip-${idx}`}
                onClick={() => handleQuickChipClick(chip)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-all border border-slate-200 cursor-pointer text-[11px] font-medium shadow-2xs"
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Popular Maputo Zones Quick Filters */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-500 text-[11px] flex items-center gap-1">
              <MapPin className="w-3 h-3 flex-shrink-0" /> Zonas:
            </span>
            {POPULAR_ZONES.map((zone, zIdx) => (
              <button
                key={`pop-zone-${zone}-${zIdx}`}
                onClick={() => handleZoneClick(zone)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200 cursor-pointer text-[11px]"
              >
                {zone}
              </button>
            ))}
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* KINETIC RIBBON — Fundo Cinza Claro Muito Próximo do Branco com Ícones Azul */}
      {/* ========================================================================= */}
      <div className="bg-slate-100 py-2.5 overflow-hidden text-slate-700 border-y border-slate-200">
        <div className="marquee-track flex items-center gap-6 whitespace-nowrap text-[11px] font-medium">
          {[1, 2].map((loop) => (
            <React.Fragment key={`marquee-loop-${loop}`}>
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#103B75]" /> Directório em fase inicial · Maputo e Matola
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#103B75]" /> Contacto directo por WhatsApp
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Plane className="w-3.5 h-3.5 text-[#103B75]" /> Roteiros para Ponta do Ouro, Inhaca & Bilene
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <Truck className="w-3.5 h-3.5 text-[#103B75]" /> Estafetas e entregas em Maputo e Matola
              </span>
              <span className="text-slate-300">·</span>
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Award className="w-3.5 h-3.5 text-[#103B75]" /> Preços transparentes em Meticais (MT)
              </span>
              <span className="text-slate-300">·</span>
            </React.Fragment>
          ))}
        </div>
      </div>



      {/* ========================================================================= */}
      {/* 3. NEGÓCIOS EM DESTAQUE NA PÁGINA INICIAL                                   */}
      {/* ========================================================================= */}
      <section className="py-14 border-b border-slate-200 bg-white">
        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500 block mb-1">
              Directório Oficial · Moçambique
            </span>
            <h2 className="font-serif font-bold text-2xl sm:text-3xl lg:text-4xl text-slate-900 tracking-tight">
              Negócios em Destaque
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Explore estabelecimentos com catálogo activo, preços em Meticais e contacto directo
            </p>
          </div>
          <button 
            onClick={() => setActivePage('segmentos')}
            className="text-xs sm:text-sm font-bold bg-white text-[#103B75] hover:bg-[#103B75] hover:text-white border-2 border-[#103B75] py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-xs active:scale-95"
          >
            <span>Explorar por Segmento ({establishments.length} Estabelecimentos)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="px-[5vw] lg:px-[7vw] max-w-7xl mx-auto w-full">
          {featuredEstablishments.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6">
              <Store className="w-9 h-9 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Ainda não existem estabelecimentos em destaque registados.</p>
              <p className="text-xs text-slate-500 mt-1">É proprietário de um negócio? Registe a sua conta e seja o primeiro em destaque no portal.</p>
              <button
                type="button"
                onClick={() => setActivePage('auth')}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#103B75] text-white text-xs font-bold rounded-xl hover:bg-[#0B254B] transition-colors cursor-pointer"
              >
                <span>Registar Negócio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {featuredEstablishments.map((conta, idx) => {
              const rank = idx + 1;
              const productCount = conta.productsCatalog?.length || 0;
              return (
                <div 
                  key={`destaque-est-${conta.id}`}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-[#103B75] transition-all flex flex-col justify-between group relative cursor-pointer"
                  onClick={() => onSelectEstablishment(conta)}
                >
                  <div className="h-44 bg-slate-900 relative overflow-hidden">
                    {conta.imageUrl ? (
                      <img src={conta.imageUrl} alt={conta.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif italic text-white opacity-40 text-xl" style={{ backgroundColor: conta.coverColor || '#0B254B' }}>
                        {conta.name}
                      </div>
                    )}

                    <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900/90 text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-md border border-white/15 shadow-xs">
                      <span>DESTAQUE 0{rank}</span>
                      <span className="text-white/40">·</span>
                      <span className="uppercase">{conta.category}</span>
                    </div>

                    {canManageEstablishment(currentUser, conta, establishments) && (
                      <label 
                        className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white cursor-pointer backdrop-blur-xs transition-all opacity-80 hover:opacity-100"
                        title="Alterar fotografia da conta"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={(e) => handleCardImageUpload(conta.id, e)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-grow space-y-3">
                    <div>
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-[#103B75] truncate mb-1">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-[#103B75]" />
                        <span>{conta.zone} · {conta.province}</span>
                      </span>
                      <h3 className="font-serif font-bold text-base text-slate-900 group-hover:text-[#103B75] transition-colors">
                        {conta.name}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                        {conta.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs font-mono font-medium text-slate-500">
                        {productCount > 0 ? `${productCount} artigos disponíveis` : 'Catálogo disponível'}
                      </span>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEstablishment(conta);
                        }}
                        className="text-[#103B75] group-hover:text-[#0B254B] transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Abrir perfil e catálogo"
                      >
                        <span>Abrir Perfil</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. CALL TO ACTION PARA PROPRIETÁRIOS & PARCEIROS COMERCIAIS               */}
      {/* ========================================================================= */}
      <section id="negocio" className="px-[5vw] lg:px-[7vw] py-12 text-center max-w-4xl mx-auto w-full">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-12 shadow-sm relative overflow-hidden">
          
          <span className="inline-flex items-center gap-1.5 text-xs text-[#103B75] font-bold bg-blue-50 border border-blue-200/60 px-3 py-1 rounded-full mb-3">
            <Store className="w-3.5 h-3.5" />
            Directório Comercial Oficial · Moçambique
          </span>

          <h2 className="font-serif font-bold text-2xl sm:text-4xl text-slate-900 mb-3 tracking-tight">
            Divulgue o seu estabelecimento no Axofácil!
          </h2>

          {/* Texto explicativo reduzido com link clicável */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs sm:text-sm text-slate-600 mb-6">
            <span>Presença comercial verificada com preçários em Meticais e contacto directo.</span>
            <button 
              type="button"
              onClick={() => setShowCommercialDetails(true)}
              className="text-[#103B75] hover:text-[#0B254B] font-bold underline decoration-[#103B75]/40 hover:decoration-[#103B75] cursor-pointer inline-flex items-center gap-1"
            >
              <span>Ver detalhes e como funciona a adesão</span>
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3 Aspectos Chaves em Destaque com Tipografia Grande */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-8 text-left">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#103B75] tracking-tight">0%</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">Comissão por Venda</span>
              <span className="text-[11px] text-slate-500">100% do valor dos artigos fica com a sua loja</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#103B75] tracking-tight">Directo</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">WhatsApp do Cliente</span>
              <span className="text-[11px] text-slate-500">Negociação e confirmação sem intermediários</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="block text-2xl sm:text-3xl font-extrabold text-[#103B75] tracking-tight">11 Províncias</span>
              <span className="text-xs font-bold text-slate-900 block mt-0.5">Visibilidade Nacional</span>
              <span className="text-[11px] text-slate-500">De Maputo à Matola, Beira e Nampula</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3.5">
            <button 
              onClick={() => setActivePage('auth')}
              className="bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs sm:text-sm py-3.5 px-7 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              Criar Conta Comercial
            </button>
            <button 
              onClick={() => setShowPartnerModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs sm:text-sm py-3.5 px-6 rounded-2xl shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center gap-2"
              title="Candidatura para parceiros comerciais sem necessidade de criar conta"
            >
              <Briefcase className="w-4 h-4 text-slate-950" />
              <span>Quero Ser Parceiro Comercial</span>
            </button>
            <button 
              onClick={() => setActivePage('lojas')}
              className="bg-white text-[#103B75] hover:bg-slate-50 border-2 border-[#103B75] text-xs sm:text-sm font-bold py-3.5 px-6 rounded-2xl cursor-pointer transition-all hover:scale-105"
            >
              Explorar Catálogo Completo
            </button>
          </div>

          {/* Dica para parceiros comerciais — texto conciso com link direto */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center shrink-0 border border-amber-200">
                <Briefcase className="w-4 h-4" />
              </div>
              <p className="text-xs text-slate-700">
                <strong>Prefere inclusão assistida?</strong> Registe o interesse e a nossa equipa inclui o seu negócio sem necessidade de registo prévio.
              </p>
            </div>
            <button
              onClick={() => setShowPartnerModal(true)}
              className="text-xs font-bold text-[#103B75] hover:text-[#0B254B] underline cursor-pointer shrink-0"
            >
              Candidatar Negócio ↗
            </button>
          </div>
        </div>
      </section>

      {/* Modal de Candidatura de Parceiro Comercial */}
      <PartnerInterestModal 
        isOpen={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />

      {/* Modal Explicativo de Vantagens e Adesão Comercial */}
      <CommercialDetailsModal
        isOpen={showCommercialDetails}
        onClose={() => setShowCommercialDetails(false)}
        onSelectRegister={() => setActivePage('auth')}
        onSelectPartner={() => setShowPartnerModal(true)}
      />

    </div>
  );
}
