import React, { useState, useMemo } from 'react';
import { BarTable, BarTableItem, InventoryItem, Establishment, FinancialTransaction, StockMovementRecord } from '../../types/types';
import { saveBarTables, saveFinancialTransactions, saveInventoryItems, saveStockMovements, loadStockMovements } from '../../data/data';
import { notify, confirmDialog } from '../../services/dialogs';
import { 
  Beer, Store, ShoppingBag, Plus, Clock, CheckCircle2, DollarSign, 
  UserCheck, Trash2, Send, Sparkles, Check, AlertCircle, UtensilsCrossed, 
  X, Edit3, Banknote, Search, Receipt, Printer, ShieldCheck, Tag, Phone
} from 'lucide-react';

interface TableManagerProps {
  establishment: Establishment;
  tables: BarTable[];
  setTables: React.Dispatch<React.SetStateAction<BarTable[]>>;
  inventoryItems: InventoryItem[];
  setInventoryItems: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  activeOperator: string;
  financialTxs: FinancialTransaction[];
  setFinancialTxs: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
}

export default function TableManager({
  establishment,
  tables,
  setTables,
  inventoryItems,
  setInventoryItems,
  activeOperator,
  financialTxs,
  setFinancialTxs
}: TableManagerProps) {
  
  // Adaptive Context Labels based on store category
  const contextMeta = useMemo(() => {
    const cat = (establishment.category || '').toLowerCase();
    if (cat.includes('bar') || cat.includes('restaurante')) {
      return {
        unitSingular: 'Mesa',
        unitPlural: 'Mesas & Comandas de Consumo',
        icon: UtensilsCrossed,
        defaultName: 'Mesa',
        sectorOptions: ['Salão Principal', 'Esplanada Exterior', 'Balcão Bar', 'Área VIP / Camarote', 'Pátio'],
        actionOpen: 'Abrir Mesa',
        actionClose: 'Fechar Conta da Mesa'
      };
    }
    if (cat.includes('supermercado') || cat.includes('mercearia')) {
      return {
        unitSingular: 'Frente de Caixa',
        unitPlural: 'Caixas & Frentes de Loja',
        icon: Store,
        defaultName: 'Caixa',
        sectorOptions: ['Caixa Principal 1', 'Caixa Rápido', 'Caixa 2', 'Atendimento Fardos', 'Secção Padaria'],
        actionOpen: 'Iniciar Atendimento no Caixa',
        actionClose: 'Fechar Caixa & Dar Troco'
      };
    }
    if (cat.includes('hospedagem') || cat.includes('hotel') || cat.includes('pousada')) {
      return {
        unitSingular: 'Quarto / Suíte',
        unitPlural: 'Quartos & Alojamentos',
        icon: Store,
        defaultName: 'Quarto',
        sectorOptions: ['Piso 1', 'Piso 2', 'Bungalows Jardim', 'Suítes Vista Mar', 'Anexo'],
        actionOpen: 'Fazer Check-In / Abrir Quarto',
        actionClose: 'Fazer Check-Out & Liquidação'
      };
    }
    if (cat.includes('auto') || cat.includes('peca') || cat.includes('peça')) {
      return {
        unitSingular: 'Box / Ordem de Serviço',
        unitPlural: 'Boxes & Atendimentos de Oficina',
        icon: Store,
        defaultName: 'Box',
        sectorOptions: ['Box Elevador 1', 'Box Lubrificação', 'Balcão Peças Rápidas', 'Pátio Diagnóstico'],
        actionOpen: 'Abrir Atendimento no Box',
        actionClose: 'Finalizar Serviço & Cobrar'
      };
    }
    if (cat.includes('constru') || cat.includes('estaleiro')) {
      return {
        unitSingular: 'Doca / Pátio de Carga',
        unitPlural: 'Docas & Pátios de Carregamento',
        icon: Store,
        defaultName: 'Doca',
        sectorOptions: ['Doca Principal Cimento', 'Pátio Areia e Brita', 'Armazém Ferro e Chapas', 'Balcão de Guias'],
        actionOpen: 'Abrir Ordem de Carregamento',
        actionClose: 'Fechar Guia & Liquidar'
      };
    }
    // Default Retail / Store
    return {
      unitSingular: 'Balcão de Atendimento',
      unitPlural: 'Balcões & Atendimentos de Loja',
      icon: ShoppingBag,
      defaultName: 'Balcão',
      sectorOptions: ['Balcão Principal', 'Atendimento Moda / Provador', 'Balcão 2', 'Atendimento VIP', 'Balcão Venda a Grosso'],
      actionOpen: 'Abrir Atendimento no Balcão',
      actionClose: 'Finalizar Atendimento & Dar Troco'
    };
  }, [establishment]);

  // Table Selection & Modal State
  const [selectedTable, setSelectedTable] = useState<BarTable | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);

  // Form states for creating / editing table
  const [showCreateEditTableModal, setShowCreateEditTableModal] = useState(false);
  const [editingTableObj, setEditingTableObj] = useState<BarTable | null>(null);
  const [tableFormName, setTableFormName] = useState('');
  const [tableFormSector, setTableFormSector] = useState('');
  const [tableFormCapacity, setTableFormCapacity] = useState<number>(4);

  // Order & Comanda states inside modal
  const [custNameInput, setCustNameInput] = useState('');
  const [custPhoneInput, setCustPhoneInput] = useState('');
  const [operatorInput, setOperatorInput] = useState(activeOperator || 'Operador');
  const [selectedInvItemId, setSelectedInvItemId] = useState<string>('');
  const [addQty, setAddQty] = useState<number>(1);
  const [invSearchQuery, setInvSearchQuery] = useState('');

  // Settle Bill & Troco States
  const [payMethod, setPayMethod] = useState<'Dinheiro' | 'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM' | 'POS Cartão'>('Dinheiro');
  const [cashGivenInput, setCashGivenInput] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'todos' | 'ocupadas' | 'livres'>('todos');

  // Filtered Tables
  const filteredTables = useMemo(() => {
    return tables.filter(t => {
      if (statusFilter === 'todos') return true;
      if (statusFilter === 'ocupadas') return t.status === 'ocupada' || t.status === 'conta_solicitada';
      if (statusFilter === 'livres') return t.status === 'livre';
      return true;
    });
  }, [tables, statusFilter]);

  // Inventory items for adding to order
  const filteredInventoryForOrder = useMemo(() => {
    if (!invSearchQuery) return inventoryItems.slice(0, 15);
    return inventoryItems.filter(item => 
      item.name.toLowerCase().includes(invSearchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(invSearchQuery.toLowerCase())
    ).slice(0, 15);
  }, [inventoryItems, invSearchQuery]);

  // Table calculations
  const tableTotalMT = useMemo(() => {
    if (!selectedTable) return 0;
    return selectedTable.items.reduce((acc, curr) => acc + (curr.unitPriceMT * curr.quantity), 0);
  }, [selectedTable]);

  const parsedCashGiven = parseFloat(cashGivenInput) || 0;
  const tableChangeMT = Math.max(0, parsedCashGiven - tableTotalMT);
  const tableMissingCashMT = payMethod === 'Dinheiro' && parsedCashGiven > 0 && parsedCashGiven < tableTotalMT 
    ? tableTotalMT - parsedCashGiven 
    : 0;

  // Open Table Modal for management
  const handleOpenTable = (table: BarTable) => {
    setSelectedTable(table);
    setCustNameInput(table.customerName || '');
    setOperatorInput(table.operatorName || activeOperator || 'Operador');
    setCashGivenInput('');
    setShowTableModal(true);
  };

  // Open Create Table Modal
  const handleOpenCreateTable = () => {
    setEditingTableObj(null);
    setTableFormName(`${contextMeta.defaultName} ${tables.length + 1}`);
    setTableFormSector(contextMeta.sectorOptions[0] || 'Geral');
    setTableFormCapacity(4);
    setShowCreateEditTableModal(true);
  };

  // Open Edit Table Modal
  const handleOpenEditTable = (table: BarTable, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTableObj(table);
    setTableFormName(table.tableNumber);
    setTableFormSector(table.location || contextMeta.sectorOptions[0] || 'Geral');
    setTableFormCapacity(table.capacity || 4);
    setShowCreateEditTableModal(true);
  };

  // Save Create / Edit Table (CRUD)
  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableFormName.trim()) {
      notify(`Preencha o nome de identificação da ${contextMeta.unitSingular.toLowerCase()}.`, 'error');
      return;
    }

    if (editingTableObj) {
      // Update
      const updated = tables.map(t => {
        if (t.id === editingTableObj.id) {
          return {
            ...t,
            tableNumber: tableFormName.trim(),
            location: tableFormSector,
            capacity: Number(tableFormCapacity)
          };
        }
        return t;
      });
      setTables(updated);
      saveBarTables(updated);
      notify(`${contextMeta.unitSingular} "${tableFormName}" atualizada!`, 'success');
    } else {
      // Create
      const newTable: BarTable = {
        id: 'tbl-' + Date.now(),
        establishmentId: establishment.id,
        tableNumber: tableFormName.trim(),
        capacity: Number(tableFormCapacity),
        operatorName: activeOperator || 'Atendente Balcão',
        status: 'livre',
        items: [],
        location: tableFormSector
      };
      const updated = [...tables, newTable];
      setTables(updated);
      saveBarTables(updated);
      notify(`Nova ${contextMeta.unitSingular.toLowerCase()} "${tableFormName}" criada com sucesso!`, 'success');
    }

    setShowCreateEditTableModal(false);
  };

  // Delete Table (CRUD)
  const handleDeleteTable = async (table: BarTable, e: React.MouseEvent) => {
    e.stopPropagation();
    if (table.status === 'ocupada' && table.items.length > 0) {
      notify(`Não é possível excluir uma ${contextMeta.unitSingular.toLowerCase()} que possui uma comanda ativa com consumo. Feche a conta primeiro.`, 'error');
      return;
    }

    const ok = await confirmDialog(`Tem certeza que deseja excluir "${table.tableNumber}"?`, {
      title: `Eliminar ${contextMeta.unitSingular}`,
      confirmLabel: 'Sim, Eliminar',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    const updated = tables.filter(t => t.id !== table.id);
    setTables(updated);
    saveBarTables(updated);
    notify(`${contextMeta.unitSingular} "${table.tableNumber}" excluída com sucesso.`, 'success');
  };

  // Start Session (Livre -> Ocupada)
  const handleStartSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;

    const updated = tables.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          status: 'ocupada' as const,
          customerName: custNameInput || 'Cliente Consumidor',
          operatorName: operatorInput || activeOperator,
          openedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
      }
      return t;
    });

    setTables(updated);
    saveBarTables(updated);
    setSelectedTable(updated.find(t => t.id === selectedTable.id) || null);
    notify(`Atendimento iniciado em "${selectedTable.tableNumber}"!`, 'success');
  };

  // Add Item to Table Order
  const handleAddItemToTable = (itemToAdd?: InventoryItem) => {
    if (!selectedTable) return;
    const targetItem = itemToAdd || inventoryItems.find(i => i.id === selectedInvItemId);
    if (!targetItem) {
      notify('Selecione um produto para lançar.', 'error');
      return;
    }

    const newItem: BarTableItem = {
      id: 'ti-' + Date.now(),
      inventoryItemId: targetItem.id,
      productName: targetItem.name,
      unitPriceMT: targetItem.sellingPriceMT,
      quantity: addQty,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      delivered: true
    };

    const updated = tables.map(t => {
      if (t.id === selectedTable.id) {
        return {
          ...t,
          items: [...t.items, newItem]
        };
      }
      return t;
    });

    setTables(updated);
    saveBarTables(updated);
    setSelectedTable(updated.find(t => t.id === selectedTable.id) || null);
    setAddQty(1);
    setSelectedInvItemId('');
    notify(`+${addQty}x "${targetItem.name}" adicionado à conta!`, 'success');
  };

  // Remove Item from Table Order
  const handleRemoveItemFromTable = (tableId: string, itemId: string) => {
    const updated = tables.map(t => {
      if (t.id === tableId) {
        return { ...t, items: t.items.filter(it => it.id !== itemId) };
      }
      return t;
    });

    setTables(updated);
    saveBarTables(updated);
    if (selectedTable && selectedTable.id === tableId) {
      setSelectedTable(updated.find(t => t.id === tableId) || null);
    }
  };

  // Close Bill & Record Payment in Livro Caixa & Decrement Inventory Stock with Change Calculation
  const handleCloseAndPayTable = (table: BarTable) => {
    if (tableTotalMT <= 0) {
      notify(`Esta ${contextMeta.unitSingular.toLowerCase()} não possui nenhum consumo registado.`, 'error');
      return;
    }

    if (payMethod === 'Dinheiro' && parsedCashGiven < tableTotalMT && parsedCashGiven > 0) {
      notify(`Valor entregue (${parsedCashGiven} MT) é menor que o total (${tableTotalMT} MT). Faltam ${tableMissingCashMT.toFixed(2)} MT.`, 'error');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const timeStr = new Date().toTimeString().substring(0, 5);

    // 1. Record Financial Transaction
    const newTx: FinancialTransaction = {
      id: 'fin-' + Date.now(),
      establishmentId: establishment.id,
      date: today,
      type: 'receita',
      category: 'Vendas de Produtos',
      description: `Fecho de ${table.tableNumber} (${table.customerName || 'Cliente'}) - ${table.items.map(i => `${i.productName} (x${i.quantity})`).join(', ')}`,
      amountMT: tableTotalMT,
      paymentMethod: payMethod,
      status: 'Pago',
      operatorName: table.operatorName || activeOperator
    };
    const updatedFinTxs = [newTx, ...financialTxs];
    setFinancialTxs(updatedFinTxs);
    saveFinancialTransactions(updatedFinTxs);

    // 2. Decrement Inventory Items Stock
    const updatedInv = inventoryItems.map(invItem => {
      const match = table.items.find(ti => ti.inventoryItemId === invItem.id);
      if (match) {
        return {
          ...invItem,
          quantityInStock: Math.max(0, invItem.quantityInStock - match.quantity),
          salesCount: (invItem.salesCount || 0) + match.quantity
        };
      }
      return invItem;
    });
    setInventoryItems(updatedInv);
    saveInventoryItems(updatedInv);

    // 3. Register stock movements
    const existingMovs = loadStockMovements();
    const newMovs: StockMovementRecord[] = table.items.map((it, idx) => ({
      id: `mov-tbl-${Date.now()}-${idx}`,
      establishmentId: establishment.id,
      inventoryItemId: it.inventoryItemId || 'inv-gen',
      productName: it.productName,
      type: 'saida_venda',
      quantity: it.quantity,
      unitCostMT: 0,
      unitSellingPriceMT: it.unitPriceMT,
      totalCostMT: 0,
      totalSellingPriceMT: it.quantity * it.unitPriceMT,
      reasonOrNotes: `Fecho de ${table.tableNumber} - Cliente: ${table.customerName || 'Consumidor'}`,
      operatorName: table.operatorName || activeOperator,
      date: today,
      time: timeStr
    }));
    saveStockMovements([...newMovs, ...existingMovs]);

    // 4. Free up the table
    const updatedTables = tables.map(t => {
      if (t.id === table.id) {
        return {
          ...t,
          status: 'livre' as const,
          items: [],
          customerName: undefined,
          openedAt: undefined,
          operatorName: undefined
        };
      }
      return t;
    });
    setTables(updatedTables);
    saveBarTables(updatedTables);

    notify(`✅ ${contextMeta.unitSingular} "${table.tableNumber}" fechada com sucesso! Total: ${tableTotalMT.toLocaleString()} MT ${payMethod === 'Dinheiro' && parsedCashGiven > 0 ? `(Troco: ${tableChangeMT.toFixed(2)} MT)` : ''}`, 'success');
    setShowTableModal(false);
  };

  const occupiedCount = tables.filter(t => t.status === 'ocupada' || t.status === 'conta_solicitada').length;
  const freeCount = tables.filter(t => t.status === 'livre').length;

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 text-[#0F172A] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#0B254B] flex items-center justify-center text-white font-black shadow-xs shrink-0">
            <contextMeta.icon className="w-6 h-6 text-[#F8FAFC]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif font-bold text-lg sm:text-xl text-[#061833]">
                {contextMeta.unitPlural}
              </h2>
              <span className="bg-[#0B254B]/10 text-[#0B254B] border border-[#0B254B]/20 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {establishment.name}
              </span>
            </div>
            <p className="text-xs text-[#475569] mt-0.5">
              Gestão de atendimento em tempo real, lançamento de pedidos, fecho de contas com cálculo de trocos e integração com inventário.
            </p>
          </div>
        </div>

        {/* Action Button: Create Table / Counter */}
        <button
          type="button"
          onClick={handleOpenCreateTable}
          className="py-2.5 px-4 bg-[#0B254B] hover:bg-[#061833] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition-all shrink-0"
        >
          <Plus className="w-4 h-4 text-[#D97706]" />
          <span>+ Adicionar {contextMeta.unitSingular}</span>
        </button>
      </div>

      {/* Metric Badges & Status Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('todos')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'todos' ? 'bg-[#FFFFFF] border-[#0B254B] shadow-xs ring-2 ring-[#0B254B]/10' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-[#475569]">Total Cadastrado</div>
          <div className="font-serif font-black text-xl text-[#061833]">{tables.length} <span className="text-xs font-sans font-normal text-[#475569]">{contextMeta.unitPlural.toLowerCase()}</span></div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('ocupadas')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ocupadas' ? 'bg-[#FFFFFF] border-amber-500 shadow-xs ring-2 ring-amber-500/10' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-amber-800">Em Atendimento / Ocupadas</div>
          <div className="font-serif font-black text-xl text-amber-700">{occupiedCount} <span className="text-xs font-sans font-normal text-[#475569]">em consumo</span></div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('livres')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'livres' ? 'bg-[#FFFFFF] border-emerald-600 shadow-xs ring-2 ring-emerald-600/10' : 'bg-[#F8FAFC] border-[#E2E8F0]'
          }`}
        >
          <div className="text-[11px] font-bold uppercase text-emerald-800">Livres / Disponíveis</div>
          <div className="font-serif font-black text-xl text-emerald-700">{freeCount} <span className="text-xs font-sans font-normal text-[#475569]">prontas</span></div>
        </button>
      </div>

      {/* Grid of Tables / Counters */}
      {filteredTables.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-dashed border-[#E2E8F0] rounded-2xl p-12 text-center space-y-3">
          <contextMeta.icon className="w-10 h-10 mx-auto text-[#64748B]" />
          <h4 className="font-serif font-bold text-base text-[#0F172A]">Nenhuma {contextMeta.unitSingular.toLowerCase()} encontrada</h4>
          <p className="text-xs text-[#475569]">Clique no botão abaixo para criar a primeira {contextMeta.unitSingular.toLowerCase()} da sua loja.</p>
          <button
            type="button"
            onClick={handleOpenCreateTable}
            className="py-2.5 px-4 bg-[#0B254B] text-white text-xs font-bold rounded-xl cursor-pointer shadow-xs"
          >
            + Criar Nova {contextMeta.unitSingular}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTables.map((table, idx) => {
            const isOcupada = table.status === 'ocupada' || table.status === 'conta_solicitada';
            const totalComandaMT = table.items.reduce((acc, curr) => acc + (curr.unitPriceMT * curr.quantity), 0);

            return (
              <div
                key={`tbl-card-${table.id}-${idx}`}
                onClick={() => handleOpenTable(table)}
                className={`bg-[#FFFFFF] border rounded-2xl p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between group ${
                  isOcupada ? 'border-amber-400/80 bg-amber-50/20' : 'border-[#E2E8F0] hover:border-[#0B254B]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                        isOcupada ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                      }`}>
                        {isOcupada ? '🔴 Em Atendimento' : '🟢 Livre'}
                      </span>
                      <h3 className="font-serif font-bold text-base text-[#061833] mt-1.5 group-hover:text-[#0B254B] transition-colors">
                        {table.tableNumber}
                      </h3>
                      <div className="text-[11px] text-[#475569]">
                        {table.location || 'Salão'} • Capacidade: {table.capacity || 4} pessoas
                      </div>
                    </div>

                    {/* Edit / Delete Mini Buttons */}
                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditTable(table, e)}
                        className="p-1.5 text-[#475569] hover:text-[#0B254B] hover:bg-[#F8FAFC] rounded-lg cursor-pointer transition-colors"
                        title="Editar Informações"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDeleteTable(table, e)}
                        className="p-1.5 text-[#64748B] hover:text-red-600 hover:bg-[#F8FAFC] rounded-lg cursor-pointer transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isOcupada ? (
                    <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-2.5 rounded-xl space-y-1 text-xs">
                      <div className="font-bold text-[#0F172A] truncate">
                        👤 {table.customerName || 'Cliente'}
                      </div>
                      <div className="text-[10px] text-[#475569] flex justify-between">
                        <span>Aberto às {table.openedAt}</span>
                        <span>{table.items.length} itens lançados</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#F8FAFC] border border-dashed border-[#E2E8F0] p-3 rounded-xl text-center text-xs text-[#64748B]">
                      Pronta para novo atendimento
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] mt-3 flex items-center justify-between">
                  <div className="font-serif font-black text-sm text-[#0B254B]">
                    {isOcupada ? `${totalComandaMT.toLocaleString()} MT` : '0 MT'}
                  </div>
                  <span className="text-[11px] font-bold text-[#0B254B] group-hover:underline">
                    {isOcupada ? 'Gerir Comanda →' : 'Abrir Atendimento →'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CRIAR / EDITAR MESA / BALCÃO                                      */}
      {/* ========================================================================= */}
      {showCreateEditTableModal && (
        <div className="fixed inset-0 bg-[#061833]/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <h3 className="font-serif font-bold text-lg text-[#061833] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#D97706]" />
                <span>{editingTableObj ? `Editar ${contextMeta.unitSingular}` : `Nova ${contextMeta.unitSingular}`}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateEditTableModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[#0F172A] mb-1">Nome / Identificador *</label>
                <input
                  type="text"
                  required
                  placeholder={`Ex: ${contextMeta.defaultName} 1, ${contextMeta.defaultName} VIP...`}
                  value={tableFormName}
                  onChange={(e) => setTableFormName(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none focus:border-[#0B254B]"
                />
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1">Área / Sector da Loja</label>
                <select
                  value={tableFormSector}
                  onChange={(e) => setTableFormSector(e.target.value)}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                >
                  {contextMeta.sectorOptions.map((sec, idx) => (
                    <option key={`sec-${sec}-${idx}`} value={sec}>{sec}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1">Capacidade (Pessoas / Clientes)</label>
                <input
                  type="number"
                  min="1"
                  value={tableFormCapacity}
                  onChange={(e) => setTableFormCapacity(Number(e.target.value))}
                  className="w-full p-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateEditTableModal(false)}
                  className="w-1/2 py-2.5 bg-[#F8FAFC] text-[#0F172A] font-bold rounded-xl cursor-pointer border border-[#E2E8F0]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-[#0B254B] hover:bg-[#061833] text-white font-bold rounded-xl cursor-pointer shadow-xs"
                >
                  {editingTableObj ? 'Salvar Alterações' : 'Criar Registo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GERENCIAR COMANDA, LANÇAR PRODUTOS & FECHAR COM TROCO              */}
      {/* ========================================================================= */}
      {showTableModal && selectedTable && (
        <div className="fixed inset-0 bg-[#061833]/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl w-full max-w-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0B254B] text-white flex items-center justify-center font-bold">
                  <contextMeta.icon className="w-5 h-5 text-[#F8FAFC]" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-[#061833]">
                    {selectedTable.tableNumber}
                  </h3>
                  <div className="text-[11px] text-[#475569]">
                    {selectedTable.location || 'Salão'} • Status: <strong className={selectedTable.status === 'livre' ? 'text-emerald-700' : 'text-amber-700'}>
                      {selectedTable.status === 'livre' ? 'Livre' : 'Ocupada'}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTableModal(false)}
                className="text-[#64748B] hover:text-[#0F172A] font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* IF TABLE IS LIVRE: START SESSION FORM */}
            {selectedTable.status === 'livre' ? (
              <form onSubmit={handleStartSession} className="space-y-4 py-2">
                <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] space-y-3">
                  <h4 className="font-serif font-bold text-sm text-[#061833]">Iniciar Novo Atendimento</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-semibold">
                    <div>
                      <label className="block text-[#0F172A] mb-1">Nome do Cliente *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Sr. Cossa, Dona Sara..."
                        value={custNameInput}
                        onChange={(e) => setCustNameInput(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[#0F172A] mb-1">Operador / Atendente</label>
                      <input
                        type="text"
                        value={operatorInput}
                        onChange={(e) => setOperatorInput(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#0B254B] hover:bg-[#061833] text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#D97706]" />
                  <span>{contextMeta.actionOpen}</span>
                </button>
              </form>
            ) : (
              /* IF TABLE IS OCUPADA: COMANDA MANAGEMENT & CHECKOUT */
              <div className="space-y-4">
                
                {/* Session Info Strip */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-[#061833]">Cliente: {selectedTable.customerName}</span>
                    <div className="text-[10px] text-[#475569]">
                      Atendido por: {selectedTable.operatorName} • Aberto às {selectedTable.openedAt}
                    </div>
                  </div>
                  <span className="font-serif font-black text-lg text-[#0B254B]">
                    {tableTotalMT.toLocaleString()} MT
                  </span>
                </div>

                {/* Quick Add Product to Comanda */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] p-3.5 rounded-xl space-y-3">
                  <div className="text-xs font-bold text-[#061833] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#D97706]" />
                    <span>Lançar Artigos na Conta:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-7">
                      <select
                        value={selectedInvItemId}
                        onChange={(e) => setSelectedInvItemId(e.target.value)}
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                      >
                        <option value="">-- Escolha um artigo do inventário --</option>
                        {inventoryItems.map((item, itmIdx) => (
                          <option key={`inv-opt-${item.id}-${itmIdx}`} value={item.id}>
                            {item.name} ({item.sellingPriceMT} MT | Stock: {item.quantityInStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <input
                        type="number"
                        min="1"
                        value={addQty}
                        onChange={(e) => setAddQty(Number(e.target.value))}
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-center text-[#0F172A] outline-none"
                        placeholder="Qtd"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <button
                        type="button"
                        onClick={() => handleAddItemToTable()}
                        disabled={!selectedInvItemId}
                        className="w-full p-2.5 bg-[#0B254B] hover:bg-[#061833] disabled:opacity-40 text-white font-bold rounded-xl cursor-pointer transition-all text-xs"
                      >
                        + Lançar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items in comanda list */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#475569] uppercase tracking-wider">
                    Itens Lançados ({selectedTable.items.length}):
                  </div>

                  {selectedTable.items.length === 0 ? (
                    <div className="p-4 bg-[#F8FAFC] border border-dashed border-[#E2E8F0] rounded-xl text-center text-[#64748B] text-xs">
                      Ainda não há produtos lançados nesta comanda.
                    </div>
                  ) : (
                    <div className="border border-[#E2E8F0] rounded-xl divide-y divide-[#E2E8F0] overflow-hidden bg-white max-h-[180px] overflow-y-auto">
                      {selectedTable.items.map((it, idx) => (
                        <div key={`it-${it.id}-${idx}`} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                          <div>
                            <div className="font-bold text-[#0F172A]">{it.quantity}x {it.productName}</div>
                            <div className="text-[10px] text-[#64748B]">Lançado às {it.addedAt} • {it.unitPriceMT} MT/unid</div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-serif font-bold text-sm text-[#0B254B]">
                              {(it.unitPriceMT * it.quantity).toLocaleString()} MT
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveItemFromTable(selectedTable.id, it.id)}
                              className="text-[#64748B] hover:text-red-600 p-1 cursor-pointer"
                              title="Remover"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Settlement & Troco Panel */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-[#E2E8F0] pb-2">
                    <span className="font-bold text-xs uppercase tracking-wider text-[#475569]">Liquidação & Pagamento:</span>
                    <span className="font-serif font-black text-xl text-[#0B254B]">
                      {tableTotalMT.toLocaleString()} MT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-[#475569] mb-1">Forma de Pagamento:</label>
                      <select
                        value={payMethod}
                        onChange={(e) => setPayMethod(e.target.value as any)}
                        className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none cursor-pointer"
                      >
                        <option value="Dinheiro">💵 Dinheiro em Mão</option>
                        <option value="M-Pesa">📱 M-Pesa</option>
                        <option value="e-Mola">📱 e-Mola</option>
                        <option value="POS Cartão">💳 POS / Cartão</option>
                        <option value="Transferência BCI/BIM">🏦 Transferência BCI/BIM</option>
                      </select>
                    </div>

                    {payMethod === 'Dinheiro' && (
                      <div>
                        <label className="block text-[11px] font-bold text-[#475569] mb-1">Valor Entregue pelo Cliente (MT):</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="Ex: 500, 1000..."
                          value={cashGivenInput}
                          onChange={(e) => setCashGivenInput(e.target.value)}
                          className="w-full p-2.5 bg-white border border-[#E2E8F0] rounded-xl text-xs font-bold text-[#0F172A] outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* Change Display */}
                  {payMethod === 'Dinheiro' && (
                    <div className="p-2.5 bg-white rounded-xl border border-[#E2E8F0] flex justify-between items-center text-xs">
                      <span className="font-bold text-[#475569]">Troco a Devolver:</span>
                      <span className="font-serif font-black text-base text-emerald-800">
                        {tableChangeMT.toFixed(2)} MT
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => handleCloseAndPayTable(selectedTable)}
                    disabled={selectedTable.items.length === 0}
                    className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 text-white font-bold text-xs rounded-xl cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>{contextMeta.actionClose} ({tableTotalMT.toLocaleString()} MT)</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
