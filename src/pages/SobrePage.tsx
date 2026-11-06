import React, { useState } from 'react';
import { 
  Building2, Sparkles, Globe, Code2, Rocket, ShieldCheck, 
  Phone, Mail, MapPin, Send, MessageSquare, ExternalLink, 
  Layers, CheckCircle2, ArrowRight, Laptop, Smartphone, 
  Database, Users, Headphones, Zap, Compass, ChevronRight,
  Briefcase, HeartHandshake, Instagram, Linkedin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from "../services/dialogs";

interface SobrePageProps {
  setActivePage: (page: any) => void;
  onGoHome?: () => void;
  initialTab?: 'historia' | 'tarira_studio' | 'contactos' | 'valores';
}

export default function SobrePage({ setActivePage, onGoHome, initialTab = 'historia' }: SobrePageProps) {
  const [activeTab, setActiveTab] = useState<'historia' | 'tarira_studio' | 'contactos' | 'valores'>(initialTab);

  // Form state for interactive inquiries
  const [contactType, setContactType] = useState<'axofacil' | 'tarira'>('axofacil');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    serviceInterest: 'desenvolvimento_site' // for Tarira Studio
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.message) {
      showToast('Por favor, preencha o seu nome, contacto telefónico e a mensagem.', 'warning');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setFormSubmitted(true);
      showToast(
        contactType === 'axofacil' 
          ? 'Mensagem enviada com sucesso para o Suporte AXOFÁCIL!' 
          : 'Solicitação recebida com sucesso pela equipa da Tarira Studio!', 
        'success'
      );
    }, 900);
  };

  const openDirectWhatsApp = (destination: 'axofacil' | 'tarira') => {
    const phone = destination === 'axofacil' ? '258871425316' : '258840000000';
    const text = destination === 'axofacil'
      ? encodeURIComponent(`Olá Suporte AXOFÁCIL!, gostaria de obter mais informações sobre o portal e parcerias comerciais.`)
      : encodeURIComponent(`Olá Tarira Studio! Tenho interesse em desenvolver um website/plataforma digital para a minha empresa/startup.`);
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Top Breadcrumb & Page Banner */}
      <section className="bg-gradient-to-b from-[#0a1c38] via-[#103B75] to-[#164b91] text-white pt-10 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle Background Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-400/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-10 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Tag & Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-sm text-xs font-semibold text-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span>Conheça a Nossa Origem & Tecnologia</span>
            </div>

            <button
              onClick={() => onGoHome ? onGoHome() : setActivePage('home')}
              className="text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>← Voltar ao Início</span>
            </button>
          </div>

          {/* Main Hero Typography */}
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-blue-200 font-mono text-xs uppercase tracking-widest font-bold">
                Sobre a Plataforma
              </span>
              <span className="text-white/30">•</span>
              <span className="text-slate-300 text-xs font-medium">
                Desenvolvida por <strong className="text-white">Tarira Studio</strong>
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-4">
              Directório de Comércio, Serviços e Logística em Maputo e Matola
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-light mb-6">
              O <strong className="text-white font-semibold">AXOFÁCIL!</strong> é uma plataforma em fase inicial desenvolvida pela <strong className="text-white font-semibold">Tarira Studio</strong> (<strong className="text-white font-semibold">Tarira Ecossistema</strong>) para facilitar a divulgação de lojas, estaleiros, supermercados e serviços locais.
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-white">Fase 1</span>
                <p className="text-[11px] text-slate-300 font-medium">Lançamento Maputo & Matola</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-[#f5d99f]">Local</span>
                <p className="text-[11px] text-slate-300 font-medium">Desenvolvimento Moçambicano</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-emerald-400">8</span>
                <p className="text-[11px] text-slate-300 font-medium">Segmentos no Directório</p>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-2xl font-black text-amber-300">15 Dias</span>
                <p className="text-[11px] text-slate-300 font-medium">Período Experimental</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Internal Navigation Sub-Menu (Tabs) */}
      <div className="sticky top-[57px] z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-2 sm:gap-4 overflow-x-auto py-2.5 no-scrollbar">
          
          <button
            id="tab-btn-historia"
            onClick={() => setActiveTab('historia')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'historia'
                ? 'bg-[#103B75] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4 text-blue-300" />
            <span>AXOFÁCIL! & Origem</span>
          </button>

          <button
            id="tab-btn-tarira"
            onClick={() => setActiveTab('tarira_studio')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'tarira_studio'
                ? 'bg-[#103B75] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Code2 className="w-4 h-4 text-blue-300" />
            <span>Tarira Studio (Websites para Empresas)</span>
          </button>

          <button
            id="tab-btn-contactos"
            onClick={() => setActiveTab('contactos')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'contactos'
                ? 'bg-[#103B75] text-white shadow-xs font-black'
                : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>Central de Contactos</span>
          </button>

          <button
            id="tab-btn-valores"
            onClick={() => setActiveTab('valores')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'valores'
                ? 'bg-[#103B75] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Missão & Valores</span>
          </button>

        </div>
      </div>

      {/* Dynamic Tab Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        
        {/* ========================================================================= */}
        {/* TAB 1: HISTÓRIA & ORIGEM DO AXOFÁCIL! */}
        {/* ========================================================================= */}
        {activeTab === 'historia' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Story Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-[#103B75] flex items-center justify-center font-black">
                  <Rocket className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    Projecto Inicial da Tarira Studio
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Um directório prático para aproximar clientes e comerciantes locais
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7 space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
                  <p>
                    O <strong className="text-slate-900 font-semibold">AXOFÁCIL!</strong> nasceu para facilitar o contacto directo entre clientes e estabelecimentos em Maputo e Matola: lojas de comércio geral, supermercados, agências de turismo, estaleiros de construção, bares, lojas de peças auto e estafetas.
                  </p>
                  <p>
                    Desenvolvido pela <strong className="text-slate-900 font-semibold">Tarira Studio</strong>, o projecto encontra-se em fase inicial de implantação, reunindo catálogos de produtos com preços em Meticais, dados de pagamento móvel (<strong className="text-slate-900">e-Mola e M-Pesa</strong>) e ferramentas de gestão de stock e ponto de venda (POS).
                  </p>
                  <p>
                    A Tarira Studio integra a <strong className="text-slate-900 font-semibold">Tarira Ecossistema</strong>, dedicada ao desenvolvimento de soluções digitais adaptadas às PMEs em Moçambique.
                  </p>
                </div>

                <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-[#103B75] text-white p-6 sm:p-7 rounded-2xl border border-slate-800 space-y-4">
                  <span className="text-[11px] uppercase tracking-widest font-mono text-blue-300 font-bold">
                    Estrutura do Ecossistema
                  </span>
                  
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-xl bg-white/10 border border-blue-400/30 flex items-start gap-3">
                      <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-sm font-bold text-white">Tarira Ecossistema</h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30">
                            Marca Mãe
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">A entidade-mãe de empreendedorismo, inovação e soluções empresariais em Moçambique.</p>
                        
                        <div className="mt-3">
                          <a
                            href="https://tarira.vercel.app/#"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer group"
                            title="Abrir o portal oficial da Marca Mãe Tarira Ecossistema"
                          >
                            <Globe className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
                            <span>Aceder ao Portal da Marca Mãe</span>
                            <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/10 border border-blue-400/40 flex items-start gap-3">
                      <Code2 className="w-5 h-5 text-blue-200 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-white">Tarira Studio</h4>
                        <p className="text-xs text-slate-300">Software house e estúdio de design responsável pela criação de sites, portais e apps para startups e PMEs.</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-emerald-300">Portal AXOFÁCIL!</h4>
                        <p className="text-xs text-slate-300">A 1ª plataforma oficial lançada pela Tarira Studio para comércio, turismo e logística nacional.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Why AXOFÁCIL! is unique */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#103B75]" />
                <span>O Que Torna o Portal AXOFÁCIL! Diferenciado</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold mb-4">
                    <Globe className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">Presença Multissectorial</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Não somos apenas uma loja ou um directório. Conectamos turismo com reservas de voos e safaris, compras do dia-a-dia em supermercados, autopeças e materiais de construção.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#103B75] flex items-center justify-center font-bold mb-4">
                    <Zap className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">Pagamentos Nacionais Diretos</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Totalmente integrado com <strong className="text-slate-800">e-Mola</strong> e <strong className="text-slate-800">M-Pesa</strong>, permitindo que qualquer cidadão compre e pague com a sua carteira móvel sem complicações.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-500/60 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold mb-4">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">Comerciantes Verificados</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Auditoria manual e cibersegurança activa para garantir que as lojas, hotéis e entregadores no portal são fidedignos e prontos para atender com excelência.
                  </p>
                </div>
              </div>
            </div>

            {/* CTA Box to Contact / Explore */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-[#103B75] to-[#1c559e] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md">
              <div>
                <h4 className="text-xl font-black mb-1">Quer registar a sua empresa no AXOFÁCIL!?</h4>
                <p className="text-xs sm:text-sm text-blue-100">Estamos a receber os primeiros estabelecimentos parceiros em Maputo e Matola.</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab('contactos')}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-[#103B75] font-bold text-xs tracking-wide uppercase transition-all shadow-xs cursor-pointer"
                >
                  Falar com o Apoio
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: TARIRA STUDIO (DESENVOLVIMENTO PARA STARTUPS & PMEs) */}
        {/* ========================================================================= */}
        {activeTab === 'tarira_studio' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Tarira Studio Profile Hero */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#103B75] text-white flex items-center justify-center font-black shadow-md">
                    <Code2 className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Tarira Studio
                      </h2>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-[#103B75] border border-blue-200">
                        Design & Code Lab
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium">
                      O estúdio de software e desenvolvimento web da Tarira Ecossistema
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setActiveTab('contactos');
                    setContactType('tarira');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-xs cursor-pointer flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Pedir Orçamento de Site</span>
                </button>
              </div>

              {/* Mission statement for startups */}
              <div className="space-y-4 text-slate-600 leading-relaxed text-sm sm:text-base">
                <p>
                  A <strong className="text-slate-900 font-semibold">Tarira Studio</strong> é a unidade tecnológica e criativa responsável por projetar e programar soluções digitais de alto rendimento. Desenvolvemos <strong className="text-slate-900 font-semibold">websites profissionais, portais de comércio eletrónico, sistemas de gestão e aplicações web para Startups e Pequenas e Médias Empresas (PMEs)</strong> em Moçambique e além-fronteiras.
                </p>
                <p>
                  Acreditamos que todo negócio moçambicano, independentemente do seu tamanho, merece uma presença digital sofisticada, rápida, segura e otimizada para dispositivos móveis e mecanismos de busca.
                </p>
              </div>

              {/* What Tarira Studio Builds */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4">
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                    <Laptop className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Websites Institucionais</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sites rápidos e modernos para consultorias, escritórios, empresas de engenharia, clínicas e prestadores de serviços que buscam credibilidade imediata.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Lojas Virtuais & E-commerce</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Plataformas de venda direta com catálogo de produtos, integração de pagamentos móveis (e-Mola & M-Pesa), cálculo de frete e painel administrativo.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#103B75] flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Portais & Softwares Sob Medida</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Ecossistemas complexos e marketplaces personalizados como o <strong className="text-slate-900">AXOFÁCIL!</strong>, com dashboards, gestão de utilizadores e sincronização em nuvem.
                  </p>
                </div>
              </div>
            </div>

            {/* Development Process Steps */}
            <div className="space-y-6">
              <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <Rocket className="w-5 h-5 text-[#103B75]" />
                <span>Como a Tarira Studio Constrói o Seu Projecto</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-mono font-bold text-[#103B75]">ETAPA 01</span>
                  <h4 className="font-bold text-sm text-slate-900">Diagnóstico & Estratégia</h4>
                  <p className="text-xs text-slate-500">Mapeamento dos objetivos comerciais da sua empresa e definição da arquitetura ideal.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-mono font-bold text-[#103B75]">ETAPA 02</span>
                  <h4 className="font-bold text-sm text-slate-900">Design de Alta Fidelidade</h4>
                  <p className="text-xs text-slate-500">Prototipagem visual moderna, acessível e alinhada à identidade da sua marca.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-mono font-bold text-[#103B75]">ETAPA 03</span>
                  <h4 className="font-bold text-sm text-slate-900">Engenharia & Integrações</h4>
                  <p className="text-xs text-slate-500">Programação segura com as tecnologias mais rápidas do mundo e gateways moçambicanos.</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <span className="text-xs font-mono font-bold text-[#103B75]">ETAPA 04</span>
                  <h4 className="font-bold text-sm text-slate-900">Lançamento & Suporte</h4>
                  <p className="text-xs text-slate-500">Publicação com domínio próprio, contas de email corporativo e manutenção contínua.</p>
                </div>
              </div>
            </div>

            {/* Direct Contact for Tarira Studio Projects */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
              <div className="space-y-1 text-center md:text-left">
                <span className="text-xs font-mono uppercase tracking-widest text-blue-300 font-bold">
                  Pronto para Digitalizar a sua Empresa?
                </span>
                <h4 className="text-xl font-black">Fale diretamente com a equipa de engenharia da Tarira Studio</h4>
                <p className="text-xs text-slate-300">Receba uma proposta detalhada para o desenvolvimento do seu novo website ou aplicativo.</p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => openDirectWhatsApp('tarira')}
                  className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>WhatsApp Tarira Studio</span>
                </button>

                <a
                  href="mailto:tarira.ecossistema@gmail.com"
                  title="Enviar E-mail"
                  aria-label="Enviar E-mail à Tarira Studio"
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105"
                >
                  <Mail className="w-5 h-5 text-white" />
                </a>
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: CENTRAL DE CONTACTOS (AXOFÁCIL! + TARIRA ECOSSISTEMA) */}
        {/* ========================================================================= */}
        {activeTab === 'contactos' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Contact Selector Banner */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  Central de Contactos & Canais Oficiais
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  Escolha o canal adequado para o seu tipo de solicitação ou use o formulário interativo abaixo.
                </p>
              </div>

              {/* Direct Info Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                
                {/* AXOFÁCIL! Official Contacts */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50/70 to-slate-50/40 border border-blue-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-[#103B75] animate-pulse" />
                      <h3 className="font-black text-base text-slate-900">Portal AXOFÁCIL!</h3>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-[#103B75] text-white">
                      Suporte ao Portal
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    Dúvidas sobre compras, reservas de turismo, entregas, pagamentos via <strong>e-Mola/M-Pesa</strong> ou registo de novas lojas e parceiros.
                  </p>

                  <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Phone className="w-4 h-4 text-[#103B75] shrink-0" />
                      <span><strong>Telefone / e-Mola:</strong> +258 87 142 5316</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-[#103B75] shrink-0" />
                      <span><strong>E-mail Comercial:</strong> axofacil@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <MapPin className="w-4 h-4 text-[#103B75] shrink-0" />
                      <span><strong>Sede Operacional:</strong> Av. 24 de Julho / Baixa, Maputo</span>
                    </div>
                  </div>

                  <button
                    onClick={() => openDirectWhatsApp('axofacil')}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Abrir Conversa WhatsApp (+258 87 142 5316)</span>
                  </button>
                </div>

                {/* Tarira Studio / Ecossistema Official Contacts */}
                <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-[#103B75] text-white border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full bg-blue-400" />
                      <h3 className="font-black text-base text-white">Tarira Studio & Ecossistema</h3>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-white/20 text-blue-200">
                      Software & Startups
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Solicitações de desenvolvimento de sites, lojas virtuais, sistemas corporativos para PMEs e parcerias institucionais.
                  </p>

                  <div className="space-y-2.5 text-xs text-slate-300 font-medium">
                    <div className="flex items-center gap-2.5">
                      <Mail className="w-4 h-4 text-blue-300 shrink-0" />
                      <span><strong>E-mail Geral:</strong> tarira.ecossistema@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Linkedin className="w-4 h-4 text-blue-400 shrink-0" />
                      <span><strong>LinkedIn:</strong> linkedin.com/company/tarira-ecossystem</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <Instagram className="w-4 h-4 text-pink-400 shrink-0" />
                      <span><strong>Instagram:</strong> @tarira_ecossistema</span>
                    </div>
                    <div className="pt-2">
                      <a
                        href="https://tarira.vercel.app/#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-emerald-300 hover:text-white border border-emerald-400/40 rounded-xl text-xs font-bold transition-all group"
                      >
                        <Globe className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
                        <span>Aceder ao Portal da Marca Mãe</span>
                        <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </a>
                    </div>
                  </div>

                  <button
                    onClick={() => openDirectWhatsApp('tarira')}
                    className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#103B75] font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer transition-all"
                  >
                    <Code2 className="w-4 h-4" />
                    <span>Contactar Engenharia Tarira Studio</span>
                  </button>
                </div>

              </div>
            </div>

            {/* Interactive Contact & Quotation Form */}
            <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs">
              <div className="max-w-2xl mb-8">
                <span className="text-xs font-mono font-bold uppercase text-[#103B75]">Formulário Unificado</span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Envie a sua Mensagem ou Pedido de Projecto
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                  A nossa equipa responde em menos de 2 horas úteis.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-8 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-emerald-900">Mensagem Recebida com Sucesso!</h4>
                  <p className="text-xs text-emerald-700 max-w-md mx-auto">
                    Obrigado pelo seu contacto, <strong>{formData.name}</strong>. A equipa {contactType === 'axofacil' ? 'do AXOFÁCIL!' : 'da Tarira Studio'} entrará em contacto através do número <strong>{formData.phone}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setFormSubmitted(false);
                      setFormData({ name: '', email: '', phone: '', subject: '', message: '', serviceInterest: 'desenvolvimento_site' });
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs cursor-pointer hover:bg-emerald-800"
                  >
                    Enviar Outra Mensagem
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitContact} className="space-y-6">
                  
                  {/* Select Recipient Toggle */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Para quem deseja direcionar a mensagem?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setContactType('axofacil')}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          contactType === 'axofacil'
                            ? 'border-[#103B75] bg-blue-50/60 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contactType === 'axofacil' ? 'border-[#103B75]' : 'border-slate-400'}`}>
                          {contactType === 'axofacil' && <div className="w-2 h-2 rounded-full bg-[#103B75]" />}
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900">Suporte & Lojistas AXOFÁCIL!</p>
                          <p className="text-[11px] text-slate-500">Parcerias, compras, turismo e logística</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setContactType('tarira')}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
                          contactType === 'tarira'
                            ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${contactType === 'tarira' ? 'border-blue-400' : 'border-slate-400'}`}>
                          {contactType === 'tarira' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                        </div>
                        <div>
                          <p className={`text-xs font-black ${contactType === 'tarira' ? 'text-white' : 'text-slate-900'}`}>Tarira Studio (Criar Website)</p>
                          <p className={`text-[11px] ${contactType === 'tarira' ? 'text-slate-300' : 'text-slate-500'}`}>Sites, softwares e apps para PMEs/Startups</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Input Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Seu Nome Completo *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Carlos Mondlane"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#103B75]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Contacto Telefónico / WhatsApp *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+258 84/87 000 0000"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#103B75]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Endereço de E-mail (Opcional)
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="exemplo@empresa.co.mz"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#103B75]"
                      />
                    </div>

                    {contactType === 'tarira' ? (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Tipo de Projecto Pretendido
                        </label>
                        <select
                          value={formData.serviceInterest}
                          onChange={e => setFormData({ ...formData, serviceInterest: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#103B75]"
                        >
                          <option value="desenvolvimento_site">Website Institucional para Empresa</option>
                          <option value="loja_virtual">Loja Virtual / E-commerce com e-Mola & M-Pesa</option>
                          <option value="portal_startup">Portal ou Plataforma para Startup</option>
                          <option value="sistema_gestao">Sistema de Gestão Sob Medida</option>
                          <option value="outro">Consultoria Tecnológica / Outro</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Assunto da Mensagem
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={e => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Ex: Parceria de Loja / Dúvida sobre Turismo"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#103B75]"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mensagem ou Detalhes da Solicitação *
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={e => setFormData({ ...formData, message: e.target.value })}
                      placeholder={
                        contactType === 'axofacil'
                          ? "Descreva como podemos ajudar ou qual o seu estabelecimento..."
                          : "Conte-nos sobre a sua empresa, objetivos do site ou funcionalidades que precisa..."
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#103B75] resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Os seus dados são tratados com total sigilo e segurança.</span>
                    </p>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-auto px-7 py-3 rounded-xl bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <span>A enviar mensagem...</span>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-white" />
                          <span>Enviar Mensagem</span>
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: MISSÃO, VISÃO & VALORES */}
        {/* ========================================================================= */}
        {activeTab === 'valores' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Missão */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#103B75] flex items-center justify-center font-black">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">A Nossa Missão</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Capacitar e acelerar o ecossistema empresarial de Moçambique, oferecendo plataformas digitais de alta tecnologia desenvolvidas localmente que encurtam distâncias e democratizam o comércio seguro.
                </p>
              </div>

              {/* Visão */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black">
                  <Globe className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">A Nossa Visão</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Ser a principal referência em engenharia de software e plataformas de intermediação comercial e turística da África Austral, liderando a transformação digital de PMEs e Startups através da Tarira Studio.
                </p>
              </div>

              {/* Valores */}
              <div className="bg-white p-7 rounded-3xl border border-slate-200 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">Nossos Valores</h3>
                <ul className="text-xs sm:text-sm text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Inovação com Raízes Locais</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Cibersegurança e Integridade</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Acessibilidade Financeira (e-Mola / M-Pesa)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Compromisso Rigoroso com o Cliente</span>
                  </li>
                </ul>
              </div>

            </div>

            {/* Quote / Manifest */}
            <div className="p-8 rounded-3xl bg-slate-900 text-white text-center space-y-3 border border-slate-800">
              <Sparkles className="w-8 h-8 text-blue-400 mx-auto" />
              <blockquote className="text-base sm:text-lg font-serif italic text-slate-200 max-w-2xl mx-auto">
                "O futuro digital de Moçambique não precisa de ser importado; ele está a ser construído aqui, linha de código por linha de código, pela Tarira Studio."
              </blockquote>
              <p className="text-xs font-mono uppercase tracking-widest text-blue-300 font-bold">
                — Tarira Ecossistema · Tarira Studio
              </p>
            </div>
          </motion.div>
        )}

      </div>

    </div>
  );
}
