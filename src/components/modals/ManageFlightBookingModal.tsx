import React, { useState } from 'react';
import { FlightTicketBooking } from "../../types/types";
import { findBookingByPnrAndSurname, performWebCheckIn } from "../../services/flightStore";
import { 
  X, Search, Plane, QrCode, Printer, CheckCircle2, ShieldCheck, 
  Calendar, Users, Luggage, ArrowRight, Share2, Clock, AlertCircle
} from 'lucide-react';
import { notify } from "../../services/dialogs";

interface ManageFlightBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageFlightBookingModal({
  isOpen,
  onClose
}: ManageFlightBookingModalProps) {
  const [pnrInput, setPnrInput] = useState('');
  const [surnameInput, setSurnameInput] = useState('');
  const [foundBooking, setFoundBooking] = useState<FlightTicketBooking | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrInput.trim()) {
      notify('Por favor insira o código PNR de 6 dígitos.', 'error');
      return;
    }

    const booking = findBookingByPnrAndSurname(pnrInput, surnameInput);
    setFoundBooking(booking);
    setHasSearched(true);

    if (!booking) {
      notify('Nenhuma reserva encontrada com esse código PNR e apelido.', 'error');
    }
  };

  const handleWebCheckIn = () => {
    if (!foundBooking) return;
    setIsCheckingIn(true);
    setTimeout(() => {
      const updated = performWebCheckIn(foundBooking.pnr);
      if (updated) {
        setFoundBooking(updated);
        notify('Check-in online efetuado com sucesso! Cartão de embarque emitido.', 'success');
      }
      setIsCheckingIn(false);
    }, 800);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 my-auto flex flex-col">
        
        {/* Header */}
        <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 sticky top-0 z-20 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg sm:text-xl text-white">
                Gerir Minha Viagem & Check-in Online
              </h2>
              <p className="text-xs text-slate-300">
                Consulte o estado do voo, emita cartões de embarque ou adicione bagagem.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Search Form */}
          <form onSubmit={handleSearch} className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Código de Reserva (PNR de 6 caracteres) *
                </label>
                <input
                  type="text"
                  required
                  value={pnrInput}
                  onChange={(e) => setPnrInput(e.target.value.toUpperCase())}
                  placeholder="Ex: ACH79X"
                  className="w-full bg-white border-2 border-slate-300 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-mono font-bold text-slate-900 outline-hidden uppercase"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Apelido do Passageiro (Sobrenome)
                </label>
                <input
                  type="text"
                  value={surnameInput}
                  onChange={(e) => setSurnameInput(e.target.value)}
                  placeholder="Ex: Machel ou Guebuza"
                  className="w-full bg-white border-2 border-slate-300 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-bold text-slate-900 outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs sm:text-sm py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
              >
                <Search className="w-4 h-4" />
                <span>Localizar Bilhete</span>
              </button>
            </div>
          </form>

          {/* Results Display */}
          {hasSearched && foundBooking && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">Reserva Localizada com Sucesso!</div>
                  <div className="text-xs text-emerald-700">
                    Passageiro: <strong>{foundBooking.passengers[0]?.firstName} {foundBooking.passengers[0]?.lastName}</strong> · E-Ticket: {foundBooking.ticketNumber}
                  </div>
                </div>
                <span className="text-xs font-black bg-emerald-600 text-white px-3 py-1 rounded-full uppercase">
                  {foundBooking.bookingStatus}
                </span>
              </div>

              {/* Booking Details Card */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {foundBooking.outboundFlight.airline.name} ({foundBooking.outboundFlight.flightNumber})
                    </span>
                  </div>
                  <span className="text-xs font-bold text-cyan-800 bg-cyan-100 py-0.5 px-2 rounded-lg">
                    PNR: {foundBooking.pnr}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="font-bold font-mono text-sm">{foundBooking.outboundFlight.origin.code}</div>
                    <div className="text-slate-500">{foundBooking.outboundFlight.origin.city}</div>
                    <div className="font-bold text-slate-800">{foundBooking.outboundFlight.departureTime}</div>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <Plane className="w-4 h-4 text-cyan-600" />
                    <span className="text-[10px] text-slate-400">{foundBooking.outboundFlight.durationFormatted}</span>
                  </div>
                  <div>
                    <div className="font-bold font-mono text-sm">{foundBooking.outboundFlight.destination.code}</div>
                    <div className="text-slate-500">{foundBooking.outboundFlight.destination.city}</div>
                    <div className="font-bold text-slate-800">{foundBooking.outboundFlight.arrivalTime}</div>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl text-xs space-y-1 text-slate-700">
                  <div>Data do Voo: <strong>{foundBooking.outboundDate}</strong></div>
                  <div>Terminal de Embarque: <strong>{foundBooking.outboundFlight.terminal}</strong></div>
                  <div>Assento Designado: <strong>{foundBooking.seatNumbers.join(', ')}</strong></div>
                  <div>Franquia de Bagagem: <strong>1x 23kg Porão + 1x 7kg Mão</strong></div>
                </div>

                {/* Actions: Check-in / Print */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  {!foundBooking.checkInDone ? (
                    <button
                      type="button"
                      disabled={isCheckingIn}
                      onClick={handleWebCheckIn}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isCheckingIn ? 'A processar check-in...' : 'Efetuar Web Check-in Agora'}</span>
                    </button>
                  ) : (
                    <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Check-in já realizado! Portão de embarque confirmado.</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir Cartão de Embarque</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {hasSearched && !foundBooking && (
            <div className="text-center py-8 text-slate-500 space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-bold text-xs">Reserva não encontrada.</p>
              <p className="text-[11px] text-slate-400">
                Verifique se o código PNR (ex: ACH79X) e o apelido foram digitados corretamente.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
