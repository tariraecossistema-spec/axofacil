import React, { useState } from 'react';
import { Airport, Airline } from "../../types/types";
import { AIRPORTS, AIRLINES } from "../../data/flightData";
import { 
  Plane, PlaneTakeoff, PlaneLanding, ArrowLeftRight, Calendar, Users, 
  Search, SlidersHorizontal, Check, ChevronDown, Sparkles, Building2, MapPin
} from 'lucide-react';

interface FlightSearchBoxProps {
  onSearch: (params: {
    originCode: string;
    destinationCode: string;
    tripType: 'one_way' | 'round_trip';
    outboundDate: string;
    returnDate?: string;
    cabinClass: 'economy' | 'premium_economy' | 'business';
    passengersCount: number;
    adults: number;
    children: number;
    infants: number;
    stopsFilter: 'all' | 'direct' | 'stops';
    airlineCode: string;
  }) => void;
  initialOrigin?: string;
  initialDestination?: string;
}

export default function FlightSearchBox({
  onSearch,
  initialOrigin = 'MPM',
  initialDestination = 'JNB'
}: FlightSearchBoxProps) {
  const [tripType, setTripType] = useState<'round_trip' | 'one_way'>('round_trip');
  const [originCode, setOriginCode] = useState(initialOrigin);
  const [destinationCode, setDestinationCode] = useState(initialDestination);
  
  // Dates
  const [outboundDate, setOutboundDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  // Passengers
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [showPassengerDropdown, setShowPassengerDropdown] = useState(false);

  // Cabin & Filters
  const [cabinClass, setCabinClass] = useState<'economy' | 'premium_economy' | 'business'>('economy');
  const [stopsFilter, setStopsFilter] = useState<'all' | 'direct' | 'stops'>('all');
  const [selectedAirline, setSelectedAirline] = useState<string>('all');

  const totalPassengers = adults + children + infants;

  const handleSwapAirports = () => {
    const temp = originCode;
    setOriginCode(destinationCode);
    setDestinationCode(temp);
  };

  const handleTriggerSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onSearch({
      originCode,
      destinationCode,
      tripType,
      outboundDate,
      returnDate: tripType === 'round_trip' ? returnDate : undefined,
      cabinClass,
      passengersCount: totalPassengers,
      adults,
      children,
      infants,
      stopsFilter,
      airlineCode: selectedAirline
    });
  };

  const selectedOrigin = AIRPORTS.find(a => a.code === originCode) || AIRPORTS[0];
  const selectedDest = AIRPORTS.find(a => a.code === destinationCode) || AIRPORTS[11]; // JNB

  return (
    <div className="bg-white rounded-3xl border-2 border-cyan-500/30 shadow-xl overflow-hidden">
      {/* Top Header Tab Selector */}
      <div className="bg-linear-to-r from-slate-900 via-cyan-950 to-slate-950 px-6 py-4 border-b border-cyan-500/20 text-white flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-400/30 flex items-center justify-center">
            <Plane className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base sm:text-lg text-white flex items-center gap-2">
              <span>Pesquisa de Voos & Bilhetes Aéreos</span>
              <span className="text-[10px] uppercase font-bold bg-cyan-500 text-slate-950 py-0.5 px-2 rounded-full">
                Sincronizado
              </span>
            </h3>
            <p className="text-[11px] text-cyan-200/80">
              Moçambique (Maputo, Beira, Nampula, Pemba) & África Austral / Internacional
            </p>
          </div>
        </div>

        {/* Trip Type Radios */}
        <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl backdrop-blur-xs border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setTripType('round_trip')}
            className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
              tripType === 'round_trip'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-cyan-100 hover:text-white'
            }`}
          >
            Ida e Volta
          </button>
          <button
            type="button"
            onClick={() => setTripType('one_way')}
            className={`py-1.5 px-3 rounded-lg font-bold transition-all cursor-pointer ${
              tripType === 'one_way'
                ? 'bg-cyan-500 text-slate-950 shadow-xs'
                : 'text-cyan-100 hover:text-white'
            }`}
          >
            Só Ida
          </button>
        </div>
      </div>

      {/* Main Search Controls Form */}
      <form onSubmit={handleTriggerSearch} className="p-5 sm:p-6 space-y-4">
        {/* Origin and Destination Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Origin */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <PlaneTakeoff className="w-3.5 h-3.5 text-cyan-600" />
              <span>De (Origem)</span>
            </label>
            <div className="relative">
              <select
                value={originCode}
                onChange={(e) => setOriginCode(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-2 border-slate-200 focus:border-cyan-500 rounded-2xl py-3 px-3.5 pr-8 text-xs sm:text-sm font-bold text-slate-900 transition-all cursor-pointer outline-hidden shadow-2xs appearance-none"
              >
                <optgroup label="🇲🇿 Moçambique (Nacional)">
                  {AIRPORTS.filter(a => a.region === 'nacional').map((a, idx) => (
                    <option key={`orig-nac-${a.code}-${idx}`} value={a.code}>
                      {a.city} ({a.code}) - {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌍 África Austral & SADC (Regional)">
                  {AIRPORTS.filter(a => a.region === 'africa_austral').map((a, idx) => (
                    <option key={`orig-sadc-${a.code}-${idx}`} value={a.code}>
                      {a.city}, {a.country} ({a.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Internacional">
                  {AIRPORTS.filter(a => a.region === 'internacional').map((a, idx) => (
                    <option key={`orig-intl-${a.code}-${idx}`} value={a.code}>
                      {a.city}, {a.country} ({a.code})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="text-[10px] text-cyan-700 font-semibold mt-1 truncate">
              {selectedOrigin.name}
            </div>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-2 flex justify-center py-1 md:py-0">
            <button
              type="button"
              onClick={handleSwapAirports}
              className="w-10 h-10 rounded-full bg-slate-100 hover:bg-cyan-50 text-slate-700 hover:text-cyan-700 border border-slate-300 hover:border-cyan-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-90"
              title="Trocar Origem e Destino"
            >
              <ArrowLeftRight className="w-4 h-4" />
            </button>
          </div>

          {/* Destination */}
          <div className="md:col-span-5 relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <PlaneLanding className="w-3.5 h-3.5 text-emerald-600" />
              <span>Para (Destino)</span>
            </label>
            <div className="relative">
              <select
                value={destinationCode}
                onChange={(e) => setDestinationCode(e.target.value)}
                className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border-2 border-slate-200 focus:border-cyan-500 rounded-2xl py-3 px-3.5 pr-8 text-xs sm:text-sm font-bold text-slate-900 transition-all cursor-pointer outline-hidden shadow-2xs appearance-none"
              >
                <optgroup label="🌍 África Austral & SADC (Mais Procurados)">
                  {AIRPORTS.filter(a => a.region === 'africa_austral').map((a, idx) => (
                    <option key={`dest-sadc-${a.code}-${idx}`} value={a.code}>
                      {a.city}, {a.country} ({a.code})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🇲🇿 Moçambique (Nacional)">
                  {AIRPORTS.filter(a => a.region === 'nacional').map((a, idx) => (
                    <option key={`dest-nac-${a.code}-${idx}`} value={a.code}>
                      {a.city} ({a.code}) - {a.name}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="🌐 Internacional & Europa / Ásia">
                  {AIRPORTS.filter(a => a.region === 'internacional').map((a, idx) => (
                    <option key={`dest-intl-${a.code}-${idx}`} value={a.code}>
                      {a.city}, {a.country} ({a.code})
                    </option>
                  ))}
                </optgroup>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1 truncate">
              {selectedDest.name}
            </div>
          </div>
        </div>

        {/* Dates & Passenger & Class Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Outbound Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-600" />
              <span>Data de Partida</span>
            </label>
            <input
              type="date"
              value={outboundDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setOutboundDate(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 cursor-pointer outline-hidden shadow-2xs"
            />
          </div>

          {/* Return Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data de Regresso</span>
            </label>
            <input
              type="date"
              value={returnDate}
              min={outboundDate || new Date().toISOString().split('T')[0]}
              disabled={tripType === 'one_way'}
              onChange={(e) => setReturnDate(e.target.value)}
              className={`w-full border-2 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold transition-all outline-hidden shadow-2xs ${
                tripType === 'one_way'
                  ? 'bg-slate-100/60 border-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-slate-50 border-slate-200 focus:border-cyan-500 text-slate-900 cursor-pointer'
              }`}
            />
          </div>

          {/* Passengers Popover */}
          <div className="relative">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-indigo-600" />
              <span>Passageiros</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPassengerDropdown(!showPassengerDropdown)}
              className="w-full bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 flex items-center justify-between cursor-pointer shadow-2xs"
            >
              <span>{totalPassengers} Passageiro{totalPassengers > 1 ? 's' : ''}</span>
              <ChevronDown className="w-4 h-4 text-slate-500" />
            </button>

            {/* Dropdown Card */}
            {showPassengerDropdown && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl border-2 border-slate-200 shadow-2xl p-4 z-40 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">Adultos</div>
                    <div className="text-[10px] text-slate-500">12+ anos</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={adults <= 1}
                      onClick={() => setAdults(Math.max(1, adults - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{adults}</span>
                    <button
                      type="button"
                      disabled={adults >= 9}
                      onClick={() => setAdults(adults + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Crianças</div>
                    <div className="text-[10px] text-slate-500">2 a 11 anos</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={children <= 0}
                      onClick={() => setChildren(Math.max(0, children - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{children}</span>
                    <button
                      type="button"
                      disabled={children >= 6}
                      onClick={() => setChildren(children + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                  <div>
                    <div className="font-bold text-slate-900">Bebés</div>
                    <div className="text-[10px] text-slate-500">Abaixo de 2 anos</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={infants <= 0}
                      onClick={() => setInfants(Math.max(0, infants - 1))}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold disabled:opacity-30 cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-bold w-4 text-center">{infants}</span>
                    <button
                      type="button"
                      disabled={infants >= adults}
                      onClick={() => setInfants(infants + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPassengerDropdown(false)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs py-2 rounded-xl mt-2 cursor-pointer"
                >
                  Concluído
                </button>
              </div>
            )}
          </div>

          {/* Cabin Class */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Classe de Cabine</span>
            </label>
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as any)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-2xl py-2.5 px-3 text-xs sm:text-sm font-bold text-slate-900 cursor-pointer outline-hidden shadow-2xs"
            >
              <option value="economy">Económica (Melhor Preço)</option>
              <option value="premium_economy">Premium Economy</option>
              <option value="business">Executiva / Business Class</option>
            </select>
          </div>
        </div>

        {/* Quick Filter Badges & Search Action Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-bold text-[11px]">Filtros:</span>
            
            {/* Direct Flights Only toggle */}
            <button
              type="button"
              onClick={() => setStopsFilter(stopsFilter === 'direct' ? 'all' : 'direct')}
              className={`py-1.5 px-3 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                stopsFilter === 'direct'
                  ? 'bg-cyan-700 text-white border-cyan-700 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              ✈ Apenas Voos Diretos
            </button>

            {/* Airline Selector */}
            <select
              value={selectedAirline}
              onChange={(e) => setSelectedAirline(e.target.value)}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 py-1.5 px-2.5 rounded-full text-xs font-bold cursor-pointer outline-hidden"
            >
              <option value="all">Todas as Companhias</option>
              <option value="TM">LAM Moçambique</option>
              <option value="4Z">Airlink</option>
              <option value="TP">TAP Portugal</option>
              <option value="QR">Qatar Airways</option>
              <option value="ET">Ethiopian Airlines</option>
              <option value="KQ">Kenya Airways</option>
              <option value="DT">TAAG Angola</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs sm:text-sm py-3 px-8 rounded-2xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Pesquisar Voos Disponíveis</span>
          </button>
        </div>
      </form>
    </div>
  );
}
