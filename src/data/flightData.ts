import { Airport, Airline, FlightSchedule, LiveFlightBoardItem } from '../types/types';

export const AIRPORTS: Airport[] = [
  // MOÇAMBIQUE (Nacionais)
  {
    code: 'MPM',
    name: 'Aeroporto Internacional de Maputo (Mavalane)',
    city: 'Maputo',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal A - Doméstico', 'Terminal B - Internacional'],
    isMainHub: true
  },
  {
    code: 'BEW',
    name: 'Aeroporto Internacional da Beira',
    city: 'Beira',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Principal'],
    isMainHub: false
  },
  {
    code: 'APL',
    name: 'Aeroporto Internacional de Nampula',
    city: 'Nampula',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único'],
    isMainHub: false
  },
  {
    code: 'POL',
    name: 'Aeroporto de Pemba (Cabo Delgado)',
    city: 'Pemba',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único'],
    isMainHub: false
  },
  {
    code: 'TET',
    name: 'Aeroporto Chingozi de Tete',
    city: 'Tete',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único']
  },
  {
    code: 'VNX',
    name: 'Aeroporto Internacional de Vilankulo (Bazaruto)',
    city: 'Vilankulo',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Turístico']
  },
  {
    code: 'INH',
    name: 'Aeroporto de Inhambane',
    city: 'Inhambane',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único']
  },
  {
    code: 'UEL',
    name: 'Aeroporto de Quelimane',
    city: 'Quelimane',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único']
  },
  {
    code: 'VXC',
    name: 'Aeroporto de Lichinga',
    city: 'Lichinga',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único']
  },
  {
    code: 'MNC',
    name: 'Aeroporto Internacional de Nacala',
    city: 'Nacala',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Moderno']
  },
  {
    code: 'VPY',
    name: 'Aeroporto de Chimoio',
    city: 'Chimoio',
    country: 'Moçambique',
    region: 'nacional',
    terminals: ['Terminal Único']
  },

  // ÁFRICA AUSTRAL & SADC (Regional)
  {
    code: 'JNB',
    name: 'O.R. Tambo International Airport',
    city: 'Joanesburgo',
    country: 'África do Sul',
    region: 'africa_austral',
    terminals: ['Terminal A', 'Terminal B'],
    isMainHub: true
  },
  {
    code: 'CPT',
    name: 'Cape Town International Airport',
    city: 'Cidade do Cabo',
    country: 'África do Sul',
    region: 'africa_austral',
    terminals: ['International', 'Domestic']
  },
  {
    code: 'DUR',
    name: 'King Shaka International Airport',
    city: 'Durban',
    country: 'África do Sul',
    region: 'africa_austral',
    terminals: ['Terminal Principal']
  },
  {
    code: 'MQP',
    name: 'Kruger Mpumalanga International',
    city: 'Nelspruit / Kruger',
    country: 'África do Sul',
    region: 'africa_austral',
    terminals: ['Terminal Kruger']
  },
  {
    code: 'HRE',
    name: 'Robert Gabriel Mugabe International',
    city: 'Harare',
    country: 'Zimbabwe',
    region: 'africa_austral',
    terminals: ['International Terminal']
  },
  {
    code: 'LAD',
    name: 'Aeroporto Internacional Dr. António Agostinho Neto / 4 de Fevereiro',
    city: 'Luanda',
    country: 'Angola',
    region: 'africa_austral',
    terminals: ['Terminal 1', 'Terminal 2']
  },
  {
    code: 'LUN',
    name: 'Kenneth Kaunda International Airport',
    city: 'Lusaka',
    country: 'Zâmbia',
    region: 'africa_austral',
    terminals: ['Terminal 2']
  },
  {
    code: 'DAR',
    name: 'Julius Nyerere International Airport',
    city: 'Dar es Salaam',
    country: 'Tanzânia',
    region: 'africa_austral',
    terminals: ['Terminal 3']
  },
  {
    code: 'NBO',
    name: 'Jomo Kenyatta International Airport',
    city: 'Nairobi',
    country: 'Quénia',
    region: 'africa_austral',
    terminals: ['Terminal 1A', 'Terminal 1B']
  },
  {
    code: 'GBE',
    name: 'Sir Seretse Khama International Airport',
    city: 'Gaborone',
    country: 'Botswana',
    region: 'africa_austral',
    terminals: ['Terminal Principal']
  },
  {
    code: 'WDH',
    name: 'Hosea Kutako International Airport',
    city: 'Windhoek',
    country: 'Namíbia',
    region: 'africa_austral',
    terminals: ['Main Terminal']
  },
  {
    code: 'ADD',
    name: 'Addis Ababa Bole International Airport',
    city: 'Addis Ababa',
    country: 'Etiópia',
    region: 'africa_austral',
    terminals: ['Terminal 2']
  },

  // INTERNACIONAL (Intercontinental)
  {
    code: 'LIS',
    name: 'Aeroporto Humberto Delgado (Portela)',
    city: 'Lisboa',
    country: 'Portugal',
    region: 'internacional',
    terminals: ['Terminal 1', 'Terminal 2']
  },
  {
    code: 'DOH',
    name: 'Hamad International Airport',
    city: 'Doha',
    country: 'Qatar',
    region: 'internacional',
    terminals: ['Main Terminal']
  },
  {
    code: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'Emirados Árabes',
    region: 'internacional',
    terminals: ['Terminal 3', 'Terminal 1']
  },
  {
    code: 'IST',
    name: 'Istanbul Airport',
    city: 'Istambul',
    country: 'Turquia',
    region: 'internacional',
    terminals: ['Main Terminal']
  }
];

export const AIRLINES: Record<string, Airline> = {
  TM: {
    code: 'TM',
    name: 'LAM - Linhas Aéreas de Moçambique',
    shortName: 'LAM',
    country: 'Moçambique',
    logoBgColor: 'bg-emerald-700',
    alliance: 'Nacional de Bandeira'
  },
  '4Z': {
    code: '4Z',
    name: 'Airlink Southern Africa',
    shortName: 'Airlink',
    country: 'África do Sul',
    logoBgColor: 'bg-sky-800',
    alliance: 'IATA'
  },
  SA: {
    code: 'SA',
    name: 'South African Airways',
    shortName: 'SAA',
    country: 'África do Sul',
    logoBgColor: 'bg-amber-700',
    alliance: 'Star Alliance'
  },
  FA: {
    code: 'FA',
    name: 'FlySafair',
    shortName: 'FlySafair',
    country: 'África do Sul',
    logoBgColor: 'bg-pink-700',
    alliance: 'Low Cost'
  },
  TP: {
    code: 'TP',
    name: 'TAP Air Portugal',
    shortName: 'TAP',
    country: 'Portugal',
    logoBgColor: 'bg-red-700',
    alliance: 'Star Alliance'
  },
  QR: {
    code: 'QR',
    name: 'Qatar Airways',
    shortName: 'Qatar Airways',
    country: 'Qatar',
    logoBgColor: 'bg-rose-900',
    alliance: 'oneworld'
  },
  ET: {
    code: 'ET',
    name: 'Ethiopian Airlines',
    shortName: 'Ethiopian',
    country: 'Etiópia',
    logoBgColor: 'bg-yellow-700',
    alliance: 'Star Alliance'
  },
  KQ: {
    code: 'KQ',
    name: 'Kenya Airways',
    shortName: 'Kenya Airways',
    country: 'Quénia',
    logoBgColor: 'bg-red-800',
    alliance: 'SkyTeam'
  },
  DT: {
    code: 'DT',
    name: 'TAAG Linhas Aéreas de Angola',
    shortName: 'TAAG',
    country: 'Angola',
    logoBgColor: 'bg-orange-700',
    alliance: 'IATA'
  },
  TK: {
    code: 'TK',
    name: 'Turkish Airlines',
    shortName: 'Turkish',
    country: 'Turquia',
    logoBgColor: 'bg-red-900',
    alliance: 'Star Alliance'
  }
};

const getAirport = (code: string): Airport => {
  const ap = AIRPORTS.find(a => a.code === code);
  if (!ap) {
    return {
      code,
      name: `Aeroporto (${code})`,
      city: code,
      country: 'África',
      region: 'africa_austral'
    };
  }
  return ap;
};

export const FLIGHT_SCHEDULES: FlightSchedule[] = [
  // ============================================
  // DOMÉSTICO MOÇAMBIQUE (LAM)
  // ============================================
  {
    id: 'fl-mpm-bew-1',
    flightNumber: 'TM 132',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('BEW'),
    departureTime: '06:45',
    arrivalTime: '08:00',
    durationMinutes: 75,
    durationFormatted: '1h 15m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Boeing 737-700',
    terminal: 'Terminal A - Doméstico',
    gate: 'Gate D2',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 1 },
    basePriceEconomyMT: 5850,
    basePriceBusinessMT: 11200,
    taxesMT: 750,
    availableSeatsEconomy: 28,
    availableSeatsBusiness: 6,
    mealIncluded: 'Snack leve & Bebidas',
    refundable: true,
    changeFeeMT: 1000
  },
  {
    id: 'fl-bew-mpm-1',
    flightNumber: 'TM 133',
    airline: AIRLINES.TM,
    origin: getAirport('BEW'),
    destination: getAirport('MPM'),
    departureTime: '08:45',
    arrivalTime: '10:00',
    durationMinutes: 75,
    durationFormatted: '1h 15m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Boeing 737-700',
    terminal: 'Terminal Principal',
    gate: 'Gate 1',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 1 },
    basePriceEconomyMT: 5850,
    basePriceBusinessMT: 11200,
    taxesMT: 750,
    availableSeatsEconomy: 32,
    availableSeatsBusiness: 4,
    mealIncluded: 'Snack leve & Bebidas',
    refundable: true,
    changeFeeMT: 1000
  },
  {
    id: 'fl-mpm-apl-1',
    flightNumber: 'TM 160',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('APL'),
    departureTime: '09:30',
    arrivalTime: '11:45',
    durationMinutes: 135,
    durationFormatted: '2h 15m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Embraer E190',
    terminal: 'Terminal A - Doméstico',
    gate: 'Gate D4',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 8400,
    basePriceBusinessMT: 16500,
    taxesMT: 920,
    availableSeatsEconomy: 19,
    availableSeatsBusiness: 4,
    mealIncluded: 'Sandwich & Sumo Natural',
    refundable: true,
    changeFeeMT: 1200
  },
  {
    id: 'fl-apl-mpm-1',
    flightNumber: 'TM 161',
    airline: AIRLINES.TM,
    origin: getAirport('APL'),
    destination: getAirport('MPM'),
    departureTime: '12:30',
    arrivalTime: '14:45',
    durationMinutes: 135,
    durationFormatted: '2h 15m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Embraer E190',
    terminal: 'Terminal Único',
    gate: 'Gate 2',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 8400,
    basePriceBusinessMT: 16500,
    taxesMT: 920,
    availableSeatsEconomy: 22,
    availableSeatsBusiness: 6,
    mealIncluded: 'Sandwich & Sumo Natural',
    refundable: true,
    changeFeeMT: 1200
  },
  {
    id: 'fl-mpm-pol-1',
    flightNumber: 'TM 192',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('POL'),
    departureTime: '11:15',
    arrivalTime: '14:00',
    durationMinutes: 165,
    durationFormatted: '2h 45m',
    daysOfWeek: [1, 3, 5, 7],
    stops: 0,
    aircraft: 'Boeing 737-700',
    terminal: 'Terminal A - Doméstico',
    gate: 'Gate D3',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 9800,
    basePriceBusinessMT: 19200,
    taxesMT: 1100,
    availableSeatsEconomy: 14,
    availableSeatsBusiness: 2,
    mealIncluded: 'Refeição Quente Completa',
    refundable: true,
    changeFeeMT: 1500
  },
  {
    id: 'fl-pol-mpm-1',
    flightNumber: 'TM 193',
    airline: AIRLINES.TM,
    origin: getAirport('POL'),
    destination: getAirport('MPM'),
    departureTime: '14:45',
    arrivalTime: '17:30',
    durationMinutes: 165,
    durationFormatted: '2h 45m',
    daysOfWeek: [1, 3, 5, 7],
    stops: 0,
    aircraft: 'Boeing 737-700',
    terminal: 'Terminal Único',
    gate: 'Gate 1',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 9800,
    basePriceBusinessMT: 19200,
    taxesMT: 1100,
    availableSeatsEconomy: 18,
    availableSeatsBusiness: 4,
    mealIncluded: 'Refeição Quente Completa',
    refundable: true,
    changeFeeMT: 1500
  },
  {
    id: 'fl-mpm-tet-1',
    flightNumber: 'TM 144',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('TET'),
    departureTime: '13:00',
    arrivalTime: '15:10',
    durationMinutes: 130,
    durationFormatted: '2h 10m',
    daysOfWeek: [2, 4, 6],
    stops: 0,
    aircraft: 'Dash 8-Q400',
    terminal: 'Terminal A - Doméstico',
    gate: 'Gate D1',
    baggageAllowance: { cabinKg: 7, checkedKg: 20, checkedBagsCount: 1 },
    basePriceEconomyMT: 7600,
    basePriceBusinessMT: 14500,
    taxesMT: 850,
    availableSeatsEconomy: 16,
    availableSeatsBusiness: 2,
    mealIncluded: 'Snack & Água Mineral',
    refundable: true
  },
  {
    id: 'fl-mpm-vnx-1',
    flightNumber: 'TM 116',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('VNX'),
    departureTime: '10:00',
    arrivalTime: '11:15',
    durationMinutes: 75,
    durationFormatted: '1h 15m',
    daysOfWeek: [1, 3, 5, 6, 7],
    stops: 0,
    aircraft: 'Dash 8-Q400',
    terminal: 'Terminal A - Doméstico',
    gate: 'Gate D5',
    baggageAllowance: { cabinKg: 7, checkedKg: 20, checkedBagsCount: 1 },
    basePriceEconomyMT: 6900,
    basePriceBusinessMT: 12800,
    taxesMT: 780,
    availableSeatsEconomy: 12,
    availableSeatsBusiness: 3,
    mealIncluded: 'Snack & Bebidas',
    refundable: true
  },
  {
    id: 'fl-mpm-inh-1',
    flightNumber: 'TM 108',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('INH'),
    departureTime: '15:30',
    arrivalTime: '16:25',
    durationMinutes: 55,
    durationFormatted: '0h 55m',
    daysOfWeek: [1, 2, 4, 5, 7],
    stops: 0,
    aircraft: 'Dash 8-Q400',
    terminal: 'Terminal A - Doméstico',
    gate: 'Gate D1',
    baggageAllowance: { cabinKg: 7, checkedKg: 20, checkedBagsCount: 1 },
    basePriceEconomyMT: 4950,
    basePriceBusinessMT: 9500,
    taxesMT: 650,
    availableSeatsEconomy: 15,
    mealIncluded: 'Bebidas & Biscoitos'
  },

  // ============================================
  // ÁFRICA AUSTRAL & REGIONAL (JNB, CPT, DUR, LAD, DAR, HRE)
  // ============================================
  {
    id: 'fl-mpm-jnb-4z-1',
    flightNumber: '4Z 260',
    airline: AIRLINES['4Z'],
    origin: getAirport('MPM'),
    destination: getAirport('JNB'),
    departureTime: '07:15',
    arrivalTime: '08:25',
    durationMinutes: 70,
    durationFormatted: '1h 10m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Embraer E170',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I1',
    baggageAllowance: { cabinKg: 8, checkedKg: 20, checkedBagsCount: 1 },
    basePriceEconomyMT: 7200,
    basePriceBusinessMT: 15400,
    taxesMT: 1950,
    availableSeatsEconomy: 24,
    availableSeatsBusiness: 6,
    mealIncluded: 'Pequeno-Almoço & Café',
    refundable: true,
    changeFeeMT: 1500
  },
  {
    id: 'fl-jnb-mpm-4z-1',
    flightNumber: '4Z 261',
    airline: AIRLINES['4Z'],
    origin: getAirport('JNB'),
    destination: getAirport('MPM'),
    departureTime: '09:10',
    arrivalTime: '10:20',
    durationMinutes: 70,
    durationFormatted: '1h 10m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Embraer E170',
    terminal: 'Terminal A - International',
    gate: 'Gate A12',
    baggageAllowance: { cabinKg: 8, checkedKg: 20, checkedBagsCount: 1 },
    basePriceEconomyMT: 7200,
    basePriceBusinessMT: 15400,
    taxesMT: 1950,
    availableSeatsEconomy: 28,
    availableSeatsBusiness: 6,
    mealIncluded: 'Snack & Bebidas',
    refundable: true
  },
  {
    id: 'fl-mpm-jnb-tm-1',
    flightNumber: 'TM 302',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('JNB'),
    departureTime: '12:00',
    arrivalTime: '13:10',
    durationMinutes: 70,
    durationFormatted: '1h 10m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Boeing 737-700',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I2',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 6500,
    basePriceBusinessMT: 13900,
    taxesMT: 1850,
    availableSeatsEconomy: 35,
    availableSeatsBusiness: 8,
    mealIncluded: 'Almoço Leve & Bebidas',
    refundable: true
  },
  {
    id: 'fl-mpm-cpt-4z-1',
    flightNumber: '4Z 322',
    airline: AIRLINES['4Z'],
    origin: getAirport('MPM'),
    destination: getAirport('CPT'),
    departureTime: '10:45',
    arrivalTime: '13:30',
    durationMinutes: 165,
    durationFormatted: '2h 45m',
    daysOfWeek: [1, 3, 5, 7],
    stops: 0,
    aircraft: 'Embraer E190',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I3',
    baggageAllowance: { cabinKg: 8, checkedKg: 20, checkedBagsCount: 1 },
    basePriceEconomyMT: 13500,
    basePriceBusinessMT: 26800,
    taxesMT: 2400,
    availableSeatsEconomy: 14,
    availableSeatsBusiness: 4,
    mealIncluded: 'Refeição Quente Completa & Vinhos',
    refundable: true
  },
  {
    id: 'fl-mpm-lad-dt-1',
    flightNumber: 'DT 580',
    airline: AIRLINES.DT,
    origin: getAirport('MPM'),
    destination: getAirport('LAD'),
    departureTime: '14:30',
    arrivalTime: '18:15',
    durationMinutes: 225,
    durationFormatted: '3h 45m',
    daysOfWeek: [2, 4, 7],
    stops: 0,
    aircraft: 'Boeing 737-700',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I4',
    baggageAllowance: { cabinKg: 8, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 18900,
    basePriceBusinessMT: 39500,
    taxesMT: 3100,
    availableSeatsEconomy: 20,
    availableSeatsBusiness: 4,
    mealIncluded: 'Jantar Completo Africano',
    refundable: true
  },
  {
    id: 'fl-mpm-dar-tm-1',
    flightNumber: 'TM 352',
    airline: AIRLINES.TM,
    origin: getAirport('MPM'),
    destination: getAirport('DAR'),
    departureTime: '08:30',
    arrivalTime: '12:40',
    durationMinutes: 190,
    durationFormatted: '3h 10m',
    daysOfWeek: [1, 3, 6],
    stops: 1,
    stopCities: ['Pemba (POL)'],
    aircraft: 'Embraer E190',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I2',
    baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 15800,
    basePriceBusinessMT: 29800,
    taxesMT: 2800,
    availableSeatsEconomy: 18,
    mealIncluded: 'Almoço Quente & Sobremesa'
  },
  {
    id: 'fl-mpm-nbo-kq-1',
    flightNumber: 'KQ 755',
    airline: AIRLINES.KQ,
    origin: getAirport('MPM'),
    destination: getAirport('NBO'),
    departureTime: '17:00',
    arrivalTime: '22:15',
    durationMinutes: 255,
    durationFormatted: '4h 15m',
    daysOfWeek: [1, 3, 5, 7],
    stops: 0,
    aircraft: 'Embraer E190',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I3',
    baggageAllowance: { cabinKg: 8, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 21500,
    basePriceBusinessMT: 44000,
    taxesMT: 3400,
    availableSeatsEconomy: 16,
    availableSeatsBusiness: 4,
    mealIncluded: 'Jantar Quente & Bebidas de Bordo'
  },
  {
    id: 'fl-mpm-add-et-1',
    flightNumber: 'ET 819',
    airline: AIRLINES.ET,
    origin: getAirport('MPM'),
    destination: getAirport('ADD'),
    departureTime: '15:20',
    arrivalTime: '21:50',
    durationMinutes: 330,
    durationFormatted: '5h 30m',
    daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
    stops: 0,
    aircraft: 'Boeing 787-8 Dreamliner',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I1',
    baggageAllowance: { cabinKg: 8, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 22800,
    basePriceBusinessMT: 48500,
    taxesMT: 3600,
    availableSeatsEconomy: 45,
    availableSeatsBusiness: 12,
    mealIncluded: 'Menu Internacional Completo com Bebidas',
    refundable: true
  },

  // ============================================
  // INTERCONTINENTAL (LISBOA, DOHA, ISTAMBUL, DUBAI)
  // ============================================
  {
    id: 'fl-mpm-lis-tp-1',
    flightNumber: 'TP 282',
    airline: AIRLINES.TP,
    origin: getAirport('MPM'),
    destination: getAirport('LIS'),
    departureTime: '21:55',
    arrivalTime: '06:45', // Dia seguinte
    durationMinutes: 650,
    durationFormatted: '10h 50m',
    daysOfWeek: [2, 4, 6, 7],
    stops: 0,
    aircraft: 'Airbus A330-900neo',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I5',
    baggageAllowance: { cabinKg: 8, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 44500,
    basePriceBusinessMT: 98000,
    taxesMT: 6200,
    availableSeatsEconomy: 54,
    availableSeatsBusiness: 10,
    mealIncluded: 'Jantar Quente & Pequeno-Almoço Completo',
    refundable: true,
    changeFeeMT: 3500
  },
  {
    id: 'fl-lis-mpm-tp-1',
    flightNumber: 'TP 281',
    airline: AIRLINES.TP,
    origin: getAirport('LIS'),
    destination: getAirport('MPM'),
    departureTime: '10:00',
    arrivalTime: '20:30',
    durationMinutes: 630,
    durationFormatted: '10h 30m',
    daysOfWeek: [2, 4, 6, 7],
    stops: 0,
    aircraft: 'Airbus A330-900neo',
    terminal: 'Terminal 1',
    gate: 'Gate 42',
    baggageAllowance: { cabinKg: 8, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 44500,
    basePriceBusinessMT: 98000,
    taxesMT: 6200,
    availableSeatsEconomy: 60,
    availableSeatsBusiness: 12,
    mealIncluded: 'Almoço & Jantar de Alta Gastronomia',
    refundable: true
  },
  {
    id: 'fl-mpm-doh-qr-1',
    flightNumber: 'QR 1362',
    airline: AIRLINES.QR,
    origin: getAirport('MPM'),
    destination: getAirport('DOH'),
    departureTime: '13:40',
    arrivalTime: '23:55',
    durationMinutes: 555,
    durationFormatted: '9h 15m',
    daysOfWeek: [1, 3, 5, 7],
    stops: 0,
    aircraft: 'Boeing 787-9 Dreamliner',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I4',
    baggageAllowance: { cabinKg: 8, checkedKg: 25, checkedBagsCount: 2 },
    basePriceEconomyMT: 46200,
    basePriceBusinessMT: 108000,
    taxesMT: 6800,
    availableSeatsEconomy: 42,
    availableSeatsBusiness: 8,
    mealIncluded: 'Cozinha 5 Estrelas & Entretenimento Oryx One',
    refundable: true
  },
  {
    id: 'fl-mpm-ist-tk-1',
    flightNumber: 'TK 039',
    airline: AIRLINES.TK,
    origin: getAirport('MPM'),
    destination: getAirport('IST'),
    departureTime: '18:10',
    arrivalTime: '05:40',
    durationMinutes: 630,
    durationFormatted: '10h 30m',
    daysOfWeek: [2, 5, 7],
    stops: 1,
    stopCities: ['Joanesburgo (JNB)'],
    aircraft: 'Airbus A350-900',
    terminal: 'Terminal B - Internacional',
    gate: 'Gate I2',
    baggageAllowance: { cabinKg: 8, checkedKg: 23, checkedBagsCount: 2 },
    basePriceEconomyMT: 41800,
    basePriceBusinessMT: 92000,
    taxesMT: 5900,
    availableSeatsEconomy: 38,
    availableSeatsBusiness: 6,
    mealIncluded: 'Menu Chef Volante & Conforto Turco'
  }
];

// Helper to generate live flight boards for today at Maputo International Airport (MPM)
export const getLiveFlightBoardForAirport = (airportCode: string = 'MPM'): LiveFlightBoardItem[] => {
  return [
    // PARTIDAS (Departures)
    {
      id: 'dep-1',
      flightNumber: 'TM 132',
      airline: AIRLINES.TM,
      type: 'partida',
      airportCode,
      scheduledTime: '06:45',
      estimatedTime: '06:45',
      otherAirport: getAirport('BEW'),
      status: 'Aterrado',
      gate: 'Gate D2',
      terminal: 'Terminal A - Doméstico',
      checkInCounters: '01 - 04',
      aircraft: 'Boeing 737-700',
      remarks: 'Portas fechadas no horário',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-bew-1'
    },
    {
      id: 'dep-2',
      flightNumber: '4Z 260',
      airline: AIRLINES['4Z'],
      type: 'partida',
      airportCode,
      scheduledTime: '07:15',
      estimatedTime: '07:15',
      otherAirport: getAirport('JNB'),
      status: 'Em Voo',
      gate: 'Gate I1',
      terminal: 'Terminal B - Internacional',
      checkInCounters: '10 - 14',
      aircraft: 'Embraer E170',
      remarks: 'Descolou com sucesso às 07:18',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-jnb-4z-1'
    },
    {
      id: 'dep-3',
      flightNumber: 'TM 160',
      airline: AIRLINES.TM,
      type: 'partida',
      airportCode,
      scheduledTime: '09:30',
      estimatedTime: '09:30',
      otherAirport: getAirport('APL'),
      status: 'No Horário',
      gate: 'Gate D4',
      terminal: 'Terminal A - Doméstico',
      checkInCounters: '03 - 06',
      aircraft: 'Embraer E190',
      remarks: 'Check-in aberto nos balcões',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-apl-1'
    },
    {
      id: 'dep-4',
      flightNumber: 'TM 116',
      airline: AIRLINES.TM,
      type: 'partida',
      airportCode,
      scheduledTime: '10:00',
      estimatedTime: '10:00',
      otherAirport: getAirport('VNX'),
      status: 'Embarque',
      gate: 'Gate D5',
      terminal: 'Terminal A - Doméstico',
      checkInCounters: '07 - 08',
      aircraft: 'Dash 8-Q400',
      remarks: 'Passageiros a dirigir-se à porta D5',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-vnx-1'
    },
    {
      id: 'dep-5',
      flightNumber: '4Z 322',
      airline: AIRLINES['4Z'],
      type: 'partida',
      airportCode,
      scheduledTime: '10:45',
      estimatedTime: '10:45',
      otherAirport: getAirport('CPT'),
      status: 'No Horário',
      gate: 'Gate I3',
      terminal: 'Terminal B - Internacional',
      checkInCounters: '15 - 18',
      aircraft: 'Embraer E190',
      remarks: 'Voo direto para Cidade do Cabo',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-cpt-4z-1'
    },
    {
      id: 'dep-6',
      flightNumber: 'TM 192',
      airline: AIRLINES.TM,
      type: 'partida',
      airportCode,
      scheduledTime: '11:15',
      estimatedTime: '11:15',
      otherAirport: getAirport('POL'),
      status: 'No Horário',
      gate: 'Gate D3',
      terminal: 'Terminal A - Doméstico',
      checkInCounters: '02 - 05',
      aircraft: 'Boeing 737-700',
      remarks: 'Bagagem permitida 2x23kg',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-pol-1'
    },
    {
      id: 'dep-7',
      flightNumber: 'TM 302',
      airline: AIRLINES.TM,
      type: 'partida',
      airportCode,
      scheduledTime: '12:00',
      estimatedTime: '12:00',
      otherAirport: getAirport('JNB'),
      status: 'No Horário',
      gate: 'Gate I2',
      terminal: 'Terminal B - Internacional',
      checkInCounters: '06 - 09',
      aircraft: 'Boeing 737-700',
      remarks: 'Conexões regionais em Joanesburgo',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-jnb-tm-1'
    },
    {
      id: 'dep-8',
      flightNumber: 'QR 1362',
      airline: AIRLINES.QR,
      type: 'partida',
      airportCode,
      scheduledTime: '13:40',
      estimatedTime: '13:40',
      otherAirport: getAirport('DOH'),
      status: 'No Horário',
      gate: 'Gate I4',
      terminal: 'Terminal B - Internacional',
      checkInCounters: '20 - 26',
      aircraft: 'Boeing 787-9 Dreamliner',
      remarks: 'Lounge Flamingo aberto aos passageiros Business',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-doh-qr-1'
    },
    {
      id: 'dep-9',
      flightNumber: 'ET 819',
      airline: AIRLINES.ET,
      type: 'partida',
      airportCode,
      scheduledTime: '15:20',
      estimatedTime: '15:20',
      otherAirport: getAirport('ADD'),
      status: 'No Horário',
      gate: 'Gate I1',
      terminal: 'Terminal B - Internacional',
      checkInCounters: '12 - 16',
      aircraft: 'Boeing 787-8 Dreamliner',
      remarks: 'Ligação para Médio Oriente, Ásia e Europa',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-add-et-1'
    },
    {
      id: 'dep-10',
      flightNumber: 'TP 282',
      airline: AIRLINES.TP,
      type: 'partida',
      airportCode,
      scheduledTime: '21:55',
      estimatedTime: '21:55',
      otherAirport: getAirport('LIS'),
      status: 'No Horário',
      gate: 'Gate I5',
      terminal: 'Terminal B - Internacional',
      checkInCounters: '01 - 08',
      aircraft: 'Airbus A330-900neo',
      remarks: 'Voo noturno direto para Lisboa',
      canBookDirectly: true,
      flightScheduleRefId: 'fl-mpm-lis-tp-1'
    },

    // CHEGADAS (Arrivals)
    {
      id: 'arr-1',
      flightNumber: '4Z 261',
      airline: AIRLINES['4Z'],
      type: 'chegada',
      airportCode,
      scheduledTime: '10:20',
      estimatedTime: '10:15',
      otherAirport: getAirport('JNB'),
      status: 'Aterrado',
      gate: 'Gate I1',
      terminal: 'Terminal B - Internacional',
      baggageCarousel: 'Passadeira 2 (Internacional)',
      aircraft: 'Embraer E170',
      remarks: 'Aterrou adiantado'
    },
    {
      id: 'arr-2',
      flightNumber: 'TM 133',
      airline: AIRLINES.TM,
      type: 'chegada',
      airportCode,
      scheduledTime: '10:00',
      estimatedTime: '10:00',
      otherAirport: getAirport('BEW'),
      status: 'Aterrado',
      gate: 'Gate D2',
      terminal: 'Terminal A - Doméstico',
      baggageCarousel: 'Passadeira 1 (Doméstico)',
      aircraft: 'Boeing 737-700',
      remarks: 'Desembarque concluído'
    },
    {
      id: 'arr-3',
      flightNumber: 'TM 161',
      airline: AIRLINES.TM,
      type: 'chegada',
      airportCode,
      scheduledTime: '14:45',
      estimatedTime: '14:45',
      otherAirport: getAirport('APL'),
      status: 'Em Voo',
      gate: 'Gate D4',
      terminal: 'Terminal A - Doméstico',
      baggageCarousel: 'Passadeira 1 (Doméstico)',
      aircraft: 'Embraer E190',
      remarks: 'Estimativa de aterragem no horário'
    },
    {
      id: 'arr-4',
      flightNumber: 'TM 193',
      airline: AIRLINES.TM,
      type: 'chegada',
      airportCode,
      scheduledTime: '17:30',
      estimatedTime: '17:30',
      otherAirport: getAirport('POL'),
      status: 'No Horário',
      gate: 'Gate D3',
      terminal: 'Terminal A - Doméstico',
      baggageCarousel: 'Passadeira 1 (Doméstico)',
      aircraft: 'Boeing 737-700',
      remarks: 'Em rota de Pemba'
    },
    {
      id: 'arr-5',
      flightNumber: 'TP 281',
      airline: AIRLINES.TP,
      type: 'chegada',
      airportCode,
      scheduledTime: '20:30',
      estimatedTime: '20:25',
      otherAirport: getAirport('LIS'),
      status: 'No Horário',
      gate: 'Gate I5',
      terminal: 'Terminal B - Internacional',
      baggageCarousel: 'Passadeira 3 (Internacional)',
      aircraft: 'Airbus A330-900neo',
      remarks: 'Voo de Lisboa sem escalas'
    }
  ];
};

// Search flights algorithm by origin, destination, date, cabin class
export const searchFlights = (params: {
  originCode: string;
  destinationCode: string;
  tripType: 'one_way' | 'round_trip';
  outboundDate: string;
  returnDate?: string;
  cabinClass?: 'economy' | 'premium_economy' | 'business';
  passengersCount?: number;
  stopsFilter?: 'all' | 'direct' | 'stops';
  airlineCode?: string;
}): {
  outbound: FlightSchedule[];
  inbound: FlightSchedule[];
} => {
  const { originCode, destinationCode, stopsFilter, airlineCode } = params;

  let outboundMatches = FLIGHT_SCHEDULES.filter(f => {
    const matchOrigin = !originCode || f.origin.code === originCode;
    const matchDest = !destinationCode || f.destination.code === destinationCode;
    const matchAirline = !airlineCode || airlineCode === 'all' || f.airline.code === airlineCode;
    const matchStops = !stopsFilter || stopsFilter === 'all' 
      ? true 
      : stopsFilter === 'direct' ? f.stops === 0 : f.stops > 0;

    return matchOrigin && matchDest && matchAirline && matchStops;
  });

  // If no direct schedule exists between rare pair, construct a smart dynamic connecting route via Maputo (MPM) or Joanesburgo (JNB)
  if (outboundMatches.length === 0 && originCode && destinationCode && originCode !== destinationCode) {
    const originAp = getAirport(originCode);
    const destAp = getAirport(destinationCode);

    // Is it domestic to domestic via MPM?
    const isDomestic = originAp.country === 'Moçambique' && destAp.country === 'Moçambique';
    const hub = isDomestic ? getAirport('MPM') : getAirport('JNB');

    const estPrice = isDomestic ? 12500 : 28900;
    const estTax = isDomestic ? 1400 : 4200;

    outboundMatches = [
      {
        id: `fl-dyn-${originCode}-${destinationCode}-1`,
        flightNumber: isDomestic ? 'TM 890' : '4Z 550',
        airline: isDomestic ? AIRLINES.TM : AIRLINES['4Z'],
        origin: originAp,
        destination: destAp,
        departureTime: '08:00',
        arrivalTime: '13:30',
        durationMinutes: 330,
        durationFormatted: '5h 30m',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        stops: 1,
        stopCities: [`${hub.city} (${hub.code})`],
        aircraft: isDomestic ? 'Embraer E190' : 'Boeing 737-800',
        terminal: isDomestic ? 'Terminal A - Doméstico' : 'Terminal B - Internacional',
        gate: 'Gate D2',
        baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
        basePriceEconomyMT: estPrice,
        basePriceBusinessMT: Math.round(estPrice * 1.9),
        taxesMT: estTax,
        availableSeatsEconomy: 14,
        availableSeatsBusiness: 4,
        mealIncluded: 'Refeição Quente Completa',
        refundable: true
      }
    ];
  }

  let inboundMatches: FlightSchedule[] = [];
  if (params.tripType === 'round_trip' && destinationCode && originCode) {
    inboundMatches = FLIGHT_SCHEDULES.filter(f => {
      const matchOrigin = f.origin.code === destinationCode;
      const matchDest = f.destination.code === originCode;
      const matchAirline = !airlineCode || airlineCode === 'all' || f.airline.code === airlineCode;
      return matchOrigin && matchDest && matchAirline;
    });

    if (inboundMatches.length === 0) {
      const originAp = getAirport(destinationCode);
      const destAp = getAirport(originCode);
      const isDomestic = originAp.country === 'Moçambique' && destAp.country === 'Moçambique';
      const estPrice = isDomestic ? 12500 : 28900;
      const estTax = isDomestic ? 1400 : 4200;

      inboundMatches = [
        {
          id: `fl-dyn-ret-${destinationCode}-${originCode}-1`,
          flightNumber: isDomestic ? 'TM 891' : '4Z 551',
          airline: isDomestic ? AIRLINES.TM : AIRLINES['4Z'],
          origin: originAp,
          destination: destAp,
          departureTime: '15:00',
          arrivalTime: '20:30',
          durationMinutes: 330,
          durationFormatted: '5h 30m',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
          stops: 1,
          stopCities: [isDomestic ? 'Maputo (MPM)' : 'Joanesburgo (JNB)'],
          aircraft: isDomestic ? 'Embraer E190' : 'Boeing 737-800',
          terminal: isDomestic ? 'Terminal A - Doméstico' : 'Terminal B - Internacional',
          gate: 'Gate D1',
          baggageAllowance: { cabinKg: 7, checkedKg: 23, checkedBagsCount: 2 },
          basePriceEconomyMT: estPrice,
          basePriceBusinessMT: Math.round(estPrice * 1.9),
          taxesMT: estTax,
          availableSeatsEconomy: 16,
          availableSeatsBusiness: 4,
          mealIncluded: 'Refeição Quente Completa',
          refundable: true
        }
      ];
    }
  }

  return {
    outbound: outboundMatches,
    inbound: inboundMatches
  };
};
