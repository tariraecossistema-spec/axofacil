import { AdminSubmission, UserProfile, Establishment, CommercialInquiry } from '../types/types';
import { getSupabaseClient } from './supabase';
import { notify } from './dialogs';

export interface AdminActionRecord {
  id: string;
  type: 'registo_conta' | 'registo_loja' | 'reserva_hospedagem' | 'reserva_turismo' | 'consulta_comercial' | 'pedido_compra' | 'cotacao_pecas' | 'interesse_parceiro' | 'outro';
  title: string;
  userName: string;
  userContact: string;
  userEmail?: string;
  categoryOrSegment?: string;
  amountMT?: number;
  details: string;
  status: 'Pendente' | 'Aprovado' | 'Confirmado' | 'Rejeitado';
  timestamp: string;
  metadata?: Record<string, any>;
  confirmedAt?: string;
  confirmedBy?: string;
  adminNotes?: string;
}

const STORAGE_KEY_ACTIONS = 'axofacil_admin_activity_log';
const STORAGE_KEY_SUBMISSIONS = 'axofacil_submissions';
const STORAGE_KEY_INQUIRIES = 'axofacil_commercial_inquiries';

/**
 * Carrega todas as ações e registos do log de auditoria
 */
export function loadAdminActions(): AdminActionRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIONS);
    if (!raw) return [];
    const list: AdminActionRecord[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) : [];
  } catch (e) {
    console.warn('[AdminAudit] Erro ao carregar ações:', e);
    return [];
  }
}

/**
 * Grava uma ação, registo ou submissão no Painel do Administrador e sincroniza com o Supabase
 */
export function recordAdminAction(data: {
  id?: string;
  type: AdminActionRecord['type'];
  title: string;
  userName: string;
  userContact: string;
  userEmail?: string;
  categoryOrSegment?: string;
  amountMT?: number;
  details: string;
  status?: AdminActionRecord['status'];
  timestamp?: string;
  metadata?: Record<string, any>;
}): AdminActionRecord {
  const newAction: AdminActionRecord = {
    id: data.id || `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    type: data.type,
    title: data.title,
    userName: data.userName || 'Utilizador do Portal',
    userContact: data.userContact || 'N/A',
    userEmail: data.userEmail,
    categoryOrSegment: data.categoryOrSegment || 'Geral',
    amountMT: data.amountMT,
    details: data.details,
    status: data.status || 'Pendente',
    timestamp: data.timestamp || new Date().toISOString(),
    metadata: data.metadata || {}
  };

  try {
    // 1. Grava no registo de auditoria central
    const existing = loadAdminActions();
    const updated = [newAction, ...existing.filter(a => a.id !== newAction.id)].slice(0, 300);
    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(updated));

    // 2. Garante que se for registo de conta, loja, bar, hospedagem ou qualquer submissão,
    // também é inserido na lista de Submissões & Pedidos do Painel Admin
    if (
      data.type === 'registo_conta' ||
      data.type === 'registo_loja' ||
      data.type === 'reserva_hospedagem' ||
      data.type === 'reserva_turismo' ||
      data.type === 'interesse_parceiro'
    ) {
      try {
        const rawSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
        const subList: AdminSubmission[] = rawSubs ? JSON.parse(rawSubs) : [];
        
        const mappedSub: AdminSubmission = {
          id: `sub_${newAction.id}`,
          type: data.type === 'interesse_parceiro' ? 'parceiro' : ((data.categoryOrSegment as any) || 'loja'),
          name: data.userName,
          contact: data.userContact,
          date: newAction.timestamp.split('T')[0],
          status: newAction.status === 'Confirmado' || newAction.status === 'Aprovado' ? 'Aprovado' : 'Pendente',
          details: `[${newAction.title}] ${newAction.details}`,
          imageUrl: data.metadata?.imageUrl || undefined
        };

        const updatedSubs = [mappedSub, ...subList.filter(s => s.id !== mappedSub.id)];
        localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updatedSubs));
      } catch (subErr) {
        console.warn('[AdminAudit] Erro ao espelhar em axofacil_submissions:', subErr);
      }
    }

    // 3. Se for reserva de hospedagem ou turismo, espelha em axofacil_commercial_inquiries
    if (data.type === 'reserva_hospedagem' || data.type === 'reserva_turismo') {
      try {
        const rawInqs = localStorage.getItem(STORAGE_KEY_INQUIRIES);
        const inqList: CommercialInquiry[] = rawInqs ? JSON.parse(rawInqs) : [];
        
        const mappedInq: CommercialInquiry = {
          id: `inq_${newAction.id}`,
          fullName: data.userName,
          email: data.userEmail || `${data.userContact.replace(/\D/g, '')}@axofacil.co.mz`,
          phone: data.userContact,
          department: data.categoryOrSegment || 'hospedagens',
          departmentLabel: data.title,
          title: data.title,
          details: data.details,
          status: 'Novo',
          createdAt: newAction.timestamp
        };

        const updatedInqs = [mappedInq, ...inqList.filter(i => i.id !== mappedInq.id)];
        localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updatedInqs));
      } catch (inqErr) {
        console.warn('[AdminAudit] Erro ao espelhar em axofacil_commercial_inquiries:', inqErr);
      }
    }

    // 4. Dispara eventos de atualização imediata para todos os componentes do Admin
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axofacil_admin_activity_updated', { detail: newAction }));
      window.dispatchEvent(new Event('axofacil_submissions_updated'));
      window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
      window.dispatchEvent(new Event('axofacil_users_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    // 5. Tenta sincronização assíncrona com a base de dados do Supabase
    const client = getSupabaseClient();
    if (client) {
      Promise.resolve(
        client.from('admin_logs').insert({
          id: newAction.id,
          action_type: newAction.type,
          title: newAction.title,
          user_name: newAction.userName,
          user_contact: newAction.userContact,
          user_email: newAction.userEmail || null,
          category: newAction.categoryOrSegment || null,
          amount_mt: newAction.amountMT || null,
          details: newAction.details,
          status: newAction.status,
          metadata: newAction.metadata,
          created_at: newAction.timestamp
        })
      )
        .then((res: any) => {
          if (res?.error) {
            console.debug('[Supabase Admin Log Sync]:', res.error.message);
          }
        })
        .catch(() => {});
    }
  } catch (err) {
    console.warn('[AdminAudit] Erro ao persistir ação de auditoria:', err);
  }

  return newAction;
}

/**
 * Validação / Confirmação pelo Administrador no Painel
 */
export function confirmAdminAction(actionId: string, adminNotes?: string): boolean {
  try {
    const list = loadAdminActions();
    let target = list.find(a => a.id === actionId);
    
    // Se o actionId vier com prefixo sub_, tenta encontrar
    if (!target && actionId.startsWith('sub_')) {
      const cleanId = actionId.replace('sub_', '');
      target = list.find(a => a.id === cleanId);
    }

    const nowStr = new Date().toISOString();

    const updatedList = list.map(item => {
      if (item.id === actionId || `sub_${item.id}` === actionId) {
        return {
          ...item,
          status: 'Confirmado' as const,
          confirmedAt: nowStr,
          adminNotes: adminNotes || item.adminNotes || 'Ação confirmada e validada pelo Administrador'
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(updatedList));

    // Também atualiza em axofacil_submissions se existir
    try {
      const rawSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (rawSubs) {
        const subs: AdminSubmission[] = JSON.parse(rawSubs);
        const updatedSubs = subs.map(s => {
          if (s.id === actionId || s.id === `sub_${actionId}` || actionId.includes(s.id)) {
            return { ...s, status: 'Aprovado' as const };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updatedSubs));
      }
    } catch (_) {}

    // Também atualiza em axofacil_commercial_inquiries se existir
    try {
      const rawInqs = localStorage.getItem(STORAGE_KEY_INQUIRIES);
      if (rawInqs) {
        const inqs: CommercialInquiry[] = JSON.parse(rawInqs);
        const updatedInqs = inqs.map(i => {
          if (i.id === actionId || i.id === `inq_${actionId}` || actionId.includes(i.id)) {
            return { ...i, status: 'Aprovado' as any };
          }
          return i;
        });
        localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updatedInqs));
      }
    } catch (_) {}

    // Notifica e dispara eventos
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axofacil_admin_activity_updated'));
      window.dispatchEvent(new Event('axofacil_submissions_updated'));
      window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
      window.dispatchEvent(new Event('axofacil_users_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    notify('Ação confirmada e validada com sucesso pelo Administrador!', 'success');
    return true;
  } catch (err) {
    console.error('[AdminAudit] Erro ao confirmar ação:', err);
    notify('Erro ao confirmar ação.', 'error');
    return false;
  }
}

/**
 * Rejeição pelo Administrador no Painel
 */
export function rejectAdminAction(actionId: string, reason?: string): boolean {
  try {
    const list = loadAdminActions();
    const nowStr = new Date().toISOString();

    const updatedList = list.map(item => {
      if (item.id === actionId || `sub_${item.id}` === actionId) {
        return {
          ...item,
          status: 'Rejeitado' as const,
          confirmedAt: nowStr,
          adminNotes: reason || 'Rejeitado pelo Administrador'
        };
      }
      return item;
    });

    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(updatedList));

    // Atualiza em submissions
    try {
      const rawSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (rawSubs) {
        const subs: AdminSubmission[] = JSON.parse(rawSubs);
        const updatedSubs = subs.map(s => {
          if (s.id === actionId || s.id === `sub_${actionId}` || actionId.includes(s.id)) {
            return { ...s, status: 'Rejeitado' as const };
          }
          return s;
        });
        localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updatedSubs));
      }
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axofacil_admin_activity_updated'));
      window.dispatchEvent(new Event('axofacil_submissions_updated'));
      window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    }

    notify('Ação marcada como Rejeitada no painel.', 'info');
    return true;
  } catch (err) {
    console.error('[AdminAudit] Erro ao rejeitar ação:', err);
    notify('Erro ao rejeitar ação.', 'error');
    return false;
  }
}

/**
 * Elimina um registo individual do feed de auditoria / incomings
 */
export function deleteAdminAction(actionId: string): boolean {
  try {
    const cleanId = actionId.replace(/^(sub_|inq_)/, '');
    const list = loadAdminActions();
    const updatedList = list.filter(
      item => item.id !== actionId && item.id !== cleanId && `sub_${item.id}` !== actionId && `inq_${item.id}` !== actionId
    );
    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify(updatedList));

    try {
      const rawSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
      if (rawSubs) {
        const subs: AdminSubmission[] = JSON.parse(rawSubs);
        const updatedSubs = subs.filter(
          s => s.id !== actionId && s.id !== `sub_${cleanId}` && s.id !== cleanId
        );
        localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(updatedSubs));
      }
    } catch (_) {}

    try {
      const rawInqs = localStorage.getItem(STORAGE_KEY_INQUIRIES);
      if (rawInqs) {
        const inqs: CommercialInquiry[] = JSON.parse(rawInqs);
        const updatedInqs = inqs.filter(
          i => i.id !== actionId && i.id !== `inq_${cleanId}` && i.id !== cleanId
        );
        localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify(updatedInqs));
      }
    } catch (_) {}

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axofacil_admin_activity_updated'));
      window.dispatchEvent(new Event('axofacil_submissions_updated'));
      window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    }
    return true;
  } catch (err) {
    console.error('[AdminAudit] Erro ao eliminar ação:', err);
    return false;
  }
}

/**
 * Limpa todos os registos de teste/incomings do feed de auditoria, consultas e submissões
 */
export function clearAllAdminActions(): void {
  try {
    localStorage.setItem(STORAGE_KEY_ACTIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEY_INQUIRIES, JSON.stringify([]));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('axofacil_admin_activity_updated'));
      window.dispatchEvent(new Event('axofacil_submissions_updated'));
      window.dispatchEvent(new Event('axofacil_payment_orders_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  } catch (err) {
    console.error('[AdminAudit] Erro ao limpar histórico de ações:', err);
  }
}
