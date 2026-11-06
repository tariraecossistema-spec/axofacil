import React, { useState } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, Smartphone, 
  Building, CheckCircle2, Clock, Plus, Filter, Search, Download, 
  FileText, ShieldCheck, ArrowUpRight, ArrowDownRight, Eye, X,
  Receipt, Wallet, Edit3, Trash2
} from 'lucide-react';
import { PaymentRecord, FinancialTransaction, PaymentOrderRecord } from "../../types/types";
import { savePayments } from "../../data/data";
import { loadPaymentOrders, clearAllPaymentOrders } from "../../services/paymentStore";
import { notify, confirmDialog } from "../../services/dialogs";

interface AdminFinancialBillingProps {
  payments: PaymentRecord[];
  onPaymentsChange: (updated: PaymentRecord[]) => void;
}

export default function AdminFinancialBilling({
  payments,
  onPaymentsChange
}: AdminFinancialBillingProps) {
  const [methodFilter, setMethodFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentRecord | null>(null);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  // Form State
  const [newEstName, setNewEstName] = useState('');
  const [newPhone, setNewPhone] = useState('+258 87 142 5316');
  const [newAmount, setNewAmount] = useState('');
  const [newMethod, setNewMethod] = useState<'e-Mola' | 'M-Pesa' | 'Transferência BCI/BIM'>('e-Mola');
  const [newStatus, setNewStatus] = useState<'Aprovado' | 'Pendente' | 'Isento (15 Dias)'>('Aprovado');
  const [newRefNumber, setNewRefNumber] = useState('');
  const [newProofUrl, setNewProofUrl] = useState('');

  // Payment orders from catalog
  const catalogOrders = loadPaymentOrders();

  // Calculate stats
  let totalRevenueMT = 0;
  let totalIncomingOrdersMT = 0;

  payments.forEach(p => {
    const val = parseFloat(p.amount.replace(/[^0-9.]/g, '')) || 0;
    totalRevenueMT += val;
  });

  catalogOrders.forEach(o => {
    if (o.status === 'confirmado') {
      totalIncomingOrdersMT += (o.totalAmountMT || 0);
    }
  });

  const grossTotalMT = totalRevenueMT + totalIncomingOrdersMT;
  const estimatedCommissionsMT = Math.round(grossTotalMT * 0.15); // 15% platform margin
  const outcomingPayoutsMT = grossTotalMT - estimatedCommissionsMT;

  // Filter payments
  const filteredPayments = payments.filter(p => {
    if (methodFilter !== 'todos' && p.method !== methodFilter) return false;
    if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.establishmentName.toLowerCase().includes(q);
      const matchPhone = p.contactPhone.includes(q);
      const matchRef = (p.referenceNumber || '').toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchRef) return false;
    }
    return true;
  });

  const handleOpenCreatePayment = () => {
    setEditingPayment(null);
    setNewEstName('');
    setNewPhone('+258 87 142 5316');
    setNewAmount('');
    setNewMethod('e-Mola');
    setNewStatus('Aprovado');
    setNewRefNumber('');
    setNewProofUrl('');
    setShowAddModal(true);
  };

  const handleOpenEditPayment = (p: PaymentRecord) => {
    setEditingPayment(p);
    setNewEstName(p.establishmentName);
    setNewPhone(p.contactPhone);
    setNewAmount(p.amount);
    setNewMethod(p.method);
    setNewStatus(p.status);
    setNewRefNumber(p.referenceNumber || '');
    setNewProofUrl(p.proofUrl || '');
    setShowAddModal(true);
  };

  // Handle Add or Edit Payment
  const handleAddPayment = () => {
    if (!newEstName.trim()) {
      notify('Indique o nome da entidade ou loja pagadora.', 'warning');
      return;
    }
    if (!newAmount.trim()) {
      notify('Indique o valor do pagamento.', 'warning');
      return;
    }

    const formattedAmount = newAmount.includes('MT') ? newAmount : `${newAmount.trim()} MT`;

    if (editingPayment) {
      const updated = payments.map(p => p.id === editingPayment.id ? {
        ...p,
        establishmentName: newEstName.trim(),
        contactPhone: newPhone.trim() || '+258 87 142 5316',
        amount: formattedAmount,
        method: newMethod,
        status: newStatus,
        referenceNumber: newRefNumber.trim() || p.referenceNumber,
        proofUrl: newProofUrl.trim() || undefined
      } : p);
      onPaymentsChange(updated);
      savePayments(updated);
      setEditingPayment(null);
      setShowAddModal(false);
      notify('Registo financeiro atualizado com sucesso!', 'success');
      return;
    }

    const newRecord: PaymentRecord = {
      id: `pay-${Date.now().toString().slice(-6)}`,
      establishmentName: newEstName.trim(),
      contactPhone: newPhone.trim() || '+258 87 142 5316',
      amount: formattedAmount,
      date: new Date().toISOString().split('T')[0],
      method: newMethod,
      status: newStatus,
      referenceNumber: newRefNumber.trim() || `MAN.${Math.floor(10000 + Math.random() * 90000)}`,
      proofUrl: newProofUrl.trim() || undefined
    };

    const updated = [newRecord, ...payments];
    onPaymentsChange(updated);
    savePayments(updated);

    // Reset Form
    setNewEstName('');
    setNewAmount('');
    setNewRefNumber('');
    setNewProofUrl('');
    setShowAddModal(false);

    notify('Transação financeira registada com sucesso!', 'success');
  };

  const handleDeletePayment = async (p: PaymentRecord) => {
    const ok = await confirmDialog(
      `Tem certeza que deseja eliminar o registo de pagamento de "${p.establishmentName}" (${p.amount})?`,
      { title: 'Eliminar Registo Financeiro', confirmLabel: 'Eliminar', cancelLabel: 'Cancelar', danger: true }
    );
    if (!ok) return;
    const updated = payments.filter(item => item.id !== p.id);
    onPaymentsChange(updated);
    savePayments(updated);
    notify('Registo de pagamento eliminado.', 'info');
  };


  // Toggle status
  const handleToggleStatus = (id: string, currentStatus: PaymentRecord['status']) => {
    const nextStatus: PaymentRecord['status'] = currentStatus === 'Aprovado' ? 'Pendente' : 'Aprovado';
    const updated = payments.map(p => p.id === id ? { ...p, status: nextStatus } : p);
    onPaymentsChange(updated);
    savePayments(updated);
    notify(`Estado do pagamento atualizado para "${nextStatus}".`, 'info');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-[#0B254B] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Wallet className="w-3.5 h-3.5" />
            <span>Módulo Financeiro & Gestão de Faturamento</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Controlo de Faturamento, Incomings & Repasses
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mt-1">
            Gestão consolidada de pagamentos de subscrições, recebimentos via <strong>e-Mola (87 142 5316)</strong>, <strong>M-Pesa</strong> e <strong>BCI/BIM</strong>, comissões de catálogo e repasses a lojistas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreatePayment}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-[#0B254B] hover:bg-[#061833] text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-900/20 font-black whitespace-nowrap border border-blue-400/40"
          >
            <Plus className="w-4 h-4" />
            <span>Registar Novo Pagamento / Recibo</span>
          </button>
        </div>
      </div>

      {/* Financial Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Gross Revenue */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Faturamento Bruto Total</span>
            <span className="text-2xl font-serif font-black text-slate-900 mt-1 block">
              {grossTotalMT.toLocaleString()} MT
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Incomings Consolidados</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Platform Commission Margin */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Margem / Receita Líquida</span>
            <span className="text-2xl font-serif font-black text-emerald-700 mt-1 block">
              {estimatedCommissionsMT.toLocaleString()} MT
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Subscrições & Taxas Portal</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Outcoming Payouts to Merchants */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Repasses a Lojistas & Estafetas</span>
            <span className="text-2xl font-serif font-black text-indigo-950 mt-1 block">
              {outcomingPayoutsMT.toLocaleString()} MT
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />
              <span>Outcomings Operacionais</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-800 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        {/* Active Accounts & Payment Gateway */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gateway Principal e-Mola</span>
            <span className="text-sm font-mono font-black text-amber-700 mt-1 block">
              +258 87 142 5316
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Titular: Axofácil! Lojas Pro</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Method Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Método:</span>
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'e-Mola', label: 'e-Mola' },
            { id: 'M-Pesa', label: 'M-Pesa' },
            { id: 'Transferência BCI/BIM', label: 'BCI / BIM' }
          ].map((btn, bIdx) => (
            <button
              key={`pay-filter-${btn.id}-${bIdx}`}
              onClick={() => setMethodFilter(btn.id)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                methodFilter === btn.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search & Status Filter */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Pesquisar loja, telefone, ref..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-600 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="todos">Todos os Estados</option>
            <option value="Aprovado">Aprovados</option>
            <option value="Pendente">Pendentes</option>
            <option value="Isento (15 Dias)">Isento (15 Dias)</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Referência & Data</th>
                <th className="py-3.5 px-4">Loja / Cliente Pagador</th>
                <th className="py-3.5 px-4">Método de Pagamento</th>
                <th className="py-3.5 px-4">Valor (MT)</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4 text-right">Comprovativo / Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayments.map((p, pIdx) => {
                const isApproved = p.status === 'Aprovado';
                return (
                  <tr 
                    key={`pay-row-${p.id}-${pIdx}`}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    {/* Ref & Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-900 block">{p.referenceNumber || p.id}</span>
                      <span className="text-[11px] text-slate-400 mt-0.5 block">{p.date}</span>
                    </td>

                    {/* Store / Entity */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-bold text-slate-900 block">{p.establishmentName}</span>
                      <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">{p.contactPhone}</span>
                    </td>

                    {/* Method */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1 ${
                        p.method === 'e-Mola' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                        p.method === 'M-Pesa' ? 'bg-rose-100 text-rose-900 border border-rose-200' :
                        'bg-blue-100 text-blue-900 border border-blue-200'
                      }`}>
                        {p.method}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-serif font-black text-slate-900 text-sm block">{p.amount}</span>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(p.id, p.status)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                          isApproved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' :
                          p.status === 'Pendente' ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 animate-pulse' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                        title="Clique para alternar estado"
                      >
                        {isApproved && <CheckCircle2 className="w-3.5 h-3.5" />}
                        <span>{p.status}</span>
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.proofUrl && (
                          <button
                            onClick={() => setSelectedProof(p.proofUrl || null)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Comprovativo</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditPayment(p)}
                          className="p-1.5 rounded-xl text-[#0B254B] hover:bg-slate-100 transition-all cursor-pointer"
                          title="Editar registo de pagamento"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeletePayment(p)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Eliminar registo de pagamento"
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
      </div>

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-serif font-black text-slate-900 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-[#0B254B]" />
                <span>{editingPayment ? 'Editar Pagamento / Recibo' : 'Registar Novo Pagamento / Recibo'}</span>
              </h3>
              <button
                onClick={() => { setShowAddModal(false); setEditingPayment(null); }}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nome da Loja / Cliente Pagador *
                </label>
                <input
                  type="text"
                  value={newEstName}
                  onChange={(e) => setNewEstName(e.target.value)}
                  placeholder="ex: Boutique Elegance Maputo / Supermercado Zimpeto"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Valor do Pagamento *
                  </label>
                  <input
                    type="text"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="ex: 3500 MT"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Método de Pagamento
                  </label>
                  <select
                    value={newMethod}
                    onChange={(e) => setNewMethod(e.target.value as any)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 outline-none cursor-pointer"
                  >
                    <option value="e-Mola">e-Mola (87 142 5316)</option>
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="Transferência BCI/BIM">Transferência BCI/BIM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Telefone de Contacto
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+258 87 142 5316"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Número de Referência / Talão
                  </label>
                  <input
                    type="text"
                    value={newRefNumber}
                    onChange={(e) => setNewRefNumber(e.target.value)}
                    placeholder="ex: EML871425.9921"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  URL do Comprovativo (Opcional)
                </label>
                <input
                  type="url"
                  value={newProofUrl}
                  onChange={(e) => setNewProofUrl(e.target.value)}
                  placeholder="https://exemplo.com/talao.jpg"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddPayment}
                className="px-6 py-2 bg-[#0B254B] hover:bg-[#061833] text-white font-black text-xs rounded-xl cursor-pointer shadow-md"
              >
                Guardar Registo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {selectedProof && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm">Comprovativo de Pagamento</h4>
              <button
                onClick={() => setSelectedProof(null)}
                className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-[70vh]">
              <img
                src={selectedProof}
                alt="Comprovativo"
                className="max-h-[70vh] object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
