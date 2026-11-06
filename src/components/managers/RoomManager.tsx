import React, { useState, useEffect } from 'react';
import { Establishment, FinancialTransaction, InventoryItem } from "../../types/types";
import { saveFinancialTransactions } from "../../data/data";
import { recordOfflineChange } from "../../services/offlineSync";
import { recordAdminAction } from "../../services/adminAuditStore";
import { 
  Building2, Key, Bed, UserCheck, CheckCircle2, Clock, 
  DollarSign, Sparkles, Plus, AlertCircle, RefreshCw, Trash2, X, Phone, User, Calendar
} from 'lucide-react';

export interface RoomRecord {
  id: string;
  establishmentId: string;
  roomNumber: string; // e.g. "Quarto 101"
  roomType: string; // e.g. "Suíte Executiva", "Quarto Duplo Casal", "Bungalow Vista Mar"
  dailyPriceMT: number;
  status: 'livre' | 'ocupado' | 'limpeza' | 'reservado';
  guestName?: string;
  guestPhone?: string;
  checkInDate?: string;
  checkOutExpectedDate?: string;
  nightsCount?: number;
  operatorName?: string;
  notes?: string;
}

interface RoomManagerProps {
  establishment: Establishment;
  inventoryItems: InventoryItem[];
  activeOperator: string;
  financialTxs: FinancialTransaction[];
  setFinancialTxs: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
}

export default function RoomManager({
  establishment,
  inventoryItems,
  activeOperator,
  financialTxs,
  setFinancialTxs
}: RoomManagerProps) {
  // Load rooms from localStorage or generate realistic default rooms
  const [rooms, setRooms] = useState<RoomRecord[]>(() => {
    const saved = localStorage.getItem(`axofacil_hotel_rooms_${establishment.id}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        // fallback
      }
    }
    return [
      {
        id: 'r-101',
        establishmentId: establishment.id,
        roomNumber: 'Quarto 101',
        roomType: 'Suíte Executiva com AC',
        dailyPriceMT: 4500,
        status: 'ocupado',
        guestName: 'Dra. Elsa Cossa',
        guestPhone: '841234567',
        checkInDate: new Date().toISOString().split('T')[0],
        checkOutExpectedDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
        nightsCount: 2,
        operatorName: activeOperator || 'Recepção Pousada',
        notes: 'Cliente Frequente - Pequeno Almoço Incluído'
      },
      {
        id: 'r-102',
        establishmentId: establishment.id,
        roomNumber: 'Quarto 102',
        roomType: 'Quarto Duplo Casal',
        dailyPriceMT: 3200,
        status: 'livre',
        operatorName: activeOperator
      },
      {
        id: 'r-103',
        establishmentId: establishment.id,
        roomNumber: 'Quarto 103',
        roomType: 'Quarto Solteiro Económico',
        dailyPriceMT: 2200,
        status: 'limpeza',
        notes: 'Troca de enxoval e higienização em curso'
      },
      {
        id: 'r-104',
        establishmentId: establishment.id,
        roomNumber: 'Suíte Presidencial 201',
        roomType: 'Bungalow / Suíte Master',
        dailyPriceMT: 6500,
        status: 'reservado',
        guestName: 'Eng. António Mabote',
        guestPhone: '829876543',
        checkInDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        checkOutExpectedDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
        nightsCount: 3,
        notes: 'Reserva confirmada via M-Pesa'
      },
      {
        id: 'r-105',
        establishmentId: establishment.id,
        roomNumber: 'Quarto 202',
        roomType: 'Quarto Duplo Solteiro',
        dailyPriceMT: 2800,
        status: 'livre'
      }
    ];
  });

  // Filter State
  const [filterStatus, setFilterStatus] = useState<'todos' | 'livre' | 'ocupado' | 'limpeza' | 'reservado'>('todos');

  // Selected Room Modal State
  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [showRoomModal, setShowRoomModal] = useState(false);

  // Form Inputs for Check-in / Registration
  const [guestNameInput, setGuestNameInput] = useState('');
  const [guestPhoneInput, setGuestPhoneInput] = useState('');
  const [nightsInput, setNightsInput] = useState<number>(1);
  const [payMethodInput, setPayMethodInput] = useState<'M-Pesa' | 'e-Mola' | 'Transferência BCI/BIM' | 'Dinheiro' | 'POS Cartão'>('M-Pesa');
  const [roomNotesInput, setRoomNotesInput] = useState('');

  // Create New Room Modal State
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [newRoomNum, setNewRoomNum] = useState('');
  const [newRoomType, setNewRoomType] = useState('Suíte Executiva');
  const [newRoomPrice, setNewRoomPrice] = useState<number>(3000);

  // Save to LocalStorage whenever rooms state updates
  useEffect(() => {
    localStorage.setItem(`axofacil_hotel_rooms_${establishment.id}`, JSON.stringify(rooms));
    recordOfflineChange();
  }, [rooms, establishment.id]);

  // Open Room Management Modal
  const handleOpenRoomModal = (room: RoomRecord) => {
    setSelectedRoom(room);
    setGuestNameInput(room.guestName || '');
    setGuestPhoneInput(room.guestPhone || '');
    setNightsInput(room.nightsCount || 1);
    setRoomNotesInput(room.notes || '');
    setShowRoomModal(true);
  };

  // Process Check-in (Guest Check-in)
  const handleCheckIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoom || !guestNameInput.trim()) return;

    const totalCost = selectedRoom.dailyPriceMT * nightsInput;
    const todayStr = new Date().toISOString().split('T')[0];
    const checkOutDateStr = new Date(Date.now() + 86400000 * nightsInput).toISOString().split('T')[0];

    const updated = rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          status: 'ocupado' as const,
          guestName: guestNameInput.trim(),
          guestPhone: guestPhoneInput.trim(),
          checkInDate: todayStr,
          checkOutExpectedDate: checkOutDateStr,
          nightsCount: nightsInput,
          operatorName: activeOperator || 'Recepção Alojamento',
          notes: roomNotesInput
        };
      }
      return r;
    });

    setRooms(updated);

    // Automatically record receipt in Financial Ledger
    const newTx: FinancialTransaction = {
      id: 'fin-hotel-' + Date.now(),
      establishmentId: establishment.id,
      date: todayStr,
      type: 'receita',
      category: 'Diárias de Hospedagem',
      description: `Check-in ${selectedRoom.roomNumber} (${nightsInput} Noite(s) - ${guestNameInput})`,
      amountMT: totalCost,
      paymentMethod: payMethodInput,
      status: 'Pago',
      customerName: guestNameInput,
      operatorName: activeOperator || 'Recepção'
    };

    const updatedTxs = [newTx, ...financialTxs];
    setFinancialTxs(updatedTxs);
    saveFinancialTransactions(updatedTxs);

    // Record directly in Admin Panel Central Activity & Audit Log
    recordAdminAction({
      type: 'reserva_hospedagem',
      title: `Check-in Hospedagem: ${establishment.name} · Quarto ${selectedRoom.roomNumber}`,
      userName: guestNameInput.trim(),
      userContact: guestPhoneInput.trim() || 'Sem contacto fornecido',
      categoryOrSegment: 'hospedagem',
      amountMT: totalCost,
      details: `Registo de Check-in em Hospedagem: ${establishment.name} · Quarto ${selectedRoom.roomNumber} (${selectedRoom.roomType || 'Standard'}) · Estadia: ${nightsInput} Noite(s) · Total: ${totalCost.toLocaleString()} MT · Pagamento: ${payMethodInput} · Operador: ${activeOperator || 'Recepção'} ${roomNotesInput ? '· Obs: ' + roomNotesInput : ''}`,
      status: 'Confirmado',
      metadata: {
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        roomNumber: selectedRoom.roomNumber,
        roomType: selectedRoom.roomType,
        nights: nightsInput,
        amountMT: totalCost,
        checkInDate: todayStr,
        checkOutExpectedDate: checkOutDateStr
      }
    });

    setShowRoomModal(false);
  };

  // Process Check-Out (Free Room)
  const handleCheckOut = () => {
    if (!selectedRoom) return;

    const updated = rooms.map(r => {
      if (r.id === selectedRoom.id) {
        return {
          ...r,
          status: 'limpeza' as const, // Room goes to cleaning after checkout
          guestName: undefined,
          guestPhone: undefined,
          checkInDate: undefined,
          checkOutExpectedDate: undefined,
          nightsCount: undefined,
          notes: 'Quarto a aguardar higienização pós checkout'
        };
      }
      return r;
    });

    setRooms(updated);
    setShowRoomModal(false);
  };

  // Toggle Cleaning Done (Limpeza -> Livre)
  const handleSetRoomClean = (roomId: string) => {
    const updated = rooms.map(r => {
      if (r.id === roomId) {
        return {
          ...r,
          status: 'livre' as const,
          notes: undefined
        };
      }
      return r;
    });
    setRooms(updated);
  };

  // Add New Room
  const handleAddRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomNum.trim() || !newRoomPrice) return;

    const newRoom: RoomRecord = {
      id: 'r-' + Date.now(),
      establishmentId: establishment.id,
      roomNumber: newRoomNum.trim(),
      roomType: newRoomType,
      dailyPriceMT: Number(newRoomPrice),
      status: 'livre'
    };

    setRooms([...rooms, newRoom]);
    setNewRoomNum('');
    setShowAddRoomModal(false);
  };

  // Filtered Rooms
  const filteredRooms = rooms.filter(r => {
    if (filterStatus === 'todos') return true;
    return r.status === filterStatus;
  });

  // Calculate Metrics
  const totalCount = rooms.length;
  const occupiedCount = rooms.filter(r => r.status === 'ocupado').length;
  const cleaningCount = rooms.filter(r => r.status === 'limpeza').length;
  const freeCount = rooms.filter(r => r.status === 'livre').length;
  const occupancyRate = totalCount > 0 ? Math.round((occupiedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-white border border-ink/12 rounded-2xl p-6 shadow-xs space-y-6">
      
      {/* Top Banner & Hotel Metrics */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-ink/10 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-sky-100 text-sky-900 text-[10px] font-bold py-0.5 px-2.5 rounded-md mb-1 border border-sky-300">
            <Building2 className="w-3.5 h-3.5 text-sky-700" />
            <span>Módulo de Gestão de Hospedagem & Alojamento</span>
          </div>
          <h2 className="font-serif font-bold text-2xl text-indigo-deep">
            Controlo de Quartos, Suítes & Diárias
          </h2>
          <p className="text-xs text-ink/60 mt-0.5">
            Gerencie o mapa de ocupação dos quartos, efetue check-in/out rápido, controlo de limpeza e faturamento de hóspedes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddRoomModal(true)}
          className="py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-4 h-4 text-sand" />
          <span>Cadastrar Novo Quarto / Suíte</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-sand-2/30 border border-ink/10 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-ink/50 uppercase">Total de Quartos</span>
          <div className="text-xl font-serif font-bold text-indigo-deep">{totalCount} unidades</div>
          <div className="text-[10px] font-bold text-emerald-700">{freeCount} Disponíveis Agora</div>
        </div>

        <div className="bg-sky-50 border border-sky-200 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-sky-800 uppercase">Taxa de Ocupação</span>
          <div className="text-xl font-serif font-bold text-sky-900">{occupancyRate}%</div>
          <div className="text-[10px] font-bold text-sky-700">{occupiedCount} Quartos Ocupados</div>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-amber-800 uppercase">Em Limpeza / Manutenção</span>
          <div className="text-xl font-serif font-bold text-amber-900">{cleaningCount} quartos</div>
          <div className="text-[10px] font-bold text-amber-700">Aguardam Higienização</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Faturamento Diárias (Mês)</span>
          <div className="text-xl font-serif font-bold text-emerald-900">
            {financialTxs.filter(t => t.category === 'Diárias de Hospedagem').reduce((s, t) => s + t.amountMT, 0).toLocaleString()} MT
          </div>
          <div className="text-[10px] font-bold text-emerald-700">Registados no Caixa</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3">
        {(['todos', 'livre', 'ocupado', 'limpeza', 'reservado'] as const).map((st, idx) => (
          <button
            key={`room-st-${st}-${idx}`}
            type="button"
            onClick={() => setFilterStatus(st)}
            className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
              filterStatus === st 
                ? 'bg-indigo-deep text-paper shadow-2xs' 
                : 'bg-paper text-ink/70 hover:bg-sand-2/40 border border-ink/10'
            }`}
          >
            {st === 'todos' ? 'Todos os Quartos' : st === 'livre' ? '🟢 Livres' : st === 'ocupado' ? '🔴 Ocupados' : st === 'limpeza' ? '🧹 Em Limpeza' : '🟡 Reservados'}
          </button>
        ))}
      </div>

      {/* Room Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room, idx) => (
          <div 
            key={`room-card-${room.id}-${idx}`}
            className={`border rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all relative ${
              room.status === 'ocupado' 
                ? 'bg-rose-50/40 border-rose-200 shadow-2xs' 
                : room.status === 'limpeza' 
                  ? 'bg-amber-50/40 border-amber-200 shadow-2xs'
                  : room.status === 'reservado'
                    ? 'bg-sky-50/40 border-sky-200 shadow-2xs'
                    : 'bg-white border-ink/12 shadow-2xs hover:border-indigo-brand'
            }`}
          >
            <div>
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink/40 block">{room.roomType}</span>
                  <h3 className="font-serif font-bold text-lg text-indigo-deep">{room.roomNumber}</h3>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  room.status === 'ocupado' 
                    ? 'bg-rose-600 text-white' 
                    : room.status === 'limpeza' 
                      ? 'bg-amber-500 text-white'
                      : room.status === 'reservado'
                        ? 'bg-sky-600 text-white'
                        : 'bg-emerald-600 text-white'
                }`}>
                  {room.status === 'ocupado' ? '🔴 Ocupado' : room.status === 'limpeza' ? '🧹 Limpeza' : room.status === 'reservado' ? '🟡 Reservado' : '🟢 Livre'}
                </span>
              </div>

              <div className="mt-2 text-xs font-serif font-bold text-emerald-800">
                {room.dailyPriceMT.toLocaleString()} MT <span className="text-[10px] font-sans font-normal text-ink/60">/ diária</span>
              </div>

              {/* Guest Details if Occupied or Reserved */}
              {(room.guestName || room.notes) && (
                <div className="mt-3 bg-white/80 p-2.5 rounded-xl border border-ink/8 space-y-1 text-xs">
                  {room.guestName && (
                    <div className="flex items-center gap-1.5 font-bold text-indigo-deep">
                      <User className="w-3.5 h-3.5 text-indigo-brand" />
                      <span>{room.guestName}</span>
                    </div>
                  )}
                  {room.guestPhone && (
                    <div className="flex items-center gap-1.5 text-ink/60 text-[11px]">
                      <Phone className="w-3 h-3" />
                      <span>{room.guestPhone}</span>
                    </div>
                  )}
                  {room.checkInDate && (
                    <div className="text-[10px] text-ink/50 font-medium">
                      Entrada: {room.checkInDate} · Prev. Saída: {room.checkOutExpectedDate}
                    </div>
                  )}
                  {room.notes && (
                    <p className="text-[10.5px] text-ink/70 italic pt-1 border-t border-ink/5">
                      "{room.notes}"
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Room Card Action Buttons */}
            <div className="pt-2 border-t border-ink/8 flex items-center justify-between gap-2">
              {room.status === 'limpeza' ? (
                <button
                  type="button"
                  onClick={() => handleSetRoomClean(room.id)}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Concluir Limpeza (Marcar Livre)</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleOpenRoomModal(room)}
                  className="w-full py-2 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Key className="w-3.5 h-3.5 text-sand" />
                  <span>{room.status === 'ocupado' ? 'Gerenciar Hóspede / Check-Out' : 'Efectuar Check-In'}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* CHECK-IN / ROOM MANAGEMENT MODAL POPUP */}
      {showRoomModal && selectedRoom && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-paper border border-ink/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-start border-b border-ink/10 pb-3">
              <div>
                <div className="text-indigo-deep font-serif font-bold text-xl flex items-center gap-2">
                  <Key className="w-5 h-5 text-terracotta" />
                  <span>{selectedRoom.roomNumber} ({selectedRoom.roomType})</span>
                </div>
                <p className="text-xs text-ink/60 mt-0.5">Diária: {selectedRoom.dailyPriceMT.toLocaleString()} MT</p>
              </div>
              <button
                onClick={() => setShowRoomModal(false)}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-sand-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedRoom.status === 'ocupado' ? (
              /* Occupied Options: Check-Out or Update Notes */
              <div className="space-y-4 text-xs">
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-1">
                  <span className="font-bold text-rose-900 block">Quarto Ocupado por:</span>
                  <div className="text-base font-bold text-indigo-deep">{selectedRoom.guestName}</div>
                  <div className="text-ink/60">Contacto: {selectedRoom.guestPhone || 'Não especificado'}</div>
                  <div className="text-ink/60">Permanência: {selectedRoom.nightsCount || 1} noite(s)</div>
                </div>

                <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-ink/10">
                  <span className="font-bold text-ink/70">Total Pago de Diárias:</span>
                  <strong className="font-serif text-emerald-800 text-sm">
                    {((selectedRoom.nightsCount || 1) * selectedRoom.dailyPriceMT).toLocaleString()} MT
                  </strong>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(false)}
                    className="py-2.5 px-4 bg-paper border border-ink/15 rounded-xl font-bold text-ink/70 hover:bg-sand-2/40 cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={handleCheckOut}
                    className="py-2.5 px-5 bg-rose-700 text-white font-bold rounded-xl hover:bg-rose-800 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Efectuar Check-Out & Enviar p/ Limpeza</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Free Room: Perform Check-In Form */
              <form onSubmit={handleCheckIn} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-ink/70 mb-1">Nome Completo do Hóspede *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Dr. Carlos Tembe"
                    value={guestNameInput}
                    onChange={(e) => setGuestNameInput(e.target.value)}
                    className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-ink/70 mb-1">Contacto / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: 841234567"
                      value={guestPhoneInput}
                      onChange={(e) => setGuestPhoneInput(e.target.value)}
                      className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none focus:border-indigo-brand"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-ink/70 mb-1">Nº de Noites *</label>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={nightsInput}
                      onChange={(e) => setNightsInput(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold text-indigo-deep outline-none focus:border-indigo-brand"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink/70 mb-1">Forma de Pagamento das Diárias</label>
                  <select
                    value={payMethodInput}
                    onChange={(e) => setPayMethodInput(e.target.value as any)}
                    className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
                  >
                    <option value="M-Pesa">M-Pesa</option>
                    <option value="e-Mola">e-Mola</option>
                    <option value="Transferência BCI/BIM">Transferência BCI/BIM</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="POS Cartão">POS Cartão</option>
                  </select>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-900">Total a Cobrar ({nightsInput} noites):</span>
                  <strong className="font-serif text-emerald-800 text-sm">
                    {(selectedRoom.dailyPriceMT * nightsInput).toLocaleString()} MT
                  </strong>
                </div>

                <div>
                  <label className="block font-bold text-ink/70 mb-1">Observações / Preferências de Quarto</label>
                  <input
                    type="text"
                    placeholder="ex: Pequeno almoço no quarto / Check-out tardio"
                    value={roomNotesInput}
                    onChange={(e) => setRoomNotesInput(e.target.value)}
                    className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-medium outline-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRoomModal(false)}
                    className="py-2.5 px-4 bg-paper border border-ink/15 rounded-xl font-bold text-ink/70 hover:bg-sand-2/40 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="py-2.5 px-5 bg-emerald-700 text-white font-bold rounded-xl hover:bg-emerald-800 cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Check-In & Registar no Caixa</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* CREATE NEW ROOM MODAL POPUP */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-ink/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddRoom} className="bg-paper border border-ink/15 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex justify-between items-center border-b border-ink/10 pb-3">
              <div className="font-serif font-bold text-indigo-deep text-lg">
                ➕ Cadastrar Novo Quarto / Suíte
              </div>
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="p-1.5 text-ink/40 hover:text-ink hover:bg-sand-2 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Identificação do Quarto / Número *</label>
              <input
                type="text"
                required
                placeholder="ex: Quarto 203 ou Bungalow Luxo 05"
                value={newRoomNum}
                onChange={(e) => setNewRoomNum(e.target.value)}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none focus:border-indigo-brand"
              />
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Tipo de Alojamento</label>
              <select
                value={newRoomType}
                onChange={(e) => setNewRoomType(e.target.value)}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-bold outline-none"
              >
                <option value="Suíte Executiva">Suíte Executiva com AC</option>
                <option value="Quarto Duplo Casal">Quarto Duplo Casal</option>
                <option value="Quarto Solteiro Económico">Quarto Solteiro Económico</option>
                <option value="Bungalow Vista Mar">Bungalow Vista Mar</option>
                <option value="Apartamento T2 Executivo">Apartamento T2 Executivo</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-ink/70 mb-1">Preço da Diária em Meticais (MT) *</label>
              <input
                type="number"
                required
                value={newRoomPrice}
                onChange={(e) => setNewRoomPrice(Number(e.target.value))}
                className="w-full p-2.5 bg-white border border-ink/12 rounded-lg font-serif font-bold text-sm outline-none focus:border-emerald-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddRoomModal(false)}
                className="py-2.5 px-4 bg-paper border border-ink/15 rounded-xl font-bold text-ink/70 hover:bg-sand-2/40 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="py-2.5 px-5 bg-indigo-deep text-paper font-bold rounded-xl hover:bg-indigo-brand cursor-pointer shadow-xs"
              >
                Cadastrar Quarto
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
