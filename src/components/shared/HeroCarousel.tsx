import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Settings, Plus, Trash2, ArrowUp, ArrowDown, Upload, Link as LinkIcon, RotateCcw, X, Check, Image as ImageIcon } from 'lucide-react';
import { UserProfile } from "../../types/types";
import { confirmDialog, notify } from "../../services/dialogs";

export interface CarouselSlide {
  id: string;
  image: string;
  title: string;
  subtitle?: string;
  badge?: string;
  tag?: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  carouselKey?: string;
  autoSlideInterval?: number;
  heightClass?: string;
  compactMode?: boolean;
  currentUser?: UserProfile | null;
  isAdmin?: boolean;
}

export default function HeroCarousel({
  slides: initialSlides,
  carouselKey = 'general',
  autoSlideInterval = 4000,
  heightClass = "h-[260px] sm:h-[320px]",
  compactMode = false,
  currentUser,
  isAdmin: isAdminProp
}: HeroCarouselProps) {
  const [slides, setSlides] = useState<CarouselSlide[]>(initialSlides);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  // Determine if user has admin privileges
  const isUserAdmin = isAdminProp || 
    currentUser?.role === 'admin' || 
    localStorage.getItem('axofacil_admin_mode') === 'true';

  // Load custom slides from localStorage if available
  useEffect(() => {
    const storageKey = `axofacil_carousel_${carouselKey}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSlides(parsed);
        }
      } catch (err) {
        console.error('Erro ao carregar slides salvos:', err);
      }
    } else {
      setSlides(initialSlides);
    }
  }, [carouselKey, initialSlides]);

  // Auto-slide effect
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [slides.length, autoSlideInterval]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  // State for Slide Editing Modal
  const [editingSlides, setEditingSlides] = useState<CarouselSlide[]>([]);
  const [newImageInput, setNewImageInput] = useState('');
  const [newTitleInput, setNewTitleInput] = useState('');
  const [newSubtitleInput, setNewSubtitleInput] = useState('');
  const [newBadgeInput, setNewBadgeInput] = useState('');

  const handleOpenEditor = () => {
    setEditingSlides([...slides]);
    setIsEditorOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          const newSlide: CarouselSlide = {
            id: 'slide_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            image: resultUrl,
            title: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            subtitle: 'Imagem / GIF enviado pelo Administrador',
            badge: 'Nova Capa'
          };
          setEditingSlides((prev) => [...prev, newSlide]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleAddLinkSlide = () => {
    if (!newImageInput.trim()) {
      notify('Por favor insira um link de imagem ou GIF válido (ex: https://.../imagem.gif)', 'error');
      return;
    }
    const newSlide: CarouselSlide = {
      id: 'slide_' + Date.now(),
      image: newImageInput.trim(),
      title: newTitleInput.trim() || 'Destaque de Produtos',
      subtitle: newSubtitleInput.trim() || 'Galeria e promoções em destaque no portal',
      badge: newBadgeInput.trim() || 'Destaque'
    };
    setEditingSlides((prev) => [...prev, newSlide]);
    setNewImageInput('');
    setNewTitleInput('');
    setNewSubtitleInput('');
    setNewBadgeInput('');
  };

  const handleRemoveSlide = (index: number) => {
    if (editingSlides.length <= 1) {
      notify('O carrossel precisa de ter pelo menos 1 imagem.', 'error');
      return;
    }
    setEditingSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveSlide = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= editingSlides.length) return;
    const updated = [...editingSlides];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setEditingSlides(updated);
  };

  const handleSaveSlides = () => {
    if (editingSlides.length === 0) {
      notify('Por favor adicione pelo menos 1 imagem ao carrossel.', 'error');
      return;
    }
    setSlides(editingSlides);
    localStorage.setItem(`axofacil_carousel_${carouselKey}`, JSON.stringify(editingSlides));
    setIsEditorOpen(false);
    setCurrentIndex(0);
    notify('Capa do carrossel atualizada com sucesso!');
  };

  const handleResetToDefault = async () => {
    const ok = await confirmDialog('Deseja restaurar as imagens originais da capa?');
    if (ok) {
      localStorage.removeItem(`axofacil_carousel_${carouselKey}`);
      setSlides(initialSlides);
      setEditingSlides(initialSlides);
      setIsEditorOpen(false);
      setCurrentIndex(0);
    }
  };

  if (!slides || slides.length === 0) return null;

  return (
    <>
      <div className={`relative rounded-2xl overflow-hidden shadow-lg border border-white/20 group ${heightClass}`}>
        
        {/* Admin Floating Edit Button */}
        {isUserAdmin && (
          <button
            type="button"
            onClick={handleOpenEditor}
            className="absolute top-3 right-3 z-40 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 px-3 rounded-xl shadow-lg border border-white/30 flex items-center gap-1.5 cursor-pointer backdrop-blur-xs transition-transform hover:scale-105"
            title="Administrador: Clique para editar/adicionar fotos e GIFs animados desta capa"
          >
            <Settings className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Editar Capa (Admin)</span>
          </button>
        )}

        {/* Background Images with Fade Transition */}
        {slides.map((slide, idx) => (
          <div
            key={`hero-slide-${slide.id || 'slide'}-${idx}`}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="w-full h-full object-cover transform scale-105 transition-transform duration-10000 ease-linear"
            />
            {/* High Contrast Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/20 to-transparent" />

            {/* Slide Text Content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white z-20 space-y-1.5">
              {slide.badge && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[10px] sm:text-xs font-bold py-0.5 px-2.5 rounded-full uppercase tracking-wider shadow-sm">
                  <Sparkles className="w-3 h-3" />
                  {slide.badge}
                </span>
              )}
              <h4 className="font-serif font-bold text-lg sm:text-2xl text-white drop-shadow-md leading-tight">
                {slide.title}
              </h4>
              {slide.subtitle && (
                <p className="text-xs sm:text-sm text-paper/90 drop-shadow-sm font-medium line-clamp-2">
                  {slide.subtitle}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Navigation Arrows */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-xs transition-all cursor-pointer opacity-80 group-hover:opacity-100"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-xs transition-all cursor-pointer opacity-80 group-hover:opacity-100"
              aria-label="Próximo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-3 right-4 z-30 flex items-center gap-1.5">
              {slides.map((_, i) => (
                <button
                  key={`hero-dot-${i}`}
                  type="button"
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    i === currentIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/60 hover:bg-white'
                  }`}
                  aria-label={`Ir para slide ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* ADMIN CAROUSEL SLIDE EDITOR MODAL */}
      {isEditorOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-indigo-deep/20">
            
            {/* Modal Header */}
            <div className="bg-indigo-deep text-white p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta flex items-center justify-center text-white shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg leading-tight">Configurar Imagens da Capa (Carrossel Animado)</h3>
                  <p className="text-xs text-paper/70">Adicione links de imagens/GIFs ou faça o upload de ficheiros do computador.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditorOpen(false)}
                className="p-2 text-paper/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              
              {/* Upload & Link Add Box */}
              <div className="bg-sand-2/40 border border-ink/10 rounded-2xl p-4 space-y-4">
                <h4 className="font-sans font-bold text-sm text-indigo-deep flex items-center gap-2">
                  <Plus className="w-4 h-4 text-terracotta" />
                  <span>Adicionar Novas Imagens / GIFs em Animação</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* File Upload Option */}
                  <label className="border-2 border-dashed border-terracotta/40 hover:border-terracotta bg-white hover:bg-terracotta/5 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all group">
                    <Upload className="w-8 h-8 text-terracotta mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold text-indigo-deep">Carregar Ficheiros (Upload)</span>
                    <span className="text-[10px] text-ink/50 mt-0.5">Selecione fotos ou GIFs do dispositivo</span>
                    <input
                      type="file"
                      accept="image/*,.gif"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  {/* URL Link Option Form */}
                  <div className="bg-white p-3 rounded-2xl border border-ink/10 space-y-2 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-indigo-deep flex items-center gap-1">
                        <LinkIcon className="w-3.5 h-3.5 text-indigo-brand" />
                        <span>Ou Inserir Link / URL da Imagem</span>
                      </div>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/imagem.gif ou photo.jpg"
                        value={newImageInput}
                        onChange={(e) => setNewImageInput(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-ink/15 outline-none focus:border-terracotta"
                      />
                      <input
                        type="text"
                        placeholder="Título da capa (Ex: Promoção de Frutas)"
                        value={newTitleInput}
                        onChange={(e) => setNewTitleInput(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-ink/15 outline-none focus:border-terracotta"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleAddLinkSlide}
                      className="btn bg-indigo-deep text-white hover:bg-indigo-brand text-xs font-bold py-2 rounded-xl w-full flex items-center justify-center gap-1 cursor-pointer mt-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Adicionar Link ao Carrossel</span>
                    </button>
                  </div>

                </div>
              </div>

              {/* Current Slides List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-sans font-bold text-sm text-indigo-deep">
                    Imagens Atuais em Rotação ({editingSlides.length})
                  </h4>
                  <span className="text-[11px] text-ink/50">Arraste ou reordene conforme preferir</span>
                </div>

                <div className="space-y-3">
                  {editingSlides.map((slide, idx) => (
                    <div key={`edit-slide-${slide.id || 'slide'}-${idx}`} className="bg-white border border-ink/12 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3 shadow-xs">
                      
                      {/* Image Preview */}
                      <div className="w-full sm:w-28 h-20 bg-slate-900 rounded-xl overflow-hidden shrink-0 relative">
                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-mono px-1.5 py-0.5 rounded">
                          #{idx + 1}
                        </span>
                      </div>

                      {/* Inputs for Title and Badge */}
                      <div className="flex-1 min-w-0 space-y-1.5 w-full">
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditingSlides((prev) => prev.map((s, i) => i === idx ? { ...s, title: val } : s));
                          }}
                          placeholder="Título do Slide"
                          className="w-full text-xs font-bold text-indigo-deep p-1.5 rounded-lg border border-ink/10 outline-none focus:border-terracotta"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={slide.subtitle || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingSlides((prev) => prev.map((s, i) => i === idx ? { ...s, subtitle: val } : s));
                            }}
                            placeholder="Subtítulo descritivo"
                            className="text-[11px] text-ink/80 p-1.5 rounded-lg border border-ink/10 outline-none focus:border-terracotta"
                          />
                          <input
                            type="text"
                            value={slide.badge || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditingSlides((prev) => prev.map((s, i) => i === idx ? { ...s, badge: val } : s));
                            }}
                            placeholder="Etiqueta / Badge"
                            className="text-[11px] font-bold text-terracotta p-1.5 rounded-lg border border-ink/10 outline-none focus:border-terracotta"
                          />
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1.5 rounded-lg border border-ink/10 hover:bg-sand-2 text-ink/70 disabled:opacity-30 cursor-pointer"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveSlide(idx, 'down')}
                          disabled={idx === editingSlides.length - 1}
                          className="p-1.5 rounded-lg border border-ink/10 hover:bg-sand-2 text-ink/70 disabled:opacity-30 cursor-pointer"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSlide(idx)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer ml-1"
                          title="Eliminar esta imagem"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="bg-sand-2/40 border-t border-ink/10 p-4 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs font-bold text-ink/60 hover:text-red-600 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Originais</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="btn py-2 px-4 rounded-xl text-xs font-semibold text-ink/70 hover:bg-sand-2 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveSlides}
                  className="btn bg-terracotta hover:bg-terracotta/90 text-white text-xs font-bold py-2.5 px-5 rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Alterações da Capa</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

