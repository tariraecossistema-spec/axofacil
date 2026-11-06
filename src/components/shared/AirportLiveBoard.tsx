import React, { useState, useEffect } from 'react';
import { Airport, Airline, LiveFlightBoardItem, FlightSchedule } from "../../types/types";
import { AIRPORTS, getLiveFlightBoardForAirport, FLIGHT_SCHEDULES } from "../../data/flightData";
import { 
  Plane, PlaneTakeoff, PlaneLanding, Clock, MapPin, Search, RefreshCw, 
  ShieldCheck, ArrowRight, Sparkles, Building2, Tag, Ticket, Filter, AlertCircle
} from 'lucide-react';

interface AirportLiveBoardProps {
  onSelectFlightToBook?: (flightSchedule: FlightSchedule) => void;
}

export default function AirportLiveBoard({ onSelectFlightToBook }: AirportLiveBoardProps) {
  const [selectedAirportCode, setSelectedAirportCode] = useState('MPM');
  const [tabType, setTabType] = useState<'partida' | 'chegada'>('partida');
  const [terminalFilter, setTerminalFilter] = useState<'all' | 'domestico' | 'internacional'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const rawBoard = getLiveFlightBoardForAirport(selectedAirportCode);

  const filteredItems = rawBoard.filter(item => {
    if (item.type !== tabType) return false;

    if (terminalFilter === 'domestico' && !item.terminal.toLowerCase().includes('doméstico') && !item.terminal.toLowerCase().includes('terminal a')) {
      return false;
    }
    if (terminalFilter === 'internacional' && !item.terminal.toLowerCase().includes('internacional') && !item.terminal.toLowerCase().includes('terminal b')) {
      return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchNum = item.flightNumber.toLowerCase().includes(q);
      const matchCity = item.otherAirport.city.toLowerCase().includes(q);
      const matchCode = item.otherAirport.code.toLowerCase().includes(q);
      const matchAirline = item.airline.name.toLowerCase().includes(q);
      if (!matchNum && !matchCity && !matchCode && !matchAirline) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Embarque':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 animate-pulse shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
            Embarque
          </span>
        );
      case 'Última Chamada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white animate-bounce shadow-xs">
            Última Chamada
          </span>
        );
      case 'No Horário':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            No Horário
          </span>
        );
      case 'Em Voo':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">
            <Plane className="w-3 h-3 text-cyan-600" />
            Em Voo
          </span>
        );
      case 'Aterrado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            ✓ Aterrado
          </span>
        );
      case 'Atrasado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            Atrasado
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const handleBookFromBoard = (item: LiveFlightBoardItem) => {
    if (!onSelectFlightToBook) return;
    
    // Find matching schedule or create standard
    let schedule = FLIGHT_SCHEDULES.find(s => s.id === item.flightScheduleRefId || s.flightNumber === item.flightNumber);
    if (!schedule) {
      schedule = {
        id: `fl-board-${item.id}`,
        flightNumber: item.flightNumber,
        airline: item.airline,
        origin: item.type === 'partida' ? (AIRPORTS.find(a => a.code === item.airportCode) || AIRPORTS[0]) : item.otherAirport,
        destination: item.type === 'partida' ? item.otherAirport : (AIRPORTS.find(a => a.code === item.airportCode) || AIRPORTS[0]),
        departureTime: item.scheduledTime,
        arrivalTime: item.estimatedTime,
        durationMinutes: 90,
        durationFormatted: '1h 30m',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        stops: 0,
        aircraft: item.aircraft,
        terminal: item.terminal,
        gate: item.gate,
        baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 1 },
        basePriceEconomyMT: item.otherAirport.country === 'Moçambique' ? 6800 : 9500,
        taxesMT: item.otherAirport.country === 'Moçambique' ? 850 : 2100,
        availableSeatsEconomy: 18,
        mealIncluded: 'Snack & Bebidas'
      };
    }
    onSelectFlightToBook(schedule);
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xl overflow-hidden">
      {/* Board Header Bar */}
      <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 border-b border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Airport Title & Time */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="bg-cyan-500 text-slate-950 text-[10px] font-black uppercase tracking-wider py-0.5 px-2.5 rounded-full">
                Painel FIDS em Direto
              </span>
              <span className="text-xs text-cyan-200/80 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hora Local: {currentTime || '08:00:00'} (CAT / GMT+2)</span>
              </span>
            </div>
            <h3 className="font-serif font-bold text-xl sm:text-2xl text-white flex items-center gap-2">
              <span>Aeroporto Internacional de Maputo (MPM)</span>
            </h3>
            <p className="text-xs text-slate-300">
              Sincronização em tempo real de chegadas e partidas domésticas e internacionais.
            </p>
          </div>

          {/* Airport Switcher & Refresh Button */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedAirportCode}
              onChange={(e) => setSelectedAirportCode(e.target.value)}
              className="bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold py-2 px-3 rounded-xl cursor-pointer outline-hidden flex-1 md:flex-initial"
            >
              <option value="MPM" className="text-slate-900 font-bold">Aeroporto de Maputo (MPM)</option>
              <option value="BEW" className="text-slate-900 font-bold">Aeroporto da Beira (BEW)</option>
              <option value="APL" className="text-slate-900 font-bold">Aeroporto de Nampula (APL)</option>
              <option value="POL" className="text-slate-900 font-bold">Aeroporto de Pemba (POL)</option>
              <option value="VNX" className="text-slate-900 font-bold">Aeroporto de Vilankulo (VNX)</option>
            </select>

            <button
              type="button"
              onClick={handleRefresh}
              className={`p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white cursor-pointer transition-all ${
                isRefreshing ? 'rotate-180 text-cyan-400' : ''
              }`}
              title="Atualizar painel de voos"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Tab Selector: Partidas vs Chegadas */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTabType('partida')}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                tabType === 'partida'
                  ? 'bg-cyan-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <PlaneTakeoff className="w-4 h-4" />
              <span>Partidas (Departures)</span>
            </button>

            <button
              type="button"
              onClick={() => setTabType('chegada')}
              className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                tabType === 'chegada'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'bg-white/10 hover:bg-white/15 text-slate-200'
              }`}
            >
              <PlaneLanding className="w-4 h-4" />
              <span>Chegadas (Arrivals)</span>
            </button>
          </div>

          {/* Terminal & Search Filters */}
          <div className="flex items-center gap-2 text-xs w-full sm:w-auto">
            <select
              value={terminalFilter}
              onChange={(e) => setTerminalFilter(e.target.value as any)}
              className="bg-white/10 border border-white/20 text-white text-xs py-2 px-2.5 rounded-xl cursor-pointer outline-hidden"
            >
              <option value="all" className="text-slate-900">Todos os Terminais</option>
              <option value="domestico" className="text-slate-900">Terminal Doméstico (A)</option>
              <option value="internacional" className="text-slate-900">Terminal Internacional (B)</option>
            </select>

            <div className="relative flex-1 sm:w-48">
              <input
                type="text"
                placeholder="Filtrar voo ou cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/10 focus:bg-white border border-white/20 focus:border-cyan-500 text-white focus:text-slate-900 text-xs py-2 pl-7 pr-3 rounded-xl placeholder:text-slate-400 outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      {/* Flight Board Table / Cards */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Horário</th>
              <th className="py-3 px-4">Voo & Companhia</th>
              <th className="py-3 px-4">{tabType === 'partida' ? 'Destino' : 'Origem'}</th>
              <th className="py-3 px-4">Terminal / Porta</th>
              <th className="py-3 px-4">{tabType === 'partida' ? 'Check-in' : 'Passadeira Bagagem'}</th>
              <th className="py-3 px-4">Aeronave</th>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <Plane className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-xs">Nenhum voo encontrado com os filtros actuais.</p>
                </td>
              </tr>
            ) : (
              filteredItems.map((item, fIdx) => (
                <tr key={`live-${item.id}-${fIdx}`} className="hover:bg-slate-50/80 transition-colors">
                  {/* Horário */}
                  <td className="py-3.5 px-4 font-mono font-bold text-sm text-slate-900">
                    {item.scheduledTime}
                  </td>

                  {/* Voo & Companhia */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md ${item.airline.logoBgColor || 'bg-slate-800'} text-white font-bold text-[10px] flex items-center justify-center shadow-2xs`}>
                        {item.airline.code}
                      </span>
                      <div>
                        <div className="font-bold text-slate-900">{item.flightNumber}</div>
                        <div className="text-[10px] text-slate-500">{item.airline.shortName}</div>
                      </div>
                    </div>
                  </td>

                  {/* Destino / Origem */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <span>{item.otherAirport.city}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({item.otherAirport.code})</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{item.otherAirport.country}</div>
                  </td>

                  {/* Terminal & Portão */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-800 text-[11px]">{item.terminal}</div>
                    {item.gate && (
                      <div className="text-[10px] font-bold text-cyan-700">{item.gate}</div>
                    )}
                  </td>

                  {/* Check-in / Bagagem */}
                  <td className="py-3.5 px-4 text-[11px] text-slate-600 font-medium">
                    {item.type === 'partida' 
                      ? (item.checkInCounters ? `Balcões ${item.checkInCounters}` : 'Balcão Central')
                      : (item.baggageCarousel || 'Passadeira 1')
                    }
                  </td>

                  {/* Aeronave */}
                  <td className="py-3.5 px-4 text-[11px] text-slate-600">
                    {item.aircraft}
                  </td>

                  {/* Estado */}
                  <td className="py-3.5 px-4">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Ação: Comprar Bilhete */}
                  <td className="py-3.5 px-4 text-right">
                    {item.type === 'partida' && (
                      <button
                        type="button"
                        onClick={() => handleBookFromBoard(item)}
                        className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-lg shadow-2xs transition-all cursor-pointer hover:scale-105 active:scale-95"
                        title="Comprar bilhete ou fazer reserva neste voo"
                      >
                        <Ticket className="w-3 h-3" />
                        <span>Comprar Bilhete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info Strip */}
      <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Informações de voo atualizadas via ligação com o Aeroporto Internacional de Maputo.</span>
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Apresentação no aeroporto: <strong>2 horas antes</strong> (Voos Domésticos) e <strong>3 horas antes</strong> (Voos Internacionais).
        </div>
      </div>
    </div>
  );
}
