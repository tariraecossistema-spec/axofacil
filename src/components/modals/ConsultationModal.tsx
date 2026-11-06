import React, { useState, useEffect } from 'react';
import { 
  X, Send, Sparkles, CheckCircle2, ShieldCheck, Phone, Mail, 
  Clock, MapPin, Building2, Compass, Wrench, ShoppingBag, 
  BedDouble, ShoppingCart, Wine, Hammer, Truck, MessageSquare, 
  HelpCircle, ArrowRight
} from 'lucide-react';
import { UserProfile, CommercialInquiry } from "../../types/types";
import { notify } from "../../services/dialogs";
import { recordAdminAction } from "../../services/adminAuditStore";

export interface ConsultationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
  currentUser?: UserProfile | null;
  onSubmitInquiry?: (inquiry: CommercialInquiry) => void;
}

interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ElementType;
  badge: string;
  title: string;
  description: string;
  titlePlaceholder: string;
  detailsPlaceholder: string;
  themeColor: string;
  bgGradient: string;
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  turismo: {
    id: 'turismo',
    label: 'Turismo, Safaris & Viagens',
    icon: Compass,
    badge: 'Área Comercial Axofácil! · Turismo, Safaris & Logística',
    title: 'Fale com os Nossos Especialistas de Viagem',
    description: 'Adoraríamos trabalhar consigo na sua próxima viagem, safari ou logística turística em Moçambique. Envie-nos uma solicitação e entraremos em contacto em até dois dias úteis, geralmente antes disso.',
    titlePlaceholder: 'ex: Safari 3 dias Reserva Especial de Maputo (4 Adultos) + Transfer 4x4',
    detailsPlaceholder: 'Indique datas previstas, número de viajantes, preferências de alojamento (lodge rústico ou hotel luxo), roteiros pretendidos (Ponta do Ouro, Bilene, Inhaca, Bazaruto) e serviços adicionais (guia, refeições, barco)...',
    themeColor: 'text-cyan-700',
    bgGradient: 'from-cyan-950 via-slate-900 to-slate-950'
  },
  pecas_auto: {
    id: 'pecas_auto',
    label: 'Peças Auto & Mecânica',
    icon: Wrench,
    badge: 'Área Comercial Axofácil! · Auto Peças & Mecânica Especializada',
    title: 'Cotação Central de Peças & Componentes Automóveis',
    description: 'Adoraríamos ajudá-lo a encontrar a peça, acessório, óleo ou serviço mecânico ideal para a sua viatura ou frota. Envie-nos a sua solicitação e a nossa equipa comercial entrará em contacto em até dois dias úteis, geralmente antes disso.',
    titlePlaceholder: 'ex: Kit de Embraiagem + Amortecedores Dianteiros para Toyota Hilux 2.8 GD-6 (2020)',
    detailsPlaceholder: 'Indique marca, modelo, ano, motorização, número de chassis (VIN se tiver), quantidade pretendida de peças e se necessita de entrega expresso na oficina ou recolha na loja...',
    themeColor: 'text-blue-700',
    bgGradient: 'from-blue-950 via-slate-900 to-slate-950'
  },
  lojas: {
    id: 'lojas',
    label: 'Lojas, Moda & Retalho',
    icon: ShoppingBag,
    badge: 'Área Comercial Axofácil! · Lojas, Moda & Artigos da Baixa',
    title: 'Encomendas, Cotações & Produtos Especiais',
    description: 'Adoraríamos auxiliá-lo a encontrar artigos de vestuário, moda, eletrónicos, encomendas a grosso ou produtos especiais nas lojas parceiras. Envie-nos a sua solicitação e entraremos em contacto em até dois dias úteis, geralmente antes disso.',
    titlePlaceholder: 'ex: Cotação de Lote de 50 Capulanas Genuínas / 10 Smartphones Samsung para Empresa',
    detailsPlaceholder: 'Descreva os artigos pretendidos, marcas de preferência, quantidades, tamanhos/especificações e se pretende fatura comercial com NUIT...',
    themeColor: 'text-emerald-700',
    bgGradient: 'from-emerald-950 via-slate-900 to-slate-950'
  },
  hospedagens: {
    id: 'hospedagens',
    label: 'Hotéis & Lodges',
    icon: BedDouble,
    badge: 'Área Comercial Axofácil! · Hotéis, Lodges & Estadias',
    title: 'Reservas Corporativas & Estadias Exclusivas',
    description: 'Adoraríamos ajudá-lo com a sua reserva de hotel, lodges à beira-mar, estadias de grupos ou eventos corporativos em Moçambique. Envie-nos a sua solicitação e a nossa equipa comercial responderá em até dois dias úteis, geralmente antes disso.',
    titlePlaceholder: 'ex: Reserva de 6 Quartos Executivos para Conferência de 3 Noites em Maputo',
    detailsPlaceholder: 'Especifique data de entrada e saída, número de hóspedes, regime de alimentação (pequeno-almoço, meia pensão), salas de reuniões necessárias e requisitos especiais...',
    themeColor: 'text-rose-700',
    bgGradient: 'from-rose-950 via-slate-900 to-slate-950'
  },
  supermercados: {
    id: 'supermercados',
    label: 'Supermercados & Mercearias',
    icon: ShoppingCart,
    badge: 'Área Comercial Axofácil! · Supermercados & Atacado Alimentar',
    title: 'Cotação de Géneros Alimentares & Cabazes',
    description: 'Adoraríamos auxiliá-lo com cotações de produtos alimentares a grosso, cabazes para empresas e fornecimento institucional. Envie-nos a sua solicitação e entraremos em contacto em até dois dias úteis, geralmente antes disso.',
    titlePlaceholder: 'ex: Fornecimento Mensal de Cabazes Alimentares para 40 Funcionários',
    detailsPlaceholder: 'Liste os produtos necessários (arroz, óleo, açúcar, farinha, conservas, frescos), quantidades estimadas, periodicidade de entrega e localização das instalações...',
    themeColor: 'text-green-700',
    bgGradient: 'from-green-950 via-slate-900 to-slate-950'
  },
  bares: {
    id: 'bares',
    label: 'Bares, Lounges & Eventos',
    icon: Wine,
    badge: 'Área Comercial Axofácil! · Bares, Lounges & Noite de Maputo',
    title: 'Eventos Privados, Reservas VIP & Aniversários',
    description: 'Adoraríamos ajudá-lo na organização do seu evento privado, aniversário, reservas de mesas ou noites especiais nos melhores lounges e restaurantes. Envie-nos a sua solicitação e entraremos em contacto em até dois dias úteis.',
    titlePlaceholder: 'ex: Reserva de Área Lounge VIP para Celebração de Aniversário (30 Pessoas)',
    detailsPlaceholder: 'Indique data e horário, número de convidados, consumo pretendido de bebidas/catering, necessidade de DJ ou som e preferências de decoração...',
    themeColor: 'text-amber-700',
    bgGradient: 'from-amber-950 via-slate-900 to-slate-950'
  },
  construcao: {
    id: 'construcao',
    label: 'Construção Civil & Estaleiros',
    icon: Hammer,
    badge: 'Área Comercial Axofácil! · Material de Construção & Estaleiros',
    title: 'Cotação Direta de Materiais & Frete para Obra',
    description: 'Adoraríamos auxiliá-lo com cotações de material de construção a granel, cimento, varões de ferro, brita, blocos e frete direto para a sua obra. Envie-nos a sua solicitação e entraremos em contacto em até dois dias úteis.',
    titlePlaceholder: 'ex: Cotação para 300 Sacos Cimento 42.5N + 4 Toneladas de Varão de Ferro 12mm',
    detailsPlaceholder: 'Liste detalhadamente os materiais, quantidades, marca preferida de cimento, localidade exata da obra para cálculo do frete e necessidade de descarga no local...',
    themeColor: 'text-orange-700',
    bgGradient: 'from-orange-950 via-slate-900 to-slate-950'
  },
  entregadores: {
    id: 'entregadores',
    label: 'Logística & Entregadores',
    icon: Truck,
    badge: 'Área Comercial Axofácil! · Logística Express & Frotas',
    title: 'Fretes Dedicados, Frotas & Logística Urbana',
    description: 'Adoraríamos conectar a sua empresa com frotas de entrega expresso, estafetas dedicados e logística urbana em Moçambique. Envie-nos a sua solicitação e responderemos em até dois dias úteis.',
    titlePlaceholder: 'ex: Contrato de Distribuição Semanal com Carrinha Basculante e 2 Estafetas de Moto',
    detailsPlaceholder: 'Descreva rotas habituais (Maputo, Matola, Boane, Marracuene), tipo de carga, peso médio, horários de circulação e se precisa de rastreio em tempo real...',
    themeColor: 'text-indigo-700',
    bgGradient: 'from-indigo-950 via-slate-900 to-slate-950'
  },
  general: {
    id: 'general',
    label: 'Ecossistema Geral Axofácil!',
    icon: Sparkles,
    badge: 'Área Comercial Central Axofácil! Moçambique',
    title: 'Fale com a Nossa Equipa Comercial Central',
    description: 'Adoraríamos auxiliá-lo a encontrar qualquer produto, serviço, cotação ou parceria no ecossistema Axofácil! Moçambique. Envie-nos a sua solicitação e a nossa equipa comercial entrará em contacto em até dois dias úteis, geralmente antes disso.',
    titlePlaceholder: 'ex: Cotação Multi-Serviço / Parceria Comercial Institucional',
    detailsPlaceholder: 'Descreva detalhadamente o produto, serviço ou assessoria que procura. A nossa equipa comercial irá contactar os melhores estabelecimentos credenciados e apresentar-lhe uma proposta personalizada...',
    themeColor: 'text-[#0B254B]',
    bgGradient: 'from-slate-950 via-[#0d2750] to-slate-900'
  }
};

export default function ConsultationModal({
  isOpen,
  onClose,
  initialCategory = 'general',
  currentUser,
  onSubmitInquiry
}: ConsultationModalProps) {
  // Normalize category key
  const normalizedCategory = initialCategory === 'home' 
    ? 'general' 
    : (CATEGORY_CONFIGS[initialCategory] ? initialCategory : 'general');

  const [selectedDepartment, setSelectedDepartment] = useState<string>(normalizedCategory);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestTitle, setRequestTitle] = useState('');
  const [details, setDetails] = useState('');

  // Status & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedInquiry, setSubmittedInquiry] = useState<CommercialInquiry | null>(null);

  // Sync initial state when modal opens or category changes
  useEffect(() => {
    if (isOpen) {
      const cat = initialCategory === 'home' ? 'general' : (CATEGORY_CONFIGS[initialCategory] ? initialCategory : 'general');
      setSelectedDepartment(cat);
      setSubmittedInquiry(null);

      // Pre-fill user data if available
      if (currentUser) {
        if (currentUser.name && currentUser.name !== 'Utilizador') {
          setFullName(currentUser.name);
        }
        if (currentUser.email) {
          setEmail(currentUser.email);
        }
        if (currentUser.phone) {
          setPhone(currentUser.phone);
        } else if (currentUser.emailOrPhone && !currentUser.emailOrPhone.includes('@')) {
          setPhone(currentUser.emailOrPhone);
        }
      }
    }
  }, [isOpen, initialCategory, currentUser]);

  if (!isOpen) return null;

  const currentConfig = CATEGORY_CONFIGS[selectedDepartment] || CATEGORY_CONFIGS.general;
  const CategoryIcon = currentConfig.icon;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !phone.trim() || !requestTitle.trim() || !details.trim()) {
      notify('Por favor, preencha todos os campos obrigatórios.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const inquiryId = `ACH-CONS-${Math.floor(10000 + Math.random() * 90000)}`;

    const newInquiry: CommercialInquiry = {
      id: inquiryId,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      department: selectedDepartment,
      departmentLabel: currentConfig.label,
      title: requestTitle.trim(),
      details: details.trim(),
      status: 'Novo',
      createdAt: formattedDate,
      menuSource: initialCategory
    };

    // Save to local storage cache for persistence
    try {
      const existingStr = localStorage.getItem('axofacil_commercial_inquiries');
      const list: CommercialInquiry[] = existingStr ? JSON.parse(existingStr) : [];
      list.unshift(newInquiry);
      localStorage.setItem('axofacil_commercial_inquiries', JSON.stringify(list));
    } catch (err) {
      console.warn('Failed to save inquiry in localStorage:', err);
    }

    // Automatically record in Admin Panel central live feed
    recordAdminAction({
      type: 'outro',
      title: `Consulta Comercial (${currentConfig.label}): ${requestTitle.trim()}`,
      userName: fullName.trim(),
      userContact: phone.trim(),
      userEmail: email.trim(),
      categoryOrSegment: selectedDepartment,
      details: `Pedido de consulta / cotação comercial através do front-end · Departamento: ${currentConfig.label} · Descrição: ${details.trim()}`,
      status: 'Pendente',
      metadata: {
        inquiryId: inquiryId,
        department: selectedDepartment,
        menuSource: initialCategory
      }
    });

    if (onSubmitInquiry) {
      onSubmitInquiry(newInquiry);
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedInquiry(newInquiry);
    }, 600);
  };

  const handleReset = () => {
    setSubmittedInquiry(null);
    setRequestTitle('');
    setDetails('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      
      {/* Outer Container */}
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 my-auto flex flex-col max-h-[92vh]">
        
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#0B254B] flex items-center justify-center text-white font-black text-sm shadow-sm">
              ✓
            </div>
            <div>
              <div className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                Consulte Online · Axofácil! Moçambique
              </div>
              <div className="text-sm font-semibold text-white/90">
                Área Comercial Central & Atendimento Especializado
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all cursor-pointer"
            title="Fechar formulário"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Two Columns */}
        <div className="overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-12">
          
          {/* LEFT COLUMN: Contextual Commercial Info (5 Cols) */}
          <div className={`lg:col-span-5 p-6 sm:p-8 bg-gradient-to-br ${currentConfig.bgGradient} text-white flex flex-col justify-between relative overflow-hidden`}>
            
            {/* Ambient Lighting Background Accents */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#0B254B]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-6">
              
              {/* Category Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-blue-200 shadow-xs">
                <CategoryIcon className="w-4 h-4" />
                <span>{currentConfig.badge}</span>
              </div>

              {/* Main Heading in Portuguese */}
              <div>
                <span className="text-[11px] font-bold text-white/60 uppercase tracking-widest block mb-1">
                  Entre em Contacto Connosco
                </span>
                <h2 className="font-serif font-bold text-2xl sm:text-3xl text-white leading-tight">
                  {currentConfig.title}
                </h2>
              </div>

              {/* Contextual Paragraph Required by User */}
              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 text-white/90 text-sm leading-relaxed shadow-sm">
                <p className="italic font-medium">
                  "{currentConfig.description}"
                </p>
              </div>

              {/* Critical Explanation: Central Commercial Area Direct Submission */}
              <div className="p-4 rounded-2xl bg-black/40 backdrop-blur-md border border-[#0B254B]/40 text-xs space-y-2 text-white/80">
                <div className="flex items-center gap-2 font-bold text-blue-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Canal Oficial da Área Comercial Axofácil!</span>
                </div>
                <p className="leading-relaxed">
                  O seu pedido é enviado diretamente à <strong className="text-white">Área Comercial Central da Axofácil! Moçambique</strong> e não a uma loja isolada. 
                  A nossa equipa faz a triagem das melhores opções, negoceia os melhores preços com parceiros credenciados e acompanha todo o processo até à entrega.
                </p>
              </div>

              {/* Commitment Bullet Points */}
              <div className="space-y-2.5 pt-2 text-xs text-white/80">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <span>Resposta personalizada em até <strong>2 dias úteis</strong></span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <span>Cotações consolidadas em Meticais (MT) com fatura</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                    ✓
                  </div>
                  <span>Suporte direto via WhatsApp: <strong>+258 87 142 5316</strong></span>
                </div>
              </div>

            </div>

            {/* Bottom Contact Note */}
            <div className="relative z-10 pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-white/50">
              <span>axofacil@gmail.com</span>
              <span>Maputo, Moçambique</span>
            </div>

          </div>

          {/* RIGHT COLUMN: Form Area (7 Cols) */}
          <div className="lg:col-span-7 p-6 sm:p-8 bg-slate-50 flex flex-col justify-between">
            
            {!submittedInquiry ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                  <h3 className="font-serif font-bold text-xl text-slate-900 mb-1">
                    Preencha os Dados da Solicitação
                  </h3>
                  <p className="text-xs text-slate-500">
                    Todos os campos são essenciais para que os nossos consultores possam preparar uma resposta completa e assertiva.
                  </p>
                </div>

                {/* 1. Nome Completo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="ex: Carlos Alberto Sitoe"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#0B254B] focus:ring-2 focus:ring-[#0B254B]/20 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* 2. E-mail e Telefone em 2 Colunas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      E-mail de Contacto *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: cliente@empresa.co.mz"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#0B254B] focus:ring-2 focus:ring-[#0B254B]/20 outline-none transition-all shadow-2xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Telefone / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="ex: +258 84 123 4567"
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#0B254B] focus:ring-2 focus:ring-[#0B254B]/20 outline-none transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* 3. Departamento / Categoria de Interesse */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Departamento / Área de Interesse *
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:border-[#0B254B] focus:ring-2 focus:ring-[#0B254B]/20 outline-none transition-all shadow-2xs cursor-pointer"
                  >
                    {Object.values(CATEGORY_CONFIGS).map((cfg, cfgIdx) => (
                      <option key={`consult-cfg-opt-${cfg.id}-${cfgIdx}`} value={cfg.id}>
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 4. Título da Solicitação / Assunto ("Title on travels advisor details") */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Título da Solicitação / Assunto *
                  </label>
                  <input
                    type="text"
                    required
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                    placeholder={currentConfig.titlePlaceholder}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#0B254B] focus:ring-2 focus:ring-[#0B254B]/20 outline-none transition-all shadow-2xs"
                  />
                </div>

                {/* 5. Detalhes da Solicitação ("Advisor details") */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Detalhes da Solicitação para a Equipa Comercial *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder={currentConfig.detailsPlaceholder}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:border-[#0B254B] focus:ring-2 focus:ring-[#0B254B]/20 outline-none transition-all shadow-2xs resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 bg-[#0B254B] hover:bg-[#0c2e5c] text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>A registar solicitação na Área Comercial...</span>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-blue-200" />
                        <span>Enviar Solicitação à Área Comercial Axofácil!</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            ) : (
              /* Success Screen */
              <div className="py-6 px-4 flex flex-col items-center justify-center text-center space-y-5 my-auto animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-widest block mb-1">
                    Solicitação Recebida com Sucesso!
                  </span>
                  <h3 className="font-serif font-bold text-2xl text-slate-900">
                    Protocolo #{submittedInquiry.id}
                  </h3>
                </div>

                <div className="max-w-md w-full bg-white border border-slate-200 p-4 rounded-2xl text-left text-xs space-y-2 shadow-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Departamento:</span>
                    <span className="font-bold text-slate-800">{submittedInquiry.departmentLabel}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Cliente:</span>
                    <span className="font-bold text-slate-800">{submittedInquiry.fullName}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-500 font-medium">Assunto:</span>
                    <span className="font-bold text-slate-800 truncate max-w-[200px]">{submittedInquiry.title}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-slate-500">
                    <span>Prazo de Resposta:</span>
                    <span className="font-bold text-emerald-700">Até 2 dias úteis</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 max-w-md leading-relaxed">
                  A nossa equipa comercial já recebeu a sua solicitação e entrará em contacto através do e-mail <strong>{submittedInquiry.email}</strong> ou telefone <strong>{submittedInquiry.phone}</strong>.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md pt-2">
                  <a
                    href={`https://wa.me/258871425316?text=${encodeURIComponent(`Olá Área Comercial Axofácil! Enviei uma solicitação com o protocolo ${submittedInquiry.id} sobre: ${submittedInquiry.title}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>Falar no WhatsApp Comercial</span>
                  </a>

                  <button
                    onClick={onClose}
                    className="flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Concluir & Fechar
                  </button>
                </div>

                <button
                  onClick={handleReset}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Enviar outra solicitação
                </button>
              </div>
            )}

            {/* Bottom Form Security Notice */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
              <span>🔒 Dados protegidos pela Axofácil! Moçambique</span>
              <span>Atendimento Nacional</span>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
