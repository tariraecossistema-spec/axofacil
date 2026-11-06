import React, { useState } from 'react';
import { 
  X, HelpCircle, ShieldCheck, Search, MessageCircle, Truck, 
  CreditCard, Store, Phone, Mail, ExternalLink, ChevronDown, 
  ChevronUp, CheckCircle2, ArrowRight, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HelpCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateHomeAndScroll?: (sectionId: string) => void;
  onNavigatePage?: (page: string) => void;
}

export default function HelpCenterModal({
  isOpen,
  onClose,
  onNavigateHomeAndScroll,
  onNavigatePage
}: HelpCenterModalProps) {
  const [activeTab, setActiveTab] = useState<'como-funciona' | 'faq' | 'seguranca' | 'contacto'>('como-funciona');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  if (!isOpen) return null;

  const faqs = [
    {
      q: 'O que é a plataforma AXOFÁCIL! Moçambique?',
      a: 'O AXOFÁCIL! é o directório e marketplace comercial digital de referência para Maputo e Matola. Conectamos consumidores diretamente a lojas de retalho, supermercados, materiais de construção, peças automóveis, hotéis, bares, turismo e serviços de fretes rápidos sem intermediários nem comissões sobre os produtos.'
    },
    {
      q: 'Como faço um pedido ou compro um produto?',
      a: 'Pode navegar pelo catálogo por categoria ou zona, escolher os itens e clicar no botão WhatsApp da loja ou fechar pelo carrinho. A conversa abre com a referência e foto do produto para confirmar disponibilidade, tamanhos, entrega e efetuar o pagamento.'
    },
    {
      q: 'Quais são os métodos de pagamento aceites?',
      a: 'Os pagamentos são efetuados diretamente às contas oficiais dos estabelecimentos via M-Pesa, e-Mola, transferência bancária (BIM, BCI, Standard Bank) ou pagamento presencial no levantamento/entrega.'
    },
    {
      q: 'Como funcionam as entregas e fretes?',
      a: 'Cada loja dispõe de acordos próprios com estafetas de mota ou carrinhas de frete. Também pode aceder à secção "Entregadores & Fretes" no menu para contactar diretamente motoristas verificados para transportar encomendas pesadas ou ligeiras.'
    },
    {
      q: 'Sou comerciante: como posso registar a minha loja ou negócio?',
      a: 'Basta clicar no botão "Criar" ou "Entrar" no topo da página, escolher a opção "Registar Empresa / Loja" e preencher os dados do seu estabelecimento. Após ativação do plano, terá acesso ao painel de gestão de catálogo, preços, promoções e controlo de inventário.'
    },
    {
      q: 'Existe alguma comissão cobrada sobre as minhas vendas?',
      a: 'Não! O AXOFÁCIL! opera com modelo de subscrição mensal transparente. Não retemos qualquer percentagem sobre as vendas efetuadas entre comerciantes e clientes.'
    }
  ];

  const handleScrollToHowItWorks = () => {
    onClose();
    if (onNavigateHomeAndScroll) {
      onNavigateHomeAndScroll('estabelecimentos');
    } else if (onNavigatePage) {
      onNavigatePage('home');
      setTimeout(() => {
        const el = document.getElementById('estabelecimentos');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Modal Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="relative bg-white w-full max-w-3xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 my-auto flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="bg-[#0B254B] text-white p-5 sm:p-6 flex items-center justify-between border-b border-blue-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-[#0B254B] flex items-center justify-center font-bold shadow-xs shrink-0">
              <HelpCircle className="w-5 h-5 text-[#0B254B]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-blue-200 uppercase tracking-wider">
                  Apoio & Informação
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  Oficial
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold font-sans text-white tracking-tight">
                Central de Ajuda AXOFÁCIL!
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Fechar Central de Ajuda"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-slate-200 bg-slate-50/80 overflow-x-auto scrollbar-none shrink-0 text-xs font-bold">
          <button
            onClick={() => setActiveTab('como-funciona')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'como-funciona'
                ? 'bg-[#15243f] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Como Funciona</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'faq'
                ? 'bg-[#15243f] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Perguntas Frequentes (FAQ)</span>
          </button>

          <button
            onClick={() => setActiveTab('seguranca')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'seguranca'
                ? 'bg-[#15243f] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Segurança Comercial</span>
          </button>

          <button
            onClick={() => setActiveTab('contacto')}
            className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'contacto'
                ? 'bg-[#15243f] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Contactos & Apoio</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-slate-700">
          {/* TAB 1: COMO FUNCIONA */}
          {activeTab === 'como-funciona' && (
            <div className="space-y-6">
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    O Directório Comercial de Maputo & Matola
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-lg leading-relaxed">
                    Pesquise produtos, consulte preços em Meticais (MT) e contacte os comerciantes diretamente pelo WhatsApp sem taxas de intermediação.
                  </p>
                </div>
                <button
                  onClick={handleScrollToHowItWorks}
                  className="px-3.5 py-2 bg-[#0B254B] hover:bg-[#061833] text-white text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center gap-1.5 shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  <span>Explorar Directório</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0B254B] text-white flex items-center justify-center font-black text-xs">
                      01
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Explore Lojas e Produtos
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Navegue por Lojas de Moda, Auto Peças, Supermercados, Materiais de Construção, Bares, Hotéis ou Turismo em Maputo e Matola.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block">
                    ✓ Catálogo com Preços em MT
                  </div>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-black text-xs">
                      02
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Contacto Direto via WhatsApp
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Converse instantaneamente com os gerentes e vendedores para tirar dúvidas sobre tamanhos, cores, stock e entregas.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 inline-block">
                    ✓ Negociação Sem Intermediários
                  </div>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-lg bg-[#0B254B] text-white flex items-center justify-center font-black text-xs">
                      03
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Pagamento & Entrega Rápida
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Pague via M-Pesa, e-Mola ou transferência bancária e receba por estafeta local ou levante no estabelecimento.
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-1 rounded-md border border-blue-200 inline-block">
                    ✓ M-Pesa / e-Mola / BIM
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 mb-2">
                Respostas rápidas às dúvidas mais comuns de clientes e parceiros comerciais:
              </p>
              {faqs.map((item, index) => {
                const isExpanded = expandedFaq === index;
                return (
                  <div 
                    key={index}
                    className="border border-slate-200 rounded-2xl overflow-hidden transition-all bg-white"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : index)}
                      className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-900">
                        {item.q}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#0B254B] shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: SEGURANÇA */}
          {activeTab === 'seguranca' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    Directrizes para Comércio Seguro em Moçambique
                  </h4>
                  <p className="text-xs text-emerald-900/80 mt-1 leading-relaxed">
                    O directório AXOFÁCIL! valida perfis comerciais e fornece canais oficiais de contacto. Recomendamos sempre seguir as boas práticas ao negociar.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Confirmação de Titular</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Ao efetuar transferências M-Pesa ou e-Mola, confirme sempre o nome do titular exibido na mensagem USSD antes de introduzir o PIN.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lojas Físicas & Verificação</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    A maioria dos estabelecimentos registados possui ponto de venda físico em Maputo ou Matola indicado com mapa no perfil da loja.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Recibos & Comprovativos</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Guarde o SMS do operador de pagamentos móveis com a referência da transação como prova de pagamento junto do comerciante.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1.5">
                  <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Canal de Denúncias</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Caso detete alguma irregularidade em qualquer catálogo, reporte imediatamente à equipa de administração do AXOFÁCIL! para suspensão preventiva.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACTOS */}
          {activeTab === 'contacto' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                  Canais Oficiais de Suporte e Parcerias
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  A nossa equipa está disponível para apoiar utilizadores e empresas na adesão, gestão de catálogos e suporte técnico.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <a
                    href="https://wa.me/258841234567?text=Ol%C3%A1%2C%20gostaria%20de%20ajuda%20sobre%20o%20portal%20Axofácil!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-950 transition-colors cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div className="text-left">
                      <div className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">
                        WhatsApp Suporte
                      </div>
                      <div className="text-xs font-bold">+258 84 123 4567</div>
                    </div>
                  </a>

                  <a
                    href="mailto:tarira.ecossistema@gmail.com"
                    className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-2.5 text-indigo-950 transition-colors cursor-pointer"
                  >
                    <Mail className="w-5 h-5 text-indigo-600 shrink-0" />
                    <div className="text-left">
                      <div className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">
                        Email Institucional
                      </div>
                      <div className="text-xs font-bold truncate">tarira.ecossistema@gmail.com</div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#0B254B] shrink-0" />
                <span>Horário de Atendimento Comercial: Segunda a Sábado, das 08h às 18h (GMT+2).</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
          <div className="text-slate-500 text-[11px] text-center sm:text-left">
            AXOFÁCIL! Moçambique — Desenvolvido por Tarira Studio
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-[#0B254B] hover:bg-[#061833] text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            Compreendido / Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
