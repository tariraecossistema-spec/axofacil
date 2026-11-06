import { 
  ShoppingBag, 
  ShoppingCart, 
  UtensilsCrossed, 
  Building2, 
  Hammer, 
  Compass, 
  Truck, 
  Wrench,
  Shirt,
  Sparkles,
  Smartphone,
  BedDouble,
  Plane,
  Car,
  Package,
  Layers,
  LucideIcon
} from 'lucide-react';
import { Establishment, Category } from '../types/types';

export interface SubcategoryDefinition {
  id: string;
  slug: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface CategoryDefinition {
  id: string; // primary identifier / route slug
  slug: string;
  categoryType: Category; // matches Establishment.category
  name: string;
  shortName: string;
  headline: string;
  description: string;
  icon: LucideIcon;
  badge: string;
  accentColor: string;
  heroImage: string;
  subcategories: SubcategoryDefinition[];
}

export const CATEGORIES_DATA: CategoryDefinition[] = [
  {
    id: 'lojas',
    slug: 'lojas',
    categoryType: 'loja',
    name: 'Lojas & Comércio',
    shortName: 'Lojas & Moda',
    headline: 'Boutiques, Moda, Telemóveis & Acessórios',
    description: 'Encontre vestuário, calçado, electrónica, telemóveis, perfumes e produtos para a sua casa em Moçambique.',
    icon: ShoppingBag,
    badge: 'Retalho & Comércio Geral',
    accentColor: '#0B254B',
    heroImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'moda-calcado',
        slug: 'moda-calcado',
        name: 'Moda, Roupa & Calçado',
        description: 'Boutiques, vestidos de gala, calçado formal e desportivo, pronto-a-vestir masculino e feminino.',
        keywords: ['roupa', 'vestido', 'fato', 'camisa', 'calçado', 'sapatos', 'sapatilhas', 'ténis', 'boutique', 'jeans', 'moda']
      },
      {
        id: 'tecnologia-gadgets',
        slug: 'tecnologia-gadgets',
        name: 'Telemóveis & Tecnologia',
        description: 'Smartphones, computadores portáteis, acessórios informáticos, cabos e reparações.',
        keywords: ['telemóvel', 'smartphone', 'computador', 'laptop', 'fone', 'auricular', 'carregador', 'iphone', 'samsung', 'informática']
      },
      {
        id: 'pecas-auto',
        slug: 'pecas-auto',
        name: 'Peças Auto & Acessórios',
        description: 'Baterias, lubrificantes, filtros, suspensão, pneus e peças para viaturas ligeiras e pesadas.',
        keywords: ['peça', 'auto', 'bateria', 'óleo', 'lubrificante', 'filtro', 'pneu', 'amortecedor', 'travão', 'motor', 'hilux', 'carro']
      },
      {
        id: 'casa-decoracao',
        slug: 'casa-decoracao',
        name: 'Casa, Decoração & Electrodomésticos',
        description: 'Móveis, electrodomésticos, têxteis de casa, utensílios de cozinha e decoração.',
        keywords: ['casa', 'móvel', 'frigorífico', 'fogão', 'sofá', 'mesa', 'cama', 'cozinha', 'decoração', 'utensílios']
      },
      {
        id: 'beleza-cosmeticos',
        slug: 'beleza-cosmeticos',
        name: 'Perfumaria, Beleza & Cosméticos',
        description: 'Perfumes originais, maquilhagem, produtos de cabelo, estética e cuidados de pele.',
        keywords: ['perfume', 'cosmético', 'maquilhagem', 'cabelo', 'creme', 'estética', 'skincare', 'beleza']
      },
      {
        id: 'capulanas-tecidos',
        slug: 'capulanas-tecidos',
        name: 'Capulanas & Tecidos Tradicionais',
        description: 'Capulanas autênticas 100% algodão, tecidos regionais e alfaiataria moçambicana.',
        keywords: ['capulana', 'tecido', 'algodão', 'tradição', 'estampado', 'alfaiate', 'artesanato']
      },
      {
        id: 'flores-presentes',
        slug: 'flores-presentes',
        name: 'Florarias, Buquês & Presentes',
        description: 'Rosas frescas, buquês, cestos de presentes e arranjos florais com entrega ao domicílio.',
        keywords: ['flor', 'rosa', 'buquê', 'arranjo', 'presente', 'cesto', 'surpresa', 'flores']
      }
    ]
  },
  {
    id: 'supermercados',
    slug: 'supermercados',
    categoryType: 'supermercado',
    name: 'Supermercados & Alimentação',
    shortName: 'Supermercados',
    headline: 'Frescos, Mercearia, Talho & Bebidas',
    description: 'Abasteça a sua casa ou o seu negócio com produtos frescos, cereais, carnes e mercearia geral a grosso e a retalho.',
    icon: ShoppingCart,
    badge: 'Alimentação & Bens de Consumo',
    accentColor: '#059669',
    heroImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'mercearia-frescos',
        slug: 'mercearia-frescos',
        name: 'Mercearia & Frescos',
        description: 'Arroz, açúcar, farinhas, feijão, vegetais e frutas frescas selecionadas diariamente.',
        keywords: ['arroz', 'açúcar', 'farinha', 'feijão', 'legumes', 'frutas', 'azeite', 'óleo', 'massa', 'mercearia']
      },
      {
        id: 'talho-peixaria',
        slug: 'talho-peixaria',
        name: 'Talho, Aves & Peixaria',
        description: 'Cortes nobres de novilho, frango nacional congelado, peixe fresco da costa e mariscos.',
        keywords: ['carne', 'frango', 'peixe', 'camarão', 'novilho', 'costeleta', 'talho', 'marisco', 'congelados']
      },
      {
        id: 'bebidas-garrafeira',
        slug: 'bebidas-garrafeira',
        name: 'Bebidas, Águas & Garrafeira',
        description: 'Águas minerais, sumos 100%, refrigerantes, cervejas nacionais, vinhos e espirituosos.',
        keywords: ['água', 'sumo', 'refrigerante', 'cerveja', 'vinho', 'whisky', 'garrafeira', 'bebidas']
      },
      {
        id: 'lacticinios-padaria',
        slug: 'lacticinios-padaria',
        name: 'Lacticínios, Ovos & Padaria',
        description: 'Leite integral UHT, manteiga, queijos, iogurtes, ovos de granja e pães frescos.',
        keywords: ['leite', 'queijo', 'manteiga', 'iogurte', 'ovo', 'ovos', 'pão', 'lacticínios']
      },
      {
        id: 'higiene-limpeza',
        slug: 'higiene-limpeza',
        name: 'Higiene Pessoal & Limpeza',
        description: 'Detergentes, sabões em barra, papel higiénico, desinfectantes e produtos de higiene pessoal.',
        keywords: ['sabão', 'detergente', 'limpeza', 'desinfectante', 'champô', 'pasta de dentes', 'higiene']
      },
      {
        id: 'grossistas-armazens',
        slug: 'grossistas-armazens',
        name: 'Armazéns & Venda a Grosso',
        description: 'Compras em grande quantidade com preços especiais para cantinas, bancas e revendedores.',
        keywords: ['grosso', 'armazém', 'fardo', 'caixa', 'tonelada', 'revenda', 'atacado']
      }
    ]
  },
  {
    id: 'bares',
    slug: 'bares',
    categoryType: 'bar',
    name: 'Restaurantes, Bares & Lazer',
    shortName: 'Restaurantes & Bares',
    headline: 'Gastronomia Moçambicana, Bares & Espaços de Convivência',
    description: 'Descubra restaurantes para almoços de negócios, marisqueiras, petisqueiras, esplanadas e lounges para os seus momentos de lazer.',
    icon: UtensilsCrossed,
    badge: 'Gastronomia & Lazer',
    accentColor: '#B45309',
    heroImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'restaurantes',
        slug: 'restaurantes',
        name: 'Restaurantes & Cozinha Tradicional',
        description: 'Pratos típicos como frango à zambeziana, matapa com caranguejo, caril de camarão e cozinha internacional.',
        keywords: ['restaurante', 'almoço', 'jantar', 'matapa', 'caril', 'zambeziana', 'gastronomia', 'comida']
      },
      {
        id: 'bares-lounges',
        slug: 'bares-lounges',
        name: 'Bares & Lounges',
        description: 'Ambientes acolhedores com música ao vivo, cocktails de autor e cerveja nacional bem gelada.',
        keywords: ['bar', 'lounge', 'cocktail', 'cerveja', '2m', 'laurentina', 'noite', 'música', 'bebidas']
      },
      {
        id: 'mariscos-grelhados',
        slug: 'mariscos-grelhados',
        name: 'Marisqueiras & Grelhados',
        description: 'Camarão grelhado na brasa, lulas, lagosta e amêijoas frescas temperadas com piripíri e alho.',
        keywords: ['marisqueira', 'camarão', 'grelhado', 'lulas', 'lagosta', 'peixe grelhado', 'churrasco']
      },
      {
        id: 'cafes-pastelarias',
        slug: 'cafes-pastelarias',
        name: 'Cafés, Pastelarias & Gelatarias',
        description: 'Café expresso moído na hora, bolos, chamuças, torradas e pequeno-almoço executivo.',
        keywords: ['café', 'pastelaria', 'chamuça', 'pequeno-almoço', 'gelado', 'sobremesa', 'torta']
      },
      {
        id: 'takeaway-fastfood',
        slug: 'takeaway-fastfood',
        name: 'Take-Away & Refeições Rápidas',
        description: 'Hambúrgueres, pizzas no forno de lenha e pratos prontos a levar para casa ou escritório.',
        keywords: ['takeaway', 'pizza', 'hambúrguer', 'rápido', 'prato do dia', 'entrega de comida']
      }
    ]
  },
  {
    id: 'hospedagens',
    slug: 'hospedagens',
    categoryType: 'hospedagem',
    name: 'Hospedagem & Alojamento',
    shortName: 'Hospedagem & Hotéis',
    headline: 'Hotéis Executivos, Lodges & Casas de Hóspedes',
    description: 'Reserve estadias confortáveis para trabalho ou férias com quartos climatizados, Wi-Fi e pequeno-almoço em qualquer ponto do país.',
    icon: Building2,
    badge: 'Alojamento & Hotelaria',
    accentColor: '#4338CA',
    heroImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'hoteis-executivos',
        slug: 'hoteis-executivos',
        name: 'Hotéis Executivos & Centrais',
        description: 'Hotéis com salas de reuniões, centro de negócios, ginásio e localização privilegiada.',
        keywords: ['hotel', 'executivo', 'reunião', 'centro', 'suíte', 'negócios', 'quarto']
      },
      {
        id: 'lodges-resorts',
        slug: 'lodges-resorts',
        name: 'Lodges, Resorts & Ecoturismo',
        description: 'Refúgios paradisíacos junto à praia ou em reservas naturais para descansar com a família.',
        keywords: ['lodge', 'resort', 'praia', 'ponta do ouro', 'vilankulo', 'bazaruto', 'férias', 'piscina']
      },
      {
        id: 'pensoes-guesthouses',
        slug: 'pensoes-guesthouses',
        name: 'Pensões & Guesthouses Acessíveis',
        description: 'Estadias acolhedoras, limpas e económicas com atendimento personalizado para viajantes.',
        keywords: ['pensão', 'guesthouse', 'económico', 'diária', 'hospedagem', 'casa de hóspedes']
      },
      {
        id: 'apartamentos-villas',
        slug: 'apartamentos-villas',
        name: 'Apartamentos Mobilados & Casas de Férias',
        description: 'Apartamentos T1, T2 e moradias com cozinha equipada e total privacidade para estadias curtas ou prolongadas.',
        keywords: ['apartamento', 'mobilado', 'casa de férias', 'villa', 'kitchenette', 'arrendamento']
      }
    ]
  },
  {
    id: 'construcao',
    slug: 'construcao',
    categoryType: 'construcao',
    name: 'Material de Construção & Ferragens',
    shortName: 'Construção & Ferragens',
    headline: 'Cimento, Ferro, Chapas, Tintas & Estaleiros',
    description: 'Fornecedores de confiança para a sua obra: cimento certificado, varões de aço, agregados, brita, blocos e ferramentas.',
    icon: Hammer,
    badge: 'Obras, Construção & Ferragens',
    accentColor: '#C2410C',
    heroImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'cimento-agregados',
        slug: 'cimento-agregados',
        name: 'Cimento, Areia & Brita',
        description: 'Sacos de cimento 42.5N e 32.5N, carradas de areia grossa de rio e brita nº 1 e nº 2 para betão.',
        keywords: ['cimento', 'areia', 'brita', 'betonagem', 'carrada', 'agregados', 'obra']
      },
      {
        id: 'ferro-cobertura',
        slug: 'ferro-cobertura',
        name: 'Ferro, Aço & Coberturas',
        description: 'Varões de ferro nervurado certificados, chapas de zinco caneladas, IBR e redes estruturais.',
        keywords: ['ferro', 'aço', 'varão', 'chapa', 'zinco', 'ibr', 'cobertura', 'telhado', 'viga']
      },
      {
        id: 'blocos-alvenaria',
        slug: 'blocos-alvenaria',
        name: 'Blocos de Cimento & Alvenaria',
        description: 'Blocos industriais vibrados de 15cm e 20cm, tijolos, manilhas e pavês para pavimentação.',
        keywords: ['bloco', 'cimento', 'tijolo', 'alvenaria', 'pavê', 'manilha', 'estaleiro']
      },
      {
        id: 'ferragens-ferramentas',
        slug: 'ferragens-ferramentas',
        name: 'Ferragens, Máquinas & Ferramentas',
        description: 'Berbequins, rebarbadoras, pás, carrinhos de mão, fechaduras, dobradiças e parafusos.',
        keywords: ['ferragens', 'ferramenta', 'berbequim', 'fechadura', 'martelo', 'disco', 'máquina']
      },
      {
        id: 'tintas-acabamentos',
        slug: 'tintas-acabamentos',
        name: 'Tintas, Cerâmica & Acabamentos',
        description: 'Tintas acrílicas laváveis, primários, mosaicos cerâmicos, azulejos e loiça sanitária.',
        keywords: ['tinta', 'esmalte', 'cerâmica', 'azulejo', 'mosaico', 'sanitário', 'torneira', 'acabamento']
      },
      {
        id: 'canalizacao-eletrica',
        slug: 'canalizacao-eletrica',
        name: 'Canalização & Electricidade',
        description: 'Tubos PVC, conexões, cabos eléctricos de cobre, disjuntores, painéis e lâmpadas LED.',
        keywords: ['tubo', 'pvc', 'cano', 'cabo eléctrico', 'disjuntor', 'fio', 'lâmpada', 'electricidade']
      }
    ]
  },
  {
    id: 'turismo',
    slug: 'turismo',
    categoryType: 'turismo',
    name: 'Turismo, Safaris & Viagens',
    shortName: 'Turismo & Viagens',
    headline: 'Safaris, Pacotes de Viagem, Bilhetes & Excursões',
    description: 'Planeie a sua viagem: safaris no Parque Nacional da Gorongosa e Reserva de Maputo, pacotes de férias e bilhetes aéreos.',
    icon: Compass,
    badge: 'Turismo & Logística de Viagens',
    accentColor: '#0E7490',
    heroImage: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'safaris-fauna',
        slug: 'safaris-fauna',
        name: 'Safaris & Reservas Naturais',
        description: 'Excursões guiadas à Reserva Especial de Maputo, Gorongosa, Limpopo e safaris com veículos 4x4.',
        keywords: ['safari', 'gorongosa', 'reserva', 'elefantes', 'fauna', 'natureza', 'parque nacional', '4x4']
      },
      {
        id: 'pacotes-internacionais',
        slug: 'pacotes-internacionais',
        name: 'Pacotes Turísticos & Peregrinações',
        description: 'Roteiros internacionais completos com voo, alojamento e guias para Itália, Dubai, Portugal e África do Sul.',
        keywords: ['pacote', 'viagem', 'internacional', 'roma', 'vaticano', 'dubai', 'itália', 'peregrinação']
      },
      {
        id: 'praias-mergulho',
        slug: 'praias-mergulho',
        name: 'Praias, Ilhas & Excursões Náuticas',
        description: 'Passeios de barco para Inhaca e Ilha dos Portugueses, mergulho e estadia na Ponta do Ouro e Tofo.',
        keywords: ['praia', 'ilha', 'inhaca', 'ponta do ouro', 'tofo', 'mergulho', 'barco', 'mar']
      },
      {
        id: 'bilhetes-voos',
        slug: 'bilhetes-voos',
        name: 'Bilhetes Aéreos & Emissão de Passagens',
        description: 'Reserva e emissão de bilhetes nacionais (LAM) e internacionais (TAP, Qatar, Emirates, Airlink).',
        keywords: ['voo', 'bilhete', 'passagem', 'aéreo', 'aeroporto', 'lam', 'tap', 'emirates', 'reserva']
      },
      {
        id: 'aluguer-viaturas',
        slug: 'aluguer-viaturas',
        name: 'Aluguer de Viaturas & Transfers',
        description: 'Viaturas ligeiras, pickups 4x4 e minibus com ou sem motorista para transfers de aeroporto e viagens.',
        keywords: ['aluguer', 'carro', 'rent a car', 'transfer', 'minibus', 'aeroporto', 'transporte turístico']
      }
    ]
  },
  {
    id: 'entregadores',
    slug: 'entregadores',
    categoryType: 'entregador',
    name: 'Transporte, Estafetas & Fretes',
    shortName: 'Entregadores & Fretes',
    headline: 'Estafetas Moto-Boy, Carrinhas de Frete & Logística',
    description: 'Contrate serviços de transporte para documentos, pequenas encomendas, fretes pesados com carrinhas e mudanças.',
    icon: Truck,
    badge: 'Logística & Entregas Rápidas',
    accentColor: '#1D4ED8',
    heroImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
    subcategories: [
      {
        id: 'estafetas-expresso',
        slug: 'estafetas-expresso',
        name: 'Estafetas Moto-Boy Expresso',
        description: 'Recolha e entrega rápida de documentos, comida, medicamentos e pequenas encomendas na sua cidade.',
        keywords: ['estafeta', 'motoboy', 'mota', 'expresso', 'encomenda', 'urgente', 'documento', 'entrega rápida']
      },
      {
        id: 'fretes-camioes',
        slug: 'fretes-camioes',
        name: 'Fretes & Carrinhas de Carga',
        description: 'Carrinhas de caixa aberta (1.5t a 5t) e camiões basculantes para transporte de mercadorias e materiais.',
        keywords: ['frete', 'carrinha', 'camião', 'carga', 'transporte', 'caixa aberta', 'material']
      },
      {
        id: 'mudancas',
        slug: 'mudancas',
        name: 'Mudanças Residenciais & Comerciais',
        description: 'Serviço de empacotamento, carga, transporte e descarregamento seguro de móveis para casas e escritórios.',
        keywords: ['mudança', 'residencial', 'escritório', 'móveis', 'empacotar', 'transportar']
      },
      {
        id: 'logistica-interprovincial',
        slug: 'logistica-interprovincial',
        name: 'Logística Interprovincial de Cargas',
        description: 'Envio regular de encomendas e fretes pesados entre Maputo, Gaza, Inhambane, Sofala, Nampula e outras províncias.',
        keywords: ['interprovincial', 'província', 'beira', 'nampula', 'tete', 'chimoio', 'carga pesada', 'logística']
      }
    ]
  }
];

// Helper functions for easy lookup and matching
export function getAllCategories(): CategoryDefinition[] {
  return CATEGORIES_DATA;
}

export function getCategoryById(id: string): CategoryDefinition | undefined {
  if (!id) return undefined;
  const clean = id.toLowerCase().trim();
  return CATEGORIES_DATA.find(c => c.id === clean || c.slug === clean || c.categoryType === clean);
}

export function findCategoryBySlugOrAlias(input: string): CategoryDefinition | undefined {
  if (!input) return undefined;
  const clean = input.toLowerCase().trim();

  // Alias mappings for legacy or alternative names
  const aliasMap: Record<string, string> = {
    'loja': 'lojas',
    'pecas': 'lojas',
    'pecas_auto': 'lojas',
    'pecas-auto': 'lojas',
    'moda': 'lojas',
    'supermercado': 'supermercados',
    'mercearia': 'supermercados',
    'bar': 'bares',
    'restaurante': 'bares',
    'restaurantes': 'bares',
    'hospedagem': 'hospedagens',
    'hotel': 'hospedagens',
    'hoteis': 'hospedagens',
    'alojamento': 'hospedagens',
    'obra': 'construcao',
    'obras': 'construcao',
    'ferragens': 'construcao',
    'viagens': 'turismo',
    'safari': 'turismo',
    'voos': 'turismo',
    'fretes': 'entregadores',
    'estafeta': 'entregadores',
    'logistica': 'entregadores',
    'transporte': 'entregadores'
  };

  const targetId = aliasMap[clean] || clean;
  return CATEGORIES_DATA.find(c => c.id === targetId || c.slug === targetId || c.categoryType === targetId);
}

export function getSubcategory(categorySlug: string, subcategorySlug: string): SubcategoryDefinition | undefined {
  const cat = getCategoryById(categorySlug);
  if (!cat) return undefined;
  const cleanSub = subcategorySlug.toLowerCase().trim();
  return cat.subcategories.find(s => s.id === cleanSub || s.slug === cleanSub);
}

/**
 * Checks if an establishment matches a given subcategory.
 * Inspects segment, name, description, tags, features and products.
 */
export function matchesSubcategory(establishment: Establishment, subcategory: SubcategoryDefinition): boolean {
  if (!establishment || !subcategory) return false;
  
  // Direct segment match
  if (establishment.segment && establishment.segment.toLowerCase().includes(subcategory.slug.replace(/-/g, ' '))) {
    return true;
  }

  // Keywords search in establishment fields
  const searchableText = [
    establishment.name,
    establishment.segment || '',
    establishment.description || '',
    establishment.metaInfo || '',
    ...(establishment.features || []),
    ...(establishment.productsList || []),
    ...(establishment.productsCatalog?.map(p => `${p.name} ${p.category || ''} ${p.description || ''}`) || [])
  ].join(' ').toLowerCase();

  return subcategory.keywords.some(keyword => searchableText.includes(keyword.toLowerCase()));
}
