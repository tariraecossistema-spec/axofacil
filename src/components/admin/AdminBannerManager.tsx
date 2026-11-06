import React, { useState, useEffect, useRef } from 'react';
import { 
  Image as ImageIcon, Upload, Link as LinkIcon, Plus, Trash2, 
  RotateCcw, Save, Check, Sparkles, Eye, ArrowUp, ArrowDown,
  Layout, Compass, ShoppingBag, Wrench, Store, Wine, BedDouble, 
  Hammer, Truck, Layers, Info, CheckCircle2
} from 'lucide-react';
import { 
  loadAllBannerConfigs, 
  saveBannerConfig, 
  resetBannerConfig, 
  BannerMenuConfig, 
  BannerSlide, 
  DEFAULT_BANNER_CONFIGS 
} from "../../services/bannerConfig";
import { uploadFileToStorage as uploadToImgBB } from "../../services/supabase";
import { notify, confirmDialog } from "../../services/dialogs";

interface AdminBannerManagerProps {
  initialMenu?: string;
}

const MENU_ITEMS = [
  { id: 'landing', label: 'Landing Page (Início)', icon: Layout, color: 'text-indigo-600' },
  { id: 'turismo', label: 'Turismo e Logística', icon: Compass, color: 'text-cyan-600' },
  { id: 'lojas', label: 'Lojas & Moda', icon: ShoppingBag, color: 'text-emerald-600' },
  { id: 'pecas_auto', label: 'Peças Auto & Mecânica', icon: Wrench, color: 'text-blue-600' },
  { id: 'supermercados', label: 'Supermercados & Frescos', icon: Store, color: 'text-amber-600' },
  { id: 'bares', label: 'Bares & Restaurantes', icon: Wine, color: 'text-rose-600' },
  { id: 'hospedagens', label: 'Hospedagens & Hotéis', icon: BedDouble, color: 'text-sky-600' },
  { id: 'construcao', label: 'Material de Construção', icon: Hammer, color: 'text-orange-600' },
  { id: 'entregadores', label: 'Entregadores & Fretes', icon: Truck, color: 'text-teal-600' },
  { id: 'segmentos', label: 'Escolher Segmento', icon: Layers, color: 'text-purple-600' },
];

export default function AdminBannerManager({ initialMenu = 'landing' }: AdminBannerManagerProps) {
  const [selectedMenuKey, setSelectedMenuKey] = useState<string>(initialMenu);
  const [allConfigs, setAllConfigs] = useState<Record<string, BannerMenuConfig>>(() => loadAllBannerConfigs());
  const [activeConfig, setActiveConfig] = useState<BannerMenuConfig>(() => {
    const loaded = loadAllBannerConfigs();
    return loaded[initialMenu] || DEFAULT_BANNER_CONFIGS[initialMenu] || DEFAULT_BANNER_CONFIGS.landing;
  });

  // Local draft state for current menu
  const [title, setTitle] = useState(activeConfig.title);
  const [tag, setTag] = useState(activeConfig.tag);
  const [slogan, setSlogan] = useState(activeConfig.slogan);
  const [slides, setSlides] = useState<BannerSlide[]>(activeConfig.slides || []);

  // Add slide state
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const [newSlideCaption, setNewSlideCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [activePreviewSlide, setActivePreviewSlide] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when switching menu
  const handleSelectMenu = async (menuKey: string) => {
    if (hasUnsavedChanges) {
      const ok = await confirmDialog('Existem alterações não guardadas no banner atual. Deseja mudar de menu mesmo assim?', {
        title: 'Alterações não guardadas',
        confirmLabel: 'Mudar de Menu',
        cancelLabel: 'Ficar no Banner',
        danger: false
      });
      if (!ok) return;
    }
    const currentAll = loadAllBannerConfigs();
    const config = currentAll[menuKey] || DEFAULT_BANNER_CONFIGS[menuKey] || DEFAULT_BANNER_CONFIGS.landing;
    setSelectedMenuKey(menuKey);
    setActiveConfig(config);
    setTitle(config.title);
    setTag(config.tag);
    setSlogan(config.slogan);
    setSlides(config.slides || []);
    setActivePreviewSlide(0);
    setHasUnsavedChanges(false);
  };

  // Direct File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Por favor selecione um ficheiro de imagem válido (JPG, PNG, WebP).', 'warning');
      return;
    }

    setIsUploading(true);
    try {
      const uploadedUrl = await uploadToImgBB(file);
      if (uploadedUrl) {
        const newSlide: BannerSlide = {
          url: uploadedUrl,
          caption: newSlideCaption.trim() || `${title} · Axofácil! Moçambique`
        };
        setSlides(prev => [...prev, newSlide]);
        setNewSlideCaption('');
        setHasUnsavedChanges(true);
        notify('Imagem carregada com sucesso para o banner!', 'success');
      }
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      notify('Erro ao carregar imagem. Tente inserir o link direto.', 'error');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add via Direct URL
  const handleAddSlideByUrl = () => {
    if (!newSlideUrl.trim()) {
      notify('Por favor insira um link/URL de imagem válido.', 'warning');
      return;
    }
    const newSlide: BannerSlide = {
      url: newSlideUrl.trim(),
      caption: newSlideCaption.trim() || `${title} · Axofácil! Moçambique`
    };
    setSlides(prev => [...prev, newSlide]);
    setNewSlideUrl('');
    setNewSlideCaption('');
    setHasUnsavedChanges(true);
    notify('Foto adicionada à rotação de banners!', 'success');
  };

  // Remove slide
  const handleRemoveSlide = (index: number) => {
    if (slides.length <= 1) {
      notify('O banner deve ter pelo menos uma imagem.', 'warning');
      return;
    }
    const updated = slides.filter((_, idx) => idx !== index);
    setSlides(updated);
    if (activePreviewSlide >= updated.length) {
      setActivePreviewSlide(0);
    }
    setHasUnsavedChanges(true);
  };

  // Move slide
  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= slides.length) return;
    const updated = [...slides];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setSlides(updated);
    setHasUnsavedChanges(true);
  };

  // Update caption
  const handleCaptionChange = (index: number, caption: string) => {
    const updated = [...slides];
    updated[index] = { ...updated[index], caption };
    setSlides(updated);
    setHasUnsavedChanges(true);
  };

  // Save changes
  const handleSave = () => {
    if (!title.trim()) {
      notify('O título do banner não pode estar vazio.', 'warning');
      return;
    }
    if (slides.length === 0) {
      notify('Adicione pelo menos uma imagem ao banner.', 'warning');
      return;
    }

    const updatedConfig: BannerMenuConfig = {
      ...activeConfig,
      menuKey: selectedMenuKey,
      title: title.trim().toUpperCase(),
      tag: tag.trim().toUpperCase(),
      slogan: slogan.trim(),
      slides: slides
    };

    saveBannerConfig(selectedMenuKey, updatedConfig);
    
    // Update local state
    const currentAll = loadAllBannerConfigs();
    currentAll[selectedMenuKey] = updatedConfig;
    setAllConfigs(currentAll);
    setActiveConfig(updatedConfig);
    setHasUnsavedChanges(false);

    notify(`Banner do menu "${activeConfig.menuLabel}" guardado com sucesso!`, 'success');
  };

  // Reset to default
  const handleReset = async () => {
    const ok = await confirmDialog(`Deseja restaurar o banner padrão original de "${activeConfig.menuLabel}"?`, {
      title: 'Restaurar Banner Original',
      confirmLabel: 'Sim, Restaurar',
      cancelLabel: 'Cancelar',
      danger: true
    });
    if (!ok) return;

    resetBannerConfig(selectedMenuKey);
    const defaultConf = DEFAULT_BANNER_CONFIGS[selectedMenuKey] || DEFAULT_BANNER_CONFIGS.landing;
    setTitle(defaultConf.title);
    setTag(defaultConf.tag);
    setSlogan(defaultConf.slogan);
    setSlides(defaultConf.slides);
    setActivePreviewSlide(0);
    setHasUnsavedChanges(false);
    notify('Banner restaurado para o padrão original.', 'success');
  };

  // Cycle preview slide every 5 seconds
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setActivePreviewSlide(prev => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Banner Control Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Gestor Central de Banners dos Menus</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-white">
            Personalização do Hero Banner por Menu
          </h2>
          <p className="text-sm text-white/70 max-w-2xl mt-1">
            Altere os títulos, etiquetas, slogans e as fotos rotativas de cada página (Lojas, Turismo, Peças Auto, Supermercados, Bares, Hotéis, Construção e Entregadores) por upload direto ou links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 transition-all flex items-center gap-2 cursor-pointer"
            title="Restaurar valores de fábrica deste menu"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </button>
          
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#0B254B] hover:bg-[#061833] text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-blue-950/20 font-black border border-blue-400/40"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Alterações</span>
          </button>
        </div>
      </div>

      {/* Menu Selector Tabs */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block px-3 pt-1 pb-2">
          Selecione o Menu / Página para Editar o Banner:
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {MENU_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = selectedMenuKey === item.id;
            return (
              <button
                key={`banner-menu-${item.id}-${idx}`}
                onClick={() => handleSelectMenu(item.id)}
                className={`p-3 rounded-xl text-left font-sans text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-[#0B254B] text-white border-[#0B254B] shadow-md ring-2 ring-blue-400/40'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200/80'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/10 text-white' : 'bg-white text-slate-600 shadow-xs'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Two-Column Editor Layout: Form & Slides (Left), Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Form Settings & Image Manager */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Text Settings Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Layout className="w-5 h-5 text-indigo-600" />
                <span>Textos & Identidade do Banner ({activeConfig.menuLabel})</span>
              </h3>
              {hasUnsavedChanges && (
                <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                  Alterações não guardadas
                </span>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Título Principal do Banner (Ex: AXOFÁCIL!, TURISMO E LOGÍSTICA, LOJAS)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="ex: TURISMO E LOGÍSTICA"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition-all uppercase"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Este é o texto grande que substitui a palavra &quot;Axofácil&quot; quando o utilizador está neste menu.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Etiqueta / Badge Superior (Ex: MOÇAMBIQUE, MAPUTO)
                  </label>
                  <input
                    type="text"
                    value={tag}
                    onChange={(e) => {
                      setTag(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    placeholder="ex: MOÇAMBIQUE"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Menu Ativo
                  </label>
                  <div className="px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-600">
                    {activeConfig.menuLabel} ({selectedMenuKey})
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Slogan / Subtítulo do Banner
                </label>
                <textarea
                  rows={2}
                  value={slogan}
                  onChange={(e) => {
                    setSlogan(e.target.value);
                    setHasUnsavedChanges(true);
                  }}
                  placeholder="ex: Bilhetes de Viagens Aéreas, Pacotes Turísticos, Safaris & Logística Express"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-indigo-600 outline-none transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* Add Slide & Image Management Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#0B254B]" />
                <span>Fotos do Banner ({slides.length} {slides.length === 1 ? 'Slide' : 'Slides'})</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Upload direto de arquivos ou links HTTPS
              </span>
            </div>

            {/* Add New Slide Controls */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                <span>Adicionar Nova Foto ao Banner</span>
              </span>

              {/* Upload or URL Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Method 1: Direct File Upload */}
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                    id="banner-file-input"
                  />
                  <label
                    htmlFor="banner-file-input"
                    className={`w-full h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all cursor-pointer ${
                      isUploading
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700 animate-pulse'
                        : 'border-slate-300 hover:border-indigo-600 bg-white hover:bg-indigo-50/50 text-slate-700'
                    }`}
                  >
                    <Upload className="w-5 h-5 text-indigo-600" />
                    <span>{isUploading ? 'A processar upload...' : 'Upload Direto de Foto'}</span>
                    <span className="text-[10px] text-slate-400 font-normal">PNG, JPG, WebP</span>
                  </label>
                </div>

                {/* Method 2: Insert Image Link */}
                <div className="flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="relative">
                      <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="url"
                        value={newSlideUrl}
                        onChange={(e) => setNewSlideUrl(e.target.value)}
                        placeholder="https://exemplo.com/foto.jpg"
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 outline-none"
                      />
                    </div>
                    <input
                      type="text"
                      value={newSlideCaption}
                      onChange={(e) => setNewSlideCaption(e.target.value)}
                      placeholder="Legenda da foto (opcional)"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:border-indigo-600 outline-none"
                    />
                  </div>
                  <button
                    onClick={handleAddSlideByUrl}
                    disabled={!newSlideUrl.trim()}
                    className="w-full mt-2 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Inserir por Link</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of current slides */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                Fotos em Rotação (Arraste ou ordene para ajustar prioridade):
              </span>
              
              {slides.map((slide, index) => (
                <div 
                  key={`slide-${index}-${slide.url.slice(-10)}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-3.5 ${
                    activePreviewSlide === index 
                      ? 'bg-indigo-50/50 border-indigo-200 shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Thumbnail */}
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    <img
                      src={slide.url}
                      alt={slide.caption || `Slide ${index + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Caption edit */}
                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="text"
                      value={slide.caption || ''}
                      onChange={(e) => handleCaptionChange(index, e.target.value)}
                      placeholder="Legenda da foto..."
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:bg-white focus:border-indigo-600 outline-none"
                    />
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5 max-w-[280px]">
                      {slide.url}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 self-end sm:self-center">
                    <button
                      onClick={() => handleMoveSlide(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSlide(index, 'down')}
                      disabled={index === slides.length - 1}
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveSlide(index)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Remover foto do banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Banner Preview */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Pré-visualização em Tempo Real</span>
              </span>
              <span className="text-[11px] font-bold text-slate-400">
                Menu: {activeConfig.menuLabel}
              </span>
            </div>

            {/* Simulated Banner Container */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-900/10 min-h-[380px] bg-slate-950 flex flex-col justify-between p-6 sm:p-8 text-white">
              
              {/* Background Image Slide with Fade */}
              {slides[activePreviewSlide] && (
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-700 scale-105"
                  style={{ backgroundImage: `url(${slides[activePreviewSlide]?.url})` }}
                />
              )}
              
              {/* Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30 backdrop-blur-[0.5px]" />
              <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/60 pointer-events-none" />

              {/* Top Banner Bar Simulation */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-[10px] font-black uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  <span>{tag || 'MOÇAMBIQUE'}</span>
                </div>
                <div className="text-[10px] text-white/70 font-mono bg-black/40 px-2 py-0.5 rounded-full">
                  Slide {activePreviewSlide + 1} de {slides.length}
                </div>
              </div>

              {/* Center/Bottom Banner Text */}
              <div className="relative z-10 space-y-2 mt-auto">
                <h1 className="font-serif font-black tracking-tight text-white uppercase text-2xl sm:text-3xl lg:text-4xl drop-shadow-md leading-none">
                  {title || 'AXOFÁCIL!'}
                </h1>
                <p className="text-xs text-white/90 font-medium max-w-sm line-clamp-2 drop-shadow-sm">
                  {slogan || 'O Maior Portal de Comércio, Turismo, Hospedagem, Peças & Serviços'}
                </p>

                {slides[activePreviewSlide]?.caption && (
                  <div className="pt-2">
                    <span className="text-[10px] bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-md text-blue-200 font-semibold inline-block border border-white/10">
                      📸 {slides[activePreviewSlide]?.caption}
                    </span>
                  </div>
                )}

                {/* Simulated Action Button */}
                <div className="pt-4 flex items-center gap-2">
                  <div className="px-4 py-2 rounded-xl bg-[#0B254B] text-white font-bold text-xs shadow-md border border-blue-400/40">
                    Consulta Online
                  </div>
                  {selectedMenuKey === 'landing' && (
                    <div className="px-3 py-2 rounded-xl bg-white/10 text-white font-medium text-xs border border-white/20">
                      Ver Diretório
                    </div>
                  )}
                </div>
              </div>

              {/* Carousel Indicators */}
              <div className="relative z-10 flex justify-center gap-1.5 pt-4">
                {slides.map((_, sIdx) => (
                  <button
                    key={`prev-dot-${sIdx}`}
                    onClick={() => setActivePreviewSlide(sIdx)}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      activePreviewSlide === sIdx ? 'w-6 bg-blue-400' : 'w-2 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Quick Tips Box */}
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block">Como funciona a troca de banner:</span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Quando o cliente clica no menu (ex: <strong>Turismo e Logística</strong>, <strong>Lojas</strong>, <strong>Entregadores</strong>), o portal altera instantaneamente o título principal, a etiqueta e as fotos de fundo para a configuração guardada aqui.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
