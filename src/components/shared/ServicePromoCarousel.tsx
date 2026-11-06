import React, { useState, useEffect, useMemo, useRef, memo } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare, 
  TrendingDown, 
  ArrowRight, 
  Pause, 
  Play,
  ShoppingBag,
  Check,
  Store
} from 'lucide-react';
import { Establishment, ProductItem, UserProfile, isAuthorizedStoreStaffOrAdmin } from '../../types/types';
import { getProductFallbackImage } from '../../data/data';

export interface ServicePromoItem {
  id: string;
  name: string;
  priceMT: number;
  promoPriceMT: number;
  discountPct: number;
  savingsMT: number;
  unitLabel: string;
  imageUrl: string;
  description: string;
  category: string;
  serviceId: string;
  establishment: Establishment;
  isDeal?: boolean;
}

interface ServicePromoCarouselProps {
  serviceId: string;
  serviceName: string;
  serviceIcon: string;
  serviceBadge: string;
  description: string;
  portalTargetPage?: string;
  items: ServicePromoItem[];
  participatingStores: Establishment[];
  onSelectEstablishment?: (est: Establishment) => void;
  currentUser?: UserProfile | null;
  onAddToCart?: (prod: ProductItem, est: Establishment, qty: number) => void;
  setActivePage?: (page: any) => void;
  staggerIndex?: number;
}

function ServicePromoCarouselComponent({
  serviceId,
  serviceName,
  serviceIcon,
  serviceBadge,
  description,
  portalTargetPage,
  items,
  participatingStores,
  onSelectEstablishment,
  currentUser,
  onAddToCart,
  setActivePage,
  staggerIndex = 0
}: ServicePromoCarouselProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [addedItemKey, setAddedItemKey] = useState<string | null>(null);
  const [itemsPerView, setItemsPerView] = useState(4);
  const [containerWidth, setContainerWidth] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const isStoreStaff = isAuthorizedStoreStaffOrAdmin(currentUser);

  // Measure container width precisely with ResizeObserver to prevent any subpixel jitter
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

  // Filter items if user selects a specific store inside this service
  const filteredItems = useMemo(() => {
    if (!selectedStoreId) return items;
    return items.filter((item) => item.establishment.id === selectedStoreId);
  }, [items, selectedStoreId]);

  // Reset index when items count or store filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setDirection(1);
  }, [selectedStoreId]);

  const maxIndex = Math.max(0, filteredItems.length - itemsPerView);

  // Keep index within valid bounds if items count or view size changes
  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [maxIndex, currentIndex]);

  // Buttery-smooth, natural auto-circulation (ping-pong glide):
  // Never jumps or snaps backward across multiple cards; glides card-by-card with fluid easing.
  useEffect(() => {
    if (isPaused || filteredItems.length <= itemsPerView || maxIndex <= 0) return;

    const delay = 4000 + ((staggerIndex % 3) * 500);
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
  }, [isPaused, filteredItems.length, itemsPerView, maxIndex, staggerIndex, direction]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  };

  const handleOrderPresencial = (e: React.MouseEvent, item: ServicePromoItem, cardKey: string) => {
    e.stopPropagation();
    if (onAddToCart) {
      const productObj: ProductItem = {
        id: item.id,
        name: item.name,
        priceMT: item.priceMT,
        promoPriceMT: item.promoPriceMT,
        isPromo: true,
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description,
        unitLabel: item.unitLabel
      };
      onAddToCart(productObj, item.establishment, 1);
      setAddedItemKey(cardKey);
      setTimeout(() => setAddedItemKey(null), 2000);
    }
  };

  const handleStaffAddToCart = (e: React.MouseEvent, item: ServicePromoItem, cardKey: string) => {
    e.stopPropagation();
    if (onAddToCart) {
      const productObj: ProductItem = {
        id: item.id,
        name: item.name,
        priceMT: item.priceMT,
        promoPriceMT: item.promoPriceMT,
        isPromo: true,
        category: item.category,
        imageUrl: item.imageUrl,
        description: item.description,
        unitLabel: item.unitLabel
      };
      onAddToCart(productObj, item.establishment, 1);
      setAddedItemKey(cardKey);
      setTimeout(() => setAddedItemKey(null), 1800);
    }
  };

  if (filteredItems.length === 0) return null;

  // Exact card width in pixels to eliminate subpixel rounding jitter completely
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
      {/* Service Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        
        {/* Left: Service Identity & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-[#0B254B] text-white flex items-center justify-center text-2xl shadow-xs shrink-0">
            <span>{serviceIcon}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-black text-base sm:text-lg text-slate-900 leading-tight">
                {serviceName}
              </h3>
              <span className="bg-slate-100 text-[#0B254B] font-extrabold text-[10px] px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
                {serviceBadge}
              </span>
            </div>

            <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
              {description}
            </p>

            <div className="flex items-center gap-2 text-xs text-slate-500 pt-0.5 flex-wrap">
              <span className="text-[#0B254B] font-bold">
                {filteredItems.length} {filteredItems.length === 1 ? 'artigo em promoção' : 'artigos em promoção'}
              </span>
              <span>•</span>
              <span className="font-medium text-slate-600">
                {participatingStores.length} {participatingStores.length === 1 ? 'estabelecimento participante' : 'estabelecimentos participantes'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Carousel Controls & Portal Target Link */}
        <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0">
          
          {/* Circulation Status Indicator */}
          <div className="flex items-center gap-1.5 bg-slate-100 text-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full border border-slate-200">
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-[#0B254B]'}`} />
            <span>{isPaused ? 'Pausa' : 'A circular'}</span>
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-0.5 hover:text-[#0B254B] transition-colors ml-0.5 cursor-pointer"
              title={isPaused ? "Retomar rotação suave" : "Pausar rotação"}
              aria-label={isPaused ? "Retomar rotação suave" : "Pausar rotação"}
            >
              {isPaused ? <Play className="w-3 h-3 text-[#0B254B]" /> : <Pause className="w-3 h-3 text-slate-500" />}
            </button>
          </div>

          {/* Smooth Step Arrows */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrev}
              disabled={filteredItems.length <= itemsPerView}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 transition-colors cursor-pointer ${
                filteredItems.length <= itemsPerView
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
              disabled={filteredItems.length <= itemsPerView}
              className={`w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 transition-colors cursor-pointer ${
                filteredItems.length <= itemsPerView
                  ? 'bg-slate-100 text-slate-400 opacity-50 cursor-not-allowed'
                  : 'bg-white hover:bg-slate-100 text-slate-800'
              }`}
              title="Próxima oferta"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Direct Sector Page Link */}
          {portalTargetPage && setActivePage && (
            <button
              type="button"
              onClick={() => setActivePage(portalTargetPage)}
              className="py-1.5 px-3 bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer shrink-0"
              title={`Ver página completa de ${serviceName}`}
            >
              <span className="hidden sm:inline">Ver Todos em</span>
              <span className="capitalize">{portalTargetPage}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

        </div>
      </div>

      {/* Filter by establishment inside this service */}
      {participatingStores.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
            Filtrar por Estabelecimento:
          </span>
          <button
            type="button"
            onClick={() => setSelectedStoreId(null)}
            className={`py-1 px-2.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors cursor-pointer ${
              selectedStoreId === null
                ? 'bg-[#0B254B] text-white shadow-xs'
                : 'bg-white text-[#0B254B] border border-slate-200 hover:bg-slate-50'
            }`}
          >
            Todos ({items.length})
          </button>
          {participatingStores.map((store) => {
            const count = items.filter((i) => i.establishment.id === store.id).length;
            const isSelected = selectedStoreId === store.id;
            return (
              <button
                key={`store-filter-${store.id}`}
                type="button"
                onClick={() => setSelectedStoreId(store.id)}
                className={`py-1 px-2.5 rounded-lg font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 cursor-pointer ${
                  isSelected
                    ? 'bg-[#0B254B] text-white shadow-xs'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className="truncate max-w-[140px]">{store.name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

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
          {filteredItems.map((item, idx) => {
            const prodImg = item.imageUrl || getProductFallbackImage(item.name, item.category);
            const cardKey = `service-promo-${serviceId}-${item.establishment.id}-${item.id}-${idx}`;
            const isAdded = addedItemKey === cardKey;

            const directWaText = encodeURIComponent(
              `Olá ${item.establishment.name}! Vi a promoção no catálogo de *${serviceName}* no Axofácil! Moçambique:\n*${item.name}* por *${item.promoPriceMT} MT/${item.unitLabel}*.\nGostaria de obter informações e encomendar.`
            );
            const waUrl = item.establishment.whatsappLink 
              ? `${item.establishment.whatsappLink}${item.establishment.whatsappLink.includes('?') ? '&' : '?'}text=${directWaText}`
              : `https://wa.me/258840000000?text=${directWaText}`;

            return (
              <div 
                key={`promo-item-${serviceId}-${item.establishment.id}-${item.id}-${idx}`}
                className="shrink-0 px-2"
                style={{ width: `${itemWidthPx}px` }}
              >
                <div className="bg-white border border-slate-200 hover:border-[#0B254B]/60 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-colors flex flex-col justify-between group h-full">
                  
                  {/* Top Image Box */}
                  <div 
                    onClick={() => onSelectEstablishment && onSelectEstablishment(item.establishment)}
                    className="relative h-40 sm:h-44 bg-slate-100 overflow-hidden cursor-pointer"
                    title={`Ver vitrine de ${item.establishment.name}`}
                  >
                    <img 
                      src={prodImg} 
                      alt={item.name} 
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getProductFallbackImage(item.name, item.category);
                      }}
                      className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                    />

                    {/* Top Left: Discount & Savings Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
                      <span className="bg-[#0B254B] text-white font-black text-[10px] sm:text-xs px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <TrendingDown className="w-3 h-3 text-white" />
                        <span>-{item.discountPct}%</span>
                      </span>
                      {item.savingsMT > 0 && (
                        <span className="bg-white text-slate-800 font-bold text-[9px] px-1.5 py-0.5 rounded shadow-xs border border-slate-200">
                          Poupe {item.savingsMT} MT
                        </span>
                      )}
                    </div>

                    {/* Bottom Floating Establishment Banner */}
                    <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10">
                      <div 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectEstablishment) onSelectEstablishment(item.establishment);
                        }}
                        className="bg-slate-900/90 text-white text-[9.5px] font-bold px-2 py-1 rounded flex items-center gap-1.5 shadow-sm truncate max-w-[180px] cursor-pointer"
                        title={`Visitar ${item.establishment.name}`}
                      >
                        <Store className="w-3 h-3 text-white shrink-0" />
                        <span className="truncate">{item.establishment.name}</span>
                      </div>

                      <span className="bg-[#0B254B] text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs whitespace-nowrap">
                        {item.establishment.zone || 'Maputo'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-4 space-y-2 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                        <span className="truncate max-w-[140px]">{item.category}</span>
                        <span className="text-[#0B254B] bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 shrink-0 font-semibold">
                          IVA 16% Inc.
                        </span>
                      </div>

                      <h4 
                        onClick={() => onSelectEstablishment && onSelectEstablishment(item.establishment)}
                        className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#0B254B] transition-colors line-clamp-2 min-h-[2.4rem] cursor-pointer leading-tight"
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      {item.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-snug">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing */}
                    <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between gap-2">
                      <div className="flex items-baseline gap-1">
                        <span className="font-serif font-black text-base sm:text-lg text-[#0B254B]">
                          {item.promoPriceMT.toLocaleString()} MT
                        </span>
                        {item.unitLabel && (
                          <span className="text-[10px] text-slate-500 font-bold">/{item.unitLabel}</span>
                        )}
                      </div>
                      {item.priceMT > item.promoPriceMT && (
                        <span className="text-xs text-slate-400 line-through font-mono">
                          {item.priceMT.toLocaleString()} MT
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Section with Order Options */}
                  <div className="p-2.5 sm:p-3 bg-slate-50 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>Opções de Pedido</span>
                      <span className="text-[#0B254B] bg-white px-1.5 py-0.2 rounded border border-slate-200">
                        Presencial ou WhatsApp
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {/* OPÇÃO 1: Pedido Presencial / No Local / Adicionar à Carrinha */}
                      <button
                        type="button"
                        onClick={(e) => handleOrderPresencial(e, item, cardKey)}
                        className={`w-full py-2 px-2.5 rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                          isAdded 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-[#0B254B] hover:bg-[#061833] text-white'
                        }`}
                        title="Fazer pedido presencial ou adicionar à carrinha"
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

                      {/* OPÇÃO 2: Pedido via WhatsApp Oficial do Estabelecimento */}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-2 px-2.5 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-decoration-none"
                        title={`Pedir ${item.name} pelo WhatsApp`}
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white stroke-none shrink-0" />
                        <span>Pedir no WhatsApp</span>
                      </a>
                    </div>

                    {/* POS / Caixa Action - Visible ONLY to store staff / store admin */}
                    {isStoreStaff && onAddToCart && (
                      <button
                        type="button"
                        onClick={(e) => handleStaffAddToCart(e, item, cardKey)}
                        className={`w-full py-1 px-2 text-[9px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                          isAdded 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-white hover:bg-slate-100 text-[#0B254B] border border-slate-200'
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
              key={`dot-${serviceId}-${dotIdx}`}
              type="button"
              onClick={() => setCurrentIndex(dotIdx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                dotIdx === currentIndex 
                  ? 'w-6 bg-[#0B254B]' 
                  : 'w-1.5 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Ir para posição ${dotIdx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const ServicePromoCarousel = memo(ServicePromoCarouselComponent);
export default ServicePromoCarousel;
