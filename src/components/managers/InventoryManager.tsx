import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, Establishment, StockMovementRecord, FinancialTransaction, UserProfile } from '../../types/types';
import { saveInventoryItems, loadInventoryItems, saveStockMovements, saveFinancialTransactions, markInventoryItemDeleted, deleteInventoryItem } from '../../data/data';
import { notify, confirmDialog } from '../../services/dialogs';
import { uploadFileToStorage as uploadToImgBB } from '../../services/supabase';
import { 
  Boxes, Package, Search, Plus, Trash2, Edit3, ArrowDownCircle, 
  ArrowUpCircle, History, BarChart2, DollarSign, TrendingUp, AlertTriangle, 
  CheckCircle2, ShoppingCart, Receipt, Calculator, Banknote, RefreshCw, 
  Maximize2, Minimize2, FileSpreadsheet, Printer, Tag, Sparkles, Filter, 
  Layers, ChevronRight, X, User, Phone, Check, ArrowRight, ArrowLeft, ShieldCheck, 
  Clock, PlusCircle, MinusCircle, Barcode, HelpCircle, Store, Save
} from 'lucide-react';

function getProductFallbackImage(name: string = '', category: string = ''): string {
  const cat = (category || '').toLowerCase();
  const n = (name || '').toLowerCase();
  if (cat.includes('bebida') || n.includes('cerveja') || n.includes('refrigerante') || n.includes('whisky') || n.includes('sumo') || n.includes('vinho')) {
    return 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&q=80&w=400';
  }
  if (cat.includes('constru') || n.includes('cimento') || n.includes('chapa') || n.includes('tubo') || n.includes('bloco')) {
    return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400';
  }
  if (cat.includes('auto') || cat.includes('peça') || n.includes('oleo') || n.includes('filtro') || n.includes('pneu') || n.includes('bateria')) {
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400';
  }
  if (cat.includes('vestu') || cat.includes('roupa') || cat.includes('capulana') || cat.includes('calçado')) {
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&q=80&w=400';
  }
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
}

interface InventoryManagerProps {
  establishment: Establishment;
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  movements?: StockMovementRecord[];
  setMovements?: React.Dispatch<React.SetStateAction<StockMovementRecord[]>>;
  activeOperator?: string;
  financialTxs?: FinancialTransaction[];
  setFinancialTxs?: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
  onSyncToVitrine?: (item: InventoryItem) => void;
  currentUser?: UserProfile | null;
  storeRole?: 'administrador' | 'vendedor';
  onClose?: () => void;
  onOpenPos?: () => void;
}

export default function InventoryManager({
  establishment,
  inventoryItems,
  setInventoryItems,
  movements = [],
  setMovements = () => {},
  activeOperator = 'Operador Balcão',
  financialTxs = [],
  setFinancialTxs,
  onSyncToVitrine,
  currentUser,
  storeRole = 'administrador',
  onClose,
  onOpenPos
}: InventoryManagerProps) {
  
  // Navigation Tabs: Gestão de Stock e Inventário
  const [activeTab, setActiveTab] = useState<'artigos' | 'entrada_compra' | 'saida_ajuste' | 'movimentos' | 'rentabilidade'>('artigos');
  
  // Fullscreen state for dedicated POS terminal workstations
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Excel Fast Spreadsheet Editing Mode
  const [isExcelMode, setIsExcelMode] = useState(true);

  // Quick Row Insertion Form in Excel Mode
  const [quickName, setQuickName] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickCost, setQuickCost] = useState<number | ''>('');
  const [quickSelling, setQuickSelling] = useState<number | ''>('');
  const [quickQty, setQuickQty] = useState<number | ''>('');
  const [quickMin, setQuickMin] = useState<number | ''>(5);
  const [quickUnit, setQuickUnit] = useState('Unidade');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [stockStatusFilter, setStockStatusFilter] = useState<'todos' | 'ok' | 'baixo' | 'esgotado'>('todos');

  // =========================================================================
  // 1. CRUD FORM MODAL (CRIAR / EDITAR ARTIGO)
  // =========================================================================
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Geral');
  const [formCostPrice, setFormCostPrice] = useState<number | ''>(0);
  const [formSellingPrice, setFormSellingPrice] = useState<number | ''>(0);
  const [formQty, setFormQty] = useState<number | ''>(10);
  const [formMinThreshold, setFormMinThreshold] = useState<number | ''>(5);
  const [formUnit, setFormUnit] = useState('Unidade');
  const [formBarcode, setFormBarcode] = useState('');
  const [formSku, setFormSku] = useState('');
  const [formSupplier, setFormSupplier] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formIsTopSeller, setFormIsTopSeller] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [logInitialStockToFinances, setLogInitialStockToFinances] = useState(true);

  // =========================================================================
  // 2. ENTRADA DE COMPRAS / REPOSIÇÃO DE STOCK (STATE)
  // =========================================================================
  const [entrySelectedItemId, setEntrySelectedItemId] = useState<string>('new');
  const [entryItemName, setEntryItemName] = useState('');
  const [entryCategory, setEntryCategory] = useState('Geral');
  const [entryUnit, setEntryUnit] = useState('Unidade');
  const [entryQty, setEntryQty] = useState<number>(10);
  const [entryUnitCost, setEntryUnitCost] = useState<number>(100);
  const [entrySuggestedPrice, setEntrySuggestedPrice] = useState<number>(150);
  const [entrySupplier, setEntrySupplier] = useState('');
  const [entryInvoiceNumber, setEntryInvoiceNumber] = useState('');
  const [entryNotes, setEntryNotes] = useState('');
  const [entryPayMethod, setEntryPayMethod] = useState<'Dinheiro' | 'Transferência BCI/BIM' | 'M-Pesa' | 'Conta Corrente a Prazo'>('Dinheiro');

  // =========================================================================
  // 3. SAÍDAS, QUEBRAS E AJUSTES DE STOCK (STATE)
  // =========================================================================
  const [adjustSelectedItemId, setAdjustSelectedItemId] = useState<string>('');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustReason, setAdjustReason] = useState<'quebra_avaria' | 'consumo_interno' | 'ajuste_inventario' | 'devolucao_fornecedor'>('quebra_avaria');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Handle ESC key for closing modals or fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showItemModal) setShowItemModal(false);
        else if (isFullscreen) setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showItemModal, isFullscreen]);

  // Dynamic Categories based on current inventory and category presets
  const categoriesList = useMemo(() => {
    const catStr = (establishment.category || '').toLowerCase();
    const isConstrucao = catStr.includes('constru') || catStr.includes('estaleiro');
    const isBar = catStr.includes('bar') || catStr.includes('restaurante');
    const isSuper = catStr.includes('supermercado');
    const isHosp = catStr.includes('hospedagem') || catStr.includes('hotel');
    const isAuto = catStr.includes('peca') || catStr.includes('peça') || catStr.includes('auto');

    const basePresets = isConstrucao ? [
      'Cimento & Cal', 'Chapas & Varão de Aço', 'Agregados (Areia/Brita)', 'Blocos & Artefactos', 'Ferragens & Ferramentas', 'Tintas & Impermeabilização', 'Tubos PVC & Canalização'
    ] : isBar ? [
      'Cervejas', 'Cocktails', 'Petiscos', 'Destilados', 'Refrigerantes', 'Vinhos', 'Alimentação'
    ] : isSuper ? [
      'Mercearia & Fardos', 'Bebidas & Sumos', 'Carnes & Peixe', 'Frescos & Hortaliças', 'Higiene & Limpeza', 'Padaria'
    ] : isHosp ? [
      'Diárias & Suites', 'Amenities & Artigos de Quarto', 'Rouparia & Linhos', 'Limpeza & Higiene', 'Restaurante / Minibar'
    ] : isAuto ? [
      'Óleos & Lubrificantes', 'Baterias 12V', 'Travões & Discos', 'Pneus & Jantes', 'Filtros & Motor', 'Acessórios & Iluminação'
    ] : [
      'Calçado & Sapatos', 'Vestuário & Moda', 'Capulanas & Tecidos', 'Fatos & Moda Masculina', 'Meias & Lotes a Grosso', 'Eletrónicos', 'Acessórios & Gravatas', 'Casa & Utilidades'
    ];

    const existingCats = inventoryItems.map(i => i.category).filter(Boolean);
    const catalogCats = (establishment.productsCatalog || []).map(p => p.category).filter(Boolean);
    const combined = Array.from(new Set([...basePresets, ...existingCats, ...catalogCats])).filter(c => Boolean(c) && c !== 'Todas');
    return ['Todas', ...combined];
  }, [establishment, inventoryItems]);

  // Units list
  const unitsList = useMemo(() => {
    const catStr = (establishment.category || '').toLowerCase();
    if (catStr.includes('constru') || catStr.includes('estaleiro')) {
      return ['Saco (50kg)', 'Metro Cúbico (m³)', 'Carrada (10m³)', 'Vara (6m)', 'Chapa', 'Centena (100 un)', 'Unidade', 'Rolo', 'Lata (20L)', 'Quilograma (kg)', 'Tonelada (ton)'];
    }
    if (catStr.includes('bar') || catStr.includes('restaurante')) {
      return ['Garrafa', 'Caixa (24 un)', 'Copo', 'Dose (5cl)', 'Porção', 'Barril', 'Lata', 'Unidade'];
    }
    if (catStr.includes('supermercado')) {
      return ['Unidade', 'Fardo (12 un)', 'Caixa (24 un)', 'Saco (25kg)', 'Quilograma (kg)', 'Pacote', 'Lata', 'Garrafa'];
    }
    return ['Unidade', 'Par', 'Caixa', 'Peça', 'Lote', 'Conjunto', 'Fato Completo', 'Fardo (50 un)', 'Metro'];
  }, [establishment]);

  // Filtered inventory for table
  const filteredItems = useMemo(() => {
    return inventoryItems.filter(item => {
      const matchesCat = selectedCategory === 'Todas' || item.category === selectedCategory;
      const matchesSearch = !searchQuery || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.barcode && item.barcode.includes(searchQuery)) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = stockStatusFilter === 'todos' ||
        (stockStatusFilter === 'ok' && item.quantityInStock > item.minStockThreshold) ||
        (stockStatusFilter === 'baixo' && item.quantityInStock > 0 && item.quantityInStock <= item.minStockThreshold) ||
        (stockStatusFilter === 'esgotado' && item.quantityInStock <= 0);

      return matchesCat && matchesSearch && matchesStatus;
    });
  }, [inventoryItems, selectedCategory, searchQuery, stockStatusFilter]);

  // Financial KPI calculations
  const totalCostValueMT = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => acc + (curr.quantityInStock * curr.costPriceMT), 0);
  }, [inventoryItems]);

  const totalStockValueMT = useMemo(() => {
    return inventoryItems.reduce((acc, curr) => acc + (curr.quantityInStock * curr.sellingPriceMT), 0);
  }, [inventoryItems]);

  const totalPotentialProfitMT = totalStockValueMT - totalCostValueMT;
  const globalAverageMarginPct = totalCostValueMT > 0 ? Math.round((totalPotentialProfitMT / totalCostValueMT) * 100) : 0;
  const lowStockCount = inventoryItems.filter(i => i.quantityInStock > 0 && i.quantityInStock <= i.minStockThreshold).length;
  const outOfStockCount = inventoryItems.filter(i => i.quantityInStock <= 0).length;

  // =========================================================================
  // CRUD ACTIONS: CREATE / EDIT / DELETE INVENTORY ITEM
  // =========================================================================
  const handleOpenCreateModal = () => {
    setEditingItem(null);
    setFormName('');
    setFormCategory(categoriesList[1] || 'Geral');
    setFormCostPrice(100);
    setFormSellingPrice(150);
    setFormQty(20);
    setFormMinThreshold(5);
    setFormUnit(unitsList[0] || 'Unidade');
    setFormBarcode('');
    setFormSku('');
    setFormSupplier('');
    setFormLocation('');
    setFormImageUrl('');
    setFormIsTopSeller(false);
    setShowItemModal(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormCostPrice(item.costPriceMT);
    setFormSellingPrice(item.sellingPriceMT);
    setFormQty(item.quantityInStock);
    setFormMinThreshold(item.minStockThreshold);
    setFormUnit(item.unit);
    setFormBarcode(item.barcode || '');
    setFormSku(item.sku || '');
    setFormSupplier(item.supplier || '');
    setFormLocation(item.locationRack || '');
    setFormImageUrl(item.imageUrl || '');
    setFormIsTopSeller(!!item.isTopSeller);
    setShowItemModal(true);
  };

  const persistInventory = (updatedStoreItems: InventoryItem[]) => {
    setInventoryItems(updatedStoreItems);
    try {
      const all = loadInventoryItems();
      const others = all.filter(i => 
        i.establishmentId !== establishment.id && 
        i.establishmentId !== establishment.name
      );
      saveInventoryItems([...others, ...updatedStoreItems]);
    } catch (e) {
      console.warn('Erro ao persistir inventário:', e);
    }
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || Number(formSellingPrice) <= 0) {
      notify('Preencha o nome do artigo e um preço de venda válido.', 'error');
      return;
    }

    const cPrice = Number(formCostPrice) || 0;
    const sPrice = Number(formSellingPrice) || 0;
    const qty = Number(formQty) || 0;
    const minThresh = Number(formMinThreshold) || 0;

    if (editingItem) {
      // Update item
      const updated = inventoryItems.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            name: formName.trim(),
            category: formCategory,
            costPriceMT: cPrice,
            sellingPriceMT: sPrice,
            quantityInStock: qty,
            minStockThreshold: minThresh,
            unit: formUnit,
            barcode: formBarcode || undefined,
            sku: formSku || undefined,
            supplier: formSupplier || undefined,
            locationRack: formLocation || undefined,
            imageUrl: formImageUrl || undefined,
            isTopSeller: formIsTopSeller
          };
        }
        return item;
      });

      persistInventory(updated);
      notify(`Artigo "${formName}" atualizado com sucesso!`, 'success');
    } else {
      // Create new item
      const newItem: InventoryItem = {
        id: 'inv-' + Date.now(),
        establishmentId: establishment.id,
        name: formName.trim(),
        category: formCategory,
        costPriceMT: cPrice,
        sellingPriceMT: sPrice,
        quantityInStock: qty,
        minStockThreshold: minThresh,
        unit: formUnit,
        barcode: formBarcode || undefined,
        sku: formSku || undefined,
        supplier: formSupplier || undefined,
        locationRack: formLocation || undefined,
        salesCount: 0,
        isTopSeller: formIsTopSeller,
        imageUrl: formImageUrl || undefined
      };

      const updated = [newItem, ...inventoryItems];
      persistInventory(updated);

      // Financial transaction for initial stock if checked
      if (logInitialStockToFinances && cPrice > 0 && qty > 0 && setFinancialTxs) {
        const totalInvest = cPrice * qty;
        const newFinTx: FinancialTransaction = {
          id: 'tx-init-' + Date.now(),
          establishmentId: establishment.id,
          date: new Date().toISOString().split('T')[0],
          type: 'despesa',
          category: 'Reposição de Stock / Mercadoria',
          description: `Entrada Inicial de Stock: ${qty}x ${formName} (${cPrice} MT/unid)`,
          amountMT: totalInvest,
          paymentMethod: 'Dinheiro',
          status: 'Pago',
          operatorName: activeOperator || 'Operador de Stock'
        };
        const updatedFin = [newFinTx, ...financialTxs];
        setFinancialTxs(updatedFin);
        saveFinancialTransactions(updatedFin);
      }

      notify(`Artigo "${formName}" adicionado ao inventário!`, 'success');
    }

    setShowItemModal(false);
  };

  const handleDeleteItem = async (item: InventoryItem) => {
    const ok = await confirmDialog(`Tem certeza que deseja remover o artigo "${item.name}" do inventário?`, {
      title: 'Eliminar Artigo do Inventário',
      confirmLabel: 'Sim, Eliminar',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    // 1. Permanently register as deleted so it is never re-seeded or resurrected from catalog
    markInventoryItemDeleted(item.id, establishment.id, item.name);

    // 2. Remove from local store inventory state immediately
    const updated = inventoryItems.filter(i => i.id !== item.id);
    setInventoryItems(updated);

    // 3. Remove from global inventory items in localStorage and Supabase
    deleteInventoryItem(item.id, establishment.id, item.name);

    // 4. Remove from establishment catalog in localStorage if present
    try {
      const allEstsRaw = localStorage.getItem('axofacil_establishments');
      if (allEstsRaw) {
        const allEsts: Establishment[] = JSON.parse(allEstsRaw);
        const updatedEsts = allEsts.map(e => {
          if (e.id === establishment.id || e.name === establishment.name) {
            return {
              ...e,
              productsCatalog: (e.productsCatalog || []).filter(p => p.id !== item.id && p.name.toLowerCase().trim() !== item.name.toLowerCase().trim()),
              products: (e.products || []).filter(p => p.id !== item.id && p.name.toLowerCase().trim() !== item.name.toLowerCase().trim())
            };
          }
          return e;
        });
        localStorage.setItem('axofacil_establishments', JSON.stringify(updatedEsts));
      }
    } catch (e) {
      console.warn('Erro ao atualizar catálogo da loja após exclusão:', e);
    }

    notify(`Artigo "${item.name}" removido com sucesso.`, 'success');
  };

  // Fast Inline Cell Update for Excel Mode
  const handleInlineUpdateItem = (itemId: string, field: keyof InventoryItem, value: any) => {
    const updated = inventoryItems.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          [field]: value
        };
      }
      return item;
    });
    persistInventory(updated);
  };

  // Quick Add Row (Excel Spreadsheet style)
  const handleQuickRowAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!quickName.trim()) {
      notify('Digite o nome do produto para adicionar na tabela.', 'warning');
      return;
    }

    const cPrice = quickCost === '' ? 0 : Number(quickCost);
    const sPrice = quickSelling === '' ? cPrice * 1.3 : Number(quickSelling);
    const qty = quickQty === '' ? 0 : Number(quickQty);
    const minThresh = quickMin === '' ? 5 : Number(quickMin);
    const cat = quickCategory.trim() || categoriesList[1] || 'Geral';

    const newItem: InventoryItem = {
      id: 'inv-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      establishmentId: establishment.id,
      name: quickName.trim(),
      category: cat,
      costPriceMT: cPrice,
      sellingPriceMT: sPrice,
      quantityInStock: qty,
      minStockThreshold: minThresh,
      unit: quickUnit || 'Unidade',
      salesCount: 0
    };

    const updated = [newItem, ...inventoryItems];
    persistInventory(updated);

    // If stock is added and cost > 0, log movement
    if (qty > 0) {
      const todayStr = new Date().toISOString().split('T')[0];
      const timeStr = new Date().toTimeString().substring(0, 5);
      const newMov: StockMovementRecord = {
        id: 'mov-quick-' + Date.now(),
        establishmentId: establishment.id,
        inventoryItemId: newItem.id,
        productName: newItem.name,
        type: 'entrada_compra',
        quantity: qty,
        unitCostMT: cPrice,
        unitSellingPriceMT: sPrice,
        totalCostMT: qty * cPrice,
        totalSellingPriceMT: qty * sPrice,
        reasonOrNotes: 'Lançamento Rápido na Tabela Excel de Inventário',
        operatorName: activeOperator || currentUser?.name || 'Operador Balcão',
        date: todayStr,
        time: timeStr
      };
      const updatedMovs = [newMov, ...movements];
      setMovements(updatedMovs);
      saveStockMovements(updatedMovs);
    }

    notify(`Artigo "${newItem.name}" inserido com sucesso na tabela!`, 'success');

    // Reset inputs for next immediate insertion
    setQuickName('');
    setQuickCost('');
    setQuickSelling('');
    setQuickQty('');
  };

  // Image Upload Handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const url = await uploadToImgBB(file);
      if (url) {
        setFormImageUrl(url);
        notify('Imagem carregada com sucesso!', 'success');
      }
    } catch (err) {
      console.error("Erro no upload:", err);
      notify('Falha ao enviar imagem. Verifique a conexão.', 'error');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  // =========================================================================
  // 3. ENTRADA DE COMPRAS / FACTURA DE FORNECEDOR
  // =========================================================================
  const handleExecutePurchaseEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryItemName.trim()) {
      notify('Informe o nome do produto recebido do fornecedor.', 'error');
      return;
    }
    if (entryQty <= 0 || entryUnitCost < 0) {
      notify('Quantidade e custo unitário devem ser válidos.', 'error');
      return;
    }

    const timestamp = new Date();
    const todayStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().substring(0, 5);
    const totalCost = entryQty * entryUnitCost;

    let targetItemId = entrySelectedItemId;

    if (entrySelectedItemId === 'new') {
      // Create new inventory item
      const newItem: InventoryItem = {
        id: 'inv-' + Date.now(),
        establishmentId: establishment.id,
        name: entryItemName.trim(),
        category: entryCategory,
        costPriceMT: Number(entryUnitCost),
        sellingPriceMT: Number(entrySuggestedPrice),
        quantityInStock: Number(entryQty),
        minStockThreshold: 5,
        unit: entryUnit,
        supplier: entrySupplier || undefined,
        salesCount: 0
      };
      targetItemId = newItem.id;
      const updated = [newItem, ...inventoryItems];
      persistInventory(updated);
    } else {
      // Increase existing item stock
      const updated = inventoryItems.map(item => {
        if (item.id === entrySelectedItemId) {
          return {
            ...item,
            quantityInStock: item.quantityInStock + Number(entryQty),
            costPriceMT: Number(entryUnitCost),
            sellingPriceMT: Number(entrySuggestedPrice) > 0 ? Number(entrySuggestedPrice) : item.sellingPriceMT,
            supplier: entrySupplier || item.supplier
          };
        }
        return item;
      });
      persistInventory(updated);
    }

    // Register stock movement
    const newMovement: StockMovementRecord = {
      id: 'mov-entry-' + Date.now(),
      establishmentId: establishment.id,
      inventoryItemId: targetItemId,
      productName: entryItemName.trim(),
      type: 'entrada_compra',
      quantity: Number(entryQty),
      unitCostMT: Number(entryUnitCost),
      unitSellingPriceMT: Number(entrySuggestedPrice),
      totalCostMT: totalCost,
      totalSellingPriceMT: Number(entryQty) * Number(entrySuggestedPrice),
      reasonOrNotes: `Factura/Guia: ${entryInvoiceNumber || 'S/N'} | Fornecedor: ${entrySupplier || 'Geral'} ${entryNotes ? `(${entryNotes})` : ''}`,
      operatorName: activeOperator || 'Operador de Stock',
      date: todayStr,
      time: timeStr
    };
    const updatedMovements = [newMovement, ...movements];
    setMovements(updatedMovements);
    saveStockMovements(updatedMovements);

    // Register Financial Expense
    if (setFinancialTxs && totalCost > 0) {
      const newFinTx: FinancialTransaction = {
        id: 'tx-entry-' + Date.now(),
        establishmentId: establishment.id,
        date: todayStr,
        type: 'despesa',
        category: 'Reposição de Stock / Mercadoria',
        description: `Entrada de Compra (${entryInvoiceNumber ? `Doc ${entryInvoiceNumber}` : 'Directa'}): +${entryQty} ${entryUnit} de "${entryItemName}" (${entrySupplier || 'Fornecedor'})`,
        amountMT: totalCost,
        paymentMethod: entryPayMethod === 'Conta Corrente a Prazo' ? 'Transferência BCI/BIM' : entryPayMethod,
        status: entryPayMethod === 'Conta Corrente a Prazo' ? 'Pendente' : 'Pago',
        operatorName: activeOperator || 'Operador de Stock'
      };
      const updatedFin = [newFinTx, ...financialTxs];
      setFinancialTxs(updatedFin);
      saveFinancialTransactions(updatedFin);
    }

    notify(`✅ Entrada de Compra Registada com Sucesso! +${entryQty} ${entryUnit} de "${entryItemName}". Custo Total: ${totalCost.toLocaleString()} MT`, 'success');

    // Reset Form
    setEntryInvoiceNumber('');
    setEntryQty(10);
    setEntryNotes('');
    if (entrySelectedItemId === 'new') {
      setEntryItemName('');
    }
  };

  // =========================================================================
  // 4. SAÍDAS, QUEBRAS E AJUSTES DE STOCK
  // =========================================================================
  const handleExecuteStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustSelectedItemId || adjustQty <= 0) {
      notify('Selecione um artigo e informe a quantidade.', 'error');
      return;
    }

    const selectedItem = inventoryItems.find(i => i.id === adjustSelectedItemId);
    if (!selectedItem) return;

    const timestamp = new Date();
    const todayStr = timestamp.toISOString().split('T')[0];
    const timeStr = timestamp.toTimeString().substring(0, 5);

    let newStockQty = selectedItem.quantityInStock;
    let movType: StockMovementRecord['type'] = 'quebra_avaria';

    if (adjustReason === 'quebra_avaria' || adjustReason === 'consumo_interno' || adjustReason === 'devolucao_fornecedor') {
      newStockQty = Math.max(0, selectedItem.quantityInStock - adjustQty);
      movType = adjustReason === 'quebra_avaria' ? 'quebra_avaria' : 'saida_venda';
    } else if (adjustReason === 'ajuste_inventario') {
      newStockQty = adjustQty; // Contagem física directa
      movType = 'ajuste_inventario';
    }

    const updated = inventoryItems.map(item => {
      if (item.id === selectedItem.id) {
        return { ...item, quantityInStock: newStockQty };
      }
      return item;
    });
    persistInventory(updated);

    const newMovement: StockMovementRecord = {
      id: 'mov-adj-' + Date.now(),
      establishmentId: establishment.id,
      inventoryItemId: selectedItem.id,
      productName: selectedItem.name,
      type: movType,
      quantity: adjustQty,
      unitCostMT: selectedItem.costPriceMT,
      unitSellingPriceMT: selectedItem.sellingPriceMT,
      totalCostMT: adjustQty * selectedItem.costPriceMT,
      totalSellingPriceMT: adjustQty * selectedItem.sellingPriceMT,
      reasonOrNotes: `Ajuste (${adjustReason.replace(/_/g, ' ')}): ${adjustNotes || 'Operação Manual no Balcão'}`,
      operatorName: activeOperator || 'Operador',
      date: todayStr,
      time: timeStr
    };

    const updatedMovements = [newMovement, ...movements];
    setMovements(updatedMovements);
    saveStockMovements(updatedMovements);

    notify(`✅ Ajuste Registado para "${selectedItem.name}". Novo Stock Disponível: ${newStockQty} ${selectedItem.unit}`, 'success');
    setAdjustNotes('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["ID", "Artigo", "Categoria", "Preço Custo (MT)", "Preço Venda (MT)", "Margem %", "Qtd Stock", "Unidade", "Valor Custo Total (MT)", "Valor Venda Total (MT)", "Código de Barras", "Fornecedor"];
    const rows = inventoryItems.map(item => {
      const margin = item.costPriceMT > 0 ? Math.round(((item.sellingPriceMT - item.costPriceMT) / item.costPriceMT) * 100) : 0;
      const totalCost = item.quantityInStock * item.costPriceMT;
      const totalSale = item.quantityInStock * item.sellingPriceMT;
      return [
        `"${item.id}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        item.costPriceMT,
        item.sellingPriceMT,
        `${margin}%`,
        item.quantityInStock,
        `"${item.unit}"`,
        totalCost,
        totalSale,
        `"${item.barcode || ''}"`,
        `"${item.supplier || ''}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventario_${establishment.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Stock Count Sheet
  const handlePrintSheet = () => {
    window.print();
  };

  const containerClasses = isFullscreen 
    ? "fixed inset-0 z-50 bg-[#F8FAFC] text-[#0F172A] p-4 sm:p-6 overflow-y-auto flex flex-col gap-4 animate-in fade-in duration-150"
    : "space-y-6";

  return (
    <div className={containerClasses} id="inventory-manager-container">
      
      {/* ========================================================================= */}
      {/* 1. TOP HERO / WORKSTATION CONTROL HEADER (CRAFTSMAN STYLE)               */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 text-[#0F172A] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0B254B] flex items-center justify-center text-white font-black shadow-xs shrink-0">
            <Boxes className="w-6 h-6 text-[#F8FAFC]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#061833]">
                Stock & Controlo de Inventário
              </h2>
              <span className="bg-[#0B254B]/10 text-[#0B254B] border border-[#0B254B]/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {establishment.name}
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Gestão de artigos em armazém, reposição de fornecedores, quebras, contagens físicas e valorização patrimonial em Meticais (MT).
            </p>
          </div>
        </div>

        {/* Action Controls & Workstation Buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          {onOpenPos && (
            <button
              type="button"
              onClick={onOpenPos}
              className="py-2 px-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs border border-amber-300 active:scale-95"
              title="Abrir Balcão de Caixa POS para vendas ao público e emissão de talões"
            >
              <Receipt className="w-4 h-4 text-slate-950" />
              <span>Balcão de Caixa POS</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 bg-[#103B75] hover:bg-[#0c2e5c] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all shadow-xs border border-blue-400/30"
              title="Fechar tela de inventário e voltar aos menus anteriores"
            >
              <ArrowLeft className="w-4 h-4 text-blue-200" />
              <span>Voltar aos Menus</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCSV}
            className="py-2 px-3 bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] text-xs font-bold rounded-xl border border-[#E2E8F0] cursor-pointer flex items-center gap-1.5 transition-all shadow-2xs"
            title="Exportar dados para Excel / CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0B254B]" />
            <span className="hidden sm:inline">Exportar</span> Excel
          </button>

          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="py-2 px-3.5 bg-[#0B254B] hover:bg-[#061833] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-[#C78229]" />
            <span>Novo Artigo</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(prev => !prev)}
            className={`py-2 px-3 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-all border ${
              isFullscreen 
                ? 'bg-[#C78229] hover:bg-[#A64821] text-white border-[#C78229]' 
                : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#0F172A] border-[#E2E8F0]'
            }`}
            title={isFullscreen ? "Minimizar (ESC)" : "Modo Ecrã Inteiro / Gestão de Stock"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4" />
                <span>Minimizar</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4" />
                <span>Ecrã Inteiro</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABS NAVIGATION BAR                                                    */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#E2E8F0] no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('artigos')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'artigos'
              ? 'bg-[#0B254B] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
          }`}
        >
          <Package className="w-4 h-4 text-[#C78229]" />
          <span>📋 Tabela de Artigos & Stock ({filteredItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('entrada_compra')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'entrada_compra'
              ? 'bg-[#0B254B] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4 text-emerald-600" />
          <span>📥 Reposição de Stock / Entrada de Fornecedor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('saida_ajuste')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'saida_ajuste'
              ? 'bg-[#0B254B] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4 text-[#A64821]" />
          <span>📤 Saídas, Quebras & Ajuste Físico</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('movimentos')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'movimentos'
              ? 'bg-[#0B254B] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
          }`}
        >
          <History className="w-4 h-4 text-blue-600" />
          <span>📊 Histórico de Movimentos ({movements.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rentabilidade')}
          className={`py-2.5 px-4 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rentabilidade'
              ? 'bg-[#0B254B] text-white shadow-xs'
              : 'bg-[#FFFFFF] text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0]'
          }`}
        >
          <BarChart2 className="w-4 h-4 text-purple-600" />
          <span>💰 Valorização & Margens</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 3. FINANCIAL SUMMARY METRIC STRIP (LIGHT NATURAL CRAFTSMAN THEME)         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-1 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-[#C78229]" />
            <span>Investimento (Custo)</span>
          </div>
          <div className="text-base sm:text-lg font-serif font-black text-[#061833]">
            {totalCostValueMT.toLocaleString()} <span className="text-xs font-sans font-normal text-[#475569]">MT</span>
          </div>
          <p className="text-[10px] text-[#64748B]">Capital em estoque no armazém</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-1 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
            <span>Valor em Venda</span>
          </div>
          <div className="text-base sm:text-lg font-serif font-black text-emerald-800">
            {totalStockValueMT.toLocaleString()} <span className="text-xs font-sans font-normal text-[#475569]">MT</span>
          </div>
          <p className="text-[10px] text-[#64748B]">Receita estimada a preço de venda</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-1 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#0B254B]" />
            <span>Margem Média</span>
          </div>
          <div className="text-base sm:text-lg font-serif font-black text-[#0B254B]">
            +{globalAverageMarginPct}%
          </div>
          <p className="text-[10px] text-[#64748B]">Markup global aplicado</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-1 shadow-xs">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-[#C78229]" />
            <span>Stock Crítico / Baixo</span>
          </div>
          <div className="text-base sm:text-lg font-serif font-black text-[#C78229]">
            {lowStockCount} <span className="text-xs font-sans font-normal text-[#475569]">artigos</span>
          </div>
          <p className="text-[10px] text-[#64748B]">Abaixo do limiar mínimo</p>
        </div>

        <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-3.5 rounded-2xl space-y-1 shadow-xs col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#475569] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[#A64821]" />
            <span>Esgotados</span>
          </div>
          <div className="text-base sm:text-lg font-serif font-black text-[#A64821]">
            {outOfStockCount} <span className="text-xs font-sans font-normal text-[#475569]">artigos</span>
          </div>
          <p className="text-[10px] text-[#64748B]">Necessitam reposição imediata</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TABELA DE ARTIGOS & GESTÃO DO INVENTÁRIO (CRUD COMPLETO)           */}
      {/* ========================================================================= */}
      {activeTab === 'artigos' && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#061833]">
                Catálogo & Gestão de Estoque
              </h3>
              <p className="text-xs text-[#475569]">
                Cadastro completo de artigos, preços de custo e venda, margens de lucro, unidades e controlo de inventário.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setIsExcelMode(false)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  !isExcelMode 
                    ? 'bg-[#0B254B] text-white shadow-xs' 
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#E2E8F0] border border-[#E2E8F0]'
                }`}
              >
                Visualização Normal
              </button>

              <button
                type="button"
                onClick={() => setIsExcelMode(true)}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  isExcelMode 
                    ? 'bg-[#0B254B] text-white shadow-xs' 
                    : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#E2E8F0] border border-[#E2E8F0]'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#C78229]" />
                <span>📊 Modo Tabela Excel (Edição Direta)</span>
              </button>

              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="py-1.5 px-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>+ Novo Artigo Completo</span>
              </button>
            </div>
          </div>

          {/* Quick Row Excel-Style Inserter */}
          {isExcelMode && (
            <form onSubmit={handleQuickRowAdd} className="bg-[#F8FAFC] border-2 border-dashed border-[#0B254B]/40 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#0B254B] flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-[#C78229]" />
                  <span>⚡ Inserção Rápida de Produtos (Linha Excel Direta)</span>
                </span>
                <span className="text-[10px] text-[#64748B]">Preencha e prima Enter ou clique no botão</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-3">
                  <input
                    type="text"
                    placeholder="Nome do Produto / Artigo *"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none focus:border-[#0B254B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={quickCategory}
                    onChange={(e) => setQuickCategory(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                  >
                    <option value="">Categoria...</option>
                    {categoriesList.filter(c => c !== 'Todas').map((c, i) => (
                      <option key={`quickcat-${c}-${i}`} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Custo (MT)"
                    value={quickCost}
                    onChange={(e) => setQuickCost(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none focus:border-[#0B254B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Venda (MT) *"
                    value={quickSelling}
                    onChange={(e) => setQuickSelling(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-[#0B254B] rounded-lg text-xs font-bold text-[#0B254B] outline-none"
                  />
                </div>

                <div className="sm:col-span-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Qtd"
                    value={quickQty}
                    onChange={(e) => setQuickQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-2 py-1.5 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none focus:border-[#0B254B]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    className="w-full py-1.5 px-3 bg-[#0B254B] hover:bg-[#061833] text-white text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C78229]" />
                    <span>+ Lançar (Enter)</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por nome, categoria, código de barras, fornecedor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] placeholder-[#64748B] outline-none focus:border-[#0B254B]"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full py-2 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
              >
                {categoriesList.map((cat, idx) => (
                  <option key={`artcat-${cat}-${idx}`} value={cat}>
                    {cat === 'Todas' ? 'Todas as Categorias' : cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={stockStatusFilter}
                onChange={(e) => setStockStatusFilter(e.target.value as any)}
                className="w-full py-2 px-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
              >
                <option value="todos">Todos os Níveis de Stock</option>
                <option value="ok">Disponível em Stock</option>
                <option value="baixo">Stock Crítico / Poucas Unidades</option>
                <option value="esgotado">Esgotados</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredItems.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl p-10 text-center space-y-2">
              <Package className="w-10 h-10 mx-auto text-[#64748B]" />
              <div className="font-serif font-bold text-sm text-[#0F172A]">Nenhum artigo encontrado</div>
              <p className="text-xs text-[#475569]">Altere os filtros ou clique em "+ Novo Artigo" para cadastrar produtos.</p>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="py-2 px-4 bg-[#0B254B] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
              >
                + Cadastrar Artigo
              </button>
            </div>
          ) : (
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden overflow-x-auto bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#475569] border-b border-[#E2E8F0] font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Artigo & Imagem</th>
                    <th className="p-3">Categoria</th>
                    <th className="p-3 text-right">Custo Unit. (MT)</th>
                    <th className="p-3 text-right">Preço Venda (MT)</th>
                    <th className="p-3 text-center">Margem</th>
                    <th className="p-3 text-center">Qtd Stock</th>
                    <th className="p-3 text-right">Total em Stock</th>
                    <th className="p-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                  {filteredItems.map((item, idx) => {
                    const margin = item.costPriceMT > 0 
                      ? Math.round(((item.sellingPriceMT - item.costPriceMT) / item.costPriceMT) * 100) 
                      : 0;
                    const isOutOfStock = item.quantityInStock <= 0;
                    const isLow = item.quantityInStock > 0 && item.quantityInStock <= item.minStockThreshold;
                    const itemImg = item.imageUrl || getProductFallbackImage(item.name, item.category);

                    return (
                      <tr key={`tbl-item-${item.id}-${idx}`} className="hover:bg-[#F8FAFC]/60 transition-colors">
                        <td className="p-2.5">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={itemImg}
                              alt={item.name}
                              className="w-9 h-9 rounded-lg object-cover border border-[#E2E8F0] shrink-0"
                            />
                            <div className="min-w-0">
                              {isExcelMode ? (
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleInlineUpdateItem(item.id, 'name', e.target.value)}
                                  className="font-bold text-xs text-[#061833] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#0B254B] outline-none w-full"
                                />
                              ) : (
                                <div className="font-bold text-xs text-[#061833]">{item.name}</div>
                              )}
                              <div className="text-[10px] text-[#64748B] font-mono">
                                {item.sku ? `SKU: ${item.sku}` : ''} {item.barcode ? `| ${item.barcode}` : ''}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-2.5">
                          {isExcelMode ? (
                            <select
                              value={item.category}
                              onChange={(e) => handleInlineUpdateItem(item.id, 'category', e.target.value)}
                              className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-[10px] font-bold px-1.5 py-0.5 rounded-md outline-none"
                            >
                              {categoriesList.filter(c => c !== 'Todas').map((c, i) => (
                                <option key={`rowcat-${item.id}-${c}-${i}`} value={c}>{c}</option>
                              ))}
                            </select>
                          ) : (
                            <span className="bg-[#F8FAFC] border border-[#E2E8F0] text-[#475569] text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {item.category}
                            </span>
                          )}
                        </td>

                        {/* Custo Unitário MT */}
                        <td className="p-2.5 text-right font-mono">
                          {isExcelMode ? (
                            <input
                              type="number"
                              min="0"
                              value={item.costPriceMT}
                              onChange={(e) => handleInlineUpdateItem(item.id, 'costPriceMT', Number(e.target.value) || 0)}
                              className="w-20 px-1.5 py-1 text-right bg-white border border-[#E2E8F0] rounded-md text-xs font-bold text-[#475569] outline-none focus:border-[#0B254B]"
                            />
                          ) : (
                            <span className="text-[#475569]">{item.costPriceMT.toLocaleString()} MT</span>
                          )}
                        </td>

                        {/* Preço de Venda MT */}
                        <td className="p-2.5 text-right font-mono font-bold">
                          {isExcelMode ? (
                            <input
                              type="number"
                              min="0"
                              value={item.sellingPriceMT}
                              onChange={(e) => handleInlineUpdateItem(item.id, 'sellingPriceMT', Number(e.target.value) || 0)}
                              className="w-20 px-1.5 py-1 text-right bg-white border border-[#0B254B] rounded-md text-xs font-bold text-[#0B254B] outline-none"
                            />
                          ) : (
                            <span className="text-[#0B254B]">{item.sellingPriceMT.toLocaleString()} MT</span>
                          )}
                        </td>

                        {/* Margem */}
                        <td className="p-2.5 text-center">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            margin >= 30 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            +{margin}%
                          </span>
                        </td>

                        {/* Quantidade em Stock */}
                        <td className="p-2.5 text-center">
                          {isExcelMode ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleInlineUpdateItem(item.id, 'quantityInStock', Math.max(0, item.quantityInStock - 1))}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center cursor-pointer"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="0"
                                value={item.quantityInStock}
                                onChange={(e) => handleInlineUpdateItem(item.id, 'quantityInStock', Math.max(0, Number(e.target.value) || 0))}
                                className={`w-14 px-1 py-1 text-center font-bold text-xs rounded border outline-none ${
                                  isOutOfStock ? 'bg-red-50 text-red-900 border-red-300' : isLow ? 'bg-amber-50 text-amber-900 border-amber-300' : 'bg-white text-slate-900 border-[#E2E8F0]'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineUpdateItem(item.id, 'quantityInStock', item.quantityInStock + 1)}
                                className="w-5 h-5 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              isOutOfStock 
                                ? 'bg-red-100 text-red-800' 
                                : isLow 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {item.quantityInStock} {item.unit || 'un'}
                            </span>
                          )}
                        </td>

                        {/* Valor Total em Stock */}
                        <td className="p-2.5 text-right font-mono font-bold text-[#061833]">
                          {(item.quantityInStock * item.sellingPriceMT).toLocaleString()} MT
                        </td>

                        {/* Ações */}
                        <td className="p-2.5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(item)}
                              className="p-1.5 text-[#475569] hover:text-[#0B254B] hover:bg-[#F8FAFC] rounded-lg cursor-pointer transition-colors"
                              title="Editar Detalhes / Código / Fornecedor"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteItem(item);
                              }}
                              className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                              title="Excluir Artigo do Inventário"
                              aria-label="Excluir Artigo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: ENTRADA DE COMPRAS / FACTURA DE FORNECEDOR                          */}
      {/* ========================================================================= */}
      {activeTab === 'entrada_compra' && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs max-w-4xl mx-auto">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="font-serif font-bold text-lg text-[#061833] flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-700" />
              <span>Lançamento de Compras / Entrada de Mercadoria</span>
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Registe a chegada de novos lotes de produtos, compras de fornecedores e faturas com cálculo automático de custos e despesas.
            </p>
          </div>

          <form onSubmit={handleExecutePurchaseEntry} className="space-y-4">
            
            {/* Escolha entre artigo existente ou novo */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#0F172A]">Tipo de Entrada:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEntrySelectedItemId('new')}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    entrySelectedItemId === 'new' 
                      ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-2xs' 
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                  }`}
                >
                  + Novo Produto Não Cadastrado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (inventoryItems.length > 0) {
                      setEntrySelectedItemId(inventoryItems[0].id);
                      setEntryItemName(inventoryItems[0].name);
                      setEntryCategory(inventoryItems[0].category);
                      setEntryUnit(inventoryItems[0].unit);
                      setEntryUnitCost(inventoryItems[0].costPriceMT);
                      setEntrySuggestedPrice(inventoryItems[0].sellingPriceMT);
                    }
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                    entrySelectedItemId !== 'new' 
                      ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-2xs' 
                      : 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0]'
                  }`}
                >
                  📦 Reposição de Artigo Já Existente ({inventoryItems.length})
                </button>
              </div>
            </div>

            {/* Select existing product if chosen */}
            {entrySelectedItemId !== 'new' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-[#0F172A]">Selecione o Artigo a Repor *</label>
                <select
                  value={entrySelectedItemId}
                  onChange={(e) => {
                    const item = inventoryItems.find(i => i.id === e.target.value);
                    if (item) {
                      setEntrySelectedItemId(item.id);
                      setEntryItemName(item.name);
                      setEntryCategory(item.category);
                      setEntryUnit(item.unit);
                      setEntryUnitCost(item.costPriceMT);
                      setEntrySuggestedPrice(item.sellingPriceMT);
                    }
                  }}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                >
                  {inventoryItems.map((item, idx) => (
                    <option key={`sel-entry-${item.id}-${idx}`} value={item.id}>
                      {item.name} (Stock Atual: {item.quantityInStock} {item.unit} | Custo: {item.costPriceMT} MT)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Item Name and Category if new */}
            {entrySelectedItemId === 'new' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Nome do Produto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Arroz Dona Ana 25kg, Cerveja 2M..."
                    value={entryItemName}
                    onChange={(e) => setEntryItemName(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#0B254B]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Categoria</label>
                  <select
                    value={entryCategory}
                    onChange={(e) => setEntryCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  >
                    {categoriesList.filter(c => c !== 'Todas').map((cat, idx) => (
                      <option key={`entrycat-${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Quantity, Cost and Selling Price */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Qtd Recebida *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={entryQty}
                  onChange={(e) => setEntryQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Unidade</label>
                <select
                  value={entryUnit}
                  onChange={(e) => setEntryUnit(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                >
                  {unitsList.map((u, idx) => (
                    <option key={`unit-entry-${u}-${idx}`} value={u}>{u}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Preço de Custo Unit. (MT) *</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={entryUnitCost}
                  onChange={(e) => setEntryUnitCost(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Preço de Venda Sugerido (MT)</label>
                <input
                  type="number"
                  min="0"
                  value={entrySuggestedPrice}
                  onChange={(e) => setEntrySuggestedPrice(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0B254B] outline-none"
                />
              </div>
            </div>

            {/* Supplier and Invoice Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Fornecedor / Distribuidor</label>
                <input
                  type="text"
                  placeholder="Ex: Delta Distribuição, Socimol..."
                  value={entrySupplier}
                  onChange={(e) => setEntrySupplier(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Nº Factura / Guia de Remessa</label>
                <input
                  type="text"
                  placeholder="Ex: FT-2026/894"
                  value={entryInvoiceNumber}
                  onChange={(e) => setEntryInvoiceNumber(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Pagamento da Factura</label>
                <select
                  value={entryPayMethod}
                  onChange={(e) => setEntryPayMethod(e.target.value as any)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                >
                  <option value="Dinheiro">💵 Dinheiro (Caixa)</option>
                  <option value="Transferência BCI/BIM">🏦 Transferência Bancária</option>
                  <option value="M-Pesa">📱 M-Pesa</option>
                  <option value="Conta Corrente a Prazo">⏳ A Prazo (Conta Corrente)</option>
                </select>
              </div>
            </div>

            {/* Total Cost Box */}
            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex justify-between items-center">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#475569]">Valor Total da Compra:</span>
                <div className="text-[11px] text-[#64748B]">
                  {entryQty} {entryUnit} x {entryUnitCost} MT/unid
                </div>
              </div>
              <div className="font-serif font-black text-2xl text-[#0B254B]">
                {(entryQty * entryUnitCost).toLocaleString()} <span className="text-sm font-sans font-bold">MT</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>Confirmar Entrada de Stock & Registar Despesa</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SAÍDAS, QUEBRAS E AJUSTES DE STOCK                                 */}
      {/* ========================================================================= */}
      {activeTab === 'saida_ajuste' && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 sm:p-6 space-y-5 shadow-xs max-w-3xl mx-auto">
          <div className="border-b border-[#E2E8F0] pb-3">
            <h3 className="font-serif font-bold text-lg text-[#061833] flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-[#A64821]" />
              <span>Saídas, Quebras e Ajustes Físicos de Inventário</span>
            </h3>
            <p className="text-xs text-[#475569] mt-0.5">
              Registe avarias, quebras, consumo interno de equipa, devoluções ou acertos após contagem física em armazém.
            </p>
          </div>

          <form onSubmit={handleExecuteStockAdjustment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Selecione o Artigo *</label>
              <select
                required
                value={adjustSelectedItemId}
                onChange={(e) => setAdjustSelectedItemId(e.target.value)}
                className="w-full p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
              >
                <option value="">-- Escolha um artigo do inventário --</option>
                {inventoryItems.map((item, idx) => (
                  <option key={`adj-item-${item.id}-${idx}`} value={item.id}>
                    {item.name} (Stock Atual: {item.quantityInStock} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">Motivo do Ajuste *</label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value as any)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                >
                  <option value="quebra_avaria">🚨 Quebra / Avaria / Produto Danificado</option>
                  <option value="consumo_interno">☕ Consumo Interno da Equipa / Loja</option>
                  <option value="ajuste_inventario">📋 Acerto de Contagem Física (Balanço)</option>
                  <option value="devolucao_fornecedor">↩️ Devolução ao Fornecedor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  {adjustReason === 'ajuste_inventario' ? 'Novo Valor Real em Armazém *' : 'Quantidade a Subtrair *'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1">Observações / Justificativa</label>
              <textarea
                rows={2}
                placeholder="Ex: Produto partido durante a arrumação na prateleira B2..."
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={!adjustSelectedItemId}
              className="w-full py-3.5 bg-[#A64821] hover:bg-[#863412] disabled:opacity-40 text-white font-bold text-sm rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span>Gravar Movimento de Saída / Ajuste</span>
            </button>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: HISTÓRICO DE MOVIMENTAÇÕES EM TEMPO REAL                            */}
      {/* ========================================================================= */}
      {activeTab === 'movimentos' && (
        <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
          <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-3">
            <div>
              <h3 className="font-serif font-bold text-base text-[#061833]">
                Histórico de Movimentações de Stock
              </h3>
              <p className="text-xs text-[#475569]">
                Registo auditável de todas as vendas PDV, compras, quebras e ajustes de inventário.
              </p>
            </div>
            <span className="text-xs font-bold bg-[#F8FAFC] text-[#0B254B] px-3 py-1 rounded-full border border-[#E2E8F0]">
              {movements.length} movimentos registados
            </span>
          </div>

          {movements.length === 0 ? (
            <div className="bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl p-10 text-center space-y-2">
              <History className="w-8 h-8 mx-auto text-[#64748B]" />
              <div className="font-serif font-bold text-sm text-[#0F172A]">Ainda não há movimentos de stock</div>
              <p className="text-xs text-[#475569]">As vendas no Caixa PDV e entradas de compras aparecerão aqui automaticamente.</p>
            </div>
          ) : (
            <div className="border border-[#E2E8F0] rounded-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] text-[#475569] border-b border-[#E2E8F0] font-bold text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Tipo</th>
                    <th className="p-3">Artigo</th>
                    <th className="p-3 text-center">Qtd</th>
                    <th className="p-3 text-right">Valor Total</th>
                    <th className="p-3">Operador & Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
                  {movements.slice(0, 50).map((mov, idx) => {
                    const isEntry = mov.type === 'entrada_compra';
                    const isSale = mov.type === 'saida_venda';
                    const isBreak = mov.type === 'quebra_avaria';

                    return (
                      <tr key={`mov-row-${mov.id}-${idx}`} className="hover:bg-[#F8FAFC] transition-colors">
                        <td className="p-3 whitespace-nowrap font-mono text-[11px] text-[#475569]">
                          {mov.date} {mov.time}
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isEntry ? 'bg-emerald-100 text-emerald-800' :
                            isSale ? 'bg-blue-100 text-blue-800' :
                            isBreak ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {isEntry && '📥 Entrada Compra'}
                            {isSale && '⚡ Venda PDV'}
                            {isBreak && '🚨 Quebra / Avaria'}
                            {!isEntry && !isSale && !isBreak && '📋 Ajuste Físico'}
                          </span>
                        </td>

                        <td className="p-3 font-bold text-[#061833]">
                          {mov.productName}
                        </td>

                        <td className="p-3 text-center font-bold">
                          <span className={isEntry ? 'text-emerald-700' : 'text-[#A64821]'}>
                            {isEntry ? '+' : '-'}{mov.quantity}
                          </span>
                        </td>

                        <td className="p-3 text-right font-mono font-bold text-[#0B254B]">
                          {(mov.totalSellingPriceMT || mov.totalCostMT || 0).toLocaleString()} MT
                        </td>

                        <td className="p-3 text-[#475569] text-[11px]">
                          <strong>{mov.operatorName || 'Operador'}</strong>: {mov.reasonOrNotes || 'Sem observações'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: RENTABILIDADE & MARGENS                                            */}
      {/* ========================================================================= */}
      {activeTab === 'rentabilidade' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-base text-[#061833] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>Resumo de Rentabilidade do Stock</span>
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#475569]">Valor Total de Custo:</span>
                <span className="font-serif font-bold text-sm text-[#0F172A]">{totalCostValueMT.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#475569]">Valor Estimado em Venda:</span>
                <span className="font-serif font-bold text-sm text-emerald-800">{totalStockValueMT.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                <span className="text-xs font-bold">Lucro Bruto Projetado:</span>
                <span className="font-serif font-bold text-base text-emerald-800">+{totalPotentialProfitMT.toLocaleString()} MT</span>
              </div>
              <div className="flex justify-between p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
                <span className="text-xs font-bold text-[#475569]">Margem Média Geral:</span>
                <span className="font-serif font-bold text-sm text-[#0B254B]">+{globalAverageMarginPct}%</span>
              </div>
            </div>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-5 space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-base text-[#061833] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#C78229]" />
              <span>Artigos Críticos para Reposição</span>
            </h3>

            {lowStockCount === 0 && outOfStockCount === 0 ? (
              <div className="p-6 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl text-center text-xs text-emerald-800 font-bold">
                ✅ Todos os artigos estão com níveis saudáveis de stock!
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {inventoryItems.filter(i => i.quantityInStock <= i.minStockThreshold).map((item, idx) => (
                  <div key={`crit-${item.id}-${idx}`} className="p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-[#0F172A]">{item.name}</div>
                      <div className="text-[10px] text-[#475569]">{item.category} • Fornecedor: {item.supplier || 'Geral'}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.quantityInStock <= 0 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {item.quantityInStock <= 0 ? 'Esgotado' : `${item.quantityInStock} em stock`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR ARTIGO DE INVENTÁRIO                                */}
      {/* ========================================================================= */}
      {showItemModal && (
        <div className="fixed inset-0 bg-[#061833]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-2xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#061833] flex items-center gap-2">
                <Boxes className="w-5 h-5 text-[#C78229]" />
                <span>{editingItem ? 'Editar Artigo de Inventário' : 'Cadastrar Novo Artigo de Stock'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowItemModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs font-semibold">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[#0F172A] mb-1">Nome do Artigo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Saco de Cimento 50kg, Cerveja Laurentina Clara..."
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#0B254B]"
                  />
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Categoria *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  >
                    {categoriesList.filter(c => c !== 'Todas').map((cat, idx) => (
                      <option key={`fcat-${cat}-${idx}`} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Unidade de Medida</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                  >
                    {unitsList.map((u, idx) => (
                      <option key={`funit-${u}-${idx}`} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Preços e Quantidades */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8FAFC] p-3.5 rounded-xl border border-[#E2E8F0]">
                <div>
                  <label className="block text-[#0F172A] mb-1">Preço Custo (MT)</label>
                  <input
                    type="number"
                    min="0"
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Preço Venda (MT) *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formSellingPrice}
                    onChange={(e) => setFormSellingPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0B254B] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Stock Atual</label>
                  <input
                    type="number"
                    min="0"
                    value={formQty}
                    onChange={(e) => setFormQty(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Alerta Mínimo</label>
                  <input
                    type="number"
                    min="1"
                    value={formMinThreshold}
                    onChange={(e) => setFormMinThreshold(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E2E8F0] rounded-lg text-xs font-bold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              {/* Barcode, SKU and Supplier */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#0F172A] mb-1">Código de Barras</label>
                  <input
                    type="text"
                    placeholder="Ex: 560123456789"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Código SKU</label>
                  <input
                    type="text"
                    placeholder="Ex: PRD-001"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#0F172A] mb-1">Fornecedor Habitual</label>
                  <input
                    type="text"
                    placeholder="Ex: Delta, Fornecedor X..."
                    value={formSupplier}
                    onChange={(e) => setFormSupplier(e.target.value)}
                    className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
                  />
                </div>
              </div>

              {/* Image Upload and URL */}
              <div className="space-y-1.5">
                <label className="block text-[#0F172A]">Foto / Imagem do Produto</label>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="URL da imagem (ou envie do ficheiro)..."
                    value={formImageUrl}
                    onChange={(e) => setFormImageUrl(e.target.value)}
                    className="flex-1 p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#0F172A] outline-none"
                  />
                  <label className="py-2.5 px-3 bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] cursor-pointer flex items-center gap-1 shrink-0">
                    <span>{isUploadingImage ? 'Enviando...' : '📁 Carregar Foto'}</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      const itemToDelete = editingItem;
                      setShowItemModal(false);
                      handleDeleteItem(itemToDelete);
                    }}
                    className="py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl cursor-pointer border border-red-200 flex items-center gap-1.5 shrink-0 transition-colors"
                    title="Excluir este artigo permanentemente"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Excluir Artigo</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="flex-1 py-3 bg-[#F8FAFC] text-[#0F172A] font-bold rounded-xl cursor-pointer border border-[#E2E8F0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#0B254B] hover:bg-[#061833] text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Artigo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
