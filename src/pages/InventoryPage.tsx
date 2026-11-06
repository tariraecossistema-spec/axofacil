import React, { useState, useMemo } from 'react';
import { Establishment, InventoryItem, StockMovementRecord, FinancialTransaction, UserProfile } from '../types/types';
import InventoryManager from '../components/managers/InventoryManager';
import { 
  Boxes, Package, Info, Calendar, ArrowRight, Store, 
  ChevronRight, Building2, CheckCircle2, ShieldCheck, HelpCircle, 
  FileSpreadsheet, Sparkles, TrendingUp, AlertTriangle, Clock
} from 'lucide-react';
import { loadInventoryItems, saveInventoryItems, loadStockMovements, saveStockMovements, isInventoryItemDeleted } from '../data/data';
import { DEFAULT_CATALOGS_BY_CATEGORY, ensureEstablishmentCatalog } from '../data/establishmentCatalog';
import { canManageEstablishment } from '../services/ownership';

interface InventoryPageProps {
  establishments: Establishment[];
  currentUser: UserProfile | null;
  setActivePage: (page: any) => void;
  onSelectEstablishment?: (est: Establishment) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export default function InventoryPage({
  establishments,
  currentUser,
  setActivePage,
  onSelectEstablishment,
  canGoBack,
  onGoBack,
  onGoHome
}: InventoryPageProps) {
  // Filter stores accessible to the current user
  const accessibleEstablishments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'cliente' || currentUser.role === 'entregador') return [];
    if (currentUser.role === 'admin') return establishments;
    return establishments.filter(e => canManageEstablishment(currentUser, e, establishments));
  }, [currentUser, establishments]);

  // Select active establishment to manage
  const [selectedEstId, setSelectedEstId] = useState<string>(() => {
    if (currentUser?.establishmentId) return currentUser.establishmentId;
    return accessibleEstablishments[0]?.id || establishments[0]?.id || 's1';
  });

  const [showEducationalGuide, setShowEducationalGuide] = useState<boolean>(true);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => loadInventoryItems());
  const [movements, setMovements] = useState<StockMovementRecord[]>(() => loadStockMovements());
  const [financialTxs, setFinancialTxs] = useState<FinancialTransaction[]>([]);

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
      (i.establishmentId === activeEstablishment.id || i.establishmentId === activeEstablishment.name) &&
      !isInventoryItemDeleted(i.id, activeEstablishment.id, i.name)
    );

    // If we have items in global inventory for this store, use them!
    const hasExistingRecords = inventoryItems.some(i => 
      i.establishmentId === activeEstablishment.id || i.establishmentId === activeEstablishment.name
    );
    if (hasExistingRecords || matches.length > 0) return matches;

    // Fallback: Generate initial set for this establishment if it has never been configured
    const rawCatalog = activeEstablishment.productsCatalog && activeEstablishment.productsCatalog.length > 0
      ? activeEstablishment.productsCatalog
      : (DEFAULT_CATALOGS_BY_CATEGORY[activeEstablishment.category] || DEFAULT_CATALOGS_BY_CATEGORY['supermercado'] || []);

    const catalog = rawCatalog.filter(p => !isInventoryItemDeleted(p.id, activeEstablishment.id, p.name));

    const generated: InventoryItem[] = catalog.map((p, idx) => ({
      id: p.id || `inv-${activeEstablishment.id}-${idx}`,
      establishmentId: activeEstablishment.id,
      name: p.name,
      category: p.category || 'Geral',
      costPriceMT: Math.round((p.promoPriceMT || p.priceMT) * 0.70),
      sellingPriceMT: p.priceMT,
      quantityInStock: 20 + (idx * 4),
      minStockThreshold: 6,
      unit: p.unitLabel || 'Unidade',
      barcode: `6009${activeEstablishment.id.replace(/\D/g, '') || '88'}${idx.toString().padStart(4, '0')}`,
      sku: `SKU-${(activeEstablishment.category || 'ART').substring(0, 3).toUpperCase()}-${(idx + 1).toString().padStart(3, '0')}`,
      supplier: activeEstablishment.name,
      imageUrl: p.imageUrl,
      isTopSeller: idx < 3,
      salesCount: 18 + (idx * 3)
    }));

    return generated;
  }, [inventoryItems, activeEstablishment]);

  const handleUpdateStoreInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>> = (updater) => {
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

  if (currentUser?.role === 'cliente' || currentUser?.role === 'entregador' || accessibleEstablishments.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6 text-center bg-slate-900 text-white">
        <div className="max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-xl space-y-4">
          <div className="w-14 h-14 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mx-auto border border-blue-500/30">
            <Boxes className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-white">Inventário & Armazém Restrito</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O perfil de <strong>{currentUser?.role === 'cliente' ? 'Cliente' : (currentUser?.role === 'entregador' ? 'Estafeta' : 'Utilizador')}</strong> destina-se a realizar compras e pedidos na vitrine pública.
              A auditoria física de stock, contagem de inventário e margens de custo são reservadas aos proprietários e gestores de cada loja.
            </p>
          </div>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => setActivePage('lojas')}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Ver Lojas & Catálogo
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
          <Boxes className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-white">Carregando Módulo de Inventário...</h3>
          <p className="text-xs text-slate-400 mt-1">A carregar artigos de armazém e balanço de stocks.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Banner & Establishment Selector Bar */}
      <div className="bg-[#0B254B] border-b border-blue-950 text-white py-8 px-[6vw]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/25 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <Boxes className="w-4 h-4 text-blue-200" />
                <span>Gestão de Armazém, Stock & Caixa PDV</span>
              </div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
                Inventário & Controlo Físico de Stock
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 max-w-2xl mt-1 leading-relaxed">
                Registo de entradas por fornecedor, conferência física de contagem, cálculo de margens, alertas de ruptura e reconciliação fiscal em Meticais (MT).
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowEducationalGuide(!showEducationalGuide)}
                className="py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-blue-200" />
                <span>{showEducationalGuide ? 'Ocultar Guia Educativo' : 'Para que serve o Inventário?'}</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setActivePage('dashboard')}
                  className="py-2 px-3.5 bg-white text-[#0B254B] hover:bg-slate-100 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Store className="w-4 h-4" />
                  <span>Aceder ao Meu Painel</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Store Switcher Pill Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Estabelecimento:</span>
              <span className="text-white font-bold">{activeEstablishment.name}</span>
            </div>

            {accessibleEstablishments.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                {accessibleEstablishments.slice(0, 8).map((est, idx) => {
                  const isSelected = est.id === selectedEstId;
                  return (
                    <button
                      key={`inv-est-btn-${est.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedEstId(est.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#0B254B] text-white shadow-xs font-black'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
                      }`}
                    >
                      <span>{est.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-black/20 text-white' : 'bg-slate-900 text-slate-400'
                      }`}>
                        {est.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* EDUCATIONAL SECTION: PARA QUE SERVE E QUANDO SE FAZ O INVENTÁRIO */}
      {showEducationalGuide && (
        <div className="px-[6vw] mt-6 max-w-7xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0B254B] flex items-center justify-center font-bold">
                  <Info className="w-4 h-4 text-[#0B254B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Guia Prático: Para que é feito o Inventário e Quando se deve realizar?
                  </h3>
                  <p className="text-xs text-slate-500">
                    Normas de gestão comercial, conformidade fiscal e controlo de perdas para empresas em Moçambique.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowEducationalGuide(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Dispensar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700 leading-relaxed">
              
              {/* Box 1: Para que é feito o Inventário */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#0B254B]">
                  <Boxes className="w-4 h-4 text-[#0B254B]" />
                  <h4>1. Para que serve o Inventário de Stock?</h4>
                </div>
                <ul className="space-y-2 list-disc pl-4 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Conferência Físico vs. Lógico:</strong> Verifica se as quantidades reais nas prateleiras ou armazém coincidem com o sistema informático, detetando quebras, extravios ou furtos.
                  </li>
                  <li>
                    <strong className="text-slate-900">Valorização Patrimonial:</strong> Calcula o valor real dos ativos correntes da empresa (Custo de Aquisição e Preço de Venda em Meticais) para balanço contabilístico e apuramento de lucro.
                  </li>
                  <li>
                    <strong className="text-slate-900">Prevenção de Rupturas:</strong> Identifica atempadamente artigos abaixo do <em>Stock Mínimo</em> para emitir ordens de compra a fornecedores antes que o produto esgote.
                  </li>
                  <li>
                    <strong className="text-slate-900">Gestão de Validades e Quebras:</strong> Permite isolar produtos com prazo de validade próximo ou avarias físicas antes de gerarem prejuízo.
                  </li>
                </ul>
              </div>

              {/* Box 2: Quando se faz o Inventário */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm text-[#15243f]">
                  <Calendar className="w-4 h-4 text-emerald-700" />
                  <h4>2. Quando é que se faz o Inventário?</h4>
                </div>
                <ul className="space-y-2 list-disc pl-4 text-slate-600">
                  <li>
                    <strong className="text-slate-900">Inventário Geral / Anual:</strong> Obrigatoriamente no fecho do ano fiscal (31 de Dezembro) para encerramento de contas, apuramento de resultados e declarações de IVA / IRPC.
                  </li>
                  <li>
                    <strong className="text-slate-900">Inventário Rotativo / Cíclico:</strong> Realizado semanalmente ou mensalmente por famílias de produtos de alto valor (ex: whiskies e carnes no bar; óleos e baterias nas peças auto) sem parar a operação da loja.
                  </li>
                  <li>
                    <strong className="text-slate-900">Inventário Periódico (Trimestral):</strong> A cada 3 meses para reconciliar o armazém com o sistema de vendas (Primavera ERP / PHC).
                  </li>
                  <li>
                    <strong className="text-slate-900">Inventário Extraordinário:</strong> Quando ocorre troca de gerentes/vendedores de balcão, suspeita de desvios ou trespasse de negócio.
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Inventory Manager View */}
      <div className="px-[6vw] mt-6 max-w-7xl mx-auto w-full">
        <InventoryManager
          establishment={activeEstablishment}
          inventoryItems={storeInventory}
          setInventoryItems={handleUpdateStoreInventory}
          movements={movements}
          setMovements={setMovements}
          activeOperator={currentUser?.displayName || currentUser?.name || 'Gestor de Armazém'}
          financialTxs={financialTxs}
          setFinancialTxs={setFinancialTxs}
          currentUser={currentUser}
          storeRole="administrador"
        />
      </div>

    </div>
  );
}
