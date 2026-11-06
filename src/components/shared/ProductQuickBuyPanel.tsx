import React, { useState } from 'react';
import { Establishment, CartItem, UserProfile } from "../../types/types";
import { X, Calendar, Truck, CheckCircle, ShoppingBag, Zap, Clock, Users, BedDouble, Lock } from 'lucide-react';
import { getProductFallbackImage } from "../../data/data";

interface ProductQuickBuyPanelProps {
  establishment: Establishment;
  quickProduct: any;
  setQuickProduct: (p: any | null) => void;
  selectedVariant: any | null;
  setSelectedVariant: (v: any | null) => void;
  quickQty: number;
  setQuickQty: (q: number) => void;
  shippingOption: 'pickup' | 'delivery';
  setShippingOption: (opt: 'pickup' | 'delivery') => void;
  destZone: string;
  setDestZone: (z: string) => void;
  deliveryFee: number;
  scheduleUpfrontPct: number;
  setScheduleUpfrontPct: (pct: number) => void;
  isScheduleMode: boolean;
  setIsScheduleMode: (v: boolean) => void;
  bookingDate: string;
  setBookingDate: (d: string) => void;
  onAddToCart?: (product: any, est: Establishment, quantity?: number) => void;
  currentUser?: UserProfile | null;
  onRequireAuth?: (featureName?: string) => void;
}

export default function ProductQuickBuyPanel({
  establishment,
  quickProduct,
  setQuickProduct,
  selectedVariant,
  setSelectedVariant,
  quickQty,
  setQuickQty,
  shippingOption,
  setShippingOption,
  destZone,
  setDestZone,
  deliveryFee,
  scheduleUpfrontPct,
  setScheduleUpfrontPct,
  isScheduleMode,
  setIsScheduleMode,
  bookingDate,
  setBookingDate,
  onAddToCart,
  currentUser,
  onRequireAuth
}: ProductQuickBuyPanelProps) {
  // Category specific state: Hospedagem
  const [stayDurationType, setStayDurationType] = useState<'1hora' | '2horas' | 'pernoite' | 'dia_inteiro' | 'diaria_24h'>('diaria_24h');
  const [checkinTime, setCheckinTime] = useState('14:00');
  const [guestCount, setGuestCount] = useState(2);

  if (!quickProduct) return null;

  const isHospedagem = establishment.category === 'hospedagem' || quickProduct.category?.toLowerCase().includes('quarto') || quickProduct.category?.toLowerCase().includes('suite') || quickProduct.category?.toLowerCase().includes('hosped');

  // Calculate unit price based on stay duration if hospedagem
  const basePrice = selectedVariant?.promoPriceMT || selectedVariant?.priceMT || quickProduct.promoPriceMT || quickProduct.priceMT;
  
  const getStayPriceMultiplier = () => {
    if (!isHospedagem) return 1;
    switch (stayDurationType) {
      case '1hora': return 0.35; // e.g. 1800 -> 630 MT
      case '2horas': return 0.50; // e.g. 1800 -> 900 MT
      case 'pernoite': return 0.75; // e.g. 1800 -> 1350 MT (19h às 09h)
      case 'dia_inteiro': return 0.80; // e.g. 1800 -> 1440 MT (08h às 18h)
      case 'diaria_24h': default: return 1.0; // 1800 MT
    }
  };

  const stayDurationLabel = {
    '1hora': '1 Hora (Descanso Rápido)',
    '2horas': '2 Horas (Curta Duração)',
    'pernoite': 'Pernoite (19:00 às 09:00)',
    'dia_inteiro': 'Dia Inteiro / Day Use (08:00 às 18:00)',
    'diaria_24h': '24 Horas / Diária Completa'
  }[stayDurationType];

  const calculatedUnitPrice = Math.round(basePrice * getStayPriceMultiplier());
  const prodTotal = calculatedUnitPrice * quickQty;
  const shipFee = (!isHospedagem && shippingOption === 'delivery') ? deliveryFee : 0;
  const grandTotal = prodTotal + shipFee;
  const baseVal = Math.round(grandTotal / 1.16);
  const vatVal = grandTotal - baseVal;
  const upfrontAmount = Math.round((grandTotal * scheduleUpfrontPct) / 100);

  const handleConfirmAddToCart = (mode: 'immediate' | 'schedule') => {
    if (!currentUser) {
      if (onRequireAuth) {
        onRequireAuth(mode === 'schedule' ? 'Agendamento / Reserva Oficial' : 'Fazer Pedido / Compra Oficial');
      }
      return;
    }

    let finalItemName = quickProduct.name;
    if (selectedVariant) finalItemName += ` (${selectedVariant.name})`;
    
    if (isHospedagem) {
      finalItemName += ` [${stayDurationLabel} · Entrada: ${checkinTime}${bookingDate ? ` a ${bookingDate}` : ''} · ${guestCount} ${guestCount === 1 ? 'Hóspede' : 'Hóspedes'}]`;
    } else if (shippingOption === 'delivery') {
      finalItemName += ` [Entrega: ${destZone}]`;
    } else if (mode === 'schedule') {
      finalItemName += ` [Agendado: ${bookingDate || 'Data a confirmar'} · Sinal ${scheduleUpfrontPct}%]`;
    }

    const itemToCart = {
      id: selectedVariant ? `${quickProduct.id}-${selectedVariant.id}-${Date.now().toString().slice(-4)}` : `${quickProduct.id}-${Date.now().toString().slice(-4)}`,
      productId: quickProduct.id,
      name: finalItemName,
      productName: finalItemName,
      unitPriceMT: mode === 'schedule' ? upfrontAmount : calculatedUnitPrice,
      priceMT: mode === 'schedule' ? upfrontAmount : calculatedUnitPrice,
      quantity: quickQty,
      imageUrl: selectedVariant?.imageUrl || quickProduct.imageUrl,
      category: quickProduct.category || establishment.category,
      
      // Extended fields for category specialized carts
      bookingDate: bookingDate || undefined,
      bookingTime: isHospedagem ? checkinTime : undefined,
      bookingDurationType: isHospedagem ? stayDurationType : undefined,
      bookingDurationLabel: isHospedagem ? stayDurationLabel : undefined,
      bookingGuests: isHospedagem ? guestCount : undefined
    };

    if (onAddToCart) {
      onAddToCart(itemToCart, establishment, quickQty);
    }
    setQuickProduct(null);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn font-sans">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative my-auto space-y-0 text-slate-900">
        
        {/* Header Banner */}
        <div className="relative h-48 sm:h-56 bg-slate-900 overflow-hidden">
          <img 
            src={quickProduct.imageUrl || getProductFallbackImage(quickProduct.name, quickProduct.category)} 
            alt={quickProduct.name}
            className="w-full h-full object-cover opacity-90" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <button 
            type="button"
            onClick={() => setQuickProduct(null)}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full cursor-pointer transition-all border border-white/20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-[#103B75] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span>{isHospedagem ? 'Quarto / Suite Disponível' : (quickProduct.isAvailable !== false ? 'Em Stock / Disponível' : 'Agendamento')}</span>
              </span>
              <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                IVA 16% Incluso
              </span>
              {establishment.category && (
                <span className="bg-slate-700 text-slate-100 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  {establishment.category}
                </span>
              )}
            </div>
            <h3 className="text-lg font-serif font-bold text-white leading-tight">{quickProduct.name}</h3>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* ========================================================================= */}
          {/* HOSPEDAGEM SPECIALIZED COMPONENT: HORA, DURAÇÃO, DATA & CHECK-IN           */}
          {/* ========================================================================= */}
          {isHospedagem && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wider">
                  <BedDouble className="w-4 h-4 text-[#103B75]" />
                  <span>Reserva de Hospedagem & Horário</span>
                </div>
                <span className="text-[10px] font-bold bg-[#103B75] text-white px-2 py-0.5 rounded-md">
                  Preço por Duração
                </span>
              </div>

              {/* Duração da Estadia (Componente Hora / Diária) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                  <span>Escolha a Duração da Estada:</span>
                  <span className="text-[#103B75] font-bold text-xs">{calculatedUnitPrice} MT</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                  {[
                    { id: '1hora', label: '⏱️ 1 Hora (Descanso)', desc: `${Math.round(basePrice * 0.35)} MT` },
                    { id: '2horas', label: '⏱️ 2 Horas (Curta Duração)', desc: `${Math.round(basePrice * 0.50)} MT` },
                    { id: 'pernoite', label: '🌙 Pernoite (19h às 09h)', desc: `${Math.round(basePrice * 0.75)} MT` },
                    { id: 'dia_inteiro', label: '☀️ Dia Inteiro (08h às 18h)', desc: `${Math.round(basePrice * 0.80)} MT` },
                    { id: 'diaria_24h', label: '🏨 24 Horas / Diária', desc: `${basePrice} MT` }
                  ].map((opt, optIdx) => (
                    <button
                      key={`opt-${opt.id}-${optIdx}`}
                      type="button"
                      onClick={() => setStayDurationType(opt.id as any)}
                      className={`p-2 rounded-xl text-left border cursor-pointer transition-all flex items-center justify-between ${
                        stayDurationType === opt.id 
                          ? 'border-[#103B75] bg-blue-50 text-[#0B254B] font-bold shadow-xs' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-[11px]">{opt.label}</span>
                      <span className="text-[11px] font-mono font-bold text-[#103B75]">{opt.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Componente Hora de Check-in e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#103B75]" />
                    <span>Hora Check-in:</span>
                  </label>
                  <input
                    type="time"
                    value={checkinTime}
                    onChange={(e) => setCheckinTime(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#103B75]" />
                    <span>Data Entrada:</span>
                  </label>
                  <input
                    type="date"
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Users className="w-3 h-3 text-[#103B75]" />
                    <span>Hóspedes:</span>
                  </label>
                  <select
                    value={guestCount}
                    onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value={1}>1 Pessoa</option>
                    <option value={2}>2 Pessoas (Casal)</option>
                    <option value={3}>3 Pessoas</option>
                    <option value={4}>4+ Pessoas</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <span>Especificações do Artigo / Serviço:</span>
              <span className="text-[10px] font-mono text-white bg-[#103B75] px-2 py-0.5 rounded-md">
                Disponível
              </span>
            </div>
            {quickProduct.description ? (
              <p className="text-xs text-slate-700 leading-relaxed">{quickProduct.description}</p>
            ) : (
              <p className="text-xs text-slate-500 italic">Garantia e qualidade assegurada pelo estabelecimento {establishment.name}.</p>
            )}
          </div>

          {/* Quantity & Unit Stepper */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>{isHospedagem ? 'Número de Quartos / Diárias:' : 'Quantidade a Comprar:'}</span>
              <span className="text-[11px] text-[#103B75] font-bold">
                {calculatedUnitPrice} MT {isHospedagem ? `/${stayDurationType === '1hora' ? 'hora' : 'estadia'}` : '/un'}
              </span>
            </label>

            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-600">Ajustar Quantidade:</span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={() => setQuickQty(Math.max(1, quickQty - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-sm hover:bg-slate-100 cursor-pointer text-slate-800"
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quickQty}
                  onChange={(e) => setQuickQty(Math.max(1, Number(e.target.value)))}
                  className="w-16 p-1 bg-white border border-slate-300 rounded-lg text-center font-bold text-sm text-slate-900 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setQuickQty(quickQty + 1)}
                  className="w-8 h-8 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-sm hover:bg-slate-100 cursor-pointer text-slate-800"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Shipping Table / Option (For non-hospedagem items) */}
          {!isHospedagem && (
            <div className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50">
              <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                <span className="flex items-center gap-1.5 text-[#103B75]">
                  <Truck className="w-4 h-4 text-[#103B75]" />
                  <span>Opção de Entrega / Frete</span>
                </span>
                <span className="bg-slate-200 text-slate-800 text-[10px] px-2 py-0.5 rounded font-bold">
                  Opcional
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2 ${shippingOption === 'pickup' ? 'border-[#103B75] bg-white shadow-xs' : 'border-slate-200 bg-white/60'}`}>
                  <input 
                    type="radio" 
                    name="shippingOpt" 
                    checked={shippingOption === 'pickup'} 
                    onChange={() => setShippingOption('pickup')}
                    className="mt-0.5 accent-[#103B75] cursor-pointer" 
                  />
                  <div>
                    <div className="font-bold text-slate-900">🏬 Levantar no Local</div>
                    <div className="text-[10px] text-[#103B75] font-bold">Grátis</div>
                  </div>
                </label>

                <label className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-2 ${shippingOption === 'delivery' ? 'border-[#103B75] bg-white shadow-xs' : 'border-slate-200 bg-white/60'}`}>
                  <input 
                    type="radio" 
                    name="shippingOpt" 
                    checked={shippingOption === 'delivery'} 
                    onChange={() => setShippingOption('delivery')}
                    className="mt-0.5 accent-[#103B75] cursor-pointer" 
                  />
                  <div>
                    <div className="font-bold text-slate-900">🚚 Entrega / Frete</div>
                    <div className="text-[10px] text-[#103B75] font-bold">+{deliveryFee} MT ({destZone})</div>
                  </div>
                </label>
              </div>

              {shippingOption === 'delivery' && (
                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-semibold">Zona de Entrega:</span>
                  <select
                    value={destZone}
                    onChange={(e) => setDestZone(e.target.value)}
                    className="p-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="Baixa / Alto Maé">Baixa / Alto Maé (150 MT)</option>
                    <option value="Polana / Sommerschield">Polana / Sommerschield (200 MT)</option>
                    <option value="Xipamanine / Maxaquene">Xipamanine / Maxaquene (250 MT)</option>
                    <option value="Matola (Cidade)">Matola Cidade (450 MT)</option>
                    <option value="Zimpeto / Magoanine">Zimpeto / Magoanine (400 MT)</option>
                    <option value="Boane / Tchumene">Boane / Tchumene (750 MT)</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Total Calculation Display */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>{quickProduct.name} ({quickQty}x {calculatedUnitPrice} MT):</span>
              <span className="font-semibold text-slate-900">{prodTotal} MT</span>
            </div>
            {shippingOption === 'delivery' && !isHospedagem && (
              <div className="flex justify-between text-slate-600">
                <span>Frete de Entrega ({destZone}):</span>
                <span className="font-semibold text-[#103B75]">+{shipFee} MT</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-[11px] font-medium">
              <span>↳ Imposto IVA (16% incluído):</span>
              <span>+{vatVal} MT</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total do Pedido / Reserva:</span>
              <span className="text-base font-bold text-[#103B75]">{grandTotal} MT</span>
            </div>
          </div>

          {/* Final Action Buttons */}
          <div className="pt-2 space-y-2">
            {!currentUser && (
              <div className="bg-slate-100 border border-slate-300 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                  <Lock className="w-3.5 h-3.5 text-[#103B75] shrink-0" />
                  <span className="text-[11px]">Crie uma conta gratuita para confirmar a sua encomenda com segurança</span>
                </div>
                <button
                  type="button"
                  onClick={() => onRequireAuth?.('Fazer Pedido Oficial')}
                  className="px-2.5 py-1 bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-[11px] rounded-lg shrink-0 cursor-pointer shadow-2xs"
                >
                  Criar Conta
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => handleConfirmAddToCart('immediate')}
                className="flex-1 py-3.5 px-4 bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] active:scale-[0.99]"
              >
                <Zap className="w-4 h-4 text-white" />
                <span>{isHospedagem ? `Reservar Já (${grandTotal} MT)` : `⚡ Compra Imediata (${grandTotal} MT)`}</span>
              </button>
              
              <button
                type="button"
                onClick={() => handleConfirmAddToCart('immediate')}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold text-xs sm:text-sm rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#103B75]" />
                <span>+ Carrinho</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
