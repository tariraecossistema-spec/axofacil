import React, { useState } from 'react';
import { UserProfile, isAuthorizedStoreStaffOrAdmin } from "../../types/types";
import { 
  MapPin, User, UserPlus, LogOut, LayoutDashboard, Menu, X, 
  ShoppingBag, ShieldCheck, CreditCard, Store, ShoppingCart, 
  Beer, Building2, Truck, Compass, Hammer, Wrench, Sparkles, 
  Phone, Globe, Search, ChevronRight, Send, Plane, Flame,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabaseSignOut } from "../../services/supabase";
import HelpCenterModal from "../modals/HelpCenterModal";

interface HeaderProps {
  activePage: string;
  segmentFilter?: string | null;
  setActivePage: (page: any) => void;
  onOpenAuth?: (tab: 'login' | 'criar') => void;
  onSelectSegment?: (targetPage: any, filter?: string) => void;
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  canGoBack?: boolean;
  canGoForward?: boolean;
  onGoBack?: () => void;
  onGoForward?: () => void;
  onGoHome?: () => void;
  currentTitle?: string;
  cartCount?: number;
  onOpenCart?: () => void;
  onOpenPurchases?: () => void;
  onOpenPaymentManager?: () => void;
  onOpenInquiry?: () => void;
}

export default function Header({ 
  activePage, 
  segmentFilter,
  setActivePage, 
  onOpenAuth,
  onSelectSegment,
  currentUser, 
  setCurrentUser,
  canGoBack = false,
  canGoForward = false,
  onGoBack,
  onGoForward,
  onGoHome,
  currentTitle,
  cartCount = 0,
  onOpenCart,
  onOpenPurchases,
  onOpenPaymentManager,
  onOpenInquiry
}: HeaderProps) {

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [helpModalOpen, setHelpModalOpen] = useState(false);
  const [inquiryModalOpen, setInquiryModalOpen] = useState(false);
  const [inquiryForm, setInquiryForm] = useState({
    name: '',
    phone: '',
    service: 'Turismo & Logística',
    message: ''
  });
  const [inquirySent, setInquirySent] = useState(false);

  const handleLogout = async () => {
    try {
      await supabaseSignOut();
    } catch (err) {
      console.warn('Signout note:', err);
    }
    setCurrentUser(null);
    localStorage.removeItem('axofacil_user');
    localStorage.removeItem('axofacil_admin_unlocked');
    setActivePage('home');
  };

  const getRoleInfo = (role?: string) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          shortLabel: 'Admin',
          icon: ShieldCheck,
          badgeClass: 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800',
          cardBg: 'bg-slate-50 border-slate-200'
        };
      case 'loja':
        return {
          label: 'Loja de Retalho e Moda',
          shortLabel: 'Retalho & Moda',
          icon: Store,
          badgeClass: 'bg-blue-50 text-[#0B254B] border-blue-200 hover:bg-blue-100',
          cardBg: 'bg-blue-50/50 border-blue-200'
        };
      case 'supermercado':
        return {
          label: 'Supermercados Frescos',
          shortLabel: 'Supermercado',
          icon: ShoppingCart,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
          cardBg: 'bg-slate-50 border-slate-200'
        };
      case 'bar':
        return {
          label: 'Bar e Lounge Bar',
          shortLabel: 'Bar & Lounge',
          icon: Beer,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
          cardBg: 'bg-slate-50 border-slate-200'
        };
      case 'hospedagem':
      case 'hotel':
        return {
          label: 'Hospedagem e Hotéis',
          shortLabel: 'Hospedagem',
          icon: Building2,
          badgeClass: 'bg-blue-50 text-[#0B254B] border-blue-200 hover:bg-blue-100',
          cardBg: 'bg-blue-50/50 border-blue-200'
        };
      case 'construcao':
        return {
          label: 'Material de Construção',
          shortLabel: 'Construção',
          icon: Hammer,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
          cardBg: 'bg-slate-50 border-slate-200'
        };
      case 'pecas_auto':
        return {
          label: 'Peças',
          shortLabel: 'Peças',
          icon: Wrench,
          badgeClass: 'bg-blue-50 text-[#0B254B] border-blue-200 hover:bg-blue-100',
          cardBg: 'bg-blue-50/50 border-blue-200'
        };
      case 'turismo':
        return {
          label: 'Turismo e Safaris',
          shortLabel: 'Turismo',
          icon: Compass,
          badgeClass: 'bg-blue-50 text-[#0B254B] border-blue-200 hover:bg-blue-100',
          cardBg: 'bg-blue-50/50 border-blue-200'
        };
      case 'entregador':
        return {
          label: 'Logística, Fretes e Transporte',
          shortLabel: 'Logística',
          icon: Truck,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
          cardBg: 'bg-slate-50 border-slate-200'
        };
      case 'cliente':
      default:
        return {
          label: 'Cliente',
          shortLabel: 'Cliente',
          icon: User,
          badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200',
          cardBg: 'bg-slate-50 border-slate-200'
        };
    }
  };

  const currentRoleInfo = getRoleInfo(currentUser?.role);
  const CurrentRoleIcon = currentRoleInfo.icon;

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setInquiryModalOpen(false);
    }, 2500);
  };

  const triggerInquiry = () => {
    if (onOpenInquiry) {
      onOpenInquiry();
    } else {
      setInquiryModalOpen(true);
    }
  };

  // Curated service navigation links in clear Mozambican Portuguese.
  const serviceLinks = [
    { 
      id: 'lojas', 
      page: 'lojas', 
      label: 'Lojas & Moda',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('lojas', undefined);
        } else {
          setActivePage('lojas');
        }
      }
    },
    { 
      id: 'pecas', 
      page: 'lojas', 
      label: 'Peças Auto',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('lojas', 'pecas_auto');
        } else {
          setActivePage('lojas');
        }
      }
    },
    { 
      id: 'supermercados', 
      page: 'supermercados', 
      label: 'Supermercados',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('supermercados', undefined);
        } else {
          setActivePage('supermercados');
        }
      }
    },
    { 
      id: 'bares', 
      page: 'bares', 
      label: 'Restaurantes & Bares',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('bares', undefined);
        } else {
          setActivePage('bares');
        }
      }
    },
    { 
      id: 'hospedagens', 
      page: 'hospedagens', 
      label: 'Hospedagem & Hotéis',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('hospedagens', undefined);
        } else {
          setActivePage('hospedagens');
        }
      }
    },
    { 
      id: 'construcao', 
      page: 'construcao', 
      label: 'Construção & Ferragens',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('construcao', undefined);
        } else {
          setActivePage('construcao');
        }
      }
    },
    { 
      id: 'turismo', 
      page: 'turismo', 
      label: 'Turismo & Viagens',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('turismo', undefined);
        } else {
          setActivePage('turismo');
        }
      }
    },
    { 
      id: 'entregadores', 
      page: 'entregadores', 
      label: 'Entregadores & Fretes',
      action: () => {
        if (onSelectSegment) {
          onSelectSegment('entregadores', undefined);
        } else {
          setActivePage('entregadores');
        }
      }
    },
  ];

  const isNavActive = (item: { id: string; page: string }) => {
    if (item.id === 'pecas') {
      return activePage === 'lojas' && segmentFilter === 'pecas_auto';
    }
    if (item.id === 'lojas') {
      return activePage === 'lojas' && segmentFilter !== 'pecas_auto';
    }
    if (item.id === 'about' || item.id === 'sobre') {
      return activePage === 'sobre';
    }
    return activePage === item.page;
  };

  return (
    <>
      {/* Top Navbar in AXOFACIL Clean Minimalist Style with comfortable height & high legibility */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs transition-all w-full">
        <div className="w-full max-w-[1600px] mx-auto px-2 sm:px-3 lg:px-4 xl:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-1.5 lg:gap-2 xl:gap-3">
          
          {/* LADO ESQUERDO: Brand Logo AXOFACIL + Menu INÍCIO + Menus dos SERVIÇOS */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
            {/* Mobile Menu Button */}
            <button 
              onClick={() => setDrawerOpen(true)}
              className="lg:hidden p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Abrir Menu Completo"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5 text-slate-800" />
            </button>

            {/* Brand Logo: AXOFACIL */}
            <div 
              onClick={() => onGoHome ? onGoHome() : setActivePage('home')} 
              className="flex items-center gap-1 cursor-pointer select-none group mr-0.5 sm:mr-1"
              title="Página Inicial - AXOFÁCIL! Moçambique"
            >
              <span className="text-[#0B254B] font-black text-xl sm:text-2xl tracking-tight font-sans">
                AXOFÁCIL!
              </span>
            </div>

            {/* Menu INÍCIO: Puxado para a esquerda, bem próximo do ícone Axofácil */}
            <button
              id="nav-btn-home"
              onClick={() => {
                if (onGoHome) onGoHome();
                else setActivePage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hidden lg:inline-flex items-center relative px-1.5 py-0.5 rounded-md transition-all cursor-pointer uppercase text-center shrink-0 whitespace-nowrap group text-[9px] xl:text-[9.5px] 2xl:text-[10px] ${
                activePage === 'home' 
                  ? 'text-[#0B254B] font-black' 
                  : 'text-slate-600 hover:text-[#0B254B] font-bold hover:bg-slate-50/90'
              }`}
              title="Página Inicial"
            >
              <span className="relative z-10">INÍCIO</span>
              {activePage === 'home' && (
                <span className="absolute -bottom-0.5 left-0.5 right-0.5 h-[2px] rounded-full bg-[#0B254B] transition-all" />
              )}
              {activePage !== 'home' && (
                <span className="absolute -bottom-0.5 left-1/2 right-1/2 h-[1px] rounded-full bg-[#0B254B]/30 transition-all duration-300 group-hover:left-0.5 group-hover:right-0.5 opacity-0 group-hover:opacity-100" />
              )}
            </button>

            {/* Separador vertical discreto entre Início e Serviços */}
            <div 
              aria-hidden="true" 
              className="hidden lg:block h-3.5 w-[1px] bg-slate-200 rounded-full mx-0.5 shrink-0 self-center"
            />

            {/* Menus dos Serviços com tipografia ligeiramente reduzida para criar maior respiração e espaço central aberto */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-0.5 2xl:gap-1 text-[8.5px] xl:text-[9px] 2xl:text-[9.5px] font-bold tracking-tight font-sans whitespace-nowrap py-0.5 min-w-0">
              {serviceLinks.map((item, idx) => {
                const isActive = isNavActive(item);
                return (
                  <button
                    key={`nav-service-${item.id}-${idx}`}
                    id={`nav-btn-${item.id}`}
                    onClick={() => {
                      if (item.action) {
                        item.action();
                      } else {
                        setActivePage(item.page);
                      }
                    }}
                    className={`relative px-1 xl:px-1.5 py-0.5 rounded-md transition-all cursor-pointer uppercase text-center shrink-0 whitespace-nowrap group ${
                      isActive 
                        ? 'text-[#0B254B] font-black' 
                        : 'text-slate-600 hover:text-[#0B254B] font-bold hover:bg-slate-50/90'
                    }`}
                  >
                    <span className="relative z-10">{item.label}</span>
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-0.5 right-0.5 h-[2px] rounded-full bg-[#0B254B] transition-all" />
                    )}
                    {!isActive && (
                      <span className="absolute -bottom-0.5 left-1/2 right-1/2 h-[1px] rounded-full bg-[#0B254B]/30 transition-all duration-300 group-hover:left-0.5 group-hover:right-0.5 opacity-0 group-hover:opacity-100" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* CENTRO: Espaço aberto generoso entre os menus de serviços e os menus da direita */}
          <div className="hidden lg:flex flex-1 min-w-[20px] xl:min-w-[36px]" aria-hidden="true" />

          {/* LADO DIREITO: 1º SOBRE, 2º CENTRAL DE AJUDA, seguido de Carrinho e Conta */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0 ml-auto z-10">
            {/* 1. Menu SOBRE (antes da Central de Ajuda) */}
            <button
              id="nav-btn-about"
              onClick={() => {
                setActivePage('sobre');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hidden lg:inline-flex items-center relative px-1.5 xl:px-2 py-0.5 rounded-md transition-all cursor-pointer uppercase text-center shrink-0 whitespace-nowrap group text-[9px] xl:text-[9.5px] 2xl:text-[10px] ${
                activePage === 'sobre' 
                  ? 'text-[#0B254B] font-black' 
                  : 'text-slate-600 hover:text-[#0B254B] font-bold hover:bg-slate-50/90'
              }`}
              title="Sobre a Plataforma & Tarira Studio"
            >
              <span className="relative z-10">SOBRE</span>
              {activePage === 'sobre' && (
                <span className="absolute -bottom-0.5 left-0.5 right-0.5 h-[2px] rounded-full bg-[#0B254B] transition-all" />
              )}
              {activePage !== 'sobre' && (
                <span className="absolute -bottom-0.5 left-1/2 right-1/2 h-[1px] rounded-full bg-[#0B254B]/30 transition-all duration-300 group-hover:left-0.5 group-hover:right-0.5 opacity-0 group-hover:opacity-100" />
              )}
            </button>

            {/* 2. Menu CENTRAL DE AJUDA (depois do menu Sobre) */}
            <button
              id="nav-btn-central-ajuda"
              onClick={() => setHelpModalOpen(true)}
              className="hidden lg:inline-flex items-center gap-1 px-1.5 xl:px-2 py-1 rounded-md transition-all cursor-pointer uppercase text-center shrink-0 whitespace-nowrap text-[9px] xl:text-[9.5px] 2xl:text-[10px] font-bold text-slate-700 hover:text-[#0B254B] hover:bg-slate-100/90 border border-slate-200/90 hover:border-slate-300 shadow-2xs group"
              title="Central de Ajuda: Como Funciona o Directório, FAQ e Contactos"
            >
              <HelpCircle className="w-3.5 h-3.5 text-[#0B254B] group-hover:scale-110 transition-transform shrink-0" />
              <span>CENTRAL DE AJUDA</span>
            </button>

            {/* Separador vertical discreto antes dos botões de conta / carrinho */}
            <div 
              aria-hidden="true" 
              className="hidden lg:block h-3.5 w-[1px] bg-slate-200 rounded-full mx-0.5 shrink-0 self-center"
            />
            {/* Cart Button - Available for customers, visitors and staff */}
            {onOpenCart && (
              <button
                onClick={onOpenCart}
                className="relative p-1.5 text-slate-700 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-slate-200 shadow-2xs shrink-0"
                title="Minha Carrinha de Compras e Pedidos"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#0B254B] text-white font-bold text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center shadow-xs">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* User Account / Profile or Always-Visible Entrar & Criar */}
            {currentUser ? (
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Profile Role & Name Button */}
                <button 
                  onClick={() => {
                    if (currentUser.role === 'admin') setActivePage('admin');
                    else setActivePage('dashboard');
                  }}
                  className={`inline-flex items-center gap-1 py-1 px-1.5 sm:px-2 rounded-lg border text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs hover:shadow-xs shrink-0 ${currentRoleInfo.badgeClass}`}
                  title={`Perfil: ${currentRoleInfo.label} — Aceder ao Painel`}
                >
                  <CurrentRoleIcon className="w-3.5 h-3.5 shrink-0" />
                  <div className="flex items-center gap-0.5 text-left">
                    <span className="hidden xl:inline text-[9px] font-bold uppercase opacity-75">
                      [{currentRoleInfo.shortLabel}]
                    </span>
                    <span className="truncate max-w-[70px] sm:max-w-[95px] font-bold">
                      {currentUser.storeName || currentUser.displayName || currentUser.name.split(' ')[0]}
                    </span>
                  </div>
                </button>

                {/* Explicit "Sair" (Logout) Button */}
                <button 
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1 py-1 px-1.5 sm:px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-950 border border-rose-200 hover:border-rose-300 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer shadow-2xs active:scale-95 shrink-0"
                  title="Sair do Perfil / Encerrar Sessão"
                >
                  <LogOut className="w-3 h-3 text-rose-600 shrink-0" />
                  <span className="inline">Sair</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth('login');
                    else setActivePage('auth');
                  }} 
                  className="inline-flex items-center gap-1 py-1 px-1.5 sm:px-2 bg-white text-[#0B254B] hover:bg-slate-50 font-bold text-[10.5px] rounded-lg border-2 border-[#0B254B] transition-colors cursor-pointer shrink-0"
                  title="Entrar na conta"
                >
                  <User className="w-3 h-3 text-[#0B254B]" />
                  <span>Entrar</span>
                </button>
                <button 
                  onClick={() => {
                    if (onOpenAuth) onOpenAuth('criar');
                    else setActivePage('auth');
                  }} 
                  className="inline-flex items-center gap-1 py-1 px-1.5 sm:px-2 bg-[#0B254B] hover:bg-[#0B254B] text-white font-bold text-[10.5px] rounded-lg shadow-xs hover:shadow-sm transition-all cursor-pointer shrink-0"
                  title="Criar nova conta grátis"
                >
                  <UserPlus className="w-3 h-3 text-white" />
                  <span>Criar</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-55"
          />
        )}
      </AnimatePresence>

      <div className={`fixed top-0 right-0 h-full w-[85%] max-w-[340px] bg-white shadow-2xl z-60 p-6 flex flex-col justify-between transition-transform duration-300 transform ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-5">
            <div className="flex items-center gap-1 font-sans">
              <span className="text-[#0B254B] font-black text-2xl tracking-tight">AXOFÁCIL!</span>
            </div>
            <button 
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex flex-col gap-1 text-sm font-semibold text-slate-700">
            {/* Dedicated Promoções Highlight in Mobile Drawer */}
            <button
              id="nav-link-mobile-promocoes"
              onClick={() => {
                if (onSelectSegment) {
                  onSelectSegment('promocoes', undefined);
                } else {
                  setActivePage('promocoes');
                }
                setDrawerOpen(false);
              }}
              className="w-full text-left py-2.5 px-3 mb-1.5 rounded-xl bg-blue-50 border border-blue-200 text-[#0B254B] font-extrabold uppercase tracking-wide flex items-center justify-between shadow-2xs hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#0B254B] animate-pulse" />
                <span>PROMOÇÕES & DESTAQUES</span>
              </div>
              <span className="bg-[#0B254B] text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                OFERTAS
              </span>
            </button>

            {/* Início no Mobile */}
            <button
              id="nav-link-mobile-home"
              onClick={() => {
                if (onGoHome) onGoHome();
                else setActivePage('home');
                setDrawerOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between uppercase transition-all ${
                activePage === 'home'
                  ? 'bg-blue-50 text-[#0B254B] font-black border-l-4 border-[#0B254B] shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700 font-semibold'
              }`}
            >
              <span>INÍCIO</span>
              <ChevronRight className={`w-4 h-4 ${activePage === 'home' ? 'text-[#0B254B]' : 'text-slate-400'}`} />
            </button>

            {/* Divisória Sectores & Serviços */}
            <div className="my-2 pt-2 border-t border-slate-200 px-3 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Sectores & Serviços
              </span>
              <span className="h-px bg-slate-200 flex-1 ml-3" />
            </div>

            {serviceLinks.map((item, idx) => {
              const isActive = isNavActive(item);
              return (
                <button
                  key={`nav-link-mobile-${item.id}-${idx}`}
                  id={`nav-link-mobile-${item.id}`}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      setActivePage(item.page);
                    }
                    setDrawerOpen(false);
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between uppercase transition-all relative overflow-hidden ${
                    isActive 
                      ? 'bg-blue-50 text-[#0B254B] font-black border-l-4 border-[#0B254B] shadow-xs' 
                      : 'hover:bg-slate-50 text-slate-700 font-semibold'
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#0B254B]' : 'text-slate-400'}`} />
                </button>
              );
            })}

            {/* Divisória Apoio & Informações */}
            <div className="my-2 pt-2 border-t border-slate-200 px-3 flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Apoio & Informações
              </span>
              <span className="h-px bg-slate-200 flex-1 ml-3" />
            </div>

            {/* Sobre no Mobile (antes da Central de Ajuda) */}
            <button
              id="nav-link-mobile-sobre"
              onClick={() => {
                setActivePage('sobre');
                setDrawerOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between uppercase transition-all ${
                activePage === 'sobre'
                  ? 'bg-blue-50 text-[#0B254B] font-black border-l-4 border-[#0B254B] shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700 font-semibold'
              }`}
            >
              <span>SOBRE A PLATAFORMA</span>
              <ChevronRight className={`w-4 h-4 ${activePage === 'sobre' ? 'text-[#0B254B]' : 'text-slate-400'}`} />
            </button>

            {/* Central de Ajuda no Mobile (depois do Sobre) */}
            <button
              id="nav-link-mobile-ajuda"
              onClick={() => {
                setDrawerOpen(false);
                setHelpModalOpen(true);
              }}
              className="w-full text-left py-2.5 px-3 rounded-xl flex items-center justify-between uppercase transition-all hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-[#0B254B]" />
                <span>CENTRAL DE AJUDA</span>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>

            <button
              onClick={() => {
                setDrawerOpen(false);
                triggerInquiry();
              }}
              className="w-full text-left py-3 px-3 mt-2 rounded-xl bg-slate-100 text-[#0B254B] hover:bg-slate-200 font-bold uppercase tracking-wider flex items-center justify-between border border-slate-200"
            >
              <span>CONSULTAR ONLINE</span>
              <Send className="w-4 h-4 text-[#0B254B]" />
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200">
          {currentUser ? (
            <div className="space-y-3">
              {/* Profile Card in Drawer */}
              <div className={`p-3 rounded-xl border flex items-center gap-3 ${currentRoleInfo.cardBg}`}>
                <div className="w-9 h-9 rounded-lg bg-white shadow-2xs flex items-center justify-center text-slate-800 shrink-0 border border-slate-200">
                  <CurrentRoleIcon className="w-5 h-5 text-[#0B254B]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-[#0B254B]">
                      {currentRoleInfo.label}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 truncate mt-0.5">
                    {currentUser.storeName || currentUser.displayName || currentUser.name}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {currentUser.emailOrPhone}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { 
                    if (currentUser.role === 'admin') setActivePage('admin');
                    else setActivePage('dashboard'); 
                    setDrawerOpen(false); 
                  }}
                  className="py-2.5 bg-[#0B254B] hover:bg-[#0B254B] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-white" />
                  <span>Meu Painel</span>
                </button>

                <button 
                  onClick={() => {
                    handleLogout();
                    setDrawerOpen(false);
                  }}
                  className="py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-950 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sair</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => { if (onOpenAuth) onOpenAuth('login'); else setActivePage('auth'); setDrawerOpen(false); }}
                className="py-2.5 bg-white text-[#0B254B] border-2 border-[#0B254B] rounded-xl text-xs font-bold text-center hover:bg-slate-50"
              >
                Entrar
              </button>
              <button 
                onClick={() => { if (onOpenAuth) onOpenAuth('criar'); else setActivePage('auth'); setDrawerOpen(false); }}
                className="py-2.5 bg-[#0B254B] hover:bg-[#0B254B] text-white rounded-xl text-xs font-bold text-center"
              >
                Criar Conta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Online Inquiry Modal (Triggered by CONSULTAR ONLINE) */}
      <AnimatePresence>
        {inquiryModalOpen && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInquiryModalOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-70 border border-slate-200"
            >
              <button
                onClick={() => setInquiryModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-1 font-sans text-2xl font-black text-[#0B254B] mb-1">
                  <span>AXOFÁCIL!</span>
                  <span className="text-[#0B254B] text-sm font-bold bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md">PORTAL MOÇAMBIQUE</span>
                </div>
                <h3 className="font-serif font-bold text-2xl text-slate-900">Consulta & Cotação Online</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Envie o seu pedido de cotação, reserva de hotel, compra em loja, materiais ou viagens e receba resposta imediata.
                </p>
              </div>

              {inquirySent ? (
                <div className="py-8 text-center space-y-3">
                  <div className="w-14 h-14 bg-blue-50 text-[#0B254B] rounded-full flex items-center justify-center mx-auto border border-blue-200">
                    <Send className="w-7 h-7" />
                  </div>
                  <h4 className="font-serif font-bold text-lg text-slate-900">Mensagem Enviada com Sucesso!</h4>
                  <p className="text-xs text-slate-600">A nossa equipa entrará em contacto consigo muito brevemente via WhatsApp/Email.</p>
                </div>
              ) : (
                <form onSubmit={handleInquirySubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nome Completo</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: Carlos Mondlane"
                      value={inquiryForm.name}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-[#0B254B] focus:ring-1 focus:ring-[#0B254B]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp / Contacto</label>
                      <input 
                        type="tel" 
                        required
                        placeholder="+258 84 000 0000"
                        value={inquiryForm.phone}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-[#0B254B] focus:ring-1 focus:ring-[#0B254B]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tipo de Serviço</label>
                      <select
                        value={inquiryForm.service}
                        onChange={(e) => setInquiryForm({ ...inquiryForm, service: e.target.value })}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none bg-white focus:border-[#0B254B]"
                      >
                        <option value="Turismo & Logística">Turismo & Logística</option>
                        <option value="Passagens Aéreas">Passagens Aéreas</option>
                        <option value="Reserva de Hotel">Reserva de Hotel / Hospedagem</option>
                        <option value="Lojas & Encomendas">Lojas & Encomendas</option>
                        <option value="Materiais de Construção">Materiais de Construção</option>
                        <option value="Outro">Outro Assunto</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Mensagem ou Detalhes da Consulta</label>
                    <textarea 
                      rows={3}
                      required
                      placeholder="Descreva as datas pretendidas, número de pessoas ou produto..."
                      value={inquiryForm.message}
                      onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:border-[#0B254B] focus:ring-1 focus:ring-[#0B254B]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#0B254B] hover:bg-[#0B254B] text-white font-bold text-sm rounded-xl uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md"
                  >
                    <Send className="w-4 h-4 text-white" />
                    <span>Submeter Pedido Online</span>
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Central de Ajuda Modal (Como Funciona, FAQ, Segurança & Suporte) */}
      <HelpCenterModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        onNavigateHomeAndScroll={(sectionId) => {
          if (activePage !== 'home') {
            setActivePage('home');
          }
          setTimeout(() => {
            const el = document.getElementById(sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }, 350);
        }}
        onNavigatePage={(page) => {
          setActivePage(page);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </>
  );
}
