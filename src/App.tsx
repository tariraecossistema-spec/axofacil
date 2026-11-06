import React, { useState, useEffect } from 'react';
import Header from "./components/layout/Header";
import OfflineBanner from "./components/layout/OfflineBanner";
import Footer from "./components/layout/Footer";
import LandingPage from "./pages/LandingPage";
import SegmentSelector, { SegmentPageTarget } from "./components/shared/SegmentSelector";
import CategoryPage from "./pages/CategoryPage";
import LojasPage from "./pages/LojasPage";
import SupermercadosPage from "./pages/SupermercadosPage";
import BaresPage from "./pages/BaresPage";
import HospedagensPage from "./pages/HospedagensPage";
import TurismoPage from "./pages/TurismoPage";
import ConstrucaoPage from "./pages/ConstrucaoPage";
import SobrePage from "./pages/SobrePage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./components/admin/AdminPanel";
import EntregadoresPage from "./pages/EntregadoresPage";
import InventoryPage from "./pages/InventoryPage";
import TablesPage from "./pages/TablesPage";
import POSCashierPage from "./pages/POSCashierPage";
import PromocoesPage from "./pages/PromocoesPage";
import EstablishmentModal from "./components/modals/EstablishmentModal";
import PromoModal from "./components/modals/PromoModal";
import CartDrawer from "./components/modals/CartDrawer";
import MyPurchasesModal from "./components/modals/MyPurchasesModal";
import PaymentManagerModal from "./components/modals/PaymentManagerModal";
import GuestAccessGateModal from "./components/modals/GuestAccessGateModal";
import DialogHost from "./components/layout/DialogHost";
import ConsultationModal from "./components/modals/ConsultationModal";
import { loadData, saveEstablishments, savePayments, saveSubmissions, saveDeliveryPartners } from './data/data';
import { supabase, isSupabaseConfigured, getSupabaseClient, checkIsAdminInSupabase, fetchUserProfileByContactFromSupabase, fetchEstablishmentsFromSupabase } from "./services/supabase";
import { hydratePlatformSettingsFromSupabase } from './services/platformConfig';
import { Establishment, PromoDeal, UserProfile, PaymentRecord, AdminSubmission, DeliveryPartner, CartItem, ProductItem, isAuthorizedStoreStaffOrAdmin } from './types/types';
import { AppRoutePage, PAGE_TITLES, resolveRouteFromLocation, buildRouteUrl } from './routes/routes';
import { ChevronLeft, Home, ShoppingBag } from 'lucide-react';

interface NavHistoryItem {
  page: AppRoutePage;
  selectedEstId: string | null;
  title: string;
}

export default function App() {
  const initialRoute = resolveRouteFromLocation();
  const [activePage, setActivePage] = useState<AppRoutePage>(initialRoute.page);
  const [categorySlug, setCategorySlug] = useState<string | null>(initialRoute.categorySlug || null);
  const [subcategorySlug, setSubcategorySlug] = useState<string | null>(initialRoute.subcategorySlug || null);
  // Narrows a segment page to a sub-set when the client arrives via SegmentSelector
  // e.g. 'pecas_auto' inside LojasPage, or 'ferragens' inside ConstrucaoPage
  const [segmentFilter, setSegmentFilter] = useState<string | null>(initialRoute.segmentFilter);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [establishments, setEstablishments] = useState<Establishment[]>([]);
  const [deals, setDeals] = useState<PromoDeal[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [submissions, setSubmissions] = useState<AdminSubmission[]>([]);
  const [couriers, setCouriers] = useState<DeliveryPartner[]>([]);

  // Navigation History Stack state
  const [navHistory, setNavHistory] = useState<NavHistoryItem[]>([
    { page: 'home', selectedEstId: null, title: 'Início' }
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Modals & E-commerce Cart state
  const [selectedEst, setSelectedEst] = useState<Establishment | null>(null);
  const [promoModal, setPromoModal] = useState<{ isOpen: boolean; category: 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'turismo' }>({
    isOpen: false,
    category: 'loja'
  });

  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'criar' | 'admin' | 'forgot' | 'reset-password'>(initialRoute.authTab || 'login');
  const [guestGateModal, setGuestGateModal] = useState<{ isOpen: boolean; featureName?: string }>({ isOpen: false });

  const handleOpenAuth = (tab: 'login' | 'criar' | 'admin' | 'forgot' | 'reset-password') => {
    setAuthInitialTab(tab);
    navigateTo('auth', null, undefined, null, tab);
  };

  const handleRequireAuth = (featureName?: string) => {
    if (!currentUser) {
      setGuestGateModal({ isOpen: true, featureName });
      return true;
    }
    return false;
  };

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    if (typeof localStorage === 'undefined') return [];
    const stored = localStorage.getItem('axofacil_cart_items');
    return stored ? JSON.parse(stored) : [];
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isMyPurchasesOpen, setIsMyPurchasesOpen] = useState(false);
  const [isPaymentManagerOpen, setIsPaymentManagerOpen] = useState(false);
  const [isConsultationOpen, setIsConsultationOpen] = useState(false);
  const [consultationCategory, setConsultationCategory] = useState<string>('geral');

  const handleOpenConsultation = (category?: string) => {
    const targetCat = category || (segmentFilter === 'pecas_auto' ? 'pecas_auto' : activePage);
    setConsultationCategory(targetCat);
    setIsConsultationOpen(true);
  };

  useEffect(() => {
    localStorage.setItem('axofacil_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  const handleAddToCart = (product: ProductItem, est: Establishment, quantity: number = 1) => {
    const qtyToAdd = Math.max(1, quantity);
    setCartItems(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id && item.establishmentId === est.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += qtyToAdd;
        return updated;
      }
      return [
        ...prev,
        {
          id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          productId: product.id,
          establishmentId: est.id,
          establishmentName: est.name,
          productName: product.name,
          unitPriceMT: product.promoPriceMT || product.priceMT,
          quantity: qtyToAdd,
          imageUrl: product.imageUrl,
          category: product.category
        }
      ];
    });
    setIsCartOpen(true);
  };

  const handleUpdateCartQuantity = (cartItemId: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveCartItem(cartItemId);
      return;
    }
    setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity: newQty } : item));
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== cartItemId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };


  const pageTitles: Record<string, string> = PAGE_TITLES;

  const syncBrowserUrl = (
    page: AppRoutePage,
    selectedEstId: string | null = null,
    segFilter: string | null = null,
    authTab?: string | null,
    catSlug?: string | null,
    subSlug?: string | null
  ) => {
    if (typeof window === 'undefined') return;
    // Preserve Supabase recovery hash if present
    if (window.location.hash && window.location.hash.includes('access_token')) return;
    const nextUrl = buildRouteUrl(page, {
      selectedEstId,
      segmentFilter: segFilter,
      authTab: page === 'auth' ? (authTab || authInitialTab) : null,
      categorySlug: catSlug !== undefined ? catSlug : categorySlug,
      subcategorySlug: subSlug !== undefined ? subSlug : subcategorySlug,
    });
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== nextUrl) {
      window.history.pushState({ page, selectedEstId, segmentFilter: segFilter }, '', nextUrl);
    }
  };

  const navigateTo = (
    page: NavHistoryItem['page'],
    selectedEstId: string | null = null,
    titleOverride?: string,
    nextSegmentFilter: string | null = null,
    authTabOverride?: string | null,
    nextCatSlug?: string | null,
    nextSubSlug?: string | null
  ) => {
    setSegmentFilter(nextSegmentFilter);
    if (nextCatSlug !== undefined) setCategorySlug(nextCatSlug);
    if (nextSubSlug !== undefined) setSubcategorySlug(nextSubSlug);

    const current = navHistory[historyIndex];
    if (current && current.page === page && current.selectedEstId === selectedEstId && segmentFilter === nextSegmentFilter) {
      syncBrowserUrl(page, selectedEstId, nextSegmentFilter, authTabOverride, nextCatSlug, nextSubSlug);
      return;
    }

    const title = titleOverride || pageTitles[page] || 'Axofácil!';
    const nextStack = navHistory.slice(0, historyIndex + 1);
    nextStack.push({ page, selectedEstId, title });
    setNavHistory(nextStack);
    setHistoryIndex(nextStack.length - 1);

    setActivePage(page);
    if (selectedEstId) {
      const found = establishments.find(e => e.id === selectedEstId);
      setSelectedEst(found || null);
    } else {
      setSelectedEst(null);
    }
    syncBrowserUrl(page, selectedEstId, nextSegmentFilter, authTabOverride, nextCatSlug, nextSubSlug);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoBack = () => {
    if (selectedEst) {
      setSelectedEst(null);
      syncBrowserUrl(activePage, null, segmentFilter);
      return;
    }
    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const target = navHistory[prevIdx];
      setHistoryIndex(prevIdx);
      setActivePage(target.page);
      if (target.selectedEstId) {
        const found = establishments.find(e => e.id === target.selectedEstId);
        setSelectedEst(found || null);
      } else {
        setSelectedEst(null);
      }
      syncBrowserUrl(target.page, target.selectedEstId, null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoForward = () => {
    if (historyIndex < navHistory.length - 1) {
      const nextIdx = historyIndex + 1;
      const target = navHistory[nextIdx];
      setHistoryIndex(nextIdx);
      setActivePage(target.page);
      if (target.selectedEstId) {
        const found = establishments.find(e => e.id === target.selectedEstId);
        setSelectedEst(found || null);
      } else {
        setSelectedEst(null);
      }
      syncBrowserUrl(target.page, target.selectedEstId, null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoHome = () => {
    navigateTo('home', null, 'Início');
  };

  useEffect(() => {
    // Load initial directory data & persistent state
    const data = loadData();
    setEstablishments(data.establishments);
    setDeals(data.deals);
    setPayments(data.payments);
    setSubmissions(data.submissions);
    setCouriers(data.couriers || []);

    // Carregar estabelecimentos reais directamente do Supabase
    if (isSupabaseConfigured) {
      fetchEstablishmentsFromSupabase().then(rows => {
        if (rows && rows.length > 0) {
          const testEstIds = new Set(['l1', 's1', 'c1']);
          const mapped: Establishment[] = rows
            .filter(r => !testEstIds.has(r.id) && !((r.name || '').toLowerCase().includes('conta de teste')))
            .map(r => {
              if (r.raw_json && typeof r.raw_json === 'object') {
                return { ...r.raw_json, id: r.id, name: r.name || r.raw_json.name, isActive: r.is_active ?? true };
              }
              return {
                id: r.id,
                name: r.name,
                category: r.category,
                zone: r.zone,
                province: r.province || 'Cidade de Maputo',
                address: r.address || 'Maputo',
                description: r.description || '',
                rating: 5.0,
                metaInfo: 'Aberto',
                coverColor: '#0B254B',
                features: [r.category],
                contactPhone: r.contact_phone || '',
                isActive: r.is_active ?? true,
                visits: 0,
                searches: 0,
                salesOrReservations: 0,
                productsList: [],
                productsCatalog: []
              } as Establishment;
            });
          setEstablishments(mapped);
          saveEstablishments(mapped);
        }
      }).catch(console.warn);
    }

    // Actualiza em segundo plano a cópia local das definições da plataforma
    hydratePlatformSettingsFromSupabase().catch(() => {});

    // Load active session if exists
    const storedUser = localStorage.getItem('axofacil_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.role === 'admin') {
          parsed.role = 'cliente';
        }
        setCurrentUser(parsed);
      } catch (err) {
        console.warn('Failed to parse stored user:', err);
      }
    }

    // 1. Check for password recovery URL hash/search params
    const checkRecoveryUrl = () => {
      if (typeof window === 'undefined') return;
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      // Check expired or error recovery links
      if (hash.includes('error_description') || search.includes('error_description')) {
        setAuthInitialTab('forgot');
        setActivePage('auth');
        return;
      }

      // Check active password recovery link
      const isRecovery =
        hash.includes('type=recovery') ||
        hash.includes('type=invite') ||
        search.includes('type=recovery') ||
        (hash.includes('access_token') && (hash.includes('recovery') || hash.includes('type=recovery')));

      if (isRecovery) {
        setAuthInitialTab('reset-password');
        setActivePage('auth');
      }
    };

    checkRecoveryUrl();
    window.addEventListener('hashchange', checkRecoveryUrl);

    // 2. Check and listen for Supabase session and PASSWORD_RECOVERY event
    const sbClient = getSupabaseClient();
    if (sbClient) {
      const syncSessionUser = async (user: any) => {
        const userEmail = user.email || '';
        const isAdmin = await checkIsAdminInSupabase(user.id);
        const remoteProfile = userEmail ? await fetchUserProfileByContactFromSupabase(userEmail) : null;

        let localExisting: Partial<UserProfile> = {};
        try {
          const rawLocal = localStorage.getItem('axofacil_user');
          if (rawLocal) {
            const parsedLocal = JSON.parse(rawLocal);
            if (parsedLocal && typeof parsedLocal === 'object') {
              localExisting = parsedLocal;
            }
          }
        } catch {
          // ignore
        }

        const userName =
          remoteProfile?.name ||
          localExisting.name ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          userEmail.split('@')[0] ||
          'Utilizador';
        const baseRole = remoteProfile?.role || localExisting.role || user.user_metadata?.role || 'cliente';
        const finalRole = isAdmin ? 'admin' : (baseRole === 'admin' ? 'cliente' : baseRole);

        const sessionUser: UserProfile = {
          ...localExisting,
          ...(remoteProfile || {}),
          id: user.id || localExisting.id || `usr_${Date.now().toString().slice(-6)}`,
          name: userName,
          displayName: remoteProfile?.displayName || localExisting.displayName || userName,
          storeName: remoteProfile?.storeName || localExisting.storeName,
          establishmentId: (remoteProfile as any)?.establishmentId || localExisting.establishmentId,
          emailOrPhone: localExisting.emailOrPhone || userEmail,
          email: userEmail || localExisting.email,
          phone: remoteProfile?.phone || localExisting.phone || user.user_metadata?.phone || user.phone || undefined,
          city: remoteProfile?.city || localExisting.city || user.user_metadata?.city || undefined,
          role: finalRole as any,
          subscriptionPlan: isAdmin
            ? 'Administrador'
            : (remoteProfile?.subscriptionPlan || localExisting.subscriptionPlan || user.user_metadata?.subscriptionPlan || 'Período Experimental (15 dias)'),
          isPremium: isAdmin ? true : Boolean(remoteProfile?.isPremium ?? localExisting.isPremium ?? true)
        };
        setCurrentUser(sessionUser);
        localStorage.setItem('axofacil_user', JSON.stringify(sessionUser));
      };

      sbClient.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          syncSessionUser(session.user).catch(() => {});
        }
      });

      const { data: { subscription } } = sbClient.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          setAuthInitialTab('reset-password');
          setActivePage('auth');
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
          localStorage.removeItem('axofacil_user');
        } else if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
          syncSessionUser(session.user).catch(() => {});
        }
      });

      const handlePopState = () => {
        const resolved = resolveRouteFromLocation();
        setActivePage(resolved.page);
        setSegmentFilter(resolved.segmentFilter);
        if (resolved.categorySlug !== undefined) setCategorySlug(resolved.categorySlug || null);
        if (resolved.subcategorySlug !== undefined) setSubcategorySlug(resolved.subcategorySlug || null);
        if (resolved.authTab) {
          setAuthInitialTab(resolved.authTab);
        }
        if (resolved.selectedEstId) {
          const match = data.establishments.find(e => e.id === resolved.selectedEstId);
          setSelectedEst(match || null);
        } else {
          setSelectedEst(null);
        }
      };
      window.addEventListener('popstate', handlePopState);

      // Check URL parameters for direct share link
      const params = new URLSearchParams(window.location.search);
      const directId = params.get('id');
      if (directId) {
        const match = data.establishments.find(e => e.id === directId);
        if (match) {
          setSelectedEst(match);
        }
      }

      return () => {
        window.removeEventListener('hashchange', checkRecoveryUrl);
        window.removeEventListener('popstate', handlePopState);
        subscription?.unsubscribe();
      };
    }

    const handlePopState = () => {
      const resolved = resolveRouteFromLocation();
      setActivePage(resolved.page);
      setSegmentFilter(resolved.segmentFilter);
      if (resolved.categorySlug !== undefined) setCategorySlug(resolved.categorySlug || null);
      if (resolved.subcategorySlug !== undefined) setSubcategorySlug(resolved.subcategorySlug || null);
      if (resolved.authTab) {
        setAuthInitialTab(resolved.authTab);
      }
      if (resolved.selectedEstId) {
        const match = data.establishments.find(e => e.id === resolved.selectedEstId);
        setSelectedEst(match || null);
      } else {
        setSelectedEst(null);
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Check URL parameters for direct share link
    const params = new URLSearchParams(window.location.search);
    const directId = params.get('id');
    if (directId) {
      const match = data.establishments.find(e => e.id === directId);
      if (match) {
        setSelectedEst(match);
      }
    }

    return () => {
      window.removeEventListener('hashchange', checkRecoveryUrl);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Handler that registers a visit/click when viewing an establishment profile
  const handleSelectEstablishment = (est: Establishment) => {
    const updatedEst = {
      ...est,
      visits: (est.visits || 0) + 1
    };

    const updated = establishments.map(e => {
      if (e.id === est.id) {
        return updatedEst;
      }
      return e;
    });

    setEstablishments(updated);
    saveEstablishments(updated);
    
    // Set selectedEst directly with updated object so Vitrine Modal opens immediately
    setSelectedEst(updatedEst);

    // Navigate with history
    navigateTo(activePage, est.id, est.name);
  };

  // Handler to update establishment image directly from card upload via ImgBB
  const handleUpdateEstablishmentImage = (id: string, newUrl: string) => {
    const updated = establishments.map(e => {
      if (e.id === id) {
        return { ...e, imageUrl: newUrl };
      }
      return e;
    });
    setEstablishments(updated);
    saveEstablishments(updated);
  };

  // Callback to register newly created businesses
  const handleAddEstablishment = (newEst: Establishment) => {
    const updated = [newEst, ...establishments];
    setEstablishments(updated);
    saveEstablishments(updated);
  };

  const handleAddPromoClick = (category: 'loja' | 'supermercado' | 'bar' | 'hospedagem' | 'construcao' | 'turismo') => {
    setPromoModal({ isOpen: true, category });
  };

  // Called from SegmentSelector: routes the client straight into the right
  // segment page, optionally narrowed to a sub-category (e.g. pecas_auto, ferragens)
  const handleSelectSegment = (targetPage: SegmentPageTarget | 'categoria', filter?: string) => {
    if (targetPage === 'categoria') {
      navigateTo('categoria', null, undefined, filter || null, null, filter || 'lojas', null);
    } else {
      navigateTo(targetPage, null, undefined, filter || null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 font-sans selection:bg-[#0B254B]/20 selection:text-[#0B254B] flex flex-col justify-between">
      
      {/* Global confirm/alert replacement — always works, even in sandboxed preview iframes */}
      <DialogHost />

      {/* Offline Status & Sync Bar — visível apenas para administradores e utilizadores com perfil criado */}
      <OfflineBanner currentUser={currentUser} />

      {/* Dynamic Header (Hidden on auth screen for full focus and clean exit) */}
      {activePage !== 'auth' && (
        <Header 
          activePage={activePage} 
          segmentFilter={segmentFilter}
          setActivePage={(page) => navigateTo(page)}
          onOpenAuth={handleOpenAuth}
          onSelectSegment={handleSelectSegment}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          canGoBack={historyIndex > 0 || selectedEst !== null}
          canGoForward={historyIndex < navHistory.length - 1}
          onGoBack={handleGoBack}
          onGoForward={handleGoForward}
          onGoHome={handleGoHome}
          currentTitle={selectedEst ? selectedEst.name : pageTitles[activePage]}
          cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
          onOpenCart={() => setIsCartOpen(true)}
          onOpenPurchases={() => setIsMyPurchasesOpen(true)}
          onOpenPaymentManager={() => setIsPaymentManagerOpen(true)}
        />
      )}


      {/* Breadcrumb / Location Path Indicator (Shown on auxiliary pages without a top hero banner, hidden on auth) */}
      {activePage !== 'auth' && !['home', 'categoria', 'lojas', 'supermercados', 'bares', 'hospedagens', 'turismo', 'construcao', 'entregadores'].includes(activePage) && (
        <div className="bg-sand-2/30 border-b border-ink/8 py-2 px-[6vw] w-full">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-ink/70">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button onClick={handleGoHome} className="hover:text-terracotta flex items-center gap-1 font-semibold cursor-pointer transition-colors">
                <Home className="w-3.5 h-3.5 text-terracotta" />
                <span>Início</span>
              </button>
              {activePage !== 'home' && (
                <>
                  <span className="text-ink/30">/</span>
                  <button onClick={() => navigateTo(activePage)} className="font-bold text-indigo-deep capitalize hover:underline cursor-pointer">
                    {pageTitles[activePage] || activePage}
                  </button>
                </>
              )}
              {selectedEst && (
                <>
                  <span className="text-ink/30">/</span>
                  <span className="font-bold text-terracotta truncate max-w-[180px] sm:max-w-[280px]">{selectedEst.name}</span>
                </>
              )}
            </div>
            
            {(historyIndex > 0 || selectedEst) && (
              <button 
                onClick={handleGoBack} 
                className="text-terracotta hover:underline font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all hover:-translate-x-0.5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Voltar atrás</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Routed Page Content */}
      <main className="flex-grow">
        {activePage === 'home' && (
          <LandingPage 
            establishments={establishments}
            deals={deals}
            setActivePage={(page) => navigateTo(page)}
            setSearchQuery={setSearchQuery}
            onSelectEstablishment={handleSelectEstablishment}
            onUpdateEstablishmentImage={handleUpdateEstablishmentImage}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            onSelectSegment={handleSelectSegment}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('home')}
          />
        )}

        {activePage === 'categoria' && (
          <CategoryPage
            categorySlug={categorySlug || segmentFilter || 'lojas'}
            subcategorySlug={subcategorySlug}
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation(categorySlug || 'lojas')}
          />
        )}

        {activePage === 'promocoes' && (
          <PromocoesPage
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            setActivePage={(p) => navigateTo(p)}
          />
        )}

        {activePage === 'segmentos' && (
          <SegmentSelector
            establishments={establishments}
            onSelectSegment={handleSelectSegment}
          />
        )}

        {activePage === 'lojas' && (
          <LojasPage 
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            segmentFilter={segmentFilter}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation(segmentFilter === 'pecas_auto' ? 'pecas_auto' : 'lojas')}
          />
        )}

        {activePage === 'supermercados' && (
          <SupermercadosPage 
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('supermercados')}
          />
        )}

        {activePage === 'bares' && (
          <BaresPage 
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('bares')}
          />
        )}

        {activePage === 'hospedagens' && (
          <HospedagensPage 
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('hospedagens')}
          />
        )}

        {activePage === 'turismo' && (
          <TurismoPage
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            currentUser={currentUser}
            onAddToCart={handleAddToCart}
            onOpenPurchases={() => setIsMyPurchasesOpen(true)}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('turismo')}
          />
        )}

        {activePage === 'construcao' && (
          <ConstrucaoPage 
            establishments={establishments}
            deals={deals}
            onSelectEstablishment={handleSelectEstablishment}
            onAddPromotion={handleAddPromoClick}
            setActivePage={(page) => navigateTo(page)}
            currentUser={currentUser}
            segmentFilter={segmentFilter}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery('')}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('construcao')}
          />
        )}

        {activePage === 'entregadores' && (
          <EntregadoresPage 
            couriers={couriers}
            setCouriers={setCouriers}
            setActivePage={(page) => navigateTo(page)}
            currentUser={currentUser}
            establishments={establishments}
            onSelectEstablishment={handleSelectEstablishment}
            onNavigate={(page, filter) => handleSelectSegment(page, filter)}
            canGoBack={historyIndex > 0}
            onGoBack={handleGoBack}
            onGoHome={handleGoHome}
            onInquireClick={() => handleOpenConsultation('entregadores')}
          />
        )}

        {activePage === 'sobre' && (
          <SobrePage 
            setActivePage={(page) => navigateTo(page)}
            onGoHome={handleGoHome}
          />
        )}

        {activePage === 'auth' && (
          <AuthPage 
            setActivePage={(page) => navigateTo(page)}
            setCurrentUser={setCurrentUser}
            onAddEstablishment={handleAddEstablishment}
            initialTab={authInitialTab}
            currentUser={currentUser}
          />
        )}

        {activePage === 'dashboard' && currentUser && (
          <Dashboard 
            currentUser={currentUser}
            setCurrentUser={setCurrentUser}
            establishments={establishments}
            setEstablishments={setEstablishments}
            deals={deals}
            setDeals={setDeals}
            onSelectEstablishment={handleSelectEstablishment}
            setActivePage={(page) => navigateTo(page)}
            cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            cartItems={cartItems}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onRemoveCartItem={handleRemoveCartItem}
            onClearCart={handleClearCart}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenPurchases={() => setIsMyPurchasesOpen(true)}
            onAddToCart={handleAddToCart}
          />
        )}

        {activePage === 'dashboard' && !currentUser && (
          <AuthPage 
            setActivePage={(page) => navigateTo(page)}
            setCurrentUser={setCurrentUser}
            onAddEstablishment={handleAddEstablishment}
            initialTab="criar"
            currentUser={currentUser}
          />
        )}

        {activePage === 'inventario' && (
          currentUser && isAuthorizedStoreStaffOrAdmin(currentUser) ? (
            <InventoryPage
              establishments={establishments}
              currentUser={currentUser}
              setActivePage={(page) => navigateTo(page)}
              onSelectEstablishment={handleSelectEstablishment}
              canGoBack={historyIndex > 0}
              onGoBack={handleGoBack}
              onGoHome={handleGoHome}
            />
          ) : (
            <AuthPage 
              setActivePage={(page) => navigateTo(page)}
              setCurrentUser={setCurrentUser}
              onAddEstablishment={handleAddEstablishment}
              initialTab="login"
              currentUser={currentUser}
            />
          )
        )}

        {activePage === 'mesas' && (
          currentUser && isAuthorizedStoreStaffOrAdmin(currentUser) ? (
            <TablesPage
              establishments={establishments}
              currentUser={currentUser}
              setActivePage={(page) => navigateTo(page)}
              onSelectEstablishment={handleSelectEstablishment}
              canGoBack={historyIndex > 0}
              onGoBack={handleGoBack}
              onGoHome={handleGoHome}
            />
          ) : (
            <AuthPage 
              setActivePage={(page) => navigateTo(page)}
              setCurrentUser={setCurrentUser}
              onAddEstablishment={handleAddEstablishment}
              initialTab="login"
              currentUser={currentUser}
            />
          )
        )}

        {activePage === 'pos_caixa' && (
          currentUser && isAuthorizedStoreStaffOrAdmin(currentUser) ? (
            <POSCashierPage
              establishments={establishments}
              currentUser={currentUser}
              setActivePage={(page) => navigateTo(page)}
              onSelectEstablishment={handleSelectEstablishment}
              canGoBack={historyIndex > 0}
              onGoBack={handleGoBack}
              onGoHome={handleGoHome}
            />
          ) : (
            <AuthPage 
              setActivePage={(page) => navigateTo(page)}
              setCurrentUser={setCurrentUser}
              onAddEstablishment={handleAddEstablishment}
              initialTab="login"
              currentUser={currentUser}
            />
          )
        )}

        {activePage === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel 
            establishments={establishments}
            setEstablishments={setEstablishments}
            deals={deals}
            setDeals={setDeals}
            payments={payments}
            setPayments={setPayments}
            submissions={submissions}
            setSubmissions={setSubmissions}
            couriers={couriers}
            setCouriers={setCouriers}
            setCurrentUser={setCurrentUser}
            setActivePage={(page) => navigateTo(page)}
            onSelectEstablishment={handleSelectEstablishment}
          />
        )}

        {activePage === 'admin' && currentUser?.role !== 'admin' && (
          <div className="px-[6vw] max-w-md mx-auto w-full py-16 text-center">
            <div className="bg-white border border-ink/15 p-8 rounded-2xl shadow-xl space-y-4">
              <div className="w-12 h-12 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="font-serif font-bold text-2xl text-indigo-deep">Painel de Gestão Geral</h2>
              <p className="text-xs text-ink/65 leading-relaxed">
                Esta área é estritamente reservada à administração do portal. Para aceder, introduza a palavra-passe mestre.
              </p>
              <button
                onClick={() => handleOpenAuth('admin')}
                className="w-full py-3 px-5 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <span>🔑 Inserir Palavra-Passe de Administrador</span>
              </button>
              <button
                onClick={() => navigateTo('home')}
                className="w-full py-2 px-4 text-xs font-semibold text-ink/50 hover:text-ink cursor-pointer"
              >
                Voltar à Página Inicial
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Shared Footer (Hidden on auth screen) */}
      {activePage !== 'auth' && (
        <Footer 
          setActivePage={(page) => navigateTo(page)} 
          onOpenAuth={handleOpenAuth}
          currentUser={currentUser}
          activePage={activePage}
        />
      )}

      {/* BUSINESS DETAIL DIALOG MODAL */}
      <EstablishmentModal 
        establishment={selectedEst}
        establishments={establishments}
        currentUser={currentUser}
        onAddToCart={handleAddToCart}
        onRequireAuth={(feat) => handleRequireAuth(feat)}
        onOpenStoreDashboard={() => {
          setSelectedEst(null);
          navigateTo('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenOrdersPanel={() => {
          setSelectedEst(null);
          setIsMyPurchasesOpen(true);
        }}
        onUpdateEstablishment={(updatedEst) => {
          const updated = establishments.map(e => e.id === updatedEst.id ? updatedEst : e);
          setEstablishments(updated);
          saveEstablishments(updated);
          setSelectedEst(updatedEst);
        }}
        onSubscribe={() => {
          setSelectedEst(null);
          navigateTo('auth');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onClose={() => {
          setSelectedEst(null);
          // Clear URL query param if present
          const url = new URL(window.location.href);
          url.searchParams.delete('id');
          window.history.pushState({}, '', url.toString());
        }}
      />

      {/* SUBMIT PROMOTION DIALOG MODAL */}
      <PromoModal 
        category={promoModal.category}
        isOpen={promoModal.isOpen}
        onClose={() => setPromoModal({ ...promoModal, isOpen: false })}
        currentUser={currentUser}
        setActivePage={(page) => navigateTo(page)}
        deals={deals}
        setDeals={setDeals}
        establishments={establishments}
      />

      {/* SHOPPING CART DRAWER */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        currentUser={currentUser}
        onRequireAuth={(feat) => handleRequireAuth(feat)}
      />

      {/* GUEST REGISTRATION ACCESS GATE MODAL */}
      <GuestAccessGateModal
        isOpen={guestGateModal.isOpen}
        featureName={guestGateModal.featureName}
        onClose={() => setGuestGateModal({ isOpen: false })}
        onGoogleAuth={() => {
          setGuestGateModal({ isOpen: false });
          handleOpenAuth('login');
        }}
        onRegister={() => {
          setGuestGateModal({ isOpen: false });
          handleOpenAuth('criar');
        }}
        onLogin={() => {
          setGuestGateModal({ isOpen: false });
          handleOpenAuth('login');
        }}
      />

      {/* CLIENT PURCHASES & ORDERS MODAL */}
      <MyPurchasesModal
        isOpen={isMyPurchasesOpen}
        onClose={() => setIsMyPurchasesOpen(false)}
        currentUser={currentUser}
      />

      {/* ADMIN / MERCHANT PAYMENT VALIDATION MANAGER MODAL */}
      <PaymentManagerModal
        isOpen={isPaymentManagerOpen}
        onClose={() => setIsPaymentManagerOpen(false)}
      />

      {/* COMMERCIAL CONSULTATION / INQUIRY MODAL */}
      <ConsultationModal
        isOpen={isConsultationOpen}
        onClose={() => setIsConsultationOpen(false)}
        initialCategory={consultationCategory}
      />

      {/* FLOATING QUICK SHOPPING CART WIDGET - Available to all users when items are in carrinha */}
      {cartItems.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 z-40 bg-[#0A1E3F] hover:bg-[#0F2D59] text-white p-4 rounded-2xl shadow-2xl border-2 border-amber-400/80 flex items-center gap-3 transition-all cursor-pointer hover:scale-105 active:scale-95"
          title="Ver produtos na carrinha / finalizar encomenda"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6 text-white" />
            <span className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center border border-white">
              {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
            </span>
          </div>
          <div className="text-left font-sans">
            <div className="text-[10px] font-bold uppercase text-amber-300">Minha Carrinha</div>
            <div className="text-xs font-serif font-bold text-white">
              {cartItems.reduce((acc, item) => acc + item.unitPriceMT * item.quantity, 0)} MT
            </div>
          </div>
        </button>
      )}

    </div>
  );
}

