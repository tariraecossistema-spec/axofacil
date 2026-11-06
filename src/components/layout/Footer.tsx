import React from 'react';
import { 
  Instagram, Linkedin, Mail, MapPin, ExternalLink, ShieldCheck, 
  Phone, Compass, ShoppingBag, Wrench, ShoppingCart, GlassWater, 
  BedDouble, Hammer, Truck, CreditCard, Sparkles, Send
} from 'lucide-react';
import { UserProfile } from "../../types/types";

interface FooterProps {
  setActivePage: (page: any) => void;
  onOpenAuth?: (tab: 'login' | 'criar' | 'admin') => void;
  currentUser?: UserProfile | null;
  activePage?: string;
}

export default function Footer({ setActivePage, onOpenAuth, currentUser, activePage }: FooterProps) {
  const adminEmail = 'tarira.ecossistema@gmail.com';
  const linkedinUrl = 'https://www.linkedin.com/company/tarira-ecossystem';
  const instagramUrl = 'https://www.instagram.com/axofacil?stkn=bzhwNnZ6ZGt4bDJ4';
  // DEFINIR: Número telefónico oficial de apoio ao cliente da plataforma
  const phoneContact = '';

  const services = [
    {
      icon: Compass,
      title: 'Turismo & Viagens',
      desc: 'Voos, safaris, praias de Moçambique & passeios guiados',
      page: 'turismo'
    },
    {
      icon: ShoppingBag,
      title: 'Lojas & Comércio',
      desc: 'Vestuário, calçado, eletrónica & acessórios',
      page: 'lojas'
    },
    {
      icon: Wrench,
      title: 'Peças & Auto',
      desc: 'Peças sobressalentes, oficinas, filtros & pneus',
      page: 'lojas'
    },
    {
      icon: BedDouble,
      title: 'Hotéis & Lodges',
      desc: 'Hospedagem executiva, pousadas & resorts com vista mar',
      page: 'hospedagens'
    },
    {
      icon: ShoppingCart,
      title: 'Supermercados',
      desc: 'Compras frescas do dia a dia, cabazes & atacado',
      page: 'supermercados'
    },
    {
      icon: GlassWater,
      title: 'Bares & Noite',
      desc: 'Gastronomia moçambicana, marisqueiras & diversão',
      page: 'bares'
    },
    {
      icon: Hammer,
      title: 'Construção Civil',
      desc: 'Cimento, ferragens, blocos, tintas & materiais de obra',
      page: 'construcao'
    },
    {
      icon: Truck,
      title: 'Entregas Express',
      desc: 'Estafetas, carrinhas & fretes rápidos em todo Moçambique',
      page: 'entregadores'
    }
  ];

  return (
    <footer id="main-footer" className="border-t border-blue-900/40 bg-[#0B254B] text-white pt-10 pb-8 px-[5vw] lg:px-[7vw] mt-10 relative overflow-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-900/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col gap-6 relative z-10">
        
        {/* Top Section: Brand Identity & Social Channels */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
          
          {/* Brand Identity */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
            <div 
              onClick={() => {
                setActivePage('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="cursor-pointer group flex items-center gap-1.5"
            >
              <span className="font-black text-2xl sm:text-3xl text-white tracking-tight font-sans">
                AXOFÁCIL!
              </span>
              <span className="bg-white text-[#0B254B] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider shadow-sm">
                MOÇAMBIQUE
              </span>
            </div>
            
            <div className="sm:border-l sm:border-white/15 sm:pl-4 space-y-0.5">
              <p className="text-xs sm:text-sm font-semibold text-slate-100">
                Directório de Comércio, Serviços e Logística em Moçambique
              </p>
              <p className="text-[11px] text-blue-200 flex items-center justify-center sm:justify-start gap-1">
                <MapPin className="w-3 h-3 text-blue-300" />
                Maputo · Beira · Nampula · Tete · Quelimane · Moçambique
              </p>
            </div>
          </div>

          {/* Social Channels with Sleek, Compact Icons */}
          <div className="flex flex-col items-center sm:items-end gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-blue-200">
              Siga-nos & Contactos
            </span>
            <div className="flex items-center gap-2.5">
              {/* Instagram */}
              <a
                id="footer-instagram-btn"
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/15"
                title="Instagram Oficial (@axofacil)"
                aria-label="Instagram Oficial"
              >
                <Instagram className="w-4 h-4 text-white" />
              </a>

              {/* LinkedIn */}
              <a
                id="footer-linkedin-btn"
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#0A66C2] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/15"
                title="LinkedIn (Tarira Ecossistema)"
                aria-label="LinkedIn Tarira Ecossistema"
              >
                <Linkedin className="w-4 h-4 text-white" />
              </a>

              {/* Email */}
              <a
                id="footer-email-btn"
                href={`mailto:${adminEmail}`}
                className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-[#0B254B] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/15"
                title={`Enviar e-mail para ${adminEmail}`}
                aria-label="E-mail de Apoio"
              >
                <Mail className="w-4 h-4 text-white" />
              </a>

              {/* Phone / WhatsApp — DEFINIR: Número de WhatsApp oficial de apoio ao cliente (atualmente 258840000000) */}
              <a
                id="footer-phone-btn"
                href="https://wa.me/258840000000"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/15"
                title="WhatsApp / Apoio ao Cliente"
                aria-label="WhatsApp Apoio ao Cliente"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>

        </div>

        {/* Middle Section: Compact Categorias Link Strip (Discreto, compacto e elegante) */}
        {activePage !== 'dashboard' && (
          <div className="py-3.5 border-b border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 shrink-0">
              Categorias:
            </span>

            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {services.map((srv, idx) => {
                const Icon = srv.icon;
                return (
                  <button
                    key={`footer-srv-${srv.title}-${idx}`}
                    onClick={() => {
                      setActivePage(srv.page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors cursor-pointer border border-white/5 text-[11px] font-medium"
                    title={srv.desc}
                  >
                    <Icon className="w-3 h-3 text-blue-300" />
                    <span>{srv.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Payment & Trust Methods Bar */}
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <CreditCard className="w-4 h-4 text-blue-300" />
            <span className="font-semibold">Meios de Pagamento Seguros & Integrados:</span>
          </div>
          <div className="flex items-center gap-3 font-mono font-bold text-xs text-white flex-wrap justify-center">
            <span className="px-2.5 py-1 bg-red-600/30 border border-red-500/40 rounded-md text-red-300">
              M-PESA (Vodacom)
            </span>
            <span className="px-2.5 py-1 bg-orange-600/30 border border-orange-500/40 rounded-md text-orange-300">
              e-Mola (Movitel)
            </span>
            <span className="px-2.5 py-1 bg-blue-600/30 border border-blue-500/40 rounded-md text-blue-300">
              Cartão VISA / MasterCard
            </span>
            <span className="px-2.5 py-1 bg-emerald-600/30 border border-emerald-500/40 rounded-md text-emerald-300">
              Pagamento na Entrega
            </span>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Management */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400 border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <p>© {new Date().getFullYear()} AXOFÁCIL! Moçambique — Desenvolvido por <strong className="text-white">Tarira Studio</strong> (Tarira Ecossistema).</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setActivePage('sobre');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-blue-300 hover:text-white font-bold transition-colors cursor-pointer"
              >
                Sobre Nós & Tarira Studio
              </button>
              <span className="text-white/20">•</span>
              <button
                onClick={() => {
                  setActivePage('sobre');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Contactos Oficiais
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (currentUser?.role === 'admin') {
                  setActivePage('admin');
                } else if (onOpenAuth) {
                  onOpenAuth('admin');
                } else {
                  setActivePage('auth');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-1.5 opacity-40 hover:opacity-100 text-slate-300 hover:text-white transition-all cursor-pointer"
              title="Acesso de Gestão / Administração"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-300" />
              <span>Painel de Gestão</span>
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
