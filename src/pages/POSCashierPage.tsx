import React, { useState, useMemo } from 'react';
import { Establishment, InventoryItem, FinancialTransaction, UserProfile } from '../types/types';
import { POSCashierManager } from '../components/managers/POSCashierManager';
import { 
  Receipt, ArrowLeft, Store, Boxes, UtensilsCrossed, Building2, 
  Wrench, ShieldCheck, Wifi, WifiOff, RefreshCw, Sparkles, CheckCircle2 
} from 'lucide-react';
import { loadInventoryItems, saveInventoryItems, loadFinancialTransactions, saveFinancialTransactions } from '../data/data';
import { DEFAULT_CATALOGS_BY_CATEGORY, ensureEstablishmentCatalog } from '../data/establishmentCatalog';
import { getOfflineSyncStatus, toggleForcedOfflineMode } from '../services/offlineSync';
import { canManageEstablishment } from '../services/ownership';

interface POSCashierPageProps {
  establishments: Establishment[];
  currentUser: UserProfile | null;
  setActivePage: (page: any) => void;
  onSelectEstablishment?: (est: Establishment) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export default function POSCashierPage({
  establishments,
  currentUser,
  setActivePage,
  onSelectEstablishment,
  canGoBack,
  onGoBack,
  onGoHome
}: POSCashierPageProps) {
  // Filter stores accessible to the current user
  const accessibleEstablishments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'cliente' || currentUser.role === 'entregador') return [];
    if (currentUser.role === 'admin') return establishments;
    return establishments.filter(e => canManageEstablishment(currentUser, e, establishments));
  }, [currentUser, establishments]);

  // Select active establishment to operate in POS
  const [selectedEstId, setSelectedEstId] = useState<string>(() => {
    if (currentUser?.establishmentId) return currentUser.establishmentId;
    return accessibleEstablishments[0]?.id || establishments[0]?.id || 's1';
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => loadInventoryItems());
  const [financialTxs, setFinancialTxs] = useState<FinancialTransaction[]>(() => loadFinancialTransactions());
  const [syncStatus, setSyncStatus] = useState(() => getOfflineSyncStatus());

  // Find active establishment object
  const activeEstablishment = useMemo(() => {
    const found = accessibleEstablishments.find(e => e.id === selectedEstId);
    if (found) return ensureEstablishmentCatalog(found);
    return accessibleEstablishments[0] ? ensureEstablishmentCatalog(accessibleEstablishments[0]) : null;
  }, [accessibleEstablishments, selectedEstId]);

  // Ensure current store has complete inventory items
  const storeInventory = useMemo(() => {
    if (!activeEstablishment) return [];
    const matches = inventoryItems.filter(i => 
      i.establishmentId === activeEstablishment.id || 
      i.establishmentId === activeEstablishment.name
    );

    if (matches.length > 0) return matches;

    // Fallback: Generate full realistic set for this establishment
    const catalog = activeEstablishment.productsCatalog && activeEstablishment.productsCatalog.length > 0
      ? activeEstablishment.productsCatalog
      : (DEFAULT_CATALOGS_BY_CATEGORY[activeEstablishment.category] || DEFAULT_CATALOGS_BY_CATEGORY['supermercado'] || []);

    const generated: InventoryItem[] = catalog.map((p, idx) => ({
      id: p.id || `inv-${activeEstablishment.id}-${idx}`,
      establishmentId: activeEstablishment.id,
      name: p.name,
      category: p.category || 'Geral',
      costPriceMT: p.promoPriceMT || p.priceMT,
      sellingPriceMT: p.priceMT,
      quantityInStock: 0,
      minStockThreshold: 5,
      unit: p.unitLabel || 'Unidade',
      barcode: `6009${activeEstablishment.id.replace(/\D/g, '') || '88'}${idx.toString().padStart(4, '0')}`,
      sku: `SKU-${(activeEstablishment.category || 'ART').substring(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
      supplier: activeEstablishment.name,
      imageUrl: p.imageUrl,
      isTopSeller: false,
      salesCount: 0
    }));

    return generated;
  }, [inventoryItems, activeEstablishment]);

  const handleUpdateStoreInventory: (updater: (prev: InventoryItem[]) => InventoryItem[]) => void = (updater) => {
    setInventoryItems(prevAll => {
      const nextStoreItems = typeof updater === 'function' ? updater(storeInventory) : updater;
      const otherStores = prevAll.filter(i => 
        i.establishmentId !== activeEstablishment?.id && 
        i.establishmentId !== activeEstablishment?.name
      );
      const merged = [...otherStores, ...nextStoreItems];
      saveInventoryItems(merged);
      return merged;
    });
  };

  const handleUpdateFinancialTxs: (updater: (prev: FinancialTransaction[]) => FinancialTransaction[]) => void = (updater) => {
    setFinancialTxs(prevAll => {
      const nextTxs = typeof updater === 'function' ? updater(prevAll) : updater;
      saveFinancialTransactions(nextTxs);
      return nextTxs;
    });
  };

  if (currentUser?.role === 'cliente' || currentUser?.role === 'entregador' || accessibleEstablishments.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center bg-slate-900 text-white">
        <div className="max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
            <Receipt className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-white">Balcão de Caixa POS Restrito</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O perfil de <strong>{currentUser?.role === 'cliente' ? 'Cliente' : (currentUser?.role === 'entregador' ? 'Estafeta' : 'Utilizador')}</strong> destina-se a compras e consultas na plataforma.
              Os terminais de caixa, emissão de faturas e controlo financeiro são reservados exclusivamente aos administradores e operadores de cada estabelecimento.
            </p>
          </div>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => setActivePage('lojas')}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Explorar Vitrines & Lojas
            </button>
            <button
              onClick={() => onGoHome ? onGoHome() : setActivePage('home')}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl border border-slate-600 transition-all cursor-pointer"
            >
              Página Inicial
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!activeEstablishment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-8 text-center bg-slate-900 text-white">
        <div className="max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-sm">
          <Receipt className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-white">A Carregar Balcão de Caixa POS...</h3>
          <p className="text-xs text-slate-400 mt-1">A carregar terminal offline-first de ponto de venda.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      
      {/* Top Bar for POS Cashier */}
      <div className="bg-slate-950 border-b border-slate-800 text-white py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => onGoBack ? onGoBack() : setActivePage('dashboard')}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700 shadow-xs"
              title="Voltar ao Painel Geral"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  POS Offline-First
                </span>
                <span className="text-xs text-slate-400">Terminal de Ponto de Venda</span>
              </div>
              <h1 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 mt-0.5">
                <span>{activeEstablishment.name}</span>
                <span className="text-xs text-amber-400 font-normal">
                  ({activeEstablishment.category.toUpperCase()})
                </span>
              </h1>
            </div>
          </div>

          {/* Quick Store Selector for Managers with Multiple Establishments */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {accessibleEstablishments.length > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-400 font-medium">Trocar Loja:</span>
                <select
                  value={selectedEstId}
                  onChange={(e) => setSelectedEstId(e.target.value)}
                  className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
                >
                  {accessibleEstablishments.map((est, eIdx) => (
                    <option key={`pos-est-opt-${est.id}-${eIdx}`} value={est.id} className="bg-slate-900 text-white">
                      {est.name} ({est.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Offline Simulation Toggle */}
            <button
              onClick={() => {
                toggleForcedOfflineMode();
                setSyncStatus(getOfflineSyncStatus());
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                syncStatus.isForcedOffline
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
              title="Alternar simulação de internet para testar resiliência offline"
            >
              {syncStatus.isForcedOffline ? (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                  <span>Modo Offline Ativo</span>
                </>
              ) : (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rede Online</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main POS Cashier Manager Component - Fullscreen Edge-to-Edge Single Screen */}
      <POSCashierManager
        establishment={activeEstablishment}
        inventoryItems={storeInventory}
        setInventoryItems={handleUpdateStoreInventory}
        activeOperator={currentUser?.displayName || currentUser?.name || 'Operador Responsável'}
        storeRole={currentUser?.role === 'admin' ? 'administrador' : 'vendedor'}
        financialTxs={financialTxs}
        setFinancialTxs={handleUpdateFinancialTxs}
        isStandaloneFullscreen={true}
        onClose={() => setActivePage('dashboard')}
      />

    </div>
  );
}
