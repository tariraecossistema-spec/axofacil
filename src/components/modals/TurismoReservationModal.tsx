import React, { useState } from 'react';
import { ProductItem, Establishment, UserProfile, PaymentOrderRecord, CartItem } from '../../types/types';
import { 
  X, Calendar, Users, MapPin, Bus, Plane, Warehouse, CheckCircle2, 
  CreditCard, Smartphone, Building2, Copy, Check, ArrowRight, ShieldCheck, 
  MessageSquare, ShoppingBag, Sparkles, Clock, AlertCircle
} from 'lucide-react';
import { createPaymentOrder } from '../../services/paymentStore';
import { getPaymentConfigForEstablishment } from '../../services/paymentConfig';
import FileUpload from '../shared/FileUpload';
import { notify } from '../../services/dialogs';

interface TurismoReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: ProductItem | null;
  establishment: Establishment;
  currentUser?: UserProfile | null;
  onOpenAuth?: (tab: 'login' | 'criar') => void;
  onAddToCart?: (product: ProductItem, est: Establishment, quantity?: number) => void;
  onOpenPurchases?: () => void;
}

export default function TurismoReservationModal({
  isOpen,
  onClose,
  product,
  establishment,
  currentUser,
  onOpenAuth,
  onAddToCart,
  onOpenPurchases
}: TurismoReservationModalProps) {
  // Step state: 'configure' -> 'payment' -> 'success'
  const [step, setStep] = useState<'configure' | 'payment' | 'success'>('configure');

  // Reservation details
  const [reservationDate, setReservationDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [travelersCount, setTravelersCount] = useState(1);
  const [pickupLocation, setPickupLocation] = useState('Escritório Central (Baixa de Maputo)');
  const [specialNotes, setSpecialNotes] = useState('');
  const [paymentOption, setPaymentOption] = useState<'full' | 'upfront'>('upfront');

  // Client Details
  const [clientName, setClientName] = useState(currentUser?.name || '');
  const [clientPhone, setClientPhone] = useState(currentUser?.emailOrPhone || '');
  const [clientEmail, setClientEmail] = useState('');

  // Payment method & confirmation
  const [selectedMethod, setSelectedMethod] = useState<'mpesa' | 'emola' | 'transferencia_bancaria'>('mpesa');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [copySuccessField, setCopySuccessField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<PaymentOrderRecord | null>(null);

  if (!isOpen || !product) return null;

  const upfrontPct = product.upfrontPercentage || 50;
  const unitPrice = product.priceMT;
  const totalPrice = unitPrice * travelersCount;
  const amountToPayNow = paymentOption === 'upfront' 
    ? Math.round(totalPrice * (upfrontPct / 100))
    : totalPrice;
  const balanceToPayLater = totalPrice - amountToPayNow;

  const paymentConfig = getPaymentConfigForEstablishment(establishment.id, establishment.name);

  const handleCopy = (text: string, fieldLabel: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccessField(fieldLabel);
    setTimeout(() => setCopySuccessField(null), 2500);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      notify('Para agendar ou reservar qualquer serviço, é necessário criar uma conta ou iniciar sessão.', 'info');
      if (onOpenAuth) {
        onClose();
        onOpenAuth('criar');
      }
      return;
    }
    if (!clientName.trim() || !clientPhone.trim()) {
      notify('Por favor preencha o seu nome e telefone para a reserva.', 'error');
      return;
    }
    if (!reservationDate) {
      notify('Por favor escolha a data pretendida para a viagem / serviço.', 'error');
      return;
    }
    setStep('payment');
  };

  const handleAddToCartClick = () => {
    if (onAddToCart) {
      onAddToCart(
        {
          ...product,
          description: `${product.description} | Reserva para ${reservationDate} (${travelersCount} pessoa/unidade) | Recolha: ${pickupLocation}`
        },
        establishment,
        travelersCount
      );
      notify(`"${product.name}" adicionado ao carrinho com sucesso!`, 'success');
      onClose();
    }
  };

  const handleConfirmOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      notify('Por favor insira a referência ou código da transacção (M-Pesa, e-Mola ou Banco).', 'error');
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const summary = `Reserva: ${product.name} | Data: ${reservationDate} | ${travelersCount} passageiro(s)/unidade | Modalidade: ${paymentOption === 'upfront' ? `Sinal de ${upfrontPct}%` : 'Total 100%'}`;
      
      const cartItemDetail: CartItem = {
        id: `res-${Date.now()}`,
        productId: product.id,
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        productName: product.name,
        unitPriceMT: unitPrice,
        quantity: travelersCount
      };

      const newOrder = createPaymentOrder({
        userId: currentUser?.emailOrPhone,
        customerName: clientName.trim(),
        customerPhone: clientPhone.trim(),
        customerEmail: clientEmail.trim() || undefined,
        targetType: 'loja',
        establishmentId: establishment.id,
        establishmentName: establishment.name,
        orderItemsSummary: summary,
        itemsDetail: [cartItemDetail],
        subtotalAmountMT: totalPrice,
        deliveryFeeMT: 0,
        totalAmountMT: amountToPayNow,
        paymentMethod: selectedMethod,
        referenceNumber: referenceNumber.trim(),
        proofUrl: proofUrl || undefined,
        deliveryOption: 'pickup',
        deliveryAddress: `Recolha/Ponto de Encontro: ${pickupLocation}. Obs: ${specialNotes || 'Sem observações'}. Saldo a pagar no embarque: ${balanceToPayLater.toLocaleString('pt-PT')} MT`
      });

      setConfirmedOrder(newOrder);
      setIsSubmitting(false);
      setStep('success');
      notify('Reserva efetuada com sucesso! Aguarde a confirmação do operador.', 'success');
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-paper border border-ink/20 rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative my-auto text-ink">
        
        {/* Top Header Banner with Image */}
        <div className="relative h-44 sm:h-52 bg-slate-950 overflow-hidden">
          <img 
            src={product.imageUrl || 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80'} 
            alt={product.name}
            className="w-full h-full object-cover opacity-85" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />
          
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 bg-black/60 hover:bg-black/90 text-white p-2 rounded-full cursor-pointer transition-all border border-white/20 z-10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-cyan-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                {product.category}
              </span>
              {product.destination && (
                <span className="bg-white/20 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-300" />
                  <span>{product.destination}</span>
                </span>
              )}
              {product.durationLabel && (
                <span className="bg-amber-400 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{product.durationLabel}</span>
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-serif font-bold text-white leading-tight">
              {product.name}
            </h2>
          </div>
        </div>

        {/* STEP 1: CONFIGURE RESERVATION */}
        {step === 'configure' && (
          <form onSubmit={handleProceedToPayment} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            {/* Account Requirement Prompt if not logged in */}
            {!currentUser && (
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2.5 shadow-xs">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wide">
                      Criação de Conta Obrigatória para Agendamento
                    </h4>
                    <p className="text-xs text-amber-900/80 leading-relaxed">
                      Pode explorar todos os pacotes e preços livremente. Para agendar, reservar ou emitir comprovativo oficial, é necessário criar uma conta ou iniciar sessão no portal.
                    </p>
                  </div>
                </div>
                {onOpenAuth && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth('criar');
                      }}
                      className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Criar Conta / Registar-me</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth('login');
                      }}
                      className="py-2 px-3.5 bg-white hover:bg-amber-100 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition-all cursor-pointer"
                    >
                      <span>Já tenho conta / Iniciar Sessão</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Inclusions summary */}
            <div className="bg-sand-2/40 border border-ink/10 p-3.5 rounded-2xl space-y-2">
              <span className="text-[11px] font-bold text-ink/70 uppercase tracking-wider block">
                O que está incluído no pacote / serviço:
              </span>
              <div className="flex flex-wrap gap-2 text-xs text-ink/80">
                {product.includesTransport && (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 py-1 px-2.5 rounded-lg font-medium">
                    <Bus className="w-3.5 h-3.5" /> Transporte Próprio Climatizado
                  </span>
                )}
                {product.includesAirportPickup && (
                  <span className="inline-flex items-center gap-1 bg-cyan-50 text-cyan-800 border border-cyan-200 py-1 px-2.5 rounded-lg font-medium">
                    <Plane className="w-3.5 h-3.5" /> Receptivo no Aeroporto de Maputo
                  </span>
                )}
                {product.includesGuide && (
                  <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-800 border border-indigo-200 py-1 px-2.5 rounded-lg font-medium">
                    <Users className="w-3.5 h-3.5" /> Guia Turístico Acompanhante
                  </span>
                )}
                {product.includesLodging && (
                  <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200 py-1 px-2.5 rounded-lg font-medium">
                    <Warehouse className="w-3.5 h-3.5" /> Alojamento / Hotel Parceiro
                  </span>
                )}
              </div>
              <p className="text-xs text-ink/65 pt-1">
                {product.description}
              </p>
            </div>

            {/* Date & Travelers Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Data da Viagem / Agendamento:</span>
                </label>
                <input
                  type="date"
                  value={reservationDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setReservationDate(e.target.value)}
                  className="w-full bg-white border border-ink/20 rounded-xl py-2 px-3 text-xs font-semibold text-ink focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Nº de Viajantes / Passageiros:</span>
                </label>
                <div className="flex items-center border border-ink/20 rounded-xl bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTravelersCount(Math.max(1, travelersCount - 1))}
                    className="py-2 px-3 hover:bg-sand-2 text-ink font-bold text-sm cursor-pointer"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-xs text-ink">
                    {travelersCount} {travelersCount === 1 ? 'Pessoa / Vaga' : 'Pessoas / Vagas'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setTravelersCount(travelersCount + 1)}
                    className="py-2 px-3 hover:bg-sand-2 text-ink font-bold text-sm cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Pick up location */}
            <div>
              <label className="text-xs font-bold text-ink block mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-700" />
                <span>Ponto de Encontro / Recolha de Passageiros:</span>
              </label>
              <select
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full bg-white border border-ink/20 rounded-xl py-2 px-3 text-xs text-ink focus:ring-2 focus:ring-cyan-600 focus:outline-none"
              >
                <option value="Escritório Central (Baixa de Maputo, Av. 24 de Julho)">Escritório Central (Baixa de Maputo)</option>
                <option value="Aeroporto Internacional de Maputo (Com Placa de Receptivo)">Aeroporto Internacional de Maputo (Com Placa de Receptivo)</option>
                <option value="Costa do Sol / Marés Shopping (Maputo)">Costa do Sol / Marés Shopping (Maputo)</option>
                <option value="Matola Rio / Machava (Paragem de Autocarro)">Matola Rio / Machava</option>
                <option value="Recolha Directa no Hotel / Residência (A Combinar)">Recolha Directa no Hotel / Residência (A Combinar)</option>
              </select>
            </div>

            {/* Client Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Nome do Titular da Reserva:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Armando Sitoe"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-white border border-ink/20 rounded-xl py-2 px-3 text-xs text-ink focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Telefone / WhatsApp (Moçambique):
                </label>
                <input
                  type="text"
                  placeholder="Ex: 84 123 4567 ou 87 123 4567"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full bg-white border border-ink/20 rounded-xl py-2 px-3 text-xs text-ink focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Payment Mode (Upfront vs Full) */}
            <div className="bg-cyan-50/60 border border-cyan-200/80 rounded-2xl p-4 space-y-3">
              <span className="text-xs font-bold text-cyan-950 block">
                Escolha a Modalidade de Pagamento:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setPaymentOption('upfront')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentOption === 'upfront'
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm ring-2 ring-cyan-400'
                      : 'bg-white text-ink border-ink/15 hover:bg-sand-2/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Pagar Sinal ({upfrontPct}%)</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-extrabold ${paymentOption === 'upfront' ? 'bg-cyan-900 text-cyan-200' : 'bg-sand-2 text-ink/70'}`}>
                      Recomendado
                    </span>
                  </div>
                  <div className="text-sm font-extrabold mt-1">
                    {(totalPrice * (upfrontPct / 100)).toLocaleString('pt-PT')} MT
                  </div>
                  <div className={`text-[10px] mt-0.5 ${paymentOption === 'upfront' ? 'text-cyan-100' : 'text-ink/60'}`}>
                    Saldo de {balanceToPayLater.toLocaleString('pt-PT')} MT pago no embarque
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentOption('full')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    paymentOption === 'full'
                      ? 'bg-cyan-700 text-white border-cyan-700 shadow-sm ring-2 ring-cyan-400'
                      : 'bg-white text-ink border-ink/15 hover:bg-sand-2/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">Pagamento Integral (100%)</span>
                  </div>
                  <div className="text-sm font-extrabold mt-1">
                    {totalPrice.toLocaleString('pt-PT')} MT
                  </div>
                  <div className={`text-[10px] mt-0.5 ${paymentOption === 'full' ? 'text-cyan-100' : 'text-ink/60'}`}>
                    Tudo liquidado antecipadamente
                  </div>
                </button>
              </div>

              {/* Total Calculation */}
              <div className="border-t border-cyan-200/60 pt-2 flex items-center justify-between text-xs">
                <span className="text-cyan-900 font-medium">
                  {travelersCount}x de {unitPrice.toLocaleString('pt-PT')} MT (IVA 16% incluso)
                </span>
                <span className="text-cyan-950 font-black text-sm">
                  Valor a Pagar Agora: {amountToPayNow.toLocaleString('pt-PT')} MT
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm py-3.5 px-4 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <CreditCard className="w-4 h-4" />
                <span>Prosseguir para Pagamento ({amountToPayNow.toLocaleString('pt-PT')} MT)</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                {onAddToCart && (
                  <button
                    type="button"
                    onClick={handleAddToCartClick}
                    className="w-full bg-white hover:bg-sand-2/60 text-ink font-bold text-xs py-2.5 px-3 rounded-xl border border-ink/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-cyan-700" />
                    <span>Adicionar ao Carrinho</span>
                  </button>
                )}

                <a
                  href={`https://wa.me/258843005000?text=${encodeURIComponent(`Olá! Gostaria de fazer uma reserva de Turismo e Logística para: "${product.name}" na data ${reservationDate} para ${travelersCount} pessoa(s). Nome: ${clientName || 'Cliente'}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Dúvidas no WhatsApp</span>
                </a>
              </div>
            </div>

          </form>
        )}

        {/* STEP 2: PAYMENT WITH OFFICIAL M-PESA, E-MOLA, OR BANK TRANSFER */}
        {step === 'payment' && (
          <form onSubmit={handleConfirmOrder} className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-ink/60 block">Reserva em Curso</span>
                <h3 className="font-serif font-bold text-base text-ink">{product.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-ink/60 block">A Pagar Agora:</span>
                <span className="text-lg font-black text-cyan-800">{amountToPayNow.toLocaleString('pt-PT')} MT</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink block">
                Selecione o Método de Pagamento Oficial:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('mpesa')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedMethod === 'mpesa'
                      ? 'bg-red-700 text-white border-red-700 shadow-xs ring-2 ring-red-400'
                      : 'bg-white text-ink border-ink/15 hover:bg-sand-2/40'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="font-bold text-xs">M-Pesa</span>
                  <span className="text-[9px] opacity-80">Vodacom</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('emola')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedMethod === 'emola'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400'
                      : 'bg-white text-ink border-ink/15 hover:bg-sand-2/40'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span className="font-bold text-xs">e-Mola</span>
                  <span className="text-[9px] opacity-80">Movitel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('transferencia_bancaria')}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    selectedMethod === 'transferencia_bancaria'
                      ? 'bg-indigo-900 text-white border-indigo-900 shadow-xs ring-2 ring-indigo-400'
                      : 'bg-white text-ink border-ink/15 hover:bg-sand-2/40'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="font-bold text-xs">Banco BIM</span>
                  <span className="text-[9px] opacity-80">Transferência</span>
                </button>
              </div>
            </div>

            {/* Account Details to Copy */}
            {selectedMethod === 'mpesa' && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-950">Dados da Conta M-Pesa:</span>
                  <span className="text-[10px] bg-red-200 text-red-900 font-bold px-2 py-0.5 rounded">Oficial Shay Tec</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-red-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-ink/60 block">Número de Pagamento M-Pesa:</span>
                    <span className="font-mono font-bold text-sm text-ink">{paymentConfig.mpesa.numeroOuNib}</span>
                    <span className="text-[10px] text-ink/60 block">Titular: {paymentConfig.mpesa.titular}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentConfig.mpesa.numeroOuNib, 'mpesa')}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copySuccessField === 'mpesa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copySuccessField === 'mpesa' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'emola' && (
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-950">Dados da Conta e-Mola:</span>
                  <span className="text-[10px] bg-orange-200 text-orange-900 font-bold px-2 py-0.5 rounded">Oficial Movitel</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-ink/60 block">Número de Pagamento e-Mola:</span>
                    <span className="font-mono font-bold text-sm text-ink">{paymentConfig.emola.numeroOuNib}</span>
                    <span className="text-[10px] text-ink/60 block">Titular: {paymentConfig.emola.titular}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy(paymentConfig.emola.numeroOuNib, 'emola')}
                    className="p-2 bg-orange-100 hover:bg-orange-200 text-orange-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    {copySuccessField === 'emola' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copySuccessField === 'emola' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>
            )}

            {selectedMethod === 'transferencia_bancaria' && (
              <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950">Conta Millennium BIM:</span>
                  <span className="text-[10px] bg-indigo-200 text-indigo-900 font-bold px-2 py-0.5 rounded">Transferência</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-ink/60 block">NIB para Transferência:</span>
                      <span className="font-mono font-bold text-xs text-ink">{paymentConfig.banco.numeroOuNib}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentConfig.banco.numeroOuNib, 'nib')}
                      className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copySuccessField === 'nib' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copySuccessField === 'nib' ? 'Copiado!' : 'Copiar NIB'}</span>
                    </button>
                  </div>
                  <div className="text-[11px] text-ink/70 border-t border-indigo-100 pt-1.5">
                    Banco: <strong>{paymentConfig.banco.banco || 'Millennium BIM'}</strong> | Titular: <strong>{paymentConfig.banco.titular}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Reference Number & Proof Upload */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Código ou ID de Confirmação do Pagamento / SMS:
                </label>
                <input
                  type="text"
                  placeholder="Ex: PP260824.1234.H00000 ou Ref BIM"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="w-full bg-white border border-ink/20 rounded-xl py-2.5 px-3 text-xs font-mono font-bold text-ink focus:ring-2 focus:ring-cyan-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-ink block mb-1">
                  Comprovativo de Pagamento (Opcional mas recomendado):
                </label>
                <FileUpload
                  label="Anexar Foto ou Comprovativo do Pagamento"
                  currentUrl={proofUrl}
                  onUploadSuccess={(url) => setProofUrl(url)}
                />
              </div>
            </div>

            {/* Submit & Back buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('configure')}
                className="w-1/3 bg-sand-2 hover:bg-sand-2/80 text-ink font-bold text-xs py-3 px-3 rounded-xl border border-ink/15 cursor-pointer transition-colors"
              >
                Voltar
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-3 px-4 rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01] disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isSubmitting ? 'A Registar Reserva...' : 'Confirmar Reserva & Pagamento'}</span>
              </button>
            </div>

          </form>
        )}

        {/* STEP 3: SUCCESS CONFIRMATION */}
        {step === 'success' && confirmedOrder && (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                Reserva Registada com Sucesso!
              </span>
              <h3 className="text-xl font-serif font-bold text-ink">
                Obrigado, {confirmedOrder.customerName}!
              </h3>
              <p className="text-xs text-ink/70 max-w-md mx-auto leading-relaxed">
                A sua reserva para <strong>{product.name}</strong> foi submetida com a referência <span className="font-mono font-bold text-indigo-deep">{confirmedOrder.id}</span> e está a ser verificada pelo balcão oficial.
              </p>
            </div>

            {/* Order details summary card */}
            <div className="bg-sand-2/40 border border-ink/10 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <span className="text-ink/60">Código da Reserva:</span>
                <span className="font-mono font-bold text-ink">{confirmedOrder.id}</span>
              </div>
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <span className="text-ink/60">Data da Viagem:</span>
                <span className="font-bold text-ink">{reservationDate}</span>
              </div>
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <span className="text-ink/60">Passageiros / Unidades:</span>
                <span className="font-bold text-ink">{travelersCount}</span>
              </div>
              <div className="flex justify-between border-b border-ink/8 pb-2">
                <span className="text-ink/60">Valor Pago (Sinal/Total):</span>
                <span className="font-bold text-emerald-700">{confirmedOrder.totalAmountMT.toLocaleString('pt-PT')} MT</span>
              </div>
              {balanceToPayLater > 0 && (
                <div className="flex justify-between text-amber-900 bg-amber-50 p-2 rounded-lg font-medium">
                  <span>Saldo a liquidar no embarque:</span>
                  <span className="font-bold">{balanceToPayLater.toLocaleString('pt-PT')} MT</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="space-y-2 pt-2">
              <a
                href={`https://wa.me/258843005000?text=${encodeURIComponent(`Olá! Acabei de efetuar a reserva "${confirmedOrder.id}" no balcão de Turismo e Logística para o serviço "${product.name}" na data ${reservationDate}. Comprovativo registado.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notificar Operador pelo WhatsApp</span>
              </a>

              {onOpenPurchases && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPurchases();
                  }}
                  className="w-full bg-sand-2 hover:bg-sand-2/80 text-indigo-deep font-bold text-xs py-2.5 px-4 rounded-xl border border-ink/15 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Ver em Minhas Compras</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="text-xs text-ink/60 hover:text-ink font-semibold underline pt-1 cursor-pointer block mx-auto"
              >
                Fechar janela
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
