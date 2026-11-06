import React, { useState } from 'react';
import { FlightSchedule, PassengerDetails, FlightTicketBooking, UserProfile } from "../../types/types";
import { createFlightBooking } from "../../services/flightStore";
import { 
  X, Plane, PlaneTakeoff, PlaneLanding, Calendar, Users, Luggage, 
  CreditCard, Smartphone, Building2, CheckCircle2, ShieldCheck, 
  Clock, ArrowRight, Printer, Download, Share2, Copy, Check, 
  Sparkles, Coffee, Wifi, Shield, AlertCircle, Info, ChevronRight,
  Ticket, QrCode
} from 'lucide-react';
import { notify } from "../../services/dialogs";

interface FlightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  outboundFlight: FlightSchedule;
  returnFlight?: FlightSchedule;
  tripType: 'one_way' | 'round_trip';
  outboundDate: string;
  returnDate?: string;
  cabinClass: 'economy' | 'premium_economy' | 'business';
  passengersCount: number;
  currentUser?: UserProfile | null;
  onOpenAuth?: (tab: 'login' | 'criar') => void;
  onOpenPurchases?: () => void;
}

export default function FlightBookingModal({
  isOpen,
  onClose,
  outboundFlight,
  returnFlight,
  tripType,
  outboundDate,
  returnDate,
  cabinClass,
  passengersCount,
  currentUser,
  onOpenAuth,
  onOpenPurchases
}: FlightBookingModalProps) {
  const [step, setStep] = useState<'fare' | 'passengers' | 'seats_addons' | 'payment' | 'success'>('fare');
  const [fareType, setFareType] = useState<'light' | 'standard' | 'flex'>('standard');

  // Contact details
  const [contactName, setContactName] = useState(currentUser?.name || '');
  const [contactEmail, setContactEmail] = useState(currentUser?.emailOrPhone?.includes('@') ? currentUser.emailOrPhone : '');
  const [contactPhone, setContactPhone] = useState(currentUser?.emailOrPhone || '843005000');

  // Passengers list initialized
  const [passengers, setPassengers] = useState<PassengerDetails[]>(() => {
    const list: PassengerDetails[] = [];
    for (let i = 0; i < Math.max(1, passengersCount); i++) {
      const names = (currentUser?.name || '').split(' ');
      list.push({
        id: `pax-${i + 1}`,
        type: i === 0 ? 'adult' : 'adult',
        title: 'Sr.',
        firstName: i === 0 && names[0] ? names[0] : '',
        lastName: i === 0 && names.length > 1 ? names.slice(1).join(' ') : '',
        idType: outboundFlight.destination.country === 'Moçambique' ? 'BI' : 'Passaporte',
        idNumber: '',
        nationality: 'Moçambicana',
        birthDate: '1990-01-15',
        gender: 'M',
        seatSelected: `${10 + i}${i % 2 === 0 ? 'A' : 'C'}`
      });
    }
    return list;
  });

  // Add-ons states
  const [extraBaggageCount, setExtraBaggageCount] = useState(0);
  const [flamingoLoungeAccess, setFlamingoLoungeAccess] = useState(false);
  const [travelInsurance, setTravelInsurance] = useState(true);
  const [airportTransferPickup, setAirportTransferPickup] = useState(false);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'conta_movel' | 'cartao_simo' | 'transferencia_bancaria'>('mpesa');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<FlightTicketBooking | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  if (!isOpen || !outboundFlight) return null;

  // Price calculations
  const baseRate = cabinClass === 'business' && outboundFlight.basePriceBusinessMT 
    ? outboundFlight.basePriceBusinessMT 
    : outboundFlight.basePriceEconomyMT;

  const returnBaseRate = returnFlight 
    ? (cabinClass === 'business' && returnFlight.basePriceBusinessMT ? returnFlight.basePriceBusinessMT : returnFlight.basePriceEconomyMT) 
    : 0;

  // Fare modifiers
  const fareModifier = fareType === 'light' ? 0.9 : fareType === 'flex' ? 1.25 : 1.0;
  const flightPerPax = Math.round((baseRate + returnBaseRate) * fareModifier);
  const totalFlightsBase = flightPerPax * passengers.length;

  const taxesPerPax = (outboundFlight.taxesMT || 850) + (returnFlight?.taxesMT || 0);
  const totalTaxes = taxesPerPax * passengers.length;

  // Addons amounts
  const extraBaggagePrice = 1800; // MT per extra bag
  const flamingoLoungePrice = 2500; // MT per person
  const travelInsurancePrice = 1200; // MT per person
  const airportTransferPrice = 1500; // MT

  const extraBaggageTotal = extraBaggageCount * extraBaggagePrice;
  const loungeTotal = flamingoLoungeAccess ? flamingoLoungePrice * passengers.length : 0;
  const insuranceTotal = travelInsurance ? travelInsurancePrice * passengers.length : 0;
  const transferTotal = airportTransferPickup ? airportTransferPrice : 0;

  const addonsTotal = extraBaggageTotal + loungeTotal + insuranceTotal + transferTotal;
  const grandTotal = totalFlightsBase + totalTaxes + addonsTotal;

  const handlePassengerChange = (index: number, field: keyof PassengerDetails, value: any) => {
    setPassengers(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleProceedToPassengers = () => {
    setStep('passengers');
  };

  const handleProceedToSeats = () => {
    // Validate passengers
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      if (!p.firstName.trim() || !p.lastName.trim() || !p.idNumber.trim()) {
        notify(`Por favor preencha o nome, apelido e número de documento do Passageiro ${i + 1}.`, 'error');
        return;
      }
    }
    if (!contactPhone.trim()) {
      notify('Por favor informe o número de telefone de contacto para envio do bilhete.', 'error');
      return;
    }
    setStep('seats_addons');
  };

  const handleProceedToPayment = () => {
    setStep('payment');
  };

  const handleConfirmPaymentAndIssueTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceNumber.trim()) {
      notify('Por favor insira o número de transação ou comprovativo de pagamento.', 'error');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      try {
        const booking = createFlightBooking({
          userId: currentUser?.id,
          contactName: contactName || `${passengers[0].firstName} ${passengers[0].lastName}`,
          contactEmail: contactEmail || 'axofacil@gmail.com',
          contactPhone,
          tripType,
          outboundFlight,
          returnFlight,
          outboundDate,
          returnDate: tripType === 'round_trip' ? returnDate : undefined,
          cabinClass,
          passengers,
          seatNumbers: passengers.map(p => p.seatSelected || '12A'),
          fareType,
          selectedAddons: {
            extraBaggageCount,
            extraBaggageAmountMT: extraBaggageTotal,
            flamingoLoungeAccess,
            flamingoLoungeAmountMT: loungeTotal,
            travelInsurance,
            travelInsuranceAmountMT: insuranceTotal,
            airportTransferPickup,
            airportTransferAmountMT: transferTotal
          },
          subtotalMT: totalFlightsBase,
          taxesAmountMT: totalTaxes,
          addonsAmountMT: addonsTotal,
          totalAmountMT: grandTotal,
          paymentMethod,
          paymentReference: referenceNumber.toUpperCase(),
          paymentStatus: 'confirmado',
          bookingStatus: 'confirmado'
        });

        setConfirmedBooking(booking);
        setIsProcessing(false);
        setStep('success');
        notify(`Reserva confirmada com sucesso! Código PNR: ${booking.pnr}`, 'success');
      } catch (err) {
        console.error(err);
        setIsProcessing(false);
        notify('Erro ao emitir o bilhete aéreo. Tente novamente.', 'error');
      }
    }, 1200);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(label);
    setTimeout(() => setCopySuccess(null), 2500);
  };

  const handlePrintBoardingPass = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 my-auto flex flex-col">
        
        {/* MODAL HEADER */}
        <div className="bg-linear-to-r from-slate-950 via-cyan-950 to-slate-900 text-white p-5 sm:p-6 sticky top-0 z-20 flex items-center justify-between border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-black bg-cyan-500 text-slate-950 px-2 py-0.5 rounded-full">
                  Emissão Oficial de Bilhete
                </span>
                <span className="text-xs text-cyan-200/80">
                  {outboundFlight.airline.shortName} · {outboundFlight.flightNumber}
                </span>
              </div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-white flex items-center gap-2 mt-0.5">
                <span>{outboundFlight.origin.city} ({outboundFlight.origin.code})</span>
                <ArrowRight className="w-4 h-4 text-cyan-400" />
                <span>{outboundFlight.destination.city} ({outboundFlight.destination.code})</span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP PROGRESS BAR */}
        {step !== 'success' && (
          <div className="bg-slate-100 px-6 py-3 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-500 overflow-x-auto">
            <div className={`flex items-center gap-1.5 ${step === 'fare' ? 'text-cyan-700' : 'text-slate-700'}`}>
              <span className="w-5 h-5 rounded-full bg-cyan-100 text-cyan-800 flex items-center justify-center text-[10px]">1</span>
              <span>Tarifa</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className={`flex items-center gap-1.5 ${step === 'passengers' ? 'text-cyan-700' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">2</span>
              <span>Passageiros</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className={`flex items-center gap-1.5 ${step === 'seats_addons' ? 'text-cyan-700' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">3</span>
              <span>Assentos & Lounges</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className={`flex items-center gap-1.5 ${step === 'payment' ? 'text-cyan-700' : ''}`}>
              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px]">4</span>
              <span>Pagamento M-Pesa / SIMO</span>
            </div>
          </div>
        )}

        {/* MODAL BODY CONTAINER */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">

          {/* ================= STEP 1: FARE SELECTION ================= */}
          {step === 'fare' && (
            <div className="space-y-6">
              {/* Flight Summary Card */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-lg ${outboundFlight.airline.logoBgColor || 'bg-slate-800'} text-white font-bold text-xs flex items-center justify-center`}>
                      {outboundFlight.airline.code}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">
                      {outboundFlight.airline.name}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                    Aeronave: {outboundFlight.aircraft} · {outboundFlight.terminal}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center pt-2">
                  <div>
                    <div className="text-xl font-bold font-mono text-slate-900">{outboundFlight.departureTime}</div>
                    <div className="font-bold text-xs text-slate-800">{outboundFlight.origin.city} ({outboundFlight.origin.code})</div>
                    <div className="text-[11px] text-slate-500">{outboundDate}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-[11px] font-semibold text-slate-500">{outboundFlight.durationFormatted}</div>
                    <div className="relative flex items-center justify-center my-1">
                      <div className="w-full h-0.5 bg-slate-300"></div>
                      <Plane className="w-4 h-4 text-cyan-600 absolute bg-slate-50 px-0.5" />
                    </div>
                    <div className="text-[10px] font-bold text-emerald-700">
                      {outboundFlight.stops === 0 ? 'Voo Direto' : `${outboundFlight.stops} Escala (${outboundFlight.stopCities?.join(', ')})`}
                    </div>
                  </div>

                  <div className="sm:text-right">
                    <div className="text-xl font-bold font-mono text-slate-900">{outboundFlight.arrivalTime}</div>
                    <div className="font-bold text-xs text-slate-800">{outboundFlight.destination.city} ({outboundFlight.destination.code})</div>
                    <div className="text-[11px] text-slate-500">{outboundDate}</div>
                  </div>
                </div>

                {returnFlight && (
                  <div className="pt-3 border-t border-slate-200 mt-2">
                    <div className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider mb-2">Voo de Regresso</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                      <div>
                        <div className="text-base font-bold font-mono text-slate-900">{returnFlight.departureTime}</div>
                        <div className="font-bold text-xs text-slate-800">{returnFlight.origin.city} ({returnFlight.origin.code})</div>
                        <div className="text-[11px] text-slate-500">{returnDate}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[10px] text-slate-500">{returnFlight.durationFormatted}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="text-base font-bold font-mono text-slate-900">{returnFlight.arrivalTime}</div>
                        <div className="font-bold text-xs text-slate-800">{returnFlight.destination.city} ({returnFlight.destination.code})</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fare Tier Comparison Cards */}
              <div>
                <h3 className="font-serif font-bold text-base text-slate-900 mb-3">
                  Escolha o Pacote de Tarifa Desejado:
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Light Fare */}
                  <div 
                    onClick={() => setFareType('light')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      fareType === 'light' 
                        ? 'border-cyan-600 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tarifa Económica Light</span>
                        {fareType === 'light' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Ideal para viagens rápidas e leves.</p>
                      
                      <div className="space-y-2 mt-4 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1 Mala de Mão (7 kg)</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          <span>Sem mala de porão</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                          <span>Não reembolsável</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-500">A partir de</span>
                      <div className="text-lg font-bold text-slate-900 font-serif">
                        {Math.round(flightPerPax * (0.9 / fareModifier)).toLocaleString('pt-PT')} MT
                      </div>
                    </div>
                  </div>

                  {/* Standard Fare (Recommended) */}
                  <div 
                    onClick={() => setFareType('standard')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                      fareType === 'standard' 
                        ? 'border-cyan-600 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <span className="absolute -top-2.5 right-4 bg-cyan-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow-xs">
                      Mais Popular
                    </span>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tarifa Standard</span>
                        {fareType === 'standard' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Bagagem despachada e maior flexibilidade.</p>
                      
                      <div className="space-y-2 mt-4 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1 Mala de Mão (7 kg)</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-cyan-900">
                          <Check className="w-3.5 h-3.5 text-cyan-600" />
                          <span>1 Mala de Porão (23 kg) incluída</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Snack ou Refeição a bordo</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Check className="w-3.5 h-3.5 text-amber-600" />
                          <span>Alteração de data com taxa reduzida</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-500">Por passageiro</span>
                      <div className="text-lg font-bold text-cyan-900 font-serif">
                        {Math.round(flightPerPax * (1.0 / fareModifier)).toLocaleString('pt-PT')} MT
                      </div>
                    </div>
                  </div>

                  {/* Flex Fare */}
                  <div 
                    onClick={() => setFareType('flex')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      fareType === 'flex' 
                        ? 'border-cyan-600 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/20' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-sm">Tarifa Flex Premium</span>
                        {fareType === 'flex' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">Liberdade total com 2 malas e cancelamento.</p>
                      
                      <div className="space-y-2 mt-4 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>1 Mala de Mão + 2x 23kg de Porão</span>
                        </div>
                        <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Alteração de data GRATUITA</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reembolso permitido</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Embarque Prioritário</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <span className="text-xs text-slate-500">Por passageiro</span>
                      <div className="text-lg font-bold text-slate-900 font-serif">
                        {Math.round(flightPerPax * (1.25 / fareModifier)).toLocaleString('pt-PT')} MT
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bottom Bar */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <div className="text-xs text-slate-500">Total estimado ({passengers.length} passageiro{passengers.length > 1 ? 's' : ''}):</div>
                  <div className="text-xl font-black text-slate-900 font-serif">
                    {(totalFlightsBase + totalTaxes).toLocaleString('pt-PT')} MT
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleProceedToPassengers}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Continuar para Dados dos Passageiros</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: PASSENGERS DETAILS ================= */}
          {step === 'passengers' && (
            <div className="space-y-6">
              {/* Contact details */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-600" />
                  <span>Dados de Contacto para Envio do Bilhete Eletrónico & SMS</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nome Completo</label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Ex: Carlos Machel"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Telefone (WhatsApp / SMS) *</label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="84 300 5000"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 font-bold mb-1">E-mail para Envio do E-Ticket</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="seu.email@exemplo.com"
                      className="w-full bg-white border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>

              {/* Passengers Form */}
              <div className="space-y-4">
                <h4 className="font-serif font-bold text-base text-slate-900">
                  Identificação dos Passageiros (Conforme Documento Oficial):
                </h4>

                {passengers.map((pax, idx) => (
                  <div key={`pax-${pax.id}-${idx}`} className="p-4 sm:p-5 rounded-2xl border-2 border-slate-200 bg-white space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <span className="font-bold text-xs sm:text-sm text-cyan-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-cyan-600" />
                        <span>Passageiro {idx + 1} ({pax.type === 'adult' ? 'Adulto' : 'Criança'})</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Título</label>
                        <select
                          value={pax.title}
                          onChange={(e) => handlePassengerChange(idx, 'title', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-2.5 outline-hidden"
                        >
                          <option value="Sr.">Sr.</option>
                          <option value="Sra.">Sra.</option>
                          <option value="Dr.">Dr.</option>
                          <option value="Eng.">Eng.</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Primeiro Nome *</label>
                        <input
                          type="text"
                          value={pax.firstName}
                          onChange={(e) => handlePassengerChange(idx, 'firstName', e.target.value)}
                          placeholder="Ex: Armando"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500 font-bold"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-slate-600 font-bold mb-1">Apelidos / Último Nome *</label>
                        <input
                          type="text"
                          value={pax.lastName}
                          onChange={(e) => handlePassengerChange(idx, 'lastName', e.target.value)}
                          placeholder="Ex: Guebuza"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500 font-bold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Tipo de Documento</label>
                        <select
                          value={pax.idType}
                          onChange={(e) => handlePassengerChange(idx, 'idType', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-2.5 outline-hidden"
                        >
                          <option value="BI">Bilhete de Identidade (BI)</option>
                          <option value="Passaporte">Passaporte Internacional</option>
                          <option value="DIRE">DIRE</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Número do Documento *</label>
                        <input
                          type="text"
                          value={pax.idNumber}
                          onChange={(e) => handlePassengerChange(idx, 'idNumber', e.target.value.toUpperCase())}
                          placeholder="Ex: 110100482910M"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Nacionalidade</label>
                        <input
                          type="text"
                          value={pax.nationality}
                          onChange={(e) => handlePassengerChange(idx, 'nationality', e.target.value)}
                          placeholder="Moçambicana"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 outline-hidden focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-600 font-bold mb-1">Data de Nascimento</label>
                        <input
                          type="date"
                          value={pax.birthDate}
                          onChange={(e) => handlePassengerChange(idx, 'birthDate', e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl py-2 px-3 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('fare')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Voltar à Tarifa
                </button>

                <button
                  type="button"
                  onClick={handleProceedToSeats}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Continuar para Assentos & Lounges</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: SEATS & ADD-ONS ================= */}
          {step === 'seats_addons' && (
            <div className="space-y-6">
              {/* Seat Selection Interactive Map */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Plane className="w-4 h-4 text-cyan-600" />
                      <span>Marcação de Assentos na Cabine ({outboundFlight.aircraft})</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">Escolha o seu assento favorito (Janela, Corredor ou Saída de Emergência).</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 py-1 px-2.5 rounded-lg">
                    Gratuito nesta tarifa
                  </span>
                </div>

                {/* Seat Grid Demonstration */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col items-center">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-3">
                    FRENTE DO AVIÃO / CABINE
                  </div>

                  <div className="grid grid-cols-7 gap-2 max-w-sm w-full text-center text-xs font-bold font-mono">
                    <span className="text-slate-400">A (Jan)</span>
                    <span className="text-slate-400">B</span>
                    <span className="text-slate-400">C</span>
                    <span className="text-slate-300">| |</span>
                    <span className="text-slate-400">D</span>
                    <span className="text-slate-400">E</span>
                    <span className="text-slate-400">F (Jan)</span>

                    {/* Rows 10 to 14 */}
                    {[10, 11, 12, 14, 15].map((row) => (
                      <React.Fragment key={`seat-row-${row}`}>
                        {['A', 'B', 'C'].map((col) => {
                          const seatCode = `${row}${col}`;
                          const isSelected = passengers.some(p => p.seatSelected === seatCode);
                          return (
                            <button
                              key={seatCode}
                              type="button"
                              onClick={() => handlePassengerChange(0, 'seatSelected', seatCode)}
                              className={`py-2 rounded-lg border transition-all cursor-pointer text-xs ${
                                isSelected
                                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                                  : 'bg-slate-50 hover:bg-cyan-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              {seatCode}
                            </button>
                          );
                        })}

                        <span className="text-slate-300 flex items-center justify-center font-normal text-[10px]">{row}</span>

                        {['D', 'E', 'F'].map((col) => {
                          const seatCode = `${row}${col}`;
                          const isSelected = passengers.some(p => p.seatSelected === seatCode);
                          return (
                            <button
                              key={seatCode}
                              type="button"
                              onClick={() => handlePassengerChange(0, 'seatSelected', seatCode)}
                              className={`py-2 rounded-lg border transition-all cursor-pointer text-xs ${
                                isSelected
                                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs'
                                  : 'bg-slate-50 hover:bg-cyan-50 border-slate-200 text-slate-800'
                              }`}
                            >
                              {seatCode}
                            </button>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </div>

                  <div className="mt-3 text-xs font-bold text-cyan-900">
                    Assento selecionado: {passengers[0].seatSelected || '10A'} (Janela)
                  </div>
                </div>
              </div>

              {/* Add-ons & Airport Upgrades */}
              <div className="space-y-3">
                <h4 className="font-serif font-bold text-base text-slate-900">
                  Serviços Adicionais & Aeroporto de Maputo:
                </h4>

                {/* Flamingo Lounge Upgrade */}
                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                  flamingoLoungeAccess ? 'border-amber-500 bg-amber-50/50' : 'border-slate-200 bg-white'
                }`} onClick={() => setFlamingoLoungeAccess(!flamingoLoungeAccess)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                      <Coffee className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Acesso ao Lounge VIP Flamingo (Aeroporto de Maputo)</span>
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2 py-0.5 rounded-full">VIP</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Buffet livre de petiscos, bebidas, Wi-Fi ultra-rápido, duches e poltronas relax.</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 font-serif">+ {flamingoLoungePrice.toLocaleString('pt-PT')} MT</div>
                    <span className={`text-[10px] font-bold ${flamingoLoungeAccess ? 'text-amber-700' : 'text-slate-400'}`}>
                      {flamingoLoungeAccess ? '✓ Adicionado' : '+ Adicionar'}
                    </span>
                  </div>
                </div>

                {/* Extra Checked Baggage */}
                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                  extraBaggageCount > 0 ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-200 bg-white'
                }`} onClick={() => setExtraBaggageCount(extraBaggageCount > 0 ? 0 : 1)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center shrink-0">
                      <Luggage className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        Bagagem de Porão Extra (+23 kg)
                      </div>
                      <p className="text-[11px] text-slate-500">Adicione uma mala extra de 23kg para compras ou encomendas.</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 font-serif">+ {extraBaggagePrice.toLocaleString('pt-PT')} MT</div>
                    <span className={`text-[10px] font-bold ${extraBaggageCount > 0 ? 'text-cyan-700' : 'text-slate-400'}`}>
                      {extraBaggageCount > 0 ? '✓ 1 Mala Adicionada' : '+ Adicionar'}
                    </span>
                  </div>
                </div>

                {/* Medical Travel Insurance */}
                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                  travelInsurance ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 bg-white'
                }`} onClick={() => setTravelInsurance(!travelInsurance)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-2">
                        <span>Seguro de Viagem & Assistência Médica Internacional</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-2 py-0.5 rounded-full">Recomendado</span>
                      </div>
                      <p className="text-[11px] text-slate-500">Cobertura de despesas médicas, extravio de bagagem e atraso de voos.</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 font-serif">+ {travelInsurancePrice.toLocaleString('pt-PT')} MT</div>
                    <span className={`text-[10px] font-bold ${travelInsurance ? 'text-emerald-700' : 'text-slate-400'}`}>
                      {travelInsurance ? '✓ Incluído' : '+ Adicionar'}
                    </span>
                  </div>
                </div>

                {/* Transfer Receptivo Aeroporto Axofácil */}
                <div className={`p-4 rounded-2xl border-2 transition-all flex items-center justify-between gap-4 cursor-pointer ${
                  airportTransferPickup ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200 bg-white'
                }`} onClick={() => setAirportTransferPickup(!airportTransferPickup)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                      <PlaneLanding className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        Transfer / Receptivo no Aeroporto de Maputo (Frota Axofácil!)
                      </div>
                      <p className="text-[11px] text-slate-500">Motorista à espera na porta de desembarque com placa de acolhimento.</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-xs sm:text-sm text-slate-900 font-serif">+ {airportTransferPrice.toLocaleString('pt-PT')} MT</div>
                    <span className={`text-[10px] font-bold ${airportTransferPickup ? 'text-indigo-700' : 'text-slate-400'}`}>
                      {airportTransferPickup ? '✓ Adicionado' : '+ Adicionar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('passengers')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Voltar aos Passageiros
                </button>

                <button
                  type="button"
                  onClick={handleProceedToPayment}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-3 px-6 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <span>Ir para Pagamento ({grandTotal.toLocaleString('pt-PT')} MT)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 4: PAYMENT (M-PESA / SIMO) ================= */}
          {step === 'payment' && (
            <form onSubmit={handleConfirmPaymentAndIssueTicket} className="space-y-6">
              {/* Order Summary Box */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2 text-xs">
                <div className="font-bold text-sm text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Resumo do Pagamento do Bilhete Aéreo</span>
                  <span className="font-serif text-lg font-black text-cyan-900">
                    {grandTotal.toLocaleString('pt-PT')} MT
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Passagem Aérea ({passengers.length}x {outboundFlight.airline.shortName}):</span>
                  <span className="font-bold">{totalFlightsBase.toLocaleString('pt-PT')} MT</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxas Aeroportuárias e de Segurança:</span>
                  <span className="font-bold">{totalTaxes.toLocaleString('pt-PT')} MT</span>
                </div>
                {addonsTotal > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Serviços Adicionais & Lounges:</span>
                    <span className="font-bold text-cyan-800">+{addonsTotal.toLocaleString('pt-PT')} MT</span>
                  </div>
                )}
              </div>

              {/* Mozambican Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Selecione a Forma de Pagamento Local (Moçambique):
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* M-Pesa */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('mpesa')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      paymentMethod === 'mpesa'
                        ? 'border-rose-600 bg-rose-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-rose-600 mx-auto mb-1" />
                    <div className="font-bold text-xs text-slate-900">M-Pesa</div>
                    <div className="text-[10px] text-slate-500">Vodacom</div>
                  </button>

                  {/* E-Mola */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('emola')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      paymentMethod === 'emola'
                        ? 'border-orange-600 bg-orange-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                    <div className="font-bold text-xs text-slate-900">e-Mola</div>
                    <div className="text-[10px] text-slate-500">Movitel</div>
                  </button>

                  {/* Cartão SIMO / POS */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('cartao_simo')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      paymentMethod === 'cartao_simo'
                        ? 'border-cyan-600 bg-cyan-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                    <div className="font-bold text-xs text-slate-900">Cartão SIMO</div>
                    <div className="text-[10px] text-slate-500">Visa / Mastercard</div>
                  </button>

                  {/* Transferência Bancária */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia_bancaria')}
                    className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer ${
                      paymentMethod === 'transferencia_bancaria'
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                    <div className="font-bold text-xs text-slate-900">Transferência</div>
                    <div className="text-[10px] text-slate-500">BCI / BIM / Standard</div>
                  </button>
                </div>
              </div>

              {/* Payment Details Account Instructions */}
              <div className="p-4 rounded-2xl bg-cyan-50/60 border border-cyan-200 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-950">Dados para Pagamento Imediato:</span>
                  <span className="text-[10px] text-cyan-800 font-semibold bg-white px-2 py-0.5 rounded-md border border-cyan-300">
                    Balcão Turismo e Viagens Axofácil!
                  </span>
                </div>

                {paymentMethod === 'mpesa' && (
                  <div className="space-y-1.5 font-mono text-slate-800">
                    <div className="flex items-center justify-between">
                      <span>Número M-Pesa: <strong>84 300 5000</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText('843005000', 'mpesa')}
                        className="text-cyan-700 font-bold text-[11px] underline flex items-center gap-1 cursor-pointer"
                      >
                        {copySuccess === 'mpesa' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600">Titular: <strong>Axofácil Turismo e Logística Lda</strong></div>
                  </div>
                )}

                {paymentMethod === 'emola' && (
                  <div className="space-y-1.5 font-mono text-slate-800">
                    <div className="flex items-center justify-between">
                      <span>Número e-Mola: <strong>86 300 5000</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyText('863005000', 'emola')}
                        className="text-cyan-700 font-bold text-[11px] underline flex items-center gap-1 cursor-pointer"
                      >
                        {copySuccess === 'emola' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-600">Titular: <strong>Axofácil Turismo e Logística Lda</strong></div>
                  </div>
                )}

                {paymentMethod === 'transferencia_bancaria' && (
                  <div className="space-y-1.5 text-slate-800 font-mono text-[11px]">
                    <div>Banco Millennium BIM: <strong>0001.0000.9481.2039.1029</strong></div>
                    <div>Banco BCI: <strong>0008.0000.1948.5839.2019</strong></div>
                    <div className="text-slate-600">Titular: Axofácil Turismo e Viagens Moçambique</div>
                  </div>
                )}

                {paymentMethod === 'cartao_simo' && (
                  <div className="text-[11px] text-slate-700">
                    Pagamento seguro via Gateway SIMO Rede Nacional / Visa / Mastercard.
                  </div>
                )}
              </div>

              {/* Reference number input */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Número de Referência / ID da Transação M-Pesa / Talão *
                </label>
                <input
                  type="text"
                  required
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Ex: MP260827.1948.A84920"
                  className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-2xl py-3 px-4 text-xs sm:text-sm font-mono font-bold text-slate-900 outline-hidden uppercase shadow-2xs"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Insira o código do SMS de confirmação para validação e emissão instantânea do Bilhete Aéreo.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setStep('seats_addons')}
                  className="text-xs font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Voltar aos Assentos
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs sm:text-sm py-3.5 px-8 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  {isProcessing ? (
                    <span>A emitir bilhete oficial...</span>
                  ) : (
                    <>
                      <Ticket className="w-4 h-4" />
                      <span>Confirmar & Emitir Bilhete Eletrónico</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ================= STEP 5: SUCCESS / E-TICKET & BOARDING PASS ================= */}
          {step === 'success' && confirmedBooking && (
            <div className="space-y-6">
              {/* Confirmed Banner */}
              <div className="bg-emerald-50 border-2 border-emerald-300 p-5 rounded-3xl text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h3 className="font-serif font-bold text-xl text-emerald-950">
                  Bilhete Aéreo Emitido com Sucesso!
                </h3>
                <p className="text-xs text-emerald-800 max-w-md mx-auto">
                  A sua reserva está confirmada e sincronizada com o Aeroporto Internacional de Maputo. Enviámos a 2ª via para o seu e-mail e SMS.
                </p>

                {/* PNR Box */}
                <div className="inline-flex items-center gap-3 bg-white px-5 py-2.5 rounded-2xl border border-emerald-400/50 shadow-sm mt-2">
                  <div className="text-left">
                    <span className="text-[9px] uppercase font-bold text-slate-400 block">Código de Reserva (PNR)</span>
                    <span className="font-mono text-xl font-black text-slate-900 tracking-wider">
                      {confirmedBooking.pnr}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(confirmedBooking.pnr, 'pnr')}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="Copiar PNR"
                  >
                    {copySuccess === 'pnr' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* OFFICIAL BOARDING PASS CARD (IATA DIGITAL TICKET) */}
              <div id="printable-boarding-pass" className="bg-white rounded-3xl border-2 border-slate-900 shadow-xl overflow-hidden text-slate-900 font-sans">
                {/* Header Strip */}
                <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-4 sm:p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg ${outboundFlight.airline.logoBgColor || 'bg-slate-800'} text-white font-bold text-xs flex items-center justify-center`}>
                      {outboundFlight.airline.code}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-white">{outboundFlight.airline.name}</div>
                      <div className="text-[10px] text-cyan-300">CARTÃO DE EMBARQUE ELETRÓNICO / BOARDING PASS</div>
                    </div>
                  </div>
                  <div className="text-right font-mono text-xs text-slate-300">
                    <div>E-TICKET: <strong>{confirmedBooking.ticketNumber}</strong></div>
                    <div className="text-cyan-400 font-bold">CLASSE: {confirmedBooking.cabinClass.toUpperCase()}</div>
                  </div>
                </div>

                {/* Main Pass Content */}
                <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  {/* Flight & Passenger Info */}
                  <div className="md:col-span-8 space-y-4">
                    {/* Passenger Name & Flight */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-200 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Passageiro / Name</span>
                        <span className="font-bold text-sm text-slate-900">
                          {confirmedBooking.passengers[0]?.lastName}, {confirmedBooking.passengers[0]?.firstName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Voo / Flight</span>
                        <span className="font-mono font-bold text-sm text-cyan-900">
                          {outboundFlight.flightNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Data / Date</span>
                        <span className="font-bold text-xs text-slate-900">
                          {confirmedBooking.outboundDate}
                        </span>
                      </div>
                    </div>

                    {/* Route Times */}
                    <div className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block">De / Origin</span>
                        <div className="text-lg font-bold font-mono text-slate-900">{outboundFlight.origin.code}</div>
                        <div className="text-xs text-slate-600 font-medium">{outboundFlight.origin.city}</div>
                        <div className="text-xs font-bold text-slate-900 mt-1">{outboundFlight.departureTime}</div>
                      </div>

                      <div className="text-center">
                        <Plane className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                        <span className="text-[10px] font-bold text-slate-500">{outboundFlight.durationFormatted}</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 uppercase block">Para / Dest</span>
                        <div className="text-lg font-bold font-mono text-slate-900">{outboundFlight.destination.code}</div>
                        <div className="text-xs text-slate-600 font-medium">{outboundFlight.destination.city}</div>
                        <div className="text-xs font-bold text-slate-900 mt-1">{outboundFlight.arrivalTime}</div>
                      </div>
                    </div>

                    {/* Gate & Seat Details */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Terminal</span>
                        <span className="font-bold text-xs text-slate-900">{outboundFlight.terminal.split(' - ')[0]}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Portão / Gate</span>
                        <span className="font-bold text-xs text-cyan-900">{outboundFlight.gate || 'Gate D2'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Assento / Seat</span>
                        <span className="font-mono font-black text-sm text-emerald-900">{confirmedBooking.seatNumbers[0] || '10A'}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Embarque</span>
                        <span className="font-mono font-bold text-xs text-rose-700">45m Antes</span>
                      </div>
                    </div>
                  </div>

                  {/* QR & Barcode Column */}
                  <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="p-3 bg-slate-100 rounded-2xl border border-slate-300">
                      <QrCode className="w-28 h-28 text-slate-900" />
                    </div>
                    <div className="font-mono text-[10px] text-slate-500 tracking-widest">
                      * {confirmedBooking.pnr} *
                    </div>
                    <span className="text-[10px] text-slate-500 leading-tight">
                      Apresente este código no leitor de segurança do Aeroporto de Maputo.
                    </span>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="bg-slate-100 px-6 py-3 border-t border-slate-200 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
                  <div>Bagagem Despachada: <strong>{confirmedBooking.fareType === 'flex' ? '2x 23kg' : '1x 23kg'}</strong> + 1x 7kg Mão</div>
                  <div>Atendimento Axofácil Turismo: <strong>+258 84 300 5000</strong></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handlePrintBoardingPass}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Guardar em PDF</span>
                </button>

                <a
                  href={`https://wa.me/258${contactPhone.replace(/\D/g, '')}?text=Olá! Segue a confirmação do meu Bilhete Aéreo Axofácil Turismo: PNR ${confirmedBooking.pnr} (${outboundFlight.origin.code} para ${outboundFlight.destination.code})`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar para o WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm py-3 px-5 rounded-2xl border border-slate-300 cursor-pointer transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
