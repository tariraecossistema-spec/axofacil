import React, { useState, useEffect } from 'react';
import { 
  Inbox, MessageSquare, ShoppingBag, Store, Plane, AlertCircle, 
  CheckCircle2, Clock, Phone, Mail, ExternalLink, Filter, Search, 
  Send, RefreshCw, Eye, Check, X, ShieldAlert, ArrowRight, User,
  FileText, DollarSign, Calendar, Trash2
} from 'lucide-react';
import { CommercialInquiry, PaymentOrderRecord, AdminSubmission, OrderRecord } from "../../types/types";
import { loadPaymentOrders, savePaymentOrders, deletePaymentOrder, clearAllPaymentOrders } from "../../services/paymentStore";
import { loadAdminActions, confirmAdminAction, rejectAdminAction, deleteAdminAction, clearAllAdminActions } from "../../services/adminAuditStore";
import { notify, confirmDialog } from "../../services/dialogs";

interface AdminIncomingsCenterProps {
  onRefreshStats?: () => void;
}

export type IncomingType = 'todos' | 'consulta' | 'pedido' | 'submissao' | 'registro' | 'voo';

export interface UnifiedIncoming {
  id: string;
  type: 'consulta' | 'pedido' | 'submissao' | 'registro' | 'voo';
  title: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  amountMT?: number;
  categoryOrDept?: string;
  details: string;
  status: 'Novo' | 'Pendente' | 'Em Análise' | 'Aprovado' | 'Respondido' | 'Concluído' | 'Rejeitado';
  createdAt: string;
  proofUrl?: string;
  referenceNumber?: string;
  rawItem: any;
}

export default function AdminIncomingsCenter({ onRefreshStats }: AdminIncomingsCenterProps) {
  const [incomings, setIncomings] = useState<UnifiedIncoming[]>([]);
  const [filterType, setFilterType] = useState<IncomingType>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncoming, setSelectedIncoming] = useState<UnifiedIncoming | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load all incomings from local stores
  const loadAllIncomings = () => {
    const list: UnifiedIncoming[] = [];

    // 1. Commercial Inquiries (Consultas Online dos Menus)
    try {
      const rawConsultations = localStorage.getItem('axofacil_commercial_inquiries');
      if (rawConsultations) {
        const inquiries: CommercialInquiry[] = JSON.parse(rawConsultations);
        inquiries.forEach(inq => {
          list.push({
            id: inq.id,
            type: 'consulta',
            title: inq.title || `Consulta Comercial: ${inq.departmentLabel || inq.department}`,
            customerName: inq.fullName,
            customerPhone: inq.phone,
            customerEmail: inq.email,
            categoryOrDept: inq.departmentLabel || inq.department,
            details: inq.details,
            status: (inq.status as any) || 'Novo',
            createdAt: inq.createdAt,
            rawItem: inq
          });
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar consultas:', e);
    }

    // 2. Catalog Payment Orders (Pedidos de Compras Rápidas com e-Mola / M-Pesa / BCI)
    try {
      const paymentOrders = loadPaymentOrders();
      paymentOrders.forEach(ord => {
        let mappedStatus: UnifiedIncoming['status'] = 'Pendente';
        if (ord.status === 'confirmado') mappedStatus = 'Aprovado';
        else if (ord.status === 'rejeitado') mappedStatus = 'Rejeitado';

        list.push({
          id: ord.id,
          type: 'pedido',
          title: `Pedido de Compra: ${ord.establishmentName}`,
          customerName: ord.customerName,
          customerPhone: ord.customerPhone,
          customerEmail: ord.customerEmail,
          amountMT: ord.totalAmountMT,
          categoryOrDept: ord.targetType === 'plataforma' ? 'Subscrição da Plataforma' : ord.establishmentName,
          details: `${ord.orderItemsSummary} | Método: ${ord.paymentMethod.toUpperCase()} | Ref: ${ord.referenceNumber || 'N/A'}${ord.deliveryAddress ? ` | Entrega: ${ord.deliveryAddress}` : ''}`,
          status: mappedStatus,
          createdAt: ord.createdAt,
          proofUrl: ord.proofUrl,
          referenceNumber: ord.referenceNumber,
          rawItem: ord
        });
      });
    } catch (e) {
      console.warn('Erro ao carregar pedidos de pagamento:', e);
    }

    // 3. Business Submissions (Cadastros de Novos Estabelecimentos)
    try {
      const rawSubmissions = localStorage.getItem('axofacil_submissions');
      if (rawSubmissions) {
        const submissions: AdminSubmission[] = JSON.parse(rawSubmissions);
        submissions.forEach(sub => {
          let mappedStatus: UnifiedIncoming['status'] = 'Pendente';
          if (sub.status === 'Aprovado') mappedStatus = 'Aprovado';
          else if (sub.status === 'Rejeitado') mappedStatus = 'Rejeitado';

          list.push({
            id: sub.id,
            type: 'submissao',
            title: `Registo de Estabelecimento: ${sub.name}`,
            customerName: sub.name,
            customerPhone: sub.contact,
            categoryOrDept: sub.type.toUpperCase(),
            details: sub.details,
            status: mappedStatus,
            createdAt: sub.date,
            proofUrl: sub.imageUrl,
            rawItem: sub
          });
        });
      }
    } catch (e) {
      console.warn('Erro ao carregar submissões:', e);
    }

    // 4. Central Audit & Front-end Registrations (Registo de Contas, Perfis de Lojas, Bares, Check-ins Hospedagem)
    try {
      const actions = loadAdminActions();
      actions.forEach(act => {
        const alreadyExists = list.some(item => item.id === act.id || item.id === `sub_${act.id}` || item.id === `inq_${act.id}`);
        if (!alreadyExists) {
          let mappedType: UnifiedIncoming['type'] = 'registro';
          if (act.type === 'reserva_hospedagem' || act.type === 'reserva_turismo') mappedType = 'consulta';
          else if (act.type === 'pedido_compra') mappedType = 'pedido';
          else if (act.type === 'registo_loja' || act.type === 'registo_conta') mappedType = 'registro';

          let mappedStatus: UnifiedIncoming['status'] = 'Pendente';
          if (act.status === 'Confirmado' || act.status === 'Aprovado') mappedStatus = 'Aprovado';
          else if (act.status === 'Rejeitado') mappedStatus = 'Rejeitado';

          list.push({
            id: act.id,
            type: mappedType,
            title: act.title,
            customerName: act.userName,
            customerPhone: act.userContact,
            customerEmail: act.userEmail,
            amountMT: act.amountMT,
            categoryOrDept: act.categoryOrSegment?.toUpperCase() || 'REGISTO',
            details: act.details,
            status: mappedStatus,
            createdAt: act.timestamp,
            rawItem: act
          });
        }
      });
    } catch (e) {
      console.warn('Erro ao carregar ações centrais:', e);
    }

    // Sort newest first
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setIncomings(list);
  };

  useEffect(() => {
    loadAllIncomings();
    const handleUpdate = () => loadAllIncomings();
    window.addEventListener('axofacil_payment_orders_updated', handleUpdate);
    window.addEventListener('axofacil_admin_activity_updated', handleUpdate);
    window.addEventListener('axofacil_submissions_updated', handleUpdate);
    window.addEventListener('axofacil_users_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('axofacil_payment_orders_updated', handleUpdate);
      window.removeEventListener('axofacil_admin_activity_updated', handleUpdate);
      window.removeEventListener('axofacil_submissions_updated', handleUpdate);
      window.removeEventListener('axofacil_users_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Update Status Action
  const handleUpdateStatus = (incoming: UnifiedIncoming, newStatus: UnifiedIncoming['status']) => {
    setIsUpdating(true);
    try {
      if (incoming.type === 'consulta') {
        const rawConsultations = localStorage.getItem('axofacil_commercial_inquiries');
        if (rawConsultations) {
          const list: CommercialInquiry[] = JSON.parse(rawConsultations);
          const updated = list.map(c => c.id === incoming.id ? { ...c, status: newStatus as any } : c);
          localStorage.setItem('axofacil_commercial_inquiries', JSON.stringify(updated));
        }
      } else if (incoming.type === 'pedido') {
        const orders = loadPaymentOrders();
        let targetStatus: PaymentOrderRecord['status'] = 'pendente';
        if (newStatus === 'Aprovado' || newStatus === 'Concluído') targetStatus = 'confirmado';
        else if (newStatus === 'Rejeitado') targetStatus = 'rejeitado';

        const updated = orders.map(o => o.id === incoming.id ? {
          ...o,
          status: targetStatus,
          adminNotes: adminNote ? adminNote : o.adminNotes,
          confirmedAt: targetStatus === 'confirmado' ? new Date().toISOString() : o.confirmedAt
        } : o);
        savePaymentOrders(updated);
      } else if (incoming.type === 'submissao') {
        const rawSubmissions = localStorage.getItem('axofacil_submissions');
        if (rawSubmissions) {
          const list: AdminSubmission[] = JSON.parse(rawSubmissions);
          const updated = list.map(s => s.id === incoming.id ? { ...s, status: newStatus as any } : s);
          localStorage.setItem('axofacil_submissions', JSON.stringify(updated));
        }
      }

      // Also confirm/reject in central admin audit store
      if (incoming.type === 'registro' || incoming.id.startsWith('act_')) {
        if (newStatus === 'Aprovado' || newStatus === 'Concluído') {
          confirmAdminAction(incoming.id, adminNote);
        } else if (newStatus === 'Rejeitado') {
          rejectAdminAction(incoming.id, adminNote);
        }
      }

      loadAllIncomings();
      if (selectedIncoming?.id === incoming.id) {
        setSelectedIncoming({ ...incoming, status: newStatus });
      }
      notify(`Estado do incoming atualizado para "${newStatus}"!`, 'success');
      if (onRefreshStats) onRefreshStats();
    } catch (e) {
      console.error(e);
      notify('Erro ao atualizar estado.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete single incoming item
  const handleDeleteIncoming = async (incoming: UnifiedIncoming) => {
    const ok = await confirmDialog(
      `Tem certeza que deseja eliminar permanentemente o registo "${incoming.title}" (${incoming.customerName})?`,
      { title: 'Eliminar Registo', confirmLabel: 'Sim, Eliminar', cancelLabel: 'Cancelar', danger: true }
    );
    if (!ok) return;

    try {
      if (incoming.type === 'consulta') {
        const rawConsultations = localStorage.getItem('axofacil_commercial_inquiries');
        if (rawConsultations) {
          const list: CommercialInquiry[] = JSON.parse(rawConsultations);
          const updated = list.filter(c => c.id !== incoming.id);
          localStorage.setItem('axofacil_commercial_inquiries', JSON.stringify(updated));
        }
      } else if (incoming.type === 'pedido') {
        deletePaymentOrder(incoming.id);
      } else if (incoming.type === 'submissao') {
        const rawSubmissions = localStorage.getItem('axofacil_submissions');
        if (rawSubmissions) {
          const list: AdminSubmission[] = JSON.parse(rawSubmissions);
          const updated = list.filter(s => s.id !== incoming.id);
          localStorage.setItem('axofacil_submissions', JSON.stringify(updated));
        }
      }

      deleteAdminAction(incoming.id);

      if (selectedIncoming?.id === incoming.id) {
        setSelectedIncoming(null);
      }
      loadAllIncomings();
      if (onRefreshStats) onRefreshStats();
      notify('Registo eliminado com sucesso.', 'info');
    } catch (e) {
      console.error(e);
      notify('Erro ao eliminar registo.', 'error');
    }
  };


  // Open WhatsApp with pre-filled message
  const handleOpenWhatsApp = (incoming: UnifiedIncoming) => {
    let cleanPhone = incoming.customerPhone.replace(/\D/g, '');
    if (!cleanPhone.startsWith('258') && cleanPhone.length === 9) {
      cleanPhone = `258${cleanPhone}`;
    }
    const greeting = `Olá ${incoming.customerName}! Recebemos a sua solicitação no Portal Axofácil! Moçambique (Ref: ${incoming.id}). Estamos a entrar em contacto para dar o devido seguimento.`;
    const encoded = encodeURIComponent(greeting);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, '_blank');
  };

  // Filtered list
  const filteredIncomings = incomings.filter(item => {
    if (filterType !== 'todos' && item.type !== filterType) return false;
    if (statusFilter !== 'todos' && item.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.customerName.toLowerCase().includes(q);
      const matchPhone = item.customerPhone.includes(q);
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchDetails = item.details.toLowerCase().includes(q);
      const matchId = item.id.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchTitle && !matchDetails && !matchId) return false;
    }
    return true;
  });

  // Calculate quick stats
  const totalIncomings = incomings.length;
  const newConsultasCount = incomings.filter(i => i.type === 'consulta' && (i.status === 'Novo' || i.status === 'Pendente')).length;
  const pendingOrdersCount = incomings.filter(i => i.type === 'pedido' && i.status === 'Pendente').length;
  const pendingSubmissionsCount = incomings.filter(i => i.type === 'submissao' && i.status === 'Pendente').length;
  const totalIncomingValueMT = incomings.filter(i => i.type === 'pedido' && i.amountMT).reduce((acc, curr) => acc + (curr.amountMT || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0B254B] via-[#0D2F5D] to-[#081B38] rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2">
            <Inbox className="w-3.5 h-3.5" />
            <span>Central Unificada de Atendimento Comercial & Incomings</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Recepção de Consultas, Pedidos & Incomings
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mt-1">
            Controle todas as solicitações comerciais dos botões &quot;Consulta Online&quot;, pedidos de compra de catálogo, pagamentos via e-Mola / M-Pesa e novos registos num único fluxo central.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadAllIncomings}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Consultas Online Novas</span>
            <span className="text-2xl font-serif font-black text-indigo-900 mt-1 block">{newConsultasCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Turismo, Lojas, Peças, etc.</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pedidos de Catálogo</span>
            <span className="text-2xl font-serif font-black text-emerald-700 mt-1 block">{pendingOrdersCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Aguardam confirmação</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cadastros Pendentes</span>
            <span className="text-2xl font-serif font-black text-amber-700 mt-1 block">{pendingSubmissionsCount}</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Lojas & Serviços</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Valor Total de Pedidos</span>
            <span className="text-xl font-serif font-black text-slate-900 mt-1 block">{totalIncomingValueMT.toLocaleString()} MT</span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Receitas de Vendas/Planos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-slate-900 flex items-center justify-center font-bold border border-blue-200">
            <DollarSign className="w-5 h-5 text-[#0B254B]" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
        
        {/* Type Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Tipo:</span>
          </span>
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'registro', label: 'Registos Front-End' },
            { id: 'consulta', label: 'Consultas Online' },
            { id: 'pedido', label: 'Pedidos de Compra' },
            { id: 'submissao', label: 'Cadastros' },
          ].map((tab, idx) => (
            <button
              key={`incoming-tab-${tab.id}-${idx}`}
              onClick={() => setFilterType(tab.id as IncomingType)}
              className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
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
              placeholder="Pesquisar por cliente, telefone, ref..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:border-indigo-600 outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="todos">Todos os Estados</option>
            <option value="novo">Novos / Pendentes</option>
            <option value="aprovado">Aprovados / Confirmados</option>
            <option value="concluido">Concluídos / Respondidos</option>
            <option value="rejeitado">Rejeitados</option>
          </select>
        </div>
      </div>

      {/* Main Table / Grid View */}
      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
        {filteredIncomings.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">Nenhum incoming encontrado</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Não existem solicitações que correspondam aos filtros selecionados. As consultas feitas através dos banners e compras de catálogo aparecerão automaticamente aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">Ref / Data</th>
                  <th className="py-3.5 px-4">Tipo & Título</th>
                  <th className="py-3.5 px-4">Cliente & Contacto</th>
                  <th className="py-3.5 px-4">Departamento / Valor</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncomings.map((item, idx) => {
                  const isNew = item.status === 'Novo' || item.status === 'Pendente';
                  return (
                    <tr 
                      key={`incoming-row-${item.id}-${idx}`}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* ID & Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-slate-900 block">{item.id}</span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>{item.createdAt.slice(0, 16).replace('T', ' ')}</span>
                        </span>
                      </td>

                      {/* Type & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            item.type === 'consulta' ? 'bg-indigo-100 text-indigo-800' :
                            item.type === 'pedido' ? 'bg-emerald-100 text-emerald-800' :
                            item.type === 'submissao' ? 'bg-amber-100 text-amber-800' : 'bg-cyan-100 text-cyan-800'
                          }`}>
                            {item.type === 'consulta' ? 'Consulta Online' :
                             item.type === 'pedido' ? 'Pedido Catálogo' :
                             item.type === 'submissao' ? 'Submissão' : 'Viagem'}
                          </span>
                        </div>
                        <span className="font-bold text-slate-900 line-clamp-1 mt-1 block">
                          {item.title}
                        </span>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-bold text-slate-800 block">{item.customerName}</span>
                        <div className="flex items-center gap-2 text-slate-500 mt-0.5">
                          <span className="font-mono">{item.customerPhone}</span>
                          {item.customerEmail && (
                            <span className="text-slate-400 text-[10px]">({item.customerEmail})</span>
                          )}
                        </div>
                      </td>

                      {/* Dept / Amount */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {item.amountMT ? (
                          <div>
                            <span className="font-serif font-black text-slate-900 block">{item.amountMT.toLocaleString()} MT</span>
                            <span className="text-[10px] text-slate-400">{item.categoryOrDept}</span>
                          </div>
                        ) : (
                          <span className="text-slate-700 font-medium">{item.categoryOrDept || 'Geral'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          item.status === 'Aprovado' || item.status === 'Concluído' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          item.status === 'Novo' || item.status === 'Pendente' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          item.status === 'Em Análise' || item.status === 'Respondido' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                          'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenWhatsApp(item)}
                            className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-all cursor-pointer"
                            title="Contactar Cliente no WhatsApp"
                          >
                            <Phone className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedIncoming(item)}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalhes</span>
                          </button>

                          <button
                            onClick={() => handleDeleteIncoming(item)}
                            className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Eliminar este registo"
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

      {/* Detailed Drawer / Modal */}
      {selectedIncoming && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 bg-slate-950 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <span className="text-[10px] font-mono font-bold text-blue-300 uppercase tracking-widest block">
                  Incoming #{selectedIncoming.id}
                </span>
                <h3 className="text-lg font-serif font-black text-white mt-0.5">
                  {selectedIncoming.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedIncoming(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Customer Info Card */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nome do Cliente:</span>
                  <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <User className="w-4 h-4 text-indigo-600" />
                    <span>{selectedIncoming.customerName}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Telefone / WhatsApp:</span>
                  <span className="text-sm font-mono font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>{selectedIncoming.customerPhone}</span>
                  </span>
                </div>

                {selectedIncoming.customerEmail && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Email:</span>
                    <span className="text-xs text-slate-700 flex items-center gap-1.5 mt-0.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{selectedIncoming.customerEmail}</span>
                    </span>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Data da Solicitação:</span>
                  <span className="text-xs text-slate-700 flex items-center gap-1.5 mt-0.5">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span>{selectedIncoming.createdAt}</span>
                  </span>
                </div>
              </div>

              {/* Details & Request Text */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Descrição & Conteúdo do Pedido:
                </span>
                <div className="p-4 bg-slate-100/70 border border-slate-200 rounded-2xl text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {selectedIncoming.details}
                </div>
              </div>

              {/* Proof Image / Attachment if exists */}
              {selectedIncoming.proofUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Comprovativo / Imagem Anexada:
                  </span>
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 max-h-60 bg-slate-950 flex items-center justify-center">
                    <img
                      src={selectedIncoming.proofUrl}
                      alt="Comprovativo"
                      className="max-h-60 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              )}

              {/* Status Update & Actions */}
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Gerir Estado do Incoming & Resposta:
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedIncoming, 'Aprovado')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>Aprovar / Confirmar</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedIncoming, 'Respondido')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Send className="w-4 h-4" />
                    <span>Marcar como Respondido</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedIncoming, 'Concluído')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Concluir</span>
                  </button>

                  <button
                    onClick={() => handleUpdateStatus(selectedIncoming, 'Rejeitado')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <X className="w-4 h-4" />
                    <span>Rejeitar</span>
                  </button>

                  <button
                    onClick={() => handleDeleteIncoming(selectedIncoming)}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(selectedIncoming)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ml-auto shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Falar no WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedIncoming(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
