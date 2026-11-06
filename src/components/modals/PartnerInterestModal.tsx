import React, { useState } from 'react';
import { X, Building2, CheckCircle2, Phone, Mail, MapPin, Send, MessageSquare, Briefcase } from 'lucide-react';
import { recordAdminAction } from '../../services/adminAuditStore';
import { notify } from '../../services/dialogs';

interface PartnerInterestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnerInterestModal({ isOpen, onClose }: PartnerInterestModalProps) {
  const [businessName, setBusinessName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('loja');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !managerName.trim() || !phone.trim()) {
      notify('Por favor preencha os campos obrigatórios (Nome do Negócio, Responsável e Contacto).', 'error');
      return;
    }

    setIsSubmitting(true);

    try {
      const detailsText = `Estabelecimento: ${businessName} | Responsável: ${managerName} | Categoria: ${category} | Zona: ${location || 'Maputo/Matola'} | Notas: ${notes || 'Sem observações adicionais.'}`;

      recordAdminAction({
        type: 'interesse_parceiro',
        title: `Candidatura de Parceiro Comercial: ${businessName}`,
        userName: `${managerName} · ${businessName}`,
        userContact: phone,
        userEmail: email.trim() || undefined,
        categoryOrSegment: 'parceiro',
        details: detailsText,
        metadata: {
          businessName,
          managerName,
          category,
          location,
          notes,
          submissionOrigin: 'LandingPage_PartnerInterestModal'
        }
      });

      setIsSubmitted(true);
      notify('Candidatura submetida com sucesso! A equipa comercial entrará em contacto.', 'success');
    } catch (err) {
      console.error('Erro ao submeter interesse:', err);
      notify('Ocorreu um erro ao submeter. Por favor tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setBusinessName('');
    setManagerName('');
    setPhone('');
    setEmail('');
    setLocation('');
    setNotes('');
    onClose();
  };

  const whatsappMessage = encodeURIComponent(
    `Olá Equipa Comercial Axofácil! Gostaria de candidatar o meu estabelecimento comercial como parceiro na plataforma.\n\n*Estabelecimento:* ${businessName}\n*Responsável:* ${managerName}\n*Contacto:* ${phone}\n*Categoria:* ${category}\n*Localização:* ${location || 'Maputo'}`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
        
        {/* Botão Fechar */}
        <button 
          onClick={handleResetAndClose}
          type="button"
          aria-label="Fechar"
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {!isSubmitted ? (
          <div>
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-[#0B254B] text-white flex items-center justify-center shadow-sm">
                <Briefcase className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#103B75] bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-full">
                  Equipa Comercial Axofácil!
                </span>
                <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900 mt-0.5">
                  Seja Nosso Parceiro Comercial
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-5">
              Não precisa de criar login ou conta agora. Registe a manifestação de interesse do seu negócio e a nossa equipa comercial fará a validação e inclusão oficial da sua loja, bar, hospedagem ou estaleiro no directório.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Nome do Estabelecimento */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-[#103B75]" />
                  <span>Nome do Estabelecimento / Empresa Comercial *</span>
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Supermercado Polana, Ferragens Matola, etc."
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none transition-all"
                />
              </div>

              {/* Responsável e Contacto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nome do Responsável / Gerente *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: Carlos Manhiça"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3 text-[#103B75]" />
                    <span>WhatsApp / Telemóvel *</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: 84 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Categoria e Localização */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Categoria Comercial *
                  </label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none transition-all cursor-pointer"
                  >
                    <option value="loja">🛍️ Loja de Retalho & Moda</option>
                    <option value="supermercado">🛒 Supermercado & Mercearia</option>
                    <option value="bar">🍽️ Bar, Lounge & Restaurante</option>
                    <option value="hospedagem">🏨 Hotel & Hospedagem</option>
                    <option value="construcao">🧱 Materiais de Construção & Estaleiro</option>
                    <option value="pecas_auto">🚗 Peças Auto & Oficina</option>
                    <option value="turismo">🧭 Turismo, Safáris & Viagens</option>
                    <option value="outro">📦 Outro Segmento Comercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#103B75]" />
                    <span>Província / Bairro *</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="ex: Maputo - Baixa ou Matola"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none transition-all"
                  />
                </div>
              </div>

              {/* Email opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-[#103B75]" />
                  <span>E-mail Corporativo (Opcional)</span>
                </label>
                <input 
                  type="email" 
                  placeholder="comercial@empresa.co.mz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none transition-all"
                />
              </div>

              {/* Mensagem / Proposta */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                  <MessageSquare className="w-3 h-3 text-[#103B75]" />
                  <span>Resumo do Negócio & O Que Gostaria de Divulgar</span>
                </label>
                <textarea 
                  rows={3}
                  placeholder="ex: Temos 2 lojas físicas de vestuário e calçado na Baixa e gostaríamos de divulgar catálogo de promoções e aceitar encomendas via Axofácil!..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-[#103B75] focus:ring-1 focus:ring-[#103B75] outline-none resize-none transition-all"
                />
              </div>

              {/* Botão Submeter */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-6 bg-[#103B75] hover:bg-[#0B254B] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? 'A Enviar Manifestação...' : 'Submeter Manifestação de Interesse'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* Tela de Sucesso */
          <div className="text-center py-4 space-y-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="font-serif font-bold text-xl sm:text-2xl text-slate-900">
                Manifestação Recebida com Sucesso!
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
                O registo de <strong>{businessName}</strong> foi adicionado à central da nossa equipa comercial. Entraremos em contacto pelo telefone <strong>{phone}</strong> para validação e ativação da vitrine no portal Axofácil!.
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/258849547076?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto py-3 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Falar com o Comercial no WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full sm:w-auto py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
