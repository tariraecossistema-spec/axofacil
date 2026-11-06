import React, { useState, useEffect } from 'react';
import { Establishment, UserProfile, DeliveryPartner, InventoryItem, StockMovementRecord, FinancialTransaction, BarTable } from "../../types/types";
import { initialDeliveryPartners, getProductFallbackImage, loadInventoryItems, saveInventoryItems, loadStockMovements, saveStockMovements, loadFinancialTransactions, saveFinancialTransactions, loadBarTables, saveBarTables, isInventoryItemDeleted } from "../../data/data";
import { ensureEstablishmentCatalog, DEFAULT_CATALOGS_BY_CATEGORY } from "../../data/establishmentCatalog";
import { canManageEstablishment, unlockStoreAccess, lockStoreAccess, isStoreUnlockedInSession } from "../../services/ownership";
import { notify } from "../../services/dialogs";
import AdminEditModal from '../admin/AdminEditModal';
import ProductQuickBuyPanel from '../shared/ProductQuickBuyPanel';
import StoreLocationMap from '../shared/StoreLocationMap';
import DrawnHighlight from '../shared/DrawnHighlight';
import InventoryManager from '../managers/InventoryManager';
import TableManager from '../managers/TableManager';
import RoomManager from '../managers/RoomManager';
import YardManager from '../managers/YardManager';
import PartsManager from '../managers/PartsManager';
import StorePromoCarousel from '../shared/StorePromoCarousel';
import { POSCashierManager } from '../managers/POSCashierManager';
import { POSSettingsModal } from './POSSettingsModal';
import { X, Heart, Star, Phone, MessageSquare, Share2, MapPin, Calendar, Clock, CreditCard, Lock, Navigation, ExternalLink, ShieldCheck, Truck, Bike, Car, Calculator, CheckCircle2, CheckCircle, Check, ShoppingBag, Send, Tag, Sparkles, ChevronLeft, ChevronRight, Image as ImageIcon, Settings, Maximize2, Minimize2, Compass, Boxes, Package, Barcode, Search, Zap, Layers, Receipt, DollarSign, TrendingUp, ArrowDownCircle, ArrowUpCircle, History, Printer, RotateCcw, PlusCircle, MinusCircle, Trash2, Banknote, HelpCircle, UtensilsCrossed, Key, Wrench, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EstablishmentModalProps {
  establishment: Establishment | null;
  establishments?: Establishment[];
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSubscribe?: () => void;
  onUpdateEstablishment?: (updatedEst: Establishment) => void;
  onAddToCart?: (product: any, est: Establishment, quantity?: number) => void;
  onOpenStoreDashboard?: () => void;
  onOpenOrdersPanel?: () => void;
  onRequireAuth?: (featureName?: string) => void;
}

export default function EstablishmentModal({ 
  establishment, 
  establishments = [],
  currentUser, 
  onClose, 
  onSubscribe, 
  onUpdateEstablishment, 
  onAddToCart,
  onOpenStoreDashboard,
  onOpenOrdersPanel,
  onRequireAuth
}: EstablishmentModalProps) {

  const [isFavorited, setIsFavorited] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInstagramText, setCopiedInstagramText] = useState(false);
  const [modalTab, setModalTab] = useState<'geral' | 'catalogo' | 'pos_caixa' | 'inventario' | 'mesas' | 'promocoes' | 'localizacao'>('catalogo');
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [showStoreSettingsModal, setShowStoreSettingsModal] = useState(false);
  const [isMaximized, setIsMaximized] = useState(true);
  const [barTables, setBarTables] = useState<BarTable[]>(() => loadBarTables());
  const [financialTxs, setFinancialTxs] = useState<FinancialTransaction[]>(() => loadFinancialTransactions());

  // Store Inventory View State
  const [storeInventory, setStoreInventory] = useState<InventoryItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventorySelectedCat, setInventorySelectedCat] = useState('Todas');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'todos' | 'ok' | 'baixo' | 'esgotado'>('todos');

  // Sub-tab state inside modalTab === 'inventario'
  const [invSubTab, setInvSubTab] = useState<'caixa_pos' | 'catalogo' | 'entrada' | 'saida' | 'movimentos'>('caixa_pos');

  // POS / Balcão Caixa & Trocos State
  const [modalPosCart, setModalPosCart] = useState<Array<{
    id: string;
    inventoryItemId: string;
    name: string;
    category: string;
    unit: string;
    unitPriceMT: number;
    costPriceMT: number;
    quantity: number;
    discountMT: number;
    imageUrl?: string;
  }>>([]);
  const [modalPosPaymentMethod, setModalPosPaymentMethod] = useState<'Dinheiro' | 'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM' | 'POS Cartão'>('Dinheiro');
  const [modalPosCashGiven, setModalPosCashGiven] = useState<string>('');
  const [modalPosCustomerName, setModalPosCustomerName] = useState('');
  const [modalPosCustomerNuit, setModalPosCustomerNuit] = useState('');
  const [modalPosLastReceipt, setModalPosLastReceipt] = useState<any | null>(null);
  const [modalPosShowReceipt, setModalPosShowReceipt] = useState(false);

  // New stock entry (Entrada de Compras / Fornecedor)
  const [entryItemName, setEntryItemName] = useState('');
  const [entryCategory, setEntryCategory] = useState('Geral');
  const [entryQty, setEntryQty] = useState<number>(10);
  const [entryCost, setEntryCost] = useState<number>(100);
  const [entryPrice, setEntryPrice] = useState<number>(150);
  const [entrySupplier, setEntrySupplier] = useState('');
  const [entryInvoice, setEntryInvoice] = useState('');
  const [entryUnit, setEntryUnit] = useState('Unidade');

  // Stock exit / adjustment (Saída / Quebras / Consumo)
  const [exitItemId, setExitItemId] = useState('');
  const [exitQty, setExitQty] = useState<number>(1);
  const [exitReason, setExitReason] = useState<'saida_venda' | 'quebra_avaria' | 'ajuste_inventario' | 'devolucao'>('quebra_avaria');
  const [exitNotes, setExitNotes] = useState('');

  // Store Movements State
  const [storeMovements, setStoreMovements] = useState<StockMovementRecord[]>([]);

  // Delivery Calculator state
  const [destZone, setDestZone] = useState('Polana / Sommerschield');
  const [purchaseType, setPurchaseType] = useState<'grosso' | 'retalho'>('retalho');
  const [selectedCourierId, setSelectedCourierId] = useState<string>('');
  const [couriersList, setCouriersList] = useState<DeliveryPartner[]>([]);

  // Booking / Schedule helper date
  const [bookingDate, setBookingDate] = useState('');

  // Quick Product Action Modal Overlay State
  const [quickProduct, setQuickProduct] = useState<any | null>(null);
  const [quickQty, setQuickQty] = useState<number>(1);
  const [selectedVariant, setSelectedVariant] = useState<any | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<string>('Todos');
  const [shippingOption, setShippingOption] = useState<'pickup' | 'delivery'>('pickup');
  const [scheduleUpfrontPct, setScheduleUpfrontPct] = useState<number>(20);
  const [isScheduleMode, setIsScheduleMode] = useState<boolean>(false);

  // Top 5 Mais Vendidos para rolar no banner da loja
  const top5BannerProducts = React.useMemo(() => {
    if (!establishment) return [];
    
    const catalog = establishment.productsCatalog || [];
    let list: Array<{
      id: string;
      name: string;
      category?: string;
      imageUrl: string;
      price?: number;
      unitLabel?: string;
      rawProduct?: any;
    }> = [];

    if (catalog.length > 0) {
      list = catalog.slice(0, 5).map((p, idx) => ({
        id: p.id || `banner-prod-${idx}`,
        name: p.name,
        category: p.category || establishment.category,
        imageUrl: p.imageUrl || getProductFallbackImage(p.name, p.category || establishment.category),
        price: p.promoPriceMT || p.priceMT || 0,
        unitLabel: p.unitLabel || (establishment.category === 'supermercado' ? 'Kg' : 'Unidade'),
        rawProduct: p,
      }));
    } else if (establishment.productsList && establishment.productsList.length > 0) {
      list = establishment.productsList.slice(0, 5).map((item, idx) => {
        const nameStr = typeof item === 'string' ? item : (item as any)?.name || `Artigo ${idx + 1}`;
        return {
          id: `banner-list-${idx}`,
          name: nameStr,
          category: establishment.category,
          imageUrl: getProductFallbackImage(nameStr, establishment.category),
          price: 150 + (idx * 50),
          unitLabel: 'Unidade',
          rawProduct: { id: `prod-${idx}`, name: nameStr, priceMT: 150 + (idx * 50), category: establishment.category },
        };
      });
    }

    // Se a loja tiver menos de 5 produtos cadastrados, preenche até 5 para sempre rolar o Top 5 completo
    if (list.length < 5) {
      const defaultPicks = [
        { name: `${establishment.name} · Destaque Especial`, term: 'Destaque' },
        { name: 'Mais Vendido da Vitrine', term: 'Oferta' },
        { name: 'Promoção Oficial da Semana', term: 'Promoção' },
        { name: 'Artigo de Alta Procura', term: 'Super' },
        { name: 'Novidade & Exclusivo', term: 'Novidade' }
      ];
      const startCount = list.length;
      for (let i = startCount; i < 5; i++) {
        const pick = defaultPicks[i % defaultPicks.length];
        list.push({
          id: `banner-fill-${i}`,
          name: pick.name,
          category: establishment.category,
          imageUrl: establishment.imageUrl || getProductFallbackImage(pick.term, establishment.category),
          price: 250 + (i * 75),
          unitLabel: 'Unidade',
          rawProduct: null,
        });
      }
    }

    return list;
  }, [establishment]);

  const [bannerSlideIdx, setBannerSlideIdx] = useState(0);

  // Rotação automática suave dos 5 produtos mais vendidos no banner
  useEffect(() => {
    if (top5BannerProducts.length <= 1) return;
    const interval = setInterval(() => {
      setBannerSlideIdx((prev) => (prev + 1) % top5BannerProducts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [top5BannerProducts.length, establishment?.id]);

  // Reinicia o índice ao mudar de loja
  useEffect(() => {
    setBannerSlideIdx(0);
  }, [establishment?.id]);

  // Store credential & session unlocking state
  const [, setAuthVersion] = useState(0);
  const [showStoreCredentialModal, setShowStoreCredentialModal] = useState(false);
  const [storePinInput, setStorePinInput] = useState('');
  const [storePinError, setStorePinError] = useState('');
  const [storePinSuccess, setStorePinSuccess] = useState(false);

  useEffect(() => {
    const handleAuthChange = () => setAuthVersion(v => v + 1);
    window.addEventListener('axofacil_store_auth_changed', handleAuthChange);
    return () => window.removeEventListener('axofacil_store_auth_changed', handleAuthChange);
  }, []);

  useEffect(() => {
    if (!establishment) return;
    const favs = localStorage.getItem('axofacil_favorites');
    if (favs) {
      const parsed = JSON.parse(favs) as string[];
      setIsFavorited(parsed.includes(establishment.id));
    }

    // Load store inventory items
    const allInv = loadInventoryItems();
    const matches = allInv.filter(i => 
      (i.establishmentId === establishment.id || 
       i.establishmentId === establishment.name ||
       (i.supplier && i.supplier.toLowerCase().includes(establishment.name.toLowerCase()))) &&
      !isInventoryItemDeleted(i.id, establishment.id, i.name)
    );

    const hasAnyExistingRecords = allInv.some(i => 
      i.establishmentId === establishment.id || 
      i.establishmentId === establishment.name
    );

    if (hasAnyExistingRecords || matches.length > 0) {
      setStoreInventory(matches);
    } else {
      const ensured = ensureEstablishmentCatalog(establishment);
      const rawCatalog = (ensured.productsCatalog && ensured.productsCatalog.length > 0)
        ? ensured.productsCatalog
        : (DEFAULT_CATALOGS_BY_CATEGORY[establishment.category] || DEFAULT_CATALOGS_BY_CATEGORY['loja'] || []);

      const catalogSource = rawCatalog.filter(p => !isInventoryItemDeleted(p.id, establishment.id, p.name));

      const generated: InventoryItem[] = catalogSource.map((p, idx) => ({
        id: p.id || `inv-${establishment.id}-${idx}`,
        establishmentId: establishment.id,
        name: p.name,
        category: p.category || 'Geral',
        costPriceMT: Math.round((p.promoPriceMT || p.priceMT) * 0.70),
        sellingPriceMT: p.priceMT,
        quantityInStock: 25 + (idx * 4),
        minStockThreshold: 5,
        unit: p.unitLabel || 'Unidade',
        barcode: `6009${establishment.id.replace(/\D/g, '') || '88'}${idx.toString().padStart(4, '0')}`,
        sku: `SKU-${(establishment.category || 'EST').substring(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
        supplier: establishment.name,
        imageUrl: p.imageUrl,
        isTopSeller: idx < 3,
        salesCount: 15 + (idx * 2)
      }));
      setStoreInventory(generated);
    }

    // Load registered delivery partners
    const storedCour = localStorage.getItem('axofacil_couriers');
    if (storedCour) {
      try {
        const parsedCour = JSON.parse(storedCour) as DeliveryPartner[];
        setCouriersList(parsedCour);
        if (parsedCour.length > 0) setSelectedCourierId(parsedCour[0].id);
      } catch (e) {
        setCouriersList(initialDeliveryPartners);
        setSelectedCourierId(initialDeliveryPartners[0].id);
      }
    } else {
      setCouriersList(initialDeliveryPartners);
      setSelectedCourierId(initialDeliveryPartners[0].id);
    }
  }, [establishment]);

  const handleUpdateStoreInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>> = (updater) => {
    if (!establishment) return;
    setStoreInventory(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      const allItems = loadInventoryItems();
      const otherStores = allItems.filter(i => 
        i.establishmentId !== establishment.id && 
        i.establishmentId !== establishment.name
      );
      const merged = [...otherStores, ...next];
      saveInventoryItems(merged);
      return next;
    });
  };

  // Check if current logged-in user is platform administrator
  const isGlobalAdmin = Boolean(currentUser && currentUser.role === 'admin');

  // Check if current logged-in user is authorized manager/owner for THIS specific establishment
  const isStoreManagerOrAdmin = Boolean(establishment && canManageEstablishment(currentUser, establishment, establishments));
  const canAccessManagementTabs = isStoreManagerOrAdmin || isGlobalAdmin;
  const isAdminUser = isStoreManagerOrAdmin;
  const isStoreStaffOrAdmin = canAccessManagementTabs;

  // Check if user has created a profile account
  const hasProfileAccount = currentUser !== null && currentUser !== undefined;
  const isSubscribed = hasProfileAccount;
  const isClientOrCourier = Boolean(currentUser && (currentUser.role === 'cliente' || currentUser.role === 'entregador'));
  const isSessionUnlocked = Boolean(establishment && isStoreUnlockedInSession(establishment.id));

  // Check if current user is an authorized staff/operator explicitly assigned to this store or admin
  const isAuthorizedOperatorUser = Boolean(
    currentUser &&
    currentUser.role !== 'cliente' &&
    currentUser.role !== 'entregador' &&
    (
      currentUser.role === 'admin' ||
      currentUser.establishmentId === establishment?.id ||
      (currentUser.authorizedStores && establishment && currentUser.authorizedStores.includes(establishment.id)) ||
      (establishment?.operatorsList && currentUser.name && establishment.operatorsList.includes(currentUser.name)) ||
      (establishment?.operatorsList && currentUser.emailOrPhone && establishment.operatorsList.includes(currentUser.emailOrPhone))
    )
  );

  const canShowOperatorPinButton = !isStoreStaffOrAdmin && isAuthorizedOperatorUser;

  // Automatically protect management tabs if current user loses or does not have permissions
  useEffect(() => {
    if (!isStoreStaffOrAdmin && (modalTab === 'pos_caixa' || modalTab === 'inventario' || modalTab === 'mesas')) {
      setModalTab('catalogo');
    }
  }, [isStoreStaffOrAdmin, modalTab]);

  // Auto-slide effect for showcase gallery carousel (smoothly cycles every 3.8 seconds)
  useEffect(() => {
    if (!establishment?.gallery || establishment.gallery.length <= 1) return;
    const timer = setInterval(() => {
      setCarouselIdx((prev) => (prev + 1) % establishment.gallery!.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [establishment?.gallery]);

  if (!establishment) return null;
  const est = ensureEstablishmentCatalog(establishment);

  // Calculate estimated delivery fee based on zone
  const getDeliveryFee = (zone: string) => {
    switch (zone) {
      case 'Baixa / Alto Maé': return 150;
      case 'Polana / Sommerschield': return 200;
      case 'Xipamanine / Maxaquene': return 250;
      case 'Matola (Cidade)': return 450;
      case 'Zimpeto / Magoanine': return 400;
      case 'Boane / Tchumene': return 750;
      default: return 200;
    }
  };

  const deliveryFee = getDeliveryFee(destZone);
  const selectedCourier = couriersList.find(c => c.id === selectedCourierId) || couriersList[0];

  const toggleFavorite = () => {
    const favs = localStorage.getItem('axofacil_favorites');
    let parsed: string[] = [];
    if (favs) {
      parsed = JSON.parse(favs) as string[];
    }
    
    if (isFavorited) {
      parsed = parsed.filter(id => id !== establishment.id);
      setIsFavorited(false);
    } else {
      parsed.push(establishment.id);
      setIsFavorited(true);
    }
    
    localStorage.setItem('axofacil_favorites', JSON.stringify(parsed));
    window.dispatchEvent(new Event('axofacil_favorites_changed'));
  };

  const copyShareLink = () => {
    const url = `${window.location.origin}/?id=${establishment.id}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyInstagramShare = () => {
    const url = `${window.location.origin}/?id=${establishment.id}`;
    const text = `🛍️ Visite a nossa Vitrine Oficial no Axofácil! Maputo:\n👉 ${url}\n\n📍 ${establishment.address || 'Maputo'}\n🇲🇿 Produtos com IVA (16%) e pedidos online via M-Pesa / e-Mola!\n\n#AxofacilMaputo #Maputo #ComercioMaputo #${establishment.name.replace(/\s+/g, '')}`;
    navigator.clipboard.writeText(text);
    setCopiedInstagramText(true);
    notify('Link e legenda copiados! Cole na Bio ou Story do Instagram.', 'success');
    setTimeout(() => setCopiedInstagramText(false), 3000);
  };

  // Google Maps Search Query
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.name + ' ' + establishment.address + ' Maputo')}`;
  
  // Prefill default whatsapp link if not provided
  const whatsappUrl = establishment.whatsappLink || `https://wa.me/258840000000?text=Olá,%20vi%20o%20perfil%20do%20${encodeURIComponent(establishment.name)}%20no%20Axofácil!%20e%20gostaria%20de%20obter%20informações.`;

  const handleOpenGoogleMaps = () => {
    if (!isSubscribed) {
      if (onSubscribe) onSubscribe();
      return;
    }
    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-paper z-50 overflow-y-auto flex flex-col w-full h-full min-h-screen">
        {/* Full-Page Store Sub-Page View Window */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full flex-grow flex flex-col bg-paper text-ink"
        >
          {/* Sub-Page Top Navigation Bar */}
          <div className="sticky top-0 z-40 bg-slate-900 text-white px-4 sm:px-8 py-3 flex items-center justify-between border-b border-white/10 shadow-lg">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border border-white/15"
              >
                <span>← Voltar ao Axofácil! Maputo</span>
              </button>
              
              <div className="hidden md:flex items-center gap-2 border-l border-white/20 pl-3">
                <span className="text-xs font-bold text-amber-400 font-serif">{establishment.name}</span>
                <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                  Sub-Página de Loja Activa
                </span>
              </div>
            </div>

            {/* Profile Sync & Actions */}
            <div className="flex items-center gap-2">
              {currentUser && (
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-2.5 py-1 rounded-full text-[11px] font-bold">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sincronizado: {currentUser.name || 'Cliente'} ({currentUser.emailOrPhone || 'Sem NUIT'})</span>
                </div>
              )}

              {isStoreStaffOrAdmin && (
                <button 
                  onClick={copyShareLink}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer text-xs font-bold flex items-center gap-1"
                  title="Copiar link da vitrine de loja (Gestor/Admin)"
                >
                  {copiedLink ? <span className="text-[10px]">Copiado!</span> : <Share2 className="w-4 h-4" />}
                </button>
              )}

              <button 
                onClick={toggleFavorite}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Guardar nos meus Favoritos"
              >
                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-red-400 stroke-red-400' : 'stroke-white'}`} />
              </button>

              <button 
                onClick={onClose}
                className="p-2 rounded-xl bg-[#0B254B] hover:bg-[#071933] text-white transition-all cursor-pointer font-bold text-xs flex items-center gap-1 border border-white/20"
                title="Fechar Loja"
              >
                <X className="w-4 h-4" />
                <span className="hidden sm:inline">Sair da Loja</span>
              </button>
            </div>
          </div>

          {/* Guest Access Notice Banner */}
          {!currentUser && (
            <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#0B254B] shrink-0" />
                <span className="text-xs">
                  <strong className="text-[#0B254B] font-bold">Acesso Visitante Limitado:</strong> Crie uma conta gratuita para aceder aos contactos directos (WhatsApp/Telefone), localização GPS e fazer pedidos.
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRequireAuth ? onRequireAuth('Informações Adicionais da Loja') : (onSubscribe && onSubscribe())}
                className="py-1 px-3 bg-[#0B254B] hover:bg-[#071933] text-white font-bold text-xs rounded-xl cursor-pointer transition-all shrink-0 shadow-xs"
              >
                ✨ Criar Conta Grátis
              </button>
            </div>
          )}

          {/* Sub-Page Hero Banner com Top 5 Produtos Mais Vendidos a Rolar e Cortina Protectora */}
          <div 
            className="relative overflow-hidden p-6 sm:p-10 text-white min-h-[290px] sm:min-h-[320px] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-[#0B254B]"
            style={{ backgroundColor: establishment.coverColor && ['#0B254B', '#103B75', '#0F2E5C', '#0284C7', '#475569', '#334155', '#1E293B', '#0F172A', '#0369A1', '#0891B2', '#1E3A8A', '#1E1B4B', '#0E7490'].includes(establishment.coverColor) ? establishment.coverColor : '#0B254B' }}
          >
            {/* 1. Imagens dos 5 produtos mais vendidos da vitrine do tamanho do banner a rolar continuamente por trás do texto */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
              {top5BannerProducts.map((prod, idx) => {
                const isActive = idx === bannerSlideIdx;
                return (
                  <div
                    key={`banner-bg-${prod.id}-${idx}`}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      isActive ? 'opacity-100 z-1' : 'opacity-0 z-0 pointer-events-none'
                    }`}
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className={`w-full h-full object-cover object-center transition-transform duration-[6000ms] ease-out ${
                        isActive ? 'scale-105' : 'scale-100'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* 2. Cortina Protectora: Permite que a imagem a rolar esteja perfeitamente visível e o texto à esquerda 100% legível com alto contraste */}
            <div 
              className="absolute inset-0 z-1 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, rgba(11, 37, 75, 0.94) 0%, rgba(11, 37, 75, 0.85) 45%, rgba(11, 37, 75, 0.52) 75%, rgba(11, 37, 75, 0.35) 100%)'
              }}
            />
            {/* Cortina vertical suave para ecrãs móveis */}
            <div 
              className="absolute inset-0 z-1 pointer-events-none sm:hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(11, 37, 75, 0.94) 0%, rgba(11, 37, 75, 0.8) 55%, rgba(11, 37, 75, 0.4) 100%)'
              }}
            />
            {/* Vinheta superior e inferior para acabamento refinado */}
            <div 
              className="absolute inset-0 z-1 pointer-events-none"
              style={{
                background: 'linear-gradient(180deg, rgba(11, 37, 75, 0.35) 0%, transparent 40%, rgba(11, 37, 75, 0.6) 100%)'
              }}
            />
            {/* Textura sutil em grelha pontilhada */}
            <div className="absolute inset-0 z-2 opacity-[0.06] bg-[radial-gradient(#FFFFFF_1.5px,transparent_1.5px)] bg-[size:16px_16px] pointer-events-none" />
            
            {/* Informações do Estabelecimento (Lado Esquerdo) */}
            <div className="space-y-2.5 relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-white/15 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider py-1 px-3 rounded-full border border-white/20">
                  {establishment.category === 'loja' ? 'Supermercado & Loja Oficial' : establishment.category === 'bar' ? 'Bar & Restaurante' : 'Hospedagem & Hotel'}
                </span>
                <span className="bg-white/15 text-white text-[10px] font-bold py-1 px-2.5 rounded-full border border-white/20">
                  ✓ Vendas Grosso e Retalho
                </span>
                <span className="bg-white/15 text-white text-[10px] font-bold py-1 px-2.5 rounded-full border border-white/20">
                  🇲🇿 Impostos IVA (16%) Incluídos
                </span>
              </div>

              <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight text-white drop-shadow-xs">{establishment.name}</h1>
              
              {establishment.description && (
                <p className="text-sm text-slate-100 line-clamp-2 max-w-xl drop-shadow-xs">{establishment.description}</p>
              )}

              <div className="flex items-center gap-3 text-xs font-semibold text-slate-100 pt-1 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalTab('localizacao')}
                  className="bg-white/20 hover:bg-white/30 text-white font-bold py-1 px-3 rounded-lg border border-white/25 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <MapPin className="w-3.5 h-3.5 text-blue-200" />
                  <span>📍 {establishment.address || establishment.zone || 'Maputo Cidade'}</span>
                  <span className="bg-white/20 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded ml-1">Ver no Mapa</span>
                </button>
                <span className="bg-white/15 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-white/15">⭐ 4.9 (+250 avaliações)</span>
                <span className="bg-white/15 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-white/15">⏱️ Pedidos Online</span>
              </div>
            </div>

            {/* Lado Direito: Controlador Interativo do Top 5 da Vitrine que está a rolar no Banner */}
            <div className="relative z-10 flex flex-col items-start md:items-end gap-2.5 shrink-0 self-end md:self-center w-full md:w-auto mt-2 md:mt-0">
              {top5BannerProducts[bannerSlideIdx] && (
                <div
                  onClick={() => {
                    const activeProd = top5BannerProducts[bannerSlideIdx];
                    if (activeProd.rawProduct) {
                      setQuickProduct(activeProd.rawProduct);
                      setSelectedVariant(activeProd.rawProduct.variants && activeProd.rawProduct.variants.length > 0 ? activeProd.rawProduct.variants[0] : null);
                      setQuickQty(1);
                      setIsScheduleMode(false);
                    }
                  }}
                  className="bg-[#0B254B]/80 hover:bg-[#103B75]/95 backdrop-blur-md border border-white/25 rounded-2xl p-3 sm:p-3.5 shadow-2xl transition-all cursor-pointer group max-w-xs w-full md:w-64"
                  title={`Clique para ver detalhes de ${top5BannerProducts[bannerSlideIdx].name}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                      <span>⚡ Top {bannerSlideIdx + 1} na Vitrine</span>
                    </span>
                    <span className="text-[10px] text-slate-300 font-bold">
                      {bannerSlideIdx + 1} / {top5BannerProducts.length}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm font-bold text-white line-clamp-1 group-hover:text-blue-200 transition-colors">
                    {top5BannerProducts[bannerSlideIdx].name}
                  </p>

                  <div className="flex items-center justify-between pt-1 mt-0.5 border-t border-white/15 text-xs text-slate-200">
                    <span className="font-semibold">
                      {top5BannerProducts[bannerSlideIdx].price
                        ? `${Number(top5BannerProducts[bannerSlideIdx].price).toLocaleString('pt-MZ')} MT`
                        : 'Sob Consulta'}
                      {top5BannerProducts[bannerSlideIdx].unitLabel ? ` / ${top5BannerProducts[bannerSlideIdx].unitLabel}` : ''}
                    </span>
                    <span className="text-[10px] font-bold text-blue-200 group-hover:underline flex items-center gap-0.5">
                      Ver ⚡
                    </span>
                  </div>
                </div>
              )}

              {/* Indicadores dos 5 Produtos (Dots interativos com avanço e retrocesso) */}
              <div className="flex items-center gap-1.5 bg-[#0B254B]/70 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                {top5BannerProducts.map((_, dotIdx) => (
                  <button
                    key={`banner-dot-${dotIdx}`}
                    type="button"
                    onClick={() => setBannerSlideIdx(dotIdx)}
                    aria-label={`Ver Top ${dotIdx + 1}`}
                    className={`transition-all rounded-full cursor-pointer ${
                      dotIdx === bannerSlideIdx
                        ? 'w-6 h-2 bg-white shadow-xs'
                        : 'w-2 h-2 bg-white/40 hover:bg-white/75'
                    }`}
                  />
                ))}
                <div className="flex items-center ml-1.5 text-white/75 gap-0.5 border-l border-white/20 pl-1.5">
                  <button
                    type="button"
                    onClick={() => setBannerSlideIdx(prev => (prev - 1 + top5BannerProducts.length) % top5BannerProducts.length)}
                    className="hover:text-white p-0.5 transition-colors cursor-pointer"
                    title="Produto Anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setBannerSlideIdx(prev => (prev + 1) % top5BannerProducts.length)}
                    className="hover:text-white p-0.5 transition-colors cursor-pointer"
                    title="Próximo Produto"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Bar inside Modal */}
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-2 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              <button
                type="button"
                onClick={() => setModalTab('catalogo')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'catalogo' 
                    ? 'bg-[#0B254B] text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Catálogo de Produtos</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  modalTab === 'catalogo' ? 'bg-white/20 text-white' : 'bg-[#0B254B] text-white'
                }`}>
                  {establishment.productsCatalog?.length || establishment.productsList?.length || 0}
                </span>
              </button>

              {/* POS, Inventário e Controlo Interno: Exclusivo para Administrador de Loja, Gestor ou Operadores Autorizados com PIN */}
              {isStoreStaffOrAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => setModalTab('pos_caixa')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalTab === 'pos_caixa' 
                        ? 'bg-[#0B254B] text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    <span>Balcão de Caixa POS</span>
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      Offline-First
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('inventario')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalTab === 'inventario' 
                        ? 'bg-[#0B254B] text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <Boxes className="w-3.5 h-3.5" />
                    <span>Inventário & Stock</span>
                    <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {storeInventory.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalTab('mesas')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      modalTab === 'mesas' 
                        ? 'bg-[#0B254B] text-white shadow-xs' 
                        : 'text-slate-600 hover:bg-slate-200/60'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>
                      {(() => {
                        const cat = (establishment.category || '').toLowerCase();
                        if (cat.includes('bar') || cat.includes('restaurante')) return 'Controlo de Mesas & Consumo';
                        if (cat.includes('supermercado') || cat.includes('mercearia')) return 'Controlo de Caixas & Balcão';
                        if (cat.includes('hospedagem') || cat.includes('hotel')) return 'Controlo de Quartos & Reservas';
                        if (cat.includes('constru') || cat.includes('estaleiro')) return 'Controlo de Estaleiro & Cargas';
                        if (cat.includes('peca') || cat.includes('auto')) return 'Controlo de Peças Auto & Serviços';
                        return 'Controlo de Lojas & Balcões';
                      })()}
                    </span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setModalTab('localizacao')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'localizacao' 
                    ? 'bg-[#0B254B] text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>📍 Mapa GPS</span>
                {!hasProfileAccount && (
                  <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-slate-600" /> Perfil
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setModalTab('geral')}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'geral' 
                    ? 'bg-[#0B254B] text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <span>Informações Gerais</span>
                {!hasProfileAccount && (
                  <span className="bg-slate-200 text-slate-700 border border-slate-300 text-[9.5px] px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
                    <Lock className="w-2.5 h-2.5 text-slate-600" /> Perfil
                  </span>
                )}
              </button>

              {establishment.promotion && (
                <button
                  type="button"
                  onClick={() => setModalTab('promocoes')}
                  className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    modalTab === 'promocoes' 
                      ? 'bg-[#0B254B] text-white shadow-xs' 
                      : 'text-slate-600 hover:bg-slate-200/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Promoções ({establishment.promotion ? 1 : 0})</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
              {isAdminUser && (
                <button
                  type="button"
                  onClick={() => setShowAdminEditModal(true)}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-[#0B254B] hover:bg-[#103B75] text-white transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 border border-white/20"
                  title="Editar imagens, galeria, catálogo e textos do estabelecimento"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>👑 Editar Perfil (Admin)</span>
                </button>
              )}

              {isStoreStaffOrAdmin && (
                <button
                  type="button"
                  onClick={() => setShowStoreSettingsModal(true)}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-all cursor-pointer flex items-center gap-1.5 border border-slate-600 shadow-2xs shrink-0"
                  title="Configurar Dados de Conta, Titular da Loja, Contactos e Pagamentos"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-300" />
                  <span>⚙️ Configurações da Loja</span>
                </button>
              )}

              {isSessionUnlocked && (
                <button
                  type="button"
                  onClick={() => {
                    lockStoreAccess(establishment.id);
                    setModalTab('catalogo');
                    notify(`Sessão encerrada: Acesso temporário ao caixa de ${establishment.name} foi bloqueado.`, 'info');
                  }}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-100 transition-all cursor-pointer flex items-center gap-1 border border-slate-700 shadow-2xs shrink-0"
                  title="Encerrar turno e bloquear terminal deste estabelecimento"
                >
                  <Lock className="w-3 h-3 text-slate-400" />
                  <span>Bloquear Caixa</span>
                </button>
              )}

              {canShowOperatorPinButton && (
                <button
                  type="button"
                  onClick={() => {
                    setStorePinInput('');
                    setStorePinError('');
                    setStorePinSuccess(false);
                    setShowStoreCredentialModal(true);
                  }}
                  className="py-1.5 px-3 rounded-lg text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-all cursor-pointer flex items-center gap-1.5 border border-slate-300 shadow-2xs shrink-0"
                  title="Operadores e funcionários autorizados: introduzir PIN de caixa para operar esta loja"
                >
                  <Lock className="w-3 h-3 text-slate-700" />
                  <span>🔑 Operador / Caixa</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal Content Scroll Area */}
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-grow">
            
            {/* TAB: CATALOGO DE PRODUTOS */}
            {modalTab === 'catalogo' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                  <div>
                    <h3 className="font-serif font-bold text-lg text-indigo-deep">Catálogo de Produtos & Serviços</h3>
                    <p className="text-xs text-ink/60">Consulta os produtos disponíveis na loja com preços em Meticais MT</p>
                  </div>
                  <span className="text-xs font-bold bg-indigo-brand/10 text-indigo-brand px-3 py-1 rounded-full">
                    {establishment.salesType === 'grosso' ? 'Venda a Grosso' : establishment.salesType === 'retalho' ? 'Venda a Retalho' : 'Venda Grosso & Retalho'}
                  </span>
                </div>

                {/* Direct Vitrine Link Share Banner - Reserved for Logged-In Store Managers & Admins */}
                {isStoreStaffOrAdmin && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shadow-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase text-slate-800 tracking-wider flex items-center gap-1">
                          <Share2 className="w-3.5 h-3.5 text-[#0B254B]" />
                          <span>Link Directo de Partilha da Vitrine (Gestor / Administração)</span>
                        </span>
                        <span className="bg-slate-200 text-slate-800 text-[9px] font-bold px-2 py-0.2 rounded-full border border-slate-300">
                          Sessão Activa: {currentUser?.role || 'Gestor'}
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-[#0B254B] bg-white border border-slate-200 px-3 py-1 rounded-lg inline-block select-all">
                        {window.location.origin}/?id={establishment.id}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        Partilhe a vitrine oficial da loja diretamente com clientes no WhatsApp e redes sociais.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={copyShareLink}
                        className="py-2 px-3 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-blue-600" /> : <Share2 className="w-3.5 h-3.5 text-[#0B254B]" />}
                        <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                      </button>

                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(`Olá! Veja a vitrine e produtos de ${establishment.name} no Axofácil! Maputo: ${window.location.origin}/?id=${establishment.id}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 bg-[#0B254B] hover:bg-[#103B75] text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all text-decoration-none"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={copyInstagramShare}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                        title="Copiar link formatado para a Bio e Stories do Instagram"
                      >
                        <span className="text-sm">📸</span>
                        <span>{copiedInstagramText ? 'Copiado p/ Instagram!' : 'Instagram (Bio/Story)'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Top 5 Mais Vendidos Spotlight */}
                {establishment.productsCatalog && establishment.productsCatalog.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <h4 className="font-serif font-bold text-sm sm:text-base text-[#0B254B] flex items-center gap-2">
                        <span className="text-[#103B75] text-lg">⚡</span>
                        <span>Top 5 Mais Vendidos na Vitrine</span>
                      </h4>
                      <span className="text-[10px] font-bold text-white bg-[#0B254B] border border-white/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Rank Oficial
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                      {establishment.productsCatalog.slice(0, 5).map((prod, rankIdx) => {
                        const prodImg = prod.imageUrl || getProductFallbackImage(prod.name, prod.category);
                        const unitText = prod.unitLabel || (establishment.category === 'supermercado' ? 'Kg' : 'Unidade');
                        return (
                          <div
                            key={`${prod.id || 'rank'}-${rankIdx}`}
                            onClick={() => {
                              setQuickProduct(prod);
                              setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                              setQuickQty(1);
                              setIsScheduleMode(false);
                            }}
                            className="h-56 sm:h-64 relative rounded-2xl overflow-hidden border border-slate-200 hover:border-[#103B75] shadow-xs hover:shadow-md cursor-pointer transition-all duration-300 group flex flex-col justify-end bg-slate-900"
                            title={`Clique para ver detalhes de ${prod.name}`}
                          >
                            {/* Imagem que ocupa o quadro todo */}
                            <img
                              src={prodImg}
                              alt={prod.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                            />

                            {/* Badge do Ranking no topo esquerdo */}
                            <div className="absolute top-2.5 left-2.5 z-10 flex items-center gap-1 bg-[#0B254B] text-white font-black text-[11px] px-2.5 py-1 rounded-lg shadow-md border border-white/20 backdrop-blur-xs">
                              <span>🏆 #{rankIdx + 1}</span>
                            </div>

                            {/* Badge de Oferta / Stock no topo direito */}
                            <div className="absolute top-2.5 right-2.5 z-10 flex flex-col gap-1 items-end">
                              {prod.isPromo && (
                                <span className="bg-[#103B75] text-white font-bold text-[9px] px-2 py-0.5 rounded-md shadow-xs backdrop-blur-xs">
                                  PROMO
                                </span>
                              )}
                            </div>

                            {/* Overlay com background para permitir que textos e preços estejam 100% visíveis */}
                            <div className="relative z-10 w-full bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent pt-8 pb-2 px-2 sm:px-2.5">
                              <div className="bg-slate-950/85 backdrop-blur-md rounded-xl p-2.5 border border-white/10 shadow-lg space-y-1">
                                <div className="text-[9px] font-bold text-blue-300 uppercase tracking-wider truncate">
                                  {prod.category || 'Mais Vendido'}
                                </div>
                                <h5 className="font-bold text-xs text-white leading-tight line-clamp-1 group-hover:text-blue-200 transition-colors">
                                  {prod.name}
                                </h5>
                                <div className="flex items-baseline justify-between pt-0.5">
                                  <div className="flex items-baseline gap-1">
                                    <DrawnHighlight color="#2563EB" animated={true}>
                                      <span className="font-mono font-bold text-sm text-white">
                                        {(prod.promoPriceMT || prod.priceMT).toLocaleString('pt-MZ')} MT
                                      </span>
                                    </DrawnHighlight>
                                    <span className="text-[9px] text-slate-300 font-medium">/{unitText}</span>
                                  </div>
                                  <span className="text-[9px] font-bold text-slate-200 bg-white/15 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                    Pedir ⚡
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Catalog Subcategories Filter Pills (Alibaba Style) */}
                {establishment.productsCatalog && establishment.productsCatalog.length > 0 && (() => {
                  const subCats = Array.from(new Set(establishment.productsCatalog.map(p => p.category || 'Geral'))).filter(Boolean);
                  if (subCats.length <= 1) return null;
                  return (
                    <div className="space-y-1.5 pb-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5 text-[#0B254B]" />
                          <span>Categorias de Produtos:</span>
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">
                          {activeSubCategory === 'Todos' ? `Todos os ${establishment.productsCatalog.length} produtos` : activeSubCategory}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                        <button
                          type="button"
                          onClick={() => setActiveSubCategory('Todos')}
                          className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                            activeSubCategory === 'Todos' 
                              ? 'bg-[#0B254B] text-white shadow-xs scale-102' 
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          ✨ Todos ({establishment.productsCatalog.length})
                        </button>
                        {subCats.map((catName, idx) => {
                          const count = establishment.productsCatalog!.filter(p => (p.category || 'Geral') === catName).length;
                          return (
                            <button
                              key={`subcat-${catName}-${idx}`}
                              type="button"
                              onClick={() => setActiveSubCategory(catName)}
                              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer transition-all ${
                                activeSubCategory === catName 
                                  ? 'bg-[#0B254B] text-white shadow-xs scale-102' 
                                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                              }`}
                            >
                              {catName} ({count})
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Catalog Grid with Compact Ergonomic Vertical Layout */}
                {establishment.productsCatalog && establishment.productsCatalog.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-3.5">
                    {establishment.productsCatalog
                      .filter(prod => activeSubCategory === 'Todos' || (prod.category || 'Geral') === activeSubCategory)
                      .map((prod, catIdx) => {
                      const prodImage = prod.imageUrl || getProductFallbackImage(prod.name, prod.category);
                      const unitText = prod.unitLabel || (establishment.category === 'supermercado' ? 'Kg' : 'Unidade');
                      return (
                        <div 
                          key={`${prod.id || 'catprod'}-${catIdx}`} 
                          className="bg-white border-2 border-ink/15 hover:border-indigo-deep/50 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                        >
                          {/* Clickable Image Container */}
                          <div 
                            onClick={() => {
                              setQuickProduct(prod);
                              setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                              setQuickQty(1);
                              setIsScheduleMode(false);
                            }}
                            className="h-32 sm:h-36 bg-sand-2/30 relative overflow-hidden cursor-pointer"
                            title="Clique na imagem para ver detalhes e fazer pedido rápido"
                          >
                            <img 
                              src={prodImage} 
                              alt={prod.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                            />
                            
                            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1 items-start">
                              {prod.isPromo && (
                                <span className="bg-[#0B254B] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                                  <span>🏷️ Promo</span>
                                </span>
                              )}
                              <span className="bg-[#103B75] backdrop-blur-xs text-white text-[8.5px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                                <span className="w-1 h-1 rounded-full bg-blue-300 animate-pulse"></span>
                                <span>{prod.isAvailable !== false ? (prod.stockQty !== undefined ? `Stock: ${prod.stockQty}` : 'Em Stock') : 'Indisponível'}</span>
                              </span>
                            </div>

                            <span className="absolute bottom-1.5 right-1.5 bg-slate-950/85 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded border border-white/20 shadow-xs">
                              Detalhes ⚡
                            </span>
                          </div>

                          <div className="p-2.5 sm:p-3 space-y-1.5 flex-grow flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded truncate max-w-[110px]">
                                  {prod.category || 'Geral'}
                                </span>
                                <span className="text-[8.5px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-1 py-0.5 rounded">
                                  IVA 16%
                                </span>
                              </div>
                              
                              <h4 
                                onClick={() => {
                                  setQuickProduct(prod);
                                  setSelectedVariant(prod.variants && prod.variants.length > 0 ? prod.variants[0] : null);
                                  setQuickQty(1);
                                  setIsScheduleMode(false);
                                }}
                                className="font-sans font-bold text-xs sm:text-sm text-slate-900 group-hover:text-[#103B75] transition-colors cursor-pointer leading-snug line-clamp-2 min-h-[2rem]"
                              >
                                {prod.name}
                              </h4>
                            </div>
                            
                            <div className="pt-1">
                              {prod.isPromo && prod.promoPriceMT ? (
                                <div className="flex items-baseline flex-wrap gap-1">
                                  <DrawnHighlight color="#103B75" animated={true}>
                                    <span className="font-mono font-bold text-sm sm:text-base text-[#0B254B]">{prod.promoPriceMT} MT</span>
                                  </DrawnHighlight>
                                  <span className="text-[10px] font-bold text-slate-500">/{unitText}</span>
                                  <span className="text-[10px] text-slate-400 line-through font-mono ml-1">{prod.priceMT} MT</span>
                                </div>
                              ) : (
                                <div className="flex items-baseline gap-1">
                                  <DrawnHighlight color="#103B75" animated={true}>
                                    <span className="font-mono font-bold text-sm sm:text-base text-[#0B254B]">{prod.priceMT} MT</span>
                                  </DrawnHighlight>
                                  <span className="text-[10px] font-bold text-slate-500">/{unitText}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="p-2 bg-slate-50 border-t border-slate-200 grid grid-cols-3 gap-1 sm:gap-1.5">
                            {onAddToCart && (
                              <button
                                type="button"
                                onClick={() => {
                                  onAddToCart(prod, establishment, 1);
                                }}
                                className="py-1.5 px-1 bg-[#103B75] hover:bg-[#0B254B] text-white text-[9px] sm:text-[10px] font-extrabold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-0.5 sm:gap-1 shadow-2xs hover:shadow-xs active:scale-95 border border-white/10 whitespace-nowrap"
                                title="Adicionar 1 unidade ao carrinho"
                              >
                                <ShoppingBag className="w-3 h-3 shrink-0" />
                                <span>Carrinho</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setQuickProduct(prod);
                                setSelectedVariant(null);
                                setQuickQty(1);
                                setIsScheduleMode(false);
                              }}
                              className="py-1.5 px-1 bg-[#0B254B] hover:bg-[#103B75] text-white text-[9px] sm:text-[10px] font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-0.5 sm:gap-1 shadow-2xs hover:shadow-xs active:scale-95 border border-white/15 whitespace-nowrap"
                              title="Encomendar e comprar agora"
                            >
                              <Zap className="w-3 h-3 text-blue-200 shrink-0" />
                              <span>Pedir</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setQuickProduct(prod);
                                setSelectedVariant(null);
                                setQuickQty(1);
                                setIsScheduleMode(true);
                              }}
                              className="py-1.5 px-1 bg-slate-800 hover:bg-slate-700 text-white text-[9px] sm:text-[10px] font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-0.5 sm:gap-1 shadow-2xs hover:shadow-xs active:scale-95 border border-slate-700 whitespace-nowrap"
                              title="Agendar pedido para data futura"
                            >
                              <Calendar className="w-3 h-3 shrink-0" />
                              <span>Agendar</span>
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-ink/70 italic font-semibold">Linhas de artigos e produtos em destaque do estabelecimento:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(establishment.productsList || ['Produtos de Qualidade', 'Artigos Variados']).map((pItem, idx) => {
                        const fallbackImg = getProductFallbackImage(pItem);
                        return (
                          <div key={`pitem-${idx}`} className="bg-white border border-ink/10 rounded-xl overflow-hidden shadow-xs hover:border-indigo-brand transition-all flex flex-col justify-between group">
                            <div className="h-28 bg-sand-2/30 relative overflow-hidden">
                              <img src={fallbackImg} alt={pItem} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              <span className="absolute top-1.5 left-1.5 bg-emerald-700 text-paper text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                Em Stock
                              </span>
                            </div>
                            <div className="p-2.5 space-y-1 flex-grow">
                              <span className="text-[9px] font-bold text-ink/40 uppercase tracking-wider">Artigo</span>
                              <h4 className="font-sans font-bold text-xs text-ink group-hover:text-indigo-brand transition-colors line-clamp-2">{pItem}</h4>
                            </div>
                            <div className="p-2 bg-sand-2/15 border-t border-ink/5">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onAddToCart) {
                                    onAddToCart({ id: `item-${idx}`, name: pItem, priceMT: 250, category: 'Artigo Geral' }, establishment, 1);
                                  }
                                }}
                                className="w-full py-1.5 bg-indigo-deep hover:bg-indigo-brand text-paper text-[10px] font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1"
                              >
                                <ShoppingBag className="w-3 h-3 text-sand" />
                                <span>+ Carrinho</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: BALCÃO DE CAIXA POS OFFLINE-FIRST COMPLETO (TELA ÚNICA DEDICADA) */}
            {modalTab === 'pos_caixa' && (
              <POSCashierManager
                establishment={establishment}
                inventoryItems={storeInventory}
                setInventoryItems={handleUpdateStoreInventory}
                storeRole={isAdminUser ? 'administrador' : 'vendedor'}
                activeOperator={currentUser?.displayName || currentUser?.name || 'Operador Responsável'}
                financialTxs={financialTxs}
                setFinancialTxs={(updater) => {
                  setFinancialTxs(prev => {
                    const next = typeof updater === 'function' ? updater(prev) : updater;
                    saveFinancialTransactions(next);
                    return next;
                  });
                }}
                isStandaloneFullscreen={true}
                onClose={() => setModalTab('catalogo')}
              />
            )}

            {/* TAB: INVENTÁRIO & STOCK EM TEMPO REAL COMPLETO */}
            {modalTab === 'inventario' && (
              <InventoryManager
                establishment={establishment}
                inventoryItems={storeInventory}
                setInventoryItems={handleUpdateStoreInventory}
                storeRole={isAdminUser ? 'administrador' : 'vendedor'}
                activeOperator={currentUser?.displayName || currentUser?.name || 'Operador Responsável'}
                financialTxs={financialTxs}
                setFinancialTxs={(updater) => {
                  setFinancialTxs(prev => {
                    const next = typeof updater === 'function' ? updater(prev) : updater;
                    saveFinancialTransactions(next);
                    return next;
                  });
                }}
                onClose={() => setModalTab('catalogo')}
                onOpenPos={() => setModalTab('pos_caixa')}
                onSyncToVitrine={(item) => {
                  const catalog = establishment.productsCatalog || [];
                  const exists = catalog.some(p => p.id === item.id || p.name.toLowerCase() === item.name.toLowerCase());
                  if (!exists) {
                    const newProd = {
                      id: item.id,
                      name: item.name,
                      priceMT: item.sellingPriceMT,
                      category: item.category,
                      imageUrl: item.imageUrl,
                      stockQty: item.quantityInStock,
                      unitLabel: item.unit
                    };
                    const updatedCatalog = [newProd, ...catalog];
                    const updatedEst = { ...establishment, productsCatalog: updatedCatalog };
                    if (onUpdateEstablishment) onUpdateEstablishment(updatedEst);
                  }
                }}
              />
            )}

            {/* TAB: CONTROLO OPERACIONAL DEDICADO AO TIPO DE ESTABELECIMENTO */}
            {modalTab === 'mesas' && (() => {
              const cat = (establishment.category || '').toLowerCase();
              if (cat.includes('hospedagem') || cat.includes('hotel') || cat.includes('alojamento') || cat.includes('pousada')) {
                return (
                  <RoomManager
                    establishment={establishment}
                    inventoryItems={storeInventory}
                    activeOperator={currentUser?.displayName || currentUser?.name || 'Atendente'}
                    financialTxs={financialTxs}
                    setFinancialTxs={(updater) => {
                      setFinancialTxs(prev => {
                        const next = typeof updater === 'function' ? updater(prev) : updater;
                        saveFinancialTransactions(next);
                        return next;
                      });
                    }}
                  />
                );
              }
              if (cat.includes('constru') || cat.includes('estaleiro') || cat.includes('obra')) {
                return (
                  <YardManager
                    establishment={establishment}
                    inventoryItems={storeInventory}
                    activeOperator={currentUser?.displayName || currentUser?.name || 'Operador'}
                    financialTxs={financialTxs}
                    setFinancialTxs={(updater) => {
                      setFinancialTxs(prev => {
                        const next = typeof updater === 'function' ? updater(prev) : updater;
                        saveFinancialTransactions(next);
                        return next;
                      });
                    }}
                  />
                );
              }
              if (cat.includes('peca') || cat.includes('peça') || cat.includes('auto') || cat.includes('oficina')) {
                return (
                  <PartsManager
                    establishment={establishment}
                    inventoryItems={storeInventory}
                    activeOperator={currentUser?.displayName || currentUser?.name || 'Consultor Peças'}
                    financialTxs={financialTxs}
                    setFinancialTxs={(updater) => {
                      setFinancialTxs(prev => {
                        const next = typeof updater === 'function' ? updater(prev) : updater;
                        saveFinancialTransactions(next);
                        return next;
                      });
                    }}
                  />
                );
              }
              return (
                <TableManager
                  establishment={establishment}
                  tables={barTables}
                  setTables={(updater) => {
                    setBarTables(prev => {
                      const next = typeof updater === 'function' ? updater(prev) : updater;
                      saveBarTables(next);
                      return next;
                    });
                  }}
                  inventoryItems={storeInventory}
                  setInventoryItems={handleUpdateStoreInventory}
                  activeOperator={currentUser?.displayName || currentUser?.name || 'Atendente'}
                  financialTxs={financialTxs}
                  setFinancialTxs={(updater) => {
                    setFinancialTxs(prev => {
                      const next = typeof updater === 'function' ? updater(prev) : updater;
                      saveFinancialTransactions(next);
                      return next;
                    });
                  }}
                />
              );
            })()}

            {/* TAB: PROMOÇOES */}
            {modalTab === 'promocoes' && (
              <div className="space-y-4">
                <StorePromoCarousel 
                  establishment={establishment} 
                  currentUser={currentUser} 
                  onAddToCart={onAddToCart} 
                />
              </div>
            )}

            {/* TAB: INFORMAÇÕES GERAIS */}
            {modalTab === 'geral' && !hasProfileAccount ? (
              <div className="bg-sand-2/40 border border-ink/15 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto my-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center mx-auto shadow-sm">
                  <Lock className="w-7 h-7 text-amber-700" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-lg text-indigo-deep">Informações Gerais Protegidas</h3>
                  <p className="text-xs text-ink/75 max-w-md mx-auto leading-relaxed">
                    Para aceder a todos os dados detalhados, canais de atendimento directo, horários de expediente e galeria completa de <strong>{establishment.name}</strong>, crie ou inicie sessão no seu perfil gratuito.
                  </p>
                </div>
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (onRequireAuth) onRequireAuth('Informações Gerais da Loja');
                      else if (onSubscribe) onSubscribe();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#15243f] hover:bg-[#1f375f] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4 text-amber-400" />
                    <span>Criar Perfil Grátis / Entrar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('catalogo')}
                    className="w-full sm:w-auto px-4 py-2.5 bg-paper hover:bg-sand-2/40 text-ink font-semibold text-xs rounded-xl border border-ink/15 transition-all cursor-pointer"
                  >
                    Ver Catálogo de Produtos
                  </button>
                </div>
              </div>
            ) : (modalTab === 'geral' || modalTab === 'promocoes') && (
              <>
            {/* Carrossel Interativo de Fotos do Estabelecimento */}
            {establishment.gallery && establishment.gallery.length > 0 && (
              <div className="space-y-3 bg-sand-2/30 border border-ink/8 p-4 rounded-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-indigo-deep uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-terracotta" />
                    <span>Carrossel de Fotos da Vitrine ({establishment.gallery.length} fotos)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-ink/60 bg-paper px-2 py-0.5 rounded-full border border-ink/10">
                    {carouselIdx + 1} / {establishment.gallery.length}
                  </span>
                </div>

                {/* Main Carousel Display */}
                <div className="relative h-56 sm:h-64 rounded-xl overflow-hidden bg-slate-900 border border-ink/10 shadow-sm group">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={carouselIdx}
                      src={establishment.gallery[carouselIdx] || establishment.imageUrl}
                      alt={`Foto ${carouselIdx + 1}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.25 }}
                      className="w-full h-full object-cover"
                    />
                  </AnimatePresence>

                  {/* Left Button */}
                  {establishment.gallery.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCarouselIdx((prev) => (prev === 0 ? establishment.gallery!.length - 1 : prev - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-all border border-white/20 shadow-md cursor-pointer"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}

                  {/* Right Button */}
                  {establishment.gallery.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setCarouselIdx((prev) => (prev === establishment.gallery!.length - 1 ? 0 : prev + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-xs transition-all border border-white/20 shadow-md cursor-pointer"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  )}

                  {/* Caption Overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3 flex justify-between items-end">
                    <span className="text-xs font-semibold text-white drop-shadow-xs">
                      {establishment.name} · Foto da Vitrine #{carouselIdx + 1}
                    </span>
                    <div className="flex gap-1">
                      {establishment.gallery.map((_, dotIdx) => (
                        <button
                          key={`gallery-dot-${dotIdx}`}
                          type="button"
                          onClick={() => setCarouselIdx(dotIdx)}
                          className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                            dotIdx === carouselIdx ? 'bg-amber-400 w-4' : 'bg-white/50 hover:bg-white'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Thumbnails Row */}
                {establishment.gallery.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {establishment.gallery.map((imgUrl, gIdx) => (
                      <button
                        key={`gallery-thumb-${gIdx}`}
                        type="button"
                        onClick={() => setCarouselIdx(gIdx)}
                        className={`h-16 w-20 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                          gIdx === carouselIdx ? 'border-[#103B75] scale-105 shadow-sm' : 'border-transparent opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Promotion box if available */}
            {establishment.promotion && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 bg-[#103B75] text-white rounded-xl flex items-center justify-center flex-shrink-0 text-lg shadow-sm shadow-blue-900/20">
                    ⚡
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#0B254B] bg-slate-200 border border-slate-300 px-2 py-0.5 rounded-md">
                        Promoção Ativa Axofácil!
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        ⏱️ Tempo Limitado
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 font-bold leading-relaxed">{establishment.promotion}</p>
                    <p className="text-xs text-slate-600 mt-0.5">Preço promocional válido para encomendas diretas e visitas a esta loja em Moçambique.</p>
                  </div>
                </div>
                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto py-2.5 px-4 bg-[#0B254B] hover:bg-[#103B75] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer text-decoration-none"
                  >
                    <MessageSquare className="w-4 h-4 fill-white stroke-none" />
                    <span>Aproveitar no WhatsApp</span>
                  </a>
                )}
              </div>
            )}

            {/* Bar Services Spotlight */}
            {establishment.category === 'bar' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-serif font-bold text-xs text-[#0B254B] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-sm">🍹</span>
                    <span>Serviços de Bar & Atendimento Disponíveis</span>
                  </h4>
                  <span className="text-[10px] font-bold text-[#0B254B] bg-slate-200 px-2 py-0.5 rounded-full">
                    Gastro-Bar & Diversão
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-base mb-0.5">🎷</div>
                    <div className="text-[11px] font-bold text-[#0B254B]">Música ao Vivo & DJ</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-base mb-0.5">🍸</div>
                    <div className="text-[11px] font-bold text-[#0B254B]">Cocktails de Assinatura</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-base mb-0.5">🍢</div>
                    <div className="text-[11px] font-bold text-[#0B254B]">Petiscos & Gastro</div>
                  </div>
                  <div className="bg-white p-2 rounded-xl border border-slate-200">
                    <div className="text-base mb-0.5">🍺</div>
                    <div className="text-[11px] font-bold text-[#0B254B]">Reserva de Mesas / VIP</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick description & details */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-7 space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Sobre o estabelecimento</h3>
                  <p className="text-sm text-slate-800 leading-relaxed">{establishment.description}</p>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {establishment.features.map((feat, i) => (
                    <span key={`feat-${feat}-${i}`} className="text-[11px] font-medium py-1 px-3 rounded-full bg-slate-100 text-[#0B254B] border border-slate-200">
                      {feat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick Info Sidebar */}
              <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4.5 h-4.5 text-[#0B254B] flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Região / Bairro</div>
                    {isSubscribed ? (
                      <div className="text-xs font-bold text-slate-900">{establishment.zone}</div>
                    ) : (
                      <div className="text-xs font-semibold text-[#0B254B] flex items-center gap-1 select-none">
                        <Lock className="w-3 h-3" />
                        <span>Apenas com Subscrição</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="w-4.5 h-4.5 text-[#0B254B] flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horário / Preço</div>
                    {isSubscribed ? (
                      <div className="text-xs font-semibold text-slate-900">{establishment.metaInfo}</div>
                    ) : (
                      <div className="text-xs font-semibold text-[#0B254B] flex items-center gap-1 select-none">
                        <Lock className="w-3 h-3" />
                        <span>Apenas com Subscrição</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Star className="w-4.5 h-4.5 text-[#103B75] fill-[#103B75] flex-shrink-0" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Classificação</div>
                    <div className="text-xs font-bold text-slate-800">{establishment.rating} / 5.0</div>
                  </div>
                </div>

                {/* Contact Phone Gated Section */}
                <div className="flex items-center gap-3 pt-1 border-t border-slate-200">
                  <Phone className="w-4.5 h-4.5 text-[#103B75] flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone Directo</div>
                    {isSubscribed ? (
                      <div className="text-xs font-bold text-slate-800">{establishment.contactPhone || '+258 84 000 0000'}</div>
                    ) : (
                      <div className="text-xs font-semibold text-slate-500 flex items-center gap-1 select-none">
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span className="blur-[2.5px] font-mono">+258 84 ••• ••••</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            </>
            )}

            {/* SIMPLIFIED INTEGRATED DELIVERY CALCULATOR */}
            {(modalTab === 'geral' || modalTab === 'promocoes') && (
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white space-y-3 shadow-md">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-500/20 rounded-lg text-blue-300">
                      <Truck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif font-bold text-sm text-white">Calcular Frete de Entrega</h3>
                      <p className="text-[10px] text-slate-300">Selecione o seu destino para ver a taxa estimada</p>
                    </div>
                  </div>
                  <span className="bg-blue-900/30 text-blue-200 text-[10px] font-bold py-0.5 px-2.5 rounded-full border border-blue-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-blue-300" />
                    Frete Disponível
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Destino */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Zona / Destino da Entrega:</label>
                    <select 
                      value={destZone}
                      onChange={(e) => setDestZone(e.target.value)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-medium outline-none focus:border-blue-400"
                    >
                      <option value="Baixa / Alto Maé">Baixa / Alto Maé (150 MT)</option>
                      <option value="Polana / Sommerschield">Polana / Sommerschield (200 MT)</option>
                      <option value="Xipamanine / Maxaquene">Xipamanine / Maxaquene (250 MT)</option>
                      <option value="Matola (Cidade)">Matola Cidade (450 MT)</option>
                      <option value="Zimpeto / Magoanine">Zimpeto / Magoanine (400 MT)</option>
                      <option value="Boane / Tchumene">Boane / Tchumene (750 MT)</option>
                    </select>
                  </div>

                  {/* Modalidade */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Modalidade:</label>
                    <select 
                      value={purchaseType}
                      onChange={(e) => setPurchaseType(e.target.value as any)}
                      className="w-full p-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-medium outline-none focus:border-blue-400"
                    >
                      <option value="retalho">🛒 Compra a Retalho</option>
                      <option value="grosso">🏬 Compra a Grosso (Lote / Fardo)</option>
                    </select>
                  </div>
                </div>

                {/* Resumo do Frete & Ação Rápida */}
                <div className="bg-slate-800/90 p-3 rounded-xl border border-slate-700 flex items-center justify-between gap-2 text-xs">
                  <div>
                    <div className="text-[10px] text-slate-300">Taxa Calculada ({destZone}):</div>
                    <div className="text-base font-serif font-bold text-white">
                      {deliveryFee} MT
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${selectedCourier ? selectedCourier.phone.replace(/[^0-9]/g, '') : '258840000000'}?text=Olá%20${encodeURIComponent(selectedCourier ? selectedCourier.name : 'Entregador')},%20preciso%20de%20entrega%20de%20produtos%20da%20loja%20${encodeURIComponent(establishment.name)}%20para%20a%20zona%20${encodeURIComponent(destZone)}.%20Modalidade:%20${purchaseType}.%20Frete%20estimado:%20${deliveryFee}%20MT.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn bg-[#103B75] hover:bg-[#0B254B] text-white font-bold py-2 px-3.5 rounded-xl text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-all border border-white/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Pedir Entrega no WhatsApp</span>
                  </a>
                </div>
              </div>
            )}

            {/* TAB: LOCALIZAÇÃO & MAPA GPS */}
            {modalTab === 'localizacao' && (
              !hasProfileAccount ? (
                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 text-center space-y-4 max-w-lg mx-auto my-4 text-white shadow-xl">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center justify-center mx-auto shadow-sm">
                    <Compass className="w-7 h-7 text-blue-300" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-serif font-bold text-lg text-white">Mapa GPS & Navegação em Tempo Real</h3>
                    <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                      Para abrir o mapa interactivo OpenStreetMap, traçar rotas GPS e consultar os pontos de referência de <strong>{establishment.name}</strong>, crie o seu perfil gratuito ou inicie sessão na sua conta.
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (onRequireAuth) onRequireAuth('Mapa GPS da Loja');
                        else if (onSubscribe) onSubscribe();
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-white/20"
                    >
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>Criar Perfil Grátis / Entrar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalTab('catalogo')}
                      className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer"
                    >
                      Ver Catálogo de Produtos
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                          <Compass className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white">Localização no OpenStreetMap & Rota GPS</h3>
                          <p className="text-xs text-slate-300">Visualização de alta precisão com navegação em tempo real</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold bg-slate-800 text-blue-200 border border-slate-600 py-1 px-3 rounded-full flex items-center gap-1.5 shadow-xs">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-300" /> Localização Verificada
                      </span>
                    </div>

                    <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-2.5">
                      <div className="text-xs font-bold text-slate-200 flex items-start sm:items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-300 shrink-0 mt-0.5 sm:mt-0" />
                        <span className="text-white">{est.address || est.addressText || `${est.zone || 'Maputo'}, ${est.province || 'Moçambique'}`}</span>
                      </div>

                      {est.locationLandmarks && (
                        <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-xs text-slate-200 leading-relaxed">
                          <span className="font-bold text-white text-[11px] block mb-0.5">Ponto de Referência / Como Chegar:</span>
                          {est.locationLandmarks}
                        </div>
                      )}
                    </div>

                    {/* Leaflet OpenStreetMap Interactive Map & GPS Buttons */}
                    <StoreLocationMap
                      mode="view"
                      storeName={est.name}
                      addressText={est.addressText || est.address}
                      landmarks={est.locationLandmarks}
                      province={est.province}
                      latitude={est.latitude}
                      longitude={est.longitude}
                      height="340px"
                    />
                  </div>
                </div>
              )
            )}

            {/* LOCATION & LANDMARKS SECTION FOR GERAL TAB */}
            {modalTab === 'geral' && (
              <div className="border border-slate-700 rounded-2xl overflow-hidden bg-slate-900 p-5 space-y-4 text-white shadow-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                      <Navigation className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">Localização Exata, Pontos de Referência & Mapa</h3>
                  </div>
                  <span className="text-[10px] font-bold bg-slate-800 text-blue-200 border border-slate-600 py-0.5 px-2.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-300" /> Verificado
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-800/90 p-4 rounded-xl border border-slate-700 space-y-2">
                    <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-blue-300 shrink-0" />
                      <span className="text-white">{est.address || est.addressText || `${est.zone || 'Maputo'}, ${est.province || 'Moçambique'}`}</span>
                    </div>

                    {est.locationLandmarks && (
                      <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-xs text-slate-200 leading-relaxed">
                        <span className="font-bold text-white text-[11px] block mb-0.5">Ponto de Referência / Como Chegar:</span>
                        {est.locationLandmarks}
                      </div>
                    )}
                  </div>

                  {/* OpenStreetMap / Leaflet Interactive Location Map & Navigation Links */}
                  <div className="pt-2">
                    <StoreLocationMap
                      mode="view"
                      storeName={est.name}
                      addressText={est.addressText || est.address}
                      landmarks={est.locationLandmarks}
                      province={est.province}
                      latitude={est.latitude}
                      longitude={est.longitude}
                      height="280px"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Commissions and Guarantee Disclaimer */}
            <div className="text-[10.5px] text-ink/50 border-t border-ink/10 pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-sand-2/10 p-3.5 rounded-lg border border-ink/5">
              <div className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-brand flex-shrink-0" />
                <span>Contacto directo entre cliente e estabelecimento · Sem comissões</span>
              </div>
              <div className="font-semibold text-indigo-deep">Directório Axofácil! Maputo</div>
            </div>

          </div>

          {/* Modal Actions Footer */}
          <div className="p-5 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3">
            {isSubscribed ? (
              <a 
                href={whatsappUrl} 
                target="_blank" 
                rel="noreferrer"
                className="btn flex-1 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 font-semibold text-center rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all shadow-sm shadow-[#25D366]/20"
              >
                <MessageSquare className="w-5 h-5 fill-white stroke-none" />
                <span>Contactar Proprietário por WhatsApp</span>
              </a>
            ) : (
              <button 
                onClick={() => {
                  if (onRequireAuth) onRequireAuth('Contacto Directo de WhatsApp');
                  else if (onSubscribe) onSubscribe();
                }}
                className="btn flex-1 py-3.5 bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center gap-2 font-semibold text-center rounded-xl cursor-pointer shadow-md shadow-[#25D366]/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <MessageSquare className="w-4 h-4 fill-white stroke-none" />
                <span>Desbloquear WhatsApp (Criar Conta Grátis)</span>
              </button>
            )}

            <button 
              onClick={onClose}
              className="btn bg-white border border-slate-200 py-3.5 px-6 font-semibold hover:bg-slate-100 text-slate-700 rounded-xl cursor-pointer transition-all"
            >
              Voltar
            </button>
          </div>

        </motion.div>
      </div>

      {/* Quick Product Action Modal Overlay */}
      <ProductQuickBuyPanel
        establishment={establishment}
        quickProduct={quickProduct}
        setQuickProduct={setQuickProduct}
        selectedVariant={selectedVariant}
        setSelectedVariant={setSelectedVariant}
        quickQty={quickQty}
        setQuickQty={setQuickQty}
        shippingOption={shippingOption}
        setShippingOption={setShippingOption}
        destZone={destZone}
        setDestZone={setDestZone}
        deliveryFee={deliveryFee}
        scheduleUpfrontPct={scheduleUpfrontPct}
        setScheduleUpfrontPct={setScheduleUpfrontPct}
        isScheduleMode={isScheduleMode}
        setIsScheduleMode={setIsScheduleMode}
        bookingDate={bookingDate}
        setBookingDate={setBookingDate}
        onAddToCart={onAddToCart}
      />


      {/* Admin Quick Edit Modal */}
      {showAdminEditModal && establishment && (
        <AdminEditModal
          isOpen={showAdminEditModal}
          onClose={() => setShowAdminEditModal(false)}
          establishmentToEdit={establishment}
          categoryHint={establishment.category}
          onSave={(updatedEst) => {
            if (onUpdateEstablishment) {
              onUpdateEstablishment(updatedEst);
            }
            setShowAdminEditModal(false);
          }}
        />
      )}

      {/* Store Account & Payment Settings Modal */}
      {showStoreSettingsModal && establishment && (
        <POSSettingsModal
          isOpen={showStoreSettingsModal}
          onClose={() => setShowStoreSettingsModal(false)}
          establishment={establishment}
          onSave={(updatedEst) => {
            if (onUpdateEstablishment) {
              onUpdateEstablishment(updatedEst);
            }
            setShowStoreSettingsModal(false);
          }}
        />
      )}

      {/* Authorized Operator Store Credential PIN Modal */}
      {showStoreCredentialModal && establishment && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 text-white max-w-sm w-full shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Acesso de Balcão & Loja</h4>
                  <p className="text-[10px] text-slate-400 truncate max-w-[190px]">{establishment.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStoreCredentialModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Introduza o PIN de operador autorizado ou credencial de caixa de <strong>{establishment.name}</strong> para desbloquear os menus de balcão POS, inventário e controlo de consumo durante a sessão.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setStorePinError('');
                const success = unlockStoreAccess(establishment.id, storePinInput, establishment);
                if (success) {
                  setStorePinSuccess(true);
                  setTimeout(() => {
                    setShowStoreCredentialModal(false);
                    setStorePinSuccess(false);
                    setModalTab('pos_caixa');
                    notify(`Acesso autorizado com sucesso para gerir o balcão de ${establishment.name}.`, 'success');
                  }, 400);
                } else {
                  setStorePinError('PIN ou palavra-passe incorreta para este estabelecimento.');
                }
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  PIN ou Senha de Caixa:
                </label>
                <input
                  type="password"
                  value={storePinInput}
                  onChange={(e) => {
                    setStorePinInput(e.target.value);
                    setStorePinError('');
                  }}
                  placeholder="Ex: 1234 ou senha"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 focus:border-blue-400 rounded-xl text-white text-sm outline-none tracking-widest font-mono text-center"
                  autoFocus
                />
                {storePinError && (
                  <p className="text-[11px] text-rose-400 font-bold mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {storePinError}
                  </p>
                )}
                {storePinSuccess && (
                  <p className="text-[11px] text-blue-300 font-bold mt-1.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> PIN validado com sucesso! A carregar balcão...
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowStoreCredentialModal(false)}
                  className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-all cursor-pointer border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!storePinInput.trim()}
                  className="flex-1 py-2 px-3 bg-[#103B75] hover:bg-[#0B254B] disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs border border-white/20"
                >
                  Desbloquear
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

