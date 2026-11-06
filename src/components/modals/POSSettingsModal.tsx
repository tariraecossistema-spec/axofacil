import React, { useState, useEffect } from 'react';
import { Establishment } from '../../types/types';
import { 
  Settings, X, Store, User, Phone, Smartphone, Building2, 
  FileText, Check, AlertCircle, Save, Percent, MapPin, Hash, Sparkles,
  HelpCircle, RefreshCw, CreditCard
} from 'lucide-react';

export interface POSSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  establishment: Establishment;
  onSave: (updated: Establishment) => void;
  initialTab?: 'loja_titular' | 'pagamentos' | 'cliente' | 'recibo';
}

export const MOZ_BANKS = [
  'Millennium BIM',
  'BCI (Banco Comercial e de Investimentos)',
  'Standard Bank Moçambique',
  'Moza Banco',
  'Absa Bank Moçambique',
  'Nedbank Moçambique',
  'Access Bank Moçambique',
  'FNB Moçambique',
  'Banco Société Générale Moçambique',
  'Outro Banco'
];

export function POSSettingsModal({
  isOpen,
  onClose,
  establishment,
  onSave,
  initialTab = 'loja_titular'
}: POSSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<'loja_titular' | 'pagamentos' | 'cliente' | 'recibo'>(initialTab);
  const [showSavedToast, setShowSavedToast] = useState(false);

  // Form State - Store & Owner
  const [storeName, setStoreName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');
  const [nuit, setNuit] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Maputo');

  // Form State - Payments
  const [mpesaNumber, setMpesaNumber] = useState('');
  const [mpesaHolder, setMpesaHolder] = useState('');
  const [mpesaAccount, setMpesaAccount] = useState('');

  const [emolaNumber, setEmolaNumber] = useState('');
  const [emolaHolder, setEmolaHolder] = useState('');
  const [emolaAccount, setEmolaAccount] = useState('');

  const [bankName, setBankName] = useState('Millennium BIM');
  const [bankAccount, setBankAccount] = useState('');
  const [bankNib, setBankNib] = useState('');
  const [bankHolder, setBankHolder] = useState('');

  // Form State - Default Customer
  const [defaultCustomerName, setDefaultCustomerName] = useState('Consumidor Final');
  const [defaultCustomerPhone, setDefaultCustomerPhone] = useState('');
  const [defaultCustomerNuit, setDefaultCustomerNuit] = useState('');

  // Form State - Thermal Receipt & Taxes
  const [receiptFooterMsg, setReceiptFooterMsg] = useState('Obrigado pela preferência! Volte sempre.');
  const [defaultVatRate, setDefaultVatRate] = useState<number>(16);

  // Sync state with establishment on open or change
  useEffect(() => {
    if (isOpen) {
      if (initialTab) setActiveTab(initialTab);
      setStoreName(establishment.name || '');
      setOwnerName(establishment.ownerName || '');
      setContactPhone(establishment.contactPhone || '');
      setWhatsappLink(establishment.whatsappLink || '');
      setNuit(establishment.nuit || '400987123');
      setAddress(establishment.address || '');
      setCity(establishment.city || 'Maputo');

      // M-Pesa defaults
      setMpesaNumber(establishment.mpesaNumber || (establishment.contactPhone?.includes('84') || establishment.contactPhone?.includes('85') ? establishment.contactPhone : '+258 84 920 1820'));
      setMpesaHolder(establishment.mpesaHolder || establishment.ownerName || establishment.name || '');
      setMpesaAccount(establishment.mpesaAccount || 'Agente Balcão Principal');

      // e-Mola defaults
      setEmolaNumber(establishment.emolaNumber || (establishment.contactPhone?.includes('86') || establishment.contactPhone?.includes('87') ? establishment.contactPhone : '+258 86 319 4022'));
      setEmolaHolder(establishment.emolaHolder || establishment.ownerName || establishment.name || '');
      setEmolaAccount(establishment.emolaAccount || 'Agente Balcão Principal');

      // Bank defaults
      setBankName(establishment.bankName || 'Millennium BIM');
      setBankAccount(establishment.bankAccount || '00012398471');
      setBankNib(establishment.bankNib || '0001 0000 1239 8471 001 23');
      setBankHolder(establishment.bankHolder || establishment.ownerName || establishment.name || '');

      // Customer defaults
      setDefaultCustomerName(establishment.defaultCustomerName || 'Consumidor Final');
      setDefaultCustomerPhone(establishment.defaultCustomerPhone || '');
      setDefaultCustomerNuit(establishment.defaultCustomerNuit || '');

      // Receipt defaults
      setReceiptFooterMsg(establishment.receiptFooterMsg || 'Obrigado pela preferência! Volte sempre.');
      setDefaultVatRate(establishment.defaultVatRate ?? 16);
    }
  }, [isOpen, initialTab, establishment]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updated: Establishment = {
      ...establishment,
      name: storeName.trim() || establishment.name,
      ownerName: ownerName.trim(),
      contactPhone: contactPhone.trim() || establishment.contactPhone,
      whatsappLink: whatsappLink.trim() || establishment.whatsappLink,
      nuit: nuit.trim() || establishment.nuit,
      address: address.trim() || establishment.address,
      city: city.trim() || establishment.city,

      // Payments
      mpesaNumber: mpesaNumber.trim(),
      mpesaHolder: mpesaHolder.trim(),
      mpesaAccount: mpesaAccount.trim(),

      emolaNumber: emolaNumber.trim(),
      emolaHolder: emolaHolder.trim(),
      emolaAccount: emolaAccount.trim(),

      bankName: bankName.trim(),
      bankAccount: bankAccount.trim(),
      bankNib: bankNib.trim(),
      bankHolder: bankHolder.trim(),

      // Customer
      defaultCustomerName: defaultCustomerName.trim(),
      defaultCustomerPhone: defaultCustomerPhone.trim(),
      defaultCustomerNuit: defaultCustomerNuit.trim(),

      // Receipt
      receiptFooterMsg: receiptFooterMsg.trim(),
      defaultVatRate: Number(defaultVatRate) || 0
    };

    onSave(updated);
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
      onClose();
    }, 900);
  };

  // Quick auto-fill helper: copy owner name to payment holders
  const handleCopyOwnerToHolders = () => {
    if (ownerName.trim()) {
      setMpesaHolder(ownerName.trim());
      setEmolaHolder(ownerName.trim());
      setBankHolder(ownerName.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white border border-ink/15 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Configurações do Balcão
                </span>
                <span className="text-xs text-slate-400 font-medium">POS Offline-First</span>
              </div>
              <h3 className="font-serif font-bold text-base sm:text-lg text-white mt-0.5">
                {establishment.name}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            title="Fechar Configurações (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Strip */}
        <div className="bg-slate-100 border-b border-ink/10 px-4 sm:px-6 pt-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('loja_titular')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === 'loja_titular'
                ? 'bg-white text-indigo-deep border-ink/15 -mb-px shadow-xs'
                : 'bg-transparent text-ink/60 border-transparent hover:text-ink'
            }`}
          >
            <User className="w-3.5 h-3.5 text-amber-600" />
            <span>Titular & Loja</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pagamentos')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === 'pagamentos'
                ? 'bg-white text-indigo-deep border-ink/15 -mb-px shadow-xs'
                : 'bg-transparent text-ink/60 border-transparent hover:text-ink'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-rose-600" />
            <span>Contas de Pagamento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cliente')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === 'cliente'
                ? 'bg-white text-indigo-deep border-ink/15 -mb-px shadow-xs'
                : 'bg-transparent text-ink/60 border-transparent hover:text-ink'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            <span>Dados do Cliente</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recibo')}
            className={`py-2 px-3.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border-t border-x ${
              activeTab === 'recibo'
                ? 'bg-white text-indigo-deep border-ink/15 -mb-px shadow-xs'
                : 'bg-transparent text-ink/60 border-transparent hover:text-ink'
            }`}
          >
            <Percent className="w-3.5 h-3.5 text-indigo-600" />
            <span>Recibo & IVA</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          
          {/* TAB 1: LOJA & TITULAR */}
          {activeTab === 'loja_titular' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-amber-950">
                <User className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Identificação do Titular e da Loja</h4>
                  <p className="text-[11px] text-amber-900/80 mt-0.5">
                    O nome e telefone do titular configurados aqui serão utilizados nos pagamentos por carteira móvel (M-Pesa, e-Mola), nas transferências bancárias e nos cabeçalhos das faturas do balcão.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block font-bold text-ink/80 mb-1">
                    Nome Comercial da Loja / Estabelecimento:
                  </label>
                  <div className="relative">
                    <Store className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      required
                      placeholder="ex: Mercearia & Supermercado Central"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-indigo-deep mb-1 flex items-center justify-between">
                    <span>Nome do Titular / Proprietário:</span>
                    <span className="text-[10px] text-amber-600 font-semibold">*Principal</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-indigo-brand absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="ex: Carlos Alberto Mondlane"
                      className="w-full pl-9 pr-3 py-2 bg-indigo-50/40 border border-indigo-200 rounded-xl text-xs font-bold text-indigo-deep outline-none focus:border-indigo-brand focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-ink/50 block mt-0.5">
                    Nome que os clientes verão como destinatário da transferência.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1 flex items-center justify-between">
                    <span>Número de Telefone do Titular:</span>
                    <span className="text-[10px] text-amber-600 font-semibold">*Principal</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="ex: +258 84 920 1820"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-ink/50 block mt-0.5">
                    Número oficial para contacto e suporte ao cliente.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    WhatsApp Comercial do Titular / Loja:
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={whatsappLink}
                      onChange={(e) => setWhatsappLink(e.target.value)}
                      placeholder="ex: +258 84 920 1820"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    NUIT da Empresa / Loja:
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={nuit}
                      onChange={(e) => setNuit(e.target.value)}
                      placeholder="ex: 400987123"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-mono font-bold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    Endereço / Localização da Loja:
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="ex: Av. 24 de Julho nº 1820, Maputo"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    Cidade / Província:
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="ex: Cidade de Maputo"
                    className="w-full px-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-indigo-brand focus:bg-white"
                  />
                </div>
              </div>

              {ownerName.trim() && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleCopyOwnerToHolders}
                    className="py-1.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Copiar "{ownerName}" para titular do M-Pesa, e-Mola e Conta Bancária</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CONTAS DE PAGAMENTO & TRANSFERÊNCIAS */}
          {activeTab === 'pagamentos' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-rose-950">
                <Smartphone className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Contas para Transferências e Pagamentos</h4>
                  <p className="text-[11px] text-rose-900/80 mt-0.5">
                    Estes são os dados de conta que o balcão exibe na tela para o cliente efetuar a transferência manual (M-Pesa, e-Mola ou Transferência Bancária).
                  </p>
                </div>
              </div>

              {/* M-PESA CARD */}
              <div className="border border-rose-200 bg-rose-50/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-rose-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
                    <h5 className="font-bold text-rose-950 text-xs flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-rose-600" />
                      <span>Vodacom M-Pesa (Moçambique)</span>
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                    Carteira Móvel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Nº M-Pesa da Loja:
                    </label>
                    <input
                      type="text"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="ex: +258 84 920 1820"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-mono font-bold text-xs text-ink outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Titular da Conta M-Pesa:
                    </label>
                    <input
                      type="text"
                      value={mpesaHolder}
                      onChange={(e) => setMpesaHolder(e.target.value)}
                      placeholder="ex: Carlos A. Mondlane / Mercearia Central"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-bold text-xs text-ink outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Código de Agente / Sub-Conta:
                    </label>
                    <input
                      type="text"
                      value={mpesaAccount}
                      onChange={(e) => setMpesaAccount(e.target.value)}
                      placeholder="ex: Agente 109283 / Caixa 1"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl text-xs text-ink outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* E-MOLA CARD */}
              <div className="border border-amber-200 bg-amber-50/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                    <h5 className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                      <span>Movitel e-Mola (Moçambique)</span>
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                    Carteira Móvel
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Nº e-Mola da Loja:
                    </label>
                    <input
                      type="text"
                      value={emolaNumber}
                      onChange={(e) => setEmolaNumber(e.target.value)}
                      placeholder="ex: +258 86 319 4022"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-mono font-bold text-xs text-ink outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Titular da Conta e-Mola:
                    </label>
                    <input
                      type="text"
                      value={emolaHolder}
                      onChange={(e) => setEmolaHolder(e.target.value)}
                      placeholder="ex: Carlos A. Mondlane / Mercearia Central"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-bold text-xs text-ink outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Código de Agente / Sub-Conta:
                    </label>
                    <input
                      type="text"
                      value={emolaAccount}
                      onChange={(e) => setEmolaAccount(e.target.value)}
                      placeholder="ex: Agente EM-8812 / Caixa 1"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl text-xs text-ink outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* TRANSFERÊNCIA BANCÁRIA CARD */}
              <div className="border border-blue-200 bg-blue-50/30 rounded-2xl p-3.5 space-y-3">
                <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <h5 className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>Transferência Bancária (Contas Moçambique)</span>
                    </h5>
                  </div>
                  <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                    Bancos Comerciais
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Banco Principal:
                    </label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-bold text-xs text-ink outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {MOZ_BANKS.map((b, bIdx) => (
                        <option key={`bank-opt-${b}-${bIdx}`} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Titular da Conta Bancária:
                    </label>
                    <input
                      type="text"
                      value={bankHolder}
                      onChange={(e) => setBankHolder(e.target.value)}
                      placeholder="ex: Carlos Alberto Mondlane E.I."
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-bold text-xs text-ink outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      Número da Conta Bancária:
                    </label>
                    <input
                      type="text"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="ex: 00012398471"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-mono font-bold text-xs text-ink outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-ink/70 mb-1">
                      NIB (Número de Identificação Bancária - 21 dígitos):
                    </label>
                    <input
                      type="text"
                      value={bankNib}
                      onChange={(e) => setBankNib(e.target.value)}
                      placeholder="ex: 0001 0000 1239 8471 001 23"
                      className="w-full p-2 bg-white border border-ink/15 rounded-xl font-mono font-bold text-xs text-ink outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DADOS DE CONTA DO CLIENTE */}
          {activeTab === 'cliente' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-950">
                <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Dados de Conta do Cliente de Balcão</h4>
                  <p className="text-[11px] text-emerald-900/80 mt-0.5">
                    Defina aqui os dados de cliente padrão ou recorrente para o balcão de vendas. Ao salvar, esses dados passam a ser pré-carregados automaticamente para agilizar a emissão da venda.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <label className="block font-bold text-ink/80 mb-1">
                    Nome Padrão do Cliente de Balcão:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultCustomerName}
                      onChange={(e) => setDefaultCustomerName(e.target.value)}
                      placeholder="ex: Consumidor Final ou Nome do Cliente Frequente"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-bold text-ink outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                  <span className="text-[10px] text-ink/50 block mt-0.5">
                    Por padrão: "Consumidor Final" para vendas rápidas sem registo prévio.
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    Telefone Padrão do Cliente (+258):
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultCustomerPhone}
                      onChange={(e) => setDefaultCustomerPhone(e.target.value)}
                      placeholder="ex: +258 84 123 4567"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    NUIT Padrão do Cliente (para Faturação):
                  </label>
                  <div className="relative">
                    <Hash className="w-4 h-4 text-ink/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={defaultCustomerNuit}
                      onChange={(e) => setDefaultCustomerNuit(e.target.value)}
                      placeholder="ex: 999999999 ou NUIT fiscal"
                      className="w-full pl-9 pr-3 py-2 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-mono font-bold text-ink outline-none focus:border-emerald-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-sand-2/40 border border-ink/10 rounded-xl p-3 text-[11px] text-ink/70">
                <span className="font-bold text-ink block mb-0.5">💡 Agilidade no Atendimento:</span>
                Durante o atendimento no balcão de vendas, o operador pode manter o "Consumidor Final" ou digitar o nome/telefone específico do cliente em qualquer venda sem perder as configurações padrão.
              </div>
            </div>
          )}

          {/* TAB 4: RECIBO & IVA */}
          {activeTab === 'recibo' && (
            <div className="space-y-3.5 animate-fadeIn">
              <div className="bg-indigo-50/70 border border-indigo-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-indigo-950">
                <Percent className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">Configuração de Impostos & Recibo Térmico</h4>
                  <p className="text-[11px] text-indigo-900/80 mt-0.5">
                    Ajuste a taxa de IVA padrão aplicada às vendas e personalize a mensagem de rodapé impressa nos recibos e enviada aos clientes por WhatsApp.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-ink/80 mb-1">
                    Taxa Padrão de IVA (%):
                  </label>
                  <select
                    value={defaultVatRate}
                    onChange={(e) => setDefaultVatRate(Number(e.target.value))}
                    className="w-full p-2 bg-white border border-ink/15 rounded-xl font-bold text-xs text-ink outline-none focus:border-indigo-brand cursor-pointer"
                  >
                    <option value={16}>16% - IVA Normal Moçambique (Regime Geral)</option>
                    <option value={0}>0% - Isento de IVA (Regime Simplificado / Isenção)</option>
                  </select>
                </div>

                <div className="col-span-1 sm:col-span-2">
                  <label className="block font-bold text-ink/80 mb-1">
                    Mensagem de Rodapé do Recibo Térmico:
                  </label>
                  <textarea
                    rows={2}
                    value={receiptFooterMsg}
                    onChange={(e) => setReceiptFooterMsg(e.target.value)}
                    placeholder="ex: Obrigado pela preferência! Volte sempre ao nosso balcão."
                    className="w-full p-2.5 bg-sand-2/30 border border-ink/15 rounded-xl text-xs font-semibold text-ink outline-none focus:border-indigo-brand focus:bg-white resize-none"
                  />
                  <span className="text-[10px] text-ink/50 block mt-0.5">
                    Esta mensagem será impressa no final do talão e enviada na partilha de recibos.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification */}
          {showSavedToast && (
            <div className="p-3 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 animate-fadeIn shadow-md">
              <Check className="w-4 h-4" />
              <span>Configurações atualizadas e aplicadas com sucesso a todas as telas do balcão!</span>
            </div>
          )}

          {/* Action Buttons Footer */}
          <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-sand-2/60 hover:bg-sand-2 text-ink/80 font-bold text-xs rounded-xl cursor-pointer transition-all border border-ink/15"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="py-2.5 px-5 bg-amber-500 hover:bg-amber-400 active:scale-98 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-2 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configurações</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
