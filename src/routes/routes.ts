export type AppRoutePage =
  | 'home'
  | 'promocoes'
  | 'sobre'
  | 'segmentos'
  | 'categoria'
  | 'lojas'
  | 'supermercados'
  | 'bares'
  | 'hospedagens'
  | 'turismo'
  | 'construcao'
  | 'entregadores'
  | 'auth'
  | 'dashboard'
  | 'admin'
  | 'inventario'
  | 'mesas'
  | 'pos_caixa';

export interface RouteMeta {
  page: AppRoutePage;
  path: string;
  title: string;
}

export const APP_ROUTES: Record<AppRoutePage, RouteMeta> = {
  home: { page: 'home', path: '/', title: 'Início' },
  categoria: { page: 'categoria', path: '/categoria', title: 'Directório & Categorias' },
  promocoes: { page: 'promocoes', path: '/promocoes', title: 'Promoções & Ofertas' },
  sobre: { page: 'sobre', path: '/sobre', title: 'Sobre o Axofácil!' },
  segmentos: { page: 'segmentos', path: '/segmentos', title: 'Departamentos & Categorias' },
  lojas: { page: 'lojas', path: '/lojas', title: 'Lojas & Comércio' },
  supermercados: { page: 'supermercados', path: '/supermercados', title: 'Supermercados & Mercearias' },
  bares: { page: 'bares', path: '/bares', title: 'Restaurantes & Lazer' },
  hospedagens: { page: 'hospedagens', path: '/hospedagens', title: 'Hospedagem & Alojamento' },
  turismo: { page: 'turismo', path: '/turismo', title: 'Turismo & Viagens' },
  construcao: { page: 'construcao', path: '/construcao', title: 'Material de Construção & Ferragens' },
  entregadores: { page: 'entregadores', path: '/entregadores', title: 'Transporte & Entregadores' },
  inventario: { page: 'inventario', path: '/painel/inventario', title: 'Inventário & Stock Físico' },
  mesas: { page: 'mesas', path: '/painel/mesas', title: 'Controlo de Mesas & Consumo' },
  pos_caixa: { page: 'pos_caixa', path: '/painel/caixa', title: 'Balcão de Caixa POS (Offline-First)' },
  auth: { page: 'auth', path: '/auth', title: 'Entrar / Subscrever' },
  dashboard: { page: 'dashboard', path: '/dashboard', title: 'Meu Painel' },
  admin: { page: 'admin', path: '/admin', title: 'Painel Admin' },
};

export const PAGE_TITLES: Record<AppRoutePage, string> = Object.fromEntries(
  Object.values(APP_ROUTES).map((r) => [r.page, r.title])
) as Record<AppRoutePage, string>;

const PATH_TO_PAGE: Record<string, AppRoutePage> = {
  '/': 'home',
  '/inicio': 'home',
  '/home': 'home',
  '/categoria': 'categoria',
  '/categorias': 'categoria',
  '/promocoes': 'promocoes',
  '/sobre': 'sobre',
  '/segmentos': 'segmentos',
  '/lojas': 'lojas',
  '/pecas': 'lojas',
  '/supermercados': 'supermercados',
  '/bares': 'bares',
  '/hospedagens': 'hospedagens',
  '/turismo': 'turismo',
  '/construcao': 'construcao',
  '/entregadores': 'entregadores',
  '/painel/inventario': 'inventario',
  '/painel/mesas': 'mesas',
  '/painel/caixa': 'pos_caixa',
  // Legadas / Redirecionamento seguro
  '/inventario': 'inventario',
  '/mesas': 'mesas',
  '/pos-caixa': 'pos_caixa',
  '/pos_caixa': 'pos_caixa',
  '/auth': 'auth',
  '/entrar': 'auth',
  '/registar': 'auth',
  '/dashboard': 'dashboard',
  '/painel': 'dashboard',
  '/admin': 'admin',
};

export function resolveRouteFromLocation(): {
  page: AppRoutePage;
  categorySlug?: string | null;
  subcategorySlug?: string | null;
  selectedEstId: string | null;
  segmentFilter: string | null;
  authTab?: 'login' | 'criar' | 'admin' | 'forgot' | 'reset-password';
} {
  if (typeof window === 'undefined') {
    return { page: 'home', selectedEstId: null, segmentFilter: null };
  }

  const pathname = (window.location.pathname || '/').replace(/\/+$/, '') || '/';
  const params = new URLSearchParams(window.location.search);

  // Dynamic /categoria/:slug/:subslug resolution
  let categorySlug: string | null = params.get('cat') || null;
  let subcategorySlug: string | null = params.get('sub') || null;

  if (pathname.startsWith('/categoria/')) {
    const parts = pathname.replace('/categoria/', '').split('/').filter(Boolean);
    if (parts.length > 0) {
      categorySlug = parts[0];
    }
    if (parts.length > 1) {
      subcategorySlug = parts[1];
    }
    return {
      page: 'categoria',
      categorySlug,
      subcategorySlug,
      selectedEstId: params.get('id') || null,
      segmentFilter: params.get('segmento') || subcategorySlug,
      authTab: undefined,
    };
  }

  // Handle direct legacy /pecas route
  if (pathname === '/pecas') {
    return {
      page: 'lojas',
      categorySlug: 'lojas',
      subcategorySlug: 'pecas-auto',
      selectedEstId: params.get('id') || null,
      segmentFilter: 'pecas_auto',
      authTab: undefined,
    };
  }

  const queryPage = params.get('page') as AppRoutePage | null;
  const matchedPage =
    (queryPage && APP_ROUTES[queryPage] ? queryPage : undefined) ||
    PATH_TO_PAGE[pathname.toLowerCase()] ||
    'home';

  const selectedEstId = params.get('id') || null;
  const segmentFilter = params.get('segmento') || null;
  const tabParam = params.get('tab') as 'login' | 'criar' | 'admin' | 'forgot' | 'reset-password' | null;

  return {
    page: matchedPage,
    categorySlug,
    subcategorySlug,
    selectedEstId,
    segmentFilter,
    authTab: tabParam || undefined,
  };
}

export function buildRouteUrl(
  page: AppRoutePage,
  options?: {
    categorySlug?: string | null;
    subcategorySlug?: string | null;
    selectedEstId?: string | null;
    segmentFilter?: string | null;
    authTab?: string | null;
  }
): string {
  if (page === 'categoria' && options?.categorySlug) {
    let url = `/categoria/${options.categorySlug}`;
    if (options.subcategorySlug) {
      url += `/${options.subcategorySlug}`;
    }
    const params = new URLSearchParams();
    if (options.selectedEstId) params.set('id', options.selectedEstId);
    const search = params.toString();
    return search ? `${url}?${search}` : url;
  }

  const base = APP_ROUTES[page]?.path || '/';
  const params = new URLSearchParams();

  if (options?.selectedEstId) {
    params.set('id', options.selectedEstId);
  }
  if (options?.segmentFilter) {
    params.set('segmento', options.segmentFilter);
  }
  if (page === 'auth' && options?.authTab && options.authTab !== 'login') {
    params.set('tab', options.authTab);
  }

  const search = params.toString();
  return search ? `${base}?${search}` : base;
}
