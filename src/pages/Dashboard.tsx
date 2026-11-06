import React, { useState, useEffect, useMemo } from 'react';
import { UserProfile, Establishment, PromoDeal, OrderRecord, CustomerRecord, FinancialTransaction, ProductItem, InventoryItem, BarTable, OperatorLoginRecord, CartItem } from "../types/types";
import { loadOrders, saveOrders, loadCustomers, saveCustomers, loadFinancialTransactions, saveFinancialTransactions, loadInventoryItems, saveInventoryItems, loadBarTables, saveBarTables, loadOperatorLogins, saveOperatorLogins, saveEstablishments, saveDeals, isInventoryItemDeleted } from "../data/data";
import { loadPaymentOrders } from "../services/paymentStore";
import { recordOfflineChange } from "../services/offlineSync";
import { resolveMyEstablishment } from "../services/ownership";
import { LayoutDashboard, Award, Sparkles, Heart, Star, Phone, MessageSquare, Trash2, Edit3, CheckCircle, BarChart3, Settings, ShieldAlert, ShoppingBag, Users, DollarSign, Plus, ArrowUpCircle, ArrowDownCircle, FileSpreadsheet, Calendar, Filter, Check, X, Tag, Clock, Lock, Printer, Store, Image, PlusCircle, UserPlus, Eye, MapPin, Calculator, Download, Coins, Banknote, RefreshCw, Upload, RotateCcw, TrendingUp, PieChart, Activity, ShieldCheck, UserCheck, UserX, Boxes, Beer, Flame, Share2, Copy, ExternalLink, MessageCircle, Building2, Key, Truck, CreditCard, Wrench, LogOut, Receipt } from 'lucide-react';
import InventoryManager from '../components/managers/InventoryManager';
import TableManager from '../components/managers/TableManager';
import RoomManager from '../components/managers/RoomManager';
import YardManager from '../components/managers/YardManager';
import PartsManager from '../components/managers/PartsManager';
import { POSCashierManager } from '../components/managers/POSCashierManager';
import StoreLocationMap from '../components/shared/StoreLocationMap';
import { syncEstablishmentToSupabase, uploadFileToStorage as uploadToImgBB } from "../services/supabase";
import { notify } from "../services/dialogs";
import { getProfileDisplayInfo } from "../data/userProfiles";

interface DashboardProps {
  currentUser: UserProfile;
  setCurrentUser?: (user: UserProfile | null) => void;
  establishments: Establishment[];
  setEstablishments: (ests: Establishment[]) => void;
  deals: PromoDeal[];
  setDeals: (dls: PromoDeal[]) => void;
  onSelectEstablishment: (est: Establishment) => void;
  setActivePage: (page: any) => void;
  cartCount?: number;
  cartItems?: CartItem[];
  onUpdateCartQuantity?: (cartItemId: string, newQty: number) => void;
  onRemoveCartItem?: (cartItemId: string) => void;
  onClearCart?: () => void;
  onOpenCart?: () => void;
  onOpenPurchases?: () => void;
  onAddToCart?: (product: ProductItem, est: Establishment) => void;
}

export default function Dashboard({ 
  currentUser, 
  setCurrentUser,
  establishments, 
  setEstablishments, 
  deals, 
  setDeals, 
  onSelectEstablishment, 
  setActivePage,
  cartCount = 0,
  cartItems = [],
  onUpdateCartQuantity,
  onRemoveCartItem,
  onClearCart,
  onOpenCart,
  onOpenPurchases,
  onAddToCart
}: DashboardProps) {
  // Client States
  const [favorites, setFavorites] = useState<Establishment[]>([]);
  const [clientActiveTab, setClientActiveTab] = useState<'geral' | 'carrinha' | 'pedidos' | 'promocoes' | 'favoritos'>('geral');
  const [clientSelectedCategory, setClientSelectedCategory] = useState<string>('todos');
  const [myOrdersList, setMyOrdersList] = useState<OrderRecord[]>([]);
  
  // Business Owner States
  const [myEstablishment, setMyEstablishment] = useState<Establishment | null>(null);
  const [businessTab, setBusinessTab] = useState<'resumo' | 'vitrina' | 'pos_caixa' | 'inventario' | 'mesas' | 'operadores' | 'pedidos' | 'clientes' | 'financeiro'>('resumo');
  const [editMode, setEditMode] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDesc, setEditedDesc] = useState('');
  const [editedAddress, setEditedAddress] = useState('');
  const [editedPhone, setEditedPhone] = useState('');
  const [editedPromo, setEditedPromo] = useState('');
  const [editedImageUrl, setEditedImageUrl] = useState('');
  const [editedLandmarks, setEditedLandmarks] = useState('');
  const [editedMetaInfo, setEditedMetaInfo] = useState('');
  const [editedSalesType, setEditedSalesType] = useState<'grosso' | 'retalho' | 'ambos'>('ambos');
  const [editedLat, setEditedLat] = useState<number | undefined>(undefined);
  const [editedLng, setEditedLng] = useState<number | undefined>(undefined);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Active Operator State & Multi-Turno Open Shifts
  const [activeOperator, setActiveOperator] = useState<string>('');
  const [openShifts, setOpenShifts] = useState<string[]>(() => {
    const saved = localStorage.getItem('axofacil_open_shifts');
    return saved ? JSON.parse(saved) : [];
  });
  const [newOperatorInput, setNewOperatorInput] = useState<string>('');
  const [deletedOperators, setDeletedOperators] = useState<{ id: string; name: string; deletedAt: string }[]>(() => {
    const saved = localStorage.getItem('axofacil_deleted_operators');
    return saved ? JSON.parse(saved) : [];
  });

  // Vitrina & Products Catalog State
  const [newGalleryUrlInput, setNewGalleryUrlInput] = useState<string>('');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number>(0);
  const [newProdPromoPrice, setNewProdPromoPrice] = useState<number>(0);
  const [newProdIsPromo, setNewProdIsPromo] = useState(false);
  const [newProdCategory, setNewProdCategory] = useState('Geral');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

  // Client User Profile Edit State
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(currentUser.name || '');
  const [profilePhoneInput, setProfilePhoneInput] = useState(currentUser.phone || '');
  const [profileCityInput, setProfileCityInput] = useState(currentUser.city || 'Maputo');

  // Financial Calculator States
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcMode, setCalcMode] = useState<'simples' | 'notas' | 'troco'>('simples');
  const [calcExpr, setCalcExpr] = useState<string>('0');
  
  // Meticais Notes Counter
  const [n1000, setN1000] = useState<number>(0);
  const [n500, setN500] = useState<number>(0);
  const [n200, setN200] = useState<number>(0);
  const [n100, setN100] = useState<number>(0);
  const [n50, setN50] = useState<number>(0);
  const [n20, setN20] = useState<number>(0);
  const [nCoins, setNCoins] = useState<number>(0);

  // Troco Calculator
  const [trocoPrice, setTrocoPrice] = useState<number>(0);
  const [trocoPaid, setTrocoPaid] = useState<number>(0);

  // Business Data States (SaaS Features)
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [financialTxs, setFinancialTxs] = useState<FinancialTransaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [barTables, setBarTables] = useState<BarTable[]>([]);
  const [operatorLogins, setOperatorLogins] = useState<OperatorLoginRecord[]>([]);
  const [copiedVitrineLink, setCopiedVitrineLink] = useState(false);

  // Filtered views ensuring store data isolation
  const storeOrders = currentUser?.role === 'admin'
    ? orders
    : orders.filter(ord => 
        (myEstablishment && ord.establishmentId === myEstablishment.id) ||
        (myEstablishment && ord.establishmentName?.toLowerCase().trim() === myEstablishment.name?.toLowerCase().trim())
      );

  const storeCustomers = currentUser?.role === 'admin'
    ? customers
    : customers.filter(c => myEstablishment && c.establishmentId === myEstablishment.id);

  const storeFinancialTxs = currentUser?.role === 'admin'
    ? financialTxs
    : financialTxs.filter(t => myEstablishment && t.establishmentId === myEstablishment.id);

  // Store Inventory Isolation & Auto-population from Products Catalog
  const storeInventoryItems = useMemo(() => {
    if (!myEstablishment) return inventoryItems;
    const directMatches = inventoryItems.filter(item => 
      item.establishmentId === myEstablishment.id || 
      item.establishmentId === myEstablishment.name ||
      (currentUser?.role === 'admin' && item.establishmentId === 'all')
    );

    // If store has catalog items not in inventory, auto-populate them
    const catalog = myEstablishment.productsCatalog || [];
    const missingCatalogItems: InventoryItem[] = [];

    catalog.forEach((catItem, idx) => {
      // Do not auto-populate items previously deleted by the user
      if (isInventoryItemDeleted(catItem.id, myEstablishment.id, catItem.name)) {
        return;
      }
      const alreadyExists = directMatches.some(inv => 
        inv.id === catItem.id || 
        inv.name.toLowerCase().trim() === catItem.name.toLowerCase().trim()
      );
      if (!alreadyExists) {
        const estCost = Math.round((catItem.promoPriceMT || catItem.priceMT) * 0.70);
        missingCatalogItems.push({
          id: catItem.id || `inv-${myEstablishment.id}-${idx}`,
          establishmentId: myEstablishment.id,
          name: catItem.name,
          category: catItem.category || 'Geral',
          costPriceMT: estCost,
          sellingPriceMT: catItem.priceMT,
          quantityInStock: 20 + (idx * 5),
          minStockThreshold: 5,
          unit: catItem.unitLabel || 'Unidade',
          barcode: `6009${myEstablishment.id.replace(/\D/g, '') || '99'}${idx.toString().padStart(4, '0')}`,
          sku: `SKU-${myEstablishment.id.toUpperCase()}-${idx + 1}`,
          supplier: myEstablishment.name,
          imageUrl: catItem.imageUrl,
          isTopSeller: idx < 2,
          salesCount: 12 + (idx * 4)
        });
      }
    });

    const combined = [...directMatches, ...missingCatalogItems];
    return combined.length > 0 ? combined : directMatches;
  }, [inventoryItems, myEstablishment, currentUser]);

  const setStoreInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>> = (newItemsOrUpdater) => {
    setInventoryItems(prevAll => {
      const currentStoreItems = storeInventoryItems;
      const nextStoreItems = typeof newItemsOrUpdater === 'function' 
        ? (newItemsOrUpdater as (prev: InventoryItem[]) => InventoryItem[])(currentStoreItems) 
        : newItemsOrUpdater;
      
      const otherStoreItems = prevAll.filter(item => 
        item.establishmentId !== myEstablishment?.id && 
        item.establishmentId !== myEstablishment?.name
      );
      
      const merged = [...otherStoreItems, ...nextStoreItems];
      saveInventoryItems(merged);
      return merged;
    });
  };

  // Store Session Access Mode (Administrador da Loja vs. Vendedor / Operador)
  const [storeRole, setStoreRole] = useState<'administrador' | 'vendedor'>(() => {
    const saved = localStorage.getItem('axofacil_store_role');
    return (saved as 'administrador' | 'vendedor') || 'administrador';
  });
  const [showRoleLoginModal, setShowRoleLoginModal] = useState(false);
  const [rolePinInput, setRolePinInput] = useState('');
  const [rolePinError, setRolePinError] = useState('');

  // Operator Edit Form State
  const [editingOperatorOldName, setEditingOperatorOldName] = useState<string | null>(null);
  const [editingOperatorNewName, setEditingOperatorNewName] = useState('');

  // Form State for Adding/Editing Financial Transaction & Trash Backup
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<FinancialTransaction | null>(null);
  const [txDate, setTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showFechoCaixaModal, setShowFechoCaixaModal] = useState(false);
  const [showFinTrashModal, setShowFinTrashModal] = useState(false);
  const [deletedFinancialTxs, setDeletedFinancialTxs] = useState<{ id: string; tx: FinancialTransaction; deletedAt: string }[]>(() => {
    const saved = localStorage.getItem('axofacil_deleted_financial_txs');
    return saved ? JSON.parse(saved) : [];
  });
  const [finFilterType, setFinFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [finFilterMethod, setFinFilterMethod] = useState<string>('todos');
  const [finFilterOperator, setFinFilterOperator] = useState<string>('todos');
  const [txType, setTxType] = useState<'receita' | 'despesa'>('receita');
  const [txCategory, setTxCategory] = useState<FinancialTransaction['category']>('Vendas de Produtos');
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState<number>(0);
  const [txPayMethod, setTxPayMethod] = useState<'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM' | 'Dinheiro' | 'POS Cartão'>('M-Pesa');
  const [txCustomer, setTxCustomer] = useState('');
  const [txOperator, setTxOperator] = useState('');

  // Form State for Adding CRM Customer
  const [showAddCustModal, setShowAddCustModal] = useState(false);
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custNotes, setCustNotes] = useState('');
  const [custTagInput, setCustTagInput] = useState('');

  useEffect(() => {
    // Load SaaS Data
    setOrders(loadOrders());
    setCustomers(loadCustomers());
    setFinancialTxs(loadFinancialTransactions());
    setInventoryItems(loadInventoryItems());
    setBarTables(loadBarTables());
    setOperatorLogins(loadOperatorLogins());

    // 1. If Client: load bookmarks and isolated client orders
    if (currentUser.role === 'cliente') {
      loadClientFavorites();
      loadClientOrders();
    } else {
      // 2. If Business: load ONLY the establishment this account actually owns/manages.
      const matched = resolveMyEstablishment(currentUser, establishments);

      if (matched) {
        setMyEstablishment(matched);
        setEditedName(matched.name);
        setEditedDesc(matched.description);
        setEditedAddress(matched.address);
        setEditedPhone(matched.contactPhone || '');
        setEditedPromo(matched.promotion || '');
        setEditedImageUrl(matched.imageUrl || '');
        setEditedLandmarks(matched.locationLandmarks || '');
        setEditedMetaInfo(matched.metaInfo || '');
        setEditedSalesType(matched.salesType || 'ambos');
        setEditedLat(matched.latitude);
        setEditedLng(matched.longitude);
        const defaultOp = matched.operatorsList?.[0] || 'Atendente';
        setActiveOperator(defaultOp);
        setTxOperator(defaultOp);
      } else {
        setMyEstablishment(null);
      }
    }

    // Listen for events: favorites, orders, and payments
    const handleFavChange = () => {
      loadClientFavorites();
    };
    const handleOrdersChange = () => {
      loadClientOrders();
    };
    window.addEventListener('axofacil_favorites_changed', handleFavChange);
    window.addEventListener('axofacil_orders_updated', handleOrdersChange);
    window.addEventListener('axofacil_payment_orders_updated', handleOrdersChange);
    return () => {
      window.removeEventListener('axofacil_favorites_changed', handleFavChange);
      window.removeEventListener('axofacil_orders_updated', handleOrdersChange);
      window.removeEventListener('axofacil_payment_orders_updated', handleOrdersChange);
    };
  }, [currentUser, establishments]);

  const loadClientOrders = () => {
    if (!currentUser) {
      setMyOrdersList([]);
      return;
    }

    const rawDirects = loadOrders();
    const rawPayments = loadPaymentOrders();

    const rawUserPhone = (currentUser.phone || currentUser.emailOrPhone || '').replace(/\D/g, '');
    const rawUserEmail = (currentUser.email || (currentUser.emailOrPhone.includes('@') ? currentUser.emailOrPhone : '')).toLowerCase().trim();
    const userIdent = currentUser.id || currentUser.emailOrPhone;
    const userName = (currentUser.name || '').toLowerCase().trim();

    // Map payment orders strictly for this user
    const mappedPayments: OrderRecord[] = rawPayments
      .filter(p => {
        if (p.userId && (p.userId === userIdent || p.userId === currentUser.id || p.userId === currentUser.emailOrPhone)) return true;
        if (rawUserEmail && p.customerEmail && p.customerEmail.toLowerCase().trim() === rawUserEmail) return true;
        if (rawUserPhone && p.customerPhone) {
          const pPhone = p.customerPhone.replace(/\D/g, '');
          if (pPhone && (pPhone === rawUserPhone || pPhone.endsWith(rawUserPhone) || rawUserPhone.endsWith(pPhone))) return true;
        }
        if (userName && p.customerName && p.customerName.toLowerCase().trim() === userName) return true;
        return false;
      })
      .map(p => ({
        id: p.id,
        userId: p.userId || userIdent,
        establishmentId: p.establishmentId || 'geral',
        establishmentName: p.establishmentName || 'Axofácil Moçambique',
        category: (p.targetType === 'loja' ? 'loja' : 'servico') as any,
        customerName: p.customerName,
        customerPhone: p.customerPhone,
        customerEmail: p.customerEmail,
        orderType: 'pedido_compra',
        itemsOrService: p.orderItemsSummary || 'Produtos do Catálogo',
        totalAmount: p.totalAmountMT,
        paymentMethod: p.paymentMethod === 'transferencia_bancaria' ? 'Transferência BCI/BIM' : (p.paymentMethod === 'mpesa' ? 'M-Pesa' : 'e-Mola'),
        status: (p.status === 'confirmado' ? 'Confirmado' : p.status === 'rejeitado' ? 'Cancelado' : 'Pendente') as any,
        date: p.createdAt ? p.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
        time: p.createdAt ? new Date(p.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '12:00',
        deliveryOption: p.deliveryOption,
        deliveryAddress: p.deliveryAddress,
        notes: p.referenceNumber ? `Ref: ${p.referenceNumber}` : undefined
      }));

    const matchedDirects = rawDirects.filter(d => {
      if (d.userId && (d.userId === userIdent || d.userId === currentUser.id || d.userId === currentUser.emailOrPhone)) return true;
      if (rawUserEmail && d.customerEmail && d.customerEmail.toLowerCase().trim() === rawUserEmail) return true;
      if (rawUserPhone && d.customerPhone) {
        const dPhone = d.customerPhone.replace(/\D/g, '');
        if (dPhone && (dPhone === rawUserPhone || dPhone.endsWith(rawUserPhone) || rawUserPhone.endsWith(dPhone))) return true;
      }
      if (userName && d.customerName && d.customerName.toLowerCase().trim() === userName) return true;
      return false;
    });

    // Merge and deduplicate by id
    const seen = new Set<string>();
    const merged: OrderRecord[] = [];
    [...matchedDirects, ...mappedPayments].forEach(ord => {
      if (!seen.has(ord.id)) {
        seen.add(ord.id);
        merged.push(ord);
      }
    });

    setMyOrdersList(merged);
  };

  const loadClientFavorites = () => {
    const favs = localStorage.getItem('axofacil_favorites');
    if (favs) {
      const parsedIds = JSON.parse(favs) as string[];
      const matched = establishments.filter(e => parsedIds.includes(e.id));
      setFavorites(matched);
    } else {
      setFavorites([]);
    }
  };

  const removeFavorite = (id: string) => {
    const favs = localStorage.getItem('axofacil_favorites');
    if (favs) {
      let parsed = JSON.parse(favs) as string[];
      parsed = parsed.filter(fid => fid !== id);
      localStorage.setItem('axofacil_favorites', JSON.stringify(parsed));
      loadClientFavorites();
    }
  };

  const handleOrderDealPresencial = (deal: PromoDeal) => {
    const existingEst = establishments.find(e => e.id === deal.establishmentId || e.name === deal.establishmentName);
    const targetEst: Establishment = existingEst || (establishments[0] ? {
      ...establishments[0],
      id: deal.establishmentId || 'promo-est',
      name: deal.establishmentName || establishments[0].name
    } : {
      id: deal.establishmentId || 'promo-est',
      name: deal.establishmentName || 'Estabelecimento Parceiro',
      category: (deal.category as any) || 'loja',
      zone: deal.zone || 'Maputo',
      address: deal.zone || 'Maputo',
      description: 'Estabelecimento Parceiro',
      rating: 4.8,
      reviewCount: 1,
      latitude: -25.9692,
      longitude: 32.5732,
      hasIntegratedDelivery: true,
      isVerified: true,
      metaInfo: 'Loja Verificada',
      coverColor: 'bg-indigo-900',
      features: ['Atendimento Presencial'],
      visits: 0,
      searches: 0,
      salesOrReservations: 0
    });

    const priceMatch = (deal.discount + ' ' + (deal.description || '')).match(/(\d+[\d\s.,]*)\s*(?:MT|MZN)/i);
    const parsedPrice = priceMatch ? parseFloat(priceMatch[1].replace(/\s/g, '').replace(',', '.')) : 0;
    const finalPrice = parsedPrice > 0 ? parsedPrice : 150;

    const promoProduct: ProductItem = {
      id: deal.id ? `promo-${deal.id}` : `promo-${Date.now()}`,
      name: `[Promoção] ${deal.title}`,
      description: deal.description || `Oferta especial: ${deal.discount}`,
      priceMT: finalPrice,
      promoPriceMT: finalPrice,
      isAvailable: true
    };

    if (onAddToCart) {
      onAddToCart(promoProduct, targetEst);
      notify(`Promoção "${deal.title}" adicionada à tua carrinha para requisição presencial / balcão.`, 'success');
      setClientActiveTab('carrinha');
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myEstablishment) return;

    const updatedEstablishment: Establishment = {
      ...myEstablishment,
      name: editedName,
      description: editedDesc,
      address: editedAddress,
      addressText: editedAddress,
      latitude: editedLat,
      longitude: editedLng,
      contactPhone: editedPhone,
      promotion: editedPromo || undefined,
      imageUrl: editedImageUrl || myEstablishment.imageUrl,
      locationLandmarks: editedLandmarks || undefined,
      metaInfo: editedMetaInfo || myEstablishment.metaInfo,
      salesType: editedSalesType
    };

    const updated = establishments.map(est => {
      if (est.id === myEstablishment.id) {
        return updatedEstablishment;
      }
      return est;
    });

    // Update Top 10 promotions list too if owner modified the promo text
    let updatedDeals = [...deals];
    if (editedPromo) {
      updatedDeals = deals.map(deal => {
        if (deal.establishmentId === myEstablishment.id) {
          return {
            ...deal,
            title: editedName,
            subtitle: editedPromo
          };
        }
        return deal;
      });
    }

    setEstablishments(updated);
    setDeals(updatedDeals);
    
    // Save to localstorage and storage utility
    saveEstablishments(updated);
    saveDeals(updatedDeals);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updated));
      localStorage.setItem('axofacil_deals', JSON.stringify(updatedDeals));
    } catch (e) {}

    // Sync to Supabase in background
    syncEstablishmentToSupabase(updatedEstablishment).catch(console.warn);
    recordOfflineChange();

    // Update state
    setMyEstablishment(updatedEstablishment);

    setSaveSuccess(true);
    setEditMode(false);
    notify('Perfil e localização guardados com sucesso!', 'success');
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Open Create Product Modal
  const handleOpenAddProduct = () => {
    setEditingProductId(null);
    setNewProdName('');
    setNewProdPrice(0);
    setNewProdPromoPrice(0);
    setNewProdIsPromo(false);
    setNewProdCategory('Geral');
    setNewProdImageUrl('');
    setNewProdDesc('');
    setShowAddProductModal(true);
  };

  // Open Edit Product Modal
  const handleOpenEditProduct = (prod: ProductItem) => {
    setEditingProductId(prod.id);
    setNewProdName(prod.name);
    setNewProdPrice(prod.priceMT || 0);
    setNewProdPromoPrice(prod.promoPriceMT || 0);
    setNewProdIsPromo(Boolean(prod.isPromo));
    setNewProdCategory(prod.category || 'Geral');
    setNewProdImageUrl(prod.imageUrl || '');
    setNewProdDesc(prod.description || '');
    setShowAddProductModal(true);
  };

  // Add or Update Product in Catalog
  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myEstablishment || !newProdName || !newProdPrice) return;

    const currentCatalog = myEstablishment.productsCatalog || myEstablishment.products || [];
    let updatedCatalog: ProductItem[];

    if (editingProductId) {
      updatedCatalog = currentCatalog.map(p => p.id === editingProductId ? {
        ...p,
        name: newProdName,
        priceMT: Number(newProdPrice),
        promoPriceMT: newProdPromoPrice ? Number(newProdPromoPrice) : undefined,
        isPromo: newProdIsPromo,
        category: newProdCategory || 'Geral',
        imageUrl: newProdImageUrl || undefined,
        description: newProdDesc || undefined
      } : p);
      notify(`Produto "${newProdName}" actualizado com sucesso!`, 'success');
    } else {
      const newProd: ProductItem = {
        id: 'prod-' + Date.now(),
        name: newProdName,
        priceMT: Number(newProdPrice),
        promoPriceMT: newProdPromoPrice ? Number(newProdPromoPrice) : undefined,
        isPromo: newProdIsPromo,
        category: newProdCategory || 'Geral',
        imageUrl: newProdImageUrl || undefined,
        description: newProdDesc || undefined
      };
      updatedCatalog = [newProd, ...currentCatalog];
      notify(`Produto "${newProdName}" adicionado ao catálogo!`, 'success');
    }

    const updatedEstablishment = {
      ...myEstablishment,
      products: updatedCatalog,
      productsCatalog: updatedCatalog
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    saveEstablishments(updatedEstList);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));
    } catch (err) {}

    // Synchronize to InventoryItems as well
    if (editingProductId) {
      setInventoryItems(prev => {
        const next = prev.map(inv => {
          if (inv.id === editingProductId || inv.name.toLowerCase() === newProdName.toLowerCase()) {
            return {
              ...inv,
              name: newProdName,
              category: newProdCategory || 'Geral',
              sellingPriceMT: Number(newProdPrice),
              isTopSeller: newProdIsPromo,
              imageUrl: newProdImageUrl || inv.imageUrl
            };
          }
          return inv;
        });
        saveInventoryItems(next);
        return next;
      });
    } else {
      const newInvItem: InventoryItem = {
        id: 'inv-' + Date.now(),
        establishmentId: myEstablishment.id,
        name: newProdName,
        category: newProdCategory || 'Geral',
        sellingPriceMT: Number(newProdPrice),
        costPriceMT: Number(newProdPrice),
        quantityInStock: 0,
        minStockThreshold: 5,
        unit: 'Unidade',
        salesCount: 0,
        isTopSeller: newProdIsPromo,
        imageUrl: newProdImageUrl || undefined
      };
      const updatedInv = [newInvItem, ...inventoryItems];
      setInventoryItems(updatedInv);
      saveInventoryItems(updatedInv);
    }

    // Reset Form
    setEditingProductId(null);
    setNewProdName('');
    setNewProdPrice(0);
    setNewProdPromoPrice(0);
    setNewProdIsPromo(false);
    setNewProdCategory('Geral');
    setNewProdImageUrl('');
    setNewProdDesc('');
    setShowAddProductModal(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  // Delete Customer (CRM)
  const handleDeleteCustomer = (customerId: string) => {
    const updated = customers.filter(c => c.id !== customerId);
    setCustomers(updated);
    saveCustomers(updated);
    notify('Cliente removido com sucesso!', 'success');
  };

  // Save User Profile Changes (Cliente / Utilizador)
  const handleSaveUserProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileNameInput.trim()) {
      notify('Por favor introduza o seu nome.', 'warning');
      return;
    }
    const updatedProfile: UserProfile = {
      ...currentUser,
      name: profileNameInput.trim(),
      displayName: profileNameInput.trim(),
      phone: profilePhoneInput.trim() || undefined,
      city: profileCityInput.trim() || undefined
    };
    if (setCurrentUser) {
      setCurrentUser(updatedProfile);
    }
    try {
      localStorage.setItem('axofacil_user', JSON.stringify(updatedProfile));
    } catch (err) {}
    setShowEditProfileModal(false);
    notify('Perfil pessoal guardado com sucesso!', 'success');
  };

  // Delete Product from Catalog
  const handleDeleteProduct = (productId: string) => {
    if (!myEstablishment) return;

    const currentCatalog = myEstablishment.productsCatalog || myEstablishment.products || [];
    const updatedCatalog = currentCatalog.filter(p => p.id !== productId);

    const updatedEstablishment = {
      ...myEstablishment,
      products: updatedCatalog,
      productsCatalog: updatedCatalog
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    saveEstablishments(updatedEstList);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));
    } catch (e) {}
  };

  // Add Gallery Photo URL
  const handleAddGalleryPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myEstablishment || !newGalleryUrlInput) return;

    const currentGallery = myEstablishment.gallery || [];
    const updatedGallery = [newGalleryUrlInput, ...currentGallery];

    const updatedEstablishment = {
      ...myEstablishment,
      gallery: updatedGallery
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    saveEstablishments(updatedEstList);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));
    } catch (e) {}

    setNewGalleryUrlInput('');
  };

  // Delete Gallery Photo
  const handleDeleteGalleryPhoto = (photoUrl: string) => {
    if (!myEstablishment) return;

    const currentGallery = myEstablishment.gallery || [];
    const updatedGallery = currentGallery.filter(url => url !== photoUrl);

    const updatedEstablishment = {
      ...myEstablishment,
      gallery: updatedGallery
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    saveEstablishments(updatedEstList);
    try {
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));
    } catch (e) {}
  };

  // Upload Gallery Photos from Local Device / Directory with ImgBB integration
  const handleGalleryFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !myEstablishment) return;

    try {
      const uploadPromises = files.map(file => uploadToImgBB(file));
      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter(Boolean);

      if (validUrls.length > 0) {
        const currentGallery = myEstablishment.gallery || [];
        const updatedGallery = [...validUrls, ...currentGallery];
        const updatedEstablishment = {
          ...myEstablishment,
          gallery: updatedGallery
        };

        const updatedEstList = establishments.map(est => est.id === myEstablishment.id ? updatedEstablishment : est);

        setMyEstablishment(updatedEstablishment);
        setEstablishments(updatedEstList);
        localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));
      }
    } catch (err) {
      console.error("Erro no upload para ImgBB:", err);
    }

    e.target.value = '';
  };

  // Upload Cover / Banner Image from Local Device with ImgBB integration
  const handleCoverFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToImgBB(file);
      if (url) {
        setEditedImageUrl(url);
      }
    } catch (err) {
      console.error("Erro no upload da capa para ImgBB:", err);
    }
    e.target.value = '';
  };

  // Upload Product Image from Local Device with ImgBB integration
  const handleProductFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadToImgBB(file);
      if (url) {
        setNewProdImageUrl(url);
      }
    } catch (err) {
      console.error("Erro no upload da foto do produto para ImgBB:", err);
    }
    e.target.value = '';
  };

  // Toggle Shift (Multi-Turno)
  const handleToggleShift = (opName: string) => {
    let updatedShifts: string[];
    if (openShifts.includes(opName)) {
      updatedShifts = openShifts.filter(o => o !== opName);
    } else {
      updatedShifts = [...openShifts, opName];
    }
    setOpenShifts(updatedShifts);
    localStorage.setItem('axofacil_open_shifts', JSON.stringify(updatedShifts));

    if (updatedShifts.length > 0 && !updatedShifts.includes(activeOperator)) {
      setActiveOperator(updatedShifts[0]);
      setTxOperator(updatedShifts[0]);
    }
  };

  // Add Operator
  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myEstablishment || !newOperatorInput.trim()) return;

    const opName = newOperatorInput.trim();
    const currentOps = (myEstablishment.operatorsList && myEstablishment.operatorsList.length > 0)
      ? myEstablishment.operatorsList
      : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente'];

    if (currentOps.includes(opName)) {
      notify('Este operador já está registado na empresa.', 'error');
      return;
    }

    const updatedOps = [...currentOps, opName];
    const updatedEstablishment = {
      ...myEstablishment,
      operatorsList: updatedOps
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));

    // Auto-open shift for new operator (Multi-Turno)
    const updatedShifts = [...openShifts, opName];
    setOpenShifts(updatedShifts);
    localStorage.setItem('axofacil_open_shifts', JSON.stringify(updatedShifts));

    setActiveOperator(opName);
    setTxOperator(opName);
    setNewOperatorInput('');
  };

  // Delete Operator (With Backup / Lixeira)
  const handleDeleteOperator = (opName: string) => {
    if (!myEstablishment) return;

    const currentOps = (myEstablishment.operatorsList && myEstablishment.operatorsList.length > 0)
      ? myEstablishment.operatorsList
      : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente'];

    const updatedOps = currentOps.filter(o => o !== opName);

    // Save to backup / lixeira
    const newBackupItem = {
      id: Date.now().toString() + '_' + Math.random().toString(36).substring(2, 6),
      name: opName,
      deletedAt: new Date().toLocaleDateString('pt-PT') + ' às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };
    const updatedDeleted = [newBackupItem, ...deletedOperators.filter(d => d.name !== opName)];
    setDeletedOperators(updatedDeleted);
    localStorage.setItem('axofacil_deleted_operators', JSON.stringify(updatedDeleted));

    // Remove from active open shifts
    const updatedShifts = openShifts.filter(o => o !== opName);
    setOpenShifts(updatedShifts);
    localStorage.setItem('axofacil_open_shifts', JSON.stringify(updatedShifts));

    const updatedEstablishment = {
      ...myEstablishment,
      operatorsList: updatedOps
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));

    if (activeOperator === opName) {
      const nextOp = updatedOps[0] || 'Atendente Principal';
      setActiveOperator(nextOp);
      setTxOperator(nextOp);
    }
  };

  // Restore Operator from Backup Lixeira
  const handleRestoreOperator = (opName: string) => {
    if (!myEstablishment) return;

    const currentOps = (myEstablishment.operatorsList && myEstablishment.operatorsList.length > 0)
      ? myEstablishment.operatorsList
      : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente'];

    if (!currentOps.includes(opName)) {
      const updatedOps = [...currentOps, opName];
      const updatedEstablishment = {
        ...myEstablishment,
        operatorsList: updatedOps
      };
      const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

      setMyEstablishment(updatedEstablishment);
      setEstablishments(updatedEstList);
      localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));
    }

    // Remove from backup
    const updatedDeleted = deletedOperators.filter(d => d.name !== opName);
    setDeletedOperators(updatedDeleted);
    localStorage.setItem('axofacil_deleted_operators', JSON.stringify(updatedDeleted));
  };

  // Clear Trash
  const handleClearTrash = () => {
    setDeletedOperators([]);
    localStorage.removeItem('axofacil_deleted_operators');
  };

  // Edit Operator (Admin Only)
  const handleOpenEditOperator = (opName: string) => {
    if (storeRole !== 'administrador') {
      setShowRoleLoginModal(true);
      return;
    }
    setEditingOperatorOldName(opName);
    setEditingOperatorNewName(opName);
  };

  const handleSaveEditOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!myEstablishment || !editingOperatorOldName || !editingOperatorNewName.trim()) return;

    const oldName = editingOperatorOldName;
    const newName = editingOperatorNewName.trim();

    if (oldName === newName) {
      setEditingOperatorOldName(null);
      return;
    }

    const currentOps = (myEstablishment.operatorsList && myEstablishment.operatorsList.length > 0)
      ? myEstablishment.operatorsList
      : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente'];

    const updatedOps = currentOps.map(o => o === oldName ? newName : o);

    const updatedEstablishment = {
      ...myEstablishment,
      operatorsList: updatedOps
    };

    const updatedEstList = establishments.map(e => e.id === myEstablishment.id ? updatedEstablishment : e);

    setMyEstablishment(updatedEstablishment);
    setEstablishments(updatedEstList);
    localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEstList));

    // Update active open shifts if renamed
    if (openShifts.includes(oldName)) {
      const updatedShifts = openShifts.map(s => s === oldName ? newName : s);
      setOpenShifts(updatedShifts);
      localStorage.setItem('axofacil_open_shifts', JSON.stringify(updatedShifts));
    }

    // Update active operator & tx operator state
    if (activeOperator === oldName) {
      setActiveOperator(newName);
    }
    if (txOperator === oldName) {
      setTxOperator(newName);
    }

    // Update historical financial transactions to preserve reporting
    const updatedTxs = financialTxs.map(t => {
      if (t.operatorName === oldName) {
        return { ...t, operatorName: newName };
      }
      return t;
    });
    setFinancialTxs(updatedTxs);
    saveFinancialTransactions(updatedTxs);

    setEditingOperatorOldName(null);
    setEditingOperatorNewName('');
  };

  // Switch Role / Session Mode (Administrador vs. Vendedor)
  const handleToggleStoreRole = () => {
    if (storeRole === 'vendedor') {
      setRolePinInput('');
      setRolePinError('');
      setShowRoleLoginModal(true);
    } else {
      setStoreRole('vendedor');
      localStorage.setItem('axofacil_store_role', 'vendedor');
    }
  };

  const handleConfirmAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (rolePinInput === '1234' || rolePinInput === '') {
      setStoreRole('administrador');
      localStorage.setItem('axofacil_store_role', 'administrador');
      setShowRoleLoginModal(false);
      setRolePinError('');
    } else {
      setRolePinError('PIN incorreto. Digite 1234 (ou deixe em branco para autorizar).');
    }
  };

  // SaaS Helpers (Orders, CRM, Financial Management)
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderRecord['status']) => {
    const updated = orders.map(ord => {
      if (ord.id === orderId) {
        return { ...ord, status: newStatus };
      }
      return ord;
    });
    setOrders(updated);
    saveOrders(updated);

    // If order concluded, mark matching financial transaction as "Pago"
    if (newStatus === 'Concluído') {
      const updatedTxs = financialTxs.map(tx => {
        if (tx.referenceOrderNumber === orderId) {
          return { ...tx, status: 'Pago' as const };
        }
        return tx;
      });
      setFinancialTxs(updatedTxs);
      saveFinancialTransactions(updatedTxs);
    }
  };

  const handleOpenAddTxModal = () => {
    setEditingTx(null);
    setTxType('receita');
    setTxCategory('Vendas de Produtos');
    setTxDesc('');
    setTxAmount(0);
    setTxPayMethod('M-Pesa');
    setTxCustomer('');
    setTxOperator(activeOperator || 'Atendente Principal');
    setTxDate(new Date().toISOString().split('T')[0]);
    setShowAddTxModal(true);
  };

  const handleOpenEditTxModal = (tx: FinancialTransaction) => {
    setEditingTx(tx);
    setTxType(tx.type);
    setTxCategory(tx.category);
    setTxDesc(tx.description);
    setTxAmount(tx.amountMT);
    setTxPayMethod(tx.paymentMethod);
    setTxCustomer(tx.customerName || '');
    setTxOperator(tx.operatorName || activeOperator || 'Atendente Principal');
    setTxDate(tx.date || new Date().toISOString().split('T')[0]);
    setShowAddTxModal(true);
  };

  const handleAddOrUpdateFinancialTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txDesc || !txAmount) return;

    if (editingTx) {
      // Update existing record
      const updated = financialTxs.map(tx => {
        if (tx.id === editingTx.id) {
          return {
            ...tx,
            type: txType,
            category: txCategory,
            description: txDesc,
            amountMT: Number(txAmount),
            paymentMethod: txPayMethod,
            customerName: txCustomer || undefined,
            operatorName: txOperator || activeOperator || 'Atendente Principal',
            date: txDate || tx.date
          };
        }
        return tx;
      });
      setFinancialTxs(updated);
      saveFinancialTransactions(updated);
      setEditingTx(null);
    } else {
      // Create new record
      const newTx: FinancialTransaction = {
        id: 'fin-' + Date.now(),
        establishmentId: myEstablishment?.id || 'gen',
        date: txDate || new Date().toISOString().split('T')[0],
        type: txType,
        category: txCategory,
        description: txDesc,
        amountMT: Number(txAmount),
        paymentMethod: txPayMethod,
        status: 'Pago',
        customerName: txCustomer || undefined,
        operatorName: txOperator || activeOperator || 'Atendente Principal'
      };

      const updated = [newTx, ...financialTxs];
      setFinancialTxs(updated);
      saveFinancialTransactions(updated);
    }

    // Reset Form
    setTxDesc('');
    setTxAmount(0);
    setTxCustomer('');
    setEditingTx(null);
    setShowAddTxModal(false);
  };

  const handleDeleteFinancialTransaction = (id: string) => {
    const txToDelete = financialTxs.find(tx => tx.id === id);
    if (!txToDelete) return;

    const updated = financialTxs.filter(tx => tx.id !== id);
    setFinancialTxs(updated);
    saveFinancialTransactions(updated);

    // Save to backup / lixeira
    const backupItem = {
      id: 'del-fin-' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      tx: txToDelete,
      deletedAt: new Date().toLocaleDateString('pt-PT') + ' às ' + new Date().toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })
    };
    const updatedDeleted = [backupItem, ...deletedFinancialTxs];
    setDeletedFinancialTxs(updatedDeleted);
    localStorage.setItem('axofacil_deleted_financial_txs', JSON.stringify(updatedDeleted));
  };

  const handleRestoreFinancialTransaction = (backupId: string) => {
    const itemToRestore = deletedFinancialTxs.find(item => item.id === backupId);
    if (!itemToRestore) return;

    const updatedTxs = [itemToRestore.tx, ...financialTxs];
    setFinancialTxs(updatedTxs);
    saveFinancialTransactions(updatedTxs);

    const updatedDeleted = deletedFinancialTxs.filter(item => item.id !== backupId);
    setDeletedFinancialTxs(updatedDeleted);
    localStorage.setItem('axofacil_deleted_financial_txs', JSON.stringify(updatedDeleted));
  };

  const handleClearFinancialTrash = () => {
    setDeletedFinancialTxs([]);
    localStorage.removeItem('axofacil_deleted_financial_txs');
  };

  const handlePermanentDeleteFinancial = (backupId: string) => {
    const updatedDeleted = deletedFinancialTxs.filter(item => item.id !== backupId);
    setDeletedFinancialTxs(updatedDeleted);
    localStorage.setItem('axofacil_deleted_financial_txs', JSON.stringify(updatedDeleted));
  };

  // Calculator Logic Handlers
  const handleCalcPress = (val: string) => {
    if (val === 'C') {
      setCalcExpr('0');
      return;
    }
    if (val === 'DEL') {
      if (calcExpr.length <= 1) setCalcExpr('0');
      else setCalcExpr(calcExpr.slice(0, -1));
      return;
    }
    if (val === '=') {
      try {
        const sanitized = calcExpr.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`"use strict"; return (${sanitized})`)();
        setCalcExpr(String(res));
      } catch (err) {
        setCalcExpr('Erro');
      }
      return;
    }
    if (calcExpr === '0' || calcExpr === 'Erro') {
      setCalcExpr(val);
    } else {
      setCalcExpr(calcExpr + val);
    }
  };

  // Export Financial Spreadsheet CSV
  const handleExportCSV = () => {
    if (!financialTxs || financialTxs.length === 0) {
      notify('Nenhum lançamento financeiro em caixa para exportar.', 'error');
      return;
    }
    const headers = ['ID,Data,Tipo,Categoria,Descricao,Valor_MT,Forma_Pagamento,Status,Atendente_Operador,Cliente'];
    const rows = financialTxs.map(t => [
      t.id,
      t.date,
      t.type,
      `"${t.category}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.amountMT,
      t.paymentMethod,
      t.status,
      `"${t.operatorName || 'Atendente Balcão'}"`,
      `"${t.customerName || ''}"`
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `extrato_caixa_${myEstablishment?.name ? myEstablishment.name.replace(/\s+/g, '_') : 'axofacil'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) return;

    const newCust: CustomerRecord = {
      id: 'cust-' + Date.now(),
      establishmentId: myEstablishment?.id || 'gen',
      name: custName,
      phone: custPhone,
      email: custEmail || undefined,
      totalOrdersCount: 0,
      totalSpentMT: 0,
      lastOrderDate: new Date().toISOString().split('T')[0],
      notes: custNotes || undefined,
      tags: custTagInput ? custTagInput.split(',').map(t => t.trim()) : ['Cliente Registado']
    };

    const updated = [newCust, ...customers];
    setCustomers(updated);
    saveCustomers(updated);

    // Reset Form
    setCustName('');
    setCustPhone('');
    setCustEmail('');
    setCustNotes('');
    setCustTagInput('');
    setShowAddCustModal(false);
  };

  // Get recommendations based on Client selected interests
  const getClientRecommendations = () => {
    if (!currentUser.interests || currentUser.interests.includes('Tudo')) {
      return establishments.slice(0, 3);
    }
    
    return establishments.filter(est => {
      if (est.category === 'loja' && currentUser.interests?.includes('Lojas')) return true;
      if (est.category === 'bar' && currentUser.interests?.includes('Bares e diversão')) return true;
      if (est.category === 'hospedagem' && currentUser.interests?.includes('Hospedagens e hotéis')) return true;
      return false;
    }).slice(0, 3);
  };

  const recs = getClientRecommendations();

  // Financial Totals Calculation
  const totalReceitaMT = storeFinancialTxs.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amountMT, 0);
  const totalDespesaMT = storeFinancialTxs.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amountMT, 0);
  const saldoCaixaMT = totalReceitaMT - totalDespesaMT;

  // E-Commerce & SaaS International Indicators
  const totalReceitaTxs = storeFinancialTxs.filter(t => t.type === 'receita');
  const countVendas = totalReceitaTxs.length;
  const ticketMedioMT = countVendas > 0 ? Math.round(totalReceitaMT / countVendas) : 0;
  const margemLucroPct = totalReceitaMT > 0 ? Math.round(((totalReceitaMT - totalDespesaMT) / totalReceitaMT) * 100) : 0;
  const projecaoMensalMT = Math.round(totalReceitaMT * 1.3);

  // Payment Breakdown for Fecho de Caixa
  const totalMPesa = storeFinancialTxs.filter(t => t.type === 'receita' && t.paymentMethod === 'M-Pesa').reduce((sum, t) => sum + t.amountMT, 0);
  const totalEMola = storeFinancialTxs.filter(t => t.type === 'receita' && t.paymentMethod === 'e-Mola').reduce((sum, t) => sum + t.amountMT, 0);
  const totalBancos = storeFinancialTxs.filter(t => t.type === 'receita' && t.paymentMethod === 'Transferência BCI/BIM').reduce((sum, t) => sum + t.amountMT, 0);
  const totalDinheiro = storeFinancialTxs.filter(t => t.type === 'receita' && t.paymentMethod === 'Dinheiro').reduce((sum, t) => sum + t.amountMT, 0);
  const totalPOS = storeFinancialTxs.filter(t => t.type === 'receita' && t.paymentMethod === 'POS Cartão').reduce((sum, t) => sum + t.amountMT, 0);

  // Performance Breakdown by Operator / Seller
  const currentOperatorsList = (myEstablishment?.operatorsList && myEstablishment.operatorsList.length > 0)
    ? myEstablishment.operatorsList
    : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente'];

  const operatorPerformanceList = currentOperatorsList.map(op => {
    const opSales = storeFinancialTxs.filter(t => t.type === 'receita' && t.operatorName === op);
    const totalMT = opSales.reduce((sum, t) => sum + t.amountMT, 0);
    const count = opSales.length;
    const avgTicket = count > 0 ? Math.round(totalMT / count) : 0;
    const sharePct = totalReceitaMT > 0 ? Math.round((totalMT / totalReceitaMT) * 100) : 0;
    const isOpen = openShifts.includes(op);

    return {
      name: op,
      isOpen,
      salesCount: count,
      totalRevenueMT: totalMT,
      avgTicketMT: avgTicket,
      sharePct
    };
  });

  // Filtered Financial Transactions
  const filteredFinancialTxs = storeFinancialTxs.filter(t => {
    if (finFilterType !== 'todos' && t.type !== finFilterType) return false;
    if (finFilterMethod !== 'todos' && t.paymentMethod !== finFilterMethod) return false;
    if (finFilterOperator !== 'todos' && t.operatorName !== finFilterOperator) return false;
    return true;
  });

  // Profile display info calculation
  const profileInfo = getProfileDisplayInfo(currentUser);

  return (
    <div className="min-h-screen bg-paper pb-20">
      
      {/* Dashboard Top Intro Strip */}
      <div className="bg-[#0B254B] text-white py-12 px-[6vw]">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white text-[#0B254B] font-bold font-serif text-2xl flex items-center justify-center border-2 border-white/20 select-none shrink-0 shadow-md">
              {(profileInfo.mainTitle || currentUser.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5 flex-wrap">
                <LayoutDashboard className="w-3.5 h-3.5 text-blue-200" />
                <span className="bg-white/15 text-white px-2.5 py-0.5 rounded-full font-bold">
                  {profileInfo.badgeLabel}
                </span>
                <span className="text-white/60 font-medium">·</span>
                <span className="text-white/90 font-semibold">{profileInfo.subTitle}</span>
              </div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl tracking-tight mt-1.5 text-white">
                {profileInfo.mainTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-white/80">
                {profileInfo.managerLabel && (
                  <span className="text-white font-medium">{profileInfo.managerLabel}</span>
                )}
                {profileInfo.managerLabel && <span className="text-white/40">·</span>}
                <span className="text-white/70">{currentUser.emailOrPhone}</span>
                {currentUser.subscriptionPlan && (
                  <>
                    <span className="text-white/40">·</span>
                    <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-md font-semibold text-[11px]">
                      {currentUser.subscriptionPlan}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Canto Superior Direito da Capa: Botões "Carrinho" e "Minhas Compras" */}
          <div className="flex flex-wrap items-center gap-3">
            {onOpenCart && (
              <button
                type="button"
                onClick={onOpenCart}
                className="py-2 px-4 bg-white hover:bg-slate-100 text-[#0B254B] text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 border border-white/40"
                title="Abrir Carrinho de Compras"
              >
                <ShoppingBag className="w-4 h-4 text-[#0B254B]" />
                <span>Carrinho ({cartCount})</span>
              </button>
            )}

            {onOpenPurchases && (
              <button
                type="button"
                onClick={onOpenPurchases}
                className="py-2 px-4 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
                title="Ver histórico de minhas compras e pedidos"
              >
                <CreditCard className="w-4 h-4 text-white" />
                <span>Minhas Compras & Pedidos</span>
              </button>
            )}

            {/* Editar Perfil Pessoal Button */}
            <button
              type="button"
              onClick={() => {
                setProfileNameInput(currentUser.name || '');
                setProfilePhoneInput(currentUser.phone || '');
                setProfileCityInput(currentUser.city || 'Maputo');
                setShowEditProfileModal(true);
              }}
              className="py-2 px-3.5 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl border border-white/20 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5"
              title="Editar os dados do meu perfil"
            >
              <Edit3 className="w-4 h-4 text-white" />
              <span>Editar Perfil</span>
            </button>

            {/* Account status badge */}
            <div className="bg-white/10 border border-white/15 rounded-xl py-2 px-3.5 flex items-center gap-2.5">
              <Award className="w-4 h-4 text-white" />
              <div>
                <div className="text-[9px] font-bold text-white/50 uppercase tracking-wider">Status</div>
                <div className="text-[11px] font-bold text-white flex items-center gap-1">
                  <span>Membro Ativo</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
              </div>
            </div>

            {/* Sair do Perfil button */}
            {setCurrentUser && (
              <button
                type="button"
                onClick={() => {
                  setCurrentUser(null);
                  localStorage.removeItem('axofacil_user');
                  localStorage.removeItem('axofacil_admin_unlocked');
                  setActivePage('home');
                }}
                className="py-2 px-3.5 bg-rose-600/25 hover:bg-rose-600/40 text-rose-100 hover:text-white text-xs font-bold rounded-xl border border-rose-400/30 backdrop-blur-md transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Sair do Perfil / Encerrar Sessão"
              >
                <LogOut className="w-4 h-4 text-rose-300" />
                <span>Sair</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* DASHBOARD BODY */}
      <div className="px-[6vw] py-12 max-w-7xl mx-auto w-full">
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl p-4 mb-8 flex items-center gap-2.5 shadow-sm animate-fadeIn">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-semibold">Os dados do teu perfil foram gravados e actualizados com sucesso!</span>
          </div>
        )}

        {/* CLIENT PORTAL LAYOUT */}
        {currentUser.role === 'cliente' ? (
          <div className="space-y-8">

            {/* CLIENT PROFILE NAVIGATION TABS */}
            <div className="bg-sand-2/30 border border-ink/10 rounded-2xl p-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setClientActiveTab('geral')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    clientActiveTab === 'geral' 
                      ? 'bg-indigo-deep text-paper shadow-xs' 
                      : 'text-ink/70 hover:bg-sand-2/60'
                  }`}
                >
                  <Store className="w-4 h-4 text-terracotta" />
                  <span>Informações Gerais & Selecção de Lojas</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClientActiveTab('carrinha')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    clientActiveTab === 'carrinha' 
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-xs' 
                      : 'text-ink/70 hover:bg-sand-2/60'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 text-amber-700" />
                  <span>Minha Carrinha</span>
                  {cartItems.length > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold shadow-xs">
                      {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setClientActiveTab('pedidos')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    clientActiveTab === 'pedidos' 
                      ? 'bg-indigo-deep text-paper shadow-xs' 
                      : 'text-ink/70 hover:bg-sand-2/60'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  <span>Pedidos & Compras Feitas ({myOrdersList.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClientActiveTab('promocoes')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    clientActiveTab === 'promocoes' 
                      ? 'bg-indigo-deep text-paper shadow-xs' 
                      : 'text-ink/70 hover:bg-sand-2/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Catálogo de Promoções</span>
                </button>

                <button
                  type="button"
                  onClick={() => setClientActiveTab('favoritos')}
                  className={`py-2 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    clientActiveTab === 'favoritos' 
                      ? 'bg-indigo-deep text-paper shadow-xs' 
                      : 'text-ink/70 hover:bg-sand-2/60'
                  }`}
                >
                  <Heart className="w-4 h-4 text-coral-brand fill-coral-brand" />
                  <span>Meus Favoritos ({favorites.length})</span>
                </button>
              </div>

              {/* Quick Actions inside Profile Header */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onOpenCart}
                  className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-950" />
                  <span>Ver Carrinha ({cartCount})</span>
                </button>
              </div>
            </div>

            {/* QUICK NOTIFICATION: ITEMS IN CARRINHA */}
            {cartItems.length > 0 && clientActiveTab !== 'carrinha' && (
              <div className="bg-amber-50/90 border border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h4 className="font-serif font-bold text-sm text-slate-900">
                      Tens {cartItems.reduce((acc, i) => acc + i.quantity, 0)} produto(s) requisitado(s) na tua carrinha
                    </h4>
                    <p className="text-xs text-slate-600">
                      Total: <strong className="text-terracotta">{cartItems.reduce((acc, i) => acc + i.unitPriceMT * i.quantity, 0)} MT</strong> — Escolhe entre Levantamento Presencial (no balcão/mesa) ou Entrega com Estafeta.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setClientActiveTab('carrinha')}
                    className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Ver na Carrinha
                  </button>
                  <button
                    type="button"
                    onClick={onOpenCart}
                    className="py-1.5 px-3 bg-[#0A1E3F] hover:bg-[#0F2D59] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Finalizar Pedido
                  </button>
                </div>
              </div>
            )}

            {/* TAB 1: INFORMAÇÕES GERAIS, SELECÇÃO DE LOJAS E PRODUTOS DO SEU INTERESSE */}
            {clientActiveTab === 'geral' && (
              <div className="space-y-8">
                {/* Interest Banner / Intro */}
                <div className="bg-gradient-to-r from-indigo-deep to-indigo-brand text-paper p-6 rounded-2xl shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sand bg-paper/10 px-2.5 py-0.5 rounded-full">
                      Teus Interesses Registados
                    </span>
                    <h3 className="font-serif font-bold text-xl text-white">Explora as Lojas & Produtos do Teu Interesse</h3>
                    <p className="text-xs text-paper/70 max-w-xl">
                      Selecciona a loja parceira, navega pelos artigos do catálogo, adiciona ao carrinho, solicita cotação ou agenda a tua compra directamente.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActivePage('lojas')}
                    className="py-2.5 px-4 bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    Ver Todas as Lojas
                  </button>
                </div>

                {/* Category Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <span className="text-xs font-bold text-ink/40 uppercase tracking-wider shrink-0">Filtrar Categoria:</span>
                  {[
                    { id: 'todos', label: 'Todas as Lojas' },
                    { id: 'loja', label: 'Lojas & Peças / Automóvel' },
                    { id: 'supermercado', label: 'Supermercados & Mercearias' },
                    { id: 'bar', label: 'Bares & Restaurantes' },
                    { id: 'hospedagem', label: 'Hospedagens & Turismo' },
                    { id: 'construcao', label: 'Construção & Ferragens' }
                  ].map((cat, idx) => (
                    <button
                      key={`dash-cat-${cat.id}-${idx}`}
                      type="button"
                      onClick={() => setClientSelectedCategory(cat.id)}
                      className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        clientSelectedCategory === cat.id
                          ? 'bg-terracotta text-white shadow-xs'
                          : 'bg-white border border-ink/10 text-ink/70 hover:bg-sand-2/50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Stores & Establishments Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {establishments
                    .filter(est => clientSelectedCategory === 'todos' || est.category === clientSelectedCategory)
                    .slice(0, 9)
                    .map((est, idx) => (
                      <div
                        key={`dash-est-card-${est.id}-${idx}`}
                        className="bg-white border border-ink/10 rounded-2xl overflow-hidden shadow-xs hover:border-indigo-brand transition-all flex flex-col justify-between group"
                      >
                        <div>
                          {/* Card Header Cover */}
                          <div className="h-36 bg-indigo-deep relative overflow-hidden p-4 flex flex-col justify-between">
                            {est.imageUrl ? (
                              <img src={est.imageUrl} alt={est.name} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="absolute inset-0 bg-gradient-to-br from-indigo-brand to-indigo-deep opacity-90" />
                            )}
                            <div className="relative z-10 flex justify-between items-start">
                              <span className="text-[10px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-full bg-paper/90 text-indigo-deep backdrop-blur-md">
                                {est.category === 'loja' ? 'Loja & Comércio' : est.category === 'supermercado' ? 'Supermercado' : est.category === 'bar' ? 'Bar / Diversão' : est.category === 'hospedagem' ? 'Hospedagem' : 'Construção'}
                              </span>
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                {est.rating}
                              </span>
                            </div>

                            <div className="relative z-10">
                              <h4 className="font-serif font-bold text-lg text-white drop-shadow-xs">{est.name}</h4>
                              <p className="text-[11px] text-paper/80 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-terracotta" />
                                <span>{est.zone}</span>
                              </p>
                            </div>
                          </div>

                          {/* Products Sample inside Store Card */}
                          <div className="p-4 space-y-3">
                            <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed">{est.description}</p>
                            
                            {/* Products Preview */}
                            {est.productsCatalog && est.productsCatalog.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-ink/8">
                                <div className="text-[10px] font-bold uppercase text-ink/40 tracking-wider">Produtos em Destaque:</div>
                                <div className="space-y-1">
                                  {est.productsCatalog.slice(0, 2).map((p, pIdx) => (
                                    <div key={`${p.id || 'p'}-${pIdx}`} className="bg-sand-2/20 border border-ink/5 p-2 rounded-lg flex items-center justify-between text-xs">
                                      <span className="font-bold text-ink truncate max-w-[140px]">{p.name}</span>
                                      <span className="font-serif font-bold text-indigo-deep">{p.promoPriceMT || p.priceMT} MT</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Store Action Buttons */}
                        <div className="p-4 bg-sand-2/20 border-t border-ink/8 flex gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectEstablishment(est)}
                            className="flex-1 py-2 px-3 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Store className="w-3.5 h-3.5" />
                            <span>Aceder à Loja</span>
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* TAB CARRINHA: PRODUTOS REQUISITADOS NA CARRINHA DO CLIENTE */}
            {clientActiveTab === 'carrinha' && (
              <div className="space-y-6">
                <div className="border-b border-ink/10 pb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="font-serif font-semibold text-2xl text-indigo-deep flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-amber-500" />
                      <span>Minha Carrinha de Compras</span>
                    </h2>
                    <p className="text-xs text-ink/60 mt-0.5">
                      Produtos e promoções requisitadas no teu perfil para pedido presencial ou entrega
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {cartItems.length > 0 && onClearCart && (
                      <button
                        type="button"
                        onClick={onClearCart}
                        className="py-1.5 px-3 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-red-200"
                        title="Esvaziar carrinha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Limpar Carrinha</span>
                      </button>
                    )}
                    {cartItems.length > 0 && onOpenCart && (
                      <button
                        type="button"
                        onClick={onOpenCart}
                        className="py-1.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Finalizar Pedido</span>
                      </button>
                    )}
                  </div>
                </div>

                {cartItems.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-ink/15 rounded-2xl p-6 space-y-4">
                    <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-serif font-bold text-lg text-ink">A tua carrinha não tem artigos de momento</h3>
                      <p className="text-xs text-ink/60 max-w-md mx-auto leading-relaxed">
                        Quando fazes uma requisição de produto ou escolhes fazer um pedido presencial nas promoções, os produtos ficam visíveis aqui na carrinha do teu perfil para acompanhares.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      <button 
                        type="button"
                        onClick={() => setClientActiveTab('promocoes')}
                        className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Ver Catálogo de Promoções</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setClientActiveTab('geral')}
                        className="py-2.5 px-5 bg-indigo-deep hover:bg-indigo-brand text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <Store className="w-4 h-4" />
                        <span>Explorar Lojas Parceiras</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Items List */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="bg-white border border-ink/10 rounded-2xl p-4 shadow-xs">
                        <div className="flex justify-between items-center pb-3 border-b border-ink/8 text-xs font-bold text-ink/70">
                          <span>Produtos Requisitados ({cartItems.reduce((acc, i) => acc + i.quantity, 0)} unidades)</span>
                          <span className="text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[11px]">
                            Disponível para Pedido Presencial & Entrega
                          </span>
                        </div>

                        <div className="divide-y divide-ink/8">
                          {cartItems.map((item, idx) => (
                            <div key={`cart-item-${item.id || 'cart'}-${idx}`} className="py-3 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 min-w-0">
                                {item.imageUrl ? (
                                  <img 
                                    src={item.imageUrl} 
                                    alt={item.productName} 
                                    className="w-14 h-14 object-cover rounded-xl border border-ink/10 shrink-0" 
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-sand-2 text-ink/40 rounded-xl flex items-center justify-center shrink-0">
                                    <ShoppingBag className="w-6 h-6" />
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <h4 className="font-serif font-bold text-sm text-ink truncate">{item.productName}</h4>
                                  <p className="text-[11px] text-ink/60 truncate flex items-center gap-1">
                                    <Store className="w-3 h-3 text-terracotta shrink-0" />
                                    <span>{item.establishmentName || 'Loja Parceira'}</span>
                                  </p>
                                  <p className="text-xs font-bold text-indigo-deep mt-0.5">
                                    {item.unitPriceMT.toLocaleString()} MT <span className="text-[10px] text-ink/40 font-normal">/ un</span>
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                {/* Quantity controls */}
                                <div className="flex items-center border border-ink/20 rounded-xl bg-sand-1/40 overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => onUpdateCartQuantity && onUpdateCartQuantity(item.id, item.quantity - 1)}
                                    className="px-2.5 py-1 text-xs font-bold text-ink/70 hover:bg-ink/10 transition-all cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="px-2.5 py-1 text-xs font-bold text-ink min-w-[24px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => onUpdateCartQuantity && onUpdateCartQuantity(item.id, item.quantity + 1)}
                                    className="px-2.5 py-1 text-xs font-bold text-ink/70 hover:bg-ink/10 transition-all cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right min-w-[70px]">
                                  <span className="font-serif font-bold text-sm text-terracotta block">
                                    {(item.unitPriceMT * item.quantity).toLocaleString()} MT
                                  </span>
                                </div>

                                {onRemoveCartItem && (
                                  <button
                                    type="button"
                                    onClick={() => onRemoveCartItem(item.id)}
                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                    title="Remover produto"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Carrinha Summary Card */}
                    <div className="space-y-4">
                      <div className="bg-white border border-ink/10 rounded-2xl p-5 shadow-xs space-y-4">
                        <h3 className="font-serif font-bold text-base text-indigo-deep border-b border-ink/8 pb-2">
                          Resumo da Carrinha
                        </h3>

                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between text-ink/70">
                            <span>Subtotal dos Artigos:</span>
                            <span className="font-bold text-ink">
                              {cartItems.reduce((acc, i) => acc + i.unitPriceMT * i.quantity, 0).toLocaleString()} MT
                            </span>
                          </div>
                          <div className="flex justify-between text-ink/70">
                            <span>Opção de Requisição:</span>
                            <span className="font-bold text-emerald-700">Presencial / Balcão (Grátis)</span>
                          </div>
                          <div className="flex justify-between text-ink/70">
                            <span>Estafeta Axofácil (Opcional):</span>
                            <span className="text-ink/60">Calculado na saída (150-200 MT)</span>
                          </div>
                          <div className="pt-2 border-t border-ink/10 flex justify-between items-center">
                            <span className="font-bold text-sm text-ink">Total Estimado:</span>
                            <span className="font-serif font-bold text-lg text-terracotta">
                              {cartItems.reduce((acc, i) => acc + i.unitPriceMT * i.quantity, 0).toLocaleString()} MT
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 pt-2">
                          {onOpenCart && (
                            <button
                              type="button"
                              onClick={onOpenCart}
                              className="w-full py-3 bg-[#0A1E3F] hover:bg-[#0F2D59] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Receipt className="w-4 h-4 text-amber-400" />
                              <span>Confirmar e Finalizar Pedido</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setClientActiveTab('geral')}
                            className="w-full py-2 bg-sand-2/50 hover:bg-sand-2 text-ink/70 font-semibold text-xs rounded-xl transition-all cursor-pointer text-center"
                          >
                            Continuar a Explorar Lojas
                          </button>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                          <span>Privacidade & Isolamento Ativo</span>
                        </div>
                        <p className="text-emerald-800 leading-relaxed text-[11px]">
                          Estes produtos estão associados exclusivamente à tua sessão de cliente. Nenhum outro usuário ou loja tem acesso à tua carrinha pessoal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: HISTÓRICO DE PEDIDOS E COMPRAS FEITAS */}
            {clientActiveTab === 'pedidos' && (
              <div className="space-y-6">
                <div className="border-b border-ink/10 pb-4 flex justify-between items-center">
                  <div>
                    <h2 className="font-serif font-semibold text-2xl text-indigo-deep flex items-center gap-2">
                      <CreditCard className="w-5.5 h-5.5 text-emerald-600" />
                      <span>Meus Pedidos & Compras Feitas</span>
                    </h2>
                    <p className="text-xs text-ink/60 mt-0.5">Histórico completo de compras e requisições realizadas no teu perfil</p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenPurchases}
                    className="py-1.5 px-3 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Ver no Gestor de Pagamentos</span>
                  </button>
                </div>

                {/* Privacy Badge */}
                <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold">Isolamento Rigoroso de Perfil: </span>
                    Apenas os pedidos requisitados pela tua conta (<strong className="text-indigo-deep">{currentUser.name || currentUser.emailOrPhone}</strong>) são visíveis aqui. Pedidos de outros clientes ou lojistas não são mostrados.
                  </div>
                </div>

                {myOrdersList.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-ink/15 rounded-2xl p-6 space-y-3">
                    <ShoppingBag className="w-12 h-12 text-ink/20 mx-auto" />
                    <h3 className="font-serif font-medium text-lg text-ink/60">Ainda não realizaste pedidos no teu perfil</h3>
                    <p className="text-xs text-ink/50 max-w-sm mx-auto leading-relaxed">
                      Navega pelas lojas parceiras, adicione artigos à carrinha ou faz a tua encomenda com confirmação presencial ou entrega.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 pt-2">
                      <button 
                        onClick={() => setClientActiveTab('carrinha')}
                        className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold cursor-pointer transition-all shadow-xs"
                      >
                        Ver Minha Carrinha ({cartItems.length})
                      </button>
                      <button 
                        onClick={() => setClientActiveTab('geral')}
                        className="py-2.5 px-5 bg-indigo-deep text-paper rounded-xl text-xs font-semibold hover:bg-indigo-brand cursor-pointer transition-all"
                      >
                        Explorar Lojas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(myOrdersList as any[]).map((ord: any, ordIdx: number) => (
                      <div key={`${ord.id || 'ord'}-${ordIdx}`} className="bg-white border border-ink/10 rounded-2xl p-5 shadow-xs space-y-3">
                        <div className="flex justify-between items-start border-b border-ink/8 pb-2">
                          <div>
                            <span className="font-mono text-[10px] font-bold text-ink/40 uppercase">Pedido #{ord.id}</span>
                            <h4 className="font-serif font-bold text-base text-indigo-deep">{ord.establishmentName || 'Loja Parceira'}</h4>
                            <span className="text-[11px] text-ink/50">{ord.createdAt || ord.date}</span>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase ${
                            ord.status === 'entregue' || ord.status === 'pago' || ord.status === 'Concluído' 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : ord.status === 'processando' || ord.status === 'Confirmado' 
                                ? 'bg-indigo-100 text-indigo-800' 
                                : 'bg-amber-100 text-amber-800'
                          }`}>
                            {ord.status}
                          </span>
                        </div>

                        <div className="space-y-1 text-xs">
                          <div className="font-bold text-ink">Itens / Artigos:</div>
                          <p className="text-ink/70 bg-sand-2/30 p-2 rounded-lg font-mono text-[11px]">{ord.itemsSummary || ord.orderItemsSummary || ord.itemsOrService}</p>
                        </div>

                        {ord.deliveryOption && (
                          <div className="text-[11px] text-ink/60 bg-sand-1/50 p-2 rounded-lg flex items-center justify-between">
                            <span>Tipo de Entrega / Retirada:</span>
                            <span className="font-bold text-indigo-deep capitalize">
                              {ord.deliveryOption === 'pickup' ? 'Presencial / No Balcão' : ord.deliveryOption}
                            </span>
                          </div>
                        )}

                        <div className="pt-2 border-t border-ink/8 flex flex-wrap justify-between items-center gap-2 text-xs">
                          <div>
                            <span className="text-ink/50 text-[10px] font-bold block">VALOR TOTAL:</span>
                            <span className="font-serif font-bold text-sm text-terracotta">{ord.totalAmountMT || ord.totalAmount} MT</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {((ord.status || '').toLowerCase() === 'pendente') && (
                              <button
                                type="button"
                                onClick={() => {
                                  const allOrders = loadOrders();
                                  const updated = allOrders.map((o: any) => o.id === ord.id ? { ...o, status: 'Cancelado' } : o);
                                  saveOrders(updated);
                                  loadClientOrders();
                                  notify('Pedido cancelado com sucesso.', 'info');
                                }}
                                className="py-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-[11px] font-bold cursor-pointer transition-all"
                              >
                                Cancelar Pedido
                              </button>
                            )}
                            <a
                              href={`https://wa.me/?text=${encodeURIComponent(`Olá! Gostaria de falar sobre o meu pedido #${ord.id} no Axofácil!`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-1 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <MessageCircle className="w-3 h-3 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CATÁLOGO DE PROMOÇÕES */}
            {clientActiveTab === 'promocoes' && (
              <div className="space-y-6">
                <div className="border-b border-ink/10 pb-4">
                  <h2 className="font-serif font-semibold text-2xl text-indigo-deep flex items-center gap-2">
                    <Sparkles className="w-5.5 h-5.5 text-amber-500" />
                    <span>Catálogo de Promoções Ativas</span>
                  </h2>
                  <p className="text-xs text-ink/60 mt-0.5">Ofertas exclusivas com duas opções de pedido: Presencial (na tua carrinha) ou WhatsApp oficial da loja</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {deals.map((dl, dlIdx) => (
                    <div key={`${dl.id || 'dl'}-${dlIdx}`} className="bg-white border border-amber-300/80 rounded-2xl overflow-hidden shadow-xs hover:border-amber-500 transition-all space-y-3 p-5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                            {dl.category}
                          </span>
                          <span className="text-xs font-serif font-bold text-terracotta">{dl.discount}</span>
                        </div>
                        <h4 className="font-serif font-bold text-base text-ink">{dl.title}</h4>
                        <p className="text-xs text-ink/60 leading-relaxed">{dl.description}</p>
                        <div className="text-[11px] font-bold text-indigo-deep flex items-center gap-1 pt-1">
                          <Store className="w-3.5 h-3.5 text-terracotta" />
                          <span>{dl.establishmentName} ({dl.zone})</span>
                        </div>
                      </div>

                      {/* DUAL ORDERING OPTIONS: PRESENCIAL / CARRINHA & WHATSAPP */}
                      <div className="space-y-2 pt-2 border-t border-ink/8">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleOrderDealPresencial(dl)}
                            className="py-2 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            title="Requisitar produto da promoção presencialmente para a tua carrinha"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-slate-950 shrink-0" />
                            <span className="truncate">Pedir Presencial</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const est = establishments.find(e => e.id === dl.establishmentId || e.name === dl.establishmentName);
                              const phone = (est?.contactPhone || '258840000000').replace(/\D/g, '');
                              const msg = encodeURIComponent(`Olá ${dl.establishmentName}, vi a promoção "${dl.title}" no Portal Axofácil e gostaria de fazer o pedido.`);
                              window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
                            }}
                            className="py-2 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                            title="Fazer pedido da promoção via WhatsApp oficial da loja"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-white shrink-0" />
                            <span className="truncate">WhatsApp</span>
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const est = establishments.find(e => e.id === dl.establishmentId || e.name === dl.establishmentName);
                            if (est) onSelectEstablishment(est);
                            else setActivePage('lojas');
                          }}
                          className="w-full py-1.5 bg-sand-2/60 hover:bg-sand-2 text-ink/70 font-semibold text-[11px] rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <Store className="w-3 h-3 text-terracotta" />
                          <span>Ver Loja & Catálogo Completo</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: MEUS FAVORITOS */}
            {clientActiveTab === 'favoritos' && (
              <div className="space-y-6">
                <div className="border-b border-ink/10 pb-4 flex justify-between items-center">
                  <h2 className="font-serif font-semibold text-2xl text-indigo-deep flex items-center gap-2">
                    <Heart className="w-5.5 h-5.5 text-coral-brand fill-coral-brand" />
                    <span>Meus Favoritos</span>
                  </h2>
                  <span className="text-xs font-semibold text-ink/40">{favorites.length} guardados</span>
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-16 bg-white border border-dashed border-ink/15 rounded-2xl p-6">
                    <Heart className="w-10 h-10 text-ink/15 mx-auto mb-3" />
                    <h3 className="font-serif font-medium text-lg text-ink/60 mb-1">Ainda não guardaste favoritos</h3>
                    <p className="text-xs text-ink/50 max-w-xs mx-auto leading-relaxed">
                      Navega pelas lojas, bares e hospedagens e clica no ícone de coração no perfil do local para guardar aqui.
                    </p>
                    <button 
                      onClick={() => setClientActiveTab('geral')}
                      className="mt-4 py-2 px-5 bg-indigo-deep text-paper rounded-full text-xs font-semibold hover:bg-indigo-brand cursor-pointer transition-all"
                    >
                      Começar a Explorar Lojas
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((fav, favIdx) => (
                      <div 
                        key={`${fav.id || 'fav'}-${favIdx}`}
                        className="border border-ink/10 rounded-2xl bg-white overflow-hidden shadow-xs relative group flex flex-col justify-between"
                      >
                        <button 
                          onClick={() => removeFavorite(fav.id)}
                          className="absolute top-3 right-3 p-1.5 rounded-full bg-paper hover:bg-coral-brand/10 text-ink/40 hover:text-coral-brand transition-colors cursor-pointer z-10 shadow-xs border border-ink/5"
                          title="Remover dos favoritos"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <div 
                          onClick={() => onSelectEstablishment(fav)}
                          className="p-5 cursor-pointer flex-grow space-y-2"
                        >
                          <span className={`inline-block text-[9px] font-bold uppercase tracking-wider py-0.5 px-2.5 rounded-md ${
                            fav.category === 'loja' ? 'bg-slate-100 text-indigo-brand' : fav.category === 'bar' ? 'bg-[#F5DFC4] text-[#7A4A15]' : 'bg-[#F5D9D1] text-[#8A3527]'
                          }`}>
                            {fav.category === 'loja' ? 'Loja da Baixa' : fav.category === 'bar' ? 'Bar / Diversão' : 'Hospedagem'}
                          </span>

                          <h3 className="font-serif font-semibold text-base text-ink group-hover:text-indigo-deep transition-colors truncate">{fav.name}</h3>
                          <p className="text-xs text-ink/50">{fav.zone}</p>
                          <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed">{fav.description}</p>
                        </div>

                        <div 
                          onClick={() => onSelectEstablishment(fav)}
                          className="bg-sand-2/15 border-t border-ink/5 p-3.5 flex justify-between items-center text-[11px] cursor-pointer"
                        >
                          <span className="font-semibold text-indigo-deep">{fav.metaInfo}</span>
                          <span className="flex items-center gap-0.5 font-bold text-ink/75">
                            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                            {fav.rating}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        ) : (
          /* BUSINESS OWNER PORTAL LAYOUT */
          <div className="space-y-8">
            
            {/* Active Operator Banner & Role Login Switcher */}
            <div className="bg-sand-2/20 border border-ink/10 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-deep text-paper flex items-center justify-center font-bold font-serif shadow-2xs">
                    <Users className="w-5 h-5 text-sand" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Turno do Caixa / Atendente Responsável</div>
                    <div className="text-xs font-bold text-indigo-deep flex items-center gap-2">
                      <span>Operador Ativo:</span>
                      <span className="bg-emerald-100 text-emerald-800 py-0.5 px-2 rounded-md font-bold">{activeOperator || 'Atendente Principal'}</span>
                    </div>
                  </div>
                </div>

                {/* Role Status Badge */}
                <div className="border-l border-ink/10 pl-4 py-0.5">
                  <div className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Nível de Acesso na Loja</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {storeRole === 'administrador' ? (
                      <span className="bg-emerald-700 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Sessão: Administrador da Loja</span>
                      </span>
                    ) : (
                      <span className="bg-amber-600 text-white text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>Sessão: Vendedor / Operador</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Multi-Store Switcher */}
                {currentUser?.role === 'admin' && establishments.length > 1 && (
                  <div className="border-l border-ink/10 pl-4 py-0.5">
                    <div className="text-[10px] font-bold text-ink/40 uppercase tracking-wider">Gestão Multi-Loja (Admin)</div>
                    <select
                      value={myEstablishment?.id || ''}
                      onChange={(e) => {
                        const target = establishments.find(est => est.id === e.target.value);
                        if (target) {
                          setMyEstablishment(target);
                          setEditedName(target.name);
                          setEditedDesc(target.description);
                          setEditedAddress(target.address);
                          setEditedPhone(target.contactPhone || '');
                          setEditedPromo(target.promotion || '');
                          setEditedImageUrl(target.imageUrl || '');
                          setEditedLandmarks(target.locationLandmarks || '');
                          setEditedMetaInfo(target.metaInfo || '');
                          setEditedSalesType(target.salesType || 'ambos');
                          setEditedLat(target.latitude);
                          setEditedLng(target.longitude);
                          const defaultOp = target.operatorsList?.[0] || 'Atendente Principal';
                          setActiveOperator(defaultOp);
                          setTxOperator(defaultOp);
                        }
                      }}
                      className="bg-white border border-ink/15 rounded-lg py-1 px-2 text-xs font-bold text-indigo-deep outline-none cursor-pointer mt-0.5"
                    >
                      {establishments.map((est, eIdx) => (
                        <option key={`admin-est-switch-${est.id}-${eIdx}`} value={est.id}>
                          {est.name} ({est.category})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={() => setBusinessTab('pos_caixa')}
                  className="py-2.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md hover:shadow-lg transform active:scale-95 border border-amber-300"
                  title="Abrir Balcão de Caixa em Tela Única sem distrações"
                >
                  <Receipt className="w-4 h-4 text-slate-950" />
                  <span>Abrir Balcão de Caixa</span>
                  <span className="bg-slate-950 text-amber-300 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Tela Única
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleStoreRole}
                  className={`py-2 px-3 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 border shadow-2xs ${
                    storeRole === 'administrador'
                      ? 'bg-white text-amber-900 border-amber-300 hover:bg-amber-50'
                      : 'bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-800'
                  }`}
                  title="Alternar entre Administrador e Vendedor"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{storeRole === 'administrador' ? '👑 Admin' : '🛍️ Vendedor'}</span>
                </button>

                <div className="flex items-center gap-1.5 bg-white border border-ink/12 rounded-xl py-1 px-2.5">
                  <span className="text-[11px] font-semibold text-ink/60 whitespace-nowrap">Operador:</span>
                  <select
                    value={activeOperator}
                    onChange={(e) => {
                      setActiveOperator(e.target.value);
                      setTxOperator(e.target.value);
                    }}
                    className="bg-transparent text-xs font-bold text-ink outline-none cursor-pointer"
                  >
                    {(myEstablishment?.operatorsList && myEstablishment.operatorsList.length > 0
                      ? myEstablishment.operatorsList
                      : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente']
                    ).map((op, idx) => (
                      <option key={`op-select-${op}-${idx}`} value={op}>{op}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SaaS Navigation Tabs - Clean, Structured & Clutter-Free */}
            <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setBusinessTab('resumo')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'resumo' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-sand" />
                <span>Visão Geral</span>
              </button>

              <button
                onClick={() => setBusinessTab('vitrina')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'vitrina' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <Store className="w-4 h-4 text-amber-500" />
                <span>Vitrina & Catálogo</span>
                <span className="bg-amber-500 text-paper text-[10px] py-0.2 px-1.5 rounded-full font-bold">
                  {myEstablishment?.productsCatalog?.length || 0}
                </span>
              </button>

              <button
                onClick={() => setBusinessTab('pos_caixa')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'pos_caixa' 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <Receipt className="w-4 h-4 text-amber-600" />
                <span>Balcão de Caixa POS</span>
                <span className="bg-amber-400 text-slate-950 text-[9px] py-0.2 px-1.5 rounded-full font-bold">
                  Offline-First
                </span>
              </button>

              <button
                onClick={() => setBusinessTab('inventario')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'inventario' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <Boxes className="w-4 h-4 text-emerald-600" />
                <span>Stock & Inventário</span>
                <span className="bg-emerald-600 text-white text-[10px] py-0.2 px-1.5 rounded-full font-bold">
                  {storeInventoryItems.length}
                </span>
              </button>

              {/* Contextual Operational Tab according to Establishment Category */}
              {(() => {
                const catStr = (myEstablishment?.category || '').toLowerCase();
                const isHospedagem = catStr.includes('hospedagem') || catStr.includes('hotel') || catStr.includes('alojamento');
                const isConstrucao = catStr.includes('constru') || catStr.includes('estaleiro');
                const isPecas = catStr.includes('peca') || catStr.includes('peça') || catStr.includes('auto');
                const isLoja = catStr.includes('loja');
                const isSuper = catStr.includes('supermercado');

                const label = isHospedagem ? 'Quartos & Reservas' :
                  isConstrucao ? 'Estaleiro & Cargas' :
                  isPecas ? 'Peças & Serviços Auto' :
                  isLoja ? 'Balcões & Secções' :
                  isSuper ? 'Caixas & Secções' :
                  'Mesas & Consumo';

                const icon = isHospedagem ? <Key className="w-4 h-4 text-sky-600" /> :
                  isConstrucao ? <Truck className="w-4 h-4 text-amber-600" /> :
                  isPecas ? <Wrench className="w-4 h-4 text-amber-500" /> :
                  isLoja ? <ShoppingBag className="w-4 h-4 text-indigo-brand" /> :
                  isSuper ? <Boxes className="w-4 h-4 text-emerald-600" /> :
                  <Beer className="w-4 h-4 text-terracotta" />;

                return (
                  <button
                    onClick={() => setBusinessTab('mesas')}
                    className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      businessTab === 'mesas' 
                        ? 'bg-indigo-deep text-paper shadow-xs' 
                        : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                    }`}
                  >
                    {icon}
                    <span>{label}</span>
                  </button>
                );
              })()}

              <button
                onClick={() => setBusinessTab('pedidos')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'pedidos' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-terracotta" />
                <span>Pedidos Online</span>
                <span className="bg-terracotta text-white text-[10px] py-0.2 px-1.5 rounded-full font-bold">{orders.length}</span>
              </button>

              <button
                onClick={() => setBusinessTab('financeiro')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'financeiro' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Caixa & Finanças</span>
                <span className="bg-emerald-600 text-white text-[10px] py-0.2 px-1.5 rounded-full font-bold">{financialTxs.length}</span>
              </button>

              <button
                onClick={() => setBusinessTab('operadores')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'operadores' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <Users className="w-4 h-4 text-indigo-brand" />
                <span>Equipa</span>
                <span className="bg-indigo-brand text-white text-[10px] py-0.2 px-1.5 rounded-full font-bold">
                  {myEstablishment?.operatorsList?.length || 1}
                </span>
              </button>

              <button
                onClick={() => setBusinessTab('clientes')}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  businessTab === 'clientes' 
                    ? 'bg-indigo-deep text-paper shadow-xs' 
                    : 'bg-paper text-ink/70 hover:bg-sand-2/30 border border-ink/10'
                }`}
              >
                <Users className="w-4 h-4 text-blue-600" />
                <span>Clientes CRM</span>
                <span className="bg-blue-600 text-white text-[10px] py-0.2 px-1.5 rounded-full font-bold">{customers.length}</span>
              </button>
            </div>

            {/* TAB 1: RESUMO & PERFIL */}
            {businessTab === 'resumo' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Business Stats Section */}
                {myEstablishment && (
                  <div className="lg:col-span-12">
                    <div className="border-b border-ink/10 pb-4 mb-6">
                      <h2 className="font-serif font-semibold text-2xl text-indigo-deep flex items-center gap-2">
                        <BarChart3 className="w-5.5 h-5.5 text-indigo-brand" />
                        <span>Desempenho Comercial do Estabelecimento</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Visitas ao Perfil</span>
                          <div className="text-3xl font-serif font-bold text-indigo-deep mt-2">{myEstablishment.visits}</div>
                        </div>
                        <p className="text-[11px] text-ink/50 mt-3 border-t border-ink/5 pt-2">Vezes que os utilizadores leram a tua ficha de detalhes.</p>
                      </div>

                      <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Apareceu em Pesquisas</span>
                          <div className="text-3xl font-serif font-bold text-indigo-deep mt-2">{myEstablishment.searches}</div>
                        </div>
                        <p className="text-[11px] text-ink/50 mt-3 border-t border-ink/5 pt-2">Número de pesquisas em Maputo onde estiveste listado.</p>
                      </div>

                      <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Cliques em Contactar / Reservar</span>
                          <div className="text-3xl font-serif font-bold text-indigo-deep mt-2">{myEstablishment.salesOrReservations}</div>
                        </div>
                        <p className="text-[11px] text-ink/50 mt-3 border-t border-ink/5 pt-2">Contactos diretos estabelecidos via WhatsApp.</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Profile Managing Block */}
                <div className="lg:col-span-7">
                  <div className="border-b border-ink/10 pb-4 mb-6 flex justify-between items-center">
                    <h2 className="font-serif font-semibold text-2xl text-indigo-deep flex items-center gap-2">
                      <Settings className="w-5.5 h-5.5 text-indigo-brand" />
                      <span>Perfil do Negócio</span>
                    </h2>
                    {!editMode && myEstablishment && (
                      <button 
                        onClick={() => setEditMode(true)}
                        className="text-xs font-bold text-indigo-deep hover:underline flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Editar Informações</span>
                      </button>
                    )}
                  </div>

                  {myEstablishment ? (
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs">
                      {editMode ? (
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Nome Oficial do Estabelecimento</label>
                            <input 
                              type="text" 
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              required
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Descrição Comercial</label>
                            <textarea 
                              value={editedDesc}
                              onChange={(e) => setEditedDesc(e.target.value)}
                              rows={4}
                              required
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none font-sans"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Endereço Físico Exato</label>
                            <input 
                              type="text" 
                              value={editedAddress}
                              onChange={(e) => setEditedAddress(e.target.value)}
                              required
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Pontos de Referência / Como Chegar</label>
                            <input 
                              type="text" 
                              value={editedLandmarks}
                              placeholder="ex: Perto do Mercado Central, em frente à Farmácia 24h"
                              onChange={(e) => setEditedLandmarks(e.target.value)}
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                            />
                          </div>

                          {/* Interactive OpenStreetMap Location Picker */}
                          <div className="pt-1">
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Localização no Mapa GPS (OpenStreetMap / Leaflet)</label>
                            <StoreLocationMap
                              mode="picker"
                              storeName={editedName || myEstablishment.name}
                              addressText={editedAddress}
                              landmarks={editedLandmarks}
                              province={myEstablishment.province}
                              latitude={editedLat}
                              longitude={editedLng}
                              onLocationChange={({ lat, lng, addressText }) => {
                                setEditedLat(lat);
                                setEditedLng(lng);
                                if (addressText && !editedAddress) {
                                  setEditedAddress(addressText);
                                }
                              }}
                              height="260px"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Telemóvel de Contacto / WhatsApp</label>
                            <input 
                              type="text" 
                              value={editedPhone}
                              onChange={(e) => setEditedPhone(e.target.value)}
                              required
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Promoção Activa no Top 10</label>
                            <input 
                              type="text" 
                              value={editedPromo}
                              placeholder="ex: -20% em todas as coleções esta semana!"
                              onChange={(e) => setEditedPromo(e.target.value)}
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                            <button 
                              type="submit"
                              className="btn btn-primary py-3 px-6 rounded-xl font-semibold text-xs cursor-pointer"
                            >
                              Gravar Perfil
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                setEditMode(false);
                                setEditedName(myEstablishment.name);
                                setEditedDesc(myEstablishment.description);
                                setEditedAddress(myEstablishment.address);
                                setEditedLandmarks(myEstablishment.locationLandmarks || '');
                                setEditedPhone(myEstablishment.contactPhone || '');
                                setEditedPromo(myEstablishment.promotion || '');
                                setEditedLat(myEstablishment.latitude);
                                setEditedLng(myEstablishment.longitude);
                              }}
                              className="btn bg-paper border border-ink/12 py-3 px-6 rounded-xl font-semibold text-xs text-ink cursor-pointer hover:bg-sand-2/10"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-5">
                          <div>
                            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Nome do Estabelecimento</span>
                            <div className="text-base font-bold text-indigo-deep mt-0.5">{myEstablishment.name}</div>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Descrição</span>
                            <div className="text-xs text-ink/80 mt-1 leading-relaxed">{myEstablishment.description}</div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Zona</span>
                              <div className="text-xs font-semibold text-ink mt-0.5">{myEstablishment.zone}</div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Endereço</span>
                              <div className="text-xs font-semibold text-ink mt-0.5">{myEstablishment.address}</div>
                            </div>
                          </div>

                          {myEstablishment.locationLandmarks && (
                            <div>
                              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Ponto de Referência</span>
                              <div className="text-xs font-medium text-ink/80 mt-0.5 bg-sand-2/30 p-2.5 rounded-xl border border-ink/5">
                                📍 {myEstablishment.locationLandmarks}
                              </div>
                            </div>
                          )}

                          {/* Interactive Leaflet Location Map with Turn-by-Turn Navigation */}
                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block mb-2">Localização e Navegação</span>
                            <StoreLocationMap
                              mode="view"
                              storeName={myEstablishment.name}
                              addressText={myEstablishment.addressText || myEstablishment.address}
                              landmarks={myEstablishment.locationLandmarks}
                              province={myEstablishment.province}
                              latitude={myEstablishment.latitude}
                              longitude={myEstablishment.longitude}
                              height="240px"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Telemóvel</span>
                              <div className="text-xs font-semibold text-ink mt-0.5">{myEstablishment.contactPhone || 'Sem número registado'}</div>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest">Categoria</span>
                              <div className="text-xs font-semibold uppercase text-terracotta mt-0.5">{myEstablishment.category}</div>
                            </div>
                          </div>

                          {myEstablishment.promotion && (
                            <div className="bg-slate-100 border border-indigo-brand/20 rounded-xl p-4 mt-2">
                              <span className="text-[10px] font-bold text-indigo-brand uppercase tracking-wider block mb-0.5">Promoção Comercial Activa</span>
                              <div className="text-xs font-bold text-indigo-deep">{myEstablishment.promotion}</div>
                            </div>
                          )}

                          <div className="pt-2">
                            <button
                              onClick={() => onSelectEstablishment(myEstablishment)}
                              className="btn btn-primary py-3 px-6 rounded-xl font-semibold text-xs cursor-pointer flex items-center gap-2"
                            >
                              <span>Ver Ficha Pública</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 text-center">
                      <p className="text-sm font-semibold text-ink/50">Nenhum estabelecimento associado a esta conta.</p>
                    </div>
                  )}
                </div>

                {/* Premium Billing Info */}
                <div className="lg:col-span-5">
                  <div className="border-b border-ink/10 pb-4 mb-6">
                    <h2 className="font-serif font-semibold text-2xl text-indigo-deep">
                      Informações de Faturação
                    </h2>
                  </div>

                  <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 flex-shrink-0">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-indigo-deep uppercase tracking-wider">Assinatura Profissional</h3>
                        <p className="text-sm font-bold text-emerald-700 mt-0.5">Plano Ativo (Isento)</p>
                        <p className="text-[11px] text-ink/50 mt-1">Garante exibição ilimitada, acesso ao Top 10 em promoção e painel de análise comercial.</p>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-ink/12 pt-4 space-y-3 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-ink/60">Custos de Assinatura</span>
                        <span className="text-ink/50 line-through">1.200 MT / mês</span>
                      </div>
                      <div className="flex justify-between items-center text-emerald-700 font-bold">
                        <span>Desconto Inaugural</span>
                        <span>100% OFF (Primeiros 15 dias!)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink/60">Taxa de Comissão</span>
                        <span className="text-ink/50 line-through">5% por reserva / venda</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Status de Comissão</span>
                        <span>Isento (Primeiros 15 dias!)</span>
                      </div>
                    </div>

                    <div className="bg-sand-2/30 rounded-xl p-4 border border-ink/5 flex gap-2.5">
                      <ShieldAlert className="w-5 h-5 text-terracotta flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[11px] font-bold text-[#7A4A15] uppercase tracking-wider mb-0.5">Aviso de Isenção</h4>
                        <p className="text-[10.5px] text-ink/60 leading-relaxed">
                          De acordo com as regras de lançamento da plataforma Axofácil!, não tens nenhum pagamento pendente e todas as tuas vendas/reservas efetuadas através do portal serão 100% livres de taxas nos próximos 15 dias.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: GERENCIAR PÁGINA & VITRINA PÚBLICA */}
            {businessTab === 'vitrina' && (
              <div className="space-y-8">
                {/* Header Banner */}
                <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1 mb-1">
                      <Store className="w-4 h-4" />
                      <span>Gestão da Vitrina Comercial</span>
                    </div>
                    <h2 className="font-serif font-bold text-2xl text-indigo-deep">Gerenciar Página, Conteúdos e Produtos</h2>
                    <p className="text-xs text-ink/60 mt-1 max-w-2xl">
                      Mantenha o seu perfil sempre atrativo para os clientes de Maputo. Altere imagens de capa, galeria, biografia, ofertas promocionais e publique produtos no seu catálogo.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="py-3 px-5 bg-terracotta hover:bg-terracotta/90 text-paper font-bold text-xs rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Adicionar Produto ao Catálogo</span>
                  </button>
                </div>

                {/* Link Directo de Partilha da Vitrine — Com Controlo de Privacidade */}
                {(() => {
                  const isStoreManager = storeRole === 'administrador' || currentUser?.role === 'admin';
                  const isAddedOperator = Boolean(
                    activeOperator && 
                    (myEstablishment?.operatorsList?.includes(activeOperator) || openShifts.includes(activeOperator))
                  );
                  const hasVitrineLinkAccess = isStoreManager || isAddedOperator;
                  const operatorsList = myEstablishment?.operatorsList || ['Mariamo Vendedora', 'Ana Atendente Balcão'];

                  if (!hasVitrineLinkAccess) {
                    return (
                      <div id="vitrine-link-privacy-lock" className="bg-slate-900 border border-slate-700/80 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1.5 max-w-2xl">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                            <Lock className="w-4 h-4 text-amber-400" />
                            <span>Link Directo da Vitrine — Protegido por Privacidade</span>
                          </div>
                          <p className="text-xs text-slate-300">
                            O acesso, cópia e partilha do link directo da vitrine é estritamente reservado ao <strong className="text-white">Gestor da Loja</strong> e aos <strong className="text-white">Operadores de Perfil</strong> adicionados pelo administrador.
                          </p>
                          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>Inicie sessão como Gestor ou selecione um operador autorizado da equipa para desbloquear.</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                          <button
                            type="button"
                            onClick={() => setShowRoleLoginModal(true)}
                            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm cursor-pointer flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
                          >
                            <Key className="w-4 h-4" />
                            <span>Entrar como Gestor (PIN)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBusinessTab('operadores')}
                            className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/20 cursor-pointer flex items-center gap-2 transition-all w-full sm:w-auto justify-center"
                          >
                            <Users className="w-4 h-4" />
                            <span>Ver Operadores do Perfil</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div id="vitrine-link-privacy-unlocked" className="bg-gradient-to-r from-amber-500/10 via-amber-50/60 to-emerald-50/60 border border-amber-300/60 rounded-2xl p-5 shadow-xs flex flex-col gap-4">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                              <Share2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>Link Directo da Vitrine para Partilhar com Clientes</span>
                            </div>
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              Privacidade: {isStoreManager ? 'Acesso do Gestor' : `Operador Autorizado (${activeOperator})`}
                            </span>
                          </div>
                          
                          <div className="font-mono text-xs font-bold text-indigo-deep bg-white/80 border border-amber-200/80 px-3 py-1.5 rounded-xl inline-block select-all">
                            {window.location.origin}/?id={myEstablishment?.id || 'bar-1'}
                          </div>
                          <p className="text-[11px] text-ink/60">
                            Partilhe este link no WhatsApp ou redes sociais para os clientes acederem diretamente à sua vitrine, produtos e promoções.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const link = `${window.location.origin}/?id=${myEstablishment?.id || 'bar-1'}`;
                              navigator.clipboard.writeText(link);
                              setCopiedVitrineLink(true);
                              setTimeout(() => setCopiedVitrineLink(false), 2500);
                            }}
                            className="py-2.5 px-4 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                          >
                            {copiedVitrineLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
                            <span>{copiedVitrineLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                          </button>

                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(`Olá! Veja o nosso catálogo e produtos em promoção no Axofácil! Maputo: ${window.location.origin}/?id=${myEstablishment?.id || 'bar-1'}`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all text-decoration-none"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Partilhar no WhatsApp</span>
                          </a>

                          {myEstablishment && (
                            <button
                              type="button"
                              onClick={() => onSelectEstablishment(myEstablishment)}
                              className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5 transition-all"
                            >
                              <Eye className="w-4 h-4 text-sand" />
                              <span>Ver Minha Vitrine</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Display profile operators with authorized sharing permissions */}
                      <div className="pt-2 border-t border-amber-200/60 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-700">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-amber-900 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-amber-700" />
                            Operadores do Perfil Autorizados a Partilhar:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {operatorsList.map((op, idx) => (
                              <span key={`auth-op-badge-${op}-${idx}`} className="bg-amber-100/80 border border-amber-300/80 text-amber-900 font-semibold px-2 py-0.5 rounded-md text-[10px]">
                                {op}
                              </span>
                            ))}
                          </div>
                        </div>
                        {isStoreManager && (
                          <button
                            type="button"
                            onClick={() => setBusinessTab('operadores')}
                            className="text-[10px] font-bold text-amber-800 hover:text-amber-950 underline cursor-pointer"
                          >
                            + Adicionar / Gerir Operadores
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Public Information & Banner/Gallery */}
                  <div className="lg:col-span-6 space-y-6">
                    
                    {/* Visual Preview Card */}
                    <div className="bg-white border border-ink/12 rounded-2xl overflow-hidden shadow-xs">
                      <div className="bg-sand-2/40 px-5 py-3 border-b border-ink/10 flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-deep flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-terracotta" />
                          <span>Como o Cliente Vê a Sua Imagem de Capa</span>
                        </span>
                        <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">Ativo em Maputo</span>
                      </div>
                      
                      <div className="h-44 bg-sand-2/30 relative overflow-hidden">
                        {myEstablishment?.imageUrl ? (
                          <img src={myEstablishment.imageUrl} alt={myEstablishment.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-ink/40 font-semibold italic">Sem Imagem de Capa</div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-indigo-deep/80 via-transparent to-transparent flex items-end p-4 text-paper">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-terracotta/90 px-2 py-0.5 rounded text-paper">
                              {myEstablishment?.category}
                            </span>
                            <h3 className="font-serif font-bold text-lg mt-1">{myEstablishment?.name}</h3>
                            <p className="text-xs text-paper/80 flex items-center gap-1"><MapPin className="w-3 h-3" /> {myEstablishment?.zone} - {myEstablishment?.address}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Edit Form for Profile Info & Images */}
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-5">
                      <h3 className="font-serif font-bold text-lg text-indigo-deep border-b border-ink/10 pb-3 flex items-center gap-2">
                        <Settings className="w-4.5 h-4.5 text-indigo-brand" />
                        <span>Editar Dados da Vitrina Pública</span>
                      </h3>

                      <form onSubmit={handleSaveProfile} className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Imagem de Capa / Banner Principal</label>
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            <input 
                              type="text" 
                              value={editedImageUrl} 
                              onChange={(e) => setEditedImageUrl(e.target.value)} 
                              placeholder="Cole o URL ou faça upload de ficheiro local..." 
                              className="flex-grow p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                            />
                            <label htmlFor="cover-file-upload" className="py-2.5 px-3.5 bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs">
                              <Upload className="w-4 h-4" />
                              <span>Carregar Ficheiro</span>
                            </label>
                            <input type="file" id="cover-file-upload" accept="image/*" onChange={handleCoverFileUpload} className="hidden" />
                          </div>
                          {editedImageUrl && (
                            <div className="mt-2 h-20 w-36 rounded-xl overflow-hidden border border-ink/10 relative">
                              <img src={editedImageUrl} alt="Preview Capa" className="w-full h-full object-cover" />
                              <span className="absolute bottom-1 right-1 bg-indigo-deep/80 text-white text-[9px] px-1.5 py-0.5 rounded-xs font-bold">Pré-visualização</span>
                            </div>
                          )}
                          <p className="text-[10.5px] text-ink/50 mt-1">Selecione uma imagem do seu dispositivo (PNG, JPG, WEBP) ou insira um link da web.</p>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Nome do Estabelecimento</label>
                          <input 
                            type="text" 
                            value={editedName} 
                            onChange={(e) => setEditedName(e.target.value)} 
                            required
                            className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-bold outline-none focus:border-indigo-brand"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Descrição / Biografia Comercial</label>
                          <textarea 
                            value={editedDesc} 
                            onChange={(e) => setEditedDesc(e.target.value)} 
                            rows={3}
                            required
                            className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1">Ponto de Referência / Como Chegar</label>
                            <input 
                              type="text" 
                              value={editedLandmarks} 
                              onChange={(e) => setEditedLandmarks(e.target.value)} 
                              placeholder="ex: Em frente à antiga padaria, ao lado do BCI"
                              className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1">Horários & Preços de Balcão</label>
                            <input 
                              type="text" 
                              value={editedMetaInfo} 
                              onChange={(e) => setEditedMetaInfo(e.target.value)} 
                              placeholder="ex: Seg a Sáb: 08:00 - 18:00 · Preços acessíveis"
                              className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1">Endereço Físico</label>
                            <input 
                              type="text" 
                              value={editedAddress} 
                              onChange={(e) => setEditedAddress(e.target.value)} 
                              required
                              className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1">Telefone Directo / WhatsApp</label>
                            <input 
                              type="text" 
                              value={editedPhone} 
                              onChange={(e) => setEditedPhone(e.target.value)} 
                              required
                              className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-ink/70 mb-1">Oferta Promocional em Destaque na Landing Page</label>
                          <input 
                            type="text" 
                            value={editedPromo} 
                            onChange={(e) => setEditedPromo(e.target.value)} 
                            placeholder="ex: -15% em fardos de capulana esta semana!"
                            className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                          />
                        </div>

                        <button 
                          type="submit" 
                          className="w-full py-3 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs"
                        >
                          Gravar e Atualizar Vitrina Pública
                        </button>
                      </form>
                    </div>

                    {/* Gallery Photos Management */}
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-4">
                      <h3 className="font-serif font-bold text-base text-indigo-deep flex items-center justify-between border-b border-ink/10 pb-3">
                        <span className="flex items-center gap-2">
                          <Image className="w-4.5 h-4.5 text-terracotta" />
                          <span>Galeria de Fotos do Local / Trabalhos</span>
                        </span>
                        <span className="text-xs text-ink/50 font-sans font-normal">
                          {myEstablishment?.gallery?.length || 0} Fotos
                        </span>
                      </h3>

                      {/* Add Gallery Actions (Device File Upload + URL Input) */}
                      <div className="space-y-3">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <label 
                            htmlFor="gallery-file-upload" 
                            className="py-2.5 px-4 bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-2xs w-full sm:w-auto"
                          >
                            <Upload className="w-4 h-4" />
                            <span>Carregar Fotos do Dispositivo</span>
                          </label>
                          <input 
                            type="file" 
                            id="gallery-file-upload" 
                            accept="image/*" 
                            multiple 
                            onChange={handleGalleryFileUpload} 
                            className="hidden" 
                          />
                        </div>

                        {/* Add Gallery URL Form */}
                        <form onSubmit={handleAddGalleryPhoto} className="flex gap-2">
                          <input 
                            type="text" 
                            value={newGalleryUrlInput} 
                            onChange={(e) => setNewGalleryUrlInput(e.target.value)} 
                            placeholder="Ou cole o URL da imagem na web..." 
                            className="flex-grow p-2.5 bg-paper border border-ink/12 rounded-xl text-xs outline-none focus:border-indigo-brand"
                          />
                          <button 
                            type="submit" 
                            className="py-2.5 px-4 bg-indigo-deep text-paper font-bold text-xs rounded-xl cursor-pointer hover:bg-indigo-brand transition-all border border-ink/10 whitespace-nowrap"
                          >
                            + Adicionar URL
                          </button>
                        </form>
                      </div>

                      {/* Gallery Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        {/* Tile to directly trigger file picker */}
                        <label 
                          htmlFor="gallery-file-upload" 
                          className="h-28 bg-sand-2/40 border-2 border-dashed border-terracotta/40 hover:border-terracotta rounded-xl flex flex-col items-center justify-center p-2 text-center cursor-pointer transition-all hover:bg-sand-2 group"
                        >
                          <Upload className="w-6 h-6 text-terracotta group-hover:scale-110 transition-transform mb-1" />
                          <span className="text-[11px] font-bold text-indigo-deep">Adicionar Foto</span>
                          <span className="text-[9.5px] text-ink/50">Clique p/ selecionar</span>
                        </label>

                        {myEstablishment?.gallery && myEstablishment.gallery.length > 0 && (
                          myEstablishment.gallery.map((gImg, idx) => (
                            <div key={`gallery-item-${idx}-${gImg.slice(-20)}`} className="h-28 bg-sand-2/30 border border-ink/10 rounded-xl overflow-hidden relative group">
                              <img src={gImg} alt="Galeria" className="w-full h-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => handleDeleteGalleryPhoto(gImg)} 
                                className="absolute top-1.5 right-1.5 p-1.5 bg-red-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                                title="Apagar foto"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Right Column: Products Catalog Management */}
                  <div className="lg:col-span-6 space-y-6">
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-5">
                      <div className="flex items-center justify-between border-b border-ink/10 pb-4">
                        <div>
                          <h3 className="font-serif font-bold text-xl text-indigo-deep flex items-center gap-2">
                            <Tag className="w-5 h-5 text-terracotta" />
                            <span>Catálogo de Produtos & Serviços</span>
                          </h3>
                          <p className="text-xs text-ink/60 mt-0.5">Artigos expostos para encomenda direta do cliente</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={handleOpenAddProduct} 
                          className="py-2 px-3.5 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4 text-sand" />
                          <span>Adicionar Item</span>
                        </button>
                      </div>

                      {/* Products List Cards */}
                      <div className="space-y-3">
                        {myEstablishment?.productsCatalog && myEstablishment.productsCatalog.length > 0 ? (
                          myEstablishment.productsCatalog.map((prod, prodIdx) => (
                            <div key={`${prod.id || 'prod'}-${prodIdx}`} className="bg-paper border border-ink/10 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:border-indigo-brand transition-all">
                              <div className="flex items-center gap-3">
                                {prod.imageUrl ? (
                                  <div className="w-14 h-14 rounded-lg bg-sand-2/40 overflow-hidden flex-shrink-0 border border-ink/10">
                                    <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <div className="w-14 h-14 rounded-lg bg-sand-2/40 flex items-center justify-center text-indigo-deep font-bold font-serif flex-shrink-0">
                                    {prod.name.charAt(0)}
                                  </div>
                                )}
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-ink">{prod.name}</span>
                                    {prod.isPromo && (
                                      <span className="bg-terracotta text-paper text-[9px] font-bold px-2 py-0.2 rounded-md uppercase">
                                        PROMO
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-ink/60">{prod.category} · {prod.description || 'Sem descrição'}</p>
                                  <div className="mt-1 flex items-baseline gap-2">
                                    {prod.isPromo && prod.promoPriceMT ? (
                                      <>
                                        <span className="font-serif font-bold text-xs text-terracotta">{prod.promoPriceMT} MT</span>
                                        <span className="text-[11px] text-ink/40 line-through font-mono">{prod.priceMT} MT</span>
                                      </>
                                    ) : (
                                      <span className="font-serif font-bold text-xs text-indigo-deep">{prod.priceMT} MT</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 self-end sm:self-center">
                                <button 
                                  type="button" 
                                  onClick={() => handleOpenEditProduct(prod)} 
                                  className="p-2 text-indigo-deep hover:text-indigo-brand hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="Editar Artigo do Catálogo"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => handleDeleteProduct(prod.id)} 
                                  className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  title="Remover Produto"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-10 border border-dashed border-ink/15 rounded-xl p-4">
                            <Tag className="w-8 h-8 text-ink/20 mx-auto mb-2" />
                            <p className="text-xs font-semibold text-ink/50">Nenhum produto cadastrado no catálogo.</p>
                            <button 
                              type="button" 
                              onClick={() => setShowAddProductModal(true)} 
                              className="mt-3 text-xs font-bold text-indigo-deep hover:underline cursor-pointer"
                            >
                              + Criar primeiro produto agora
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB: BALCÃO DE CAIXA POS OFFLINE-FIRST (TELA ÚNICA DEDICADA) */}
            {businessTab === 'pos_caixa' && (myEstablishment || establishments[0]) && (() => {
              const currentEst = myEstablishment || establishments[0];
              return (
                <POSCashierManager
                  establishment={currentEst}
                  inventoryItems={storeInventoryItems}
                  setInventoryItems={setStoreInventoryItems}
                  activeOperator={activeOperator}
                  storeRole={storeRole}
                  financialTxs={financialTxs}
                  setFinancialTxs={setFinancialTxs}
                  isStandaloneFullscreen={true}
                  onClose={() => setBusinessTab('resumo')}
                />
              );
            })()}

            {/* TAB: INVENTÁRIO & STOCK */}
            {businessTab === 'inventario' && (myEstablishment || establishments[0]) && (() => {
              const currentEst = myEstablishment || establishments[0];
              return (
                <InventoryManager
                  establishment={currentEst}
                  inventoryItems={storeInventoryItems}
                  setInventoryItems={setStoreInventoryItems}
                  storeRole={storeRole}
                  activeOperator={activeOperator}
                  financialTxs={financialTxs}
                  setFinancialTxs={setFinancialTxs}
                  onClose={() => setBusinessTab('resumo')}
                  onOpenPos={() => setBusinessTab('pos_caixa')}
                  onSyncToVitrine={(item) => {
                    const catalog = currentEst.productsCatalog || [];
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
                      const updatedEst = { ...currentEst, productsCatalog: updatedCatalog };
                      setMyEstablishment(updatedEst);
                      const updatedAll = establishments.map(e => e.id === updatedEst.id ? updatedEst : e);
                      setEstablishments(updatedAll);
                      saveEstablishments(updatedAll);
                    }
                  }}
                />
              );
            })()}

            {/* TAB: CONTROLO OPERACIONAL DEDICADO AO TIPO DE ESTABELECIMENTO */}
            {businessTab === 'mesas' && (myEstablishment || establishments[0]) && (
              (() => {
                const currentEst = myEstablishment || establishments[0];
                const cat = (currentEst.category || '').toLowerCase();
                if (cat.includes('hospedagem') || cat.includes('hotel') || cat.includes('alojamento') || cat.includes('pousada')) {
                  return (
                    <RoomManager
                      establishment={currentEst}
                      inventoryItems={storeInventoryItems}
                      activeOperator={activeOperator}
                      financialTxs={financialTxs}
                      setFinancialTxs={setFinancialTxs}
                    />
                  );
                }
                if (cat.includes('constru') || cat.includes('estaleiro') || cat.includes('obra')) {
                  return (
                    <YardManager
                      establishment={currentEst}
                      inventoryItems={storeInventoryItems}
                      activeOperator={activeOperator}
                      financialTxs={financialTxs}
                      setFinancialTxs={setFinancialTxs}
                    />
                  );
                }
                if (cat.includes('peca') || cat.includes('peça') || cat.includes('auto') || cat.includes('oficina') || cat.includes('mecanic')) {
                  return (
                    <PartsManager
                      establishment={currentEst}
                      inventoryItems={storeInventoryItems}
                      activeOperator={activeOperator}
                      financialTxs={financialTxs}
                      setFinancialTxs={setFinancialTxs}
                    />
                  );
                }
                return (
                  <TableManager
                    establishment={currentEst}
                    tables={barTables}
                    setTables={setBarTables}
                    inventoryItems={storeInventoryItems}
                    setInventoryItems={setStoreInventoryItems}
                    activeOperator={activeOperator}
                    financialTxs={financialTxs}
                    setFinancialTxs={setFinancialTxs}
                  />
                );
              })()
            )}

            {/* TAB: EQUIPA & OPERADORES */}
            {businessTab === 'operadores' && (
              <div className="space-y-6">
                <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-brand flex items-center gap-1 mb-1">
                      <Users className="w-4 h-4" />
                      <span>Administração de Acessos & Atendentes</span>
                    </div>
                    <h2 className="font-serif font-bold text-2xl text-indigo-deep">Equipa & Vendedores Registados</h2>
                    <p className="text-xs text-ink/60 mt-1 max-w-2xl">
                      Registe os funcionários, vendedores de balcão e caixas da empresa. O sistema suporta <strong>múltiplos perfis com turno aberto simultaneamente</strong>. Cada venda no Livro Caixa ou Pedido fica associada ao respetivo vendedor.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>{openShifts.length} Turno(s) Ativo(s) Simultaneamente</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* Left Column: Form to Add Operator & Info */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-4">
                      <h3 className="font-serif font-bold text-lg text-indigo-deep flex items-center justify-between border-b border-ink/10 pb-3">
                        <span className="flex items-center gap-2">
                          <UserPlus className="w-5 h-5 text-indigo-brand" />
                          <span>Registar Novo Operador</span>
                        </span>
                        {storeRole !== 'administrador' && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-md">
                            Modo Vendedor
                          </span>
                        )}
                      </h3>

                      {storeRole === 'administrador' ? (
                        <form onSubmit={handleAddOperator} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-ink/70 mb-1.5">Nome Completo do Funcionário / Vendedor</label>
                            <input 
                              type="text" 
                              value={newOperatorInput} 
                              onChange={(e) => setNewOperatorInput(e.target.value)} 
                              placeholder="ex: Mariamo Vendedora ou Carlos Caixa" 
                              required
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl text-xs font-medium outline-none focus:border-indigo-brand"
                            />
                          </div>

                          <button 
                            type="submit" 
                            className="w-full py-3 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center justify-center gap-2"
                          >
                            <UserPlus className="w-4 h-4 text-sand" />
                            <span>Cadastrar Operador na Empresa</span>
                          </button>
                        </form>
                      ) : (
                        <div className="bg-sand-2/30 border border-amber-300/50 p-4 rounded-xl space-y-3 text-xs">
                          <p className="text-ink/70 leading-relaxed font-medium">
                            🔒 Estás atualmente com login em <strong>Modo Vendedor</strong>. O registo, edição e exclusão de membros da equipa é reservado ao <strong>Administrador da Loja</strong>.
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowRoleLoginModal(true)}
                            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            <span>Fazer Login como Administrador</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Operator Backup / Lixeira */}
                    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                        <h3 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2">
                          <RotateCcw className="w-4 h-4 text-terracotta" />
                          <span>Lixeira & Backup (Recuperação)</span>
                        </h3>
                        {deletedOperators.length > 0 && storeRole === 'administrador' && (
                          <button
                            type="button"
                            onClick={handleClearTrash}
                            className="text-[10px] font-bold text-ink/40 hover:text-red-600 transition-colors cursor-pointer"
                          >
                            Esvaziar
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-ink/60 leading-relaxed">
                        Se algum operador for removido por lapso, é mantido no backup para poder recuperar o perfil a qualquer momento sem perder histórico.
                      </p>

                      {deletedOperators.length > 0 ? (
                        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                          {deletedOperators.map((dOp, dIdx) => (
                            <div key={`${dOp.id || 'dOp'}-${dIdx}`} className="p-3 bg-paper border border-ink/10 rounded-xl flex items-center justify-between gap-2 text-xs">
                              <div>
                                <span className="font-bold text-ink block">{dOp.name}</span>
                                <span className="text-[10px] text-ink/50">Removido em: {dOp.deletedAt}</span>
                              </div>
                              {storeRole === 'administrador' ? (
                                <button
                                  type="button"
                                  onClick={() => handleRestoreOperator(dOp.name)}
                                  className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Restaurar</span>
                                </button>
                              ) : (
                                <span className="text-[9px] text-ink/40 italic">Restauro restrito a Admin</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border border-dashed border-ink/15 rounded-xl text-xs text-ink/40 font-semibold">
                          Nenhum operador na lixeira de backup.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: List of Registered Operators & Multi-Turno Status */}
                  <div className="lg:col-span-7 bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-ink/10 pb-3 gap-2">
                      <h3 className="font-serif font-bold text-xl text-indigo-deep">
                        Equipa de Atendimento ({myEstablishment?.operatorsList?.length || 3})
                      </h3>
                      <div className="text-[11px] text-indigo-brand bg-indigo-deep/5 px-3 py-1 rounded-full font-bold">
                        Pode abrir 2, 3 ou mais turnos ao mesmo tempo
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {(myEstablishment?.operatorsList && myEstablishment.operatorsList.length > 0 
                        ? myEstablishment.operatorsList 
                        : ['Mariamo Vendedora', 'Ana Atendente Balcão', 'Carlos Gerente']
                      ).map((op, opIdx) => {
                        const opSales = financialTxs.filter(t => t.type === 'receita' && t.operatorName === op);
                        const opTotalMT = opSales.reduce((sum, t) => sum + t.amountMT, 0);
                        const isShiftOpen = openShifts.includes(op);

                        return (
                          <div 
                            key={`dash-operator-row-${op}-${opIdx}`} 
                            className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                              isShiftOpen 
                                ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
                                : 'bg-paper border-ink/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-11 h-11 rounded-full text-paper font-serif font-bold text-base flex items-center justify-center ${
                                isShiftOpen ? 'bg-emerald-700' : 'bg-indigo-deep'
                              }`}>
                                {op.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-xs text-ink">{op}</h4>
                                  {isShiftOpen ? (
                                    <span className="bg-emerald-600 text-paper text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-paper animate-pulse"></span>
                                      Turno Aberto
                                    </span>
                                  ) : (
                                    <span className="bg-ink/10 text-ink/60 text-[9px] font-bold px-2 py-0.5 rounded-full">
                                      Turno Fechado
                                    </span>
                                  )}
                                  {activeOperator === op && (
                                    <span className="bg-indigo-brand text-paper text-[9px] font-bold px-2 py-0.5 rounded-full">
                                      Operador Atual no Caixa
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-ink/60 mt-0.5">
                                  Vendas Efetuadas: <strong className="text-indigo-deep">{opSales.length}</strong> · Total: <strong className="text-emerald-700">{opTotalMT.toLocaleString()} MT</strong>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleToggleShift(op)}
                                className={`py-1.5 px-3 text-[11px] font-bold rounded-lg transition-all cursor-pointer border ${
                                  isShiftOpen
                                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                                    : 'bg-indigo-deep text-paper hover:bg-indigo-brand border-indigo-deep'
                                }`}
                              >
                                {isShiftOpen ? 'Fechar Turno' : 'Abrir Turno'}
                              </button>

                              {isShiftOpen && activeOperator !== op && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveOperator(op);
                                    setTxOperator(op);
                                  }}
                                  className="py-1.5 px-2.5 bg-sand-2 text-indigo-deep hover:bg-indigo-deep hover:text-paper text-[10px] font-bold rounded-lg border border-ink/10 cursor-pointer"
                                  title="Selecionar para lançar diárias/vendas"
                                >
                                  Usar no Caixa
                                </button>
                              )}

                              {storeRole === 'administrador' ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditOperator(op)}
                                    className="p-2 text-indigo-deep/70 hover:text-indigo-brand hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                    title="Editar Informações do Operador (Apenas Administrador)"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteOperator(op)}
                                    className="p-2 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                    title="Remover Operador (Envia para Lixeira)"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setShowRoleLoginModal(true)}
                                  className="p-2 text-ink/30 hover:text-amber-700 rounded-lg transition-colors cursor-pointer"
                                  title="Edição restrita ao Administrador (Clique para Autenticar)"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Registo de Logins de Operadores */}
                  <div className="lg:col-span-12 bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-ink/10 pb-3 gap-2">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-brand flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Histórico de Sessões & Acessos à Plataforma</span>
                        </div>
                        <h3 className="font-serif font-bold text-xl text-indigo-deep mt-0.5">
                          Registo de Logins dos Operadores & Vendedores
                        </h3>
                      </div>
                      <div className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>{operatorLogins.length} Acessos Registados no Sistema</span>
                      </div>
                    </div>

                    <p className="text-xs text-ink/60">
                      Acompanhe quantos operadores e vendedores fizeram login no menu, o horário de início do turno e a função utilizada (Administrador da Loja ou Vendedor).
                    </p>

                    {operatorLogins.length === 0 ? (
                      <div className="p-8 text-center border border-dashed border-ink/15 rounded-xl text-xs text-ink/50 italic">
                        Nenhum login registado até ao momento nesta sessão.
                      </div>
                    ) : (
                      <div className="overflow-x-auto border border-ink/12 rounded-xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-sand-2/40 border-b border-ink/10 text-[10px] font-bold uppercase text-ink/60">
                              <th className="py-3 px-4">Operador / Vendedor</th>
                              <th className="py-3 px-4">Função / Perfil de Acesso</th>
                              <th className="py-3 px-4">Hora de Login</th>
                              <th className="py-3 px-4">Data</th>
                              <th className="py-3 px-4 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink/10 font-semibold">
                            {operatorLogins.map((log, logIdx) => (
                              <tr key={`${log.id || 'log'}-${logIdx}`} className="hover:bg-sand-2/20 transition-colors">
                                <td className="py-3 px-4 text-indigo-deep font-bold flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-full bg-indigo-deep text-white font-serif font-bold text-xs flex items-center justify-center">
                                    {log.operatorName.charAt(0).toUpperCase()}
                                  </div>
                                  <span>{log.operatorName}</span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                                    log.role === 'administrador' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {log.role === 'administrador' ? '👑 Admin' : '🛍️ Vendedor'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-ink font-mono">{log.loginTime}</td>
                                <td className="py-3 px-4 text-ink/70">{log.date}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    ✅ Registado
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: GESTÃO DE PEDIDOS E RESERVAS */}
            {businessTab === 'pedidos' && (
              <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <h2 className="font-serif font-bold text-2xl text-indigo-deep flex items-center gap-2">
                      <ShoppingBag className="w-6 h-6 text-terracotta" />
                      <span>Gestão de Pedidos & Agendamentos</span>
                    </h2>
                    <p className="text-xs text-ink/60 mt-1">
                      Pedidos de compra diretos das lojas, supermercados e agendamentos de hospedagens ou mesas de bar.
                    </p>
                  </div>
                  <span className="bg-indigo-deep text-paper text-xs font-bold py-1.5 px-3 rounded-full">
                    {storeOrders.length} Registados
                  </span>
                </div>

                {storeOrders.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-ink/15 rounded-xl p-6">
                    <ShoppingBag className="w-10 h-10 text-ink/20 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-ink/50">Nenhum pedido ou agendamento registado até ao momento.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-ink/12 bg-sand-2/30 text-ink/70 font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3">Data / Hora</th>
                          <th className="p-3">Cliente / Contacto</th>
                          <th className="p-3">Item / Serviço Solicitado</th>
                          <th className="p-3">Valor Estimado</th>
                          <th className="p-3">Pagamento</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Acções</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/8 font-medium">
                        {storeOrders.map((ord, oIdx) => (
                          <tr key={`${ord.id || 'order'}-${oIdx}`} className="hover:bg-sand-2/10 transition-colors">
                            <td className="p-3 font-semibold text-indigo-deep whitespace-nowrap">
                              <div>{ord.date}</div>
                              <div className="text-[10px] text-ink/40 font-normal">{ord.time}</div>
                            </td>
                            <td className="p-3">
                              <div className="font-bold text-ink">{ord.customerName}</div>
                              <div className="text-[10px] text-indigo-brand font-semibold">{ord.customerPhone}</div>
                            </td>
                            <td className="p-3 max-w-xs">
                              <div className="font-bold text-indigo-deep">{ord.itemsOrService}</div>
                              {ord.notes && <div className="text-[10px] text-ink/50 italic mt-0.5">Note: {ord.notes}</div>}
                            </td>
                            <td className="p-3 font-bold text-emerald-700 whitespace-nowrap">
                              {ord.totalAmount.toLocaleString()} MT
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="bg-sand-2/80 text-ink/80 text-[10.5px] px-2 py-0.5 rounded-md font-semibold border border-ink/10">
                                {ord.paymentMethod}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                ord.status === 'Concluído' 
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                                  : ord.status === 'Confirmado' 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                                    : ord.status === 'Cancelado'
                                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                              }`}>
                                {ord.status}
                              </span>
                            </td>
                            <td className="p-3 text-right whitespace-nowrap space-x-1">
                              <select 
                                value={ord.status} 
                                onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value as any)}
                                className="bg-paper border border-ink/15 text-[11px] font-bold p-1 rounded-lg outline-none cursor-pointer focus:border-indigo-brand"
                              >
                                <option value="Pendente">Pendente</option>
                                <option value="Confirmado">Confirmado</option>
                                <option value="Concluído">Concluído</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: HISTÓRICO DE CLIENTES (CRM) */}
            {businessTab === 'clientes' && (
              <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <h2 className="font-serif font-bold text-2xl text-indigo-deep flex items-center gap-2">
                      <Users className="w-6 h-6 text-indigo-brand" />
                      <span>Histórico & Ficha de Clientes (CRM)</span>
                    </h2>
                    <p className="text-xs text-ink/60 mt-1">
                      Registo centralizado de contactos, hábitos de compra, total gasto e tags dos clientes do teu estabelecimento.
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddCustModal(true)}
                    className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4 text-sand" />
                    <span>Adicionar Novo Cliente</span>
                  </button>
                </div>

                {showAddCustModal && (
                  <form onSubmit={handleAddCustomer} className="bg-sand-2/20 border border-indigo-brand/20 p-4 rounded-xl space-y-3 text-xs">
                    <div className="font-bold text-indigo-deep text-sm mb-1">Novo Ficheiro de Cliente</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        placeholder="Nome do Cliente *" 
                        value={custName} 
                        onChange={(e) => setCustName(e.target.value)} 
                        required 
                        className="p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                      />
                      <input 
                        type="text" 
                        placeholder="Telemóvel / WhatsApp *" 
                        value={custPhone} 
                        onChange={(e) => setCustPhone(e.target.value)} 
                        required 
                        className="p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                      />
                      <input 
                        type="email" 
                        placeholder="E-mail (opcional)" 
                        value={custEmail} 
                        onChange={(e) => setCustEmail(e.target.value)} 
                        className="p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input 
                        type="text" 
                        placeholder="Tags separadas por vírgula (ex: Vip, Habitual, Atacado)" 
                        value={custTagInput} 
                        onChange={(e) => setCustTagInput(e.target.value)} 
                        className="p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                      />
                      <input 
                        type="text" 
                        placeholder="Notas / Observações sobre preferências" 
                        value={custNotes} 
                        onChange={(e) => setCustNotes(e.target.value)} 
                        className="p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button 
                        type="button" 
                        onClick={() => setShowAddCustModal(false)}
                        className="py-2 px-4 bg-paper border border-ink/15 rounded-lg font-bold text-ink/70 hover:bg-sand-2/40"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit" 
                        className="py-2 px-5 bg-indigo-deep text-paper font-bold rounded-lg hover:bg-indigo-brand"
                      >
                        Gravar Cliente
                      </button>
                    </div>
                  </form>
                )}

                {storeCustomers.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-ink/15 rounded-xl p-6">
                    <Users className="w-10 h-10 text-ink/20 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-ink/50">Nenhum cliente registado ainda.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {storeCustomers.map((c, cIdx) => (
                      <div key={`${c.id || 'cust'}-${cIdx}`} className="border border-ink/12 bg-paper rounded-2xl p-4 space-y-2.5 shadow-2xs hover:border-indigo-brand transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-sm text-indigo-deep">{c.name}</div>
                            <div className="text-xs font-semibold text-indigo-brand">{c.phone}</div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="bg-sand-2 text-indigo-deep text-[10px] font-bold py-0.5 px-2 rounded-md">
                              {c.totalOrdersCount} {c.totalOrdersCount === 1 ? 'Pedido' : 'Pedidos'}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomer(c.id)}
                              className="p-1 text-ink/30 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                              title="Remover cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="bg-white p-2.5 rounded-xl border border-ink/8 flex justify-between items-center text-xs">
                          <span className="text-ink/60 font-medium">Total Consumido:</span>
                          <span className="font-serif font-bold text-emerald-700">{c.totalSpentMT.toLocaleString()} MT</span>
                        </div>

                        {c.notes && (
                          <p className="text-[11px] text-ink/70 italic bg-sand-2/20 p-2 rounded-lg leading-snug">
                            "{c.notes}"
                          </p>
                        )}

                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          {c.tags.map((t, idx) => (
                            <span key={`cust-tag-${t}-${idx}`} className="bg-indigo-brand/10 text-indigo-brand text-[9.5px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5" />
                              <span>{t}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CONTROLO FINANCEIRO & FLUXO DE CAIXA (EXCEL REPLACEMENT) */}
            {businessTab === 'financeiro' && (
              <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
                
                {/* Header & Excel Replacement Banner */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ink/10 pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold py-0.5 px-2.5 rounded-md mb-1 border border-emerald-300">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Substituto Directo do Excel e Livro de Caixa Manual</span>
                    </div>
                    <h2 className="font-serif font-bold text-2xl text-indigo-deep">
                      Controlo Financeiro & Livro Caixa em Meticais (MT)
                    </h2>
                    <p className="text-xs text-ink/60 mt-0.5">
                      Controle entradas de dinheiro, pagamentos M-Pesa, despesas operacionais e saiba o saldo exato em caixa em tempo real.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowCalculator(!showCalculator)}
                      className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs border ${
                        showCalculator 
                          ? 'bg-amber-500 text-paper border-amber-600' 
                          : 'bg-paper text-indigo-deep border-ink/15 hover:bg-sand-2/40'
                      }`}
                    >
                      <Calculator className="w-4 h-4 text-terracotta" />
                      <span>{showCalculator ? 'Ocultar Calculadora' : 'Calculadora de Caixa & Troco'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleExportCSV}
                      className="py-2.5 px-3.5 bg-paper border border-ink/15 hover:bg-sand-2/40 text-indigo-deep text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                      title="Exportar dados para ficheiro CSV / Excel"
                    >
                      <Download className="w-4 h-4 text-emerald-700" />
                      <span>Exportar CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="py-2.5 px-3 bg-paper border border-ink/15 hover:bg-sand-2/40 text-indigo-deep text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                      title="Imprimir relatório"
                    >
                      <Printer className="w-4 h-4 text-indigo-brand" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFechoCaixaModal(true)}
                      className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Lock className="w-4 h-4 text-sand" />
                      <span>Fechar Caixa</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowFinTrashModal(!showFinTrashModal)}
                      className={`py-2.5 px-3.5 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs border ${
                        showFinTrashModal
                          ? 'bg-rose-100 text-rose-900 border-rose-300'
                          : 'bg-paper text-indigo-deep border-ink/15 hover:bg-sand-2/40'
                      }`}
                      title="Abrir Lixeira e Backup de Lançamentos Eliminados"
                    >
                      <RotateCcw className="w-4 h-4 text-terracotta" />
                      <span>Lixeira / Backup ({deletedFinancialTxs.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenAddTxModal}
                      className="py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Lançar Entrada / Saída</span>
                    </button>
                  </div>
                </div>

                {/* CALCULADORA DE CAIXA, CONTAGEM DE NOTAS MT E TROCO (EXPANDABLE WIDGET) */}
                {showCalculator && (
                  <div className="bg-sand-2/30 border-2 border-terracotta/30 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-ink/10 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-terracotta text-paper rounded-xl">
                          <Calculator className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-indigo-deep">Calculadora de Caixa do Vendedor</h3>
                          <p className="text-[11px] text-ink/60">Auxiliar rápido para contagem de dinheiro físico, cálculo de troco e somatório de talões</p>
                        </div>
                      </div>

                      {/* Calculator Mode Switcher */}
                      <div className="flex items-center bg-white p-1 rounded-xl border border-ink/12 text-xs font-bold w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => setCalcMode('simples')}
                          className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                            calcMode === 'simples' ? 'bg-indigo-deep text-paper shadow-2xs' : 'text-ink/60 hover:text-ink'
                          }`}
                        >
                          Teclado / Somatório
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcMode('notas')}
                          className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                            calcMode === 'notas' ? 'bg-indigo-deep text-paper shadow-2xs' : 'text-ink/60 hover:text-ink'
                          }`}
                        >
                          Contador Notas (MT)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCalcMode('troco')}
                          className={`flex-1 sm:flex-initial py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                            calcMode === 'troco' ? 'bg-indigo-deep text-paper shadow-2xs' : 'text-ink/60 hover:text-ink'
                          }`}
                        >
                          Cálculo de Troco
                        </button>
                      </div>
                    </div>

                    {/* MODE 1: SIMPLE KEYPAD CALCULATOR */}
                    {calcMode === 'simples' && (
                      <div className="max-w-md mx-auto bg-white border border-ink/12 p-4 rounded-2xl shadow-xs space-y-3">
                        <div className="bg-indigo-deep text-paper p-3 rounded-xl text-right font-mono text-2xl font-bold tracking-wider overflow-x-auto">
                          {calcExpr}
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-sm font-bold">
                          <button type="button" onClick={() => handleCalcPress('C')} className="p-3 bg-rose-100 text-rose-800 rounded-xl hover:bg-rose-200 cursor-pointer">C</button>
                          <button type="button" onClick={() => handleCalcPress('DEL')} className="p-3 bg-sand-2/60 text-ink rounded-xl hover:bg-sand-2 cursor-pointer">←</button>
                          <button type="button" onClick={() => handleCalcPress('/')} className="p-3 bg-indigo-brand/10 text-indigo-brand rounded-xl hover:bg-indigo-brand/20 cursor-pointer">÷</button>
                          <button type="button" onClick={() => handleCalcPress('*')} className="p-3 bg-indigo-brand/10 text-indigo-brand rounded-xl hover:bg-indigo-brand/20 cursor-pointer">×</button>

                          <button type="button" onClick={() => handleCalcPress('7')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">7</button>
                          <button type="button" onClick={() => handleCalcPress('8')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">8</button>
                          <button type="button" onClick={() => handleCalcPress('9')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">9</button>
                          <button type="button" onClick={() => handleCalcPress('-')} className="p-3 bg-indigo-brand/10 text-indigo-brand rounded-xl hover:bg-indigo-brand/20 cursor-pointer">-</button>

                          <button type="button" onClick={() => handleCalcPress('4')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">4</button>
                          <button type="button" onClick={() => handleCalcPress('5')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">5</button>
                          <button type="button" onClick={() => handleCalcPress('6')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">6</button>
                          <button type="button" onClick={() => handleCalcPress('+')} className="p-3 bg-indigo-brand/10 text-indigo-brand rounded-xl hover:bg-indigo-brand/20 cursor-pointer">+</button>

                          <button type="button" onClick={() => handleCalcPress('1')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">1</button>
                          <button type="button" onClick={() => handleCalcPress('2')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">2</button>
                          <button type="button" onClick={() => handleCalcPress('3')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">3</button>
                          <button type="button" onClick={() => handleCalcPress('=')} className="row-span-2 p-3 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 cursor-pointer flex items-center justify-center font-serif text-xl">=</button>

                          <button type="button" onClick={() => handleCalcPress('0')} className="col-span-2 p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">0</button>
                          <button type="button" onClick={() => handleCalcPress('.')} className="p-3 bg-paper border border-ink/10 text-ink rounded-xl hover:bg-sand-2/30 cursor-pointer">,</button>
                        </div>

                        {/* Action to use calculated result in transaction modal */}
                        <div className="pt-2 border-t border-ink/10 flex justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              const num = parseFloat(calcExpr);
                              if (!isNaN(num) && num > 0) {
                                setTxAmount(num);
                                setShowAddTxModal(true);
                              }
                            }}
                            className="py-2 px-3.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Usar {calcExpr} MT em Novo Lançamento</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* MODE 2: DENOMINATION NOTES COUNTER IN METICAIS */}
                    {calcMode === 'notas' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Nota de 1000 MT</span>
                              <Banknote className="w-4 h-4 text-emerald-700" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={n1000 || ''} 
                                onChange={(e) => setN1000(Math.max(0, parseInt(e.target.value) || 0))} 
                                placeholder="0" 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(n1000 * 1000).toLocaleString()} MT</span>
                            </div>
                          </div>

                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Nota de 500 MT</span>
                              <Banknote className="w-4 h-4 text-emerald-600" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={n500 || ''} 
                                onChange={(e) => setN500(Math.max(0, parseInt(e.target.value) || 0))} 
                                placeholder="0" 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(n500 * 500).toLocaleString()} MT</span>
                            </div>
                          </div>

                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Nota de 200 MT</span>
                              <Banknote className="w-4 h-4 text-blue-600" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={n200 || ''} 
                                onChange={(e) => setN200(Math.max(0, parseInt(e.target.value) || 0))} 
                                placeholder="0" 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(n200 * 200).toLocaleString()} MT</span>
                            </div>
                          </div>

                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Nota de 100 MT</span>
                              <Banknote className="w-4 h-4 text-amber-600" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={n100 || ''} 
                                onChange={(e) => setN100(Math.max(0, parseInt(e.target.value) || 0))} 
                                placeholder="0" 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(n100 * 100).toLocaleString()} MT</span>
                            </div>
                          </div>

                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Nota de 50 MT</span>
                              <Banknote className="w-4 h-4 text-amber-700" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={n50 || ''} 
                                onChange={(e) => setN50(Math.max(0, parseInt(e.target.value) || 0))} 
                                placeholder="0" 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(n50 * 50).toLocaleString()} MT</span>
                            </div>
                          </div>

                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Nota de 20 MT</span>
                              <Banknote className="w-4 h-4 text-purple-600" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={n20 || ''} 
                                onChange={(e) => setN20(Math.max(0, parseInt(e.target.value) || 0))} 
                                placeholder="0" 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(n20 * 20).toLocaleString()} MT</span>
                            </div>
                          </div>

                          <div className="bg-white border border-ink/10 p-3 rounded-xl space-y-1 col-span-2">
                            <span className="font-bold text-indigo-deep flex items-center justify-between">
                              <span>Moedas & Trocos Soltos (MT)</span>
                              <Coins className="w-4 h-4 text-amber-500" />
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="0" 
                                value={nCoins || ''} 
                                onChange={(e) => setNCoins(Math.max(0, parseFloat(e.target.value) || 0))} 
                                placeholder="Total em moedas..." 
                                className="w-full p-2 bg-paper border border-ink/12 rounded-lg font-bold text-ink"
                              />
                              <span className="font-serif font-bold text-emerald-800 whitespace-nowrap">{(nCoins || 0).toLocaleString()} MT</span>
                            </div>
                          </div>
                        </div>

                        {/* Total Contado Summary Bar */}
                        <div className="bg-indigo-deep text-paper p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
                          <div>
                            <span className="text-xs font-bold text-sand uppercase tracking-wider">Total Físico Contado na Gaveta:</span>
                            <div className="text-2xl font-serif font-bold">
                              {((n1000 * 1000) + (n500 * 500) + (n200 * 200) + (n100 * 100) + (n50 * 50) + (n20 * 20) + (nCoins || 0)).toLocaleString()} MT
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setN1000(0); setN500(0); setN200(0); setN100(0); setN50(0); setN20(0); setNCoins(0);
                              }}
                              className="py-2 px-3 bg-paper/10 hover:bg-paper/20 text-paper text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Limpar Contagem</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const total = (n1000 * 1000) + (n500 * 500) + (n200 * 200) + (n100 * 100) + (n50 * 50) + (n20 * 20) + (nCoins || 0);
                                if (total > 0) {
                                  setShowFechoCaixaModal(true);
                                }
                              }}
                              className="py-2 px-4 bg-terracotta hover:bg-terracotta/90 text-paper text-xs font-bold rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5 text-sand" />
                              <span>Usar no Fecho de Caixa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MODE 3: TROCO CALCULATOR */}
                    {calcMode === 'troco' && (
                      <div className="max-w-lg mx-auto bg-white border border-ink/12 p-5 rounded-2xl shadow-xs space-y-4 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block font-bold text-ink/70 mb-1">Preço Total da Compra (MT) *</label>
                            <input 
                              type="number" 
                              value={trocoPrice || ''} 
                              onChange={(e) => setTrocoPrice(parseFloat(e.target.value) || 0)} 
                              placeholder="ex: 850" 
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl font-bold text-sm text-ink outline-none focus:border-indigo-brand"
                            />
                          </div>

                          <div>
                            <label className="block font-bold text-ink/70 mb-1">Valor Entregue pelo Cliente (MT) *</label>
                            <input 
                              type="number" 
                              value={trocoPaid || ''} 
                              onChange={(e) => setTrocoPaid(parseFloat(e.target.value) || 0)} 
                              placeholder="ex: 1000" 
                              className="w-full p-3 bg-paper border border-ink/12 rounded-xl font-bold text-sm text-ink outline-none focus:border-indigo-brand"
                            />
                          </div>
                        </div>

                        {/* Calculated Troco Display Card */}
                        <div className={`p-4 rounded-xl border text-center transition-all ${
                          trocoPaid >= trocoPrice && trocoPrice > 0
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                            : trocoPrice > trocoPaid
                              ? 'bg-rose-50 border-rose-300 text-rose-900'
                              : 'bg-sand-2/40 border-ink/10 text-ink/60'
                        }`}>
                          <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5">
                            {trocoPaid >= trocoPrice && trocoPrice > 0 
                              ? 'Troco Exato a Devolver ao Cliente:' 
                              : trocoPrice > trocoPaid 
                                ? 'Falta o Cliente Pagar:' 
                                : 'Aguardando valores...'}
                          </div>
                          <div className="text-3xl font-serif font-bold">
                            {Math.abs(trocoPaid - trocoPrice).toLocaleString()} MT
                          </div>
                          {trocoPaid >= trocoPrice && trocoPrice > 0 && (
                            <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                              ✓ Devolva {Math.abs(trocoPaid - trocoPrice).toLocaleString()} MT ao cliente.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Enhanced International Financial KPI Dashboard */}
                <div className="space-y-6">
                  {/* Executive Metric Cards (6 Indicators) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                    
                    {/* KPI 1: Receita Total */}
                    <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                        <span>Receita Total</span>
                        <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-xl font-serif font-bold text-emerald-900">
                        {totalReceitaMT.toLocaleString()} MT
                      </div>
                      <p className="text-[10px] text-emerald-700/80 font-medium">{countVendas} vendas registadas</p>
                    </div>

                    {/* KPI 2: Total Despesas */}
                    <div className="bg-rose-50/70 border border-rose-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 uppercase tracking-wider">
                        <span>Despesas / Saídas</span>
                        <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                      </div>
                      <div className="text-xl font-serif font-bold text-rose-900">
                        {totalDespesaMT.toLocaleString()} MT
                      </div>
                      <p className="text-[10px] text-rose-700/80 font-medium">Custos operacionais</p>
                    </div>

                    {/* KPI 3: Saldo de Caixa */}
                    <div className="bg-indigo-deep text-paper p-4 rounded-2xl space-y-1 shadow-xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-sand uppercase tracking-wider">
                        <span>Saldo Líquido</span>
                        <DollarSign className="w-4 h-4 text-sand" />
                      </div>
                      <div className="text-xl font-serif font-bold text-paper">
                        {saldoCaixaMT.toLocaleString()} MT
                      </div>
                      <p className="text-[10px] text-paper/70 font-medium">Caixa físico e digital</p>
                    </div>

                    {/* KPI 4: Margem de Lucro (%) */}
                    <div className="bg-amber-50/70 border border-amber-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                        <span>Margem Lucro</span>
                        <TrendingUp className="w-4 h-4 text-amber-700" />
                      </div>
                      <div className="text-xl font-serif font-bold text-amber-950">
                        {margemLucroPct}%
                      </div>
                      <p className="text-[10px] text-amber-800/80 font-medium">Eficiência do negócio</p>
                    </div>

                    {/* KPI 5: Ticket Médio (AOV) */}
                    <div className="bg-sky-50/70 border border-sky-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-sky-900 uppercase tracking-wider">
                        <span>Ticket Médio</span>
                        <BarChart3 className="w-4 h-4 text-sky-700" />
                      </div>
                      <div className="text-xl font-serif font-bold text-sky-950">
                        {ticketMedioMT.toLocaleString()} MT
                      </div>
                      <p className="text-[10px] text-sky-800/80 font-medium">Média por transação</p>
                    </div>

                    {/* KPI 6: Projeção Fecho Mensal */}
                    <div className="bg-purple-50/70 border border-purple-200/80 p-4 rounded-2xl space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                        <span>Projeção Mensal</span>
                        <Activity className="w-4 h-4 text-purple-700" />
                      </div>
                      <div className="text-xl font-serif font-bold text-purple-950">
                        {projecaoMensalMT.toLocaleString()} MT
                      </div>
                      <p className="text-[10px] text-purple-800/80 font-medium">Estimativa de faturação</p>
                    </div>

                  </div>

                  {/* Payment Methods Distribution & Operator Performance Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* Payment Channel Breakdown */}
                    <div className="lg:col-span-5 bg-white border border-ink/12 p-5 rounded-2xl shadow-2xs space-y-4">
                      <h3 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2 border-b border-ink/10 pb-3">
                        <PieChart className="w-4 h-4 text-indigo-brand" />
                        <span>Distribuição de Vendas por Canal</span>
                      </h3>

                      <div className="space-y-3">
                        {/* M-Pesa */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-ink mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block"></span>
                              M-Pesa Vodacom
                            </span>
                            <span className="font-serif">{totalMPesa.toLocaleString()} MT ({totalReceitaMT > 0 ? Math.round((totalMPesa/totalReceitaMT)*100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-sand-2 h-2 rounded-full overflow-hidden">
                            <div className="bg-red-600 h-full rounded-full transition-all" style={{ width: `${totalReceitaMT > 0 ? (totalMPesa/totalReceitaMT)*100 : 0}%` }}></div>
                          </div>
                        </div>

                        {/* e-Mola */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-ink mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                              e-Mola Movitel
                            </span>
                            <span className="font-serif">{totalEMola.toLocaleString()} MT ({totalReceitaMT > 0 ? Math.round((totalEMola/totalReceitaMT)*100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-sand-2 h-2 rounded-full overflow-hidden">
                            <div className="bg-orange-500 h-full rounded-full transition-all" style={{ width: `${totalReceitaMT > 0 ? (totalEMola/totalReceitaMT)*100 : 0}%` }}></div>
                          </div>
                        </div>

                        {/* Dinheiro */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-ink mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block"></span>
                              Dinheiro Físico (Espécie)
                            </span>
                            <span className="font-serif">{totalDinheiro.toLocaleString()} MT ({totalReceitaMT > 0 ? Math.round((totalDinheiro/totalReceitaMT)*100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-sand-2 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-600 h-full rounded-full transition-all" style={{ width: `${totalReceitaMT > 0 ? (totalDinheiro/totalReceitaMT)*100 : 0}%` }}></div>
                          </div>
                        </div>

                        {/* Bancos */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-ink mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block"></span>
                              Transferência Bancária (BCI/BIM)
                            </span>
                            <span className="font-serif">{totalBancos.toLocaleString()} MT ({totalReceitaMT > 0 ? Math.round((totalBancos/totalReceitaMT)*100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-sand-2 h-2 rounded-full overflow-hidden">
                            <div className="bg-blue-600 h-full rounded-full transition-all" style={{ width: `${totalReceitaMT > 0 ? (totalBancos/totalReceitaMT)*100 : 0}%` }}></div>
                          </div>
                        </div>

                        {/* POS Cartão */}
                        <div>
                          <div className="flex justify-between text-xs font-bold text-ink mb-1">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block"></span>
                              POS / Cartão de Débito
                            </span>
                            <span className="font-serif">{totalPOS.toLocaleString()} MT ({totalReceitaMT > 0 ? Math.round((totalPOS/totalReceitaMT)*100) : 0}%)</span>
                          </div>
                          <div className="w-full bg-sand-2 h-2 rounded-full overflow-hidden">
                            <div className="bg-purple-600 h-full rounded-full transition-all" style={{ width: `${totalReceitaMT > 0 ? (totalPOS/totalReceitaMT)*100 : 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Operator Sales Matrix */}
                    <div className="lg:col-span-7 bg-white border border-ink/12 p-5 rounded-2xl shadow-2xs space-y-4">
                      <div className="flex items-center justify-between border-b border-ink/10 pb-3">
                        <h3 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2">
                          <Users className="w-4 h-4 text-indigo-brand" />
                          <span>Desempenho por Operador & Vendedor</span>
                        </h3>
                        <span className="text-[10px] text-ink/50 font-bold uppercase tracking-wider">
                          {openShifts.length} Turno(s) Ativo(s)
                        </span>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-ink/10 text-[10px] font-bold uppercase text-ink/50 tracking-wider">
                              <th className="pb-2">Operador / Vendedor</th>
                              <th className="pb-2">Estado Turno</th>
                              <th className="pb-2 text-center">Vendas</th>
                              <th className="pb-2 text-right">Total (MT)</th>
                              <th className="pb-2 text-right">Ticket Médio</th>
                              <th className="pb-2 text-right">Participação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ink/5">
                            {operatorPerformanceList.map((opItem, idx) => (
                              <tr key={`op-perf-row-${opItem.name}-${idx}`} className="hover:bg-sand-2/20 transition-colors">
                                <td className="py-2.5 font-bold text-indigo-deep">{opItem.name}</td>
                                <td className="py-2.5">
                                  {opItem.isOpen ? (
                                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                                      Aberto
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-bold text-ink/40 bg-ink/5 px-2 py-0.5 rounded-full">
                                      Fechado
                                    </span>
                                  )}
                                </td>
                                <td className="py-2.5 text-center font-semibold text-ink/80">{opItem.salesCount}</td>
                                <td className="py-2.5 text-right font-serif font-bold text-emerald-800">{opItem.totalRevenueMT.toLocaleString()} MT</td>
                                <td className="py-2.5 text-right font-mono text-ink/70">{opItem.avgTicketMT.toLocaleString()} MT</td>
                                <td className="py-2.5 text-right font-bold text-indigo-brand">{opItem.sharePct}%</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Quick Payment Method Bar & Filters */}
                <div className="bg-sand-2/30 border border-ink/10 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-bold text-indigo-deep flex items-center gap-1">
                      <Filter className="w-3.5 h-3.5" />
                      <span>Filtrar Registos:</span>
                    </span>

                    <select
                      value={finFilterType}
                      onChange={(e) => setFinFilterType(e.target.value as any)}
                      className="p-2 bg-white border border-ink/12 rounded-lg font-semibold text-xs outline-none cursor-pointer"
                    >
                      <option value="todos">Todos os Tipos</option>
                      <option value="receita">🟢 Apenas Entradas (Receitas)</option>
                      <option value="despesa">🔴 Apenas Saídas (Despesas)</option>
                    </select>

                    <select
                      value={finFilterMethod}
                      onChange={(e) => setFinFilterMethod(e.target.value)}
                      className="p-2 bg-white border border-ink/12 rounded-lg font-semibold text-xs outline-none cursor-pointer"
                    >
                      <option value="todos">Todas as Formas de Pagamento</option>
                      <option value="M-Pesa">M-Pesa</option>
                      <option value="e-Mola">e-Mola</option>
                      <option value="Dinheiro">Dinheiro Físico</option>
                      <option value="Transferência BCI/BIM">Transferência Bancária</option>
                      <option value="POS Cartão">POS Cartão</option>
                    </select>

                    <select
                      value={finFilterOperator}
                      onChange={(e) => setFinFilterOperator(e.target.value)}
                      className="p-2 bg-white border border-ink/12 rounded-lg font-semibold text-xs outline-none cursor-pointer"
                    >
                      <option value="todos">Todos os Operadores / Vendedores</option>
                      {currentOperatorsList.map((op, idx) => (
                        <option key={`fin-filter-op-${op}-${idx}`} value={op}>{op}</option>
                      ))}
                    </select>
                  </div>

                  <div className="text-[11px] font-semibold text-ink/60 bg-white px-3 py-1.5 rounded-lg border border-ink/10">
                    A mostrar <strong className="text-indigo-deep">{filteredFinancialTxs.length}</strong> de {financialTxs.length} lançamentos
                  </div>
                </div>

                {/* Lixeira & Backup de Lançamentos Financeiros (Recuperação de Erros) */}
                {showFinTrashModal && (
                  <div className="bg-rose-50/50 border-2 border-rose-300/60 p-5 rounded-2xl space-y-4 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-rose-200 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-rose-600 text-white rounded-xl shadow-2xs">
                          <RotateCcw className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-serif font-bold text-base text-rose-950 flex items-center gap-2">
                            <span>Lixeira & Backup de Lançamentos Eliminados</span>
                            <span className="text-xs bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full font-sans font-bold">
                              {deletedFinancialTxs.length} registo(s)
                            </span>
                          </h3>
                          <p className="text-[11px] text-rose-800/80">
                            Restaure movimentações apagadas por engano para que o seu caixa mantenha a integridade dos saldos.
                          </p>
                        </div>
                      </div>

                      {deletedFinancialTxs.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearFinancialTrash}
                          className="py-1.5 px-3 bg-white border border-rose-300 text-rose-700 hover:bg-rose-100 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Esvaziar Lixeira</span>
                        </button>
                      )}
                    </div>

                    {deletedFinancialTxs.length === 0 ? (
                      <div className="text-center py-6 text-xs text-rose-800/60 font-medium">
                        A lixeira está vazia. Nenhum lançamento financeiro foi eliminado recentemente.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs bg-white rounded-xl border border-rose-200">
                          <thead>
                            <tr className="border-b border-rose-100 bg-rose-50/70 text-rose-900 text-[10px] font-bold uppercase tracking-wider">
                              <th className="p-2.5">Data Lançamento</th>
                              <th className="p-2.5">Tipo</th>
                              <th className="p-2.5">Categoria / Descrição</th>
                              <th className="p-2.5 text-right">Valor (MT)</th>
                              <th className="p-2.5">Eliminado em</th>
                              <th className="p-2.5 text-right">Acções de Recuperação</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-rose-100 font-medium text-ink">
                            {deletedFinancialTxs.map((item, dTxIdx) => (
                              <tr key={`${item.id || 'dtx'}-${dTxIdx}`} className="hover:bg-rose-50/40 transition-colors">
                                <td className="p-2.5 font-bold text-indigo-deep">{item.tx.date}</td>
                                <td className="p-2.5">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                    item.tx.type === 'receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                  }`}>
                                    {item.tx.type === 'receita' ? 'Entrada' : 'Saída'}
                                  </span>
                                </td>
                                <td className="p-2.5">
                                  <div className="font-bold text-ink">{item.tx.description}</div>
                                  <div className="text-[10px] text-ink/50">{item.tx.category} • {item.tx.paymentMethod}</div>
                                </td>
                                <td className="p-2.5 text-right font-serif font-bold text-ink/90">
                                  {item.tx.amountMT.toLocaleString()} MT
                                </td>
                                <td className="p-2.5 text-[10px] text-ink/60 font-mono">{item.deletedAt}</td>
                                <td className="p-2.5 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleRestoreFinancialTransaction(item.id)}
                                      className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                                      title="Restaurar este lançamento para o livro caixa"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Restaurar</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handlePermanentDeleteFinancial(item.id)}
                                      className="p-1 text-rose-600 hover:bg-rose-100 rounded-md transition-colors"
                                      title="Excluir definitivamente"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Add or Edit Transaction Modal (Floating Pop-up over whole interface) */}
                {showAddTxModal && (
                  <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleAddOrUpdateFinancialTransaction} className="bg-paper border border-ink/15 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto">
                      <div className="flex justify-between items-center border-b border-ink/10 pb-2.5">
                        <div>
                          <div className="font-serif font-bold text-indigo-deep text-base flex items-center gap-2">
                            {txType === 'receita' ? (
                              <ArrowUpCircle className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ArrowDownCircle className="w-5 h-5 text-rose-600" />
                            )}
                            <span>{editingTx ? '✏️ Editar Lançamento no Livro Caixa' : '➕ Lançar Entrada / Saída de Caixa'}</span>
                          </div>
                          <p className="text-[11px] text-ink/60">
                            {editingTx ? `A modificar os dados do registo #${editingTx.id}` : 'Adicionar movimento de receita ou despesa no fluxo de caixa'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTxModal(false);
                            setEditingTx(null);
                          }}
                          className="p-1.5 text-ink/40 hover:text-ink rounded-lg hover:bg-sand-2 transition-colors cursor-pointer"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Data do Lançamento *</label>
                          <input 
                            type="date"
                            value={txDate} 
                            onChange={(e) => setTxDate(e.target.value)}
                            required
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none focus:border-indigo-brand"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Tipo de Movimento</label>
                          <select 
                            value={txType} 
                            onChange={(e) => setTxType(e.target.value as any)}
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none"
                          >
                            <option value="receita">🟢 Receita (Entrada)</option>
                            <option value="despesa">🔴 Despesa (Saída)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Categoria</label>
                          <select 
                            value={txCategory} 
                            onChange={(e) => setTxCategory(e.target.value as any)}
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none"
                          >
                            <option value="Vendas de Produtos">Vendas de Produtos</option>
                            <option value="Diárias de Hospedagem">Diárias de Hospedagem</option>
                            <option value="Serviços & Reservas">Serviços & Reservas</option>
                            <option value="Mercadoria / Stock">Mercadoria / Stock</option>
                            <option value="Renda / Instalações">Renda / Instalações</option>
                            <option value="Salários & Pessoal">Salários & Pessoal</option>
                            <option value="Energia / Água / Net">Energia / Água / Net</option>
                            <option value="Transporte & Entregas">Transporte & Entregas</option>
                            <option value="Outros">Outros</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Valor em Meticais (MT) *</label>
                          <input 
                            type="number" 
                            placeholder="ex: 2500" 
                            value={txAmount || ''} 
                            onChange={(e) => setTxAmount(Number(e.target.value))} 
                            required 
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-serif font-bold text-sm outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Descrição / Histórico *</label>
                          <input 
                            type="text" 
                            placeholder="ex: Venda de fardo de arroz / Pagamento factura EDM" 
                            value={txDesc} 
                            onChange={(e) => setTxDesc(e.target.value)} 
                            required 
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Forma de Pagamento</label>
                          <select 
                            value={txPayMethod} 
                            onChange={(e) => setTxPayMethod(e.target.value as any)}
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
                          >
                            <option value="M-Pesa">M-Pesa</option>
                            <option value="e-Mola">e-Mola</option>
                            <option value="Transferência BCI/BIM">Transferência BCI/BIM</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="POS Cartão">POS Cartão</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-ink/70 mb-1">Nome do Cliente / Fornecedor (opcional)</label>
                          <input 
                            type="text" 
                            placeholder="ex: Carlos Tembe" 
                            value={txCustomer} 
                            onChange={(e) => setTxCustomer(e.target.value)} 
                            className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                        <button 
                          type="button" 
                          onClick={() => {
                            setShowAddTxModal(false);
                            setEditingTx(null);
                          }}
                          className="py-2.5 px-4 bg-paper border border-ink/15 rounded-xl font-bold text-ink/70 hover:bg-sand-2/40 cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button 
                          type="submit" 
                          className="py-2.5 px-5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 cursor-pointer shadow-xs flex items-center gap-1.5"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>{editingTx ? 'Atualizar Lançamento' : 'Gravar Lançamento no Caixa'}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Financial Ledger Table */}
                {financialTxs.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-ink/15 rounded-xl p-6">
                    <FileSpreadsheet className="w-10 h-10 text-ink/20 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-ink/50">Nenhum lançamento financeiro registado.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-ink/12 bg-sand-2/30 text-ink/70 font-bold uppercase text-[10px] tracking-wider">
                          <th className="p-3">Data</th>
                          <th className="p-3">Tipo</th>
                          <th className="p-3">Categoria</th>
                          <th className="p-3">Descrição / Histórico</th>
                          <th className="p-3">Cliente / Fornecedor</th>
                          <th className="p-3">Método</th>
                          <th className="p-3 text-right">Valor (MT)</th>
                          <th className="p-3 text-right">Acções</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ink/8 font-medium">
                        {filteredFinancialTxs.map((tx, txIdx) => (
                          <tr key={`${tx.id || 'tx'}-${txIdx}`} className="hover:bg-sand-2/10 transition-colors">
                            <td className="p-3 font-semibold text-indigo-deep whitespace-nowrap">{tx.date}</td>
                            <td className="p-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                tx.type === 'receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {tx.type === 'receita' ? 'Entrada' : 'Saída'}
                              </span>
                            </td>
                            <td className="p-3 whitespace-nowrap font-semibold text-ink/80">{tx.category}</td>
                            <td className="p-3 font-semibold text-ink">{tx.description}</td>
                            <td className="p-3 text-indigo-brand font-semibold whitespace-nowrap">{tx.customerName || '-'}</td>
                            <td className="p-3 whitespace-nowrap">
                              <span className="bg-sand-2/70 text-ink/80 text-[10px] px-2 py-0.5 rounded-md font-semibold">
                                {tx.paymentMethod}
                              </span>
                            </td>
                            <td className={`p-3 text-right font-serif font-bold whitespace-nowrap ${
                              tx.type === 'receita' ? 'text-emerald-700' : 'text-rose-700'
                            }`}>
                              {tx.type === 'receita' ? '+' : '-'}{tx.amountMT.toLocaleString()} MT
                            </td>
                            <td className="p-3 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1">
                                <button 
                                  onClick={() => handleOpenEditTxModal(tx)}
                                  className="p-1 text-indigo-deep/70 hover:text-indigo-brand hover:bg-indigo-50 rounded-md transition-colors cursor-pointer"
                                  title="Editar este lançamento"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteFinancialTransaction(tx.id)}
                                  className="p-1 text-rose-600/70 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                  title="Eliminar lançamento (Guarda em Lixeira/Backup)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

          </div>
        )}
      </div>

      {/* FECHO DE CAIXA MODAL */}
      {showFechoCaixaModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper border border-ink/15 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-ink/10 pb-3">
              <div>
                <div className="flex items-center gap-2 text-indigo-deep font-serif font-bold text-xl">
                  <Lock className="w-5 h-5 text-terracotta" />
                  <span>Relatório de Fecho de Caixa</span>
                </div>
                <p className="text-xs text-ink/60 mt-0.5">
                  Resumo do caixa para conferência de valores física e digital ({new Date().toLocaleDateString('pt-MZ')})
                </p>
              </div>
              <button 
                onClick={() => setShowFechoCaixaModal(false)}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-sand-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Breakdown Grid */}
            <div className="space-y-3 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-ink/10 flex justify-between items-center">
                <span className="font-semibold text-ink/70">Total Entradas (Receitas):</span>
                <span className="font-serif font-bold text-emerald-700 text-sm">+{totalReceitaMT.toLocaleString()} MT</span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-ink/10 flex justify-between items-center">
                <span className="font-semibold text-ink/70">Total Saídas (Despesas/Custos):</span>
                <span className="font-serif font-bold text-rose-700 text-sm">-{totalDespesaMT.toLocaleString()} MT</span>
              </div>

              <div className="bg-indigo-deep text-paper p-4 rounded-xl flex justify-between items-center shadow-xs">
                <div>
                  <span className="font-bold text-sand text-xs block">Saldo Final de Caixa</span>
                  <span className="text-[10.5px] text-paper/70">Lucro Líquido do Balanço</span>
                </div>
                <span className="font-serif font-bold text-2xl text-paper">{saldoCaixaMT.toLocaleString()} MT</span>
              </div>

              {/* Method Detail breakdown */}
              <div className="bg-sand-2/40 p-3.5 rounded-xl border border-ink/10 space-y-2 text-xs">
                <div className="font-bold text-indigo-deep border-b border-ink/8 pb-1 mb-2">Detalhamento por Canal de Pagamento:</div>
                <div className="flex justify-between items-center text-ink/80">
                  <span>📱 M-Pesa Total:</span>
                  <strong className="text-indigo-deep">{totalMPesa.toLocaleString()} MT</strong>
                </div>
                <div className="flex justify-between items-center text-ink/80">
                  <span>📱 e-Mola Total:</span>
                  <strong className="text-indigo-deep">{totalEMola.toLocaleString()} MT</strong>
                </div>
                <div className="flex justify-between items-center text-ink/80">
                  <span>💵 Dinheiro em Gaveta:</span>
                  <strong className="text-emerald-800">{totalDinheiro.toLocaleString()} MT</strong>
                </div>
                <div className="flex justify-between items-center text-ink/80">
                  <span>🏦 BCI / BIM / Transferência:</span>
                  <strong className="text-indigo-deep">{totalBancos.toLocaleString()} MT</strong>
                </div>
                <div className="flex justify-between items-center text-ink/80">
                  <span>💳 POS Cartão:</span>
                  <strong className="text-indigo-deep">{totalPOS.toLocaleString()} MT</strong>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center gap-3">
              <button
                onClick={() => {
                  const summaryText = `*FECHO DE CAIXA - ${myEstablishment?.name || 'Axofácil!'}*\nData: ${new Date().toLocaleDateString('pt-MZ')}\n\n🟢 Total Receitas: ${totalReceitaMT.toLocaleString()} MT\n🔴 Total Despesas: ${totalDespesaMT.toLocaleString()} MT\n💰 Saldo Final: ${saldoCaixaMT.toLocaleString()} MT\n\n- M-Pesa: ${totalMPesa.toLocaleString()} MT\n- e-Mola: ${totalEMola.toLocaleString()} MT\n- Dinheiro: ${totalDinheiro.toLocaleString()} MT\n- Banco: ${totalBancos.toLocaleString()} MT`;
                  navigator.clipboard.writeText(summaryText);
                  notify('Resumo do fecho de caixa copiado para a área de transferência!');
                }}
                className="py-2.5 px-4 bg-paper border border-ink/15 text-indigo-deep hover:bg-sand-2 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Copiar Resumo WhatsApp</span>
              </button>

              <button
                onClick={() => {
                  window.print();
                }}
                className="py-2.5 px-4 bg-indigo-deep text-paper hover:bg-indigo-brand text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Fecho</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADICIONAR PRODUTO AO CATÁLOGO */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-indigo-deep/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-ink/10 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <h3 className="font-serif font-bold text-lg text-indigo-deep flex items-center gap-2">
                {editingProductId ? <Edit3 className="w-5 h-5 text-indigo-brand" /> : <PlusCircle className="w-5 h-5 text-terracotta" />}
                <span>{editingProductId ? 'Editar Artigo do Catálogo' : 'Adicionar Novo Item ao Catálogo'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => {
                  setEditingProductId(null);
                  setShowAddProductModal(false);
                }}
                className="p-1.5 text-ink/40 hover:text-ink rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Nome do Produto ou Serviço *</label>
                <input 
                  type="text" 
                  value={newProdName} 
                  onChange={(e) => setNewProdName(e.target.value)} 
                  placeholder="ex: Fardo de Capulana 24m ou Hambúrguer Especial" 
                  required 
                  className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink/70 mb-1">Preço Normal (MT) *</label>
                  <input 
                    type="number" 
                    value={newProdPrice === 0 ? '' : newProdPrice} 
                    onChange={(e) => setNewProdPrice(parseFloat(e.target.value) || 0)} 
                    placeholder="ex: 1500" 
                    required 
                    className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink/70 mb-1">Categoria de Artigo</label>
                  <input 
                    type="text" 
                    value={newProdCategory} 
                    onChange={(e) => setNewProdCategory(e.target.value)} 
                    placeholder="ex: Roupas, Bebidas, Quarto" 
                    className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Descrição Curta</label>
                <input 
                  type="text" 
                  value={newProdDesc} 
                  onChange={(e) => setNewProdDesc(e.target.value)} 
                  placeholder="ex: 100% Algodão, alta durabilidade e cores vivas" 
                  className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                />
              </div>

              <div className="bg-sand-2/30 border border-ink/12 p-3 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-bold text-ink/70">Imagem do Produto (Link URL ou Upload Ficheiro)</label>
                  {newProdImageUrl && (
                    <button
                      type="button"
                      onClick={() => setNewProdImageUrl('')}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Limpar Foto
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input 
                    type="url" 
                    value={newProdImageUrl} 
                    onChange={(e) => setNewProdImageUrl(e.target.value)} 
                    placeholder="Cole o link da imagem (http...) ou faça upload" 
                    className="flex-grow p-2.5 bg-white border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                  />
                  <label htmlFor="prod-file-upload" className="py-2.5 px-3.5 bg-terracotta hover:bg-terracotta/90 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-2xs">
                    <Upload className="w-4 h-4" />
                    <span>Upload Ficheiro</span>
                  </label>
                  <input type="file" id="prod-file-upload" accept="image/*" onChange={handleProductFileUpload} className="hidden" />
                </div>

                {!newProdImageUrl && (
                  <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-ink/60">
                    <span>Fotos Sugeridas:</span>
                    {[
                      { name: 'Geral', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Bebidas', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Cimento', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Peça Auto', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Vestuário', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400' }
                    ].map((preset, idx) => (
                      <button
                        key={`dash-preset-img-${preset.name}-${idx}`}
                        type="button"
                        onClick={() => setNewProdImageUrl(preset.url)}
                        className="py-0.5 px-2 bg-white border border-ink/10 rounded-md whitespace-nowrap cursor-pointer hover:bg-emerald-50 transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                )}

                {newProdImageUrl && (
                  <div className="mt-2 flex items-center gap-3 bg-white p-2 rounded-lg border border-ink/10">
                    <div className="h-14 w-20 rounded-md overflow-hidden border border-ink/10 shrink-0 bg-black/5">
                      <img src={newProdImageUrl} alt="Preview Produto" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-ink/60 truncate font-mono">{newProdImageUrl}</span>
                  </div>
                )}
              </div>

              {/* Promo checkbox */}
              <div className="bg-sand-2/30 border border-ink/10 p-3 rounded-xl space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-indigo-deep">
                  <input 
                    type="checkbox" 
                    checked={newProdIsPromo} 
                    onChange={(e) => setNewProdIsPromo(e.target.checked)} 
                    className="w-4 h-4 rounded text-terracotta focus:ring-terracotta"
                  />
                  <span>Ativar Preço Promocional em Destaque</span>
                </label>

                {newProdIsPromo && (
                  <div className="pt-2">
                    <label className="block font-bold text-ink/70 mb-1">Preço em Promoção (MT)</label>
                    <input 
                      type="number" 
                      value={newProdPromoPrice === 0 ? '' : newProdPromoPrice} 
                      onChange={(e) => setNewProdPromoPrice(parseFloat(e.target.value) || 0)} 
                      placeholder="ex: 1200" 
                      className="w-full p-2.5 bg-white border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingProductId(null);
                    setShowAddProductModal(false);
                  }}
                  className="py-2.5 px-4 bg-paper border border-ink/15 text-ink/70 font-bold rounded-xl hover:bg-sand-2/40 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 px-5 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {editingProductId ? 'Guardar Alterações' : 'Publicar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT OPERATOR MODAL (ADMIN ONLY) */}
      {editingOperatorOldName && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper border border-ink/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-deep text-white rounded-xl">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-indigo-deep">Editar Dados do Operador</h3>
                  <p className="text-[11px] text-ink/60">Edição autorizada apenas ao Administrador</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setEditingOperatorOldName(null)}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-sand-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditOperator} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink/70 mb-1.5">Nome Completo do Operador / Vendedor *</label>
                <input 
                  type="text" 
                  value={editingOperatorNewName}
                  onChange={(e) => setEditingOperatorNewName(e.target.value)}
                  required 
                  className="w-full p-3 bg-white border border-ink/12 rounded-xl text-xs font-bold text-indigo-deep outline-none focus:border-indigo-brand"
                />
              </div>

              <div className="bg-sand-2/30 border border-ink/10 p-3 rounded-xl text-[11px] text-ink/70 leading-relaxed">
                ℹ️ Esta alteração irá atualizar automaticamente o nome do operador na lista da equipa, turnos abertos e no histórico de vendas e lançamentos financeiros registados no Livro Caixa.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button 
                  type="button" 
                  onClick={() => setEditingOperatorOldName(null)}
                  className="py-2.5 px-4 bg-paper border border-ink/15 text-ink/70 font-bold rounded-xl hover:bg-sand-2/40 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 px-5 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STORE ROLE LOGIN MODAL */}
      {showRoleLoginModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper border border-ink/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-700 text-white rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-indigo-deep">Login de Administrador</h3>
                  <p className="text-[11px] text-ink/60">Autenticação para Acesso CRUD Total</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowRoleLoginModal(false)}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-sand-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAdminLogin} className="space-y-4 text-xs">
              <p className="text-ink/70 leading-relaxed font-medium">
                Insira o código PIN ou autorize para mudar o modo de sessão da loja para <strong>Administrador</strong>. Com a conta de Administrador poderá registar, editar e eliminar operadores da equipa, editar lançamentos de caixa e gerir a lixeira de backup.
              </p>

              <div>
                <label className="block font-bold text-ink/70 mb-1.5">PIN do Administrador (Padrão: 1234 ou prima Autorizar)</label>
                <input 
                  type="password"
                  value={rolePinInput}
                  onChange={(e) => setRolePinInput(e.target.value)}
                  placeholder="Digite 1234..."
                  className="w-full p-3 bg-white border border-ink/12 rounded-xl text-xs font-bold text-indigo-deep outline-none focus:border-indigo-brand tracking-widest text-center"
                />
                {rolePinError && (
                  <p className="text-[11px] text-rose-600 font-semibold mt-1">{rolePinError}</p>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button 
                  type="button" 
                  onClick={() => setShowRoleLoginModal(false)}
                  className="py-2.5 px-4 bg-paper border border-ink/15 text-ink/70 font-bold rounded-xl hover:bg-sand-2/40 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Autorizar Modo Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PERFIL DO UTILIZADOR */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 bg-indigo-deep/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-ink/10 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <h3 className="font-serif font-bold text-lg text-indigo-deep flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-brand" />
                <span>Editar Dados do Perfil</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 text-ink/40 hover:text-ink rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Nome Completo *</label>
                <input 
                  type="text" 
                  value={profileNameInput} 
                  onChange={(e) => setProfileNameInput(e.target.value)} 
                  required 
                  placeholder="ex: Mário Macamo" 
                  className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Telemóvel / WhatsApp de Contacto</label>
                <input 
                  type="text" 
                  value={profilePhoneInput} 
                  onChange={(e) => setProfilePhoneInput(e.target.value)} 
                  placeholder="ex: +258 84 123 4567" 
                  className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Cidade / Província de Residência</label>
                <input 
                  type="text" 
                  value={profileCityInput} 
                  onChange={(e) => setProfileCityInput(e.target.value)} 
                  placeholder="ex: Maputo, Matola, Beira, etc." 
                  className="w-full p-2.5 bg-paper border border-ink/12 rounded-xl outline-none focus:border-indigo-brand font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-ink/10">
                <button 
                  type="button" 
                  onClick={() => setShowEditProfileModal(false)}
                  className="py-2.5 px-4 bg-paper border border-ink/15 text-ink/70 font-bold rounded-xl hover:bg-sand-2/40 cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="py-2.5 px-5 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  Guardar Perfil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
