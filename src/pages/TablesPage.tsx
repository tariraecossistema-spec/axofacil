import React, { useState, useMemo } from 'react';
import { Establishment, BarTable, InventoryItem, FinancialTransaction, UserProfile } from '../types/types';
import TableManager from '../components/managers/TableManager';
import { 
  UtensilsCrossed, Beer, Store, Building2, HelpCircle, 
  Info, Clock, CheckCircle2, DollarSign, Receipt, Sparkles
} from 'lucide-react';
import { loadBarTables, saveBarTables, loadInventoryItems, saveInventoryItems } from '../data/data';
import { DEFAULT_CATALOGS_BY_CATEGORY, ensureEstablishmentCatalog } from '../data/establishmentCatalog';
import { canManageEstablishment } from '../services/ownership';

interface TablesPageProps {
  establishments: Establishment[];
  currentUser: UserProfile | null;
  setActivePage: (page: any) => void;
  onSelectEstablishment?: (est: Establishment) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
}

export default function TablesPage({
  establishments,
  currentUser,
  setActivePage,
  onSelectEstablishment,
  canGoBack,
  onGoBack,
  onGoHome
}: TablesPageProps) {
  // Filter stores accessible to the current user
  const accessibleEstablishments = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'cliente' || currentUser.role === 'entregador') return [];
    if (currentUser.role === 'admin') return establishments;
    return establishments.filter(e => canManageEstablishment(currentUser, e, establishments));
  }, [currentUser, establishments]);

  // Select active hospitality / service establishment
  const [selectedEstId, setSelectedEstId] = useState<string>(() => {
    if (currentUser?.establishmentId) return currentUser.establishmentId;
    const barOrRest = accessibleEstablishments.find(e => e.category === 'bar' || e.category === 'hospedagem');
    return barOrRest?.id || accessibleEstablishments[0]?.id || establishments[0]?.id || 'bar-1';
  });

  const [showGuide, setShowGuide] = useState<boolean>(true);
  const [tables, setTables] = useState<BarTable[]>(() => {
    const loaded = loadBarTables();
    if (loaded && loaded.length > 0) return loaded;
    return [
      {
        id: 'tbl-1',
        establishmentId: 'bar-1',
        tableNumber: 'Mesa 1 (Interior)',
        customerName: 'Mário & Amigos',
        operatorName: 'Mariamo Vendedora',
        status: 'ocupada',
        openedAt: '12:30',
        items: [
          { id: 'ti-1', productName: 'Cerveja 2M 500ml Gelada', unitPriceMT: 120, quantity: 4, addedAt: '12:35', delivered: true },
          { id: 'ti-2', productName: 'Tábua de Mariscos & Camarão Grelhado', unitPriceMT: 1200, quantity: 1, addedAt: '12:40', delivered: true }
        ],
        notes: 'Cliente pediu gelo extra'
      },
      {
        id: 'tbl-2',
        establishmentId: 'bar-1',
        tableNumber: 'Mesa 2 (Esplanada Vista Mar)',
        customerName: 'Dra. Ana Silva',
        operatorName: 'Carlos Gerente',
        status: 'conta_solicitada',
        openedAt: '11:45',
        items: [
          { id: 'ti-3', productName: 'Caipirinha Especial de Lima', unitPriceMT: 250, quantity: 2, addedAt: '11:50', delivered: true },
          { id: 'ti-4', productName: 'Gin Tónico com Zimbro', unitPriceMT: 300, quantity: 1, addedAt: '12:15', delivered: true }
        ],
        notes: 'Pagamento via M-Pesa'
      },
      {
        id: 'tbl-3',
        establishmentId: 'bar-1',
        tableNumber: 'Mesa 3 (Esplanada)',
        customerName: '',
        operatorName: 'Mariamo Vendedora',
        status: 'livre',
        items: []
      },
      {
        id: 'tbl-4',
        establishmentId: 'bar-1',
        tableNumber: 'Mesa 4 (Balcão VIP)',
        customerName: '',
        operatorName: 'Carlos Gerente',
        status: 'livre',
        items: []
      },
      {
        id: 'tbl-5',
        establishmentId: 'bar-1',
        tableNumber: 'Mesa 5 (Lounges Sombra)',
        customerName: 'Família Macuácua',
        operatorName: 'Mariamo Vendedora',
        status: 'ocupada',
        openedAt: '13:00',
        items: [
          { id: 'ti-5', productName: 'Frango Piri-Piri à Zambeziana', unitPriceMT: 650, quantity: 2, addedAt: '13:05', delivered: true },
          { id: 'ti-6', productName: 'Sumo Natural de Maracujá 1L', unitPriceMT: 200, quantity: 1, addedAt: '13:08', delivered: true }
        ]
      },
      {
        id: 'tbl-6',
        establishmentId: 'bar-1',
        tableNumber: 'Mesa 6 (Pátio Jardim)',
        customerName: '',
        operatorName: 'Carlos Gerente',
        status: 'livre',
        items: []
      }
    ];
  });

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(() => loadInventoryItems());
  const [financialTxs, setFinancialTxs] = useState<FinancialTransaction[]>([]);

  // Find active establishment
  const activeEstablishment = useMemo(() => {
    const found = accessibleEstablishments.find(e => e.id === selectedEstId);
    if (found) return ensureEstablishmentCatalog(found);
    return accessibleEstablishments[0] ? ensureEstablishmentCatalog(accessibleEstablishments[0]) : null;
  }, [accessibleEstablishments, selectedEstId]);

  // Ensure current store has complete inventory items for table consumption
  const storeInventory = useMemo(() => {
    if (!activeEstablishment) return [];
    const matches = inventoryItems.filter(i => 
      i.establishmentId === activeEstablishment.id || 
      i.establishmentId === activeEstablishment.name
    );

    if (matches.length > 0) return matches;

    const catalog = activeEstablishment.productsCatalog && activeEstablishment.productsCatalog.length > 0
      ? activeEstablishment.productsCatalog
      : (DEFAULT_CATALOGS_BY_CATEGORY[activeEstablishment.category] || DEFAULT_CATALOGS_BY_CATEGORY['bar'] || []);

    const generated: InventoryItem[] = catalog.map((p, idx) => ({
      id: p.id || `inv-${activeEstablishment.id}-${idx}`,
      establishmentId: activeEstablishment.id,
      name: p.name,
      category: p.category || 'Bebidas & Cozinha',
      costPriceMT: Math.round((p.promoPriceMT || p.priceMT) * 0.65),
      sellingPriceMT: p.priceMT,
      quantityInStock: 30 + (idx * 5),
      minStockThreshold: 5,
      unit: p.unitLabel || 'Dose/Unidade',
      barcode: `6009${activeEstablishment.id.replace(/\D/g, '') || '77'}${idx.toString().padStart(4, '0')}`,
      sku: `SKU-BAR-${(idx + 1).toString().padStart(3, '0')}`,
      supplier: activeEstablishment.name,
      imageUrl: p.imageUrl,
      isTopSeller: idx < 4,
      salesCount: 25 + (idx * 3)
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
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h3 className="font-serif font-bold text-xl text-white">Controle de Mesas Restrito</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              O perfil de <strong>{currentUser?.role === 'cliente' ? 'Cliente' : (currentUser?.role === 'entregador' ? 'Estafeta' : 'Utilizador')}</strong> destina-se a realizar pedidos e consultas de cardápio.
              O controlo de sala, comandas abertas e faturação de mesas são reservados aos operadores e proprietários de estabelecimentos de restauração.
            </p>
          </div>
          <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              onClick={() => setActivePage('lojas')}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Ver Restaurantes & Bares
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
          <UtensilsCrossed className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-white">Carregando Controle de Mesas...</h3>
          <p className="text-xs text-slate-400 mt-1">A preparar comandas e estado das mesas em tempo real.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Header Banner */}
      <div className="bg-[#0B254B] border-b border-blue-900/60 text-white py-8 px-[6vw]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-blue-100 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <UtensilsCrossed className="w-4 h-4 text-white" />
                <span>Gestão de Sala, Comandas & Contas</span>
              </div>
              <h1 className="font-serif font-bold text-2xl sm:text-3xl text-white">
                Controle de Mesas & Consumo
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl mt-1 leading-relaxed">
                Gestão de mesas abertas, lançamento de pedidos da cozinha e bar, fecho de conta com divisão de pagamentos, gorjetas e integração direta com o stock.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="py-2 px-3.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <HelpCircle className="w-4 h-4 text-blue-200" />
                <span>{showGuide ? 'Ocultar Explicação' : 'Como funciona o Controle de Mesas?'}</span>
              </button>

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setActivePage('dashboard')}
                  className="py-2 px-3.5 bg-white hover:bg-blue-50 text-[#0B254B] text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <Store className="w-4 h-4" />
                  <span>Aceder ao Meu Painel</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Establishment Switcher */}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-100">
              <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
              <span>Estabelecimento:</span>
              <span className="text-white font-bold">{activeEstablishment.name}</span>
            </div>

            {accessibleEstablishments.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                {accessibleEstablishments.filter(e => e.category === 'bar' || e.category === 'hospedagem' || e.category === 'loja').slice(0, 8).map((est, idx) => {
                  const isSelected = est.id === selectedEstId;
                  return (
                    <button
                      key={`tbl-est-btn-${est.id}-${idx}`}
                      type="button"
                      onClick={() => setSelectedEstId(est.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all shrink-0 flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-white text-[#0B254B] shadow-xs font-black'
                          : 'bg-white/10 text-blue-100 hover:bg-white/20 border border-white/15'
                      }`}
                    >
                      <span>{est.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? 'bg-blue-100 text-[#0B254B]' : 'bg-black/20 text-blue-200'
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

      {/* Guide Banner */}
      {showGuide && (
        <div className="px-[6vw] mt-6 max-w-7xl mx-auto w-full">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-slate-200 text-[#0B254B] flex items-center justify-center font-bold">
                  <Info className="w-4 h-4 text-[#0B254B]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-slate-900">
                    Módulo Operacional: Controle de Mesas, Comandas & Faturação de Consumo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Otimize o atendimento em sala, esplanada e balcão em Moçambique com registo individual de consumos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Dispensar
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#0B254B]" />
                  1. Abertura & Identificação
                </span>
                <p>
                  Abra a mesa atribuindo o nome do cliente ou grupo e o operador responsável (garçom/atendente).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-700" />
                  2. Lançamento Automático
                </span>
                <p>
                  Adicione bebidas e pratos diretamente da lista de inventário com baixa automática no stock físico.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-700" />
                  3. Fecho & Recibo Fiscal
                </span>
                <p>
                  Emita a conta discriminada com IVA (16%), escolha M-Pesa, e-Mola ou Dinheiro e imprima o talão.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Interactive Table Manager Component */}
      <div className="px-[6vw] mt-6 max-w-7xl mx-auto w-full">
        <TableManager
          establishment={activeEstablishment}
          tables={tables}
          setTables={setTables}
          inventoryItems={storeInventory}
          setInventoryItems={handleUpdateStoreInventory}
          activeOperator={currentUser?.displayName || currentUser?.name || 'Carlos Gerente'}
          financialTxs={financialTxs}
          setFinancialTxs={setFinancialTxs}
        />
      </div>

    </div>
  );
}
