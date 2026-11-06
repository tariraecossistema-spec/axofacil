export interface BannerSlide {
  url: string;
  caption?: string;
}

export interface BannerMenuConfig {
  menuKey: string;
  menuLabel: string;
  title: string;
  tag: string;
  slogan: string;
  slides: BannerSlide[];
  defaultTitle: string;
  defaultTag: string;
  defaultSlogan: string;
}

export const DEFAULT_BANNER_CONFIGS: Record<string, BannerMenuConfig> = {
  landing: {
    menuKey: 'landing',
    menuLabel: 'Início (Landing Page)',
    title: 'AXOFÁCIL!',
    tag: 'MOÇAMBIQUE',
    slogan: 'Directório de Comércio, Serviços e Logística em Maputo e Matola',
    defaultTitle: 'AXOFÁCIL!',
    defaultTag: 'MOÇAMBIQUE',
    defaultSlogan: 'Directório de Comércio, Serviços e Logística em Maputo e Matola',
    slides: [
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
        caption: 'Ilha de Inhaca, Santa Maria & Arquipélago do Bazaruto'
      },
      {
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=85',
        caption: 'Hotéis Panorâmicos na Marginal de Maputo & Lodges de Praia'
      },
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=85',
        caption: 'Comércio, Boutiques e Capulanas Tradicionais na Baixa de Maputo'
      },
      {
        url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=2000&q=85',
        caption: 'Bares & Restaurantes na Costa do Sol com Camarão Nacional & 2M'
      },
      {
        url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=2000&q=85',
        caption: 'Estaleiros de Material de Construção em Maputo & Matola'
      },
      {
        url: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=2000&q=85',
        caption: 'Logística Express & Entregas Porta-a-Porta em Moçambique'
      }
    ]
  },
  turismo: {
    menuKey: 'turismo',
    menuLabel: 'Turismo e Logística',
    title: 'TURISMO E LOGÍSTICA',
    tag: 'MOÇAMBIQUE',
    slogan: 'Ponta do Ouro, Inhaca, Ilha de Moçambique, Bazaruto, Bilene, Safaris & Logística Express',
    defaultTitle: 'TURISMO E LOGÍSTICA',
    defaultTag: 'MOÇAMBIQUE',
    defaultSlogan: 'Ponta do Ouro, Inhaca, Ilha de Moçambique, Bazaruto, Bilene, Safaris & Logística Express',
    slides: [
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
    ]
  },
  lojas: {
    menuKey: 'lojas',
    menuLabel: 'Lojas & Boutiques',
    title: 'LOJAS & BOUTIQUES',
    tag: 'MAPUTO & MOÇAMBIQUE',
    slogan: 'Baixa de Maputo, Moda, Capulanas Tradicionais, Calçado, Smartphones & Gadgets',
    defaultTitle: 'LOJAS & BOUTIQUES',
    defaultTag: 'MAPUTO & MOÇAMBIQUE',
    defaultSlogan: 'Baixa de Maputo, Moda, Capulanas Tradicionais, Calçado, Smartphones & Gadgets',
    slides: [
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
    ]
  },
  pecas_auto: {
    menuKey: 'pecas_auto',
    menuLabel: 'Auto Peças & Oficinas',
    title: 'PEÇAS AUTO & OFICINAS',
    tag: 'TOYOTA · MAHINDRA · NISSAN',
    slogan: 'Toyota Hilux, Land Cruiser, Mahindra Pik Up, Suspensão 4x4, Travões, Embraiagens, Filtros & Baterias',
    defaultTitle: 'PEÇAS AUTO & OFICINAS',
    defaultTag: 'TOYOTA · MAHINDRA · NISSAN',
    defaultSlogan: 'Toyota Hilux, Land Cruiser, Mahindra Pik Up, Suspensão 4x4, Travões, Embraiagens, Filtros & Baterias',
    slides: [
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
    ]
  },
  supermercados: {
    menuKey: 'supermercados',
    menuLabel: 'Supermercados & Frescos',
    title: 'SUPERMERCADOS',
    tag: 'ATACADO & RETALHO',
    slogan: 'Grandes Superfícies de Maputo e Matola, Mariscos da Costa, Frescos & Mercearia',
    defaultTitle: 'SUPERMERCADOS',
    defaultTag: 'ATACADO & RETALHO',
    defaultSlogan: 'Grandes Superfícies de Maputo e Matola, Mariscos da Costa, Frescos & Mercearia',
    slides: [
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
    ]
  },
  bares: {
    menuKey: 'bares',
    menuLabel: 'Bares & Restaurantes',
    title: 'BARES & DIVERSÃO',
    tag: 'COSTA DO SOL & MARGINAL',
    slogan: 'Marginal de Maputo, Lounges na Polana, Mariscos, 2M, Laurentina & Sunset',
    defaultTitle: 'BARES & DIVERSÃO',
    defaultTag: 'COSTA DO SOL & MARGINAL',
    defaultSlogan: 'Marginal de Maputo, Lounges na Polana, Mariscos, 2M, Laurentina & Sunset',
    slides: [
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
    ]
  },
  hospedagens: {
    menuKey: 'hospedagens',
    menuLabel: 'Hospedagens & Lodges',
    title: 'HOSPEDAGENS & LODGES',
    tag: 'HOTÉIS & RESORTS',
    slogan: 'Hotéis da Marginal, Lodges de Praia em Ponta do Ouro, Inhaca, Bazaruto & Pousadas',
    defaultTitle: 'HOSPEDAGENS & LODGES',
    defaultTag: 'HOTÉIS & RESORTS',
    defaultSlogan: 'Hotéis da Marginal, Lodges de Praia em Ponta do Ouro, Inhaca, Bazaruto & Pousadas',
    slides: [
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
    ]
  },
  construcao: {
    menuKey: 'construcao',
    menuLabel: 'Material de Construção',
    title: 'MATERIAL DE CONSTRUÇÃO',
    tag: 'ESTALEIROS & OBRAS',
    slogan: 'Estaleiros de Maputo e Matola, Cimento Nacional, Areia do Rio Incomáti, Brita & Ferro',
    defaultTitle: 'MATERIAL DE CONSTRUÇÃO',
    defaultTag: 'ESTALEIROS & OBRAS',
    defaultSlogan: 'Estaleiros de Maputo e Matola, Cimento Nacional, Areia do Rio Incomáti, Brita & Ferro',
    slides: [
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
    ]
  },
  entregadores: {
    menuKey: 'entregadores',
    menuLabel: 'Entregadores & Fretes',
    title: 'ENTREGADORES & FRETES',
    tag: 'LOGÍSTICA EXPRESS',
    slogan: 'Moto-Boys em Maputo e Matola, Carrinhas de Carga, Fretes & Distribuição Rápida',
    defaultTitle: 'ENTREGADORES & FRETES',
    defaultTag: 'LOGÍSTICA EXPRESS',
    defaultSlogan: 'Moto-Boys em Maputo e Matola, Carrinhas de Carga, Fretes & Distribuição Rápida',
    slides: [
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
  },
  segmentos: {
    menuKey: 'segmentos',
    menuLabel: 'Escolha de Segmento',
    title: 'ESCOLHER SEGMENTO',
    tag: 'DIRECTÓRIO',
    slogan: 'Explore e selecione a categoria de lojas e serviços desejada em Moçambique',
    defaultTitle: 'ESCOLHER SEGMENTO',
    defaultTag: 'DIRECTÓRIO',
    defaultSlogan: 'Explore e selecione a categoria de lojas e serviços desejada em Moçambique',
    slides: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=2000&q=85',
        caption: 'Turismo em Ponta do Ouro, Inhaca e Bazaruto'
      },
      {
        url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=2000&q=85',
        caption: 'Peças Auto Toyota & Mahindra em Moçambique'
      },
      {
        url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2000&q=85',
        caption: 'Comércio, Boutiques, Supermercados e Construção'
      }
    ]
  }
};

const BANNER_STORAGE_KEY = 'axofacil_custom_banners_v2';

export function loadAllBannerConfigs(): Record<string, BannerMenuConfig> {
  if (typeof localStorage === 'undefined') return DEFAULT_BANNER_CONFIGS;
  try {
    const raw = localStorage.getItem(BANNER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(DEFAULT_BANNER_CONFIGS));
      return DEFAULT_BANNER_CONFIGS;
    }
    const parsed = JSON.parse(raw);
    const merged: Record<string, BannerMenuConfig> = { ...DEFAULT_BANNER_CONFIGS, ...parsed };
    if (merged.landing) {
      if (/maior portal/i.test(merged.landing.slogan || '')) {
        merged.landing.slogan = DEFAULT_BANNER_CONFIGS.landing.slogan;
      }
      if (/maior portal/i.test(merged.landing.defaultSlogan || '')) {
        merged.landing.defaultSlogan = DEFAULT_BANNER_CONFIGS.landing.defaultSlogan;
      }
    }
    return merged;
  } catch (e) {
    console.warn('Erro ao carregar banners customizados:', e);
    return DEFAULT_BANNER_CONFIGS;
  }
}

export function loadBannerConfig(menuKey: string): BannerMenuConfig {
  const all = loadAllBannerConfigs();
  const normalizedKey = (menuKey || 'landing').toLowerCase().trim();
  return all[normalizedKey] || all.landing || DEFAULT_BANNER_CONFIGS.landing;
}

export function saveBannerConfig(menuKey: string, config: BannerMenuConfig): void {
  const all = loadAllBannerConfigs();
  const normalizedKey = (menuKey || 'landing').toLowerCase().trim();
  all[normalizedKey] = {
    ...config,
    menuKey: normalizedKey
  };
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(all));
    window.dispatchEvent(new Event('axofacil_banners_updated'));
  }
}

export function saveAllBannerConfigs(configs: Record<string, BannerMenuConfig>): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(configs));
    window.dispatchEvent(new Event('axofacil_banners_updated'));
  }
}

export function resetBannerConfig(menuKey?: string): void {
  if (menuKey) {
    const normalizedKey = menuKey.toLowerCase().trim();
    if (DEFAULT_BANNER_CONFIGS[normalizedKey]) {
      saveBannerConfig(normalizedKey, DEFAULT_BANNER_CONFIGS[normalizedKey]);
    }
  } else {
    saveAllBannerConfigs(DEFAULT_BANNER_CONFIGS);
  }
}
