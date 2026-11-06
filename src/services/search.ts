import { Establishment } from '../types/types';
import { SearchFilterState } from '../components/shared/SearchConsole';

// Maputo Commerce Synonym Expansion Map
const SYNONYMS: Record<string, string[]> = {
  sapatos: ['sapato', 'calçado', 'tênis', 'ténis', 'sandálias', 'botas', 'bela vista', 'sapatos', 'malas', 'vestuário', 'chinelos'],
  sapato: ['sapatos', 'calçado', 'tênis', 'ténis', 'sandálias', 'botas', 'bela vista', 'sapatos', 'malas', 'vestuário'],
  calçado: ['sapato', 'sapatos', 'tênis', 'sandálias', 'bela vista', 'sapatos a grosso', 'botas'],
  fatos: ['fato', 'fatos masculinos', 'costume', 'gravata', 'camisa formal', 'terno', 'vestuário executivo', 'moda masculina', 'fatos de homem', 'casacos'],
  fato: ['fatos', 'fatos masculinos', 'costume', 'gravata', 'camisa formal', 'terno', 'vestuário executivo', 'moda masculina'],
  meias: ['meia', 'meias e cuecas', 'peúgas', 'lingerie', 'roupa interior', 'peugas', 'meias a grosso', 'meias a retalho', 'meias infantis'],
  meia: ['meias', 'meias e cuecas', 'peúgas', 'lingerie', 'roupa interior', 'peugas'],
  capulana: ['têxtil', 'tecido', 'panos', 'moda', 'baixa têxtil', 'capulanas', 'farda', 'vestido', 'fardo', 'capulanas em fardo'],
  capulanas: ['têxtil', 'tecido', 'panos', 'moda', 'baixa têxtil', 'capulana', 'farda', 'vestido', 'fardo', 'capulanas em fardo'],
  fardo: ['grosso', 'revenda', 'fardos', 'roupa em fardo', 'fardos de roupa', 'capulanas em fardo', 'provincias'],
  fardos: ['grosso', 'revenda', 'fardo', 'roupa em fardo', 'fardos de roupa', 'capulanas em fardo'],
  grosso: ['venda a grosso', 'grosso', 'atacado', 'fardos', 'revenda', 'provincias', 'lote', 'caixas'],
  retalho: ['venda a retalho', 'retalho', 'varejo', 'unidade', 'peça única'],
  telemóvel: ['eletrónicos', 'eletrodomésticos', 'celular', 'smartphone', 'computador', 'ekonomia', 'telemóveis', 'carregador'],
  telemoveis: ['eletrónicos', 'eletrodomésticos', 'celular', 'smartphone', 'computador', 'ekonomia', 'telemóvel'],
  celular: ['telemóvel', 'telemóveis', 'eletrónicos', 'ekonomia'],
  eletrodomésticos: ['eletrónicos', 'frigorifico', 'fogão', 'televisor', 'ekonomia', 'máquina'],
  electrodomesticos: ['eletrónicos', 'frigorifico', 'fogão', 'televisor', 'ekonomia', 'máquina'],
  ferramentas: ['casa das peças', 'material elétrico', 'tintas', 'parafusos', 'peças', 'ferramenta', 'construção'],
  material: ['casa das peças', 'ferramentas', 'elétrico', 'pintura', 'obras'],
  livro: ['papelaria', 'caderno', 'livraria', 'material escolar', 'escritório'],
  papelaria: ['livros', 'caderno', 'livraria', 'material escolar', 'impressão'],
  camarão: ['frutos do mar', 'peixe', 'marisco', 'petiscos', 'costa do sol', 'bar'],
  peixe: ['frutos do mar', 'camarão', 'marisco', 'costa do sol', 'petiscos', 'choco', 'lula', 'peixe fresco', 'bacalhau'],
  cerveja: ['bar', 'kanimambo', 'lounge', 'happy hour', '2M', 'laurentina', 'bebida', 'chopp'],
  cocktail: ['bar', 'coquetel', 'lounge 21', 'bebidas', 'música ao vivo', 'caipirinha'],
  turismo: ['viagem', 'viagens', 'pacote', 'pacotes', 'passeio', 'passeios', 'roteiro', 'excursão', 'tour', 'agência de viagens', 'bilhete', 'bilhetes'],
  viagem: ['turismo', 'viagens', 'pacote', 'passeio', 'roteiro', 'excursão', 'tour', 'bilhete'],
  passeio: ['turismo', 'excursão', 'roteiro', 'tour', 'viagem', 'ponta do ouro', 'bilene', 'macaneta'],
  bilhete: ['bilhetes', 'passagem aérea', 'voo', 'reserva', 'turismo', 'viagem'],
  quarto: ['hospedagem', 'hotel', 'pousada', 'pensão', 'diária', 'suíte', 'dormir', 'quarto'],
  quartos: ['hospedagem', 'hotel', 'pousada', 'pensão', 'diária', 'suíte', 'dormir', 'quarto'],
  diária: ['hospedagem', 'hotel', 'pensão', 'quarto', 'diarias', 'dormir'],
  arroz: ['arroz', 'fardo de arroz', 'grãos', 'cereais', 'arroz 25kg', 'alimentação', 'cabazes', 'mercearia'],
  óleo: ['óleo', 'óleo alimentar', 'azeite', 'gorduras', 'mercearia', 'caixas de óleo', 'óleo motor', 'oleo motor', 'lubrificante', '5w40', '10w40', 'shell', 'castrol', 'total', 'filtros'],
  açúcar: ['açúcar', 'sacos de açúcar', 'doces', 'fardo de açúcar', 'mercearia'],
  carne: ['carne', 'vaca', 'porco', 'frango', 'açougue', 'talho', 'picanha', 'costela', 'frescos', 'bovino', 'caprino'],
  frutas: ['frutas', 'vegetais', 'hortaliças', 'frescos', 'hortifrúti', 'legumes', 'maçã', 'banana'],
  flores: ['flor', 'rosa', 'rosas', 'buquê', 'buque', 'ornamentação', 'ornamentacao', 'florista', 'floraria', 'doce amor', 'arranjos', 'eventos', 'casamentos', 'coroas', 'orquídeas'],
  flor: ['flores', 'rosa', 'rosas', 'buquê', 'buque', 'ornamentação', 'florista', 'floraria', 'doce amor'],
  rosas: ['flores', 'flor', 'rosa', 'buquê', 'buque', 'ornamentação', 'florista', 'floraria', 'doce amor'],
  rosa: ['flores', 'flor', 'rosas', 'buquê', 'buque', 'ornamentação', 'florista', 'floraria', 'doce amor'],
  buquê: ['flores', 'flor', 'rosas', 'buque', 'ornamentação', 'florista', 'floraria', 'doce amor'],
  buque: ['flores', 'flor', 'rosas', 'buquê', 'ornamentação', 'florista', 'floraria', 'doce amor'],
  ornamentação: ['flores', 'flor', 'rosas', 'buquê', 'eventos', 'casamentos', 'decoração', 'doce amor'],
  ornamentacao: ['flores', 'flor', 'rosas', 'buquê', 'eventos', 'casamentos', 'decoração', 'doce amor'],
  // Auto Parts & Componentes Automóveis
  peças: ['pecas', 'auto peças', 'peças automóveis', 'acessórios', 'reposição', 'oficina', 'mecânica', 'auto'],
  bateria: ['baterias', 'willard', 'dixon', 'moura', '12v', '70ah', '65ah', 'acumulador', 'elétrica auto'],
  baterias: ['bateria', 'willard', 'dixon', 'moura', '12v', '70ah', '65ah', 'acumulador', 'elétrica auto'],
  travões: ['travoes', 'travão', 'travao', 'pastilhas', 'calços', 'discos', 'calços de travão', 'pastilhas de travão', 'freios'],
  travoes: ['travões', 'travão', 'pastilhas', 'calços', 'discos', 'calços de travão', 'pastilhas de travão'],
  calços: ['travões', 'pastilhas', 'discos', 'freios', 'travão'],
  amortecedor: ['amortecedores', 'suspensão', 'monroe', 'kayaba', 'molas', 'braço de suspensão'],
  amortecedores: ['amortecedor', 'suspensão', 'monroe', 'kayaba', 'molas', 'braço de suspensão'],
  pneu: ['pneus', 'jantes', 'r14', 'r15', 'r16', 'r17', 'radial', 'borracharia'],
  pneus: ['pneu', 'jantes', 'r14', 'r15', 'r16', 'r17', 'radial', 'borracharia'],
  velas: ['vela', 'ignição', 'iridium', 'ngk', 'bosch', 'bobina', 'velas de ignição'],
  embraiagem: ['embreagem', 'kit embraiagem', 'disco de embraiagem', 'prensa', 'rolamento', 'luk'],
  faróis: ['farois', 'farol', 'lâmpadas', 'lampadas', 'led', 'piscas', 'ópticas', 'espelho retrovisor'],
  farois: ['faróis', 'farol', 'lâmpadas', 'lampadas', 'led', 'piscas', 'ópticas'],
  lubrificante: ['óleo motor', 'oleo motor', '5w40', '10w40', 'shell', 'castrol', 'total', 'filtros'],
  // Construção e Estaleiros
  cimento: ['limpopo', 'mozal', 'dugongo', 'cimento 42.5n', 'estaleiro', 'betonagem', 'obras'],
  chapa: ['chapas', 'chapas de zinco', 'ibr', 'canelada', 'telhas', 'coberturas'],
  chapas: ['chapa', 'chapas de zinco', 'ibr', 'canelada', 'telhas', 'coberturas'],
  varão: ['varao', 'varão de aço', 'ferro 12mm', 'armadura', 'vigas', 'aço'],
  varao: ['varão', 'varão de aço', 'ferro 12mm', 'armadura', 'vigas', 'aço'],
  brita: ['pedra', 'agregados', 'areia', 'pedreira', 'betão', 'carrada'],
  areia: ['areia grossa', 'areia vermelha', 'rio umbeluzi', 'agregados', 'carrada', 'aterro'],
  blocos: ['bloco', 'blocos de cimento', 'bloco 15cm', 'bloco 20cm', 'alvenaria', 'estaleiro'],
};

export function cleanAccents(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function matchesEstablishment(est: Establishment, queryOrFilters: string | SearchFilterState): boolean {
  if (typeof queryOrFilters === 'string') {
    const rawQ = queryOrFilters.trim();
    if (!rawQ) return true;

    const cleanQ = cleanAccents(rawQ);
    if (!cleanQ) return true;

    // Check direct name / zone / address match with accents stripped
    const cleanName = cleanAccents(est.name);
    if (cleanName.includes(cleanQ) || cleanQ.includes(cleanName)) return true;

    const cleanZone = cleanAccents(`${est.zone || ''} ${est.province || ''} ${est.address || ''} ${est.locationLandmarks || ''}`);
    if (cleanZone.includes(cleanQ)) return true;

    // Build exhaustive searchable text block including catalog products
    const catalogTokens = (est.productsCatalog || []).flatMap(p => [
      p.name,
      p.category || '',
      p.description || '',
      p.unitLabel || ''
    ]);

    const rawHaystack = [
      est.name,
      est.description,
      est.zone,
      est.province || '',
      est.city || '',
      est.district || '',
      est.address,
      est.locationLandmarks || '',
      est.category,
      est.salesType || '',
      ...(est.productsList || []),
      ...catalogTokens,
      ...est.features
    ].join(' ');

    const cleanHaystack = cleanAccents(rawHaystack);

    // 1. Direct substring in full haystack
    if (cleanHaystack.includes(cleanQ)) return true;

    // 2. Token-level matching excluding Portuguese prepositions
    const stopWords = new Set(['de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'com', 'ao', 'aos', 'por', 'ou', 'se']);
    const tokens = cleanQ.split(/\s+/).filter(t => t.length >= 2 && !stopWords.has(t));

    if (tokens.length > 0) {
      // If store name matches any significant query token (e.g. "Supermercado" or "Marítimo" or "Bar")
      const matchesAnyTokenInName = tokens.some(token => cleanName.includes(token));
      if (matchesAnyTokenInName) return true;

      // Or if all tokens are present in haystack or expanded synonyms
      const allTokensMatch = tokens.every(token => {
        if (cleanHaystack.includes(token)) return true;
        const synonymTokens = SYNONYMS[token] || [];
        return synonymTokens.some(syn => cleanHaystack.includes(cleanAccents(syn)));
      });
      if (allTokensMatch) return true;

      // If at least 2 key tokens match in the haystack
      if (tokens.length >= 2) {
        const matchedTokensCount = tokens.filter(token => {
          if (cleanHaystack.includes(token)) return true;
          const synonymTokens = SYNONYMS[token] || [];
          return synonymTokens.some(syn => cleanHaystack.includes(cleanAccents(syn)));
        }).length;
        if (matchedTokensCount >= Math.ceil(tokens.length * 0.6)) return true;
      }
    }

    // 3. Synonym expansion check on the whole query
    const synonymTokens = SYNONYMS[cleanQ] || [];
    for (const syn of synonymTokens) {
      if (cleanHaystack.includes(cleanAccents(syn))) return true;
    }

    return false;
  }

  // Object-based multi-field filtering
  const { storeName, productType, serviceSegment, zone, salesType } = queryOrFilters;

  // 1. Filter by Sales Mode (Grosso vs Retalho vs Ambos)
  if (salesType && salesType !== 'todas') {
    const estSales = est.salesType || 'ambos';
    if (salesType === 'grosso' && estSales !== 'grosso' && estSales !== 'ambos') {
      return false;
    }
    if (salesType === 'retalho' && estSales !== 'retalho' && estSales !== 'ambos') {
      return false;
    }
    if (salesType === 'ambos' && estSales !== 'ambos') {
      return false;
    }
  }

  // 2. Filter by Store Name (if provided)
  if (storeName && storeName.trim()) {
    const s = storeName.trim().toLowerCase();
    if (!est.name.toLowerCase().includes(s)) {
      return false;
    }
  }

  // 3. Filter by Product Type / Article (Can be searched ALONE without category or store name!)
  if (productType && productType.trim()) {
    const p = productType.trim().toLowerCase();
    const haystack = [
      est.name,
      est.description,
      est.salesType || '',
      ...(est.productsList || []),
      ...est.features
    ].join(' ').toLowerCase();

    let matchesProduct = haystack.includes(p);
    
    if (!matchesProduct) {
      const pTokens = p.split(/\s+/).filter(t => t.length > 2);
      if (pTokens.length > 0) {
        matchesProduct = pTokens.some(token => {
          if (haystack.includes(token)) return true;
          const synonymTokens = SYNONYMS[token] || [];
          return synonymTokens.some(syn => haystack.includes(syn));
        });
      }
    }

    if (!matchesProduct) {
      const synonymTokens = SYNONYMS[p] || [];
      for (const syn of synonymTokens) {
        if (haystack.includes(syn)) {
          matchesProduct = true;
          break;
        }
      }
    }

    if (!matchesProduct) return false;
  }

  // 4. Filter by Service Segment / Category (optional)
  if (serviceSegment && serviceSegment !== 'Todos os Segmentos' && serviceSegment !== 'Todos os Tipos' && serviceSegment !== 'Todas') {
    const seg = serviceSegment.toLowerCase();
    const haystack = [
      est.category,
      est.name,
      est.description,
      ...(est.productsList || []),
      ...est.features
    ].join(' ').toLowerCase();

    if (seg.includes('moda') || seg.includes('têxtil') || seg.includes('vestuário')) {
      if (!haystack.includes('têxtil') && !haystack.includes('moda') && !haystack.includes('capulana') && !haystack.includes('calçado') && !haystack.includes('vestuário') && !haystack.includes('fatos') && !haystack.includes('meias')) return false;
    } else if (seg.includes('eletrónicos') || seg.includes('tecnologia')) {
      if (!haystack.includes('eletrónico') && !haystack.includes('telemóvel') && !haystack.includes('eletrodoméstico') && !haystack.includes('computador')) return false;
    } else if (seg.includes('casa') || seg.includes('ferramentas')) {
      if (!haystack.includes('casa') && !haystack.includes('ferramenta') && !haystack.includes('peças') && !haystack.includes('elétrico')) return false;
    } else if (seg.includes('papelaria')) {
      if (!haystack.includes('papelaria') && !haystack.includes('escolar') && !haystack.includes('livro')) return false;
    } else if (seg.includes('bares') || seg.includes('restauração')) {
      if (est.category !== 'bar' && !haystack.includes('bar') && !haystack.includes('petiscos')) return false;
    } else if (seg.includes('hospedagens') || seg.includes('hotéis')) {
      if (est.category !== 'hospedagem' && !haystack.includes('hotel') && !haystack.includes('pensão') && !haystack.includes('quarto')) return false;
    }
  }

  // 5. Filter by Zone / Region / Province
  if (zone && zone !== 'Todas as Regiões' && zone !== 'Todas as Zonas') {
    const cleanZ = cleanAccents(zone);
    const estZone = cleanAccents(`${est.zone || ''} ${est.province || ''} ${est.city || ''} ${est.district || ''} ${est.address || ''}`);

    if (cleanZ.includes('cidade de maputo') || cleanZ === 'maputo cidade') {
      if (!estZone.includes('cidade de maputo') && !estZone.includes('maputo cidade') && !estZone.includes('baixa') && !estZone.includes('polana') && !estZone.includes('alto mae') && !estZone.includes('costa do sol') && !estZone.includes('xipamanine')) return false;
    } else if (cleanZ.includes('provincia de maputo') || cleanZ === 'maputo provincia') {
      if (!estZone.includes('provincia de maputo') && !estZone.includes('matola') && !estZone.includes('boane') && !estZone.includes('zimpeto') && !estZone.includes('tchumene') && !estZone.includes('marracuene')) return false;
    } else if (!estZone.includes(cleanZ)) {
      // Check if any significant token of the filter is matched
      const zTokens = cleanZ.split(/[\s,/]+/).filter(t => t.length > 2);
      const tokenMatch = zTokens.length > 0 && zTokens.some(t => estZone.includes(t));
      if (!tokenMatch) return false;
    }
  }

  return true;
}
