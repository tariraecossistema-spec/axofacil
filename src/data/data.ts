import { Establishment, PromoDeal, PaymentRecord, AdminSubmission, DeliveryPartner, OrderRecord, CustomerRecord, FinancialTransaction, InventoryItem, StockMovementRecord, BarTable, OperatorLoginRecord } from '../types/types';
import { recordOfflineChange } from '../services/offlineSync';
import { ensureEstablishmentCatalog } from './establishmentCatalog';
import { syncEstablishmentToSupabase, syncOrderToSupabase, syncFinancialTxToSupabase, syncInventoryItemToSupabase, syncDeliveryPartnerToSupabase } from '../services/supabase';

export const initialInventoryItems: InventoryItem[] = [];

export const initialBarTables: BarTable[] = [];

export const initialOperatorLogins: OperatorLoginRecord[] = [];

export function getDeletedInventoryItemKeys(): Set<string> {
  try {
    const raw = localStorage.getItem('axofacil_deleted_inventory_items');
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markInventoryItemDeleted(itemId: string, establishmentId?: string, itemName?: string) {
  try {
    const keys = getDeletedInventoryItemKeys();
    if (itemId) keys.add(itemId);
    if (establishmentId && itemName) {
      keys.add(`${establishmentId}:${itemName.toLowerCase().trim()}`);
    }
    localStorage.setItem('axofacil_deleted_inventory_items', JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao marcar artigo de inventário como excluído:', e);
  }
}

export function isInventoryItemDeleted(itemId: string, establishmentId?: string, itemName?: string): boolean {
  const keys = getDeletedInventoryItemKeys();
  if (itemId && keys.has(itemId)) return true;
  if (establishmentId && itemName && keys.has(`${establishmentId}:${itemName.toLowerCase().trim()}`)) return true;
  return false;
}

export function getDeletedEstablishmentIds(): Set<string> {
  try {
    const raw = localStorage.getItem('axofacil_deleted_establishments');
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function loadInventoryItems(): InventoryItem[] {
  const saved = localStorage.getItem('axofacil_inventory_items');
  const deletedKeys = getDeletedInventoryItemKeys();
  const deletedEstIds = getDeletedEstablishmentIds();
  const validEstIds = new Set(['l1', 's1', 'c1']);

  const isItemValidAndNotDeleted = (i: InventoryItem) =>
    !deletedEstIds.has(i.establishmentId) &&
    !deletedKeys.has(i.id) &&
    !deletedKeys.has(`${i.establishmentId}:${i.name.toLowerCase().trim()}`);

  if (!saved) {
    return initialInventoryItems.filter(isItemValidAndNotDeleted);
  }
  try {
    const parsed: InventoryItem[] = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return initialInventoryItems.filter(isItemValidAndNotDeleted);
    }

    // Filter out items from deleted/fictitious stores and explicitly deleted items
    const activeParsed = parsed.filter(i =>
      (validEstIds.has(i.establishmentId) || i.establishmentId.startsWith('est_')) &&
      isItemValidAndNotDeleted(i)
    );

    // Merge any missing initial items, BUT only if neither the item nor its establishment was deleted
    const existingIds = new Set(activeParsed.map(i => i.id));
    const missing = initialInventoryItems.filter(i =>
      !existingIds.has(i.id) && isItemValidAndNotDeleted(i)
    );

    if (missing.length > 0 || activeParsed.length !== parsed.length) {
      const merged = [...activeParsed, ...missing];
      localStorage.setItem('axofacil_inventory_items', JSON.stringify(merged));
      return merged;
    }
    return activeParsed;
  } catch {
    return initialInventoryItems.filter(isItemValidAndNotDeleted);
  }
}

export function deleteInventoryItem(itemId: string, establishmentId?: string, itemName?: string): InventoryItem[] {
  markInventoryItemDeleted(itemId, establishmentId, itemName);
  const current = loadInventoryItems();
  const updated = current.filter(i => {
    if (i.id === itemId) return false;
    if (establishmentId && itemName && (i.establishmentId === establishmentId || i.establishmentId === (establishmentId || '').trim()) && i.name.toLowerCase().trim() === itemName.toLowerCase().trim()) {
      return false;
    }
    return true;
  });
  saveInventoryItems(updated);
  return updated;
}

export function saveInventoryItems(items: InventoryItem[]) {
  localStorage.setItem('axofacil_inventory_items', JSON.stringify(items));
  recordOfflineChange();
  items.forEach(item => syncInventoryItemToSupabase(item).catch(console.warn));
}

export const initialStockMovements: StockMovementRecord[] = [];

export function loadStockMovements(): StockMovementRecord[] {
  const deletedEstIds = getDeletedEstablishmentIds();
  const saved = localStorage.getItem('axofacil_stock_movements');
  const list: StockMovementRecord[] = saved ? JSON.parse(saved) : initialStockMovements;
  return list.filter(m => !deletedEstIds.has(m.establishmentId));
}

export function saveStockMovements(movements: StockMovementRecord[]) {
  localStorage.setItem('axofacil_stock_movements', JSON.stringify(movements));
  recordOfflineChange();
}

export function loadBarTables(): BarTable[] {
  const saved = localStorage.getItem('axofacil_bar_tables');
  return saved ? JSON.parse(saved) : initialBarTables;
}

export function saveBarTables(tables: BarTable[]) {
  localStorage.setItem('axofacil_bar_tables', JSON.stringify(tables));
  recordOfflineChange();
}

export function loadOperatorLogins(): OperatorLoginRecord[] {
  const saved = localStorage.getItem('axofacil_operator_logins');
  return saved ? JSON.parse(saved) : initialOperatorLogins;
}

export function saveOperatorLogins(logins: OperatorLoginRecord[]) {
  localStorage.setItem('axofacil_operator_logins', JSON.stringify(logins));
  recordOfflineChange();
}

export function getProductFallbackImage(name: string, category?: string): string {
  const n = (name + ' ' + (category || '')).toLowerCase();
  
  // TURISMO, SAFARIS, VOOS, VIAGENS & LOGÍSTICA
  if (n.includes('turismo') || n.includes('safari') || n.includes('voo') || n.includes('voos') || n.includes('passagem') || n.includes('aeroporto') || n.includes('bilhete') || n.includes('reserva') || n.includes('excursão') || n.includes('excursao') || n.includes('ponta do ouro') || n.includes('kruger') || n.includes('praia') || n.includes('fretamento') || n.includes('logística') || n.includes('logistica') || n.includes('carga') || n.includes('frete')) {
    if (n.includes('safari') || n.includes('kruger') || n.includes('parque')) {
      return 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('voo') || n.includes('passagem') || n.includes('aéreo') || n.includes('aereo') || n.includes('lam')) {
      return 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('praia') || n.includes('ponta do ouro') || n.includes('bilene') || n.includes('barco') || n.includes('mergulho')) {
      return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=85';
  }

  // BAR / RESTAURANTE / BEBIDAS / MARISCOS / PETISCOS
  if (n.includes('bar') || n.includes('cerveja') || n.includes('2m') || n.includes('laurentina') || n.includes('txilar') || n.includes('bebe') || n.includes('bebida') || n.includes('coquetel') || n.includes('cocktail') || n.includes('whisky') || n.includes('vodka') || n.includes('gin') || n.includes('rum') || n.includes('vinho') || n.includes('espumante') || n.includes('churrasco') || n.includes('petisco') || n.includes('tábua') || n.includes('marisco') || n.includes('camarão') || n.includes('lula') || n.includes('lagosta') || n.includes('peixe') || n.includes('dose') || n.includes('menu') || n.includes('prato') || n.includes('zambeziana') || n.includes('picanha') || n.includes('caldeirada') || n.includes('refeição') || n.includes('refeicao')) {
    if (n.includes('cerveja') || n.includes('2m') || n.includes('laurentina') || n.includes('txilar')) {
      return 'https://images.unsplash.com/photo-1608270586620-248524c67de9?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('whisky') || n.includes('vodka') || n.includes('destilado') || n.includes('rum') || n.includes('gin')) {
      return 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('cocktail') || n.includes('caipirinha') || n.includes('mojito') || n.includes('coquetel')) {
      return 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('marisco') || n.includes('camarão') || n.includes('lagosta') || n.includes('peixe') || n.includes('lula')) {
      return 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('churrasco') || n.includes('carne') || n.includes('picanha') || n.includes('petisco') || n.includes('tábua')) {
      return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=800&q=85';
  }

  // AUTO PEÇAS & ACESSÓRIOS AUTOMÓVEIS
  if (n.includes('peça') || n.includes('peca') || n.includes('auto') || n.includes('carro') || n.includes('motor') || n.includes('filtro') || n.includes('travão') || n.includes('travao') || n.includes('pastilha') || n.includes('pneu') || n.includes('bateria') || n.includes('vela') || n.includes('amortecedor') || n.includes('embraiagem') || n.includes('correia') || n.includes('óleo') || n.includes('oleo') || n.includes('lubrificante') || n.includes('janta') || n.includes('disco') || n.includes('suspensão')) {
    if (n.includes('pneu') || n.includes('roda') || n.includes('janta')) {
      return 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('bateria')) {
      return 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('travão') || n.includes('travao') || n.includes('pastilha') || n.includes('disco') || n.includes('calço')) {
      return 'https://images.unsplash.com/photo-1600706432520-256f66eeaf4c?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('motor') || n.includes('correia') || n.includes('vela') || n.includes('embraiagem') || n.includes('amortecedor')) {
      return 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=85';
  }

  // MATERIAL DE CONSTRUÇÃO & FERRAGENS & ESTALEIRO
  if (n.includes('cimento') || n.includes('chapa') || n.includes('zinco') || n.includes('varão') || n.includes('varao') || n.includes('aço') || n.includes('aco') || n.includes('areia') || n.includes('brita') || n.includes('bloco') || n.includes('construção') || n.includes('construcao') || n.includes('estaleiro') || n.includes('cobertura') || n.includes('estrutura')) {
    if (n.includes('cimento')) {
      return 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('chapa') || n.includes('zinco') || n.includes('cobertura')) {
      return 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('varão') || n.includes('aço') || n.includes('estrutura')) {
      return 'https://images.unsplash.com/photo-1535813547-99c456a41d4a?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=85';
  }

  // HOSPEDAGEM & HOTELARIA
  if (n.includes('quarto') || n.includes('suíte') || n.includes('suite') || n.includes('hotel') || n.includes('pousada') || n.includes('hospedagem') || n.includes('alojamento') || n.includes('diária') || n.includes('diaria') || n.includes('cama') || n.includes('jacuzzi')) {
    return 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=85';
  }

  // SUPERMERCADO & MERCEARIA & ALIMENTOS
  if (n.includes('arroz') || n.includes('óleo') || n.includes('oleo') || n.includes('açúcar') || n.includes('acucar') || n.includes('farinha') || n.includes('massa') || n.includes('feijão') || n.includes('feijao') || n.includes('frango') || n.includes('carne') || n.includes('leite') || n.includes('iogurte') || n.includes('queijo') || n.includes('pão') || n.includes('pao') || n.includes('bolacha') || n.includes('biscoito') || n.includes('supermercado') || n.includes('mercearia') || n.includes('fruta') || n.includes('legume')) {
    if (n.includes('arroz') || n.includes('feijão') || n.includes('massa') || n.includes('farinha')) {
      return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('frango') || n.includes('carne') || n.includes('talho')) {
      return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('fruta') || n.includes('legume') || n.includes('maçã') || n.includes('banana')) {
      return 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=85';
  }

  if (n.includes('rosa') || n.includes('flor') || n.includes('buquê') || n.includes('buque') || n.includes('ornamenta') || n.includes('arranjo') || n.includes('orquídea') || n.includes('margarida')) {
    return 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=85';
  }

  // ROUPAS & FASHION / VESTUÁRIO / SAPATOS
  if (n.includes('camisa') || n.includes('camiseta') || n.includes('t-shirt') || n.includes('polo') || n.includes('fato') || n.includes('terno') || n.includes('vestido') || n.includes('saia') || n.includes('calça') || n.includes('calca') || n.includes('jeans') || n.includes('sapato') || n.includes('sapatilha') || n.includes('ténis') || n.includes('tenis') || n.includes('sandália') || n.includes('meia') || n.includes('gravata') || n.includes('capulana') || n.includes('bolsa') || n.includes('mala') || n.includes('mochila') || n.includes('óculos') || n.includes('relógio') || n.includes('vestuário') || n.includes('moda') || n.includes('loja')) {
    if (n.includes('sapato') || n.includes('sapatilha') || n.includes('ténis') || n.includes('mocassim')) {
      return 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('fato') || n.includes('terno')) {
      return 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=800&q=85';
    }
    if (n.includes('vestido')) {
      return 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?auto=format&fit=crop&w=800&q=85';
    }
    return 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=85';
  }

  // DEFAULT FALLBACK: Clean store counter display
  return 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=85';
}


export const initialEstablishments: Establishment[] = [];

export const initialDeals: PromoDeal[] = [];

export const initialDeliveryPartners: DeliveryPartner[] = [];

export const initialPayments: PaymentRecord[] = [];
export const initialSubmissions: AdminSubmission[] = [];

export const initialOrders: OrderRecord[] = [];

export const initialCustomers: CustomerRecord[] = [];

export const initialFinancialTransactions: FinancialTransaction[] = [];

// Storage Helpers
export function loadOrders(): OrderRecord[] {
  const data = localStorage.getItem('axofacil_orders');
  return data ? JSON.parse(data) : initialOrders;
}

export function saveOrders(orders: OrderRecord[]) {
  localStorage.setItem('axofacil_orders', JSON.stringify(orders));
  recordOfflineChange();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('axofacil_orders_updated'));
  }
  orders.forEach(o => syncOrderToSupabase(o).catch(console.warn));
}

export function loadCustomers(): CustomerRecord[] {
  const data = localStorage.getItem('axofacil_customers');
  return data ? JSON.parse(data) : initialCustomers;
}

export function saveCustomers(customers: CustomerRecord[]) {
  localStorage.setItem('axofacil_customers', JSON.stringify(customers));
  recordOfflineChange();
}

export function loadFinancialTransactions(): FinancialTransaction[] {
  const data = localStorage.getItem('axofacil_financial_transactions');
  return data ? JSON.parse(data) : initialFinancialTransactions;
}

export function saveFinancialTransactions(txs: FinancialTransaction[]) {
  localStorage.setItem('axofacil_financial_transactions', JSON.stringify(txs));
  recordOfflineChange();
  txs.forEach(tx => syncFinancialTxToSupabase(tx).catch(console.warn));
}

export function markEstablishmentDeleted(id: string) {
  try {
    const deletedRaw = localStorage.getItem('axofacil_deleted_establishments');
    const deletedIds: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      localStorage.setItem('axofacil_deleted_establishments', JSON.stringify(deletedIds));
    }
  } catch (e) {
    console.warn('Erro ao guardar ID de loja eliminada:', e);
  }
}

export function markAllEstablishmentsDeleted(ids: string[]) {
  try {
    const deletedRaw = localStorage.getItem('axofacil_deleted_establishments');
    const existing: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
    const merged = Array.from(new Set([...existing, ...ids]));
    localStorage.setItem('axofacil_deleted_establishments', JSON.stringify(merged));
  } catch (e) {
    console.warn('Erro ao guardar IDs de lojas eliminadas:', e);
  }
}

export function getDeletedDealIds(): Set<string> {
  try {
    const raw = localStorage.getItem('axofacil_deleted_deals');
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markDealDeleted(id: string) {
  try {
    const keys = getDeletedDealIds();
    keys.add(id);
    localStorage.setItem('axofacil_deleted_deals', JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao guardar ID de promoção eliminada:', e);
  }
}

export function markAllDealsDeleted(ids: string[]) {
  try {
    const keys = getDeletedDealIds();
    ids.forEach(id => keys.add(id));
    initialDeals.forEach(d => keys.add(d.id));
    localStorage.setItem('axofacil_deleted_deals', JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao guardar IDs de promoções eliminadas:', e);
  }
}

export function getDeletedCourierIds(): Set<string> {
  try {
    const raw = localStorage.getItem('axofacil_deleted_couriers');
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw);
    return new Set<string>(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set<string>();
  }
}

export function markCourierDeleted(id: string) {
  try {
    const keys = getDeletedCourierIds();
    keys.add(id);
    localStorage.setItem('axofacil_deleted_couriers', JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao guardar ID de entregador eliminado:', e);
  }
}

export function markAllCouriersDeleted(ids: string[]) {
  try {
    const keys = getDeletedCourierIds();
    ids.forEach(id => keys.add(id));
    initialDeliveryPartners.forEach(c => keys.add(c.id));
    localStorage.setItem('axofacil_deleted_couriers', JSON.stringify(Array.from(keys)));
  } catch (e) {
    console.warn('Erro ao guardar IDs de entregadores eliminados:', e);
  }
}

export function loadData() {
  const ests = localStorage.getItem('axofacil_establishments');
  const deals = localStorage.getItem('axofacil_deals');
  const payments = localStorage.getItem('axofacil_payments');
  const submissions = localStorage.getItem('axofacil_submissions');
  const couriers = localStorage.getItem('axofacil_couriers');

  const deletedSet = getDeletedEstablishmentIds();
  const deletedDealsSet = getDeletedDealIds();
  const deletedCouriersSet = getDeletedCourierIds();

  const testEstIds = new Set(['l1', 's1', 'c1']);
  const testDealIds = new Set(['d1', 'd-supermercado-cabaz', 'd-construcao-cimento']);
  const testCourierIds = new Set(['cour-1', 'cour-2', 'cour-3']);

  let establishmentsList: Establishment[] = ests ? JSON.parse(ests) : [];
  // Filter out any explicitly deleted or mock test establishments
  establishmentsList = establishmentsList.filter(e => !deletedSet.has(e.id) && !testEstIds.has(e.id) && !e.name.toLowerCase().includes('conta de teste'));

  // Ensure every establishment has product catalog stock and location coordinates
  establishmentsList = establishmentsList.map(ensureEstablishmentCatalog);
  if (ests && establishmentsList.length !== JSON.parse(ests).length) {
    saveEstablishments(establishmentsList);
  }

  const validDealEstIds = new Set(establishmentsList.map(e => e.id));
  let dealsList: PromoDeal[] = deals ? JSON.parse(deals) : [];
  dealsList = dealsList.filter(
    d => !deletedDealsSet.has(d.id) && !testDealIds.has(d.id) && (!d.establishmentId || validDealEstIds.has(d.establishmentId))
  );

  let couriersList: DeliveryPartner[] = couriers ? JSON.parse(couriers) : [];
  couriersList = couriersList.filter(c => !deletedCouriersSet.has(c.id) && !testCourierIds.has(c.id) && !['Sérgio Cossa', 'Alberto Mabote', 'Salomão Sitoe'].includes(c.name));

  return {
    establishments: establishmentsList,
    deals: dealsList,
    payments: payments ? JSON.parse(payments) : initialPayments,
    submissions: submissions ? JSON.parse(submissions) : initialSubmissions,
    couriers: couriersList,
    orders: loadOrders(),
    customers: loadCustomers(),
    financialTransactions: loadFinancialTransactions()
  };
}

export function saveEstablishments(establishments: Establishment[]) {
  localStorage.setItem('axofacil_establishments', JSON.stringify(establishments));
  recordOfflineChange();
  establishments.forEach(est => syncEstablishmentToSupabase(est).catch(console.warn));
}

export function saveDeals(deals: PromoDeal[]) {
  localStorage.setItem('axofacil_deals', JSON.stringify(deals));
  recordOfflineChange();
}

export function savePayments(payments: PaymentRecord[]) {
  localStorage.setItem('axofacil_payments', JSON.stringify(payments));
  recordOfflineChange();
}

export function saveSubmissions(submissions: AdminSubmission[]) {
  localStorage.setItem('axofacil_submissions', JSON.stringify(submissions));
  recordOfflineChange();
}

export function saveDeliveryPartners(couriers: DeliveryPartner[]) {
  localStorage.setItem('axofacil_couriers', JSON.stringify(couriers));
  recordOfflineChange();
  couriers.forEach(c => syncDeliveryPartnerToSupabase(c).catch(console.warn));
}

export function purgeAllTestAndMockData() {
  markAllEstablishmentsDeleted([
    ...initialEstablishments.map(e => e.id),
    'l1', 's1', 'c1', 'b1', 'h1', 't1', 'tur-1', 'p1'
  ]);
  markAllDealsDeleted(initialDeals.map(d => d.id));
  markAllCouriersDeleted(initialDeliveryPartners.map(c => c.id));
  saveEstablishments([]);
  saveDeals([]);
  savePayments([]);
  saveSubmissions([]);
  saveDeliveryPartners([]);
  saveInventoryItems([]);
  saveBarTables([]);
  saveFinancialTransactions([]);
  saveOrders([]);
  saveOperatorLogins([]);
  saveStockMovements([]);
  saveCustomers([]);
}
