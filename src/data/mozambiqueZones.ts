/**
 * Directório oficial de Províncias, Cidades, Distritos e Zonas de Moçambique
 * para o Directório & Marketplace Axofácil!
 */

export interface MozambiqueProvince {
  id: string;
  name: string;
  shortName: string;
  capital: string;
  region: 'Sul' | 'Centro' | 'Norte';
  lat: number;
  lng: number;
  districts: string[];
}

export const MOZAMBIQUE_PROVINCES: MozambiqueProvince[] = [
  {
    id: 'cidade-maputo',
    name: 'Cidade de Maputo',
    shortName: 'Maputo Cidade',
    capital: 'Maputo',
    region: 'Sul',
    lat: -25.9692,
    lng: 32.5732,
    districts: [
      'KaMphumo (Baixa/Polana/Central)',
      'Nlhamankulu (Alto Maé/Malhangalene/Chamanculo)',
      'KaMaxakeni (Mafalala/Maxaquene/Polana Caniço)',
      'KaMavota (Mavalane/FPLM/Hulene/Albasine)',
      'KaMubukwana (Bagamoyo/Inhagoia/George Dimitrov)',
      'KaTembe',
      'KaNyaka (Ilha de Inhaca)'
    ]
  },
  {
    id: 'provincia-maputo',
    name: 'Província de Maputo',
    shortName: 'Maputo Província',
    capital: 'Matola',
    region: 'Sul',
    lat: -25.8202,
    lng: 32.4632,
    districts: [
      'Matola (Cidade)',
      'Boane',
      'Marracuene',
      'Manhiça',
      'Namaacha',
      'Moamba',
      'Magude',
      'Matutuíne (Ponta do Ouro/Bela Vista)'
    ]
  },
  {
    id: 'gaza',
    name: 'Gaza',
    shortName: 'Gaza',
    capital: 'Xai-Xai',
    region: 'Sul',
    lat: -25.0519,
    lng: 33.6442,
    districts: [
      'Xai-Xai (Cidade)',
      'Chókwè',
      'Bilene (Praia do Bilene)',
      'Mandlakazi',
      'Chibuto',
      'Macia',
      'Guijá',
      'Mabalane',
      'Massingir',
      'Chicualacuala',
      'Chigubo'
    ]
  },
  {
    id: 'inhambane',
    name: 'Inhambane',
    shortName: 'Inhambane',
    capital: 'Inhambane',
    region: 'Sul',
    lat: -23.8650,
    lng: 35.3833,
    districts: [
      'Cidade de Inhambane',
      'Maxixe (Cidade)',
      'Vilankulo (Praia & Arquipélago de Bazaruto)',
      'Massinga',
      'Morrumbene',
      'Zavala (Quissico)',
      'Jangamo (Praia do Tofo / Barra)',
      'Inharrime',
      'Panda',
      'Homoíne',
      'Govuro'
    ]
  },
  {
    id: 'sofala',
    name: 'Sofala',
    shortName: 'Sofala',
    capital: 'Beira',
    region: 'Centro',
    lat: -19.8436,
    lng: 34.8389,
    districts: [
      'Cidade da Beira (Chaimite/Ponta Gêa/Munhava/Macuti)',
      'Dondo',
      'Nhamatanda',
      'Búzi',
      'Gorongosa (Parque Nacional)',
      'Caia',
      'Marromeu',
      'Cheringoma',
      'Muanza',
      'Machanga',
      'Marínguè'
    ]
  },
  {
    id: 'manica',
    name: 'Manica',
    shortName: 'Manica',
    capital: 'Chimoio',
    region: 'Centro',
    lat: -19.1164,
    lng: 33.4833,
    districts: [
      'Cidade de Chimoio',
      'Manica (Vila)',
      'Gondola',
      'Sussundenga',
      'Báruè (Catandica)',
      'Mossurize (Espungabera)',
      'Vanduzi',
      'Macate',
      'Guro',
      'Tambara'
    ]
  },
  {
    id: 'tete',
    name: 'Tete',
    shortName: 'Tete',
    capital: 'Tete',
    region: 'Centro',
    lat: -16.1564,
    lng: 33.5862,
    districts: [
      'Cidade de Tete',
      'Moatize',
      'Cahora Bassa (Songo)',
      'Changara',
      'Angónia (Ulongué)',
      'Mutarara',
      'Tsangano',
      'Magoé',
      'Marara',
      'Dôa',
      'Zumbo'
    ]
  },
  {
    id: 'zambezia',
    name: 'Zambézia',
    shortName: 'Zambézia',
    capital: 'Quelimane',
    region: 'Centro',
    lat: -17.8786,
    lng: 36.8883,
    districts: [
      'Cidade de Quelimane',
      'Mocuba (Cidade)',
      'Gurué',
      'Alto Molócuè',
      'Milange',
      'Morrumbala',
      'Nicoadala',
      'Namacurra',
      'Maganja da Costa',
      'Pebane',
      'Gilé',
      'Lugela'
    ]
  },
  {
    id: 'nampula',
    name: 'Nampula',
    shortName: 'Nampula',
    capital: 'Nampula',
    region: 'Norte',
    lat: -15.1165,
    lng: 39.2666,
    districts: [
      'Cidade de Nampula',
      'Nacala-Porto (Cidade)',
      'Ilha de Moçambique (Cidade Histórica)',
      'Angoche (Cidade)',
      'Monapo',
      'Meconta',
      'Ribáuè',
      'Malema',
      'Moma',
      'Mossuril',
      'Nacala-a-Velha',
      'Mogovolas'
    ]
  },
  {
    id: 'cabo-delgado',
    name: 'Cabo Delgado',
    shortName: 'Cabo Delgado',
    capital: 'Pemba',
    region: 'Norte',
    lat: -12.9740,
    lng: 40.5178,
    districts: [
      'Cidade de Pemba',
      'Montepuez (Cidade)',
      'Chiúre',
      'Ancuabe',
      'Mocímboa da Praia',
      'Palma',
      'Mueda',
      'Macomia',
      'Metuge',
      'Namuno',
      'Balama',
      'Ibo (Ilhas Quirimbas)'
    ]
  },
  {
    id: 'niassa',
    name: 'Niassa',
    shortName: 'Niassa',
    capital: 'Lichinga',
    region: 'Norte',
    lat: -13.3131,
    lng: 35.2406,
    districts: [
      'Cidade de Lichinga',
      'Cuamba (Cidade)',
      'Mandimba',
      'Lago (Metangula)',
      'Marrupa',
      'Mecanhelas',
      'Majune',
      'Sanga',
      'Muembe',
      'Ngauma'
    ]
  }
];

export interface MozambiqueZone {
  name: string;
  province: string;
  municipality?: string;
  district?: string;
  lat: number;
  lng: number;
  keywords: string[];
}

export const MOZAMBIQUE_ZONES: MozambiqueZone[] = [
  // ==========================================
  // CIDADE DE MAPUTO
  // ==========================================
  {
    name: 'Polana Cimento A',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9723,
    lng: 32.5934,
    keywords: ['polana', 'polana cimento', 'polana a', 'julius nyerere', 'kenneth kaunda']
  },
  {
    name: 'Polana Cimento B',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9664,
    lng: 32.5852,
    keywords: ['polana b', 'vladimir lenine', 'milano', 'kim il sung']
  },
  {
    name: 'Central A (Baixa de Maputo)',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9720,
    lng: 32.5732,
    keywords: ['central', 'baixa', '25 de setembro', 'samora machel', 'praca dos trabalhadores', 'porto']
  },
  {
    name: 'Central B (Mercado Central / Museu)',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9685,
    lng: 32.5750,
    keywords: ['central b', 'mercado central', '24 de julho', 'eduardo mondlane']
  },
  {
    name: 'Central C (Karl Marx / Ho Chi Min)',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9620,
    lng: 32.5710,
    keywords: ['central c', 'karl marx', 'ho chi min']
  },
  {
    name: 'Alto Maé A',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9610,
    lng: 32.5645,
    keywords: ['alto mae', 'alto mae a', 'avenida de mocambique', 'praca 18 de maio']
  },
  {
    name: 'Alto Maé B',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9575,
    lng: 32.5600,
    keywords: ['alto mae b', 'rua dos irmas', 'estrada velha']
  },
  {
    name: 'Malhangalene A',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9550,
    lng: 32.5790,
    keywords: ['malhangalene', 'malhangalene a', 'marien ngouabi', 'acordos de lusaka']
  },
  {
    name: 'Malhangalene B',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9520,
    lng: 32.5840,
    keywords: ['malhangalene b', 'cinema venezuela']
  },
  {
    name: 'Sommerschield 1',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9605,
    lng: 32.5960,
    keywords: ['sommerschield', 'sommerschield 1', 'hospital central', 'uem']
  },
  {
    name: 'Sommerschield 2 (Clube Marítimo / UEM Nova)',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMphumo',
    lat: -25.9450,
    lng: 32.6020,
    keywords: ['sommerschield 2', 'maritimo', 'uem nova', 'francesa', 'marginal']
  },
  {
    name: 'Costa do Sol (Triunfo / Miramar)',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMavota',
    lat: -25.9280,
    lng: 32.6280,
    keywords: ['costa do sol', 'triunfo', 'dona alice', 'marginal', 'praia']
  },

  // ==========================================
  // PROVÍNCIA DE MAPUTO (MATOLA / BOANE / MARRACUENE)
  // ==========================================
  {
    name: 'Matola Centro (Câmara Municipal)',
    province: 'Província de Maputo',
    municipality: 'Matola',
    district: 'Matola Sede',
    lat: -25.9620,
    lng: 32.4590,
    keywords: ['matola centro', 'camara', 'tribunal', 'museu da matola']
  },
  {
    name: 'Matola C (Zona Industrial / Coca-Cola)',
    province: 'Província de Maputo',
    municipality: 'Matola',
    district: 'Posto Infulene',
    lat: -25.9420,
    lng: 32.4850,
    keywords: ['matola c', 'coca cola', 'zona industrial']
  },
  {
    name: 'Matola D (Mercado Santos)',
    province: 'Província de Maputo',
    municipality: 'Matola',
    district: 'Posto Machava',
    lat: -25.9350,
    lng: 32.4950,
    keywords: ['matola d', 'mercado santos', 'paragem santos']
  },
  {
    name: 'Machava Sede',
    province: 'Província de Maputo',
    municipality: 'Matola',
    district: 'Posto Machava',
    lat: -25.9080,
    lng: 32.4980,
    keywords: ['machava', 'machava sede', 'estadio da machava']
  },
  {
    name: 'Zimpeto (Estádio Nacional & Mercado Grossista)',
    province: 'Cidade de Maputo',
    municipality: 'Cidade de Maputo',
    district: 'KaMubukwana',
    lat: -25.8450,
    lng: 32.5350,
    keywords: ['zimpeto', 'estadio nacional', 'mercado grossista', 'paragem do zimpeto']
  },
  {
    name: 'Marracuene Sede',
    province: 'Província de Maputo',
    municipality: 'Marracuene',
    district: 'Marracuene',
    lat: -25.7140,
    lng: 32.6730,
    keywords: ['marracuene', 'vila de marracuene', 'rio incomati']
  },
  {
    name: 'Boane Vila & Estaleiros',
    province: 'Província de Maputo',
    municipality: 'Boane',
    district: 'Boane',
    lat: -26.0420,
    lng: 32.3310,
    keywords: ['boane', 'estaleiros boane', 'vila de boane']
  },
  {
    name: 'Ponta do Ouro (Praia & Lodges)',
    province: 'Província de Maputo',
    municipality: 'Matutuíne',
    district: 'Matutuíne',
    lat: -26.8455,
    lng: 32.8872,
    keywords: ['ponta do ouro', 'praia', 'lodges', 'mergulho', 'reserva de maputo']
  },

  // ==========================================
  // GAZA
  // ==========================================
  {
    name: 'Xai-Xai Centro Comercial & Praia',
    province: 'Gaza',
    municipality: 'Xai-Xai',
    district: 'Xai-Xai',
    lat: -25.0519,
    lng: 33.6442,
    keywords: ['xai-xai', 'gaza', 'praia de xai-xai', 'limpopo']
  },
  {
    name: 'Praia do Bilene',
    province: 'Gaza',
    municipality: 'Bilene',
    district: 'Bilene',
    lat: -25.2633,
    lng: 33.2433,
    keywords: ['bilene', 'praia do bilene', 'lagoa uhmbi', 'resorts']
  },
  {
    name: 'Chókwè Cidade Agrícola',
    province: 'Gaza',
    municipality: 'Chókwè',
    district: 'Chókwè',
    lat: -24.5333,
    lng: 32.9833,
    keywords: ['chokwe', 'chókwè', 'regadio', 'arroz']
  },

  // ==========================================
  // INHAMBANE
  // ==========================================
  {
    name: 'Cidade de Inhambane & Baía',
    province: 'Inhambane',
    municipality: 'Inhambane',
    district: 'Inhambane',
    lat: -23.8650,
    lng: 35.3833,
    keywords: ['inhambane', 'cidade de inhambane', 'baia', 'porto']
  },
  {
    name: 'Praia do Tofo & Barra',
    province: 'Inhambane',
    municipality: 'Jangamo',
    district: 'Jangamo',
    lat: -23.8564,
    lng: 35.5456,
    keywords: ['tofo', 'barra', 'praia do tofo', 'surf', 'tubarao baleia']
  },
  {
    name: 'Vilankulo & Arquipélago de Bazaruto',
    province: 'Inhambane',
    municipality: 'Vilankulo',
    district: 'Vilankulo',
    lat: -22.0000,
    lng: 35.3167,
    keywords: ['vilankulo', 'bazaruto', 'benguerra', 'santa carolina', 'turismo de praia']
  },
  {
    name: 'Maxixe Cidade Comercial',
    province: 'Inhambane',
    municipality: 'Maxixe',
    district: 'Maxixe',
    lat: -23.8594,
    lng: 35.3472,
    keywords: ['maxixe', 'porto de maxixe', 'mercado']
  },

  // ==========================================
  // SOFALA
  // ==========================================
  {
    name: 'Beira Centro & Ponta Gêa',
    province: 'Sofala',
    municipality: 'Cidade da Beira',
    district: 'Beira',
    lat: -19.8436,
    lng: 34.8389,
    keywords: ['beira', 'ponta gea', 'chaimite', 'porto da beira', 'macuti']
  },
  {
    name: 'Dondo Sede & Indústria',
    province: 'Sofala',
    municipality: 'Dondo',
    district: 'Dondo',
    lat: -19.6094,
    lng: 34.7431,
    keywords: ['dondo', 'cimento dondo', 'estaleiros']
  },
  {
    name: 'Gorongosa & Parque Nacional',
    province: 'Sofala',
    municipality: 'Gorongosa',
    district: 'Gorongosa',
    lat: -18.6833,
    lng: 34.0667,
    keywords: ['gorongosa', 'parque nacional', 'safari', 'chitengo']
  },

  // ==========================================
  // MANICA
  // ==========================================
  {
    name: 'Chimoio Centro & Cabeça do Velho',
    province: 'Manica',
    municipality: 'Chimoio',
    district: 'Chimoio',
    lat: -19.1164,
    lng: 33.4833,
    keywords: ['chimoio', 'cabeca do velho', 'manica', 'mercado 3 de fevereiro']
  },
  {
    name: 'Vila de Manica',
    province: 'Manica',
    municipality: 'Manica',
    district: 'Manica',
    lat: -18.9333,
    lng: 32.8833,
    keywords: ['vila de manica', 'fronteira machipanda']
  },

  // ==========================================
  // TETE
  // ==========================================
  {
    name: 'Tete Centro & Ponte Samora Machel',
    province: 'Tete',
    municipality: 'Cidade de Tete',
    district: 'Tete',
    lat: -16.1564,
    lng: 33.5862,
    keywords: ['tete', 'rio zambeze', 'ponte samora machel', 'cidade de tete']
  },
  {
    name: 'Moatize (Zona Mineira & Comercial)',
    province: 'Tete',
    municipality: 'Moatize',
    district: 'Moatize',
    lat: -16.1189,
    lng: 33.7292,
    keywords: ['moatize', 'vale', 'minas', 'carvao']
  },
  {
    name: 'Songo (Barragem de Cahora Bassa)',
    province: 'Tete',
    municipality: 'Cahora Bassa',
    district: 'Cahora Bassa',
    lat: -15.6144,
    lng: 32.7711,
    keywords: ['songo', 'cahora bassa', 'albufeira', 'hcb']
  },

  // ==========================================
  // ZAMBÉZIA
  // ==========================================
  {
    name: 'Quelimane Centro & Rio dos Bons Sinais',
    province: 'Zambézia',
    municipality: 'Quelimane',
    district: 'Quelimane',
    lat: -17.8786,
    lng: 36.8883,
    keywords: ['quelimane', 'rio dos bons sinais', 'zambezia', 'palmeiras']
  },
  {
    name: 'Mocuba Cidade',
    province: 'Zambézia',
    municipality: 'Mocuba',
    district: 'Mocuba',
    lat: -16.8372,
    lng: 36.9856,
    keywords: ['mocuba', 'cruzamento', 'zambezia']
  },
  {
    name: 'Gurué (Chá & Montanhas)',
    province: 'Zambézia',
    municipality: 'Gurué',
    district: 'Gurué',
    lat: -15.4667,
    lng: 36.9833,
    keywords: ['gurue', 'gurué', 'cha', 'namuli']
  },

  // ==========================================
  // NAMPULA
  // ==========================================
  {
    name: 'Cidade de Nampula Centro',
    province: 'Nampula',
    municipality: 'Nampula',
    district: 'Nampula',
    lat: -15.1165,
    lng: 39.2666,
    keywords: ['nampula', 'capital do norte', 'muatala', 'catedral de nampula']
  },
  {
    name: 'Nacala-Porto (Porto de Águas Profundas)',
    province: 'Nampula',
    municipality: 'Nacala-Porto',
    district: 'Nacala-Porto',
    lat: -14.5428,
    lng: 40.6728,
    keywords: ['nacala', 'nacala-porto', 'porto de nacala', 'zona economica']
  },
  {
    name: 'Ilha de Moçambique (Património Mundial)',
    province: 'Nampula',
    municipality: 'Ilha de Moçambique',
    district: 'Ilha de Moçambique',
    lat: -15.0342,
    lng: 40.7303,
    keywords: ['ilha de mocambique', 'patrimonio mundial', 'fortaleza', 'turismo historico']
  },

  // ==========================================
  // CABO DELGADO
  // ==========================================
  {
    name: 'Pemba Centro & Praia de Wimbe',
    province: 'Cabo Delgado',
    municipality: 'Pemba',
    district: 'Pemba',
    lat: -12.9740,
    lng: 40.5178,
    keywords: ['pemba', 'praia de wimbe', 'cabo delgado', 'baia de pemba']
  },
  {
    name: 'Montepuez Cidade',
    province: 'Cabo Delgado',
    municipality: 'Montepuez',
    district: 'Montepuez',
    lat: -13.1256,
    lng: 38.9997,
    keywords: ['montepuez', 'rubis', 'cabo delgado']
  },

  // ==========================================
  // NIASSA
  // ==========================================
  {
    name: 'Lichinga Centro',
    province: 'Niassa',
    municipality: 'Lichinga',
    district: 'Lichinga',
    lat: -13.3131,
    lng: 35.2406,
    keywords: ['lichinga', 'niassa', 'planalto', 'aeroporto de lichinga']
  },
  {
    name: 'Cuamba Cidade Ferroviária',
    province: 'Niassa',
    municipality: 'Cuamba',
    district: 'Cuamba',
    lat: -14.8031,
    lng: 36.5372,
    keywords: ['cuamba', 'ferrovia', 'corredor de nacala']
  },
  {
    name: 'Lago Niassa (Metangula)',
    province: 'Niassa',
    municipality: 'Lago',
    district: 'Lago',
    lat: -12.6978,
    lng: 34.8156,
    keywords: ['metangula', 'lago niassa', 'praia lacustre', 'peixe chambo']
  }
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Retorna a lista de todas as 11 províncias de Moçambique
 */
export function getAllProvinces(): MozambiqueProvince[] {
  return MOZAMBIQUE_PROVINCES;
}

/**
 * Procura coordenadas aproximadas de uma província, cidade ou zona em Moçambique
 */
export function findMozambiqueZoneCoordinates(query: string): { lat: number; lng: number; matchedZone?: MozambiqueZone; province?: string } | null {
  if (!query || !query.trim()) return null;

  const cleanQ = normalizeText(query);

  // 1. Verificar se é o nome de uma província
  const provMatch = MOZAMBIQUE_PROVINCES.find(p => 
    normalizeText(p.name) === cleanQ || 
    normalizeText(p.shortName) === cleanQ ||
    cleanQ.includes(normalizeText(p.shortName)) ||
    normalizeText(p.capital) === cleanQ
  );
  if (provMatch) {
    return { lat: provMatch.lat, lng: provMatch.lng, province: provMatch.name };
  }

  // 2. Correspondência exata no nome da zona
  const exact = MOZAMBIQUE_ZONES.find(z => normalizeText(z.name) === cleanQ);
  if (exact) {
    return { lat: exact.lat, lng: exact.lng, matchedZone: exact, province: exact.province };
  }

  // 3. Correspondência se a query contiver o nome da zona
  const nameMatch = MOZAMBIQUE_ZONES.find(z => {
    const cleanName = normalizeText(z.name);
    return cleanQ.includes(cleanName) || cleanName.includes(cleanQ);
  });
  if (nameMatch) {
    return { lat: nameMatch.lat, lng: nameMatch.lng, matchedZone: nameMatch, province: nameMatch.province };
  }

  // 4. Correspondência em qualquer uma das palavras-chave da zona
  const keywordMatch = MOZAMBIQUE_ZONES.find(z =>
    z.keywords.some(kw => {
      const cleanKw = normalizeText(kw);
      return cleanQ.includes(cleanKw) || cleanKw.includes(cleanQ);
    })
  );
  if (keywordMatch) {
    return { lat: keywordMatch.lat, lng: keywordMatch.lng, matchedZone: keywordMatch, province: keywordMatch.province };
  }

  return null;
}
