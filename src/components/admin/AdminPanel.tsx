import React, { useState } from 'react';
import { Establishment, PromoDeal, PaymentRecord, AdminSubmission, Category, DeliveryPartner, UserProfile, ProductItem, InventoryItem } from "../../types/types";
import { saveEstablishments, saveDeals, savePayments, saveSubmissions, saveDeliveryPartners, loadInventoryItems, saveInventoryItems, loadBarTables, saveBarTables, loadFinancialTransactions, saveFinancialTransactions, loadOrders, saveOrders, loadOperatorLogins, saveOperatorLogins, markEstablishmentDeleted, markAllEstablishmentsDeleted, markDealDeleted, markAllDealsDeleted, markCourierDeleted, markAllCouriersDeleted, purgeAllTestAndMockData } from "../../data/data";
import { deleteUsersByEstablishmentId, purgeTestUserProfiles } from "../../data/userProfiles";
import { clearAllAdminActions } from "../../services/adminAuditStore";
import { clearAllPaymentOrders } from "../../services/paymentStore";
import { confirmDialog, notify } from "../../services/dialogs";
import AdminEditModal from './AdminEditModal';
import StoreLocationMap from '../shared/StoreLocationMap';
import AdminBannerManager from "./AdminBannerManager";
import AdminIncomingsCenter from "./AdminIncomingsCenter";
import AdminCatalogManager from "./AdminCatalogManager";
import AdminFinancialBilling from "./AdminFinancialBilling";
import AdminUserProfiles from "./AdminUserProfiles";
import AdminPlatformSettingsManager from "./AdminPlatformSettingsManager";
import { deleteEstablishmentFromSupabase, syncEstablishmentToSupabase, uploadFileToStorage as uploadToImgBB } from "../../services/supabase";
import { 
  ShieldCheck, Plus, Edit3, Trash2, CheckCircle, XCircle, Search, 
  CreditCard, ArrowUpRight, BarChart3, Store, GlassWater, Hotel, Sparkles, Filter, AlertCircle, RefreshCw, Truck, Bike, Car, ShoppingBag, X, Phone, Zap, ArrowRight, Building, Wrench, Boxes, Layers, MapPin,
  Upload, Loader2, ImageIcon, PlusCircle, LogOut, Inbox, Image, Package, DollarSign, Users,
  Flame, ExternalLink, Settings
} from 'lucide-react';

interface AdminPanelProps {
  establishments: Establishment[];
  setEstablishments: (ests: Establishment[]) => void;
  deals: PromoDeal[];
  setDeals: (dls: PromoDeal[]) => void;
  payments: PaymentRecord[];
  setPayments: (pays: PaymentRecord[]) => void;
  submissions: AdminSubmission[];
  setSubmissions: (subs: AdminSubmission[]) => void;
  couriers?: DeliveryPartner[];
  setCouriers?: (couriers: DeliveryPartner[]) => void;
  setCurrentUser?: (user: UserProfile) => void;
  setActivePage?: (page: any) => void;
  onSelectEstablishment: (est: Establishment) => void;
}

export type AdminTabType = 'incomings' | 'banners' | 'catalog' | 'financial' | 'settings' | 'users' | 'directory' | 'couriers' | 'construcao' | 'pecas' | 'submissions' | 'payments' | 'top10' | 'mapsTest';

export default function AdminPanel({
  establishments,
  setEstablishments,
  deals,
  setDeals,
  payments,
  setPayments,
  submissions,
  setSubmissions,
  couriers = [],
  setCouriers,
  setCurrentUser,
  setActivePage,
  onSelectEstablishment
}: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<AdminTabType>('incomings');
  const [mapTestQuery, setMapTestQuery] = useState('Rua de Bagamoyo, Baixa de Maputo');
  const [catFilter, setCatFilter] = useState<'todas' | Category>('todas');
  const [searchQuery, setSearchQuery] = useState('');

  // Establishment Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEst, setEditingEst] = useState<Establishment | null>(null);
  const [createCategoryHint, setCreateCategoryHint] = useState<Category>('loja');

  // New / Edit Courier Registration Modal State
  const [showAddCourierModal, setShowAddCourierModal] = useState(false);
  const [editingCourierId, setEditingCourierId] = useState<string | null>(null);
  const [newCourierName, setNewCourierName] = useState('');
  const [newCourierVehicle, setNewCourierVehicle] = useState<'moto' | 'carro' | 'furgão'>('moto');
  const [newCourierPlate, setNewCourierPlate] = useState('');
  const [newCourierZone, setNewCourierZone] = useState('Baixa / Alto Maé');
  const [newCourierPhone, setNewCourierPhone] = useState('+258 87 142 5316');
  const [newCourierRate, setNewCourierRate] = useState('200 MT / entrega');
  const [newCourierImage, setNewCourierImage] = useState('');
  const [newCourierLat, setNewCourierLat] = useState<number | undefined>(undefined);
  const [newCourierLng, setNewCourierLng] = useState<number | undefined>(undefined);

  // Admin Quick Add Product to Store Stock/Catalog Modal State
  const [showQuickAddProdModal, setShowQuickAddProdModal] = useState(false);
  const [quickProdEst, setQuickProdEst] = useState<Establishment | null>(null);
  const [quickProdName, setQuickProdName] = useState('');
  const [quickProdCategory, setQuickProdCategory] = useState('Geral');
  const [quickProdPrice, setQuickProdPrice] = useState<number>(0);
  const [quickProdCostPrice, setQuickProdCostPrice] = useState<number>(0);
  const [quickProdQty, setQuickProdQty] = useState<number>(30);
  const [quickProdImageUrl, setQuickProdImageUrl] = useState('');
  const [quickProdDesc, setQuickProdDesc] = useState('');
  const [isUploadingQuickProdImg, setIsUploadingQuickProdImg] = useState(false);

  const handleOpenQuickAddProd = (est: Establishment) => {
    setQuickProdEst(est);
    setQuickProdName('');
    setQuickProdCategory('Geral');
    setQuickProdPrice(0);
    setQuickProdCostPrice(0);
    setQuickProdQty(30);
    setQuickProdImageUrl('');
    setQuickProdDesc('');
    setShowQuickAddProdModal(true);
  };

  const handleQuickProdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingQuickProdImg(true);
    try {
      const url = await uploadToImgBB(file);
      if (url) {
        setQuickProdImageUrl(url);
      }
    } catch (err) {
      console.error("Erro no upload de foto de produto pelo Administrador:", err);
    } finally {
      setIsUploadingQuickProdImg(false);
      e.target.value = '';
    }
  };

  const handleSaveQuickProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickProdEst || !quickProdName || quickProdPrice <= 0) return;

    const newProd: ProductItem = {
      id: 'prod_' + Date.now(),
      name: quickProdName.trim(),
      priceMT: Number(quickProdPrice),
      category: quickProdCategory || 'Geral',
      imageUrl: quickProdImageUrl.trim() || undefined,
      description: quickProdDesc.trim() || undefined
    };

    const currentCatalog = quickProdEst.productsCatalog || [];
    const updatedCatalog = [newProd, ...currentCatalog];

    const updatedEstablishment: Establishment = {
      ...quickProdEst,
      productsCatalog: updatedCatalog
    };

    const updatedEstList = establishments.map(e => e.id === quickProdEst.id ? updatedEstablishment : e);
    setEstablishments(updatedEstList);
    saveEstablishments(updatedEstList);

    // Synchronize into Inventory Items as well
    const currentInv = loadInventoryItems();
    const newInvItem: InventoryItem = {
      id: 'inv_' + Date.now(),
      establishmentId: quickProdEst.id,
      name: quickProdName.trim(),
      category: quickProdCategory || 'Geral',
      sellingPriceMT: Number(quickProdPrice),
      costPriceMT: quickProdCostPrice > 0 ? quickProdCostPrice : Math.round(Number(quickProdPrice) * 0.7),
      quantityInStock: quickProdQty > 0 ? quickProdQty : 30,
      minStockThreshold: 5,
      unit: 'Unidade',
      salesCount: 0,
      isTopSeller: false,
      imageUrl: quickProdImageUrl.trim() || undefined
    };
    const updatedInv = [newInvItem, ...currentInv];
    saveInventoryItems(updatedInv);

    // Reset and Close
    setQuickProdName('');
    setQuickProdPrice(0);
    setQuickProdCostPrice(0);
    setQuickProdQty(30);
    setQuickProdImageUrl('');
    setQuickProdDesc('');
    setShowQuickAddProdModal(false);
    notify(`Produto "${newProd.name}" adicionado com sucesso ao estoque da loja "${quickProdEst.name}"!`);
  };

  // Admin Promo Deal Manager State
  const [showDealModal, setShowDealModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState<PromoDeal | null>(null);
  const [dealTitle, setDealTitle] = useState('');
  const [dealSubtitle, setDealSubtitle] = useState('');
  const [dealCategory, setDealCategory] = useState<Category>('supermercado');
  const [dealRank, setDealRank] = useState<number>(1);
  const [dealColor, setDealColor] = useState<string>('#0B4A46');
  const [dealImageUrl, setDealImageUrl] = useState<string>('');
  const [dealEstId, setDealEstId] = useState<string>('');
  const [isUploadingDealImg, setIsUploadingDealImg] = useState(false);
  const [dealSearchQuery, setDealSearchQuery] = useState('');
  const [dealCatFilter, setDealCatFilter] = useState<string>('todos');

  const handleOpenEditDeal = (deal: PromoDeal) => {
    setEditingDeal(deal);
    setDealTitle(deal.title || '');
    setDealSubtitle(deal.subtitle || '');
    setDealCategory(deal.category || 'loja');
    setDealRank(deal.rank || 1);
    setDealColor(deal.color || '#0B4A46');
    setDealImageUrl(deal.imageUrl || '');
    setDealEstId(deal.establishmentId || '');
    setShowDealModal(true);
  };

  const handleOpenNewDeal = () => {
    setEditingDeal(null);
    setDealTitle('');
    setDealSubtitle('');
    setDealCategory('supermercado');
    setDealRank(deals.length + 1);
    setDealColor('#047857');
    setDealImageUrl('');
    setDealEstId('');
    setShowDealModal(true);
  };

  const handleDealImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDealImg(true);
    try {
      const url = await uploadToImgBB(file);
      if (url) {
        setDealImageUrl(url);
        notify('Imagem da promoção carregada com sucesso!', 'success');
      } else {
        notify('Não foi possível carregar a imagem. Verifique a sua ligação ou tente novamente.', 'error');
      }
    } catch (err) {
      console.error("Erro no upload de imagem de promoção:", err);
      notify('Erro no carregamento da imagem.', 'error');
    } finally {
      setIsUploadingDealImg(false);
    }
  };

  const handleSaveDeal = () => {
    if (!dealTitle.trim()) {
      notify('Por favor insira o título da promoção.', 'error');
      return;
    }

    let updatedDeals: PromoDeal[];
    if (editingDeal) {
      updatedDeals = deals.map(d => d.id === editingDeal.id ? {
        ...d,
        title: dealTitle.trim(),
        subtitle: dealSubtitle.trim(),
        category: dealCategory,
        rank: Number(dealRank) || 1,
        color: dealColor,
        imageUrl: dealImageUrl.trim(),
        establishmentId: dealEstId.trim()
      } : d);
      notify('Promoção atualizada com sucesso!', 'success');
    } else {
      const newDeal: PromoDeal = {
        id: `deal-${Date.now()}`,
        title: dealTitle.trim(),
        subtitle: dealSubtitle.trim(),
        category: dealCategory,
        rank: Number(dealRank) || deals.length + 1,
        color: dealColor,
        imageUrl: dealImageUrl.trim(),
        establishmentId: dealEstId.trim()
      };
      updatedDeals = [newDeal, ...deals];
      notify('Nova promoção adicionada com sucesso aos destaques!', 'success');
    }

    setDeals(updatedDeals);
    saveDeals(updatedDeals);
    setShowDealModal(false);
  };

  const handleDeleteDeal = async (deal: PromoDeal) => {
    const ok = await confirmDialog(
      `Deseja eliminar permanentemente a promoção "${deal.title}" dos destaques?`,
      { title: 'Eliminar Promoção', danger: true, confirmLabel: 'Eliminar' }
    );
    if (ok) {
      markDealDeleted(deal.id);
      const updated = deals.filter(d => d.id !== deal.id);
      setDeals(updated);
      saveDeals(updated);
      notify(`A promoção "${deal.title}" foi removida permanentemente.`);
    }
  };


  // Filter establishments
  const filteredEsts = establishments.filter(e => {
    if (catFilter !== 'todas' && e.category !== catFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.zone.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        (e.contactPhone && e.contactPhone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Handlers for CRUD
  const handleOpenCreate = (category: Category = 'loja') => {
    setEditingEst(null);
    setCreateCategoryHint(category);
    setModalOpen(true);
  };

  const handleOpenEdit = (est: Establishment) => {
    setEditingEst(est);
    setModalOpen(true);
  };

  const handleSaveEstablishment = (savedEst: Establishment) => {
    let updated: Establishment[];
    const exists = establishments.some(e => e.id === savedEst.id);
    if (exists) {
      updated = establishments.map(e => e.id === savedEst.id ? savedEst : e);
    } else {
      updated = [savedEst, ...establishments];
    }
    setEstablishments(updated);
    saveEstablishments(updated);
    // Persist to Supabase
    syncEstablishmentToSupabase(savedEst).catch(console.warn);
  };

  const handleToggleActive = (est: Establishment) => {
    const isCurrentlyActive = est.isActive !== false;
    const nextActive = !isCurrentlyActive;
    const updatedEst: Establishment = {
      ...est,
      isActive: nextActive
    };
    handleSaveEstablishment(updatedEst);
  };

  const handleDeleteEstablishment = (id: string) => {
    markEstablishmentDeleted(id);
    // Excluir permanentemente do Supabase
    deleteEstablishmentFromSupabase(id).catch(console.warn);

    const targetEst = establishments.find(e => e.id === id);
    const estName = targetEst ? targetEst.name : 'A loja';

    const updated = establishments.filter(e => e.id !== id);
    setEstablishments(updated);
    saveEstablishments(updated);

    // Clean up related deals
    const updatedDeals = deals.filter(d => d.establishmentId !== id);
    setDeals(updatedDeals);
    saveDeals(updatedDeals);

    // Clean up related inventory items
    try {
      const invItems = loadInventoryItems();
      const updatedInv = invItems.filter(item => item.establishmentId !== id);
      saveInventoryItems(updatedInv);
    } catch (e) {
      console.warn("Erro ao limpar estoque da loja:", e);
    }

    // Clean up related bar tables
    try {
      const barTables = loadBarTables();
      const updatedTables = barTables.filter(tb => tb.establishmentId !== id);
      saveBarTables(updatedTables);
    } catch (e) {
      console.warn("Erro ao limpar mesas da loja:", e);
    }

    // Clean up related financial transactions
    try {
      const finTxs = loadFinancialTransactions();
      const updatedFin = finTxs.filter(tx => tx.establishmentId !== id);
      saveFinancialTransactions(updatedFin);
    } catch (e) {
      console.warn("Erro ao limpar financeiro da loja:", e);
    }

    // Clean up related orders
    try {
      const orders = loadOrders();
      const updatedOrders = orders.filter(ord => ord.establishmentId !== id);
      saveOrders(updatedOrders);
    } catch (e) {
      console.warn("Erro ao limpar pedidos da loja:", e);
    }

    // Clean up related operator accounts
    try {
      const operators = loadOperatorLogins();
      const updatedOperators = operators.filter(op => op.establishmentId !== id);
      saveOperatorLogins(updatedOperators);
    } catch (e) {
      console.warn("Erro ao limpar operadoras da loja:", e);
    }

    // Clean up linked UserProfile so deleted test store's user profile is also removed
    try {
      deleteUsersByEstablishmentId(id);
    } catch (e) {
      console.warn("Erro ao limpar perfil de utilizador da loja:", e);
    }

    notify(`A loja "${estName}" e todos os seus dados associados foram eliminados permanentemente.`);
  };


  // Courier Creation & Management
  const handleOpenNewCourier = () => {
    setEditingCourierId(null);
    setNewCourierName('');
    setNewCourierVehicle('moto');
    setNewCourierPlate('');
    setNewCourierPhone('+258 87 142 5316');
    setNewCourierZone('Baixa / Alto Maé');
    setNewCourierRate('200 MT / entrega');
    setNewCourierImage('');
    setNewCourierLat(undefined);
    setNewCourierLng(undefined);
    setShowAddCourierModal(true);
  };

  const handleOpenEditCourier = (cour: DeliveryPartner) => {
    setEditingCourierId(cour.id);
    setNewCourierName(cour.name);
    setNewCourierVehicle(cour.vehicleType);
    setNewCourierPlate(cour.plateNumber);
    setNewCourierPhone(cour.phone);
    setNewCourierZone(cour.residenceZone);
    setNewCourierRate(cour.baseRate);
    setNewCourierImage(cour.imageUrl || '');
    setNewCourierLat(cour.latitude);
    setNewCourierLng(cour.longitude);
    setShowAddCourierModal(true);
  };

  const handleCreateCourierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourierName.trim() || !newCourierPhone.trim() || !newCourierPlate.trim()) {
      notify('Por favor preencha os dados obrigatórios do entregador (Nome, Contacto e Matrícula).', 'error');
      return;
    }

    const cleanPhone = newCourierPhone.replace(/[^0-9]/g, '');
    const waLink = `https://wa.me/${cleanPhone}?text=Olá%20${encodeURIComponent(newCourierName)},%20contacto%20através%20do%20Portal%20Axofácil!`;

    const defaultImg = newCourierVehicle === 'moto'
      ? 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=800&q=80'
      : newCourierVehicle === 'carro'
      ? 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=800&q=80'
      : 'https://images.unsplash.com/photo-1586191582056-a15cd3db9238?auto=format&fit=crop&w=800&q=80';

    let updatedCouriers: DeliveryPartner[];
    if (editingCourierId) {
      updatedCouriers = couriers.map(c => c.id === editingCourierId ? {
        ...c,
        name: newCourierName.trim(),
        vehicleType: newCourierVehicle,
        plateNumber: newCourierPlate.trim().toUpperCase(),
        residenceZone: newCourierZone.trim() || 'Baixa de Maputo',
        phone: newCourierPhone.trim(),
        whatsappLink: waLink,
        baseRate: newCourierRate.trim() || '200 MT / entrega',
        latitude: newCourierLat,
        longitude: newCourierLng,
        imageUrl: newCourierImage.trim() || c.imageUrl || defaultImg
      } : c);
      notify('Dados do entregador atualizados com sucesso!');
    } else {
      const createdCourier: DeliveryPartner = {
        id: 'cour_' + Date.now(),
        name: newCourierName.trim(),
        vehicleType: newCourierVehicle,
        plateNumber: newCourierPlate.trim().toUpperCase(),
        residenceZone: newCourierZone.trim() || 'Baixa de Maputo',
        phone: newCourierPhone.trim(),
        whatsappLink: waLink,
        baseRate: newCourierRate.trim() || '200 MT / entrega',
        rating: 5.0,
        isAvailable: true,
        subscriptionPaid: true,
        latitude: newCourierLat,
        longitude: newCourierLng,
        imageUrl: newCourierImage.trim() || defaultImg
      };
      updatedCouriers = [createdCourier, ...couriers];
      notify('Novo entregador registado e ativado com sucesso no portal!');
    }

    if (setCouriers) {
      setCouriers(updatedCouriers);
      saveDeliveryPartners(updatedCouriers);
    }

    setShowAddCourierModal(false);
    setEditingCourierId(null);

    // Reset Form
    setNewCourierName('');
    setNewCourierPlate('');
    setNewCourierPhone('+258 87 142 5316');
    setNewCourierZone('Baixa / Alto Maé');
    setNewCourierLat(undefined);
    setNewCourierLng(undefined);
  };

  const handleDeleteCourier = async (id: string) => {
    const ok = await confirmDialog('Tem certeza que deseja remover permanentemente este entregador?', { danger: true, confirmLabel: 'Remover' });
    if (!ok) return;
    markCourierDeleted(id);
    const updatedCouriers = couriers.filter(c => c.id !== id);
    if (setCouriers) {
      setCouriers(updatedCouriers);
      saveDeliveryPartners(updatedCouriers);
    }
    notify('Entregador removido permanentemente.');
  };


  const handleToggleCourierAvailability = (id: string) => {
    const updatedCouriers = couriers.map(c => c.id === id ? { ...c, isAvailable: !c.isAvailable } : c);
    if (setCouriers) {
      setCouriers(updatedCouriers);
      saveDeliveryPartners(updatedCouriers);
    }
  };

  // Submission approval
  const handleApproveSubmission = (sub: AdminSubmission) => {
    const updatedSubs = submissions.map(s => s.id === sub.id ? { ...s, status: 'Aprovado' as const } : s);
    setSubmissions(updatedSubs);
    saveSubmissions(updatedSubs);
  };

  const handleRejectSubmission = (sub: AdminSubmission) => {
    const updatedSubs = submissions.map(s => s.id === sub.id ? { ...s, status: 'Rejeitado' as const } : s);
    setSubmissions(updatedSubs);
    saveSubmissions(updatedSubs);
  };

  const handleDeleteSubmission = async (sub: AdminSubmission) => {
    const ok = await confirmDialog(`Deseja eliminar este pedido de "${sub.name}"?`, { danger: true, confirmLabel: 'Eliminar', title: 'Eliminar Submissão' });
    if (!ok) return;
    const updatedSubs = submissions.filter(s => s.id !== sub.id);
    setSubmissions(updatedSubs);
    saveSubmissions(updatedSubs);
    notify('Submissão eliminada com sucesso.');
  };

  const handleClearAllSubmissions = async () => {
    const ok = await confirmDialog('Deseja eliminar todas as submissões e pedidos da lista?', { danger: true, confirmLabel: 'Limpar Tudo', title: 'Limpar Submissões' });
    if (!ok) return;
    setSubmissions([]);
    saveSubmissions([]);
    notify('Todas as submissões foram limpas.');
  };

  // Payment status toggle
  const handleTogglePaymentStatus = (paymentId: string) => {
    const updatedPays = payments.map(p => {
      if (p.id === paymentId) {
        const nextStatus = p.status === 'Pendente' ? 'Aprovado' as const : p.status === 'Aprovado' ? 'Isento (15 Dias)' as const : 'Pendente' as const;
        return { ...p, status: nextStatus };
      }
      return p;
    });
    setPayments(updatedPays);
    savePayments(updatedPays);
  };

  const handleAddManualPayment = () => {
    const name = window.prompt('Nome do Estabelecimento para registo de pagamento:');
    if (!name) return;
    const amount = window.prompt('Valor recebido (ex: 1.500 MT, 1.000 MT ou 600 MT):', '1.500 MT') || '1.500 MT';
    const methodInput = window.prompt('Método (e-Mola 871425316 / M-Pesa / BCI):', 'e-Mola (871425316)') || 'e-Mola';

    const newPayment: PaymentRecord = {
      id: 'pay_' + Date.now(),
      establishmentName: name,
      contactPhone: '+258 87 142 5316',
      amount,
      date: new Date().toISOString().split('T')[0],
      method: (methodInput.includes('e-Mola') ? 'e-Mola' : methodInput.includes('BCI') ? 'Transferência BCI/BIM' : 'M-Pesa'),
      status: 'Aprovado',
      referenceNumber: 'MANUAL.' + Math.floor(Math.random() * 90000 + 10000)
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    savePayments(updated);
  };

  // Stats calculation
  const totalVisits = establishments.reduce((acc, curr) => acc + (curr.visits || 0), 0);
  const totalSearches = establishments.reduce((acc, curr) => acc + (curr.searches || 0), 0);
  const pendingSubmissionsCount = submissions.filter(s => s.status === 'Pendente').length;

  return (
    <div className="min-h-screen bg-paper pb-20">
      
      {/* Top Admin Header Bar */}
      <div className="bg-indigo-deep text-paper py-10 px-[6vw]">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sand mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Gestão Central do Portal Axofácil! Maputo</span>
            </div>
            <h1 className="font-serif font-bold text-3xl sm:text-4xl tracking-tight">Painel Administrativo Universal</h1>
            <p className="text-xs text-paper/70 mt-1">Sincronização em tempo real de cadastros, aprovações, e-Mola (871425316), entregadores e Top 10.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleOpenCreate('loja')}
              className="btn bg-sand text-indigo-deep hover:bg-white py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Loja</span>
            </button>
            <button
              onClick={() => handleOpenCreate('supermercado')}
              className="btn bg-emerald-700 text-white hover:bg-emerald-800 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Supermercado</span>
            </button>
            <button
              onClick={() => handleOpenCreate('bar')}
              className="btn bg-terracotta text-white hover:bg-terracotta/90 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Bar</span>
            </button>
            <button
              onClick={() => handleOpenCreate('hospedagem')}
              className="btn bg-coral-brand text-white hover:bg-coral-brand/90 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Hospedagem</span>
            </button>
            <button
              onClick={handleOpenNewCourier}
              className="btn bg-emerald-500 text-slate-950 hover:bg-emerald-400 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/20"
            >
              <Truck className="w-4 h-4" />
              <span>👑 Novo Entregador</span>
            </button>

            <button
              onClick={() => {
                if (setCurrentUser) {
                  setCurrentUser(null as any);
                  localStorage.removeItem('axofacil_user');
                  localStorage.removeItem('axofacil_admin_unlocked');
                  setActivePage('home');
                }
              }}
              className="btn bg-rose-600/90 text-white hover:bg-rose-700 py-2.5 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm ml-auto sm:ml-0"
              title="Sair do Perfil de Administrador"
            >
              <LogOut className="w-4 h-4 text-white" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Band */}
      <div className="px-[6vw] -mt-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block">Total Cadastrados</span>
              <span className="text-2xl font-serif font-bold text-indigo-deep mt-1 block">{establishments.length}</span>
              <span className="text-[11px] text-ink/50 mt-0.5 block">Lojas, Bares & Hotéis</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
              <Store className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block">Submissões Pendentes</span>
              <span className="text-2xl font-serif font-bold text-terracotta mt-1 block">{pendingSubmissionsCount}</span>
              <span className="text-[11px] text-ink/50 mt-0.5 block">Aguardam validação</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-terracotta flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block">Entregadores Ativos</span>
              <span className="text-2xl font-serif font-bold text-emerald-700 mt-1 block">{couriers.length}</span>
              <span className="text-[11px] text-ink/50 mt-0.5 block">Moto-Táxi & Fretes</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Truck className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white border border-ink/12 rounded-2xl p-5 shadow-sm flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold text-ink/40 uppercase tracking-widest block">Pesquisas Realizadas</span>
              <span className="text-2xl font-serif font-bold text-coral-brand mt-1 block">{totalSearches.toLocaleString()}</span>
              <span className="text-[11px] text-ink/50 mt-0.5 block">Em Maputo</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-coral-brand/10 text-coral-brand flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="px-[6vw] my-8 max-w-7xl mx-auto w-full">
        <div className="flex border-b border-ink/12 gap-3 sm:gap-6 overflow-x-auto pb-1 scrollbar-none">
          
          {/* 1. Central de Incomings */}
          <button
            onClick={() => setActiveTab('incomings')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'incomings' ? 'border-[#0B254B] text-[#0B254B] font-black' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Inbox className="w-4 h-4 text-[#0B254B]" />
            <span>Central de Incomings</span>
            <span className="bg-blue-50 text-[#0B254B] text-[10px] font-black px-2 py-0.5 rounded-full border border-blue-200">
              Live Feed
            </span>
          </button>

          {/* 2. Banners dos Menus */}
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'banners' ? 'border-[#0B254B] text-[#0B254B] font-black' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Image className="w-4 h-4 text-[#0B254B]" />
            <span>Banners dos Menus</span>
          </button>

          {/* 3. Catálogo de Produtos */}
          <button
            onClick={() => setActiveTab('catalog')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'catalog' ? 'border-emerald-600 text-indigo-deep font-black' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Package className="w-4 h-4 text-emerald-600" />
            <span>Catálogo & Produtos</span>
          </button>

          {/* 4. Faturamento & Financeiro */}
          <button
            onClick={() => setActiveTab('financial')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'financial' ? 'border-[#0B254B] text-[#0B254B] font-black' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <DollarSign className="w-4 h-4 text-[#0B254B]" />
            <span>Faturamento & e-Mola</span>
          </button>

          {/* 4b. Definições da Plataforma (Contas & Planos) */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'settings' ? 'border-[#0B254B] text-[#0B254B] font-black' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Settings className="w-4 h-4 text-[#0B254B]" />
            <span>Contas & Planos</span>
          </button>

          {/* 5. Registos & Perfis */}
          <button
            onClick={() => setActiveTab('users')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users' ? 'border-purple-600 text-indigo-deep font-black' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Registos & Perfis</span>
          </button>

          {/* 6. Diretório Geral */}
          <button
            onClick={() => setActiveTab('directory')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
              activeTab === 'directory' ? 'border-indigo-brand text-indigo-deep font-bold' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            Gestão do Diretório ({establishments.length})
          </button>

          {/* 7. Entregadores */}
          <button
            onClick={() => setActiveTab('couriers')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'couriers' ? 'border-emerald-600 text-indigo-deep font-bold' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Gestão de Entregadores ({couriers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('construcao')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'construcao' ? 'border-amber-600 text-indigo-deep font-bold' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" />
            <span>Material de Construção ({establishments.filter(e => e.category === 'construcao').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pecas')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pecas' ? 'border-indigo-brand text-indigo-deep font-bold' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Wrench className="w-4 h-4 text-indigo-brand" />
            <span>Peças Auto ({establishments.filter(e => e.category === 'pecas_auto').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('submissions')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'submissions' ? 'border-terracotta text-indigo-deep font-bold' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <span>Submissões & Pedidos</span>
            {pendingSubmissionsCount > 0 && (
              <span className="bg-terracotta text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('top10')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'top10' ? 'border-coral-brand text-indigo-deep font-bold' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Flame className="w-4 h-4 text-coral-brand" />
            <span>Promoções & Destaques ({deals.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('mapsTest')}
            className={`py-3 font-serif font-semibold text-base transition-colors cursor-pointer border-b-2 flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'mapsTest' ? 'border-emerald-600 text-indigo-deep' : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <span>📍 Testador Google Maps</span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded">Admin</span>
          </button>
        </div>
      </div>

      {/* TAB CONTENT: INCOMINGS & OPERATIONS CENTER */}
      {activeTab === 'incomings' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <AdminIncomingsCenter />
        </div>
      )}

      {/* TAB CONTENT: BANNER MANAGEMENT */}
      {activeTab === 'banners' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <AdminBannerManager />
        </div>
      )}

      {/* TAB CONTENT: CATALOG MANAGEMENT */}
      {activeTab === 'catalog' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <AdminCatalogManager 
            establishments={establishments} 
            onEstablishmentsChange={setEstablishments} 
          />
        </div>
      )}

      {/* TAB CONTENT: FINANCIAL & BILLING */}
      {activeTab === 'financial' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <AdminFinancialBilling 
            payments={payments} 
            onPaymentsChange={setPayments} 
          />
        </div>
      )}

      {/* TAB CONTENT: PLATFORM SETTINGS (Payment Accounts & Subscription Plans) */}
      {activeTab === 'settings' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <AdminPlatformSettingsManager />
        </div>
      )}

      {/* TAB CONTENT: USERS & PROFILES */}
      {activeTab === 'users' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <AdminUserProfiles 
            establishments={establishments} 
          />
        </div>
      )}

      {/* TAB CONTENT 1: DIRECTORY MANAGEMENT */}
      {activeTab === 'directory' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-ink/12 p-4 rounded-2xl shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-ink/50 mr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Categoria:</span>
              </span>
              {(['todas', 'loja', 'supermercado', 'bar', 'hospedagem', 'construcao', 'pecas_auto', 'turismo', 'ferragens'] as const).map((cat, idx) => (
                <button
                  key={`admin-filter-cat-${cat}-${idx}`}
                  onClick={() => setCatFilter(cat)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                    catFilter === cat ? 'bg-indigo-deep text-paper shadow-xs' : 'bg-sand-2/40 text-ink/70 hover:bg-sand-2'
                  }`}
                >
                  {cat === 'todas' ? 'Todas' : 
                   cat === 'loja' ? 'Lojas' : 
                   cat === 'supermercado' ? 'Supermercados' : 
                   cat === 'bar' ? 'Bares' : 
                   cat === 'hospedagem' ? 'Hospedagens' : 
                   cat === 'construcao' ? 'Mat. Construção' :
                   cat === 'pecas_auto' ? 'Peças Auto' :
                   cat === 'turismo' ? 'Turismo' : 'Ferragens'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-paper border border-ink/15 rounded-xl py-2 px-3 text-xs w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-ink/40 flex-shrink-0" />
                <input 
                  type="text" 
                  placeholder="Procurar nome, telefone, zona..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-ink w-full font-medium"
                />
              </div>

              <button
                onClick={() => handleOpenCreate(catFilter !== 'todas' ? catFilter : 'loja')}
                className="btn btn-primary py-2 px-3.5 text-xs font-bold flex items-center gap-1.5 cursor-pointer flex-shrink-0 shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden md:inline">Adicionar Loja</span>
              </button>
            </div>
          </div>

          {/* Directory Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEsts.map((est, eIdx) => (
              <div key={`${est.id || 'est'}-${eIdx}`} className="bg-white border border-ink/12 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                
                <div>
                  {/* Card Cover with ImgBB Photo */}
                  <div className="h-36 bg-indigo-deep relative overflow-hidden flex items-center justify-center text-paper">
                    {est.imageUrl ? (
                      <img src={est.imageUrl} alt={est.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-serif italic text-2xl opacity-20" style={{ backgroundColor: est.coverColor }}>
                        {est.name}
                      </div>
                    )}
                    
                    <span className={`absolute top-3 left-3 text-[9px] font-bold uppercase tracking-wider py-1 px-2.5 rounded-md shadow-xs ${
                      est.category === 'loja' ? 'bg-[#0B4A46] text-white' :
                      est.category === 'supermercado' ? 'bg-[#0F5132] text-white' :
                      est.category === 'bar' ? 'bg-[#C97A3B] text-white' :
                      est.category === 'construcao' || est.category === 'ferragens' ? 'bg-[#78350F] text-white' :
                      est.category === 'pecas_auto' ? 'bg-[#1E293B] text-white' :
                      est.category === 'turismo' ? 'bg-[#0E7490] text-white' :
                      'bg-[#D9553F] text-white'
                    }`}>
                      {est.category === 'loja' ? 'Loja Comercial' :
                       est.category === 'supermercado' ? 'Supermercado' :
                       est.category === 'bar' ? 'Bar / Diversão' :
                       est.category === 'construcao' ? 'Mat. Construção' :
                       est.category === 'ferragens' ? 'Ferragens' :
                       est.category === 'pecas_auto' ? 'Peças Auto' :
                       est.category === 'turismo' ? 'Turismo & Viagens' :
                       'Hospedagem'}
                    </span>

                    {est.promotion && (
                      <span className="absolute bottom-2 left-2 right-2 bg-paper/90 backdrop-blur-xs text-terracotta text-[9.5px] font-bold py-1 px-2 rounded-md truncate">
                        {est.promotion}
                      </span>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-serif font-bold text-base text-indigo-deep truncate">{est.name}</h3>
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 py-0.5 px-2 rounded-md">{est.rating} ★</span>
                    </div>

                    {/* Activation / Payment Status Badge */}
                    <div className="mb-2.5">
                      {est.isActive !== false ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-emerald-200">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Activa · Mensalidade em Dia</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-[10px] font-bold py-1 px-2.5 rounded-lg border border-red-200 animate-pulse">
                          <XCircle className="w-3 h-3 text-red-600" />
                          <span>Desactivada · Pagamento Pendente</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-indigo-brand font-semibold mb-2">{est.zone} · {est.address}</p>
                    <p className="text-xs text-ink/70 line-clamp-2 leading-relaxed mb-3">{est.description}</p>
                    
                    <div className="text-[11px] font-medium text-ink/60 space-y-1 bg-sand-2/20 p-2.5 rounded-xl border border-ink/5">
                      <div><strong className="text-ink">Contacto:</strong> {est.contactPhone || 'Não especificado'}</div>
                      <div><strong className="text-ink">Info:</strong> {est.metaInfo}</div>
                      {est.segment && <div><strong className="text-ink">Segmento:</strong> {est.segment}</div>}
                      {est.salesType && <div><strong className="text-ink">Modalidade:</strong> {est.salesType === 'grosso' ? 'Venda a Grosso' : est.salesType === 'retalho' ? 'Retalho' : 'Grosso & Retalho'}</div>}
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="bg-sand-2/30 border-t border-ink/8 p-3 flex flex-wrap justify-between items-center gap-2 text-xs">
                  <button
                    onClick={() => onSelectEstablishment(est)}
                    className="text-xs font-bold text-indigo-deep hover:underline cursor-pointer"
                  >
                    Ver Ficha →
                  </button>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Activation Button */}
                    <button
                      onClick={() => handleToggleActive(est)}
                      className={`btn py-1.5 px-2.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        est.isActive !== false 
                          ? 'bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300' 
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                      }`}
                      title={est.isActive !== false ? "Desactivar esta loja por falta de pagamento" : "Activar esta loja após confirmação de pagamento"}
                    >
                      {est.isActive !== false ? (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-amber-800" />
                          <span>Desactivar</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3.5 h-3.5 text-white" />
                          <span>Activar Loja</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleOpenQuickAddProd(est)}
                      className="btn bg-emerald-50 text-emerald-800 border border-emerald-200/80 py-1.5 px-2.5 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      title="Adicionar Novo Produto / Item ao Estoque desta Loja"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+ Stock</span>
                    </button>

                    <button
                      onClick={() => handleOpenEdit(est)}
                      className="btn bg-white border border-ink/15 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-ink/80 hover:text-indigo-deep hover:border-indigo-brand flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>

                    <button
                      onClick={async () => {
                        const ok = await confirmDialog(
                          `Tens a certeza que desejas ELIMINAR permanentemente a loja "${est.name}"?\n\nEsta ação apagará a loja do catálogo, estoque e histórico.`,
                          { title: '⚠️ Atenção', danger: true, confirmLabel: 'Eliminar loja' }
                        );
                        if (ok) {
                          handleDeleteEstablishment(est.id);
                        }
                      }}
                      className="btn bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200/80 py-1.5 px-2.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                      title="Eliminar esta loja permanentemente do diretório"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: COURIERS MANAGEMENT */}
      {activeTab === 'couriers' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 py-0.5 px-2.5 rounded-full uppercase tracking-wider">Módulo de Gestão de Frota</span>
                <h2 className="font-serif font-bold text-xl text-indigo-deep mt-1">Gestão de Entregadores & Estafetas ({couriers.length})</h2>
                <p className="text-xs text-ink/60 mt-0.5">Cadastre, edite disponibilidade ou remova condutores de táxi-moto, furgão e fretes de compras em Maputo.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <button
                  onClick={handleOpenNewCourier}
                  className="btn bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Entregador</span>
                </button>
              </div>
            </div>

            {couriers.length === 0 ? (
              <div className="text-center py-12 bg-sand-2/20 border border-dashed border-ink/15 rounded-2xl">
                <Truck className="w-10 h-10 text-ink/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-ink/70">Nenhum entregador cadastrado no momento.</p>
                <p className="text-xs text-ink/50 mt-1 mb-4">Clique no botão abaixo para adicionar condutores e estafetas verificados.</p>
                <button
                  onClick={() => setShowAddCourierModal(true)}
                  className="btn bg-indigo-deep text-white hover:bg-indigo-brand py-2 px-4 rounded-xl text-xs font-bold"
                >
                  Registar Entregador Agora
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couriers.map((cour, cIdx) => (
                  <div key={`${cour.id || 'cour'}-${cIdx}`} className="border border-ink/12 rounded-2xl p-4 bg-paper flex flex-col justify-between hover:shadow-xs transition-all">
                    <div>
                      <div className="flex items-start gap-3 mb-3">
                        <img 
                          src={cour.imageUrl} 
                          alt={cour.name} 
                          className="w-14 h-14 rounded-xl object-cover border border-ink/10 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md ${
                              cour.vehicleType === 'moto' ? 'bg-indigo-100 text-indigo-900' : cour.vehicleType === 'furgão' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'
                            }`}>
                              {cour.vehicleType === 'moto' ? '🏍️ Moto' : cour.vehicleType === 'furgão' ? '🚐 Furgão' : '🚗 Carro'}
                            </span>

                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              cour.isAvailable ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                            }`}>
                              {cour.isAvailable ? 'Disponível' : 'Indisponível'}
                            </span>
                          </div>

                          <h3 className="font-sans font-bold text-sm text-indigo-deep truncate">{cour.name}</h3>
                          <div className="text-xs font-mono text-indigo-brand">{cour.phone}</div>
                        </div>
                      </div>

                      <div className="bg-sand-2/30 p-2.5 rounded-xl border border-ink/5 text-xs space-y-1 mb-3">
                        <div><strong className="text-ink/60">Matrícula:</strong> <span className="font-mono font-bold text-ink">{cour.plateNumber}</span></div>
                        <div><strong className="text-ink/60">Zona Base:</strong> <span className="text-ink">{cour.residenceZone}</span></div>
                        <div><strong className="text-ink/60">Tarifa Base:</strong> <span className="font-bold text-emerald-700">{cour.baseRate}</span></div>
                        {typeof cour.latitude === 'number' && typeof cour.longitude === 'number' ? (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[10px] font-mono text-ink/50">📍 {cour.latitude.toFixed(5)}, {cour.longitude.toFixed(5)}</span>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${cour.latitude},${cour.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-bold text-indigo-brand hover:underline"
                            >
                              Ver no mapa ↗
                            </a>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-700 font-semibold pt-1">⚠️ Sem localização geocodificada</div>
                        )}
                      </div>
                    </div>

                    <div className="border-t border-ink/8 pt-3 flex items-center justify-between gap-2">
                      <button
                        onClick={() => handleToggleCourierAvailability(cour.id)}
                        className={`text-[11px] font-bold py-1 px-2.5 rounded-lg cursor-pointer ${
                          cour.isAvailable ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                        }`}
                      >
                        {cour.isAvailable ? 'Marcar Indisponível' : 'Marcar Disponível'}
                      </button>

                      <div className="flex items-center gap-1">
                        <a
                          href={cour.whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                          title="Contactar via WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>

                        <button
                          onClick={() => handleOpenEditCourier(cour)}
                          className="p-1.5 bg-sand-2/60 text-indigo-deep hover:bg-sand-2 rounded-lg cursor-pointer"
                          title="Editar Entregador"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteCourier(cour.id)}
                          className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg cursor-pointer"
                          title="Eliminar Entregador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: MATERIAL DE CONSTRUÇÃO & ESTALEIROS */}
      {activeTab === 'construcao' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/10 pb-6">
              <div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-100 py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                  Módulo de Construção & Estaleiros
                </span>
                <h2 className="font-serif font-bold text-xl text-indigo-deep mt-1 flex items-center gap-2">
                  <Building className="w-5 h-5 text-amber-600" />
                  <span>Depósitos de Material de Construção & Ferragens ({establishments.filter(e => e.category === 'construcao' || e.category === 'ferragens').length})</span>
                </h2>
                <p className="text-xs text-ink/60 mt-0.5">
                  Controlo centralizado de depósitos de cimento, chapas de zinco, varões de aço, agregados (areia/brita) e obras em Maputo e Matola.
                </p>
              </div>

              <button
                onClick={() => handleOpenCreate('construcao')}
                className="btn bg-amber-600 text-white hover:bg-amber-700 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Cadastrar Novo Estaleiro</span>
              </button>
            </div>

            {/* Quick Market Reference Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-sand-2/30 border border-ink/10 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-ink/40 uppercase block">Cimento 42.5N Limpopo</span>
                <span className="text-lg font-black text-indigo-deep">480 MT <span className="text-xs font-normal text-ink/60">/ saco 50kg</span></span>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">✓ Preço médio praticado na Baixa</p>
              </div>

              <div className="bg-sand-2/30 border border-ink/10 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-ink/40 uppercase block">Areia Grossa (Carrada)</span>
                <span className="text-lg font-black text-indigo-deep">3.500 MT <span className="text-xs font-normal text-ink/60">/ 10m³</span></span>
                <p className="text-[10px] text-amber-700 font-semibold mt-1">🚚 Frete incluído para Matola/Zimpeto</p>
              </div>

              <div className="bg-sand-2/30 border border-ink/10 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-ink/40 uppercase block">Chapa de Zinco IBR 0.40mm</span>
                <span className="text-lg font-black text-indigo-deep">850 MT <span className="text-xs font-normal text-ink/60">/ folha 6m</span></span>
                <p className="text-[10px] text-indigo-brand font-semibold mt-1">⚙️ Venda ao metro / por medida</p>
              </div>

              <div className="bg-sand-2/30 border border-ink/10 p-4 rounded-xl">
                <span className="text-[10px] font-bold text-ink/40 uppercase block">Varão de Aço 12mm</span>
                <span className="text-lg font-black text-indigo-deep">520 MT <span className="text-xs font-normal text-ink/60">/ varão 12m</span></span>
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">🏗️ Norma de construção homologada</p>
              </div>
            </div>

            {/* List of Construction Yards */}
            {establishments.filter(e => e.category === 'construcao' || e.category === 'ferragens').length === 0 ? (
              <div className="text-center py-12 bg-sand-2/20 border border-dashed border-ink/15 rounded-2xl">
                <Building className="w-10 h-10 text-ink/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-ink/70">Nenhum estaleiro de construção registado no momento.</p>
                <p className="text-xs text-ink/50 mt-1 mb-4">Adicione estaleiros e depósitos de cimento para listar no portal Axofácil!.</p>
                <button
                  onClick={() => handleOpenCreate('construcao')}
                  className="btn bg-amber-600 text-white hover:bg-amber-700 py-2 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cadastrar Primeiro Estaleiro
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {establishments.filter(e => e.category === 'construcao' || e.category === 'ferragens').map((est, idx) => (
                  <div key={`admin-est-c-${est.id}-${idx}`} className="bg-paper border border-ink/12 rounded-2xl p-4 shadow-xs hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="relative h-40 rounded-xl overflow-hidden bg-sand-2 mb-3">
                        <img src={est.imageUrl} alt={est.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className="absolute top-2 left-2 bg-amber-600 text-white text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xs">
                          {est.category === 'ferragens' ? 'Ferragens' : 'Estaleiro de Construção'}
                        </span>
                        {!est.isActive && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded">
                            Inativo
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-indigo-deep">{est.name}</h3>
                      <p className="text-xs text-ink/60 line-clamp-2 mt-1">{est.description}</p>
                      
                      <div className="mt-3 text-xs space-y-1 text-ink/70">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{est.zone} • {est.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{est.contactPhone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectEstablishment(est)}
                        className="py-1.5 px-3 bg-indigo-deep text-paper hover:bg-indigo-brand font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Ver Loja</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenQuickAddProd(est)}
                          className="btn bg-emerald-50 text-emerald-800 border border-emerald-200/80 py-1.5 px-2 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Adicionar Novo Produto / Item ao Estoque desta Loja"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-700" />
                          <span>+ Stock</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(est)}
                          className="p-1.5 bg-sand-2/60 text-ink hover:bg-sand-2 rounded-lg cursor-pointer"
                          title="Editar Cadastro"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(est)}
                          className={`p-1.5 rounded-lg cursor-pointer text-xs font-bold ${
                            est.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                          title="Alternar Estado"
                        >
                          {est.isActive ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await confirmDialog(
                              `Tens a certeza que desejas ELIMINAR permanentemente "${est.name}"?\n\nEsta ação apagará o estaleiro/loja do sistema.`,
                              { title: '⚠️ Atenção', danger: true, confirmLabel: 'Eliminar' }
                            );
                            if (ok) {
                              handleDeleteEstablishment(est.id);
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200/80 rounded-lg cursor-pointer transition-all shadow-2xs"
                          title="Eliminar Estaleiro / Loja"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: PEÇAS AUTO & ACESSÓRIOS */}
      {activeTab === 'pecas' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ink/10 pb-6">
              <div>
                <span className="text-[10px] font-bold text-slate-900 bg-slate-100 py-0.5 px-2.5 rounded-full uppercase tracking-wider">
                  Módulo de Auto Peças & Motores
                </span>
                <h2 className="font-serif font-bold text-xl text-indigo-deep mt-1 flex items-center gap-2">
                  <Wrench className="w-5 h-5 text-indigo-brand" />
                  <span>Lojas de Peças Auto & Acessórios ({establishments.filter(e => e.category === 'pecas_auto').length})</span>
                </h2>
                <p className="text-xs text-ink/60 mt-0.5">
                  Gestão de lojas de autopeças, balcões de lubrificantes, baterias, travões, suspensão e consultas de chassi (VIN).
                </p>
              </div>

              <button
                onClick={() => handleOpenCreate('pecas_auto')}
                className="btn bg-indigo-deep text-paper hover:bg-indigo-brand py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs shrink-0"
              >
                <Plus className="w-4 h-4 text-amber-300" />
                <span>Cadastrar Loja de Auto Peças</span>
              </button>
            </div>

            {/* Quick Auto Parts Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Óleo 5W-30 Sintético</span>
                <span className="text-lg font-black">2.800 MT <span className="text-xs font-normal text-white/60">/ 5 Litros</span></span>
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">🛢️ Castrol / Total Quartz / Shell</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Bateria Willard 60Ah</span>
                <span className="text-lg font-black">5.900 MT <span className="text-xs font-normal text-white/60">/ c/ garantia</span></span>
                <p className="text-[10px] text-amber-300 font-semibold mt-1">⚡ Sem manutenção / Pronta a usar</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Pastilhas de Travão Toyota</span>
                <span className="text-lg font-black">1.850 MT <span className="text-xs font-normal text-white/60">/ jogo dianteiro</span></span>
                <p className="text-[10px] text-indigo-300 font-semibold mt-1">🛑 Bosch / Bendix / Ferodo</p>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Amortecedores Kayaba (Par)</span>
                <span className="text-lg font-black">7.500 MT <span className="text-xs font-normal text-white/60">/ Hilux / Hardbody</span></span>
                <p className="text-[10px] text-emerald-400 font-semibold mt-1">🚗 Garantia de 12 meses</p>
              </div>
            </div>

            {/* List of Auto Parts Establishments */}
            {establishments.filter(e => e.category === 'pecas_auto').length === 0 ? (
              <div className="text-center py-12 bg-sand-2/20 border border-dashed border-ink/15 rounded-2xl">
                <Wrench className="w-10 h-10 text-ink/30 mx-auto mb-2" />
                <p className="text-sm font-bold text-ink/70">Nenhuma loja de auto peças registada no momento.</p>
                <p className="text-xs text-ink/50 mt-1 mb-4">Cadastre lojas de autopeças e oficinas no portal Axofácil!.</p>
                <button
                  onClick={() => handleOpenCreate('pecas_auto')}
                  className="btn bg-indigo-deep text-white hover:bg-indigo-brand py-2 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cadastrar Primeira Loja de Peças
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {establishments.filter(e => e.category === 'pecas_auto').map((est, idx) => (
                  <div key={`admin-est-p-${est.id}-${idx}`} className="bg-paper border border-ink/12 rounded-2xl p-4 shadow-xs hover:border-indigo-brand/50 transition-all flex flex-col justify-between space-y-4">
                    <div>
                      <div className="relative h-40 rounded-xl overflow-hidden bg-sand-2 mb-3">
                        <img src={est.imageUrl} alt={est.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        <span className="absolute top-2 left-2 bg-slate-900 text-amber-300 text-[10px] font-bold py-1 px-2.5 rounded-lg shadow-xs">
                          Peças Auto & Motores
                        </span>
                        {!est.isActive && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold py-1 px-2 rounded">
                            Inativo
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-indigo-deep">{est.name}</h3>
                      <p className="text-xs text-ink/60 line-clamp-2 mt-1">{est.description}</p>
                      
                      <div className="mt-3 text-xs space-y-1 text-ink/70">
                        <p className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-brand shrink-0" />
                          <span>{est.zone} • {est.address}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{est.contactPhone}</span>
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-2">
                      <button
                        onClick={() => onSelectEstablishment(est)}
                        className="py-1.5 px-3 bg-indigo-deep text-paper hover:bg-indigo-brand font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Store className="w-3.5 h-3.5 text-amber-300" />
                        <span>Ver Loja & Catálogo</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenQuickAddProd(est)}
                          className="btn bg-emerald-50 text-emerald-800 border border-emerald-200/80 py-1.5 px-2 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                          title="Adicionar Novo Produto / Item ao Estoque desta Loja"
                        >
                          <Plus className="w-3.5 h-3.5 text-emerald-700" />
                          <span>+ Stock</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(est)}
                          className="p-1.5 bg-sand-2/60 text-ink hover:bg-sand-2 rounded-lg cursor-pointer"
                          title="Editar Cadastro"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(est)}
                          className={`p-1.5 rounded-lg cursor-pointer text-xs font-bold ${
                            est.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}
                          title="Alternar Estado"
                        >
                          {est.isActive ? 'Ativo' : 'Inativo'}
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await confirmDialog(
                              `Tens a certeza que desejas ELIMINAR permanentemente a loja de peças "${est.name}"?\n\nEsta ação apagará a loja e seu catálogo do sistema.`,
                              { title: '⚠️ Atenção', danger: true, confirmLabel: 'Eliminar' }
                            );
                            if (ok) {
                              handleDeleteEstablishment(est.id);
                            }
                          }}
                          className="p-1.5 bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200/80 rounded-lg cursor-pointer transition-all shadow-2xs"
                          title="Eliminar Loja de Peças"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SUBMISSIONS & USER REQUESTS */}
      {activeTab === 'submissions' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="font-serif font-bold text-xl text-indigo-deep mb-1">Pedidos de Registo & Promoções Submetidos</h2>
                <p className="text-xs text-ink/60">Valida, aprova, rejeita ou elimina as submissões feitas por novos parceiros em Maputo.</p>
              </div>
              {submissions.length > 0 && (
                <button
                  onClick={handleClearAllSubmissions}
                  className="btn bg-red-50 text-red-700 hover:bg-red-600 hover:text-white border border-red-200 py-2 px-3.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Limpar Submissões</span>
                </button>
              )}
            </div>

            {submissions.length === 0 ? (
              <p className="text-xs text-ink/50 text-center py-8">Nenhuma submissão pendente no momento.</p>
            ) : (
              <div className="space-y-4">
                {submissions.map((sub, sIdx) => (
                  <div key={`${sub.id || 'sub'}-${sIdx}`} className="border border-ink/12 rounded-2xl p-5 bg-paper flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-start gap-4">
                      {sub.imageUrl ? (
                        <img src={sub.imageUrl} alt={sub.name} className="w-16 h-16 rounded-xl object-cover border border-ink/10 flex-shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-indigo-deep/10 text-indigo-deep flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {sub.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold uppercase tracking-wider py-0.5 px-2 rounded-md ${
                            sub.type === 'parceiro' ? 'bg-[#103B75] text-white' : sub.type === 'loja' ? 'bg-[#0B4A46] text-white' : sub.type === 'bar' ? 'bg-[#C97A3B] text-white' : 'bg-[#D9553F] text-white'
                          }`}>
                            {sub.type === 'parceiro' ? '🤝 Candidatura de Parceiro Comercial' : sub.type}
                          </span>
                          <span className="text-[10px] text-ink/40">{sub.date}</span>
                        </div>
                        <h3 className="font-serif font-bold text-base text-indigo-deep">{sub.name}</h3>
                        <p className="text-xs text-ink/70 mt-1 leading-relaxed">{sub.details}</p>
                        <p className="text-xs font-semibold text-indigo-brand mt-1">Contacto: {sub.contact}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 border-ink/10 pt-3 md:pt-0">
                      <span className={`text-xs font-bold py-1 px-3 rounded-full ${
                        sub.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : sub.status === 'Rejeitado' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.status}
                      </span>

                      {/* Botão WhatsApp para contacto rápido */}
                      {sub.contact && (
                        <a
                          href={`https://wa.me/${sub.contact.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${sub.name}, entramos em contacto sobre a sua candidatura de parceiro comercial na plataforma Axofácil! Moçambique.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 py-1.5 px-2.5 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Contactar via WhatsApp"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}

                      {/* Botão Cadastrar como Estabelecimento no painel */}
                      {sub.type === 'parceiro' && (
                        <button
                          onClick={() => {
                            handleApproveSubmission(sub);
                            handleOpenCreate('loja');
                          }}
                          className="btn bg-[#103B75] text-white hover:bg-[#0B254B] py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Adicionar aos Estabelecimentos Comerciais da Plataforma"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>Adicionar Estabelecimento</span>
                        </button>
                      )}

                      {sub.status === 'Pendente' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveSubmission(sub)}
                            className="btn bg-emerald-600 text-white hover:bg-emerald-700 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Aprovar</span>
                          </button>
                          <button
                            onClick={() => handleRejectSubmission(sub)}
                            className="btn bg-red-100 text-red-800 hover:bg-red-200 py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rejeitar</span>
                          </button>
                        </div>
                      )}
                      <button
                        onClick={() => handleDeleteSubmission(sub)}
                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 rounded-xl cursor-pointer transition-colors"
                        title="Eliminar esta submissão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: PAYMENTS & SUBSCRIPTIONS */}
      {activeTab === 'payments' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          
          {/* Mobile Payment Notice Banner */}
          <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-emerald-800/80 rounded-xl text-emerald-300 shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">Pagamento Directo de Clientes & Lojas</span>
                <h3 className="font-serif font-bold text-base text-white mt-0.5">Contactos de Transferência Móvel e-Mola & M-Pesa</h3>
                <p className="text-xs text-emerald-100/80 mt-1 leading-relaxed">
                  Contacto e-Mola Administrador: <strong className="text-white bg-emerald-800 px-2 py-0.5 rounded font-mono text-xs">871425316</strong> (Titular: Tarira) | M-Pesa: <strong className="text-white bg-emerald-800 px-2 py-0.5 rounded font-mono text-xs">841234567</strong>.
                  <br />
                  <span className="text-[11px] text-emerald-200">Como os serviços das operadoras ainda não estão integrados via API directas, os clientes realizam a transferência directamente dos seus telemóveis e o administrador regista ou confirma os comprovativos nesta tabela.</span>
                </p>
              </div>
            </div>

            <button
              onClick={handleAddManualPayment}
              className="btn bg-emerald-400 text-slate-950 hover:bg-emerald-300 py-2.5 px-4 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer shadow-md shadow-emerald-500/20 shrink-0"
            >
              + Confirmar e-Mola (871425316)
            </button>
          </div>

          <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h2 className="font-serif font-bold text-xl text-indigo-deep">Controlo de Pagamentos & Subscrições</h2>
                <p className="text-xs text-ink/60 mt-0.5">Acompanhamento das mensalidades dos planos (600 MT, 1.000 MT e 1.500 MT/mês) e isenções iniciais de 15 dias.</p>
              </div>
              <button
                onClick={handleAddManualPayment}
                className="btn bg-emerald-700 text-white hover:bg-emerald-800 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Registar Pagamento Manual</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="border-b border-ink/12 text-ink/40 uppercase tracking-widest text-[10px] bg-sand-2/20">
                    <th className="py-3 px-4">Estabelecimento</th>
                    <th className="py-3 px-4">Contacto</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4">Método</th>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/8">
                  {payments.map((pay, pIdx) => (
                    <tr key={`${pay.id || 'pay'}-${pIdx}`} className="hover:bg-sand-2/10">
                      <td className="py-3.5 px-4 font-bold text-indigo-deep">{pay.establishmentName}</td>
                      <td className="py-3.5 px-4 text-ink/70">{pay.contactPhone}</td>
                      <td className="py-3.5 px-4 font-bold text-ink">{pay.amount}</td>
                      <td className="py-3.5 px-4 text-indigo-brand font-semibold">{pay.method}</td>
                      <td className="py-3.5 px-4 text-ink/50">{pay.date}</td>
                      <td className="py-3.5 px-4">
                        <span className={`py-1 px-2.5 rounded-full text-[10px] font-bold ${
                          pay.status === 'Aprovado' ? 'bg-emerald-100 text-emerald-800' : pay.status === 'Isento (15 Dias)' ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {pay.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleTogglePaymentStatus(pay.id)}
                          className="text-[11px] font-bold text-indigo-deep hover:underline cursor-pointer"
                        >
                          Alterar Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 4: TOP 10 & PROMO DEALS MANAGEMENT */}
      {activeTab === 'top10' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-ink/12 rounded-3xl p-6 sm:p-8 shadow-sm">
            {/* Header with Title & Action */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/8 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="p-2 bg-coral-brand/10 text-coral-brand rounded-xl">
                    <Flame className="w-5 h-5" />
                  </span>
                  <h2 className="font-serif font-black text-2xl text-indigo-deep">
                    Gestão Central de Destaques & Promoções
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-ink/60 max-w-2xl">
                  Controle as campanhas promocionais ativas em Moçambique, ordens do Top 10 e atualize as imagens dos destaques através de upload direto ou links externos.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenNewDeal}
                  className="py-3 px-5 bg-coral-brand hover:bg-[#d94824] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer shrink-0 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Promoção / Destaque</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 pb-2">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 scrollbar-none">
                {[
                  { id: 'todos', label: 'Todas as Categorias' },
                  { id: 'supermercado', label: 'Supermercados' },
                  { id: 'construcao', label: 'Construção' },
                  { id: 'pecas_auto', label: 'Peças Auto' },
                  { id: 'loja', label: 'Lojas' },
                  { id: 'turismo', label: 'Turismo' },
                  { id: 'bar', label: 'Bares' },
                  { id: 'hospedagem', label: 'Hospedagem' }
                ].map((cat) => (
                  <button
                    key={`deal-cat-${cat.id}`}
                    onClick={() => setDealCatFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      dealCatFilter === cat.id
                        ? 'bg-indigo-deep text-white shadow-xs'
                        : 'bg-paper text-ink/70 hover:bg-ink/5 border border-ink/10'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
                <input
                  type="text"
                  value={dealSearchQuery}
                  onChange={(e) => setDealSearchQuery(e.target.value)}
                  placeholder="Pesquisar promoções..."
                  className="w-full pl-9 pr-3 py-1.5 bg-paper border border-ink/12 rounded-xl text-xs font-semibold text-ink placeholder:text-ink/40 focus:outline-none focus:border-coral-brand"
                />
              </div>
            </div>

            {/* Deals Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
              {deals
                .filter((deal) => {
                  if (dealCatFilter !== 'todos' && deal.category !== dealCatFilter) return false;
                  if (dealSearchQuery.trim()) {
                    const q = dealSearchQuery.toLowerCase();
                    return (
                      deal.title.toLowerCase().includes(q) ||
                      deal.subtitle.toLowerCase().includes(q) ||
                      deal.category.toLowerCase().includes(q)
                    );
                  }
                  return true;
                })
                .map((deal, dIdx) => {
                  const est = establishments.find((e) => e.id === deal.establishmentId);
                  return (
                    <div 
                      key={`${deal.id || 'deal'}-${dIdx}`} 
                      className="border border-ink/12 rounded-2xl p-4 bg-paper/60 hover:bg-paper hover:border-coral-brand/40 transition-all flex flex-col justify-between group shadow-2xs"
                    >
                      <div>
                        {/* Top Media & Badges */}
                        <div className="relative h-44 w-full rounded-xl overflow-hidden bg-ink/5 mb-3 border border-ink/10">
                          {deal.imageUrl ? (
                            <img 
                              src={deal.imageUrl} 
                              alt={deal.title} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-ink/30 bg-ink/5">
                              <ImageIcon className="w-8 h-8 mb-1" />
                              <span className="text-xs font-semibold">Sem Imagem Definida</span>
                            </div>
                          )}

                          {/* Position / Rank & Category Overlay */}
                          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                            <span 
                              className="text-white font-black text-[11px] px-2.5 py-0.5 rounded-lg shadow-md"
                              style={{ backgroundColor: deal.color || '#0B4A46' }}
                            >
                              Top #{deal.rank || dIdx + 1}
                            </span>
                            <span className="bg-black/75 backdrop-blur-xs text-white font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-lg">
                              {deal.category}
                            </span>
                          </div>

                          {/* Quick Change Image Button in Thumbnail */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditDeal(deal)}
                            className="absolute bottom-2 right-2 bg-white/95 hover:bg-white text-indigo-deep text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md backdrop-blur-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
                            title="Atualizar imagem desta promoção"
                          >
                            <Upload className="w-3.5 h-3.5 text-coral-brand" />
                            <span>Alterar Foto</span>
                          </button>
                        </div>

                        {/* Title & Promotion Subtitle */}
                        <h4 className="font-serif font-bold text-sm text-indigo-deep leading-snug mb-1 line-clamp-2">
                          {deal.title}
                        </h4>
                        <p className="text-xs text-coral-brand font-bold mb-2">
                          {deal.subtitle}
                        </p>

                        {/* Linked Store Info */}
                        {est && (
                          <div className="flex items-center gap-1.5 text-[11px] text-ink/60 bg-white px-2.5 py-1 rounded-lg border border-ink/8 mb-2">
                            <Store className="w-3 h-3 text-emerald-700 shrink-0" />
                            <span className="truncate">Loja: <strong>{est.name}</strong> ({est.zone})</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-ink/8 pt-3 mt-2 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-ink/40 font-mono">ID: {deal.id}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal)}
                            className="p-1.5 text-ink/40 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar promoção"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEditDeal(deal)}
                            className="py-1 px-3 bg-indigo-deep hover:bg-indigo-900 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar Detalhes</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 5: GOOGLE MAPS TESTER & VERIFICATION FOR ADMIN */}
      {activeTab === 'mapsTest' && (
        <div className="px-[6vw] max-w-7xl mx-auto w-full space-y-6">
          <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/10 pb-4 mb-6">
              <div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 py-0.5 px-2.5 rounded-full uppercase tracking-wider">Módulo de Testes do Administrador</span>
                <h2 className="font-serif font-bold text-2xl text-indigo-deep mt-1">Validador de Localização Google Maps</h2>
                <p className="text-xs text-ink/65 mt-0.5">
                  Efectue testes de pesquisa e verifique se o mapa interactivo está a localizar correctamente as lojas, edifícios e paragens em Maputo.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapTestQuery + ' Maputo')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn bg-indigo-deep hover:bg-indigo-brand text-white py-2.5 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Abrir App Google Maps Externa</span>
                </a>
              </div>
            </div>

            {/* Quick Test Store Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-6">
              <div className="md:col-span-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1.5">Escolha uma Loja Cadastrada para Testar:</label>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) {
                        const selected = establishments.find(est => est.id === e.target.value);
                        if (selected) {
                          setMapTestQuery(`${selected.name}, ${selected.address}, ${selected.zone}`);
                        }
                      }
                    }}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                  >
                    <option value="">-- Seleccionar loja/estabelecimento --</option>
                    {establishments.map((est, idx) => (
                      <option key={`admin-opt-est-${est.id}-${idx}`} value={est.id}>
                        {est.name} ({est.zone}) - {est.address}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1.5">Ou digite uma palavra-chave / endereço de teste:</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={mapTestQuery}
                      onChange={(e) => setMapTestQuery(e.target.value)}
                      placeholder="ex: Mercado Central, Baixa de Maputo"
                      className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-medium focus:border-indigo-brand outline-none"
                    />
                  </div>
                </div>

                <div className="bg-sand-2/30 p-4 rounded-xl border border-ink/10 text-xs space-y-2">
                  <div className="font-bold text-indigo-deep flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Status de Integração das Coordenadas:</span>
                  </div>
                  <p className="text-ink/75 leading-relaxed">
                    Sua conta de <strong>Administrador Principal</strong> tem permissão irrestrita para visualizar e testar o Google Maps em tempo real antes de disponibilizar para os clientes finais.
                  </p>
                </div>
              </div>

              {/* Interactive Embedded Google Map Canvas */}
              <div className="md:col-span-7 bg-sand border border-ink/12 rounded-2xl overflow-hidden shadow-sm h-80 relative">
                <iframe
                  title="Administrador Google Maps Test"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(mapTestQuery + ' Maputo')}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Admin Edit / Create Modal */}
      <AdminEditModal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        establishmentToEdit={editingEst}
        categoryHint={createCategoryHint}
        onSave={handleSaveEstablishment}
        onDelete={handleDeleteEstablishment}
      />

      {/* CREATE NEW COURIER / ESTAFETA MODAL */}
      {showAddCourierModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-ink/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <button
              onClick={() => setShowAddCourierModal(false)}
              className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink hover:bg-sand-2/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-xl text-indigo-deep">
                  {editingCourierId ? 'Editar Entregador / Estafeta' : 'Criar Novo Entregador / Estafeta'}
                </h2>
                <p className="text-xs text-ink/60">Cadastre ou edite condutores de táxi-moto, furgão ou fretes em Maputo.</p>
              </div>
            </div>

            <form onSubmit={handleCreateCourierSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">Nome Completo do Condutor *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Celestino Macamo"
                  value={newCourierName}
                  onChange={(e) => setNewCourierName(e.target.value)}
                  className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Tipo de Veículo *</label>
                  <select
                    value={newCourierVehicle}
                    onChange={(e: any) => setNewCourierVehicle(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                  >
                    <option value="moto">🏍️ Moto-Táxi</option>
                    <option value="carro">🚗 Carro Ligeiro</option>
                    <option value="furgão">🚐 Furgão / Carga</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Matrícula do Veículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: MM-84-12-MP"
                    value={newCourierPlate}
                    onChange={(e) => setNewCourierPlate(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-mono font-bold uppercase focus:border-indigo-brand outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Contacto Telefónico / e-Mola *</label>
                  <input
                    type="text"
                    required
                    placeholder="+258 87 142 5316"
                    value={newCourierPhone}
                    onChange={(e) => setNewCourierPhone(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-mono font-semibold focus:border-indigo-brand outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Zona de Actuação</label>
                  <input
                    type="text"
                    placeholder="Baixa / Alto Maé / Matola"
                    value={newCourierZone}
                    onChange={(e) => setNewCourierZone(e.target.value)}
                    className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                  />
                </div>
              </div>

              {/* Geocodifica a zona acima via Nominatim/OpenStreetMap — mesmo
                  modelo gratuito (sem chave de API) já usado no registo de lojas */}
              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">Confirmar Localização no Mapa</label>
                <StoreLocationMap
                  mode="picker"
                  storeName={newCourierName.trim() || 'Estafeta'}
                  addressText={newCourierZone}
                  latitude={newCourierLat}
                  longitude={newCourierLng}
                  onLocationChange={({ lat, lng }) => {
                    setNewCourierLat(lat);
                    setNewCourierLng(lng);
                  }}
                  height="200px"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">Tarifa Base Estimada</label>
                <input
                  type="text"
                  placeholder="200 MT / entrega"
                  value={newCourierRate}
                  onChange={(e) => setNewCourierRate(e.target.value)}
                  className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">URL da Fotografia / Veículo (Opcional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={newCourierImage}
                  onChange={(e) => setNewCourierImage(e.target.value)}
                  className="w-full p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-semibold focus:border-indigo-brand outline-none"
                />
              </div>

              <div className="pt-3 border-t border-ink/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCourierModal(false)}
                  className="btn bg-sand-2 text-ink hover:bg-sand-2/70 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-600 text-white hover:bg-emerald-700 py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingCourierId ? 'Guardar Alterações' : 'Cadastrar Entregador'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD PRODUCT TO STORE MODAL (FOR GENERAL ADMIN) */}
      {showQuickAddProdModal && quickProdEst && (
        <div className="fixed inset-0 bg-indigo-deep/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-ink/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-y-auto max-h-[90vh] space-y-4">
            <button
              onClick={() => setShowQuickAddProdModal(false)}
              className="absolute top-4 right-4 p-2 text-ink/40 hover:text-ink hover:bg-sand-2/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-ink/10 pb-3">
              <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-indigo-deep">Adicionar Produto / Item ao Estoque</h3>
                <p className="text-xs text-ink/60">
                  Loja Destino: <strong className="text-emerald-800 font-bold">{quickProdEst.name}</strong> ({quickProdEst.zone})
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveQuickProduct} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-ink/70 mb-1">Nome do Produto / Item *</label>
                <input
                  type="text"
                  placeholder="ex: Cimento 42.5N Saco 50kg, Cerveja 2M 500ml, Amortecedor..."
                  value={quickProdName}
                  onChange={(e) => setQuickProdName(e.target.value)}
                  required
                  className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Categoria</label>
                  <input
                    type="text"
                    placeholder="ex: Cimento, Bebidas, Peças..."
                    value={quickProdCategory}
                    onChange={(e) => setQuickProdCategory(e.target.value)}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Preço de Venda (MT) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="ex: 450"
                    value={quickProdPrice || ''}
                    onChange={(e) => setQuickProdPrice(Number(e.target.value))}
                    required
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-emerald-800 outline-none focus:border-indigo-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/70 mb-1">Preço de Custo (MT)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ex: 320"
                    value={quickProdCostPrice || ''}
                    onChange={(e) => setQuickProdCostPrice(Number(e.target.value))}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand"
                  />
                </div>

                <div>
                  <label className="block text-ink/70 mb-1">Quantidade em Stock</label>
                  <input
                    type="number"
                    min="1"
                    value={quickProdQty}
                    onChange={(e) => setQuickProdQty(Number(e.target.value))}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-indigo-deep outline-none focus:border-indigo-brand"
                  />
                </div>
              </div>

              <div>
                <label className="block text-ink/70 mb-1">Descrição Curta</label>
                <input
                  type="text"
                  placeholder="ex: Alta durabilidade, garantia de fábrica"
                  value={quickProdDesc}
                  onChange={(e) => setQuickProdDesc(e.target.value)}
                  className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-medium text-ink outline-none focus:border-indigo-brand"
                />
              </div>

              {/* IMAGEM DO PRODUTO: LINK OU UPLOAD */}
              <div className="bg-sand-2/30 border border-ink/12 p-3.5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-deep flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-emerald-700" />
                    <span>Fotografia / Imagem (Link URL ou Upload)</span>
                  </label>
                  {quickProdImageUrl && (
                    <button
                      type="button"
                      onClick={() => setQuickProdImageUrl('')}
                      className="text-[10px] text-red-600 font-bold hover:underline"
                    >
                      Limpar Foto
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <label className="py-2.5 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 shadow-2xs">
                    {isUploadingQuickProdImg ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-sand" />
                        <span>A carregar...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-sand" />
                        <span>Upload Ficheiro</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleQuickProdImageUpload}
                      disabled={isUploadingQuickProdImg}
                      className="hidden"
                    />
                  </label>

                  <input
                    type="url"
                    placeholder="Ou cole o link da imagem (http...)"
                    value={quickProdImageUrl}
                    onChange={(e) => setQuickProdImageUrl(e.target.value)}
                    className="flex-grow p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium text-ink outline-none focus:border-indigo-brand"
                  />
                </div>

                {/* Preset Chips */}
                {!quickProdImageUrl && (
                  <div className="pt-1 flex items-center gap-1.5 overflow-x-auto text-[10px] font-bold text-ink/60">
                    <span>Preset Rápido:</span>
                    {[
                      { name: 'Geral', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Cimento', url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Peça Auto', url: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Bebidas', url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400' },
                      { name: 'Vestuário', url: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400' }
                    ].map((preset, idx) => (
                      <button
                        key={`admin-quick-preset-${preset.name}-${idx}`}
                        type="button"
                        onClick={() => setQuickProdImageUrl(preset.url)}
                        className="py-0.5 px-2 bg-white border border-ink/10 rounded-md whitespace-nowrap cursor-pointer hover:bg-emerald-50 transition-colors"
                      >
                        + {preset.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Preview Container */}
                {quickProdImageUrl && (
                  <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-ink/10">
                    <div className="h-16 w-20 rounded-lg overflow-hidden border border-ink/12 shrink-0 bg-black/5">
                      <img src={quickProdImageUrl} alt="Preview Produto" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-[10px] text-ink/60 truncate font-mono">{quickProdImageUrl}</span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-ink/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddProdModal(false)}
                  className="btn bg-sand-2 text-ink hover:bg-sand-2/70 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn bg-emerald-700 text-white hover:bg-emerald-800 py-2.5 px-5 rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar ao Estoque da Loja</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMO DEAL & TOP 10 EDIT / CREATE MODAL */}
      {showDealModal && (
        <div className="fixed inset-0 bg-indigo-deep/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-ink/15 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative overflow-y-auto max-h-[92vh] space-y-5">
            <button
              onClick={() => setShowDealModal(false)}
              className="absolute top-5 right-5 p-2 text-ink/40 hover:text-ink hover:bg-sand-2/50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="flex items-center gap-3 border-b border-ink/10 pb-4">
              <div className="p-3 bg-coral-brand/10 text-coral-brand rounded-2xl">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-black text-xl text-indigo-deep">
                  {editingDeal ? 'Editar Destaque / Promoção' : 'Criar Novo Destaque / Promoção'}
                </h3>
                <p className="text-xs text-ink/60">
                  Defina o texto, categoria e atualize a imagem através de upload ou link web.
                </p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-ink/80 font-bold mb-1">Título da Promoção *</label>
                <input
                  type="text"
                  placeholder="ex: Cimento Limpopo 42.5N, Fatos Italianos, Baterias Willard..."
                  value={dealTitle}
                  onChange={(e) => setDealTitle(e.target.value)}
                  className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-coral-brand"
                />
              </div>

              <div>
                <label className="block text-ink/80 font-bold mb-1">Texto de Destaque / Desconto (Subtítulo) *</label>
                <textarea
                  rows={2}
                  placeholder="ex: Desconto de 30% em compras a partir de 20 sacos com entrega gratuita."
                  value={dealSubtitle}
                  onChange={(e) => setDealSubtitle(e.target.value)}
                  className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-medium text-ink outline-none focus:border-coral-brand"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/80 font-bold mb-1">Categoria de Serviço</label>
                  <select
                    value={dealCategory}
                    onChange={(e) => setDealCategory(e.target.value as Category)}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-coral-brand"
                  >
                    <option value="supermercado">Supermercados & Frescos</option>
                    <option value="construcao">Material de Construção</option>
                    <option value="pecas_auto">Peças Auto & Oficinas</option>
                    <option value="loja">Lojas & Boutiques</option>
                    <option value="turismo">Turismo & Logística</option>
                    <option value="bar">Bares & Lounges</option>
                    <option value="hospedagem">Hospedagem & Hotéis</option>
                    <option value="entregador">Entregadores & Logística</option>
                  </select>
                </div>

                <div>
                  <label className="block text-ink/80 font-bold mb-1">Posição no Top (Rank)</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={dealRank}
                    onChange={(e) => setDealRank(Number(e.target.value))}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-coral-brand"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-ink/80 font-bold mb-1">Cor do Tema / Destaque</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={dealColor}
                      onChange={(e) => setDealColor(e.target.value)}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-ink/15 p-1 bg-paper"
                    />
                    <input
                      type="text"
                      value={dealColor}
                      onChange={(e) => setDealColor(e.target.value)}
                      className="flex-grow p-2.5 bg-paper border border-ink/15 rounded-xl text-xs font-mono font-bold text-ink"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-ink/80 font-bold mb-1">Estabelecimento Associado</label>
                  <select
                    value={dealEstId}
                    onChange={(e) => setDealEstId(e.target.value)}
                    className="w-full p-3 bg-paper border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-coral-brand"
                  >
                    <option value="">Nenhum (Campanha Geral do Portal)</option>
                    {establishments.map((est) => (
                      <option key={`opt-est-${est.id}`} value={est.id}>
                        {est.name} ({est.zone || est.category})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* FOTOGRAFIA / IMAGEM DA PROMOÇÃO */}
              <div className="bg-sand-2/40 border border-ink/15 p-4 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-indigo-deep flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-coral-brand" />
                    <span>Imagem da Promoção (Upload ou Link URL)</span>
                  </label>
                  {dealImageUrl && (
                    <button
                      type="button"
                      onClick={() => setDealImageUrl('')}
                      className="text-[11px] text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Remover Imagem
                    </button>
                  )}
                </div>

                {/* Upload or URL Controls */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <label className="py-2.5 px-4 bg-coral-brand hover:bg-[#d94824] text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shrink-0 shadow-xs">
                    {isUploadingDealImg ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>A carregar no ImgBB...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-white" />
                        <span>Upload do Ficheiro</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDealImageFileUpload}
                      disabled={isUploadingDealImg}
                      className="hidden"
                    />
                  </label>

                  <div className="flex-grow relative">
                    <input
                      type="url"
                      placeholder="Ou cole aqui o link da imagem (https://...)"
                      value={dealImageUrl}
                      onChange={(e) => setDealImageUrl(e.target.value)}
                      className="w-full p-2.5 bg-white border border-ink/15 rounded-xl text-xs font-medium text-ink outline-none focus:border-coral-brand"
                    />
                  </div>
                </div>

                {/* Live Preview */}
                {dealImageUrl ? (
                  <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-ink/10 shadow-2xs">
                    <div className="h-20 w-28 rounded-lg overflow-hidden border border-ink/12 shrink-0 bg-black/5">
                      <img 
                        src={dealImageUrl} 
                        alt="Preview da Promoção" 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80';
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Pré-visualização Ativa</span>
                      <span className="text-xs font-mono text-ink/60 truncate block max-w-xs">{dealImageUrl}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[11px] text-ink/50 italic bg-white/60 p-2.5 rounded-xl border border-ink/8 text-center">
                    Nenhuma foto selecionada. Será utilizada a imagem de fallback de alta resolução baseada na categoria.
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-ink/10 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDealModal(false)}
                  className="bg-sand-2 text-ink hover:bg-sand-2/70 py-2.5 px-4 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveDeal}
                  className="bg-coral-brand hover:bg-[#d94824] text-white py-2.5 px-6 rounded-xl text-xs font-bold cursor-pointer shadow-md flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Guardar Promoção</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
