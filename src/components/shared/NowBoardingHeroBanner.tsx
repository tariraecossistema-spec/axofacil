import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Compass, ShoppingBag, BedDouble, GlassWater, ShoppingCart, 
  Hammer, Truck, Sparkles, Send, Wrench, ChevronLeft, ChevronRight, Home, Flame 
} from 'lucide-react';
import { loadBannerConfig, BannerMenuConfig } from "../../services/bannerConfig";

interface NowBoardingHeroBannerProps {
  bannerTitle?: string;
  bannerTag?: string;
  bannerSlogan?: string;
  pageTitle?: string;
  pageSubtitle?: string;
  category?: string;
  slides?: Array<{ url: string; caption?: string }>;
  onInquireClick?: () => void;
  onPromoClick?: () => void;
  bgImageUrl?: string;
  heightClass?: string;
  onSelectCategory?: (category: string) => void;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  breadcrumbTitle?: string;
  showNavControls?: boolean;
  showServiceTags?: boolean;
  isLandingPage?: boolean;
  showPromoButton?: boolean;
  children?: React.ReactNode;
}

// Configurações personalizadas de título, etiqueta e slogan para cada menu/página
interface CategoryBannerConfig {
  title: string;
  tag: string;
  slogan: string;
}

const CATEGORY_BANNER_CONFIGS: Record<string, CategoryBannerConfig> = {
  turismo: {
    title: 'TURISMO E LOGÍSTICA',
    tag: 'MOÇAMBIQUE',
    slogan: 'Ponta do Ouro, Inhaca, Ilha de Moçambique, Bazaruto, Bilene, Safaris & Logística'
  },
  lojas: {
    title: 'LOJAS & BOUTIQUES',
    tag: 'MAPUTO & MOÇAMBIQUE',
    slogan: 'Baixa de Maputo, Moda, Capulanas Tradicionais, Calçado, Smartphones & Gadgets'
  },
  pecas_auto: {
    title: 'PEÇAS AUTO & OFICINAS',
    tag: 'TOYOTA · MAHINDRA · NISSAN',
    slogan: 'Toyota Hilux, Land Cruiser, Mahindra Pik Up, Suspensão 4x4, Travões, Embraiagens, Filtros & Baterias'
  },
  supermercados: {
    title: 'SUPERMERCADOS',
    tag: 'ATACADO & RETALHO',
    slogan: 'Supermercados, Frescos, Mariscos da Costa, Mercearia & Compras do Dia a Dia em Moçambique'
  },
  bares: {
    title: 'BARES & RESTAURAÇÃO',
    tag: 'GASTRONOMIA & LAZER',
    slogan: 'Gastronomia Moçambicana, Mariscos, Lounges, Esplanadas & Música ao Vivo'
  },
  hospedagens: {
    title: 'HOSPEDAGENS & LODGES',
    tag: 'HOTÉIS & POUSADAS',
    slogan: 'Hotéis Executivos, Lodges de Praia, Pousadas & Resorts em Todo Moçambique'
  },
  construcao: {
    title: 'MATERIAL DE CONSTRUÇÃO',
    tag: 'ESTALEIROS & OBRAS',
    slogan: 'Estaleiros, Cimento Nacional, Areia, Brita, Ferragens & Ferro para a Sua Obra'
  },
  entregadores: {
    title: 'ENTREGADORES & FRETES',
    tag: 'LOGÍSTICA EXPRESS',
    slogan: 'Estafetas, Carrinhas de Carga, Fretes & Distribuição Rápida em Moçambique'
  },
  segmentos: {
    title: 'ESCOLHER SEGMENTO',
    tag: 'DIRECTÓRIO',
    slogan: 'Explore e selecione a categoria de lojas e serviços desejada em Moçambique'
  }
};

// 1. Imagens de referência de TODAS as Lojas e Serviços do Portal (Landing Page)
const ALL_PORTAL_SERVICES_SLIDES = [
  {
    url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85',
    caption: 'Ponta do Ouro & Praias Paradisíacas de Moçambique'
  },
  {
    url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2000&q=85',
    caption: 'Auto Peças Toyota (Hilux, Land Cruiser) & Mahindra Pik Up'
  },
  {
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
    caption: 'Ilha de Inhaca & Arquipélago do Bazaruto'
  },
  {
    url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
    caption: 'Hotéis Panorâmicos na Marginal de Maputo & Lodges de Praia'
  },
  {
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=85',
    caption: 'Comércio, Moda e Boutiques na Baixa de Maputo'
  },
  {
    url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=2000&q=85',
    caption: 'Bares & Restaurantes na Costa do Sol de Maputo'
  },
  {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2000&q=85',
    caption: 'Estaleiros de Material de Construção em Maputo & Matola'
  },
  {
    url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=2000&q=85',
    caption: 'Logística Express & Entregas Porta-a-Porta em Moçambique'
  }
];

// 2. Imagens específicas por Menu / Serviço com Destaques Genuínos de Moçambique
const CATEGORY_SLIDES_MAP: Record<string, Array<{ url: string; caption?: string }>> = {
  pecas_auto: [
    {
      url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2000&q=85',
      caption: 'Toyota Hilux & Land Cruiser (Prado / Série 79) — Peças de Suspensão 4x4'
    },
    {
      url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=2000&q=85',
      caption: 'Mahindra Pik Up 4x4, Scorpio & Bolero — Kits de Embraiagem & Peças de Motor'
    },
    {
      url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=2000&q=85',
      caption: 'Toyota HiAce (Chapa 100) & Corolla — Pastilhas de Travão & Discos Ventilados'
    },
    {
      url: 'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=2000&q=85',
      caption: 'Pneus All-Terrain Todo-Terreno (BFGoodrich, Maxxis) & Jantes Especiais'
    },
    {
      url: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=2000&q=85',
      caption: 'Filtros de Gasóleo/Ar Mann & Donaldson para Estradas de Moçambique'
    },
    {
      url: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=2000&q=85',
      caption: 'Baterias Reforçadas Tropicais 12V Willard & Dixon com Garantia'
    }
  ],
  turismo: [
    {
      url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85',
      caption: 'Ponta do Ouro & Ponta Malongane — Mergulho, Golfinhos & Dunas'
    },
    {
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=85',
      caption: 'Ilha de Inhaca & Santa Maria — Baía de Maputo com Águas Cristalinas'
    },
    {
      url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=2000&q=85',
      caption: 'Ilha de Moçambique (Património Mundial UNESCO) & Fortaleza Colonial'
    },
    {
      url: 'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=2000&q=85',
      caption: 'Arquipélago do Bazaruto & Vilankulo — Praias Paradisíacas de Moçambique'
    },
    {
      url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=2000&q=85',
      caption: 'Reserva Especial de Maputo & Gorongosa — Safaris e Fauna Africana'
    },
    {
      url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2000&q=85',
      caption: 'Logística Integrada de Turismo & Bilhetes de Voos Nacionais'
    }
  ],
  hospedagens: [
    {
      url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
      caption: 'Hotéis Panorâmicos na Marginal de Maputo com Vista para a Baía'
    },
    {
      url: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=2000&q=85',
      caption: 'Lodges Costeiros e Resorts de Luxo em Ponta do Ouro & Inhaca'
    },
    {
      url: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=2000&q=85',
      caption: 'Vilas Paradisíacas à Beira-Mar em Vilankulo e Bazaruto'
    },
    {
      url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=2000&q=85',
      caption: 'Pousadas e Quartos Executivos na Polana & Sommerschield'
    }
  ],
  bares: [
    {
      url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=2000&q=85',
      caption: 'Esplanadas da Costa do Sol & Marginal de Maputo'
    },
    {
      url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?auto=format&fit=crop&w=2000&q=85',
      caption: 'Lounges Modernos na Polana com Cocktails e Marisco Nacional'
    },
    {
      url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=2000&q=85',
      caption: 'Sunset na Baía de Maputo com Cerveja 2M e Laurentina Gelada'
    },
    {
      url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=85',
      caption: 'Restaurantes Tradicionais com Música ao Vivo e Noites Tropicais'
    }
  ],
  supermercados: [
    {
      url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=2000&q=85',
      caption: 'Grandes Superfícies & Supermercados em Maputo e Matola'
    },
    {
      url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=2000&q=85',
      caption: 'Peixe Fresco, Camarão de Moçambique e Mariscos Selecionados'
    },
    {
      url: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=2000&q=85',
      caption: 'Hortifrúti e Frutas Tropicais Frescas (Manga, Papaia e Coco)'
    },
    {
      url: 'https://images.unsplash.com/photo-1534723452862-4c874018d66d?auto=format&fit=crop&w=2000&q=85',
      caption: 'Compras a Grosso e a Retalho de Produtos Essenciais'
    }
  ],
  lojas: [
    {
      url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=85',
      caption: 'Boutiques de Moda & Comércio na Baixa de Maputo'
    },
    {
      url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=2000&q=85',
      caption: 'Capulanas Tradicionais Moçambicanas & Moda Africana'
    },
    {
      url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=2000&q=85',
      caption: 'Smartphones, Acessórios e Lojas Tecnológicas em Maputo'
    },
    {
      url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=2000&q=85',
      caption: 'Sapatarias e Artigos Importados com Entrega ao Domicílio'
    }
  ],
  construcao: [
    {
      url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2000&q=85',
      caption: 'Estaleiros de Obras em Maputo e Matola — Cimento Nacional'
    },
    {
      url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=2000&q=85',
      caption: 'Areia do Rio Incomáti, Brita, Varão de Aço & Tubagens'
    },
    {
      url: 'https://images.unsplash.com/photo-1590069261209-f8e9b8642343?auto=format&fit=crop&w=2000&q=85',
      caption: 'Blocos de Cimento, Tintas Tropicais & Ferramentas Pesadas'
    }
  ],
  entregadores: [
    {
      url: 'https://images.unsplash.com/photo-1526367790999-0150786686a2?auto=format&fit=crop&w=2000&q=85',
      caption: 'Estafetas Moto-Boy & Entregas Rápidas em Maputo e Matola'
    },
    {
      url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=2000&q=85',
      caption: 'Carrinhas de Frete de Cargas & Distribuição de Encomendas'
    },
    {
      url: 'https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&w=2000&q=85',
      caption: 'Táxis Urbanos e Transporte de Mercadorias com Rastreio GPS'
    }
  ]
};

// Resolver os slides adequados com base na categoria ou no título da página
function resolveBannerSlides(
  explicitCategory?: string,
  customSlides?: Array<{ url: string; caption?: string }>,
  pageTitle?: string
): Array<{ url: string; caption?: string }> {
  if (customSlides && customSlides.length > 0) return customSlides;

  const catKey = explicitCategory?.toLowerCase() || '';
  if (catKey && CATEGORY_SLIDES_MAP[catKey]) {
    return CATEGORY_SLIDES_MAP[catKey];
  }

  // Auto-detecção inteligente caso category não seja explicitamente enviada
  const title = (pageTitle || '').toLowerCase();
  if (title.includes('peça') || title.includes('auto')) return CATEGORY_SLIDES_MAP.pecas_auto;
  if (title.includes('turismo') || title.includes('viagen') || title.includes('roteiro')) return CATEGORY_SLIDES_MAP.turismo;
  if (title.includes('hospedagem') || title.includes('hotel') || title.includes('lodge')) return CATEGORY_SLIDES_MAP.hospedagens;
  if (title.includes('supermercado')) return CATEGORY_SLIDES_MAP.supermercados;
  if (title.includes('bar') || title.includes('noite') || title.includes('restaurante')) return CATEGORY_SLIDES_MAP.bares;
  if (title.includes('construç') || title.includes('obra')) return CATEGORY_SLIDES_MAP.construcao;
  if (title.includes('entrega') || title.includes('estafeta') || title.includes('frete') || title.includes('logística')) return CATEGORY_SLIDES_MAP.entregadores;
  if (title.includes('loja') || title.includes('boutique') || title.includes('comércio')) return CATEGORY_SLIDES_MAP.lojas;

  // Por padrão (Landing Page), mostra imagens de todos os serviços do portal
  return ALL_PORTAL_SERVICES_SLIDES;
}

const SERVICE_TAGS = [
  { id: 'turismo', label: 'Turismo & Viagens', icon: Compass, page: 'turismo' },
  { id: 'lojas', label: 'Lojas & Serviços', icon: ShoppingBag, page: 'lojas' },
  { id: 'pecas', label: 'Peças & Auto', icon: Wrench, page: 'lojas', filter: 'pecas_auto' },
  { id: 'hospedagens', label: 'Hotéis & Lodges', icon: BedDouble, page: 'hospedagens' },
  { id: 'supermercados', label: 'Supermercados', icon: ShoppingCart, page: 'supermercados' },
  { id: 'bares', label: 'Bares & Restaurantes', icon: GlassWater, page: 'bares' },
  { id: 'construcao', label: 'Materiais de Construções', icon: Hammer, page: 'construcao' },
  { id: 'entregadores', label: 'Entregadores Express', icon: Truck, page: 'entregadores' },
];

export default function NowBoardingHeroBanner({
  bannerTitle,
  bannerTag,
  bannerSlogan,
  pageTitle,
  pageSubtitle,
  category,
  slides,
  onInquireClick,
  onPromoClick,
  bgImageUrl,
  heightClass = 'min-h-[460px] sm:min-h-[520px] lg:min-h-[580px]',
  onSelectCategory,
  onNavigate,
  canGoBack = false,
  onGoBack,
  onGoHome,
  breadcrumbTitle,
  showNavControls = true,
  showServiceTags,
  isLandingPage: propIsLandingPage,
  showPromoButton,
  children
}: NowBoardingHeroBannerProps) {
  const catKey = (category || '').toLowerCase().trim();
  const isLandingPage = propIsLandingPage !== undefined
    ? propIsLandingPage
    : (!category || category === 'landing' || category === 'home' || category === 'general');
  const effectiveMenuKey = isLandingPage ? 'landing' : catKey;
  // User directive: O botão promoções, catálogos e ofertas deve aparecer APENAS no banner da landing page!
  const shouldDisplayPromoButton = showPromoButton !== undefined 
    ? showPromoButton 
    : isLandingPage;

  const [customMenuConfig, setCustomMenuConfig] = useState<BannerMenuConfig>(() => loadBannerConfig(effectiveMenuKey));
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    setCustomMenuConfig(loadBannerConfig(effectiveMenuKey));
    const handleUpdate = () => {
      setCustomMenuConfig(loadBannerConfig(effectiveMenuKey));
    };
    window.addEventListener('axofacil_banners_updated', handleUpdate);
    return () => window.removeEventListener('axofacil_banners_updated', handleUpdate);
  }, [effectiveMenuKey]);

  const activeSlides = (slides && slides.length > 0)
    ? slides
    : (customMenuConfig.slides && customMenuConfig.slides.length > 0)
    ? customMenuConfig.slides
    : resolveBannerSlides(category, slides, pageTitle);
  
  // Decide whether to show the quick service buttons:
  // On landing page (or if explicitly enabled), show service buttons.
  // On specific service pages, eliminate other service buttons and keep only "Consulta Online".
  const shouldShowServiceTags = showServiceTags !== undefined ? showServiceTags : isLandingPage;

  // Resolve banner title, badge tag and slogan
  const categoryConfig = CATEGORY_BANNER_CONFIGS[catKey];

  let displayTitle = bannerTitle || customMenuConfig?.title;
  let displayTag = bannerTag || customMenuConfig?.tag;
  let displaySlogan = bannerSlogan || customMenuConfig?.slogan;

  if (!displayTitle) {
    if (categoryConfig) {
      displayTitle = categoryConfig.title;
      displayTag = displayTag || categoryConfig.tag;
      displaySlogan = displaySlogan || categoryConfig.slogan;
    } else if (!isLandingPage && pageTitle) {
      displayTitle = pageTitle.toUpperCase();
      displayTag = displayTag || 'MOÇAMBIQUE';
      displaySlogan = displaySlogan || pageSubtitle || 'Portal Axofácil! Moçambique';
    } else {
      displayTitle = 'AXOFÁCIL!';
      displayTag = displayTag || 'MOÇAMBIQUE';
      displaySlogan = displaySlogan || 'Directório de Comércio, Serviços e Logística em Maputo e Matola';
    }
  } else {
    if (!displayTag) displayTag = categoryConfig?.tag || customMenuConfig?.defaultTag || 'MOÇAMBIQUE';
    if (!displaySlogan) displaySlogan = categoryConfig?.slogan || customMenuConfig?.defaultSlogan || pageSubtitle || 'Portal Axofácil! Moçambique';
  }

  // Calculate typography scale based on character length so longer titles look elegant & readable
  const getTitleSizeClasses = (titleText: string) => {
    const len = titleText.length;
    if (len > 18) {
      return "text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight leading-tight";
    }
    if (len > 10) {
      return "text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight leading-tight";
    }
    if (len > 6) {
      return "text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight leading-none";
    }
    return "text-5xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tight leading-none";
  };

  // Reset slide index when slides change
  useEffect(() => {
    setCurrentSlide(0);
  }, [category, pageTitle]);

  // Troca suave e periódica das imagens de fundo que mostram os serviços adequados
  useEffect(() => {
    if (bgImageUrl || activeSlides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [bgImageUrl, activeSlides.length]);

  const handleTagClick = (service: typeof SERVICE_TAGS[0]) => {
    if (onNavigate) {
      onNavigate(service.page, service.filter);
    } else if (onSelectCategory) {
      onSelectCategory(service.id);
    }
  };

  return (
    <section className={`relative w-full overflow-hidden ${heightClass} flex flex-col justify-between items-center text-white px-3 sm:px-6 lg:px-8 shadow-2xl border-b border-white/10`}>
      
      {/* Background Image Carousel with Cinematic Fade & Ken-Burns Zoom Animation */}
      {bgImageUrl ? (
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transform scale-105 transition-transform duration-1000"
          style={{ backgroundImage: `url(${bgImageUrl})` }}
        />
      ) : (
        activeSlides.map((slide, index) => (
          <motion.div
            key={`${slide.url}-${index}`}
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ 
              opacity: index === currentSlide ? 1 : 0,
              scale: index === currentSlide ? 1 : 1.08
            }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${slide.url})` }}
          />
        ))
      )}

      {/* Atmospheric Twilight & Vignette Overlays for Maximum Contrast & Luxury Appeal */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-indigo-950/40 to-slate-950/80 pointer-events-none" />
      <div className="absolute inset-0 bg-black/35 pointer-events-none" />

      {/* Floating Top Navigation Overlay directly ON TOP of the Banner Image (Início / Voltar Atrás) */}
      {showNavControls && (onGoHome || (canGoBack && onGoBack)) && (
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between pt-3 sm:pt-5 z-20">
          <div className="flex items-center gap-2 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/20 text-xs text-white/90 shadow-lg transition-all">
            {onGoHome && (
              <button 
                onClick={onGoHome} 
                className="flex items-center gap-1.5 font-bold hover:text-white transition-colors cursor-pointer"
                title="Ir para a página inicial"
              >
                <Home className="w-3.5 h-3.5 text-white" />
                <span>Início</span>
              </button>
            )}
            {(breadcrumbTitle || pageTitle) && (
              <>
                <span className="text-white/40">/</span>
                <span className="text-white font-semibold truncate max-w-[140px] sm:max-w-[260px]">
                  {breadcrumbTitle || pageTitle}
                </span>
              </>
            )}
          </div>

          {canGoBack && onGoBack && (
            <button
              onClick={onGoBack}
              className="flex items-center gap-1.5 bg-black/40 hover:bg-black/60 backdrop-blur-md px-3 sm:px-4 py-1.5 rounded-full border border-white/20 text-xs font-bold text-white shadow-lg transition-all hover:-translate-x-0.5 cursor-pointer"
              title="Voltar à tela anterior"
            >
              <ChevronLeft className="w-4 h-4 text-white" />
              <span>Voltar atrás</span>
            </button>
          )}
        </div>
      )}

      {/* Content Centerpiece */}
      <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center justify-center text-center space-y-5 sm:space-y-7 py-8 sm:py-12 my-auto">
        
        {/* Main Display Branding (AXOFACIL na Landing Page ou Nome do Menu nas páginas dos serviços) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center justify-center select-none"
        >
          <div className="relative inline-flex flex-col items-center max-w-4xl">
            
            {/* Main Display Title & Badge Tag */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
              <h1 className={`text-white font-black font-sans drop-shadow-2xl text-center ${getTitleSizeClasses(displayTitle)}`}>
                {displayTitle}
              </h1>
              {displayTag && (
                <span className="bg-[#0B254B] text-white text-[11px] sm:text-xs md:text-sm font-extrabold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl uppercase tracking-widest shadow-xl border border-white/30 shrink-0">
                  {displayTag}
                </span>
              )}
            </div>
            
            {displaySlogan && (
              <p className="text-paper/90 text-xs sm:text-sm md:text-base lg:text-lg font-medium tracking-wide max-w-2xl mt-2 drop-shadow-md text-center">
                {displaySlogan}
              </p>
            )}
          </div>
        </motion.div>

        {/* Quick Multi-Service Highlights: APENAS na Landing Page */}
        {shouldShowServiceTags && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5 max-w-4xl"
          >
            {SERVICE_TAGS.map((service, sIdx) => {
              const Icon = service.icon;
              return (
                <button
                  key={`hero-srv-tag-${service.id}-${sIdx}`}
                  onClick={() => handleTagClick(service)}
                  className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white/15 hover:bg-[#0B254B] hover:text-white backdrop-blur-md rounded-full text-[11px] sm:text-xs font-bold text-white border border-white/20 hover:border-[#0B254B] transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                  title={`Ir para ${service.label}`}
                >
                  <Icon className="w-3.5 h-3.5 text-white" />
                  <span>{service.label}</span>
                </button>
              );
            })}
          </motion.div>
        )}

        {/* Buttons Deck: [ CONSULTA ONLINE ] & [ PROMOÇÕES ] */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="flex flex-col items-center justify-center gap-3 pt-1 w-full"
        >
          {/* 1. Main Consulta Online Button */}
          <button 
            id="hero-consulta-online-btn"
            onClick={() => {
              if (onInquireClick) {
                onInquireClick();
              } else {
                const el = document.getElementById('search-section') || document.getElementById('content-start') || document.getElementById('estabelecimentos-grid') || document.getElementById('filtros-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="border border-white/30 hover:border-white text-white uppercase text-xs sm:text-sm tracking-widest px-6 sm:px-10 py-2.5 sm:py-3 bg-[#0B254B] hover:bg-[#061833] backdrop-blur-md transition-all font-bold cursor-pointer shadow-xl hover:scale-105 active:scale-95 rounded-xl flex items-center gap-2"
          >
            <Send className="w-4 h-4 text-white" />
            <span>CONSULTA ONLINE</span>
          </button>

          {/* 2. Destaque Especial: Botão PROMOÇÕES (APENAS NA LANDING PAGE) */}
          {shouldDisplayPromoButton && (
            <div className="relative inline-flex items-center justify-center group">
              {/* Subtle Ambient Backing Glow */}
              <div className="absolute -inset-1 rounded-2xl bg-blue-500/25 blur-md opacity-70 group-hover:opacity-100 transition-opacity pointer-events-none" />

              {/* SVG Circuit Path: Traveling highlight beam circulating around the button */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-20"
                style={{ padding: '1px' }}
              >
                {/* Static subtle guide border in soft blue */}
                <rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  rx="16"
                  fill="none"
                  stroke="rgba(11, 37, 75, 0.25)"
                  strokeWidth="2"
                />
                {/* Circulating Intermittent Beam in Blue */}
                <motion.rect
                  x="2"
                  y="2"
                  width="calc(100% - 4px)"
                  height="calc(100% - 4px)"
                  rx="16"
                  fill="none"
                  stroke="#0B254B"
                  strokeWidth="3"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray="28 72"
                  animate={{
                    strokeDashoffset: [0, -100],
                    opacity: [1, 1, 0.95, 0.45, 0.95, 1],
                  }}
                  transition={{
                    strokeDashoffset: {
                      duration: 3,
                      repeat: Infinity,
                      ease: "linear",
                    },
                    opacity: {
                      duration: 3,
                      repeat: Infinity,
                      times: [0, 0.45, 0.7, 0.82, 0.92, 1],
                      ease: "easeInOut",
                    }
                  }}
                  style={{
                    filter: 'drop-shadow(0 0 6px rgba(11, 37, 75, 0.85)) drop-shadow(0 0 10px rgba(37, 99, 235, 0.6))',
                  }}
                />
              </svg>

              {/* The Clickable Promoções Button: Fundo Branco com Contraste e Feixe Azul */}
              <button
                id="hero-promocoes-btn"
                onClick={() => {
                  if (onPromoClick) {
                    onPromoClick();
                  } else if (onNavigate) {
                    onNavigate('promocoes');
                  } else {
                    const el = document.getElementById('promocoes-section') || document.getElementById('search-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="relative z-10 flex items-center gap-2.5 px-6 sm:px-8 py-2.5 sm:py-3 rounded-2xl bg-white hover:bg-slate-50 text-[#0B254B] border-2 border-blue-200/90 font-black uppercase text-xs sm:text-sm tracking-wider shadow-2xl cursor-pointer transition-all hover:scale-105 active:scale-95"
                title="Aceder às Promoções e Descontos Exclusivos em Moçambique"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0B254B] opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#0B254B]" />
                </span>
                <Flame className="w-4 h-4 text-[#0B254B]" />
                <span className="font-sans font-black tracking-widest text-[#0B254B]">
                  PROMOÇÕES
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#0B254B] text-white ml-0.5 shadow-xs">
                  Catálogo & Ofertas
                </span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Optional Slot (Search Console / Quick Filters / Sub-elements) */}
        {children && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="w-full pt-4"
          >
            {children}
          </motion.div>
        )}

      </div>

      {/* Bottom Carousel Indicator & Caption Deck for Mozambique Highlights & Auto Carousels */}
      {activeSlides.length > 1 && !bgImageUrl && (
        <div className="w-full max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 pb-3 pt-1 z-20 text-xs">
          
          {/* Active Slide Caption Badge */}
          {activeSlides[currentSlide]?.caption && (
            <motion.div
              key={`caption-${currentSlide}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/55 backdrop-blur-md border border-white/20 text-white px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs font-semibold flex items-center gap-2 shadow-lg max-w-full truncate"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping shrink-0" />
              <span className="truncate">{activeSlides[currentSlide].caption}</span>
            </motion.div>
          )}

          {/* Navigation Dots and Next/Prev Controls */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/15">
            <button
              onClick={() => setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length)}
              className="p-1 hover:text-blue-300 text-white/80 transition-colors cursor-pointer"
              title="Slide anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex items-center gap-1.5 px-1">
              {activeSlides.map((_, idx) => (
                <button
                  key={`dot-${idx}`}
                  onClick={() => setCurrentSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentSlide
                      ? 'w-6 bg-white'
                      : 'w-1.5 bg-white/40 hover:bg-white/70'
                  }`}
                  title={`Ver imagem ${idx + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentSlide((prev) => (prev + 1) % activeSlides.length)}
              className="p-1 hover:text-blue-300 text-white/80 transition-colors cursor-pointer"
              title="Próximo slide"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Bottom subtle spacer */}
      <div className="w-full h-1"></div>
    </section>
  );
}
