import React, { useState, useRef } from 'react';
import { Search, Store, Package, MapPin, Layers, X, Sparkles, ArrowRight, Tag, Boxes, Camera, Image as ImageIcon, Loader2, CheckCircle2, ShoppingBag, Eye } from 'lucide-react';

export interface SearchFilterState {
  storeName: string;
  productType: string;
  serviceSegment: string;
  zone: string;
  salesType: 'todas' | 'grosso' | 'retalho' | 'ambos';
}

interface SearchConsoleProps {
  onSearch: (filters: SearchFilterState) => void;
  initialFilters?: Partial<SearchFilterState>;
  compact?: boolean;
  mode?: 'lojas' | 'supermercados' | 'bares' | 'hospedagens' | 'construcao' | 'geral' | 'pecas_auto' | 'turismo';
  segmentFilter?: string;
}

export default function SearchConsole({ onSearch, initialFilters, compact = false, mode = 'lojas', segmentFilter }: SearchConsoleProps) {
  const getInitialMode = () => {
    if (mode === 'pecas_auto' || segmentFilter === 'pecas_auto') return 'pecas_auto';
    return mode || 'lojas';
  };

  const [currentMode, setCurrentMode] = useState<'lojas' | 'supermercados' | 'bares' | 'hospedagens' | 'construcao' | 'geral' | 'pecas_auto' | 'turismo'>(getInitialMode);
  const [storeName, setStoreName] = useState(initialFilters?.storeName || '');
  const [productType, setProductType] = useState(initialFilters?.productType || '');
  const [serviceSegment, setServiceSegment] = useState(initialFilters?.serviceSegment || 'Todos os Segmentos');
  const [zone, setZone] = useState(initialFilters?.zone || 'Todas as Regiões');
  const [salesType, setSalesType] = useState<'todas' | 'grosso' | 'retalho' | 'ambos'>(initialFilters?.salesType || 'todas');

  // Synchronize mode when parent changes (e.g. navigation)
  React.useEffect(() => {
    if (mode === 'pecas_auto' || segmentFilter === 'pecas_auto') {
      setCurrentMode('pecas_auto');
    } else if (mode) {
      setCurrentMode(mode);
    }
  }, [mode, segmentFilter]);

  // Image Search States
  const [imageScanning, setImageScanning] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [detectedResult, setDetectedResult] = useState<{ query: string; category: string; confidence: number; suggestedStores: string[] } | null>(null);
  const [showImageSearchModal, setShowImageSearchModal] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const isAutoPecas = currentMode === 'pecas_auto' || (currentMode === 'lojas' && segmentFilter === 'pecas_auto');
  const isSuper = currentMode === 'supermercados';
  const isBar = currentMode === 'bares';
  const isHosp = currentMode === 'hospedagens';
  const isConstrucao = currentMode === 'construcao';
  const isTurismo = currentMode === 'turismo';

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImagePreview(url);
    setImageScanning(true);
    setShowImageSearchModal(true);

    const fileNameLower = file.name.toLowerCase();
    
    let query = 'Artigo';
    let category = 'Geral';

    if (fileNameLower.includes('bateria') || fileNameLower.includes('pneu') || fileNameLower.includes('oleo') || fileNameLower.includes('óleo') || fileNameLower.includes('travao') || fileNameLower.includes('travão') || fileNameLower.includes('amortecedor') || fileNameLower.includes('filtro') || isAutoPecas) {
      query = 'peças';
      category = 'Auto Peças & Acessórios';
    } else if (fileNameLower.includes('cimento') || fileNameLower.includes('chapa') || fileNameLower.includes('varao') || fileNameLower.includes('tijolo') || fileNameLower.includes('brita') || fileNameLower.includes('areia') || isConstrucao) {
      query = 'cimento';
      category = 'Material de Construção';
    } else if (fileNameLower.includes('arroz') || fileNameLower.includes('comida') || isSuper) {
      query = 'arroz';
      category = 'Supermercados & Alimentação';
    } else if (fileNameLower.includes('cerveja') || fileNameLower.includes('2m') || isBar) {
      query = 'cerveja';
      category = 'Bebidas & Restauração';
    } else if (fileNameLower.includes('fato') || fileNameLower.includes('camisa') || fileNameLower.includes('roupa') || fileNameLower.includes('sapato')) {
      query = 'vestuário';
      category = 'Moda & Calçado';
    } else if (fileNameLower.includes('capulana')) {
      query = 'capulana';
      category = 'Têxtil & Capulanas';
    } else if (fileNameLower.includes('peixe') || fileNameLower.includes('marisco')) {
      query = 'marisco';
      category = 'Pescado & Mariscos';
    } else if (fileNameLower.includes('telemovel') || fileNameLower.includes('celular') || fileNameLower.includes('phone')) {
      query = 'telemóvel';
      category = 'Eletrónicos & Comunicações';
    }

    setDetectedResult({
      query,
      category,
      confidence: 100,
      suggestedStores: []
    });
    setImageScanning(false);
  };

  const applyImageSearchResult = (queryText: string) => {
    setProductType(queryText);
    onSearch({
      storeName,
      productType: queryText,
      serviceSegment,
      zone,
      salesType
    });
    setShowImageSearchModal(false);
  };

  const popularProducts = isAutoPecas ? [
    { label: '🛢️ Óleos de Motor & Filtros', query: 'óleo motor' },
    { label: '🔋 Baterias 12V Willard & Dixon', query: 'baterias' },
    { label: '🛑 Pastilhas & Calços de Travão', query: 'travões' },
    { label: '🚘 Amortecedores & Suspensão', query: 'amortecedores' },
    { label: '🛞 Pneus R14 a R17 & Jantes', query: 'pneus' },
    { label: '⚡ Velas de Ignição & Elétrica', query: 'velas' },
    { label: '⚙️ Kits de Embraiagem & Discos', query: 'embraiagem' },
    { label: '💡 Faróis, Lâmpadas LED & Piscas', query: 'faróis' },
    { label: '📦 Peças a Grosso para Oficinas', query: 'grosso' },
  ] : isSuper ? [
    { label: '🌾 Arroz 25kg & Fardos', query: 'arroz' },
    { label: '🌻 Óleo & Açúcar', query: 'óleo' },
    { label: '🥩 Carnes & Aves Frescas', query: 'carne' },
    { label: '🐟 Peixe & Marisco Fresco', query: 'peixe' },
    { label: '🥛 Lacticínios & Queijos', query: 'lacticínios' },
    { label: '🍍 Frutas & Hortaliças', query: 'frutas' },
    { label: '🍞 Padaria & Pão Quente', query: 'pão' },
    { label: '📦 Caixas & Venda a Grosso', query: 'fardos' },
  ] : isBar ? [
    { label: '🍺 Cerveja 2M Gelada', query: '2M' },
    { label: '🍸 Cocktails & Caipirinha', query: 'caipirinha' },
    { label: '🍢 Petiscos & Mariscos', query: 'petiscos' },
    { label: '🎷 Música ao Vivo', query: 'música ao vivo' },
    { label: '🌊 Vista para o Mar', query: 'vista para o mar' },
    { label: '🍹 Happy Hour', query: 'happy hour' },
    { label: '🍷 Vinhos & Bebidas', query: 'vinho' },
    { label: '📅 Reserva de Mesa', query: 'reserva' },
  ] : isHosp ? [
    { label: '🏨 Suíte Executiva', query: 'suíte' },
    { label: '🛏️ Quarto Duplo', query: 'quarto' },
    { label: '☕ Pequeno-Almoço', query: 'pequeno-almoço' },
    { label: '🌊 Vista para o Mar', query: 'vista para o mar' },
    { label: '🏛️ Perto da Baixa', query: 'baixa' },
    { label: '💰 Diárias Económicas', query: 'económica' },
    { label: '❄️ Ar Condicionado', query: 'ar condicionado' },
    { label: '🚗 Estacionamento', query: 'estacionamento' },
  ] : isConstrucao ? [
    { label: '🧱 Cimento Limpopo / Mozal', query: 'cimento' },
    { label: '🛖 Chapas de Zinco & Caneladas', query: 'chapa' },
    { label: '⛓️ Varão de Aço & Ferro 12mm', query: 'varão' },
    { label: '🪨 Areia Grossa & Brita (Carrada)', query: 'areia' },
    { label: '🧱 Blocos de Cimento (15cm/20cm)', query: 'blocos' },
    { label: '🛠️ Ferragens & Ferramentas', query: 'ferramentas' },
    { label: '🎨 Tintas & Revestimentos', query: 'tintas' },
    { label: '📦 Lotes Grosso para Estaleiros', query: 'grosso' },
  ] : isTurismo ? [
    { label: '✈️ Pacote Itália & Vaticano (7 dias)', query: 'itália' },
    { label: '🏖️ Ponta do Ouro & Safari', query: 'ponta do ouro' },
    { label: '🌊 Bilene & Macaneta (Fim de Semana)', query: 'bilene' },
    { label: '⛪ Peregrinação Religiosa ao Vaticano', query: 'vaticano' },
    { label: '🎫 Bilhetes Aéreos & Vistos', query: 'bilhete' },
    { label: '🚚 Logística & Carga Entre Lojas', query: 'logística' },
    { label: '🚐 Aluguer Minibus 30 Lugares', query: 'minibus' },
    { label: '🛣️ Rota Fixa Baixa ↔ Matola', query: 'rota fixa' },
  ] : [
    { label: '👗 Capulanas em Fardo & Tecidos', query: 'capulana' },
    { label: '👟 Sapatos, Ténis & Sandálias', query: 'sapatos' },
    { label: '👔 Fatos & Costumes Masculinos', query: 'fatos' },
    { label: '🧦 Meias & Lingerie', query: 'meias' },
    { label: '🌹 Flores & Rosas (Doce Amor)', query: 'flores' },
    { label: '📱 Telemóveis & Acessórios', query: 'telemóvel' },
    { label: '📚 Papelaria & Livros', query: 'papelaria' },
    { label: '📺 Eletrodomésticos & Fogões', query: 'eletrodomésticos' },
    { label: '📦 Venda a Grosso & Fardos', query: 'grosso' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      storeName,
      productType,
      serviceSegment,
      zone,
      salesType
    });
  };

  const handleChipClick = (productQuery: string) => {
    let newProduct = productType;
    let newSales = salesType;

    if (productQuery === 'grosso' || productQuery === 'fardos') {
      newSales = 'grosso';
      if (productQuery === 'fardos') newProduct = 'fardos';
    } else {
      newProduct = productQuery;
    }

    setProductType(newProduct);
    setSalesType(newSales);

    onSearch({
      storeName,
      productType: newProduct,
      serviceSegment,
      zone,
      salesType: newSales
    });
  };

  const handleClear = () => {
    setStoreName('');
    setProductType('');
    setServiceSegment('Todos os Segmentos');
    setZone('Todas as Regiões');
    setSalesType('todas');
    onSearch({
      storeName: '',
      productType: '',
      serviceSegment: 'Todos os Segmentos',
      zone: 'Todas as Regiões',
      salesType: 'todas'
    });
  };

  const isFiltered = storeName || productType || serviceSegment !== 'Todos os Segmentos' || zone !== 'Todas as Regiões' || salesType !== 'todas';

  // Dynamic Theme Styling based on Category
  const themeBorder = isTurismo
    ? 'border-cyan-700/30'
    : isSuper 
    ? 'border-emerald-700/30' 
    : isBar 
      ? 'border-terracotta/30' 
      : isHosp 
        ? 'border-coral-brand/30' 
        : 'border-ink/15';

  const themeIconBg = isTurismo
    ? 'bg-cyan-100 text-cyan-900'
    : isSuper 
    ? 'bg-emerald-100 text-emerald-800' 
    : isBar 
      ? 'bg-terracotta/10 text-terracotta' 
      : isHosp 
        ? 'bg-coral-brand/10 text-coral-brand' 
        : 'bg-terracotta/10 text-terracotta';

  const themeLabelColor = isTurismo
    ? 'text-cyan-900'
    : isSuper 
    ? 'text-emerald-800' 
    : isBar 
      ? 'text-terracotta' 
      : isHosp 
        ? 'text-coral-brand' 
        : 'text-terracotta';

  const themeInputBorder = isTurismo
    ? 'border-cyan-600/40 focus:border-cyan-700'
    : isSuper 
    ? 'border-emerald-600/40 focus:border-emerald-700' 
    : isBar 
      ? 'border-terracotta/30 focus:border-terracotta' 
      : isHosp 
        ? 'border-coral-brand/30 focus:border-coral-brand' 
        : 'border-terracotta/30 focus:border-terracotta';

  const themeButtonBg = isTurismo
    ? 'bg-gradient-to-r from-cyan-900 to-indigo-900 text-white'
    : isSuper 
    ? 'bg-gradient-to-r from-emerald-800 to-teal-700 text-white' 
    : isBar 
      ? 'bg-gradient-to-r from-terracotta to-amber-700 text-white' 
      : isHosp 
        ? 'bg-gradient-to-r from-coral-brand to-rose-700 text-white' 
        : 'bg-gradient-to-r from-terracotta to-coral-brand text-white';

  const themeChipActive = isTurismo
    ? 'bg-cyan-900 text-white border-cyan-900 shadow-xs'
    : isSuper 
    ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs' 
    : isBar 
      ? 'bg-terracotta text-white border-terracotta shadow-xs' 
      : isHosp 
        ? 'bg-coral-brand text-white border-coral-brand shadow-xs' 
        : 'bg-terracotta text-white border-terracotta shadow-xs';

  return (
    <div className={`w-full ${compact ? 'max-w-4xl' : 'max-w-5xl'} mx-auto relative space-y-4`}>
      
      {/* Main Big Search Box (Exact Alibaba Visual Size & Format) */}
      <form onSubmit={handleSearchSubmit} className="space-y-4">
        
        {/* Main Box Container with Orange Border */}
        <div className="bg-white border-2 border-amber-500 rounded-3xl p-4 md:p-5 shadow-lg relative flex flex-col justify-between gap-4 transition-all focus-within:shadow-xl focus-within:border-orange-600">
          
          {/* Top Line: Large Free-form Text Input */}
          <div className="w-full">
            <input
              type="text"
              placeholder={
                isAutoPecas
                  ? 'O que procura? (ex: pastilhas de travão, filtros de óleo, amortecedores, baterias 12V, pneus, faróis, velas...)'
                  : isSuper 
                    ? 'O que procura? (ex: arroz 25kg, óleo alimentar, carnes frescas, peixe e marisco, leite, pão...)' 
                    : isBar 
                      ? 'O que procura? (ex: cerveja 2M gelada, Laurentina, cocktails, caipirinhas, mariscos, esplanada...)' 
                      : isHosp 
                        ? 'O que procura? (ex: suíte executiva, quarto duplo, diárias económicas, vista mar, pequeno-almoço...)' 
                        : isConstrucao
                          ? 'O que procura? (ex: cimento Limpopo 42.5N, chapa de zinco, varão de aço, areia, brita, blocos, tintas...)'
                          : 'O que procura? (ex: roupas femininas, vestidos, fatos masculinos, sapatos, meias, capulanas em fardo, telemóveis...)'
              }
              value={productType}
              onChange={(e) => setProductType(e.target.value)}
              className="w-full bg-transparent text-base md:text-lg font-medium text-ink placeholder:text-ink/40 outline-none border-none p-1"
            />
          </div>

          {/* Bottom Line inside the Search Box */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
            
            {/* Bottom Left: Camera Image Search Trigger */}
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-2xs"
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>Pesquisar com imagem</span>
            </button>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Bottom Right: Bright Orange Pill Pesquisar Button */}
            <button
              type="submit"
              className="py-2.5 px-7 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-sm rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2 shrink-0"
            >
              <Search className="w-4 h-4" />
              <span>Pesquisar</span>
            </button>
          </div>
        </div>

        {/* Secondary Filters Drawer / Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-sand-2/20 p-3 rounded-2xl border border-ink/10">
          
          {/* Store Name Input */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-deep uppercase tracking-wider flex items-center gap-1">
              <Store className="w-3.5 h-3.5 text-indigo-brand" />
              <span>{isTurismo ? 'Agência / Empresa' : 'Nome da Loja (Opcional)'}</span>
            </label>
            <input
              type="text"
              placeholder={isTurismo ? 'Axofácil! Turismo & Logística...' : 'Ex: Baixa Têxtil, VIP, Shoprite...'}
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full bg-white border border-ink/15 rounded-xl py-2 px-3 text-xs font-semibold text-ink placeholder:text-ink/40 outline-none focus:border-indigo-brand transition-all"
            />
          </div>

          {/* Sales / Booking / Tourism Type */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-deep uppercase tracking-wider flex items-center gap-1">
              <Boxes className="w-3.5 h-3.5 text-indigo-brand" />
              <span>{isTurismo ? 'Tipo de Serviço' : 'Modalidade'}</span>
            </label>
            <select
              value={salesType}
              onChange={(e) => setSalesType(e.target.value as any)}
              className="w-full bg-white border border-ink/15 rounded-xl py-2 px-3 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              {isTurismo ? (
                <>
                  <option value="todas">✈️ Todos os Serviços & Pacotes</option>
                  <option value="grosso">🌍 Pacotes Internacionais & Peregrinações</option>
                  <option value="retalho">🚌 Roteiros Nacionais & Praias</option>
                  <option value="ambos">🚚 Logística & Fretes Comerciais</option>
                </>
              ) : (
                <>
                  <option value="todas">🛍️ Grosso & Retalho</option>
                  <option value="grosso">📦 Venda a Grosso (Atacado)</option>
                  <option value="retalho">🛒 Venda a Retalho (Unitário)</option>
                </>
              )}
            </select>
          </div>

          {/* Region / Zone */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-indigo-deep uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Região / Província em Moçambique</span>
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value)}
              className="w-full bg-white border border-ink/15 rounded-xl py-2 px-3 text-xs font-semibold text-ink outline-none cursor-pointer"
            >
              <option value="Todas as Regiões">🇲🇿 Todo o País (Moçambique)</option>
              <option value="Cidade de Maputo">🏙️ Cidade de Maputo</option>
              <option value="Matola">🏭 Matola / Província de Maputo</option>
              <option value="Sofala">🌊 Sofala (Cidade da Beira / Dondo)</option>
              <option value="Nampula">🌾 Nampula (Cidade de Nampula / Nacala)</option>
              <option value="Tete">🌉 Tete (Cidade de Tete / Moatize)</option>
              <option value="Zambézia">🌴 Zambézia (Quelimane)</option>
              <option value="Cabo Delgado">⚓ Cabo Delgado (Pemba)</option>
              <option value="Niassa">⛰️ Niassa (Lichinga)</option>
              <option value="Manica">🌄 Manica (Chimoio)</option>
              <option value="Inhambane">🥥 Inhambane (Inhambane / Maxixe)</option>
              <option value="Gaza">🏖️ Gaza (Xai-Xai)</option>
              <option value="Polana / Sommerchield">📍 Polana / Sommerchield</option>
              <option value="Baixa / Alto Maé">📍 Baixa / Alto Maé</option>
              <option value="Zimpeto">📍 Zimpeto</option>
            </select>
          </div>
        </div>

        {/* Quick Product Chips + Clear Search */}
        <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1 scrollbar-none text-xs px-1">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-ink/50 uppercase shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3" /> Sugestões:
            </span>
            {popularProducts.map((p, idx) => (
              <button
                key={`${p.query}-${idx}`}
                type="button"
                onClick={() => handleChipClick(p.query)}
                className={`py-1 px-3 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
                  productType.toLowerCase() === p.query.toLowerCase()
                    ? 'bg-amber-500 text-white border-amber-500 shadow-2xs'
                    : 'bg-white text-ink/80 border-ink/12 hover:border-amber-400'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-bold text-terracotta hover:underline flex items-center gap-1 cursor-pointer bg-terracotta/5 py-1 px-2.5 rounded-lg border border-terracotta/20 shrink-0 ml-auto"
            >
              <X className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </form>

      {/* IMAGE SEARCH & VISUAL RECOGNITION MODAL */}
      {showImageSearchModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-ink/15 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-ink/10 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-900 rounded-xl">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-indigo-deep">Pesquisa por Fotografia</h3>
                  <p className="text-xs text-ink/60">Identifique o artigo para pesquisar no directório de Moçambique</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowImageSearchModal(false)}
                className="p-1.5 hover:bg-sand-2 text-ink/60 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {detectedResult && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
                  {imagePreview && (
                    <img src={imagePreview} alt="Fotografia" className="w-20 h-20 rounded-lg object-cover border border-amber-300 shrink-0" />
                  )}
                  <div className="space-y-1.5 flex-1">
                    <span className="text-[10px] font-bold text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md uppercase">
                      {detectedResult.category}
                    </span>

                    <div>
                      <label className="block text-[11px] font-bold text-indigo-deep mb-1">
                        Termo de pesquisa para este artigo:
                      </label>
                      <input 
                        type="text"
                        value={detectedResult.query}
                        onChange={(e) => setDetectedResult({ ...detectedResult, query: e.target.value })}
                        className="w-full bg-white border border-ink/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-ink outline-none focus:border-indigo-brand"
                        placeholder="Ex: cimento, arroz, bateria, fato..."
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-ink/10">
                  <button
                    type="button"
                    onClick={() => setShowImageSearchModal(false)}
                    className="py-2.5 px-4 bg-sand-2 text-ink hover:bg-sand-2/70 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => applyImageSearchResult(detectedResult.query)}
                    className="py-2.5 px-5 bg-indigo-deep hover:bg-indigo-brand text-paper text-xs font-bold rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2"
                  >
                    <span>Pesquisar Lojas com este Artigo</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
