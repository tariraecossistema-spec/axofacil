import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Tag, 
  Flame, 
  Clock, 
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  Plus, 
  Filter,
  TrendingDown,
  Layers,
  BedDouble,
  GlassWater,
  Shirt,
  ShoppingCart,
  HardHat,
  Car,
  Plane,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Establishment, ProductItem, PromoDeal, UserProfile } from '../types/types';
import ServicePromoCarousel, { ServicePromoItem } from '../components/shared/ServicePromoCarousel';
import { getStorePromoProducts } from '../components/shared/StorePromoCarousel';
import { getProductFallbackImage } from '../data/data';

interface PromocoesPageProps {
  establishments: Establishment[];
  deals: PromoDeal[];
  onSelectEstablishment: (est: Establishment) => void;
  onAddPromotion: (category: any) => void;
  currentUser: UserProfile | null;
  onAddToCart?: (prod: ProductItem, est: Establishment, qty: number) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  setActivePage?: (page: any) => void;
}

interface PromoCarouselSlide {
  id: string;
  serviceName: string;
  serviceIcon: string;
  title: string;
  subtitle: string;
  badge: string;
  discount: string;
  imageUrl: string;
  category: string;
  establishmentId?: string;
  simulatedProduct: {
    name: string;
    promoPriceMT: number;
    originalPriceMT: number;
    discountPct: number;
    unit?: string;
    details?: string;
  };
}

const MASTER_HERO_SLIDES: PromoCarouselSlide[] = [
  {
    id: 'slide-hotelaria',
    serviceName: 'Hotelaria & Hospedagens',
    serviceIcon: '🏨',
    title: 'Hotelaria de Luxo, Lodges & Pernoites com Pequeno-Almoço',
    subtitle: 'Hotéis executivos, lodges à beira-mar, suítes na Polana, Ponta do Ouro, Catembe e estadias relaxantes em Moçambique',
    badge: 'SERVIÇOS DE HOTELARIA',
    discount: '-30% OFF',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=90',
    category: 'hospedagens',
    simulatedProduct: {
      name: 'Suíte Executiva com Vista Mar + Pequeno-Almoço Buffet',
      promoPriceMT: 3200,
      originalPriceMT: 4600,
      discountPct: 30,
      unit: 'Diária',
      details: 'Check-in flexível, piscina panorâmica, Wi-Fi de alta velocidade e estacionamento'
    }
  },
  {
    id: 'slide-bares',
    serviceName: 'Bares & Restaurantes',
    serviceIcon: '🍹',
    title: 'Bares, Sunset Costa do Sol & Marisco na Brasa',
    subtitle: 'Baldes de cerveja 2M gelada, cocktails tropicais, lagosta na brasa, lounges e fins de tarde animados em Maputo',
    badge: 'SERVIÇOS DE BAR',
    discount: 'COMBO ESPECIAL',
    imageUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=1600&q=90',
    category: 'bares',
    simulatedProduct: {
      name: 'Balde 6x Cervejas 2M Geladas + Choco Frito com Piri-Piri',
      promoPriceMT: 850,
      originalPriceMT: 1200,
      discountPct: 29,
      unit: 'Combo',
      details: 'Válido todos os dias a partir das 16h com vista para a baía'
    }
  },
  {
    id: 'slide-lojas',
    serviceName: 'Lojas & Moda',
    serviceIcon: '🛍️',
    title: 'Lojas, Moda Baixa & Capulanas Originais de Moçambique',
    subtitle: 'Capulanas de alta gramagem 100% algodão, vestuário executivo, calçado e boutiques no centro comercial da Baixa',
    badge: 'SERVIÇOS DE LOJAS',
    discount: '-35% NA 2ª PEÇA',
    imageUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1600&q=90',
    category: 'lojas',
    simulatedProduct: {
      name: 'Kit 3x Capulanas Tradicionais Moçambicanas 100% Algodão',
      promoPriceMT: 1100,
      originalPriceMT: 1650,
      discountPct: 33,
      unit: 'Kit 3 peças',
      details: 'Padrões autênticos de alta durabilidade para vestuário e cerimónias'
    }
  },
  {
    id: 'slide-supermercados',
    serviceName: 'Supermercados & Frescos',
    serviceIcon: '🛒',
    title: 'Supermercados, Frescos & Marisco Nacional de Inhambane',
    subtitle: 'Camarão tigre fresco da costa, peixe serra em postas, cabazes de frescos da horta e produtos alimentares a grosso',
    badge: 'SERVIÇOS DE SUPERMERCADOS',
    discount: 'PREÇO DE MERCADO',
    imageUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=90',
    category: 'supermercado',
    simulatedProduct: {
      name: 'Camarão Tigre Selvagem Congelado a Bordo (Caixa 1Kg)',
      promoPriceMT: 750,
      originalPriceMT: 1050,
      discountPct: 28,
      unit: 'Kg',
      details: 'Origem costa de Inhambane, calibre grande limpo pronto a grelhar'
    }
  },
  {
    id: 'slide-construcao',
    serviceName: 'Material de Construção',
    serviceIcon: '🏗️',
    title: 'Material de Construção, Obras & Cimento Limpopo Estrutural',
    subtitle: 'Sacos de cimento 42.5N, varão de aço nervurado, chapas galvanizadas e blocos industriais com entrega na obra',
    badge: 'SERVIÇOS DE CONSTRUÇÃO',
    discount: 'FRETE GRÁTIS MATOLA',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=90',
    category: 'construcao',
    simulatedProduct: {
      name: 'Cimento Limpopo 42.5N (Saco 50Kg) com Entrega na Obra',
      promoPriceMT: 465,
      originalPriceMT: 510,
      discountPct: 9,
      unit: 'Saco 50Kg',
      details: 'Resistência estrutural para fundações, lajes e betão armado'
    }
  },
  {
    id: 'slide-pecas',
    serviceName: 'Peças & Auto',
    serviceIcon: '🚗',
    title: 'Peças de Reposição, Baterias Willard & Oficinas Mecânicas',
    subtitle: 'Baterias automotivas seladas com garantia de 12 meses, filtros japoneses D4D, pastilhas e amortecedores',
    badge: 'SERVIÇOS DE AUTO PEÇAS',
    discount: 'DIAGNÓSTICO GRÁTIS',
    imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=1600&q=90',
    category: 'pecas_auto',
    simulatedProduct: {
      name: 'Bateria Automotiva Willard 12V 65Ah Selada + Montagem',
      promoPriceMT: 4200,
      originalPriceMT: 5200,
      discountPct: 19,
      unit: 'Unidade',
      details: 'Inclui diagnóstico gratuito do alternador e instalação'
    }
  },
  {
    id: 'slide-turismo',
    serviceName: 'Turismo & Safaris',
    serviceIcon: '✈️',
    title: 'Turismo, Safaris & Voos LAM Moçambique',
    subtitle: 'Safaris 4x4 no Parque Nacional de Maputo, Reserva de Elefantes, Bilene, Ilha de Inhaca e bilhetes de avião com transfer',
    badge: 'SERVIÇOS DE TURISMO',
    discount: '-25% OFF',
    imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=90',
    category: 'turismo',
    simulatedProduct: {
      name: 'Safari 4x4 Parque Nacional de Maputo + Guia Oficial e Almoço',
      promoPriceMT: 3600,
      originalPriceMT: 4800,
      discountPct: 25,
      unit: 'Por pessoa',
      details: 'Passeio guiado de dia inteiro com almoço e transporte 4x4 climatizado'
    }
  },
  {
    id: 'slide-logistica',
    serviceName: 'Logística & Fretes',
    serviceIcon: '🚚',
    title: 'Logística, Cargas & Fretes Express',
    subtitle: 'Carrinhas de carga 1.5T/3T, mudanças residenciais, furgões climatizados e motoboys express na Baixa, Polana e Matola',
    badge: 'SERVIÇOS DE ENTREGADORES',
    discount: 'POUPE 700 MT',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1600&q=90',
    category: 'entregadores',
    simulatedProduct: {
      name: 'Frete Carrinha 1.5T Mudanças & Cargas (Maputo ↔ Matola)',
      promoPriceMT: 1500,
      originalPriceMT: 2200,
      discountPct: 32,
      unit: 'Por frete',
      details: 'Inclui motorista e ajudante de carga com rastreio direto'
    }
  }
];

interface PortalServiceConfig {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  badge: string;
  description: string;
  portalTargetPage: string;
  matches: (est: Establishment) => boolean;
}

const PORTAL_SERVICES: PortalServiceConfig[] = [
  {
    id: 'hospedagens',
    name: 'Serviços de Hotelaria, Hospedagens & Alojamento',
    shortName: 'Hotelaria & Hospedagens',
    icon: '🏨',
    badge: 'HOTELARIA & HOSPEDAGENS',
    description: 'Hotéis executivos, lodges à beira-mar, suítes na Polana, diárias de fim-de-semana e pernoites com pequeno-almoço buffet.',
    portalTargetPage: 'hospedagens',
    matches: (est) => est.category === ('hospedagem' as any) || est.category === ('hotel' as any) || (est.segment || '').toLowerCase().includes('hotel') || (est.segment || '').toLowerCase().includes('hospedagem')
  },
  {
    id: 'bares',
    name: 'Serviços de Bar, Restaurantes & Diversão',
    shortName: 'Bares & Restaurantes',
    icon: '🍹',
    badge: 'BARES & DIVERSÃO',
    description: 'Bares, lounges, sunsets na Costa do Sol, baldes de cerveja 2M gelada, mariscos grelhados e cocktails tropicais.',
    portalTargetPage: 'bares',
    matches: (est) => est.category === 'bar' || est.segment === 'bar'
  },
  {
    id: 'lojas',
    name: 'Serviços de Lojas, Retalho & Moda',
    shortName: 'Lojas & Moda Baixa',
    icon: '🛍️',
    badge: 'LOJAS & MODA',
    description: 'Capulanas tradicionais autênticas, fatos executivos, vestuário feminino, calçado e boutiques comerciais da Baixa de Maputo.',
    portalTargetPage: 'lojas',
    matches: (est) => (est.category === 'loja' || (est.category as string) === 'lojas') && est.segment !== 'pecas_auto'
  },
  {
    id: 'supermercados',
    name: 'Serviços de Supermercados, Frescos & Mercearias',
    shortName: 'Supermercados & Frescos',
    icon: '🛒',
    badge: 'SUPERMERCADOS & FRESCOS',
    description: 'Camarão tigre fresco da costa, peixe serra em postas, cabazes de frescos, arroz, óleo vegetal e abastecimento a grosso.',
    portalTargetPage: 'supermercados',
    matches: (est) => est.category === 'supermercado' || est.segment === 'supermercado'
  },
  {
    id: 'construcao',
    name: 'Serviços de Material de Construção, Obras & Estaleiros',
    shortName: 'Construção & Estaleiros',
    icon: '🏗️',
    badge: 'MATERIAL DE CONSTRUÇÃO',
    description: 'Cimento Limpopo 42.5N, varão de aço nervurado, chapas de zinco galvanizadas, brita e blocos prensados com entrega na obra.',
    portalTargetPage: 'construcao',
    matches: (est) => est.category === 'construcao' || est.segment === 'construcao'
  },
  {
    id: 'pecas_auto',
    name: 'Serviços de Peças de Reposição & Oficinas Auto',
    shortName: 'Peças & Auto',
    icon: '🚗',
    badge: 'PEÇAS & OFICINAS AUTO',
    description: 'Baterias automotivas Willard e Bosch com garantia, filtros japoneses D4D, pastilhas de travão, pneus e peças mecânicas.',
    portalTargetPage: 'lojas',
    matches: (est) => est.category === 'pecas_auto' || est.segment === 'pecas_auto'
  },
  {
    id: 'turismo',
    name: 'Serviços de Turismo, Safaris & Logística de Viagens',
    shortName: 'Turismo & Safaris',
    icon: '✈️',
    badge: 'TURISMO & SAFARIS',
    description: 'Safaris 4x4 no Parque Nacional de Maputo, travessias de catamarã para a Ilha de Inhaca, bilhetes de voo LAM e excursões.',
    portalTargetPage: 'turismo',
    matches: (est) => est.category === 'turismo' || est.segment === 'turismo' || (est.category as any) === 'agencia'
  },
  {
    id: 'entregadores',
    name: 'Serviços de Entregadores, Fretes & Logística Express',
    shortName: 'Entregadores & Fretes',
    icon: '🚚',
    badge: 'LOGÍSTICA & FRETES EXPRESS',
    description: 'Carrinhas de carga 1.5T e 3T, mudanças residenciais, estafetas e motoboys express para entregas rápidas em Maputo e Matola.',
    portalTargetPage: 'entregadores',
    matches: (est) => est.category === 'entregador' || (est as any).isDeliveryDriver || (est.segment || '').toLowerCase().includes('frete') || (est.segment || '').toLowerCase().includes('entrega')
  }
];

export default function PromocoesPage({
  establishments,
  deals,
  onSelectEstablishment,
  onAddPromotion,
  currentUser,
  onAddToCart,
  canGoBack,
  onGoBack,
  onGoHome,
  setActivePage
}: PromocoesPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isHeroPaused, setIsHeroPaused] = useState(false);

  // Dynamic slides combining newly launched platform deals + curated service slides
  const dynamicHeroSlides = useMemo(() => {
    const dealsSlides: PromoCarouselSlide[] = deals.map((deal, dIdx) => {
      const est = establishments.find((e) => e.id === deal.establishmentId);
      const cat = (est?.category || 'lojas') as string;
      let serviceName = 'Oferta Especial';
      let serviceIcon = '🔥';
      if (cat === 'turismo') { serviceName = 'Turismo & Safaris'; serviceIcon = '✈️'; }
      else if (cat === 'entregador') { serviceName = 'Logística & Fretes'; serviceIcon = '🚚'; }
      else if (cat === 'supermercado') { serviceName = 'Supermercados'; serviceIcon = '🛒'; }
      else if (cat === 'pecas_auto') { serviceName = 'Peças & Auto'; serviceIcon = '🚗'; }
      else if (cat === 'construcao') { serviceName = 'Construção'; serviceIcon = '🏗️'; }
      else if (cat === 'bar') { serviceName = 'Bares & Restaurantes'; serviceIcon = '🍹'; }
      else if (cat === 'hospedagem') { serviceName = 'Hotelaria & Hospedagens'; serviceIcon = '🏨'; }

      const numDiscount = parseInt((deal.discount || '').replace(/\D/g, '')) || 25;
      const promoPrice = deal.promoPriceMT || (deal.originalPriceMT ? Math.round(deal.originalPriceMT * 0.75) : 1200);
      const origPrice = deal.originalPriceMT || Math.round(promoPrice * 1.35);

      return {
        id: `deal-slide-${deal.id || dIdx}-${dIdx}`,
        serviceName,
        serviceIcon,
        title: deal.title,
        subtitle: `${deal.establishmentName || est?.name || 'Oferta Axofácil! Moçambique'} · ${deal.description || 'Preço promocional exclusivo com garantia e entrega rápida'}`,
        badge: 'OFERTA LANÇADA NA PLATAFORMA',
        discount: deal.discount || 'PROMOÇÃO',
        imageUrl: deal.imageUrl || est?.imageUrl || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=90',
        category: cat,
        simulatedProduct: {
          name: deal.title,
          promoPriceMT: promoPrice,
          originalPriceMT: origPrice,
          discountPct: numDiscount,
          unit: 'Serviço',
          details: deal.description || 'Disponível para encomenda ou reserva direta'
        }
      };
    });

    return [...MASTER_HERO_SLIDES, ...dealsSlides];
  }, [deals, establishments]);

  // Master Hero Carousel auto-rotation: 3.5 seconds, pauses smoothly on mouse hover or touch
  useEffect(() => {
    if (isHeroPaused || dynamicHeroSlides.length === 0) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % dynamicHeroSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isHeroPaused, dynamicHeroSlides.length]);

  // AGGREGATE PROMOTIONS BY SERVICE
  // "O catálogo tem que compor catálogos por serviço, não catálogos por loja... catálogos de bar, catálogos de hotelaria, serviços de lojas..."
  const serviceCatalogs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return PORTAL_SERVICES.map((srv) => {
      // Find all establishments that belong to this service
      const serviceStores = establishments.filter((est) => srv.matches(est));

      // Collect all promotional items across all stores of this service
      const allServicePromoItems: ServicePromoItem[] = [];

      serviceStores.forEach((store) => {
        const storePromoProducts = getStorePromoProducts(store);

        storePromoProducts.forEach((prod, pIdx) => {
          const origPrice = prod.priceMT;
          const promoPrice = prod.promoPriceMT || origPrice;
          const discountPct = origPrice > promoPrice ? Math.round(((origPrice - promoPrice) / origPrice) * 100) : 20;
          const savingsMT = Math.max(0, origPrice - promoPrice);
          const unitText = prod.unitLabel || (srv.id === 'supermercados' ? 'Kg' : (srv.id === 'hospedagens' ? 'Diária' : 'Un'));

          const uniqueItemId = prod.id && prod.id.startsWith(`${store.id}-`)
            ? `${prod.id}-${pIdx}`
            : `${store.id}-${prod.id || 'p'}-${pIdx}`;

          allServicePromoItems.push({
            id: uniqueItemId,
            name: prod.name,
            priceMT: origPrice,
            promoPriceMT: promoPrice,
            discountPct,
            savingsMT,
            unitLabel: unitText,
            imageUrl: prod.imageUrl || getProductFallbackImage(prod.name, prod.category || store.category),
            description: prod.description || store.promotion || `Oferta exclusiva em ${store.name}`,
            category: prod.category || store.segment || srv.shortName,
            serviceId: srv.id,
            establishment: store
          });
        });

        // Also add any deals associated with this store
        deals.forEach((deal, dIdx) => {
          if (deal.establishmentId === store.id) {
            const promoPrice = deal.promoPriceMT || (deal.originalPriceMT ? Math.round(deal.originalPriceMT * 0.75) : 1200);
            const origPrice = deal.originalPriceMT || Math.round(promoPrice * 1.35);
            const discountPct = parseInt((deal.discount || '').replace(/\D/g, '')) || 25;

            // Check if already in array
            const exists = allServicePromoItems.some((it) => it.name.toLowerCase() === deal.title.toLowerCase());
            if (!exists) {
              allServicePromoItems.push({
                id: `${store.id}-deal-${deal.id || dIdx}-${dIdx}`,
                name: deal.title,
                priceMT: origPrice,
                promoPriceMT: promoPrice,
                discountPct,
                savingsMT: Math.max(0, origPrice - promoPrice),
                unitLabel: 'Promoção',
                imageUrl: deal.imageUrl || store.imageUrl || getProductFallbackImage(deal.title, store.category),
                description: deal.description || store.promotion || 'Campanha oficial em vigor',
                category: srv.shortName,
                serviceId: srv.id,
                establishment: store,
                isDeal: true
              });
            }
          }
        });
      });

      // Filter by search query if present
      const filteredPromoItems = query
        ? allServicePromoItems.filter((item) => {
            const matchName = item.name.toLowerCase().includes(query);
            const matchDesc = item.description.toLowerCase().includes(query);
            const matchStore = item.establishment.name.toLowerCase().includes(query);
            const matchZone = (item.establishment.zone || '').toLowerCase().includes(query);
            return matchName || matchDesc || matchStore || matchZone;
          })
        : allServicePromoItems;

      // Participating stores with active promo items
      const participatingStores = serviceStores.filter((st) => 
        filteredPromoItems.some((it) => it.establishment.id === st.id)
      );

      return {
        service: srv,
        items: filteredPromoItems,
        participatingStores,
        totalItems: filteredPromoItems.length
      };
    });
  }, [establishments, deals, searchQuery]);

  // Filter service catalogs by active category tab
  const activeServiceCatalogs = useMemo(() => {
    if (selectedCategory === 'todos') {
      return serviceCatalogs.filter((cat) => cat.items.length > 0);
    }
    return serviceCatalogs.filter((cat) => cat.service.id === selectedCategory && cat.items.length > 0);
  }, [serviceCatalogs, selectedCategory]);

  const totalPromotionalArticles = useMemo(() => {
    return serviceCatalogs.reduce((acc, curr) => acc + curr.items.length, 0);
  }, [serviceCatalogs]);

  const categoryPills = [
    { id: 'todos', label: 'Todos os Serviços', count: totalPromotionalArticles, icon: '🔥' },
    { id: 'hospedagens', label: 'Hotelaria & Hospedagens', icon: '🏨' },
    { id: 'bares', label: 'Bares & Restaurantes', icon: '🍹' },
    { id: 'lojas', label: 'Lojas & Moda Baixa', icon: '🛍️' },
    { id: 'supermercados', label: 'Supermercados & Frescos', icon: '🛒' },
    { id: 'construcao', label: 'Construção & Estaleiros', icon: '🏗️' },
    { id: 'pecas_auto', label: 'Peças & Auto', icon: '🚗' },
    { id: 'turismo', label: 'Turismo & Safaris', icon: '✈️' },
    { id: 'entregadores', label: 'Entregadores & Fretes', icon: '🚚' }
  ];

  const currentHero = dynamicHeroSlides[activeSlide % dynamicHeroSlides.length] || MASTER_HERO_SLIDES[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      
      {/* Top Breadcrumb Navigation */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2">
            {onGoHome && (
              <button 
                onClick={onGoHome}
                className="hover:text-[#0B254B] font-semibold cursor-pointer transition-colors"
              >
                Início
              </button>
            )}
            <span>/</span>
            <span className="font-bold text-slate-900">Catálogos & Promoções por Serviço</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="bg-slate-100 text-[#0B254B] border border-slate-200 font-bold text-[10px] px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Flame className="w-3 h-3 text-[#0B254B]" />
              <span>{totalPromotionalArticles} Promoções em Rotação</span>
            </span>
          </div>
        </div>
      </div>

      {/* MASTER CIRCULATING HERO CAROUSEL */}
      <div className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-4 sm:pt-6">
        
        {/* Top Header Bar for Carousel */}
        <div className="flex items-center justify-between pb-2.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 font-black text-slate-900 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 text-[#0B254B]" />
              Destaques dos Serviços do Portal
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 text-[#0B254B] border border-slate-200 px-2 py-0.5 rounded-full text-[11px] font-bold">
              Catálogos por Serviço em Rotação Contínua
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 text-[11px] font-medium">
            <span className="hidden md:inline">Passe o cursor para pausar e ver detalhes</span>
          </div>
        </div>

        {/* Carousel Container - Smooth Crossfade without Stutter */}
        <div 
          className="relative rounded-2xl overflow-hidden shadow-xl min-h-[360px] sm:min-h-[420px] lg:min-h-[440px] flex items-stretch bg-slate-950 border border-slate-800"
          onMouseEnter={() => setIsHeroPaused(true)}
          onMouseLeave={() => setIsHeroPaused(false)}
          onTouchStart={() => setIsHeroPaused(true)}
          onTouchEnd={() => setIsHeroPaused(false)}
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={`hero-slide-${currentHero.id}-${activeSlide}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-stretch"
            >
              {/* Slide Background Image */}
              <img
                src={currentHero.imageUrl}
                alt={currentHero.title}
                className="w-full h-full object-cover object-center brightness-[1.05]"
              />

              {/* Gradient overlays for contrast and legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-950/50 to-slate-950/30" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/40 to-transparent max-w-3xl" />

              {/* Main Content Layout Grid */}
              <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center justify-between px-6 sm:px-10 lg:px-14 py-8 sm:py-10 gap-6">
                
                {/* Left Column: Title, Subtitle, Badges & CTA Buttons */}
                <div className="max-w-2xl flex flex-col justify-center space-y-3.5 my-auto">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="bg-[#0B254B] text-white font-black text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-xs flex items-center gap-1.5">
                      <span>{currentHero.serviceIcon}</span>
                      <span>{currentHero.badge}</span>
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-3 py-1 rounded-full border border-white/30 shadow-xs">
                      {currentHero.discount}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md text-white font-bold text-[10px] sm:text-xs px-2.5 py-1 rounded-full border border-white/20 shadow-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      {currentHero.serviceName}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-serif font-black text-white leading-tight tracking-tight drop-shadow-md">
                    {currentHero.title}
                  </h1>

                  <p className="text-xs sm:text-sm md:text-base text-slate-200 leading-relaxed font-medium line-clamp-2 drop-shadow-sm max-w-xl">
                    {currentHero.subtitle}
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory(currentHero.category);
                        const el = document.getElementById('catalogos-servicos-section');
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="py-3 px-5 sm:px-6 bg-[#0B254B] hover:bg-[#061833] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <span>Ver Catálogo de {currentHero.serviceName}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onAddPromotion('loja')}
                      className="py-3 px-4 sm:px-5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-4 h-4 text-slate-700" />
                      <span>Anunciar Promoção</span>
                    </button>
                  </div>
                </div>

                {/* Right Column: Floating Interactive Card */}
                {currentHero.simulatedProduct && (
                  <div className="hidden lg:flex shrink-0 w-80 bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/40 flex-col gap-3 my-auto">
                    <div className="relative h-36 rounded-xl overflow-hidden bg-slate-100">
                      <img
                        src={currentHero.imageUrl}
                        alt={currentHero.simulatedProduct.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 bg-[#0B254B] text-white font-black text-[10px] px-2 py-0.5 rounded shadow-xs">
                        -{currentHero.simulatedProduct.discountPct}% OFF
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                          <span>{currentHero.serviceIcon}</span>
                          <span className="truncate">{currentHero.serviceName}</span>
                        </span>
                        <span className="bg-[#0B254B] text-white text-[10px] font-black px-2 py-0.5 rounded">
                          {currentHero.discount}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">
                          Artigo em Promoção
                        </span>
                        <h3 className="font-serif font-black text-sm sm:text-base text-slate-900 leading-snug">
                          {currentHero.simulatedProduct.name}
                        </h3>
                        {currentHero.simulatedProduct.details && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5">
                            {currentHero.simulatedProduct.details}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <span className="text-xs text-slate-400 line-through mr-2 font-medium">
                            {currentHero.simulatedProduct.originalPriceMT.toLocaleString()} MT
                          </span>
                          <span className="font-serif font-black text-lg sm:text-xl text-[#0B254B]">
                            {currentHero.simulatedProduct.promoPriceMT.toLocaleString()} MT
                          </span>
                          {currentHero.simulatedProduct.unit && (
                            <span className="text-[11px] text-slate-500 ml-1">
                              /{currentHero.simulatedProduct.unit}
                            </span>
                          )}
                        </div>

                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
                          Poupe {(currentHero.simulatedProduct.originalPriceMT - currentHero.simulatedProduct.promoPriceMT).toLocaleString()} MT
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                        <span className="flex items-center gap-1.5 font-bold text-[#0B254B]">
                          <span className="w-2 h-2 rounded-full bg-[#0B254B]" />
                          Promoção Verificada
                        </span>
                        <span className="font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          IVA 16% Inc.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </motion.div>
          </AnimatePresence>

          {/* Linear Progress Bar at bottom */}
          <div className="absolute bottom-0 inset-x-0 h-1 bg-white/20 z-20 overflow-hidden">
            <motion.div
              key={`progress-bar-${activeSlide}-${isHeroPaused}`}
              initial={{ width: '0%' }}
              animate={{ width: isHeroPaused ? '0%' : '100%' }}
              transition={{ duration: 3.5, ease: 'linear' }}
              className="h-full bg-white/80"
            />
          </div>

          {/* Left Hero Arrow */}
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === 0 ? dynamicHeroSlides.length - 1 : prev - 1))}
            className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-colors border border-white/20 cursor-pointer"
            aria-label="Slide anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Right Hero Arrow */}
          <button
            type="button"
            onClick={() => setActiveSlide((prev) => (prev === dynamicHeroSlides.length - 1 ? 0 : prev + 1))}
            className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-md transition-colors border border-white/20 cursor-pointer"
            aria-label="Próximo slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 inset-x-0 z-20 flex items-center justify-center gap-1.5">
            {dynamicHeroSlides.slice(0, 8).map((_, dotIdx) => (
              <button
                key={`hero-dot-${dotIdx}`}
                type="button"
                onClick={() => setActiveSlide(dotIdx)}
                className={`h-1.5 rounded-full transition-all cursor-pointer ${
                  dotIdx === activeSlide % 8
                    ? 'w-6 bg-white' 
                    : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
                aria-label={`Ir para destaque ${dotIdx + 1}`}
              />
            ))}
          </div>

        </div>

        {/* Quick Service Category Jump Pills under the Carousel */}
        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap hidden sm:inline">
            Serviços em Destaque:
          </span>
          {MASTER_HERO_SLIDES.map((slide, sIdx) => {
            const isCurrent = dynamicHeroSlides[activeSlide % dynamicHeroSlides.length]?.id === slide.id;
            return (
              <button
                key={`service-shortcut-${slide.id}-${sIdx}`}
                type="button"
                onClick={() => {
                  const targetIdx = dynamicHeroSlides.findIndex((s) => s.id === slide.id);
                  if (targetIdx !== -1) setActiveSlide(targetIdx);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  isCurrent
                    ? 'bg-[#0B254B] text-white shadow-xs border border-[#0B254B]'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{slide.serviceIcon}</span>
                <span>{slide.serviceName}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* FILTER CONTROLS & SEARCH SECTION: CATÁLOGOS POR SERVIÇO */}
      <div id="catalogos-servicos-section" className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-8">
        
        {/* Section Heading: Catálogos por Serviço */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 bg-slate-100 text-[#0B254B] rounded-lg">
                <Layers className="w-4 h-4" />
              </span>
              <h2 className="font-serif font-black text-xl sm:text-2xl text-slate-900">
                Catálogos & Promoções por Serviço
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
              Catálogos agrupados exclusivamente por serviço (Hotelaria, Bares, Lojas, Supermercados, Construção, Peças Auto, Turismo e Entregadores). Todas as ofertas em circulação suave, fluida e natural.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar por serviço, artigo ou loja..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0B254B] shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Category Pills: Serviços */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categoryPills.map((pill, idx) => {
            const isActive = selectedCategory === pill.id;
            return (
              <button
                key={`service-pill-${pill.id}-${idx}`}
                type="button"
                onClick={() => setSelectedCategory(pill.id)}
                className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  isActive 
                    ? 'bg-[#0B254B] text-white shadow-xs' 
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                <span>{pill.icon}</span>
                <span>{pill.label}</span>
                {pill.count !== undefined && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {pill.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 font-medium">
          <span>
            A mostrar <strong>{activeServiceCatalogs.length}</strong> {activeServiceCatalogs.length === 1 ? 'catálogo de serviço ativo' : 'catálogos de serviços ativos'}
          </span>
          <span className="text-[#0B254B] font-bold">
            Total de {totalPromotionalArticles} artigos promocionais agregados
          </span>
        </div>
      </div>

      {/* SERVICE PROMO CAROUSELS SHOWCASE */}
      <div className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-6 space-y-8">
        {activeServiceCatalogs.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 max-w-md mx-auto my-8 shadow-xs">
            <div className="w-14 h-14 bg-slate-100 text-[#0B254B] rounded-xl flex items-center justify-center mx-auto text-2xl">
              🏷️
            </div>
            <h3 className="font-bold text-lg text-slate-900">Nenhum serviço encontrado</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Não encontramos promoções ativas para os filtros ou pesquisa selecionados. Experimente limpar a pesquisa ou selecionar "Todos os Serviços".
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('todos');
                setSearchQuery('');
              }}
              className="py-2.5 px-5 bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
            >
              Ver Todos os Serviços em Promoção
            </button>
          </div>
        ) : (
          activeServiceCatalogs.map((catalog, index) => (
            <ServicePromoCarousel
              key={`service-catalog-${catalog.service.id}-${index}`}
              serviceId={catalog.service.id}
              serviceName={catalog.service.name}
              serviceIcon={catalog.service.icon}
              serviceBadge={catalog.service.badge}
              description={catalog.service.description}
              portalTargetPage={catalog.service.portalTargetPage}
              items={catalog.items}
              participatingStores={catalog.participatingStores}
              onSelectEstablishment={onSelectEstablishment}
              currentUser={currentUser}
              onAddToCart={onAddToCart}
              setActivePage={setActivePage}
              staggerIndex={index}
            />
          ))
        )}
      </div>

      {/* BOTTOM MERCHANT / SERVICE PROVIDER CTA */}
      <div className="px-3 sm:px-6 lg:px-8 max-w-7xl mx-auto pt-14">
        <div className="bg-[#0B254B] text-white rounded-2xl p-6 sm:p-10 shadow-lg border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <span className="bg-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/25">
              Para Prestadores de Serviços, Hotéis, Bares & Comerciantes
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black font-serif">
              Pretende incluir as ofertas do seu serviço nos catálogos em rotação?
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 max-w-xl">
              Publique tarifas promocionais de hotelaria, combos de bar, descontos em materiais de construção, peças ou fretes para alcançar milhares de clientes em Moçambique.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onAddPromotion('loja')}
            className="py-3.5 px-6 bg-white hover:bg-slate-100 text-[#0B254B] font-extrabold text-xs sm:text-sm rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4 text-[#0B254B]" />
            <span>Publicar Promoção no Catálogo</span>
          </button>
        </div>
      </div>

    </div>
  );
}
