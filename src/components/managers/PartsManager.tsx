import React, { useState } from 'react';
import { Establishment, FinancialTransaction, InventoryItem } from "../../types/types";
import { saveFinancialTransactions } from "../../data/data";
import { recordOfflineChange } from "../../services/offlineSync";
import { notify } from "../../services/dialogs";
import { 
  Wrench, Car, Search, Plus, Filter, CheckCircle2, Clock, 
  DollarSign, AlertCircle, RefreshCw, Trash2, X, Phone, ShieldCheck, Tag, Box, Check, ArrowRight
} from 'lucide-react';

export interface PartQuoteRequest {
  id: string;
  establishmentId: string;
  clientName: string;
  clientPhone: string;
  carMakeModel: string; // e.g. "Toyota Hilux GD6 2.8 (2020)"
  vinNumber?: string; // Número do Chassi
  partNeeded: string; // e.g. "Pastilhas de Travão Dianteiras + Filtro de Óleo"
  status: 'pendente' | 'em_cotacao' | 'aprovado' | 'entregue';
  quotedPriceMT?: number;
  requestedAt: string;
  notes?: string;
}

interface PartsManagerProps {
  establishment: Establishment;
  inventoryItems: InventoryItem[];
  activeOperator: string;
  financialTxs: FinancialTransaction[];
  setFinancialTxs: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
}

export default function PartsManager({
  establishment,
  inventoryItems,
  activeOperator,
  financialTxs,
  setFinancialTxs
}: PartsManagerProps) {
  const [activeTab, setActiveTab] = useState<'catalogo' | 'cotacoes' | 'compatibilidade'>('catalogo');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('todos');
  const [selectedMake, setSelectedMake] = useState<string>('todos');

  // Load quotes from localStorage or use default realistic Mozambique auto parts quotes
  const [quotes, setQuotes] = useState<PartQuoteRequest[]>(() => {
    const saved = localStorage.getItem(`axofacil_parts_quotes_${establishment.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {}
    }
    return [
      {
        id: 'pq-001',
        establishmentId: establishment.id,
        clientName: 'Américo Mabunda',
        clientPhone: '841234567',
        carMakeModel: 'Toyota Hilux GD6 2.4 D-4D (2018)',
        vinNumber: 'AHTFR22G90501234',
        partNeeded: 'Kit Pastilhas de Travão Dianteiras Bosch + Filtro de Ar e Óleo',
        status: 'aprovado',
        quotedPriceMT: 8500,
        requestedAt: '09:15',
        notes: 'Cliente solicitou entrega via Moto-Estafeta na Baixa'
      },
      {
        id: 'pq-002',
        establishmentId: establishment.id,
        clientName: 'Mecanica Auto Central',
        clientPhone: '829876543',
        carMakeModel: 'Nissan Hardbody NP300 2.5 TD',
        vinNumber: 'MNTNDD2200008899',
        partNeeded: 'Amortecedores Traseiros Kayaba (Par) + Kit Embraiagem',
        status: 'em_cotacao',
        quotedPriceMT: 19500,
        requestedAt: '10:40',
        notes: 'Verificar disponibilidade em armazém central'
      },
      {
        id: 'pq-003',
        establishmentId: establishment.id,
        clientName: 'Inácio Cossa',
        clientPhone: '876543210',
        carMakeModel: 'Toyota Ractis 1.5 VVTi (2012)',
        vinNumber: 'NCP100-012948',
        partNeeded: 'Bateria Willard 60Ah sem manutenção + 4 Velas Iridium',
        status: 'pendente',
        requestedAt: '11:20',
        notes: 'Cliente aguarda preço do M-Pesa para confirmação'
      }
    ];
  });

  // Save quotes to localStorage
  const saveQuotes = (updated: PartQuoteRequest[]) => {
    setQuotes(updated);
    localStorage.setItem(`axofacil_parts_quotes_${establishment.id}`, JSON.stringify(updated));
    recordOfflineChange();
  };

  // New Quote Modal State
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('+258 84 ');
  const [carMakeModel, setCarMakeModel] = useState('');
  const [vinNumber, setVinNumber] = useState('');
  const [partNeeded, setPartNeeded] = useState('');
  const [quotedPriceMT, setQuotedPriceMT] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const handleCreateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !carMakeModel.trim() || !partNeeded.trim()) {
      notify('Por favor preencha o nome do cliente, modelo do carro e peças necessárias.', 'error');
      return;
    }

    const newQ: PartQuoteRequest = {
      id: 'pq-' + Date.now(),
      establishmentId: establishment.id,
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      carMakeModel: carMakeModel.trim(),
      vinNumber: vinNumber.trim().toUpperCase() || undefined,
      partNeeded: partNeeded.trim(),
      status: quotedPriceMT > 0 ? 'em_cotacao' : 'pendente',
      quotedPriceMT: quotedPriceMT > 0 ? quotedPriceMT : undefined,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: notes.trim() || undefined
    };

    saveQuotes([newQ, ...quotes]);
    setShowAddQuoteModal(false);
    setClientName('');
    setCarMakeModel('');
    setVinNumber('');
    setPartNeeded('');
    setQuotedPriceMT(0);
    setNotes('');
  };

  const handleUpdateStatus = (id: string, newStatus: PartQuoteRequest['status'], finalPrice?: number) => {
    const updated = quotes.map(q => {
      if (q.id === id) {
        const u = { ...q, status: newStatus };
        if (finalPrice !== undefined) u.quotedPriceMT = finalPrice;
        return u;
      }
      return q;
    });
    saveQuotes(updated);

    // If marked as entregue/aprovado with price, record financial revenue
    const target = updated.find(q => q.id === id);
    if (newStatus === 'entregue' && target && target.quotedPriceMT && target.quotedPriceMT > 0) {
      const newTx: FinancialTransaction = {
        id: 'tx-parts-' + Date.now(),
        establishmentId: establishment.id,
        date: new Date().toISOString().split('T')[0],
        type: 'receita',
        category: 'Vendas de Produtos',
        description: `Venda de Peças: ${target.partNeeded} (${target.carMakeModel}) - ${target.clientName}`,
        amountMT: target.quotedPriceMT,
        paymentMethod: 'M-Pesa',
        status: 'Pago',
        customerName: target.clientName,
        operatorName: activeOperator || 'Atendente Balcão Peças'
      };
      const updatedTxs = [newTx, ...financialTxs];
      setFinancialTxs(updatedTxs);
      saveFinancialTransactions(updatedTxs);
    }
  };

  // Auto Parts Filtering
  const carMakes = ['todos', 'Toyota', 'Nissan', 'Isuzu', 'Mitsubishi', 'Ford', 'Honda', 'Hyundai', 'Kia', 'Volkswagen'];

  const estInventory = inventoryItems.filter(i => i.establishmentId === establishment.id);

  const partsItems = estInventory.filter(p => {
    if (categoryFilter !== 'todos' && p.category !== categoryFilter) return false;
    if (selectedMake !== 'todos' && !p.name.toLowerCase().includes(selectedMake.toLowerCase())) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q));
    }
    return true;
  });

  return (
    <div className="bg-white border border-ink/12 rounded-3xl p-6 shadow-sm space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-deep to-slate-800 text-white p-6 rounded-2xl shadow-md">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-300/30">
            <Wrench className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-widest uppercase bg-amber-400 text-slate-950 py-0.5 px-2 rounded-md">
                Gestor de Auto Peças & Acessórios
              </span>
              <span className="text-xs text-white/70">Balcão & Compatibilidade</span>
            </div>
            <h2 className="font-serif font-bold text-2xl mt-1 text-paper">
              {establishment.name}
            </h2>
            <p className="text-xs text-white/80 mt-0.5">
              Consulta por Chassi (VIN), compatibilidade por modelo de veículo e cotações rápidas.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddQuoteModal(true)}
          className="btn bg-amber-400 text-slate-950 hover:bg-amber-300 font-bold text-xs py-3 px-5 rounded-xl flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Cotação / Pedido de Peça</span>
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-ink/12 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('catalogo')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'catalogo'
              ? 'border-indigo-deep text-indigo-deep'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Box className="w-4 h-4" />
          <span>Catálogo de Peças em Stock ({estInventory.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cotacoes')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'cotacoes'
              ? 'border-indigo-deep text-indigo-deep'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>Cotações & Chassi VIN ({quotes.length})</span>
          {quotes.filter(q => q.status === 'pendente').length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              {quotes.filter(q => q.status === 'pendente').length} Pendentes
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('compatibilidade')}
          className={`py-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'compatibilidade'
              ? 'border-indigo-deep text-indigo-deep'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <Car className="w-4 h-4 text-emerald-600" />
          <span>Pesquisa por Modelo de Veículo</span>
        </button>
      </div>

      {/* TAB 1: CATALOG OF AUTO PARTS */}
      {activeTab === 'catalogo' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-sand-2/30 p-4 rounded-2xl border border-ink/10">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-paper border border-ink/15 rounded-xl py-2 px-3 text-xs w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-ink/40 shrink-0" />
                <input
                  type="text"
                  placeholder="Buscar peça, pastilha, óleo, código..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-ink w-full font-medium"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                <span className="text-xs font-bold text-ink/50 shrink-0 ml-2">Marca:</span>
                {carMakes.slice(0, 6).map((mk, idx) => (
                  <button
                    key={`mk-${mk}-${idx}`}
                    onClick={() => setSelectedMake(mk)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedMake === mk
                        ? 'bg-slate-900 text-white'
                        : 'bg-paper text-ink/70 border border-ink/10 hover:bg-sand-2'
                    }`}
                  >
                    {mk === 'todos' ? 'Todas' : mk}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-ink/60 font-medium">
              A mostrar <strong className="text-indigo-deep">{partsItems.length}</strong> peças disponíveis
            </div>
          </div>

          {/* Parts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {partsItems.map((item, idx) => (
              <div key={`part-item-${item.id}-${idx}`} className="bg-paper border border-ink/12 rounded-2xl p-4 shadow-xs hover:border-indigo-brand/40 transition-all flex flex-col justify-between">
                <div>
                  <div className="relative h-36 rounded-xl overflow-hidden bg-sand-2 mb-3">
                    <img
                      src={item.imageUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=400'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute top-2 right-2 bg-slate-900/90 text-amber-300 text-[10px] font-bold py-1 px-2.5 rounded-lg backdrop-blur-xs">
                      {item.category || 'Peça Auto'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-indigo-deep line-clamp-1">{item.name}</h3>
                  <p className="text-xs text-ink/60 mt-1">
                    Stock: <strong className="text-indigo-deep">{item.quantityInStock} {item.unit || 'unid'}</strong>
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-ink/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink/40 block">Preço de Tabela</span>
                    <span className="text-base font-extrabold text-emerald-700">
                      {item.sellingPriceMT.toLocaleString()} MT
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setClientName('Cliente Balcão');
                      setPartNeeded(item.name);
                      setQuotedPriceMT(item.sellingPriceMT);
                      setShowAddQuoteModal(true);
                    }}
                    className="py-1.5 px-3 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Vender / Cotar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: QUOTES & CHASSIS (VIN) LOOKUP */}
      {activeTab === 'cotacoes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-900 text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                <strong>SISTEMA DE VERIFICAÇÃO DE CHASSI (VIN):</strong> Os números de chassi ajudam a garantir que o modelo exato do filtro, motor ou pastilha encaixa perfeitamente no veículo do cliente sem devoluções.
              </span>
            </div>

            <button
              onClick={() => setShowAddQuoteModal(true)}
              className="py-1.5 px-3 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700 shrink-0 cursor-pointer"
            >
              + Adicionar Pedido
            </button>
          </div>

          <div className="divide-y divide-ink/10 border border-ink/12 rounded-2xl overflow-hidden bg-paper">
            {quotes.map((q, idx) => (
              <div key={`quote-${q.id}-${idx}`} className="p-4 hover:bg-sand-2/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold py-0.5 px-2 rounded-md uppercase ${
                      q.status === 'aprovado' ? 'bg-emerald-100 text-emerald-800' :
                      q.status === 'entregue' ? 'bg-blue-100 text-blue-800' :
                      q.status === 'em_cotacao' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {q.status === 'aprovado' ? 'Aprovado' : q.status === 'entregue' ? 'Entregue & Pago' : q.status === 'em_cotacao' ? 'Em Cotação' : 'Pendente'}
                    </span>
                    <span className="text-xs font-bold text-indigo-deep">{q.clientName} ({q.clientPhone})</span>
                    <span className="text-[11px] text-ink/40">• {q.requestedAt}</span>
                  </div>

                  <h4 className="font-bold text-sm text-ink flex items-center gap-2">
                    <Car className="w-4 h-4 text-indigo-brand shrink-0" />
                    <span>{q.carMakeModel}</span>
                    {q.vinNumber && (
                      <span className="bg-slate-100 text-slate-700 font-mono text-[11px] py-0.5 px-2 rounded border border-slate-300">
                        VIN: {q.vinNumber}
                      </span>
                    )}
                  </h4>

                  <p className="text-xs text-ink/70 font-medium">
                    🔧 Peças Solicitadas: <strong>{q.partNeeded}</strong>
                  </p>
                  {q.notes && <p className="text-[11px] text-ink/50 italic">Nota: {q.notes}</p>}
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-ink/40 uppercase block">Valor Cotado</span>
                    <span className="text-sm font-extrabold text-emerald-700">
                      {q.quotedPriceMT ? `${q.quotedPriceMT.toLocaleString()} MT` : 'A definir'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {q.status === 'pendente' && (
                      <button
                        onClick={() => {
                          const val = prompt('Indique o valor cotado em Meticais (MT):', '5000');
                          if (val) handleUpdateStatus(q.id, 'em_cotacao', Number(val));
                        }}
                        className="py-1.5 px-3 bg-amber-500 text-white font-bold text-xs rounded-xl hover:bg-amber-600 transition-all cursor-pointer"
                      >
                        Definir Preço
                      </button>
                    )}

                    {q.status === 'em_cotacao' && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, 'aprovado')}
                        className="py-1.5 px-3 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Aprovar</span>
                      </button>
                    )}

                    {q.status === 'aprovado' && (
                      <button
                        onClick={() => handleUpdateStatus(q.id, 'entregue')}
                        className="py-1.5 px-3 bg-indigo-deep text-white font-bold text-xs rounded-xl hover:bg-indigo-brand transition-all cursor-pointer flex items-center gap-1"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Concluir Venda</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: VEHICLE MODEL COMPATIBILITY QUICK LOOKUP */}
      {activeTab === 'compatibilidade' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-amber-300 flex items-center gap-2">
              <Car className="w-5 h-5" />
              <span>Guia Rápido de Peças Populares em Moçambique</span>
            </h3>
            <p className="text-xs text-white/70">
              Selecione o modelo do carro do cliente para ver instantaneamente a especificação de óleo, tamanho de filtro e código de pastilhas de travão recomendadas.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { model: 'Toyota Hilux GD6 / Revo', oil: '5W-30 Synthetic', brake: 'Pastilhas DB1739', filter: 'Filtro Óleo 90915-YZZD2' },
                { model: 'Toyota Ractis / Vitz 1.3/1.5', oil: '0W-20 / 5W-30', brake: 'Pastilhas DB1820', filter: 'Filtro Óleo 90915-10003' },
                { model: 'Nissan Hardbody NP300 2.5D', oil: '15W-40 Diesel', brake: 'Pastilhas DB1220', filter: 'Filtro Óleo 15208-BN30A' },
                { model: 'Isuzu D-Max KB250 / 300', oil: '10W-40 Diesel Heavy', brake: 'Pastilhas DB1840', filter: 'Filtro Óleo 8-97358720-0' }
              ].map((c, i) => (
                <div key={`quick-car-guide-${c.model}-${i}`} className="bg-white/10 border border-white/15 p-4 rounded-xl space-y-2 text-xs">
                  <h4 className="font-bold text-amber-400 text-sm">{c.model}</h4>
                  <div className="text-white/80 space-y-1 text-[11px]">
                    <p>🛢️ <strong>Óleo:</strong> {c.oil}</p>
                    <p>🛑 <strong>Travões:</strong> {c.brake}</p>
                    <p>🔍 <strong>Filtro:</strong> {c.filter}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE QUOTE MODAL */}
      {showAddQuoteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper border border-ink/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setShowAddQuoteModal(false)}
              className="absolute top-4 right-4 text-ink/40 hover:text-ink cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-indigo-brand" />
              <h3 className="font-serif font-bold text-lg text-indigo-deep">Registar Pedido / Cotação de Auto Peça</h3>
            </div>

            <form onSubmit={handleCreateQuote} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">Nome do Cliente / Oficina *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mestre Gabriel / Auto Garagem"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Nº do Chassi (VIN)</label>
                  <input
                    type="text"
                    placeholder="Ex: AHTFR22G9..."
                    value={vinNumber}
                    onChange={(e) => setVinNumber(e.target.value)}
                    className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">Modelo do Carro e Ano *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Toyota Hilux 2.4 GD6 (2019)"
                  value={carMakeModel}
                  onChange={(e) => setCarMakeModel(e.target.value)}
                  className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-ink/70 mb-1">Peça(s) Solicitada(s) *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Ex: Pastilhas de Travão Dianteiras + Filtro de Ar e Óleo 5W30"
                  value={partNeeded}
                  onChange={(e) => setPartNeeded(e.target.value)}
                  className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Preço Cotado (MT)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={quotedPriceMT || ''}
                    onChange={(e) => setQuotedPriceMT(Number(e.target.value))}
                    className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink/70 mb-1">Observações / Entrega</label>
                  <input
                    type="text"
                    placeholder="Ex: Enviar por Moto-Estafeta"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-sand-2/40 border border-ink/15 rounded-xl p-2.5 text-xs font-medium outline-none focus:border-indigo-brand"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuoteModal(false)}
                  className="py-2.5 px-4 bg-sand-2 text-ink font-bold text-xs rounded-xl hover:bg-sand-2/80 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 bg-indigo-deep text-paper font-bold text-xs rounded-xl hover:bg-indigo-brand shadow-md cursor-pointer"
                >
                  Salvar Pedido de Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
