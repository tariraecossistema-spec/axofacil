import React, { useState, useEffect } from 'react';
import { Establishment, FinancialTransaction, InventoryItem } from '../../types/types';
import { saveFinancialTransactions } from '../../data/data';
import { recordOfflineChange } from '../../services/offlineSync';
import { 
  Building, Truck, Boxes, CheckCircle2, Clock, 
  DollarSign, Plus, AlertCircle, RefreshCw, Trash2, X, Phone, MapPin, FileText, Send, ShieldCheck
} from 'lucide-react';

export interface YardDeliveryRecord {
  id: string;
  establishmentId: string;
  guiaNumber: string; // e.g. "GUIA-2026-001"
  siteName: string; // e.g. "Obra Vivenda T4 - Maputo Sommerschield"
  contractorName: string; // Mestre de obra / Engenheiro
  contractorPhone: string;
  siteAddress: string;
  itemsSummary: string; // e.g. "100 Sacos Cimento 42.5N + 2 Carradas Areia Grossa"
  truckInfo?: string; // e.g. "Camião Mercedes 15T (Placa: MM-45-89)"
  driverName?: string;
  totalValueMT: number;
  paymentStatus: 'pago' | 'pendente_obra' | 'faturado_quinzenal';
  deliveryStatus: 'em_preparacao' | 'a_caminho' | 'entregue';
  dispatchedAt: string;
  deliveredAt?: string;
  operatorName?: string;
  notes?: string;
}

interface YardManagerProps {
  establishment: Establishment;
  inventoryItems: InventoryItem[];
  activeOperator: string;
  financialTxs: FinancialTransaction[];
  setFinancialTxs: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
}

export default function YardManager({
  establishment,
  inventoryItems,
  activeOperator,
  financialTxs,
  setFinancialTxs
}: YardManagerProps) {
  
  // Load deliveries from localStorage or load realistic default construction yard dispatches
  const [deliveries, setDeliveries] = useState<YardDeliveryRecord[]>(() => {
    const saved = localStorage.getItem(`axofacil_yard_deliveries_${establishment.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // fallback
      }
    }
    return [
      {
        id: 'yd-001',
        establishmentId: establishment.id,
        guiaNumber: 'GUIA-2026-101',
        siteName: 'Obra Vivenda T4 - Sommerschield',
        contractorName: 'Mestre Gabriel Sitoe',
        contractorPhone: '849988776',
        siteAddress: 'Av. Julius Nyerere, Parcela 402, Maputo',
        itemsSummary: '150 Sacos Cimento 42.5N Limpopo + 3 Carradas Areia Grossa 10m³',
        truckInfo: 'Camião Basculante Volvo 15T (Placa: AFG-204-MC)',
        driverName: 'Eusébio Motorista',
        totalValueMT: 108000,
        paymentStatus: 'pago',
        deliveryStatus: 'a_caminho',
        dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        operatorName: activeOperator || 'Mestre de Estaleiro',
        notes: 'Descarregar na entrada principal da obra com braço hidráulico'
      },
      {
        id: 'yd-002',
        establishmentId: establishment.id,
        guiaNumber: 'GUIA-2026-102',
        siteName: 'Obra Galpão Comercial - Matola Rio',
        contractorName: 'Eng. Mateus Tembe',
        contractorPhone: '821234567',
        siteAddress: 'EN4 Próximo às Bombas Total, Matola',
        itemsSummary: '80 Varões de Ferro 12mm + 50 Blocos de Betão 15cm',
        truckInfo: 'Camião Canter 5 Toneladas',
        driverName: 'Inácio',
        totalValueMT: 46500,
        paymentStatus: 'pago',
        deliveryStatus: 'entregue',
        dispatchedAt: '08:30',
        deliveredAt: '10:15',
        operatorName: activeOperator,
        notes: 'Entregue e assinado pelo mestre de obra'
      },
      {
        id: 'yd-003',
        establishmentId: establishment.id,
        guiaNumber: 'GUIA-2026-103',
        siteName: 'Obra Muro de Vedação - Zimpeto',
        contractorName: 'Sr. Fernando Macamo',
        contractorPhone: '875544332',
        siteAddress: 'Bairro do Zimpeto, Rua da Escola',
        itemsSummary: '30 Sacos Cimento + 1 Carrada Brita Nº 2',
        totalValueMT: 24000,
        paymentStatus: 'pendente_obra',
        deliveryStatus: 'em_preparacao',
        dispatchedAt: 'Em carga no estaleiro',
        notes: 'Pagamento em dinheiro na entrega no estaleiro da obra'
      }
    ];
  });

  // Filter Delivery Status
  const [filterStatus, setFilterStatus] = useState<'todos' | 'em_preparacao' | 'a_caminho' | 'entregue'>('todos');

  // New Guia Modal State
  const [showAddGuiaModal, setShowAddGuiaModal] = useState(false);
  const [siteNameInput, setSiteNameInput] = useState('');
  const [contractorInput, setContractorInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [addressInput, setAddressInput] = useState('');
  const [itemsSummaryInput, setItemsSummaryInput] = useState('');
  const [truckInput, setTruckInput] = useState('');
  const [driverInput, setDriverInput] = useState('');
  const [valueMTInput, setValueMTInput] = useState<number>(0);
  const [payStatusInput, setPayStatusInput] = useState<'pago' | 'pendente_obra' | 'faturado_quinzenal'>('pago');
  const [notesInput, setNotesInput] = useState('');

  // Selected Guia for Detail or Status Change
  const [selectedGuia, setSelectedGuia] = useState<YardDeliveryRecord | null>(null);

  // Save to LocalStorage whenever deliveries change
  useEffect(() => {
    localStorage.setItem(`axofacil_yard_deliveries_${establishment.id}`, JSON.stringify(deliveries));
    recordOfflineChange();
  }, [deliveries, establishment.id]);

  // Handle Create Guia de Remessa
  const handleCreateGuia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteNameInput.trim() || !itemsSummaryInput.trim() || !valueMTInput) return;

    const newGuiaNum = `GUIA-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newRecord: YardDeliveryRecord = {
      id: 'yd-' + Date.now(),
      establishmentId: establishment.id,
      guiaNumber: newGuiaNum,
      siteName: siteNameInput.trim(),
      contractorName: contractorInput.trim() || 'Mestre de Obra',
      contractorPhone: phoneInput.trim() || '840000000',
      siteAddress: addressInput.trim() || 'Endereço da Obra',
      itemsSummary: itemsSummaryInput.trim(),
      truckInfo: truckInput.trim() || 'Camião do Estaleiro',
      driverName: driverInput.trim() || 'Motorista de Turno',
      totalValueMT: Number(valueMTInput),
      paymentStatus: payStatusInput,
      deliveryStatus: 'em_preparacao',
      dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      operatorName: activeOperator || 'Mestre de Estaleiro',
      notes: notesInput
    };

    setDeliveries([newRecord, ...deliveries]);

    // If payment status is 'pago', auto-record entry in Financial Ledger
    if (payStatusInput === 'pago') {
      const todayStr = new Date().toISOString().split('T')[0];
      const newTx: FinancialTransaction = {
        id: 'fin-yard-' + Date.now(),
        establishmentId: establishment.id,
        date: todayStr,
        type: 'receita',
        category: 'Vendas de Produtos',
        description: `${newGuiaNum} - Material Estaleiro (${siteNameInput})`,
        amountMT: Number(valueMTInput),
        paymentMethod: 'Transferência BCI/BIM',
        status: 'Pago',
        customerName: contractorInput || siteNameInput,
        operatorName: activeOperator || 'Estaleiro'
      };

      const updatedTxs = [newTx, ...financialTxs];
      setFinancialTxs(updatedTxs);
      saveFinancialTransactions(updatedTxs);
    }

    // Reset Form
    setSiteNameInput('');
    setContractorInput('');
    setPhoneInput('');
    setAddressInput('');
    setItemsSummaryInput('');
    setTruckInput('');
    setDriverInput('');
    setValueMTInput(0);
    setNotesInput('');
    setShowAddGuiaModal(false);
  };

  // Update Status (e.g. em_preparacao -> a_caminho -> entregue)
  const handleAdvanceStatus = (guiaId: string, nextStatus: 'a_caminho' | 'entregue') => {
    const updated = deliveries.map(d => {
      if (d.id === guiaId) {
        return {
          ...d,
          deliveryStatus: nextStatus,
          deliveredAt: nextStatus === 'entregue' ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.deliveredAt
        };
      }
      return d;
    });

    setDeliveries(updated);
  };

  // Filtered Deliveries
  const filteredDeliveries = deliveries.filter(d => {
    if (filterStatus === 'todos') return true;
    return d.deliveryStatus === filterStatus;
  });

  // Calculate Yard Stats
  const totalValueSum = deliveries.reduce((acc, curr) => acc + curr.totalValueMT, 0);
  const inTransitCount = deliveries.filter(d => d.deliveryStatus === 'a_caminho').length;
  const preparingCount = deliveries.filter(d => d.deliveryStatus === 'em_preparacao').length;
  const deliveredCount = deliveries.filter(d => d.deliveryStatus === 'entregue').length;

  return (
    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ink/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-900 text-[10px] font-bold py-0.5 px-2.5 rounded-md mb-1 border border-amber-300">
            <Boxes className="w-3.5 h-3.5 text-amber-800" />
            <span>Módulo de Gestão de Estaleiro & Material de Construção</span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-indigo-deep">
            Controlo de Obras, Guias de Remessa & Carradas
          </h2>
          <p className="text-xs text-ink/60 mt-0.5">
            Efectue a saída de sacos de cimento, areia, brita, ferro e blocos com emissão de Guias de Remessa e acompanhamento de camiões em trânsito.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddGuiaModal(true)}
          className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 text-sand" />
          <span>Lançar Guia de Remessa / Saída Estaleiro</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-amber-900 uppercase">Em Carga / Preparação</span>
          <div className="text-xl font-serif font-bold text-amber-950">{preparingCount} guias</div>
          <div className="text-[10px] font-bold text-amber-800">A carregar no estaleiro</div>
        </div>

        <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-sky-900 uppercase">Camiões a Caminho</span>
          <div className="text-xl font-serif font-bold text-sky-950">{inTransitCount} entregas</div>
          <div className="text-[10px] font-bold text-sky-800">Em trânsito para a obra</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-900 uppercase">Entregues no Destino</span>
          <div className="text-xl font-serif font-bold text-emerald-950">{deliveredCount} concluidas</div>
          <div className="text-[10px] font-bold text-emerald-800">Validado no estaleiro da obra</div>
        </div>

        <div className="bg-indigo-deep text-paper p-3.5 rounded-xl shadow-xs">
          <span className="text-[10px] font-bold text-sand uppercase block">Total Movimentado (MT)</span>
          <div className="text-xl font-serif font-bold text-paper">{totalValueSum.toLocaleString()} MT</div>
          <div className="text-[10px] text-paper/70 font-sans">Valor total das carradas</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3">
        {(['todos', 'em_preparacao', 'a_caminho', 'entregue'] as const).map((st, idx) => (
          <button
            key={`yard-st-${st}-${idx}`}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
              filterStatus === st 
                ? 'bg-indigo-deep text-paper shadow-2xs' 
                : 'bg-paper text-ink/70 hover:bg-sand-2/40 border border-ink/10'
            }`}
          >
            {st === 'todos' ? 'Todas as Guias' : st === 'em_preparacao' ? '📦 Em Preparação' : st === 'a_caminho' ? '🚚 Camião a Caminho' : '✅ Entregues'}
          </button>
        ))}
      </div>

      {/* Guias List */}
      <div className="space-y-3">
        {filteredDeliveries.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-ink/15 rounded-xl p-6">
            <Truck className="w-10 h-10 text-ink/20 mx-auto mb-2" />
            <p className="text-xs font-semibold text-ink/50">Nenhuma guia de remessa registada neste filtro.</p>
          </div>
        ) : (
          filteredDeliveries.map((guia, idx) => (
            <div 
              key={`guia-card-${guia.id}-${idx}`}
              className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${
                guia.deliveryStatus === 'a_caminho' 
                  ? 'bg-sky-50/40 border-sky-300' 
                  : guia.deliveryStatus === 'em_preparacao'
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-paper border-ink/12'
              }`}
            >
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold text-indigo-deep bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {guia.guiaNumber}
                  </span>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    guia.deliveryStatus === 'entregue'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : guia.deliveryStatus === 'a_caminho'
                        ? 'bg-sky-100 text-sky-800 border border-sky-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}>
                    {guia.deliveryStatus === 'entregue' ? '✅ Entregue na Obra' : guia.deliveryStatus === 'a_caminho' ? '🚚 Camião a Caminho' : '📦 Em Carga'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    guia.paymentStatus === 'pago' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {guia.paymentStatus === 'pago' ? '💳 Pago' : '⏳ Cobrar na Obra'}
                  </span>
                </div>

                <h3 className="font-serif font-bold text-base text-indigo-deep flex items-center gap-1.5 mt-1">
                  <Building className="w-4 h-4 text-terracotta" />
                  <span>{guia.siteName}</span>
                </h3>

                <p className="text-xs font-bold text-ink/80">
                  📦 {guia.itemsSummary}
                </p>

                <div className="flex items-center gap-3 text-[11px] text-ink/60 flex-wrap">
                  <span>👷 Mestre: <strong>{guia.contractorName}</strong> ({guia.contractorPhone})</span>
                  <span>📍 {guia.siteAddress}</span>
                  {guia.truckInfo && <span>🚛 {guia.truckInfo}</span>}
                </div>

                {guia.notes && (
                  <p className="text-[10.5px] text-ink/50 italic">
                    Obs: "{guia.notes}"
                  </p>
                )}
              </div>

              <div className="flex flex-col items-end gap-2 w-full sm:w-auto border-t sm:border-t-0 border-ink/8 pt-2 sm:pt-0">
                <div className="text-right">
                  <span className="font-serif font-bold text-lg text-emerald-800">{guia.totalValueMT.toLocaleString()} MT</span>
                  <span className="text-[10px] text-ink/50 block">Despacho: {guia.dispatchedAt}</span>
                </div>

                <div className="flex items-center gap-2">
                  {guia.deliveryStatus === 'em_preparacao' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(guia.id, 'a_caminho')}
                      className="py-2 px-3.5 bg-sky-700 hover:bg-sky-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Expedir Camião</span>
                    </button>
                  )}

                  {guia.deliveryStatus === 'a_caminho' && (
                    <button
                      type="button"
                      onClick={() => handleAdvanceStatus(guia.id, 'entregue')}
                      className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Confirmar Entrega na Obra</span>
                    </button>
                  )}

                  {guia.deliveryStatus === 'entregue' && (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Concluído às {guia.deliveredAt || '10:00'}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE GUIA DE REMESSA MODAL POPUP */}
      {showAddGuiaModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreateGuia} className="bg-paper border border-ink/15 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <div>
                <div className="font-serif font-bold text-indigo-deep text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-terracotta" />
                  <span>Nova Guia de Remessa / Saída de Material</span>
                </div>
                <p className="text-[11px] text-ink/60 mt-0.5">Registo de saída de cimento, areia, brita ou ferro para estaleiro de obra</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddGuiaModal(false)}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-sand-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Nome / Identificação da Obra *</label>
              <input
                type="text"
                required
                placeholder="ex: Obra Vivenda T4 - Maputo Sommerschield"
                value={siteNameInput}
                onChange={(e) => setSiteNameInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none focus:border-indigo-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Nome do Mestre de Obra / Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Mestre Gabriel Sitoe"
                  value={contractorInput}
                  onChange={(e) => setContractorInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Contacto Telemóvel *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: 849988776"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Endereço do Estaleiro de Destino *</label>
              <input
                type="text"
                required
                placeholder="ex: Av. Julius Nyerere, Parcela 402, Maputo"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
              />
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Resumo dos Materiais Despachados *</label>
              <textarea
                required
                rows={2}
                placeholder="ex: 100 Sacos Cimento Limpopo 42.5N + 2 Carradas Areia Grossa 10m³"
                value={itemsSummaryInput}
                onChange={(e) => setItemsSummaryInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Camião / Veículo de Carga</label>
                <input
                  type="text"
                  placeholder="ex: Camião Volvo 15 Ton"
                  value={truckInput}
                  onChange={(e) => setTruckInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Nome do Motorista</label>
                <input
                  type="text"
                  placeholder="ex: Eusébio Motorista"
                  value={driverInput}
                  onChange={(e) => setDriverInput(e.target.value)}
                  className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-ink/70 mb-1">Valor Total em Meticais (MT) *</label>
                <input
                  type="number"
                  required
                  placeholder="ex: 75000"
                  value={valueMTInput || ''}
                  onChange={(e) => setValueMTInput(Number(e.target.value))}
                  className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-serif font-bold text-sm outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-ink/70 mb-1">Estado de Pagamento</label>
                <select
                  value={payStatusInput}
                  onChange={(e) => setPayStatusInput(e.target.value as any)}
                  className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none"
                >
                  <option value="pago">💳 Pago Integralmente</option>
                  <option value="pendente_obra">⏳ Cobrar na Obra (Dinheiro/M-Pesa)</option>
                  <option value="faturado_quinzenal">📋 Faturado Quinzenal</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Notas / Instruções de Carga</label>
              <input
                type="text"
                placeholder="ex: Descarregar na entrada da obra com braço hidráulico"
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddGuiaModal(false)}
                className="py-2.5 px-4 bg-paper border border-ink/15 rounded-xl font-bold text-ink/70 hover:bg-sand-2/40 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Emitir Guia & Registar Saída</span>
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
