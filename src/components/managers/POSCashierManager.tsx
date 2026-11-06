import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Establishment, 
  InventoryItem, 
  FinancialTransaction, 
  POSSale, 
  POSSaleItem, 
  POSPaymentMethod, 
  POSCashShift, 
  POSCashMovement,
  POSSyncLog,
  POSAuditAction
} from '../../types/types';
import { notify } from '../../services/dialogs';
import { 
  loadPOSSales, 
  savePOSSale, 
  loadPOSShifts, 
  getCurrentOpenShift, 
  openPOSShift, 
  closePOSShift, 
  recordPOSCashMovement, 
  loadPOSCashMovements,
  loadPOSSyncQueue, 
  syncPOSQueueWithServer, 
  loadPOSAuditLogs, 
  verifyPOSOperatorPIN,
  computePOSChecksum
} from '../../services/posStore';
import { 
  getOfflineSyncStatus, 
  toggleForcedOfflineMode, 
  SyncStatusState 
} from '../../services/offlineSync';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Printer, 
  Receipt, 
  CreditCard, 
  Coins, 
  Smartphone, 
  DollarSign, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  User, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  Layers, 
  History, 
  FileText, 
  Share2, 
  UtensilsCrossed, 
  Key, 
  Truck, 
  Wrench, 
  ShoppingBag, 
  X, 
  Percent, 
  Sliders, 
  Sparkles, 
  Building2, 
  Check, 
  Send, 
  Download,
  Info,
  Minimize2,
  Maximize2,
  Zap,
  Settings,
  Store
} from 'lucide-react';
import { POSSettingsModal } from '../modals/POSSettingsModal';

interface POSCashierManagerProps {
  establishment: Establishment;
  inventoryItems: InventoryItem[];
  setInventoryItems?: (updater: (prev: InventoryItem[]) => InventoryItem[]) => void;
  activeOperator?: string;
  storeRole?: 'administrador' | 'vendedor';
  financialTxs?: FinancialTransaction[];
  setFinancialTxs?: (updater: (prev: FinancialTransaction[]) => FinancialTransaction[]) => void;
  onClose?: () => void;
  onSelectTable?: (tableNumber: string) => void;
  isStandaloneFullscreen?: boolean;
  onUpdateEstablishment?: (updated: Establishment) => void;
}

export function POSCashierManager({
  establishment,
  inventoryItems,
  setInventoryItems,
  activeOperator = 'Operador Responsável',
  storeRole = 'administrador',
  financialTxs,
  setFinancialTxs,
  onClose,
  onSelectTable,
  isStandaloneFullscreen = true,
  onUpdateEstablishment
}: POSCashierManagerProps) {

  // Active Establishment State (Supports live updates & persistence across all menus)
  const [currentEst, setCurrentEst] = useState<Establishment>(establishment);
  useEffect(() => {
    setCurrentEst(establishment);
  }, [establishment]);

  // Settings Modal State
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] = useState<'loja_titular' | 'pagamentos' | 'cliente' | 'recibo'>('loja_titular');

  const handleOpenSettings = (tab: 'loja_titular' | 'pagamentos' | 'cliente' | 'recibo' = 'loja_titular') => {
    setSettingsInitialTab(tab);
    setShowSettingsModal(true);
  };

  const handleSaveEstablishment = (updated: Establishment) => {
    setCurrentEst(updated);

    // If customer name is empty or matches previous defaults, update to new default
    if (!customerName || customerName === 'Consumidor Final' || customerName === currentEst.defaultCustomerName) {
      if (updated.defaultCustomerName) setCustomerName(updated.defaultCustomerName);
    }
    if (!customerPhone || customerPhone === currentEst.defaultCustomerPhone) {
      if (updated.defaultCustomerPhone) setCustomerPhone(updated.defaultCustomerPhone);
    }
    if (!customerNuit || customerNuit === currentEst.defaultCustomerNuit) {
      if (updated.defaultCustomerNuit) setCustomerNuit(updated.defaultCustomerNuit);
    }

    // Persist directly to localStorage
    try {
      const raw = localStorage.getItem('axofacil_establishments');
      if (raw) {
        const list: Establishment[] = JSON.parse(raw);
        const idx = list.findIndex(e => e.id === updated.id);
        if (idx !== -1) {
          list[idx] = updated;
        } else {
          list.push(updated);
        }
        localStorage.setItem('axofacil_establishments', JSON.stringify(list));
        window.dispatchEvent(new CustomEvent('axofacil_establishments_changed', { detail: updated }));
      }
    } catch (err) {
      console.warn('Error persisting establishment in localStorage:', err);
    }

    if (onUpdateEstablishment) {
      onUpdateEstablishment(updated);
    }
  };

  // Fullscreen standalone mode state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(isStandaloneFullscreen !== false);

  // ==========================================
  // SYNC & NETWORK CONNECTION STATE
  // ==========================================
  const [syncStatus, setSyncStatus] = useState<SyncStatusState>(() => getOfflineSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  useEffect(() => {
    const handleStatusChange = () => {
      setSyncStatus(getOfflineSyncStatus());
    };
    window.addEventListener('online', handleStatusChange);
    window.addEventListener('offline', handleStatusChange);
    window.addEventListener('axofacil_offline_status_changed', handleStatusChange);
    window.addEventListener('axofacil_pos_sales_changed', handleStatusChange);

    return () => {
      window.removeEventListener('online', handleStatusChange);
      window.removeEventListener('offline', handleStatusChange);
      window.removeEventListener('axofacil_offline_status_changed', handleStatusChange);
      window.removeEventListener('axofacil_pos_sales_changed', handleStatusChange);
    };
  }, []);

  const handleToggleOffline = () => {
    toggleForcedOfflineMode();
    setSyncStatus(getOfflineSyncStatus());
  };

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setSyncFeedback(null);
    try {
      const res = await syncPOSQueueWithServer(currentEst.id);
      setSyncStatus(getOfflineSyncStatus());
      setSalesList(loadPOSSales(currentEst.id, currentEst.name));
      setSyncQueue(loadPOSSyncQueue(currentEst.id));
      setSyncFeedback(res.message);
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (e) {
      setSyncFeedback('Erro na sincronização.');
    } finally {
      setIsSyncing(false);
    }
  };

  // ==========================================
  // POS DATA & ACTIVE SHIFT
  // ==========================================
  const [salesList, setSalesList] = useState<POSSale[]>(() => loadPOSSales(establishment.id, establishment.name));
  const [currentShift, setCurrentShift] = useState<POSCashShift | null>(() => getCurrentOpenShift(establishment.id));
  const [syncQueue, setSyncQueue] = useState<POSSyncLog[]>(() => loadPOSSyncQueue(establishment.id));
  const [auditLogs, setAuditLogs] = useState<POSAuditAction[]>(() => loadPOSAuditLogs(establishment.id));

  // Current View Mode
  const [viewMode, setViewMode] = useState<'checkout' | 'shift_management' | 'history' | 'sync_queue'>('checkout');

  // Active Operator
  const [currentOperator, setCurrentOperator] = useState(activeOperator || 'Operador de Caixa');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [targetOperatorName, setTargetOperatorName] = useState('');

  // ==========================================
  // CART & CURRENT TRANSACTION STATE
  // ==========================================
  const [cart, setCart] = useState<POSSaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Customer & Context details
  const [customerName, setCustomerName] = useState(establishment.defaultCustomerName || '');
  const [customerPhone, setCustomerPhone] = useState(establishment.defaultCustomerPhone || '');
  const [customerNuit, setCustomerNuit] = useState(establishment.defaultCustomerNuit || '');
  const [tableNumber, setTableNumber] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [saleNotes, setSaleNotes] = useState('');

  // Discounts & Taxes
  const [globalDiscountPct, setGlobalDiscountPct] = useState(0);
  const [globalDiscountMT, setGlobalDiscountMT] = useState(0);
  const [applyVat, setApplyVat] = useState(true); // 16% IVA Mozambique

  // Payment Drawer Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<POSPaymentMethod>('Dinheiro');
  const [amountReceivedInput, setAmountReceivedInput] = useState('');
  const [mpesaPhone, setMpesaPhone] = useState('');
  const [paymentRefCode, setPaymentRefCode] = useState('');
  const [splitCashMT, setSplitCashMT] = useState<number>(0);
  const [splitMpesaMT, setSplitMpesaMT] = useState<number>(0);

  // Manual Mobile Wallet Validation State (M-Pesa & e-Mola)
  const [mobileValidationStatus, setMobileValidationStatus] = useState<'pendente' | 'validado' | 'erro'>('pendente');
  const [mobileValidationError, setMobileValidationError] = useState('');
  const [mobileValidationTimestamp, setMobileValidationTimestamp] = useState('');
  const [mobileCustomerName, setMobileCustomerName] = useState('');

  // Receipt Modal
  const [lastSale, setLastSale] = useState<POSSale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Custom Item Modal State
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPriceStr, setCustomItemPriceStr] = useState('100');
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemCategory, setCustomItemCategory] = useState('Artigo Avulso');
  const [customItemError, setCustomItemError] = useState('');
  const [itemAddedToast, setItemAddedToast] = useState<string | null>(null);

  // Shift Open / Close Modals
  const [showOpenShiftModal, setShowOpenShiftModal] = useState(false);
  const [openShiftFloat, setOpenShiftFloat] = useState<number>(2000);
  const [openShiftNotes, setOpenShiftNotes] = useState('');

  const [showCloseShiftModal, setShowCloseShiftModal] = useState(false);
  const [closeCountedCash, setCloseCountedCash] = useState<number>(0);
  const [closeShiftNotes, setCloseShiftNotes] = useState('');

  // Cash Movement Modal (Sangria / Suprimento)
  const [showCashMovementModal, setShowCashMovementModal] = useState(false);
  const [movementType, setMovementType] = useState<'sangria' | 'suprimento'>('sangria');
  const [movementAmount, setMovementAmount] = useState<number>(500);
  const [movementReason, setMovementReason] = useState('');

  // ==========================================
  // STORE TYPE DETERMINATION
  // ==========================================
  const storeCategory = (establishment.category || '').toLowerCase();
  const isBar = storeCategory.includes('bar') || storeCategory.includes('restaurante');
  const isSuper = storeCategory.includes('supermercado') || storeCategory.includes('mercearia');
  const isHotel = storeCategory.includes('hospedagem') || storeCategory.includes('hotel') || storeCategory.includes('pousada');
  const isParts = storeCategory.includes('peca') || storeCategory.includes('peça') || storeCategory.includes('auto') || storeCategory.includes('constru') || storeCategory.includes('ferrag');

  // Available Categories from Inventory
  const categories = useMemo(() => {
    const cats = Array.from(new Set(inventoryItems.map(i => i.category || 'Geral'))).filter(Boolean);
    return ['Todas', ...cats];
  }, [inventoryItems]);

  // Filtered Products for Touch Grid
  const filteredProducts = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchCat = selectedCategory === 'Todas' || item.category === selectedCategory;
      const matchSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.barcode && item.barcode.includes(searchQuery));
      return matchCat && matchSearch;
    });
  }, [inventoryItems, selectedCategory, searchQuery]);

  // ==========================================
  // FINANCIAL CALCULATIONS
  // ==========================================
  const subtotalMT = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.unitPriceMT * item.quantity), 0);
  }, [cart]);

  const discountAmountMT = useMemo(() => {
    if (globalDiscountMT > 0) return globalDiscountMT;
    if (globalDiscountPct > 0) return (subtotalMT * globalDiscountPct) / 100;
    return 0;
  }, [subtotalMT, globalDiscountPct, globalDiscountMT]);

  const totalAfterDiscountMT = Math.max(0, subtotalMT - discountAmountMT);

  const vatAmountMT = useMemo(() => {
    if (!applyVat) return 0;
    // 16% Mozambican VAT included in price
    return (totalAfterDiscountMT * 16) / 116;
  }, [totalAfterDiscountMT, applyVat]);

  const totalToPayMT = totalAfterDiscountMT;

  // Change / Troco calculation
  const amountReceivedMT = parseFloat(amountReceivedInput) || 0;
  const changeMT = Math.max(0, amountReceivedMT - totalToPayMT);
  const remainingToPayMT = Math.max(0, totalToPayMT - amountReceivedMT);

  // Quick Banknote Suggestions for Mozambique Currency
  const quickBanknotes = [50, 100, 200, 500, 1000, 2000];

  // Top 8 Fast-Selling / Quick-Key Products for 1-Touch Zero Typing checkout
  const quickKeyProducts = useMemo(() => {
    const topSellers = inventoryItems.filter(i => i.isTopSeller || (i.salesCount && i.salesCount > 5));
    if (topSellers.length >= 4) return topSellers.slice(0, 8);
    return inventoryItems.slice(0, 8);
  }, [inventoryItems]);

  // Quick tactile table presets for bars and restaurants
  const quickTables = ['Mesa 01', 'Mesa 02', 'Mesa 03', 'Mesa 04', 'Mesa 05', 'Mesa 06', 'Mesa 07', 'Mesa 08', 'Balcão', 'Esplanada', 'VIP'];

  // Quick tactile room presets for hotels and accommodation
  const quickRooms = ['Q-101', 'Q-102', 'Q-103', 'Q-104', 'Q-201', 'Q-202', 'Q-203', 'Suíte'];

  // Quick client presets for fast 1-touch invoice population
  const quickClientPresets = [
    { label: '👤 Consumidor Final', name: 'Cliente Balcão', nuit: '999999999' },
    { label: '🏢 Empresa c/ NUIT', name: 'Empresa / Fatura', nuit: '400123456' },
    { label: '⭐ Cliente VIP / Habitual', name: 'Cliente VIP', nuit: '' }
  ];

  // Quick operators list for 1-touch switch
  const availableOperators = useMemo(() => {
    if (establishment.operatorsList && establishment.operatorsList.length > 0) {
      return establishment.operatorsList;
    }
    return ['Mariamo Operadora', 'Ana Atendente Balcão', 'Carlos Gerente'];
  }, [establishment.operatorsList]);

  // ==========================================
  // CART ACTIONS
  // ==========================================
  const addToCart = (product: InventoryItem, qty = 1) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(i => i.inventoryItemId === product.id);
      if (existingIdx >= 0) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + qty;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          subtotalMT: newQty * updated[existingIdx].unitPriceMT,
          totalMT: newQty * updated[existingIdx].unitPriceMT
        };
        return updated;
      } else {
        const newItem: POSSaleItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          inventoryItemId: product.id,
          sku: product.sku,
          barcode: product.barcode,
          name: product.name,
          unit: product.unit || 'un',
          unitPriceMT: product.sellingPriceMT,
          costPriceMT: product.costPriceMT || (product.sellingPriceMT * 0.6),
          quantity: qty,
          subtotalMT: product.sellingPriceMT * qty,
          discountMT: 0,
          totalMT: product.sellingPriceMT * qty,
          vatPct: 16,
          category: product.category,
          imageUrl: product.imageUrl
        };
        return [...prev, newItem];
      }
    });
  };

  const updateCartItemQty = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === itemId) {
          const nextQty = Math.max(1, item.quantity + delta);
          return {
            ...item,
            quantity: nextQty,
            subtotalMT: nextQty * item.unitPriceMT,
            totalMT: nextQty * item.unitPriceMT - (item.discountMT || 0)
          };
        }
        return item;
      });
    });
  };

  const removeCartItem = (itemId: string) => {
    setCart(prev => prev.filter(i => i.id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setGlobalDiscountMT(0);
    setGlobalDiscountPct(0);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerNuit('');
    setTableNumber('');
    setRoomNumber('');
    setVehiclePlate('');
    setSaleNotes('');
  };

  // Quick Barcode Scan Enter Handler
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput) return;
    const matched = inventoryItems.find(i => 
      (i.barcode && i.barcode.toLowerCase() === barcodeInput.toLowerCase()) ||
      (i.sku && i.sku.toLowerCase() === barcodeInput.toLowerCase())
    );
    if (matched) {
      addToCart(matched, 1);
      setBarcodeInput('');
    } else {
      notify(`Código de barras "${barcodeInput}" não encontrado no inventário.`, 'warning');
    }
  };

  // Keyboard Shortcuts (F2: Focus Search, F4: Open Payment, Esc: Close or Dismiss)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0) {
          setAmountReceivedInput(totalToPayMT.toString());
          setShowPaymentModal(true);
        }
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      } else if (e.key === 'Escape') {
        if (showPaymentModal) setShowPaymentModal(false);
        else if (showReceiptModal) setShowReceiptModal(false);
        else if (showPinModal) setShowPinModal(false);
        else if (showOpenShiftModal) setShowOpenShiftModal(false);
        else if (showCloseShiftModal) setShowCloseShiftModal(false);
        else if (showCashMovementModal) setShowCashMovementModal(false);
        else if (showCustomItemModal) setShowCustomItemModal(false);
        else if (onClose) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, totalToPayMT, showPaymentModal, showReceiptModal, showPinModal, showOpenShiftModal, showCloseShiftModal, showCashMovementModal, showCustomItemModal, onClose]);

  // ==========================================
  // MOBILE WALLET VALIDATION HELPERS (POS BALCÃO)
  // ==========================================
  const handleValidateMobilePayment = () => {
    const code = paymentRefCode.trim();
    if (!code || code.length < 5) {
      setMobileValidationError('O código SMS da carteira móvel deve ter pelo menos 5 caracteres alfanuméricos.');
      setMobileValidationStatus('erro');
      return;
    }
    setMobileValidationError('');
    setMobileValidationStatus('validado');
    setMobileValidationTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  const handleSimulateMobileSMS = (wallet: 'M-Pesa' | 'e-Mola') => {
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    const timestamp = new Date().toISOString().replace(/\D/g, '').substring(4, 12);
    const simulatedCode = wallet === 'M-Pesa' 
      ? `MP${timestamp}.${randomHex}` 
      : `EM${timestamp.substring(2)}${randomHex}`;
    
    setPaymentRefCode(simulatedCode);
    if (!mpesaPhone) {
      setMpesaPhone(wallet === 'M-Pesa' ? '+258 84 712 3456' : '+258 86 981 2345');
    }
    if (!mobileCustomerName && !customerName) {
      setMobileCustomerName('Simão Cossa (SMS Confirmado)');
    }
    setMobileValidationError('');
    setMobileValidationStatus('validado');
    setMobileValidationTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // ==========================================
  // SALE COMPLETION / CHECKOUT (AUTOMATED & FLEXIBLE)
  // ==========================================
  const handleFinalizeSale = (overrideMethod?: POSPaymentMethod, overrideAmount?: number) => {
    if (cart.length === 0) return;

    const chosenMethod = overrideMethod || paymentMethod;
    const chosenAmount = overrideAmount !== undefined 
      ? overrideAmount 
      : (chosenMethod === 'Dinheiro' ? (amountReceivedMT || totalToPayMT) : totalToPayMT);
    const chosenChange = chosenMethod === 'Dinheiro' ? Math.max(0, chosenAmount - totalToPayMT) : 0;

    // Mobile Money Validation Enforcement for POS Cashier Counter
    if (chosenMethod === 'M-Pesa' || chosenMethod === 'e-Mola') {
      const code = paymentRefCode.trim();
      if (!code || code.length < 5) {
        setPaymentMethod(chosenMethod);
        setMobileValidationError('Por favor introduza e valide o Código de Confirmação SMS da transação antes de concluir a venda.');
        setMobileValidationStatus('erro');
        setShowPaymentModal(true);
        return;
      }
    }

    // Check or auto-open shift if needed so cashier is never blocked
    let activeShift = currentShift;
    if (!activeShift) {
      activeShift = openPOSShift(establishment.id, currentOperator, 0, 'Abertura rápida automática de turno');
      setCurrentShift(activeShift);
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];
    const invoiceNum = `FR-2026-${establishment.id.replace(/\D/g, '') || '01'}-${String(salesList.length + 1).padStart(4, '0')}`;

    const mobileDetails = (chosenMethod === 'M-Pesa' || chosenMethod === 'e-Mola') ? {
      walletType: chosenMethod as 'M-Pesa' | 'e-Mola',
      merchantAccount: chosenMethod === 'M-Pesa'
        ? (establishment.contactPhone && (establishment.contactPhone.includes('84') || establishment.contactPhone.includes('85')) 
            ? `${establishment.contactPhone} (${establishment.name})` 
            : `+258 84 920 1820 (${establishment.name})`)
        : (establishment.contactPhone && (establishment.contactPhone.includes('86') || establishment.contactPhone.includes('87')) 
            ? `${establishment.contactPhone} (${establishment.name})` 
            : `+258 86 319 4022 (${establishment.name})`),
      customerPhone: mpesaPhone.trim() || customerPhone.trim() || '+258 84 000 0000',
      transactionCode: paymentRefCode.trim().toUpperCase(),
      senderName: mobileCustomerName.trim() || customerName.trim() || 'Cliente Balcão',
      validationStatus: 'validado_manual' as const,
      verifiedByOperator: currentOperator,
      verifiedAt: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } : undefined;

    const newSale: POSSale = {
      id: `sale-${Date.now()}`,
      establishmentId: establishment.id,
      establishmentName: establishment.name,
      invoiceNumber: invoiceNum,
      date: today,
      time: timeStr,
      timestamp: Date.now(),
      operatorId: activeShift.operatorId || 'op-1',
      operatorName: currentOperator,
      operatorRole: storeRole === 'administrador' ? 'administrador' : 'operador',
      customerId: customerPhone ? `cli-${customerPhone.replace(/\D/g, '')}` : undefined,
      customerName: customerName.trim() || 'Cliente Balcão',
      customerPhone: customerPhone.trim() || undefined,
      customerNuit: customerNuit.trim() || '999999999',
      items: [...cart],
      itemCount: cart.reduce((acc, i) => acc + i.quantity, 0),
      subtotalMT,
      discountMT: discountAmountMT,
      discountPct: globalDiscountPct,
      vatMT: vatAmountMT,
      vatRatePct: applyVat ? 16 : 0,
      totalMT: totalToPayMT,
      paymentMethod: chosenMethod,
      mobilePaymentDetails: mobileDetails,
      amountReceivedMT: chosenAmount,
      changeMT: chosenChange,
      status: 'concluida',
      syncStatus: syncStatus.effectiveOnline ? 'synced' : 'pending_sync',
      signatureChecksum: computePOSChecksum({ invoiceNum, total: totalToPayMT, date: today }),
      offlineCreatedAt: now.toISOString(),
      syncedAt: syncStatus.effectiveOnline ? now.toISOString() : undefined,
      shiftId: activeShift.id,
      notes: saleNotes,
      tableNumber: isBar ? tableNumber : undefined,
      roomNumber: isHotel ? roomNumber : undefined,
      vehiclePlateOrModel: isParts ? vehiclePlate : undefined,
      orderType: isBar ? 'mesa' : isHotel ? 'quarto' : isParts ? 'balcao' : 'balcao'
    };

    // Save locally
    const res = savePOSSale(
      establishment.id,
      newSale,
      inventoryItems,
      setInventoryItems,
      setFinancialTxs
    );

    if (res.success) {
      setSalesList(loadPOSSales(establishment.id, establishment.name));
      setCurrentShift(getCurrentOpenShift(establishment.id));
      setSyncQueue(loadPOSSyncQueue(establishment.id));
      setAuditLogs(loadPOSAuditLogs(establishment.id));
      setLastSale(newSale);
      setShowPaymentModal(false);
      setShowReceiptModal(true);
      // Reset payment code state
      setPaymentRefCode('');
      setMpesaPhone('');
      setMobileCustomerName('');
      setMobileValidationStatus('pendente');
      setMobileValidationError('');
      clearCart();
    } else {
      notify('Erro ao guardar a venda no armazenamento local.', 'error');
    }
  };

  // 1-Touch direct payment shortcut
  const handleQuickPayment = (method: POSPaymentMethod) => {
    if (cart.length === 0) return;
    if (method === 'M-Pesa' || method === 'e-Mola') {
      // Direct opening to mobile verification counter modal
      setPaymentMethod(method);
      setAmountReceivedInput(totalToPayMT.toString());
      setMobileValidationError('');
      setMobileValidationStatus('pendente');
      setShowPaymentModal(true);
      return;
    }
    handleFinalizeSale(method, totalToPayMT);
  };

  // Operator PIN Switch Handler
  const handleOperatorPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPOSOperatorPIN(establishment.id, pinInput)) {
      setCurrentOperator(targetOperatorName || 'Operador de Caixa');
      setShowPinModal(false);
      setPinInput('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // Open Shift Action
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    const newShift = openPOSShift(establishment.id, currentOperator, openShiftFloat, openShiftNotes);
    setCurrentShift(newShift);
    setShowOpenShiftModal(false);
  };

  // Close Shift Action
  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    const closed = closePOSShift(establishment.id, currentShift.id, closeCountedCash, closeShiftNotes);
    setCurrentShift(null);
    setShowCloseShiftModal(false);
    if (closed) {
      notify(`Caixa Fechado com Sucesso! Vendas: ${closed.totalSalesMT.toLocaleString()} MT | Contado: ${closed.closingBalanceCountedMT?.toLocaleString()} MT`, 'success');
    }
  };

  // Cash Movement Action
  const handleCashMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    recordPOSCashMovement(establishment.id, {
      shiftId: currentShift.id,
      establishmentId: establishment.id,
      type: movementType,
      amountMT: movementAmount,
      reason: movementReason || (movementType === 'sangria' ? 'Retirada para cofre' : 'Reforço de troco'),
      operatorName: currentOperator
    });
    setCurrentShift(getCurrentOpenShift(establishment.id));
    setShowCashMovementModal(false);
    setMovementReason('');
  };

  return (
    <div className={isFullscreen 
      ? "fixed inset-0 z-[9999] bg-slate-950 text-slate-100 flex flex-col w-screen h-screen overflow-hidden select-none font-sans" 
      : "space-y-4 font-sans text-ink"
    }>
      {/* ========================================================================= */}
      {/* TOP SAAS POS HEADER: OFFLINE-FIRST CONNECTION STATUS & SHIFT INFO         */}
      {/* ========================================================================= */}
      <div className={`bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 p-3 sm:p-4 text-paper shadow-md ${isFullscreen ? 'shrink-0' : 'rounded-2xl'}`}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          {/* Brand & Store Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 font-bold shrink-0">
              {isBar ? <UtensilsCrossed className="w-5 h-5" /> : isHotel ? <Key className="w-5 h-5" /> : isParts ? <Wrench className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-base text-white">{establishment.name}</h3>
                <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                  Balcão de Caixa POS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sistema Ponto de Venda 100% Offline-First c/ Emissão de Recibos & Sincronização em Nuvem
              </p>
            </div>
          </div>

          {/* Offline Sync State Pill & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Real-time Connection Status Badge */}
            <div className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-2xs ${
              syncStatus.effectiveOnline
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                : 'bg-amber-950/90 text-amber-300 border-amber-500/50'
            }`}>
              {syncStatus.effectiveOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>ONLINE (Nuvem Ativa)</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>MODO OFFLINE LOCAL</span>
                </>
              )}
            </div>

            {/* Force Offline Simulation Switch */}
            <button
              type="button"
              onClick={handleToggleOffline}
              className={`py-1.5 px-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                syncStatus.isForcedOffline
                  ? 'bg-rose-900/80 text-rose-200 border-rose-500/60'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
              }`}
              title="Alternar modo offline para testar funcionamento sem sinal de internet"
            >
              <span>{syncStatus.isForcedOffline ? '🔴 Desativar Teste Offline' : '📡 Simular Offline'}</span>
            </button>

            {/* Settings Quick Access Button in Top Header */}
            <button
              type="button"
              onClick={() => handleOpenSettings('loja_titular')}
              className="py-1.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shrink-0"
              title="Configurar Dados da Loja, Nome/Telefone do Titular, Contas de Pagamento e Cliente Padrão"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Configurar Loja & Contas</span>
            </button>

            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-sm shrink-0 disabled:opacity-50"
              title="Sincronizar vendas e movimentos pendentes com o servidor"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'A Sincronizar...' : 'Sincronizar Agora'}</span>
              {syncQueue.filter(q => q.status === 'pending').length > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {syncQueue.filter(q => q.status === 'pending').length}
                </span>
              )}
            </button>

            {/* Fullscreen toggle button */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="py-1.5 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer transition-all border border-slate-700 flex items-center gap-1.5"
              title={isFullscreen ? "Alternar para modo compacto" : "Expandir para tela cheia"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Janela' : 'Tela Cheia'}</span>
            </button>

            {/* Close / Return to Profile Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md border border-rose-400/40"
                title="Fechar Balcão de Caixa e Voltar ao Perfil da Loja (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Fechar Balcão (Voltar)</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync feedback notification */}
        {syncFeedback && (
          <div className="mt-2 bg-emerald-900/80 border border-emerald-500/50 text-emerald-200 text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-300" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Shift Summary & Quick View Selector Strip */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3">
          {/* Shift & Operator Details */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 py-1 px-2.5 rounded-lg text-xs">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Operador:</span>
              <span className="font-bold text-white">{currentOperator}</span>
              <button
                type="button"
                onClick={() => {
                  setTargetOperatorName(currentOperator);
                  setShowPinModal(true);
                }}
                className="text-amber-400 hover:underline text-[11px] font-bold ml-1 cursor-pointer"
              >
                (Trocar Atendente)
              </button>
            </div>

            <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 py-1 px-2.5 rounded-lg text-xs">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Turno de Caixa:</span>
              {currentShift ? (
                <span className="font-bold text-emerald-400">
                  Aberto ({currentShift.totalSalesCount} vendas · {currentShift.totalSalesMT.toLocaleString()} MT)
                </span>
              ) : (
                <span className="font-bold text-rose-400">Caixa Fechado</span>
              )}
            </div>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setViewMode('checkout')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'checkout'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Balcão de Venda (F4)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('shift_management')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'shift_management'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Gestão de Turno / Caixa</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('history')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'history'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Histórico ({salesList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode('sync_queue')}
              className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'sync_queue'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Fila Sync & Auditoria</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenSettings('loja_titular')}
              className="py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 shrink-0"
              title="Configurar Dados da Loja, Nome/Telefone do Titular, Contas de Pagamento e Cliente"
            >
              <Settings className="w-3.5 h-3.5 text-amber-400" />
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN BODY WRAPPER (SCROLLABLE IN FULLSCREEN MODE)                         */}
      {/* ========================================================================= */}
      <div className={isFullscreen ? "flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-900/40 text-ink" : "space-y-4"}>

      {/* ========================================================================= */}
      {/* VIEW: MAIN CHECKOUT & SALE REGISTRATION (SPLIT TOUCH SCREEN)             */}
      {/* ========================================================================= */}
      {viewMode === 'checkout' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT: TOUCH PRODUCT GRID & FAST SEARCH (7 cols) */}
          <div className="lg:col-span-7 space-y-3">
            {/* Top Barcode & Search Controls */}
            <div className="bg-white border border-ink/10 rounded-2xl p-3 shadow-xs space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Fast Barcode Input (F2) */}
                <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
                  <Barcode className="w-4 h-4 text-indigo-brand absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    placeholder="Leitor Código de Barras (F2) ou SKU..."
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                  />
                </form>

                {/* Text Search Filter */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Pesquisar por nome de artigo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                  />
                </div>

                {/* Add Custom Item / Service */}
                <button
                  type="button"
                  onClick={() => setShowCustomItemModal(true)}
                  className="py-2 px-3 bg-sand-2/60 hover:bg-sand-2 text-indigo-deep border border-ink/15 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
                  title="Inserir artigo avulso ou serviço não listado no catálogo"
                >
                  <Plus className="w-3.5 h-3.5 text-terracotta" />
                  <span>Item Avulso</span>
                </button>

                {/* Store Settings Shortcut Button */}
                <button
                  type="button"
                  onClick={() => handleOpenSettings('loja_titular')}
                  className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shrink-0"
                  title="Configurações da Loja, Titular, Contas de Pagamento e Cliente"
                >
                  <Settings className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Configurar Loja</span>
                </button>
              </div>

              {/* Category Pills Slider */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat, idx) => {
                  const isSelected = selectedCategory === cat;
                  const count = cat === 'Todas' ? inventoryItems.length : inventoryItems.filter(i => i.category === cat).length;
                  return (
                    <button
                      key={`pos-cat-${cat}-${idx}`}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`py-1 px-2.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-indigo-deep text-paper shadow-2xs scale-102'
                          : 'bg-sand-2/40 text-ink/70 hover:bg-sand-2 border border-ink/10'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-sand-1 text-ink/60'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ⚡ Venda Rápida 1-Toque (Zero Digitação - Artigos Mais Vendidos) */}
            {quickKeyProducts.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-amber-500/10 border border-amber-500/30 rounded-2xl p-2.5 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-950 px-1">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                    <span>Venda Rápida 1-Toque (Artigos Mais Frequentes)</span>
                  </span>
                  <span className="text-[10px] text-amber-800/60 font-normal">Toque direto sem digitar nada</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {quickKeyProducts.map((prod, qIdx) => (
                    <button
                      key={`quick-key-${prod.id}-${qIdx}`}
                      type="button"
                      onClick={() => addToCart(prod, 1)}
                      className="p-2 bg-white hover:bg-amber-50 active:scale-95 border border-amber-300/50 hover:border-amber-400 rounded-xl text-left transition-all cursor-pointer shadow-2xs group flex flex-col justify-between"
                    >
                      <div className="font-bold text-xs text-indigo-deep line-clamp-1 group-hover:text-amber-900">
                        {prod.name}
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[11px]">
                        <span className="font-serif font-black text-terracotta">
                          {prod.sellingPriceMT.toLocaleString()} MT
                        </span>
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded">
                          +1
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Touch-Optimized Product Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[560px] overflow-y-auto p-1 pr-1.5">
              {filteredProducts.map((prod, idx) => {
                const isOutOfStock = prod.quantityInStock <= 0;
                const isLowStock = prod.quantityInStock > 0 && prod.quantityInStock <= (prod.minStockThreshold || 5);
                const inCartQty = cart.find(i => i.inventoryItemId === prod.id)?.quantity || 0;

                return (
                  <div
                    key={`pos-prod-${prod.id}-${idx}`}
                    onClick={() => {
                      if (!isOutOfStock) addToCart(prod, 1);
                    }}
                    className={`bg-white border rounded-2xl p-2.5 flex flex-col justify-between cursor-pointer transition-all relative group select-none shadow-2xs hover:shadow-md ${
                      isOutOfStock 
                        ? 'opacity-60 border-ink/10 cursor-not-allowed bg-slate-50' 
                        : inCartQty > 0 
                          ? 'border-indigo-brand bg-indigo-50/20 ring-1 ring-indigo-brand/30' 
                          : 'border-ink/10 hover:border-indigo-brand'
                    }`}
                  >
                    {/* Floating in-cart quantity badge */}
                    {inCartQty > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-indigo-deep text-paper text-xs font-black w-6 h-6 rounded-full flex items-center justify-center shadow-xs border-2 border-white z-10">
                        {inCartQty}
                      </span>
                    )}

                    <div>
                      {/* Image & Stock Badge */}
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-sand-2/30 mb-2">
                        {prod.imageUrl ? (
                          <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-serif font-bold text-ink/30 text-lg">
                            {prod.name.charAt(0)}
                          </div>
                        )}
                        <span className={`absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-2xs ${
                          isOutOfStock ? 'bg-rose-900/90 text-white' : isLowStock ? 'bg-amber-600/90 text-white' : 'bg-slate-900/80 text-emerald-300'
                        }`}>
                          {isOutOfStock ? 'Esgotado' : `${prod.quantityInStock} em stock`}
                        </span>
                      </div>

                      {/* Product Name & SKU */}
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-ink/50 font-mono truncate">{prod.sku || prod.barcode || prod.category}</div>
                        <h4 className="font-bold text-xs text-indigo-deep line-clamp-2 leading-snug group-hover:text-terracotta transition-colors">
                          {prod.name}
                        </h4>
                      </div>
                    </div>

                    {/* Price and Add Button */}
                    <div className="mt-2 pt-2 border-t border-ink/5 flex items-center justify-between">
                      <div className="font-serif font-bold text-xs sm:text-sm text-indigo-deep">
                        {prod.sellingPriceMT.toLocaleString()} <span className="text-[10px] font-sans font-normal text-ink/60">MT</span>
                      </div>
                      <button
                        type="button"
                        disabled={isOutOfStock}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                          isOutOfStock ? 'bg-slate-200 text-slate-400' : 'bg-indigo-deep hover:bg-terracotta text-paper shadow-2xs'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: LIVE SALE TICKET & BILLING DRAWER (5 cols) */}
          <div className="lg:col-span-5 bg-white border border-ink/15 rounded-2xl shadow-sm flex flex-col justify-between overflow-hidden">
            {/* Ticket Header & Context Fields */}
            <div className="p-3.5 bg-sand-2/20 border-b border-ink/10 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-brand" />
                  <h4 className="font-serif font-bold text-sm text-indigo-deep">Registo de Venda</h4>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomItemName('');
                      setCustomItemPriceStr('100');
                      setCustomItemQty(1);
                      setCustomItemError('');
                      setShowCustomItemModal(true);
                    }}
                    className="py-1 px-2.5 bg-sand-2/90 hover:bg-sand-2 text-indigo-deep border border-ink/15 font-bold text-[11px] rounded-lg cursor-pointer transition-all flex items-center gap-1 shadow-2xs active:scale-95"
                    title="Adicionar artigo avulso ou serviço não listado no catálogo"
                  >
                    <Plus className="w-3.5 h-3.5 text-terracotta" />
                    <span>Item Avulso</span>
                  </button>
                  <span className="text-xs font-mono font-bold text-ink/50">
                    {cart.length} {cart.length === 1 ? 'linha' : 'linhas'}
                  </span>
                </div>
              </div>

              {/* Toast Feedback for Added Custom Item */}
              {itemAddedToast && (
                <div className="p-2 bg-emerald-100/90 border border-emerald-300 text-emerald-950 text-xs font-bold rounded-xl flex items-center justify-between shadow-2xs animate-fadeIn">
                  <span className="flex items-center gap-1.5 truncate">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span className="truncate">{itemAddedToast}</span>
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setItemAddedToast(null)} 
                    className="text-emerald-800 hover:text-emerald-950 p-1 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* Context Specific Input (Table for Bars, Room for Hotels, Plate for Parts) */}
              <div className="space-y-2 text-xs">
                {isBar && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-ink/60">Mesa / Comanda Ativa:</label>
                      <span className="text-[9px] text-amber-800 font-semibold">Toque rápido:</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                      {quickTables.map((tbl, tIdx) => (
                        <button
                          key={`quick-tbl-${tbl}-${tIdx}`}
                          type="button"
                          onClick={() => setTableNumber(tbl)}
                          className={`py-1 px-2 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                            tableNumber === tbl
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'bg-white hover:bg-sand-2 text-ink/80 border border-ink/15'
                          }`}
                        >
                          {tbl}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Ou digite outra mesa (ex: Mesa 04)..."
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full p-1.5 bg-white border border-ink/15 rounded-lg text-xs font-bold outline-none focus:border-indigo-brand"
                    />
                  </div>
                )}

                {isHotel && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-ink/60">Nº Quarto / Alojamento:</label>
                      <span className="text-[9px] text-amber-800 font-semibold">Toque rápido:</span>
                    </div>
                    <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                      {quickRooms.map((rm, rIdx) => (
                        <button
                          key={`quick-rm-${rm}-${rIdx}`}
                          type="button"
                          onClick={() => setRoomNumber(rm)}
                          className={`py-1 px-2 rounded-md text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                            roomNumber === rm
                              ? 'bg-amber-500 text-slate-950 font-black shadow-2xs'
                              : 'bg-white hover:bg-sand-2 text-ink/80 border border-ink/15'
                          }`}
                        >
                          {rm}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Ou digite outro quarto (ex: Quarto 204)..."
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      className="w-full p-1.5 bg-white border border-ink/15 rounded-lg text-xs font-bold outline-none focus:border-indigo-brand"
                    />
                  </div>
                )}

                {isParts && (
                  <div>
                    <label className="block text-[10px] font-bold text-ink/60 mb-0.5">Matrícula / Modelo do Veículo:</label>
                    <input
                      type="text"
                      placeholder="ex: Toyota Hilux D4D / ABM-123-MP"
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value)}
                      className="w-full p-1.5 bg-white border border-ink/15 rounded-lg text-xs font-bold outline-none focus:border-indigo-brand"
                    />
                  </div>
                )}

                {/* Fast Client Presets & Settings */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <label className="text-[10px] font-bold text-ink/70">Cliente / Faturação:</label>
                      <button
                        type="button"
                        onClick={() => handleOpenSettings('cliente')}
                        className="flex items-center gap-1 text-[9px] font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-1.5 py-0.5 rounded cursor-pointer transition-all"
                        title="Configurar Dados de Conta do Cliente, Titular e Contas de Pagamento"
                      >
                        <Settings className="w-2.5 h-2.5 text-amber-600" />
                        <span>Configurar Cliente & Titular</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-1">
                      {quickClientPresets.map((preset, pIdx) => (
                        <button
                          key={`client-preset-${pIdx}`}
                          type="button"
                          onClick={() => {
                            setCustomerName(preset.name);
                            if (preset.nuit) setCustomerNuit(preset.nuit);
                          }}
                          className="py-0.5 px-1.5 bg-sand-2/70 hover:bg-sand-2 text-ink font-semibold text-[9px] rounded transition-all cursor-pointer"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      placeholder="Nome do Cliente..."
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="p-1.5 bg-white border border-ink/15 rounded-lg text-xs font-bold outline-none focus:border-indigo-brand"
                    />
                    <input
                      type="text"
                      placeholder="NUIT Fatura"
                      value={customerNuit}
                      onChange={(e) => setCustomerNuit(e.target.value)}
                      className="p-1.5 bg-white border border-ink/15 rounded-lg text-[11px] font-mono outline-none focus:border-indigo-brand"
                    />
                    <input
                      type="text"
                      placeholder="Telemóvel (+258)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="p-1.5 bg-white border border-ink/15 rounded-lg text-[11px] outline-none focus:border-indigo-brand col-span-2 sm:col-span-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="p-3 divide-y divide-ink/10 overflow-y-auto max-h-[260px] min-h-[160px]">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-ink/40 space-y-2">
                  <Receipt className="w-8 h-8 mx-auto stroke-1" />
                  <p className="text-xs font-semibold">Nenhum artigo adicionado ao recibo.</p>
                  <p className="text-[10px]">Toque nos artigos da esquerda ou use o leitor de código de barras.</p>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`cart-item-${item.id}-${idx}`} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs text-indigo-deep truncate">{item.name}</div>
                      <div className="text-[10px] text-ink/60 font-mono">
                        {item.quantity} x {item.unitPriceMT.toLocaleString()} MT
                      </div>
                    </div>

                    {/* Stepper Quantity Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, -1)}
                        className="w-6 h-6 rounded-md bg-sand-2 hover:bg-sand-1 text-ink font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQty(item.id, 1)}
                        className="w-6 h-6 rounded-md bg-sand-2 hover:bg-sand-1 text-ink font-bold text-xs flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal & Remove */}
                    <div className="text-right flex items-center gap-2">
                      <span className="font-serif font-bold text-xs text-indigo-deep">
                        {item.subtotalMT.toLocaleString()} MT
                      </span>
                      <button
                        type="button"
                        onClick={() => removeCartItem(item.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded cursor-pointer"
                        title="Remover linha"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Financial Summary & Discounts */}
            <div className="p-3.5 bg-sand-2/15 border-t border-ink/10 space-y-2">
              {/* Subtotal & Discount Row */}
              <div className="flex items-center justify-between text-xs text-ink/70">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-ink">{subtotalMT.toLocaleString()} MT</span>
              </div>

              {/* Discount Controls */}
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="flex items-center gap-1 text-ink/70">
                  <Percent className="w-3 h-3 text-amber-600" />
                  <span>Desconto Comercial:</span>
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="0%"
                    value={globalDiscountPct || ''}
                    onChange={(e) => {
                      setGlobalDiscountPct(parseFloat(e.target.value) || 0);
                      setGlobalDiscountMT(0);
                    }}
                    className="w-14 p-1 bg-white border border-ink/15 rounded text-right text-xs font-bold outline-none"
                  />
                  <span className="text-[10px] text-ink/50">%</span>
                </div>
              </div>

              {/* VAT (IVA 16%) Toggle */}
              <div className="flex items-center justify-between text-xs text-ink/70">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={applyVat}
                    onChange={(e) => setApplyVat(e.target.checked)}
                    className="accent-indigo-brand rounded"
                  />
                  <span>IVA 16% Moçambique Incluído:</span>
                </label>
                <span className="font-mono text-ink/60">{vatAmountMT.toFixed(2)} MT</span>
              </div>

              {/* Total to Pay Highlight */}
              <div className="p-3 bg-indigo-deep text-paper rounded-xl flex items-center justify-between shadow-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-sand tracking-widest block">Total a Cobrar</span>
                  <span className="text-xl font-serif font-black">{totalToPayMT.toLocaleString()} MT</span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-1 rounded text-paper/80 font-semibold">
                  {cart.reduce((acc, i) => acc + i.quantity, 0)} Itens
                </span>
              </div>

              {/* 1-Touch Instant Payment Shortcuts (Zero Manual Typing) */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px] font-bold text-ink/60 uppercase tracking-wider">
                  <span>Cobrança Rápida 1-Toque (Exato)</span>
                  <span className="text-[9px] text-emerald-800 font-semibold lowercase">sem abrir janelas</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleQuickPayment('Dinheiro')}
                    className="py-2 px-1.5 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center shadow-xs disabled:opacity-35"
                    title="Cobrar Valor Exato em Dinheiro com 1 Toque"
                  >
                    <span>💵 Dinheiro</span>
                    <span className="text-[9px] font-normal opacity-85">Valor Exato</span>
                  </button>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleQuickPayment('M-Pesa')}
                    className="py-2 px-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center shadow-xs disabled:opacity-35"
                    title="Cobrar via M-Pesa com 1 Toque"
                  >
                    <span>📱 M-Pesa</span>
                    <span className="text-[9px] font-normal opacity-85">Direto</span>
                  </button>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleQuickPayment('e-Mola')}
                    className="py-2 px-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center shadow-xs disabled:opacity-35"
                    title="Cobrar via e-Mola com 1 Toque"
                  >
                    <span>📱 e-Mola</span>
                    <span className="text-[9px] font-normal opacity-85">Direto</span>
                  </button>

                  <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => handleQuickPayment('POS Cartão (TPA)')}
                    className="py-2 px-1.5 bg-blue-700 hover:bg-blue-600 active:scale-95 text-white font-bold text-[11px] rounded-xl transition-all cursor-pointer flex flex-col items-center justify-center shadow-xs disabled:opacity-35"
                    title="Cobrar via Cartão TPA SIMO com 1 Toque"
                  >
                    <span>💳 Cartão TPA</span>
                    <span className="text-[9px] font-normal opacity-85">SIMO</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Cancel or Open Change / Troco Calculator (F4) */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                  className="py-2.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-all cursor-pointer disabled:opacity-40"
                  title="Cancelar e limpar recibo atual (Esc)"
                >
                  Cancelar (Esc)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAmountReceivedInput(totalToPayMT.toString());
                    setShowPaymentModal(true);
                  }}
                  disabled={cart.length === 0}
                  className="col-span-2 py-2.5 px-4 bg-indigo-deep hover:bg-indigo-900 text-white font-serif font-bold text-xs sm:text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 disabled:opacity-40"
                  title="Avançar para cálculo de troco e cédulas meticais (F4)"
                >
                  <DollarSign className="w-4 h-4 text-amber-300" />
                  <span>Troco / Outros Modos (F4)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: SHIFT & CASH DRAWER MANAGEMENT (GESTÃO DE TURNO)                    */}
      {/* ========================================================================= */}
      {viewMode === 'shift_management' && (
        <div className="bg-white border border-ink/10 rounded-2xl p-5 space-y-6 shadow-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-ink/10 pb-4">
            <div>
              <h3 className="font-serif font-bold text-lg text-indigo-deep flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-500" />
                <span>Gestão de Turnos & Fecho de Caixa</span>
              </h3>
              <p className="text-xs text-ink/60">
                Abertura com fundo de troco, conferência cega, sangrias, suprimentos e apuramento de quebras.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Settings shortcut for Shift Management */}
              <button
                type="button"
                onClick={() => handleOpenSettings('loja_titular')}
                className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                title="Configurações do Estabelecimento, Titular e Contas de Pagamento"
              >
                <Settings className="w-3.5 h-3.5 text-amber-600" />
                <span>Configurações do Caixa & Titular</span>
              </button>

              {currentShift ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('sangria');
                      setShowCashMovementModal(true);
                    }}
                    className="py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>- Sangria (Retirada)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('suprimento');
                      setShowCashMovementModal(true);
                    }}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                  >
                    <span>+ Suprimento (Reforço)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const expected = currentShift.openingBalanceMT + currentShift.totalSalesCashMT + currentShift.totalDepositsMT - currentShift.totalWithdrawalsMT;
                      setCloseCountedCash(expected);
                      setShowCloseShiftModal(true);
                    }}
                    className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Fechar Turno / Caixa</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(true)}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm flex items-center gap-2"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Abrir Novo Turno de Caixa</span>
                </button>
              )}
            </div>
          </div>

          {/* Active Shift Financial Metrics */}
          {currentShift ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-sand-2/30 border border-ink/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-ink/50 uppercase block">Fundo de Abertura</span>
                <span className="text-base font-serif font-bold text-indigo-deep">{currentShift.openingBalanceMT.toLocaleString()} MT</span>
                <span className="text-[10px] text-ink/50 block mt-0.5">Saldo inicial de trocos</span>
              </div>

              <div className="bg-sand-2/30 border border-ink/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-ink/50 uppercase block">Vendas em Dinheiro</span>
                <span className="text-base font-serif font-bold text-emerald-700">{currentShift.totalSalesCashMT.toLocaleString()} MT</span>
                <span className="text-[10px] text-ink/50 block mt-0.5">Entradas físicas na gaveta</span>
              </div>

              <div className="bg-sand-2/30 border border-ink/10 rounded-xl p-3">
                <span className="text-[10px] font-bold text-ink/50 uppercase block">Vendas M-Pesa / Cartão</span>
                <span className="text-base font-serif font-bold text-indigo-brand">
                  {(currentShift.totalSalesMpesaMT + currentShift.totalSalesEmolaMT + currentShift.totalSalesCardMT + currentShift.totalSalesBankMT).toLocaleString()} MT
                </span>
                <span className="text-[10px] text-ink/50 block mt-0.5">Pagamentos eletrónicos</span>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                <span className="text-[10px] font-bold text-indigo-900 uppercase block">Dinheiro Esperado em Caixa</span>
                <span className="text-lg font-serif font-black text-indigo-deep">
                  {(currentShift.openingBalanceMT + currentShift.totalSalesCashMT + currentShift.totalDepositsMT - currentShift.totalWithdrawalsMT).toLocaleString()} MT
                </span>
                <span className="text-[10px] text-indigo-800/70 block mt-0.5">Abertura + Vendas - Sangrias</span>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-sand-2/20 border border-dashed border-ink/20 rounded-2xl space-y-2">
              <Lock className="w-10 h-10 mx-auto text-ink/30" />
              <h4 className="font-serif font-bold text-base text-ink">Nenhum turno de caixa aberto no momento</h4>
              <p className="text-xs text-ink/60">Abra um turno para começar a emitir vendas no balcão e gerir o fluxo de caixa.</p>
            </div>
          )}

          {/* Past Shifts History */}
          <div className="space-y-3 pt-3">
            <h4 className="font-serif font-bold text-sm text-indigo-deep">Histórico de Turnos Fechados</h4>
            <div className="border border-ink/10 rounded-xl overflow-hidden divide-y divide-ink/10 text-xs">
              {loadPOSShifts(establishment.id).filter(s => s.status === 'fechado').slice(0, 5).map((shift, idx) => (
                <div key={`closed-shift-${shift.id}-${idx}`} className="p-3 bg-white flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <div className="font-bold text-indigo-deep flex items-center gap-2">
                      <span>Turno #{shift.id.slice(-6)}</span>
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-ink/60">{shift.operatorName}</span>
                    </div>
                    <div className="text-[11px] text-ink/50">
                      Aberto: {new Date(shift.openedAt).toLocaleString('pt-PT')} | Fechado: {shift.closedAt ? new Date(shift.closedAt).toLocaleString('pt-PT') : '-'}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-[10px] text-ink/50 uppercase">Total Vendas</div>
                      <div className="font-bold font-serif text-emerald-700">{shift.totalSalesMT.toLocaleString()} MT</div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] text-ink/50 uppercase">Diferença (Quebra/Sobra)</div>
                      <div className={`font-bold font-mono ${
                        (shift.discrepancyMT || 0) === 0 ? 'text-emerald-600' : (shift.discrepancyMT || 0) > 0 ? 'text-blue-600' : 'text-rose-600'
                      }`}>
                        {(shift.discrepancyMT || 0) > 0 ? `+${shift.discrepancyMT} MT (Sobra)` : (shift.discrepancyMT || 0) < 0 ? `${shift.discrepancyMT} MT (Quebra)` : '0 MT (Conferido)'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: SALES HISTORY (HISTÓRICO DE VENDAS DO TURNO/DIA)                   */}
      {/* ========================================================================= */}
      {viewMode === 'history' && (
        <div className="bg-white border border-ink/10 rounded-2xl p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-ink/10 pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-indigo-deep">Histórico de Vendas Locais</h3>
              <p className="text-xs text-ink/60">Todas as transações emitidas no balcão de caixa, guardadas localmente.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleOpenSettings('recibo')}
                className="py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5"
                title="Configurar Recibo, IVA, NUIT da Loja e Dados do Titular"
              >
                <Settings className="w-3.5 h-3.5 text-indigo-600" />
                <span>Configurar Faturação & Titular</span>
              </button>
              <span className="text-xs font-mono font-bold bg-sand-2 px-2.5 py-1 rounded-lg text-ink">
                {salesList.length} vendas registradas
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-ink/10 bg-sand-2/30 text-ink/60 uppercase font-bold text-[10px]">
                  <th className="p-2.5">Fatura/Recibo</th>
                  <th className="p-2.5">Data & Hora</th>
                  <th className="p-2.5">Cliente</th>
                  <th className="p-2.5">Operador</th>
                  <th className="p-2.5">Método</th>
                  <th className="p-2.5">Itens</th>
                  <th className="p-2.5 text-right">Total (MT)</th>
                  <th className="p-2.5 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/10">
                {salesList.map((sale, idx) => (
                  <tr key={`history-sale-${sale.id}-${idx}`} className="hover:bg-sand-2/15 transition-colors">
                    <td className="p-2.5 font-mono font-bold text-indigo-deep">
                      {sale.invoiceNumber}
                    </td>
                    <td className="p-2.5 text-ink/60">
                      {sale.date} {sale.time}
                    </td>
                    <td className="p-2.5 font-medium">
                      {sale.customerName || 'Cliente Balcão'}
                    </td>
                    <td className="p-2.5 text-ink/60">
                      {sale.operatorName}
                    </td>
                    <td className="p-2.5">
                      <span className="bg-sand-2 text-ink/80 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="p-2.5 text-ink/60">
                      {sale.itemCount} un
                    </td>
                    <td className="p-2.5 text-right font-serif font-bold text-indigo-deep">
                      {sale.totalMT.toLocaleString()} MT
                    </td>
                    <td className="p-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setLastSale(sale);
                          setShowReceiptModal(true);
                        }}
                        className="py-1 px-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-deep font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1 mx-auto"
                        title="Reimprimir ou ver recibo"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Recibo</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: SYNC QUEUE & AUDIT LOGS (FILA DE SINCRONIZAÇÃO E AUDITORIA)         */}
      {/* ========================================================================= */}
      {viewMode === 'sync_queue' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left: Sync Queue */}
          <div className="bg-white border border-ink/10 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="font-serif font-bold text-sm text-indigo-deep flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-indigo-brand" />
                <span>Fila de Sincronização Local</span>
              </h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenSettings('loja_titular')}
                  className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                  title="Configurar Identificação da Loja, Titular e Terminal"
                >
                  <Settings className="w-3 h-3 text-amber-600" />
                  <span>Configurações da Loja</span>
                </button>
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="py-1 px-2.5 bg-indigo-deep text-paper font-bold text-[11px] rounded-lg cursor-pointer"
                >
                  Sincronizar
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {syncQueue.length === 0 ? (
                <div className="p-6 text-center text-ink/40 text-xs">Fila de sincronização vazia.</div>
              ) : (
                syncQueue.map((item, idx) => (
                  <div key={`sync-item-${item.id}-${idx}`} className="p-2.5 bg-sand-2/20 border border-ink/10 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-indigo-deep">{item.entityType.toUpperCase()} #{item.entityId.slice(-6)}</div>
                      <div className="text-[10px] text-ink/50">{new Date(item.localTimestamp).toLocaleString('pt-PT')}</div>
                      <div className="text-[9px] font-mono text-ink/40 mt-0.5">Checksum: {item.checksum}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.status === 'synced' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.status === 'synced' ? '✓ Sincronizado' : '⏳ Pendente Offline'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Audit Trail */}
          <div className="bg-white border border-ink/10 rounded-2xl p-4 space-y-3 shadow-xs">
            <div className="border-b border-ink/10 pb-2">
              <h4 className="font-serif font-bold text-sm text-indigo-deep flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Registo de Auditoria de Caixa (Audit Log)</span>
              </h4>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto">
              {auditLogs.length === 0 ? (
                <div className="p-6 text-center text-ink/40 text-xs">Nenhum evento crítico registrado.</div>
              ) : (
                auditLogs.map((log, idx) => (
                  <div key={`audit-log-${log.id}-${idx}`} className="p-2.5 bg-sand-2/15 border border-ink/10 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-deep uppercase text-[10px]">{log.actionType}</span>
                      <span className="text-[10px] text-ink/40">{new Date(log.timestamp).toLocaleTimeString('pt-PT')}</span>
                    </div>
                    <p className="text-xs text-ink/80">{log.details}</p>
                    <div className="text-[10px] text-ink/50 flex items-center justify-between pt-0.5 border-t border-ink/5">
                      <span>Operador: {log.operatorName}</span>
                      {log.amountMT && <span className="font-bold text-indigo-deep">{log.amountMT.toLocaleString()} MT</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      </div> {/* Close MAIN BODY WRAPPER */}

      {/* ========================================================================= */}
      {/* MODAL: CHECKOUT & INSTANT CHANGE (TROCO) CALCULATOR                       */}
      {/* ========================================================================= */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-ink/15 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-indigo-deep flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Finalizar Pagamento & Emitir Recibo</span>
                </h3>
                <p className="text-xs text-ink/60">Selecione o método e calcule o troco em tempo real.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-1.5 text-ink/50 hover:text-ink hover:bg-sand-2 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total to Pay Banner */}
            <div className="bg-indigo-deep text-paper p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div>
                <span className="text-[10px] uppercase font-bold text-sand tracking-widest block">Total a Cobrar</span>
                <span className="text-2xl font-serif font-black">{totalToPayMT.toLocaleString()} MT</span>
              </div>
              <span className="text-xs font-mono bg-white/10 px-2.5 py-1 rounded-lg">
                {cart.reduce((acc, i) => acc + i.quantity, 0)} Artigos
              </span>
            </div>

            {/* Payment & Accounts Settings Link */}
            <div className="flex items-center justify-between bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-2 text-xs">
              <span className="text-[11px] text-amber-950 font-medium flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>Titular & Contas: <strong>{currentEst.ownerName || currentEst.name}</strong></span>
              </span>
              <button
                type="button"
                onClick={() => handleOpenSettings('pagamentos')}
                className="text-[10px] font-bold text-amber-800 hover:text-amber-950 bg-white hover:bg-amber-100/60 border border-amber-300 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                title="Alterar número de M-Pesa, e-Mola, contas bancárias e dados de titular"
              >
                <Settings className="w-3 h-3 text-amber-600" />
                <span>⚙️ Alterar Contas & Titular</span>
              </button>
            </div>

            {/* Payment Method Selector Pills */}
            <div className="grid grid-cols-3 gap-2">
              {(['Dinheiro', 'M-Pesa', 'e-Mola', 'POS Cartão (TPA)', 'Transferência BCI/BIM', 'Pagamento Misto'] as POSPaymentMethod[]).map((method, mIdx) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={`pay-method-${method}-${mIdx}`}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(method);
                      if (method !== 'Dinheiro') {
                        setAmountReceivedInput(totalToPayMT.toString());
                      }
                    }}
                    className={`py-2 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center border ${
                      isSelected
                        ? 'bg-indigo-deep text-paper border-indigo-deep shadow-xs'
                        : 'bg-sand-2/30 hover:bg-sand-2 text-ink/80 border-ink/10'
                    }`}
                  >
                    {method}
                  </button>
                );
              })}
            </div>

            {/* Cash Payment Drawer with Banknotes & Troco Calculator */}
            {paymentMethod === 'Dinheiro' && (
              <div className="bg-sand-2/20 border border-ink/10 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-ink/70">
                  <span>Valor Entregue pelo Cliente (MT):</span>
                  <button
                    type="button"
                    onClick={() => setAmountReceivedInput(totalToPayMT.toString())}
                    className="text-indigo-brand hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    = Valor Exato ({totalToPayMT.toLocaleString()} MT)
                  </button>
                </div>

                <input
                  type="number"
                  step="any"
                  placeholder="0.00"
                  value={amountReceivedInput}
                  onChange={(e) => setAmountReceivedInput(e.target.value)}
                  className="w-full p-3 bg-white border-2 border-indigo-brand/50 rounded-xl font-mono font-bold text-xl text-indigo-deep outline-none focus:border-indigo-brand text-right"
                  autoFocus
                />

                {/* Mozambican Banknote Quick Buttons */}
                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {quickBanknotes.map((note, nIdx) => (
                    <button
                      key={`note-${note}-${nIdx}`}
                      type="button"
                      onClick={() => setAmountReceivedInput(note.toString())}
                      className="py-1.5 bg-white hover:bg-amber-50 text-indigo-deep border border-ink/15 hover:border-amber-400 rounded-lg text-xs font-bold shadow-2xs cursor-pointer transition-all"
                    >
                      {note} MT
                    </button>
                  ))}
                </div>

                {/* Instant Change / Troco Card */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  amountReceivedMT >= totalToPayMT
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-amber-50 border-amber-300 text-amber-950'
                }`}>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider block">
                      {amountReceivedMT >= totalToPayMT ? 'Troco a Entregar:' : 'Falta Pagar:'}
                    </span>
                    <span className="text-xl font-serif font-black">
                      {amountReceivedMT >= totalToPayMT ? `${changeMT.toLocaleString()} MT` : `${remainingToPayMT.toLocaleString()} MT`}
                    </span>
                  </div>
                  {amountReceivedMT >= totalToPayMT && (
                    <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      ✓ Troco Calculado
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* M-Pesa / e-Mola Manual Verification Flow (POS Balcão) */}
            {(paymentMethod === 'M-Pesa' || paymentMethod === 'e-Mola') && (
              <div className="space-y-3 text-xs">
                {/* Store Receiving Wallet Card */}
                <div className={`p-3 rounded-2xl border ${
                  paymentMethod === 'M-Pesa' 
                    ? 'bg-rose-50/70 border-rose-200 text-rose-950' 
                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1.5 text-xs">
                      <Smartphone className={`w-4 h-4 ${paymentMethod === 'M-Pesa' ? 'text-rose-600' : 'text-amber-600'}`} />
                      <span>{paymentMethod === 'M-Pesa' ? 'Vodacom M-Pesa (Moçambique)' : 'Movitel e-Mola (Moçambique)'}</span>
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      paymentMethod === 'M-Pesa' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}>
                      Balcão de Caixa
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/80 p-2.5 rounded-xl border border-ink/10">
                    <div>
                      <span className="text-[10px] text-ink/60 font-semibold block">Conta / Agente da Loja:</span>
                      <span className="font-mono font-bold text-ink">
                        {paymentMethod === 'M-Pesa' 
                          ? (currentEst.mpesaNumber || currentEst.contactPhone || '+258 84 920 1820')
                          : (currentEst.emolaNumber || currentEst.contactPhone || '+258 86 319 4022')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/60 font-semibold block">Titular da Loja / Carteira:</span>
                      <span className="font-bold text-indigo-deep truncate block">
                        {paymentMethod === 'M-Pesa'
                          ? (currentEst.mpesaHolder || currentEst.ownerName || currentEst.name)
                          : (currentEst.emolaHolder || currentEst.ownerName || currentEst.name)}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-ink/10 flex items-center justify-between">
                      <span className="text-ink/70 font-semibold">Valor Exato a Transferir:</span>
                      <span className="font-serif font-black text-sm text-indigo-deep">{totalToPayMT.toLocaleString()} MT</span>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Operator Instructions */}
                <div className="bg-sand-2/30 border border-ink/10 rounded-2xl p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[10px] text-ink/70 uppercase tracking-wider flex items-center gap-1">
                      <Info className="w-3 h-3 text-indigo-brand" />
                      <span>Procedimento Operacional de Balcão</span>
                    </span>
                  </div>
                  <ol className="list-decimal list-inside text-[11px] text-ink/70 space-y-1">
                    <li>O cliente transfere <strong className="text-ink">{totalToPayMT.toLocaleString()} MT</strong> para a conta da loja indicada acima.</li>
                    <li>O cliente apresenta o SMS com o <strong>Código de Transação</strong>.</li>
                    <li>O operador introduz o código e clica em <strong>Validar Código</strong> para conferência.</li>
                  </ol>
                </div>

                {/* Validation Form Fields */}
                <div className="bg-white border border-ink/15 rounded-2xl p-3.5 space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-ink/70 mb-1">
                        Telemóvel do Cliente ({paymentMethod}):
                      </label>
                      <input
                        type="text"
                        placeholder="ex: +258 84 123 4567"
                        value={mpesaPhone || customerPhone}
                        onChange={(e) => {
                          setMpesaPhone(e.target.value);
                          setMobileValidationStatus('pendente');
                        }}
                        className="w-full p-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-bold outline-none focus:border-indigo-brand focus:bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-ink/70 mb-1">
                        Nome / Titular Remetente (Opcional):
                      </label>
                      <input
                        type="text"
                        placeholder="ex: Simão Cossa"
                        value={mobileCustomerName || customerName}
                        onChange={(e) => setMobileCustomerName(e.target.value)}
                        className="w-full p-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-bold outline-none focus:border-indigo-brand focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-ink/70 mb-1">
                      Código de Confirmação SMS da Transação <span className="text-rose-600">*</span>:
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={paymentMethod === 'M-Pesa' ? 'ex: MP260819.0912.A891' : 'ex: EM89213819'}
                        value={paymentRefCode}
                        onChange={(e) => {
                          setPaymentRefCode(e.target.value);
                          setMobileValidationStatus('pendente');
                          setMobileValidationError('');
                        }}
                        className="flex-1 p-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-indigo-brand focus:bg-white tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={handleValidateMobilePayment}
                        className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Validar Código</span>
                      </button>
                    </div>
                  </div>

                  {/* Validation Status Badges */}
                  {mobileValidationStatus === 'validado' && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl space-y-0.5 animate-fadeIn">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-800">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Código Validado com Sucesso no Caixa!</span>
                      </div>
                      <div className="text-[10px] text-emerald-900/80 font-mono">
                        Conferido por {currentOperator} às {mobileValidationTimestamp || 'Agora'} | Ref: {paymentRefCode.toUpperCase()}
                      </div>
                    </div>
                  )}

                  {mobileValidationStatus === 'erro' && mobileValidationError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-950 rounded-xl flex items-center gap-2 animate-fadeIn text-xs font-bold">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{mobileValidationError}</span>
                    </div>
                  )}

                  {mobileValidationStatus === 'pendente' && !paymentRefCode && (
                    <div className="text-[10px] text-amber-800 bg-amber-50/70 border border-amber-200 p-2 rounded-xl flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Aguardando introdução do código SMS do cliente para validação manual.</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Transferência Bancária Flow (POS Balcão) */}
            {paymentMethod === 'Transferência BCI/BIM' && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-2xl border bg-blue-50/70 border-blue-200 text-blue-950">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold flex items-center gap-1.5 text-xs text-blue-950">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <span>{currentEst.bankName || 'Millennium BIM (Moçambique)'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenSettings('pagamentos')}
                      className="text-[10px] font-bold text-blue-800 bg-white hover:bg-blue-100 border border-blue-300 px-2 py-0.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
                    >
                      <Settings className="w-3 h-3 text-blue-600" />
                      <span>Alterar Conta</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/90 p-2.5 rounded-xl border border-blue-200/60">
                    <div>
                      <span className="text-[10px] text-ink/60 font-semibold block">Nº de Conta Bancária:</span>
                      <span className="font-mono font-bold text-indigo-deep text-xs">
                        {currentEst.bankAccount || '00012398471'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-ink/60 font-semibold block">Titular da Conta / Loja:</span>
                      <span className="font-bold text-ink truncate block">
                        {currentEst.bankHolder || currentEst.ownerName || currentEst.name}
                      </span>
                    </div>
                    {currentEst.bankNib && (
                      <div className="col-span-2">
                        <span className="text-[10px] text-ink/60 font-semibold block">NIB (Transferência Interbancária):</span>
                        <span className="font-mono font-bold text-indigo-deep">{currentEst.bankNib}</span>
                      </div>
                    )}
                    <div className="col-span-2 pt-1 border-t border-ink/10 flex items-center justify-between">
                      <span className="text-ink/70 font-semibold">Valor Exato a Transferir:</span>
                      <span className="font-serif font-black text-sm text-indigo-deep">{totalToPayMT.toLocaleString()} MT</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-ink/15 rounded-2xl p-3 space-y-2">
                  <label className="block text-[10px] font-bold text-ink/70 mb-1">
                    Número do Comprovativo / Referência Bancária (Opcional):
                  </label>
                  <input
                    type="text"
                    placeholder="ex: TRF-BIM-9821820"
                    value={paymentRefCode}
                    onChange={(e) => setPaymentRefCode(e.target.value)}
                    className="w-full p-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-mono font-bold uppercase outline-none focus:border-indigo-brand focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Confirm Sale Button */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="py-3 px-4 bg-sand-2 hover:bg-sand-1 text-ink font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Voltar
              </button>

              <button
                type="button"
                onClick={() => {
                  if ((paymentMethod === 'M-Pesa' || paymentMethod === 'e-Mola') && mobileValidationStatus !== 'validado') {
                    if (!paymentRefCode.trim() || paymentRefCode.trim().length < 5) {
                      setMobileValidationError('Por favor introduza o código SMS da transação antes de emitir o recibo.');
                      setMobileValidationStatus('erro');
                      return;
                    }
                    handleValidateMobilePayment();
                  }
                  handleFinalizeSale();
                }}
                className={`flex-1 py-3 px-5 text-white font-serif font-bold text-sm rounded-xl transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2 ${
                  (paymentMethod === 'M-Pesa' || paymentMethod === 'e-Mola') && mobileValidationStatus !== 'validado'
                    ? 'bg-indigo-deep hover:bg-indigo-900'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {(paymentMethod === 'M-Pesa' || paymentMethod === 'e-Mola') && mobileValidationStatus !== 'validado'
                    ? 'Validar & Emitir Recibo'
                    : 'Confirmar & Emitir Recibo'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: AUTHENTIC THERMAL RECEIPT PREVIEW (58mm / 80mm)                   */}
      {/* ========================================================================= */}
      {showReceiptModal && lastSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-ink/20 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
            {/* Action Bar */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <span className="font-bold text-xs text-indigo-deep">Recibo Térmico de Caixa</span>
              <button
                type="button"
                onClick={() => setShowReceiptModal(false)}
                className="p-1 text-ink/50 hover:text-ink rounded cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Authentic Thermal Paper Body */}
            <div id="thermal-receipt" className="bg-[#FFFFF8] border border-dashed border-ink/30 p-4 rounded-xl font-mono text-[11px] text-slate-900 space-y-2 shadow-inner">
              {/* Header */}
              <div className="text-center space-y-0.5 border-b border-dashed border-ink/20 pb-2">
                <div className="font-bold text-xs uppercase tracking-wider">{currentEst.name}</div>
                {currentEst.ownerName && <div className="text-[10px] text-ink/70">Titular: {currentEst.ownerName}</div>}
                <div className="text-[10px] text-ink/70">{currentEst.address || currentEst.city || 'Moçambique'}</div>
                <div className="text-[10px] text-ink/70">Tel: {currentEst.contactPhone || '+258 84 000 0000'}</div>
                <div className="text-[10px] text-ink/70">NUIT da Empresa: {currentEst.nuit || '400987123'}</div>
              </div>

              {/* Document Meta */}
              <div className="text-[10px] border-b border-dashed border-ink/20 py-1.5 space-y-0.5">
                <div className="flex justify-between font-bold">
                  <span>FATURA / RECIBO:</span>
                  <span>{lastSale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Data & Hora:</span>
                  <span>{lastSale.date} {lastSale.time}</span>
                </div>
                <div className="flex justify-between">
                  <span>Operador:</span>
                  <span>{lastSale.operatorName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span>{lastSale.customerName || 'Consumidor Final'}</span>
                </div>
                {lastSale.customerNuit && (
                  <div className="flex justify-between">
                    <span>NUIT Cliente:</span>
                    <span>{lastSale.customerNuit}</span>
                  </div>
                )}
                {lastSale.tableNumber && (
                  <div className="flex justify-between font-bold text-indigo-deep">
                    <span>Mesa / Comanda:</span>
                    <span>{lastSale.tableNumber}</span>
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="border-b border-dashed border-ink/20 py-2 space-y-1">
                <div className="flex justify-between font-bold text-[10px] border-b border-ink/10 pb-0.5">
                  <span>DESCRIÇÃO</span>
                  <span>TOTAL (MT)</span>
                </div>
                {lastSale.items.map((item, idx) => (
                  <div key={`rcpt-item-${item.id}-${idx}`} className="flex justify-between text-[10px]">
                    <span className="truncate max-w-[170px]">{item.quantity}x {item.name}</span>
                    <span>{item.subtotalMT.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-b border-dashed border-ink/20 py-1.5 space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal:</span>
                  <span>{lastSale.subtotalMT.toLocaleString()} MT</span>
                </div>
                {lastSale.discountMT > 0 && (
                  <div className="flex justify-between text-[10px] text-amber-800">
                    <span>Desconto:</span>
                    <span>-{lastSale.discountMT.toLocaleString()} MT</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px]">
                  <span>IVA 16% Incluído:</span>
                  <span>{lastSale.vatMT.toFixed(2)} MT</span>
                </div>
                <div className="flex justify-between font-bold text-xs pt-1 border-t border-ink/10">
                  <span>TOTAL PAGO:</span>
                  <span>{lastSale.totalMT.toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Forma de Pagamento:</span>
                  <span className="font-bold">{lastSale.paymentMethod}</span>
                </div>
                {lastSale.paymentMethod === 'Dinheiro' && (
                  <>
                    <div className="flex justify-between text-[10px]">
                      <span>Valor Entregue:</span>
                      <span>{lastSale.amountReceivedMT.toLocaleString()} MT</span>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-emerald-800">
                      <span>Troco:</span>
                      <span>{lastSale.changeMT.toLocaleString()} MT</span>
                    </div>
                  </>
                )}
                {lastSale.mobilePaymentDetails && (
                  <div className="mt-1.5 pt-1.5 border-t border-dashed border-ink/20 space-y-0.5 text-[9px] bg-sand-2/40 p-2 rounded-lg">
                    <div className="font-bold text-indigo-deep flex items-center justify-between">
                      <span>VALIDAÇÃO CARTEIRA MÓVEL:</span>
                      <span className="text-emerald-800">VALIDADO CAIXA</span>
                    </div>
                    <div className="flex justify-between">
                      <span>CÓDIGO SMS/REF:</span>
                      <span className="font-mono font-bold select-all">{lastSale.mobilePaymentDetails.transactionCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>REMETENTE:</span>
                      <span className="font-mono">{lastSale.mobilePaymentDetails.customerPhone}</span>
                    </div>
                    {lastSale.mobilePaymentDetails.senderName && (
                      <div className="flex justify-between">
                        <span>TITULAR:</span>
                        <span>{lastSale.mobilePaymentDetails.senderName}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>CONTA LOJA:</span>
                      <span>{lastSale.mobilePaymentDetails.merchantAccount}</span>
                    </div>
                    <div className="flex justify-between text-ink/60 text-[8px] pt-0.5 border-t border-ink/10">
                      <span>OPERADOR:</span>
                      <span>{lastSale.mobilePaymentDetails.verifiedByOperator || lastSale.operatorName} ({lastSale.mobilePaymentDetails.verifiedAt || lastSale.time})</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Digital Signature */}
              <div className="text-center pt-2 space-y-1 text-[9px] text-ink/60">
                <div>Documento processado por computador</div>
                <div className="font-mono text-[8px] bg-sand-2/50 py-0.5 px-1 rounded truncate select-all">
                  {lastSale.signatureChecksum}
                </div>
                <div className="text-emerald-800 font-bold">
                  {currentEst.receiptFooterMsg || 'Obrigado pela preferência! Volte sempre ao nosso balcão.'}
                </div>
              </div>
            </div>

            {/* Receipt Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Recibo</span>
              </button>

              <a
                href={`https://wa.me/${(lastSale.customerPhone || '').replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${lastSale.customerName || ''}! Segue o seu recibo de ${establishment.name}: Fatura #${lastSale.invoiceNumber} no valor de ${lastSale.totalMT.toLocaleString()} MT. Obrigado!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-decoration-none"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowReceiptModal(false);
                setLastSale(null);
              }}
              className="w-full py-2 bg-sand-2 hover:bg-sand-1 text-ink font-bold text-xs rounded-xl cursor-pointer"
            >
              Nova Venda (Limpar)
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CUSTOM ITEM / SERVICE ENTRY (ARTIGO AVULSO)                        */}
      {/* ========================================================================= */}
      {showCustomItemModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-ink/20 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <h4 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2">
                  <Plus className="w-4 h-4 text-terracotta" />
                  <span>Adicionar Artigo / Serviço Avulso</span>
                </h4>
                <p className="text-[11px] text-ink/60">
                  Registe produtos ou serviços pontuais não cadastrados no catálogo.
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => {
                  setShowCustomItemModal(false);
                  setCustomItemError('');
                }} 
                className="p-1.5 text-ink/50 hover:text-ink hover:bg-sand-2 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Touch Mozambican Counter Presets */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block">
                Atalhos Rápidos de Balcão (Toque 1x):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-sand-2/30 rounded-xl border border-ink/10">
                {[
                  { name: 'Saco Plástico / Embalagem', price: 10, cat: 'Embalagem' },
                  { name: 'Gelo Saco 5Kg', price: 100, cat: 'Artigo Avulso' },
                  { name: 'Taxa de Entrega Local', price: 150, cat: 'Transporte / Entrega' },
                  { name: 'Mão de Obra / Serviço', price: 200, cat: 'Serviço / Mão de Obra' },
                  { name: 'Artigo Geral Balcão', price: 50, cat: 'Artigo Avulso' },
                  { name: 'Recarga Telemóvel', price: 100, cat: 'Serviço / Avulso' },
                  { name: 'Garrafa de Água Mineral', price: 40, cat: 'Bebida' }
                ].map((preset, idx) => (
                  <button
                    key={`custom-preset-${idx}`}
                    type="button"
                    onClick={() => {
                      setCustomItemName(preset.name);
                      setCustomItemPriceStr(preset.price.toString());
                      setCustomItemCategory(preset.cat);
                      setCustomItemError('');
                    }}
                    className="py-1 px-2 bg-white hover:bg-amber-50 hover:border-amber-400 text-indigo-deep border border-ink/15 rounded-lg text-[11px] font-bold transition-all cursor-pointer shadow-2xs shrink-0 flex items-center gap-1"
                  >
                    <span>{preset.name}</span>
                    <span className="text-amber-800 font-mono">({preset.price} MT)</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selector Chips */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-ink/60 uppercase tracking-wider block">
                Categoria da Linha:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar">
                {['Artigo Avulso', 'Serviço / Mão de Obra', 'Embalagem', 'Bebida', 'Transporte / Entrega'].map((cat, cIdx) => (
                  <button
                    key={`custom-cat-${cat}-${cIdx}`}
                    type="button"
                    onClick={() => setCustomItemCategory(cat)}
                    className={`py-1 px-2.5 rounded-lg text-[11px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      customItemCategory === cat
                        ? 'bg-indigo-deep text-white shadow-2xs'
                        : 'bg-sand-2/50 text-ink/70 hover:bg-sand-2 border border-ink/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Form Inputs */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink/80 mb-1">
                  Nome do Artigo / Descrição <span className="text-rose-600">*</span>:
                </label>
                <input
                  type="text"
                  placeholder="ex: Taxa de Entrega Especial, Embalagem Térmica..."
                  value={customItemName}
                  onChange={(e) => {
                    setCustomItemName(e.target.value);
                    if (customItemError) setCustomItemError('');
                  }}
                  className="w-full p-2.5 bg-sand-2/30 border border-ink/20 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand focus:bg-white transition-colors"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Unit Price */}
                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    Preço Unitário (MT) <span className="text-rose-600">*</span>:
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0"
                    value={customItemPriceStr}
                    onChange={(e) => {
                      setCustomItemPriceStr(e.target.value);
                      if (customItemError) setCustomItemError('');
                    }}
                    className="w-full p-2.5 bg-sand-2/30 border border-ink/20 rounded-xl text-xs font-mono font-bold text-ink outline-none focus:border-indigo-brand focus:bg-white text-right"
                  />
                  {/* Fast Price Adjusters */}
                  <div className="flex items-center gap-1 pt-1.5 flex-wrap">
                    {[10, 50, 100, 200, 500].map((inc, iIdx) => (
                      <button
                        key={`price-add-${inc}-${iIdx}`}
                        type="button"
                        onClick={() => {
                          const current = parseFloat(customItemPriceStr) || 0;
                          setCustomItemPriceStr((current + inc).toString());
                        }}
                        className="py-0.5 px-1.5 bg-sand-2/70 hover:bg-sand-2 text-ink text-[10px] font-mono font-bold rounded cursor-pointer border border-ink/10"
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quantity */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-ink/80 text-xs">
                      Quantidade <span className="text-rose-600">*</span>:
                    </label>
                    <span className="text-[11px] font-mono font-bold text-indigo-brand">
                      {customItemQty} {customItemQty === 1 ? 'unidade' : 'unidades'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomItemQty((prev) => Math.max(1, prev - 1))}
                      className="w-10 h-10 rounded-xl bg-sand-2 hover:bg-sand-1 active:scale-95 text-indigo-deep font-bold text-sm flex items-center justify-center cursor-pointer border border-ink/15 shadow-2xs transition-all"
                      title="Diminuir quantidade (-1)"
                    >
                      <Minus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={customItemQty}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        setCustomItemQty(digitsOnly === '' ? 1 : Math.max(1, parseInt(digitsOnly, 10)));
                      }}
                      className="w-20 h-10 bg-white border-2 border-indigo-brand/40 focus:border-indigo-brand text-indigo-deep text-base font-black font-mono text-center rounded-xl outline-none shadow-xs transition-colors"
                      title="Quantidade (digite ou use os botões - e +)"
                    />
                    <button
                      type="button"
                      onClick={() => setCustomItemQty((prev) => prev + 1)}
                      className="w-10 h-10 rounded-xl bg-sand-2 hover:bg-sand-1 active:scale-95 text-indigo-deep font-bold text-sm flex items-center justify-center cursor-pointer border border-ink/15 shadow-2xs transition-all"
                      title="Aumentar quantidade (+1)"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                  {/* Fast Multiplier Chips */}
                  <div className="flex items-center gap-1.5 pt-1.5">
                    {[1, 2, 3, 5, 10].map((qty, qIdx) => (
                      <button
                        key={`quick-qty-${qty}-${qIdx}`}
                        type="button"
                        onClick={() => setCustomItemQty(qty)}
                        className={`py-0.5 px-2 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-all border ${
                          customItemQty === qty
                            ? 'bg-indigo-deep text-white border-indigo-deep shadow-2xs'
                            : 'bg-sand-2/60 hover:bg-sand-2 text-ink/70 border-ink/10'
                        }`}
                      >
                        {qty}x
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Subtotal Preview */}
              <div className="p-2.5 bg-sand-2/30 border border-ink/10 rounded-xl flex items-center justify-between text-xs">
                <span className="text-ink/70 font-semibold">Total desta Linha:</span>
                <span className="font-serif font-black text-sm text-indigo-deep">
                  {((parseFloat(customItemPriceStr) || 0) * customItemQty).toLocaleString()} MT
                </span>
              </div>

              {/* Error Message */}
              {customItemError && (
                <div className="p-2.5 bg-rose-50 border border-rose-300 text-rose-950 rounded-xl flex items-center gap-2 text-xs font-bold animate-fadeIn">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{customItemError}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2 border-t border-ink/10">
              <button
                type="button"
                onClick={() => {
                  setShowCustomItemModal(false);
                  setCustomItemError('');
                }}
                className="py-2.5 px-4 bg-sand-2 hover:bg-sand-1 text-ink font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={() => {
                  const trimmedName = customItemName.trim();
                  const price = parseFloat(customItemPriceStr);

                  if (!trimmedName) {
                    setCustomItemError('Por favor introduza o nome ou descrição do artigo avulso.');
                    return;
                  }
                  if (isNaN(price) || price <= 0) {
                    setCustomItemError('Por favor introduza um preço unitário válido maior que 0 MT.');
                    return;
                  }

                  const customItem: POSSaleItem = {
                    id: `custom-${Date.now()}`,
                    name: trimmedName,
                    unit: 'un',
                    unitPriceMT: price,
                    costPriceMT: price * 0.5,
                    quantity: customItemQty,
                    subtotalMT: price * customItemQty,
                    discountMT: 0,
                    totalMT: price * customItemQty,
                    vatPct: 16,
                    category: customItemCategory
                  };

                  setCart(prev => [...prev, customItem]);
                  setItemAddedToast(`Artigo avulso "${trimmedName}" (${price.toLocaleString()} MT) adicionado ao recibo!`);
                  setShowCustomItemModal(false);
                  setCustomItemName('');
                  setCustomItemPriceStr('100');
                  setCustomItemQty(1);
                  setCustomItemError('');
                }}
                className="flex-1 py-2.5 px-4 bg-indigo-deep hover:bg-indigo-900 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Adicionar ao Recibo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OPERATOR PIN PAD & LOGIN SWITCH                                    */}
      {/* ========================================================================= */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white border border-ink/15 rounded-3xl max-w-xs w-full p-5 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h4 className="font-serif font-bold text-base text-indigo-deep">Autenticação do Atendente</h4>
              <p className="text-xs text-ink/60">Selecione o atendente e insira o PIN de 4 dígitos.</p>
            </div>

            {/* Quick Operator Selection Chips */}
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-ink/60 uppercase">Atendente a Assumir:</label>
              <div className="flex flex-wrap gap-1">
                {availableOperators.map((opName, oIdx) => (
                  <button
                    key={`op-chip-${opName}-${oIdx}`}
                    type="button"
                    onClick={() => setTargetOperatorName(opName)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      (targetOperatorName || currentOperator) === opName
                        ? 'bg-amber-500 text-slate-950 shadow-2xs font-black'
                        : 'bg-sand-2 text-ink/70 hover:bg-sand-1'
                    }`}
                  >
                    {opName}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleOperatorPinSubmit} className="space-y-3">
              <input
                type="password"
                maxLength={4}
                placeholder="• • • •"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full p-3 text-center bg-sand-2/40 border-2 border-indigo-brand/40 rounded-xl font-mono text-2xl font-bold tracking-widest outline-none focus:border-indigo-brand"
                autoFocus
              />

              {pinError && (
                <p className="text-xs font-bold text-rose-600">PIN incorreto. (PIN Padrão: 1234)</p>
              )}

              {/* Quick Pinpad helper */}
              <div className="grid grid-cols-3 gap-1.5 pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', 'OK'].map((keyVal, kIdx) => (
                  <button
                    key={`pin-key-${keyVal}-${kIdx}`}
                    type="button"
                    onClick={() => {
                      if (keyVal === 'C') setPinInput('');
                      else if (keyVal === 'OK') {
                        if (verifyPOSOperatorPIN(establishment.id, pinInput)) {
                          setCurrentOperator(targetOperatorName || 'Operador de Caixa');
                          setShowPinModal(false);
                          setPinInput('');
                        } else setPinError(true);
                      } else {
                        if (pinInput.length < 4) setPinInput(prev => prev + keyVal);
                      }
                    }}
                    className="py-2.5 bg-sand-2/40 hover:bg-sand-2 text-indigo-deep font-bold text-sm rounded-xl cursor-pointer"
                  >
                    {keyVal}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="w-full py-2 bg-slate-100 text-ink/70 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: OPEN SHIFT (ABERTURA DE CAIXA)                                     */}
      {/* ========================================================================= */}
      {showOpenShiftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white border border-ink/15 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2">
                <Unlock className="w-4 h-4 text-emerald-600" />
                <span>Abertura de Turno de Caixa</span>
              </h4>
              <button onClick={() => setShowOpenShiftModal(false)} className="p-1 text-ink/50 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleOpenShift} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Operador Responsável:</label>
                <input
                  type="text"
                  value={currentOperator}
                  readOnly
                  className="w-full p-2.5 bg-sand-2/40 border border-ink/10 rounded-xl font-bold text-ink"
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Fundo de Maneio / Troco Inicial (MT):</label>
                <input
                  type="number"
                  step="any"
                  value={openShiftFloat}
                  onChange={(e) => setOpenShiftFloat(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-ink/15 rounded-xl font-mono font-bold text-base text-indigo-deep outline-none focus:border-indigo-brand"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Notas / Observações:</label>
                <input
                  type="text"
                  placeholder="ex: Turno da manhã, trocos em moedas e notas de 100 MT"
                  value={openShiftNotes}
                  onChange={(e) => setOpenShiftNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink/15 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpenShiftModal(false)}
                  className="py-2.5 px-4 bg-sand-2 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-serif font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirmar Abertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CLOSE SHIFT (FECHO DE CAIXA)                                       */}
      {/* ========================================================================= */}
      {showCloseShiftModal && currentShift && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white border border-ink/15 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-2">
                <Lock className="w-4 h-4 text-rose-600" />
                <span>Fecho de Turno & Conferência Cega</span>
              </h4>
              <button onClick={() => setShowCloseShiftModal(false)} className="p-1 text-ink/50 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3 text-xs">
              <div className="bg-sand-2/20 p-3 rounded-xl border border-ink/10 space-y-1">
                <div className="flex justify-between">
                  <span className="text-ink/60">Fundo Inicial:</span>
                  <span className="font-mono font-bold">{currentShift.openingBalanceMT.toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">Vendas em Dinheiro:</span>
                  <span className="font-mono font-bold text-emerald-700">+{currentShift.totalSalesCashMT.toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink/60">Vendas Eletrónicas (M-Pesa/Cartão):</span>
                  <span className="font-mono font-bold">{(currentShift.totalSalesMT - currentShift.totalSalesCashMT).toLocaleString()} MT</span>
                </div>
                <div className="flex justify-between border-t border-ink/10 pt-1 font-bold text-indigo-deep">
                  <span>Dinheiro Físico Esperado:</span>
                  <span className="font-mono text-sm">
                    {(currentShift.openingBalanceMT + currentShift.totalSalesCashMT + currentShift.totalDepositsMT - currentShift.totalWithdrawalsMT).toLocaleString()} MT
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Contagem Física em Gaveta (Valor Contado em MT):</label>
                <input
                  type="number"
                  step="any"
                  value={closeCountedCash}
                  onChange={(e) => setCloseCountedCash(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border-2 border-indigo-brand/50 rounded-xl font-mono font-bold text-lg text-indigo-deep outline-none focus:border-indigo-brand text-right"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Observações do Fecho:</label>
                <input
                  type="text"
                  placeholder="ex: Caixa conferido sem quebras"
                  value={closeShiftNotes}
                  onChange={(e) => setCloseShiftNotes(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink/15 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCloseShiftModal(false)}
                  className="py-2.5 px-4 bg-sand-2 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-serif font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirmar & Emitir Fecho (Relatório Z)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CASH MOVEMENT (SANGRIA / SUPRIMENTO)                               */}
      {/* ========================================================================= */}
      {showCashMovementModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white border border-ink/15 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-ink/10 pb-2">
              <h4 className="font-serif font-bold text-base text-indigo-deep">
                {movementType === 'sangria' ? 'Sangria (Retirada de Dinheiro)' : 'Suprimento (Reforço de Caixa)'}
              </h4>
              <button onClick={() => setShowCashMovementModal(false)} className="p-1 text-ink/50 hover:text-ink">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCashMovement} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Valor do Movimento (MT):</label>
                <input
                  type="number"
                  step="any"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                  className="w-full p-2.5 bg-white border border-ink/15 rounded-xl font-mono font-bold text-lg text-indigo-deep outline-none focus:border-indigo-brand"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Motivo / Justificação:</label>
                <input
                  type="text"
                  placeholder={movementType === 'sangria' ? 'ex: Pagamento de fardo de pão / Transferência cofre' : 'ex: Reforço de trocos de 50 e 100 MT'}
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  required
                  className="w-full p-2.5 bg-white border border-ink/15 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCashMovementModal(false)}
                  className="py-2.5 px-4 bg-sand-2 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-indigo-deep text-paper font-bold text-xs rounded-xl shadow-xs"
                >
                  Registar Movimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: POS SETTINGS (TITULAR, CONTAS, CLIENTE & RECIBO)                   */}
      {/* ========================================================================= */}
      <POSSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        establishment={currentEst}
        onSave={handleSaveEstablishment}
        initialTab={settingsInitialTab}
      />
    </div>
  );
}
