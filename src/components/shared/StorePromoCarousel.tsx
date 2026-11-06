import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Store, 
  MessageSquare, 
  TrendingDown, 
  ShieldCheck, 
  ArrowRight, 
  Pause, 
  Play,
  ShoppingBag,
  Check
} from 'lucide-react';
import { Establishment, ProductItem, UserProfile, isAuthorizedStoreStaffOrAdmin } from '../../types/types';
import { getProductFallbackImage } from '../../data/data';

interface StorePromoCarouselProps {
  establishment: Establishment;
  onSelectEstablishment?: (est: Establishment) => void;
  currentUser?: UserProfile | null;
  onAddToCart?: (prod: ProductItem, est: Establishment, qty: number) => void;
  staggerIndex?: number;
}

export function getStorePromoProducts(est: Establishment): ProductItem[] {
  const catalog = est.productsCatalog || [];
  
  // 1. Explicitly marked promotional items
  const explicitPromos = catalog.filter(
    (p) => p.isPromo || (p.promoPriceMT && p.promoPriceMT < p.priceMT)
  );

  if (explicitPromos.length >= 3) {
    return explicitPromos;
  }

  // 2. Derive discounted promo prices for other catalog items
  const remainingCatalog = catalog.filter((p) => !explicitPromos.some((ep) => ep.id === p.id));
  const derivedCatalogPromos: ProductItem[] = remainingCatalog.map((p, idx) => {
    const discountRate = 0.15 + ((idx % 3) * 0.05); // 15%, 20%, 25%
    const promoPrice = Math.round(p.priceMT * (1 - discountRate));
    return {
      ...p,
      isPromo: true,
      promoPriceMT: p.promoPriceMT && p.promoPriceMT < p.priceMT ? p.promoPriceMT : promoPrice
    };
  });

  const combined = [...explicitPromos, ...derivedCatalogPromos];
  if (combined.length >= 3) {
    return combined;
  }

  // 3. Fallback: generate from productsList if catalog is small
  const listItems: ProductItem[] = (est.productsList || []).slice(0, 6).map((name, idx) => {
    const basePrice = 280 + (idx * 140);
    const promoPrice = Math.round(basePrice * 0.82);
    return {
      id: `${est.id}-promo-gen-${idx}`,
      name,
      priceMT: basePrice,
      promoPriceMT: promoPrice,
      isPromo: true,
      category: est.segment || est.category,
      imageUrl: getProductFallbackImage(name, est.category),
      description: `Oferta promocional de ${est.name}. Preço especial de campanha com garantia de autenticidade.`
    };
  });

  const allItems = [...combined, ...listItems];
  if (allItems.length > 0) {
    return allItems;
  }

  // 4. Default promotional deal card
  return [
    {
      id: `${est.id}-promo-default`,
      name: est.promotion || `Campanha Promocional ${est.name}`,
      priceMT: 500,
      promoPriceMT: 420,
      isPromo: true,
      category: 'Promoção',
      imageUrl: est.imageUrl || getProductFallbackImage(est.name, est.category),
      description: est.promotion || 'Aproveite os descontos especiais em vigor nesta loja autorizada.'
    }
  ];
}

function StorePromoCarouselComponent({
  establishment,
  onSelectEstablishment,
  currentUser,
  onAddToCart,
  staggerIndex = 0
}: StorePromoCarouselProps) {
  const products = useMemo(() => getStorePromoProducts(establishment), [establishment]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [containerWidth, setContainerWidth] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const isStoreStaff = isAuthorizedStoreStaffOrAdmin(currentUser);

  // Measure container width accurately with ResizeObserver to avoid any subpixel vibration
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width);
        if (width > 0) {
          setContainerWidth(width);
          if (width < 560) {
            setItemsPerView(1);
          } else if (width < 880) {
            setItemsPerView(2);
          } else if (width < 1200) {
            setItemsPerView(3);
          } else {
            setItemsPerView(4);
          }
        }
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const maxIndex = Math.max(0, products.length - itemsPerView);

  // Keep index within bounds
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Smooth, fluid ping-pong auto-circulation (zero trembling, no violent backward snap)
  useEffect(() => {
    if (isPaused || products.length <= itemsPerView || maxIndex <= 0) return;

    const delay = 3800 + ((staggerIndex % 3) * 500);
    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (direction === 1) {
          if (prev >= maxIndex) {
            setDirection(-1);
            return Math.max(0, prev - 1);
          }
          return prev + 1;
        } else {
          if (prev <= 0) {
            setDirection(1);
            return Math.min(maxIndex, prev + 1);
          }
          return prev - 1;
        }
      });
    }, delay);

    return () => clearInterval(interval);
  }, [isPaused, products.length, itemsPerView, maxIndex, staggerIndex, direction]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleOrderPresencial = (e: React.MouseEvent, prod: ProductItem, cardKey: string) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(prod, establishment, 1);
      setAddedItemKey(cardKey);
      setTimeout(() => setAddedItemKey(null), 2000);
    }
  };

  const handleStaffAddToCart = (e: React.MouseEvent, prod: ProductItem, cardKey: string) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(prod, establishment, 1);
      setAddedItemKey(cardKey);
      setTimeout(() => setAddedItemKey(null), 1800);
    }
  };

  const storeAvatar = establishment.imageUrl || getProductFallbackImage(establishment.name, establishment.category);
  const itemWidthPx = containerWidth > 0 ? containerWidth / itemsPerView : 280;
  const translateX = -(currentIndex * itemWidthPx);
  const totalPages = maxIndex + 1;

  return (
    <div 
      className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Store Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        
        {/* Left: Store Branding & Identity */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onSelectEstablishment && onSelectEstablishment(establishment)}
            className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 hover:opacity-90 transition-opacity cursor-pointer"
            title={`Abrir vitrine de ${establishment.name}`}
          >
            <img 
              src={storeAvatar} 
              alt={establishment.name} 
              className="w-full h-full object-cover"
            />
          </button>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 
                onClick={() => onSelectEstablishment && onSelectEstablishment(establishment)}
                className="font-serif font-black text-base sm:text-lg text-slate-900 hover:text-[#103B75] cursor-pointer transition-colors"
              >
                {establishment.name}
              </h3>
              {establishment.isVerified && (
                <span className="bg-slate-100 text-[#103B75] text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 flex items-center gap-0.5">
                  <ShieldCheck className="w-3 h-3 text-[#103B75]" />
                  <span>Verificado</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-semibold text-slate-700">📍 {establishment.zone || establishment.city || 'Maputo'}</span>
              <span>•</span>
              <span className="capitalize text-slate-600">{establishment.segment || establishment.category}</span>
              <span>•</span>
              <span className="text-[#103B75] font-bold">{products.length} {products.length === 1 ? 'artigo em promoção' : 'artigos em promoção'}</span>
            </div>
          </div>
        </div>

        {/* Right: Carousel Controls */}
        <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0">
          
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-[#103B75]'}`} />
            <span>{isPaused ? 'Pausa' : 'A circular'}</span>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-0.5 hover:text-[#103B75] transition-colors ml-0.5 cursor-pointer"
              title={isPaused ? "Retomar rotação suave" : "Pausar rotação"}
              aria-label={isPaused ? "Retomar rotação suave" : "Pausar rotação"}
            >
              {isPaused ? <Play className="w-3 h-3 text-[#103B75]" /> : <Pause className="w-3 h-3 text-slate-500" />}
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={products.length <= itemsPerView}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 transition-colors cursor-pointer ${
                products.length <= itemsPerView
                  ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 text-slate-800'
              }`}
              title="Oferta anterior"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            <span className="text-xs font-mono font-bold text-slate-600 px-1 whitespace-nowrap">
              {currentIndex + 1}/{Math.max(1, maxIndex + 1)}
            </span>

            <button
              type="button"
              onClick={handleNext}
              disabled={products.length <= itemsPerView}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 transition-colors cursor-pointer ${
                products.length <= itemsPerView
                  ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 text-slate-800'
              }`}
              title="Próxima oferta"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {onSelectEstablishment && (
            <button
              type="button"
              onClick={() => onSelectEstablishment(establishment)}
              className="py-1.5 px-3 bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title={`Ver vitrine completa de ${establishment.name}`}
            >
              <span>Ver Vitrine</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

        </div>
      </div>

      {/* CONTINUOUS SMOOTH CAROUSEL TRACK */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden py-1 rounded-xl"
      >
        <div 
          className="flex will-change-transform"
          style={{
            transform: `translate3d(${translateX}px, 0, 0)`,
            transition: 'transform 550ms cubic-bezier(0.22, 1, 0.36, 1)',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden'
          }}
        >
          {products.map((prod, idx) => {
            const prodImg = prod.imageUrl || getProductFallbackImage(prod.name, prod.category);
            const promoPrice = prod.promoPriceMT || prod.priceMT;
            const origPrice = prod.priceMT;
            const discountPct = origPrice > promoPrice ? Math.round(((origPrice - promoPrice) / origPrice) * 100) : 18;
            const savingsMT = origPrice > promoPrice ? origPrice - promoPrice : 0;
            const unitText = prod.unitLabel || (establishment.category === 'supermercado' ? 'Kg' : 'Un');
            const cardKey = `store-promo-${establishment.id}-${prod.id || idx}`;
            const isAdded = addedItemKey === cardKey;

            const directWaText = encodeURIComponent(
              `Olá ${establishment.name}! Vi a promoção de *${prod.name}* por *${promoPrice} MT/${unitText}* no Axofácil! Moçambique e gostaria de encomendar.`
            );
            const waUrl = establishment.whatsappLink 
              ? `${establishment.whatsappLink}${establishment.whatsappLink.includes('?') ? '&' : '?'}text=${directWaText}`
              : `https://wa.me/258840000000?text=${directWaText}`;

            return (
              <div
                key={`promo-slot-${establishment.id}-${prod.id || idx}-${idx}`}
                className="shrink-0 px-2"
                style={{ width: `${itemWidthPx}px` }}
              >
                <div className="bg-white border border-slate-200 hover:border-[#103B75]/60 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-colors flex flex-col justify-between group h-full">
                  {/* Top Image Box */}
                  <div 
                    onClick={() => onSelectEstablishment && onSelectEstablishment(establishment)}
                    className="relative h-36 sm:h-40 bg-slate-100 overflow-hidden cursor-pointer"
                    title={`Ver produto em ${establishment.name}`}
                  >
                    <img 
                      src={prodImg} 
                      alt={prod.name} 
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(prod.name, prod.category);
                      }}
                      className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                    />

                    {/* Discount & Savings Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                      <span className="bg-[#103B75] text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-white" />
                        <span>-{discountPct}%</span>
                      </span>
                      {savingsMT > 0 && (
                        <span className="bg-white text-slate-800 font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
                          Poupe {savingsMT} MT
                        </span>
                      )}
                    </div>

                    {/* Category Pill */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                      <span className="bg-slate-900/90 text-white text-[9px] font-bold px-2 py-0.5 rounded truncate max-w-[130px]">
                        {prod.category || establishment.segment || 'Oferta'}
                      </span>
                      <span className="bg-[#103B75] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                        Em Stock
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-4 space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        <span>Preço Promocional</span>
                        <span className="text-[#103B75] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-semibold">
                          IVA 16% Inc.
                        </span>
                      </div>

                      <h4 
                        onClick={() => onSelectEstablishment && onSelectEstablishment(establishment)}
                        className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#103B75] transition-colors line-clamp-2 min-h-[2.4rem] cursor-pointer leading-tight"
                        title={prod.name}
                      >
                        {prod.name}
                      </h4>
                    </div>

                    {/* Pricing */}
                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif font-black text-base sm:text-lg text-[#103B75]">
                          {promoPrice} MT
                        </span>
                        <span className="text-[10px] text-slate-500 font-bold">/{unitText}</span>
                      </div>
                      {origPrice > promoPrice && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {origPrice} MT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Section with Order Options */}
                  <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Opções de Pedido</span>
                      <span className="text-[#103B75] bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        Presencial ou WhatsApp
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* OPÇÃO 1: Pedido Presencial / Carrinha */}
                      <button
                        type="button"
                        onClick={(e) => handleOrderPresencial(e, prod, cardKey)}
                        className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAdded 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-[#103B75] hover:bg-[#0B254B] text-white'
                        }`}
                        title="Fazer pedido presencial no balcão/mesa ou adicionar à carrinha"
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>✓ Requisitado na Carrinha!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3.5 h-3.5 text-white shrink-0" />
                            <span>Pedir Presencial / Carrinha</span>
                          </>
                        )}
                      </button>

                      {/* OPÇÃO 2: Pedido via WhatsApp Oficial da Loja */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-decoration-none"
                        title={`Pedir ${prod.name} pelo WhatsApp da loja`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none shrink-0" />
                        <span>Pedir no WhatsApp</span>
                      </a>
                    </div>

                    {/* POS / Caixa Action - Visible ONLY to store staff / store admin */}
                    {isStoreStaff && onAddToCart && (
                      <button
                        type="button"
                        onClick={(e) => handleStaffAddToCart(e, prod, cardKey)}
                        className={`w-full py-1 px-2 text-[9px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          isAdded 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-white hover:bg-slate-100 text-[#103B75] border border-slate-200'
                        }`}
                        title="Adicionar ao sistema de pedidos da loja"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        <span>Lançar no Caixa / POS Interno</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Dots */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 pt-1">
          {Array.from({ length: totalPages }).map((_, dotIdx) => (
            <button
              key={`dot-${establishment.id}-${dotIdx}`}
              type="button"
              onClick={() => setCurrentIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                dotIdx === currentIndex 
                  ? 'w-6 bg-[#103B75]' 
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Ir para produto ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const StorePromoCarousel = memo(StorePromoCarouselComponent);
export default StorePromoCarousel;
