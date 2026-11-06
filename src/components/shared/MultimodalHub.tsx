import React, { useState } from 'react';
import { 
  Plane, Bus, Ship, Building2, Users, QrCode, ShieldCheck, 
  MapPin, Clock, ArrowRight, Sparkles, CheckCircle2, Ticket,
  Smartphone, Share2, Printer, HeartHandshake, Compass, Luggage, X
} from 'lucide-react';
import { notify } from "../../services/dialogs";

export interface MultimodalPackage {
  id: string;
  title: string;
  destination: string;
  region: string;
  tag: string;
  rating: number;
  duration: string;
  priceMT: number;
  originalPriceMT: number;
  image: string;
  segments: {
    type: 'flight' | 'transfer' | 'boat' | 'lodge' | 'guide';
    title: string;
    details: string;
    operator: string;
    time: string;
  }[];
  includes: string[];
}

const MULTIMODAL_PACKAGES: MultimodalPackage[] = [
  {
    id: 'multi-ponta-ouro',
    title: 'Maputo ⇄ Ponta do Ouro Safari & Beach SuperPass',
    destination: 'Ponta do Ouro & Reserva Especial de Maputo',
    region: 'Sul de Moçambique',
    tag: 'Mais Popular · Tudo Incluído',
    rating: 4.9,
    duration: '3 Dias / 2 Noites',
    priceMT: 18500,
    originalPriceMT: 23000,
    image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1000&q=80',
    segments: [
      {
        type: 'flight',
        title: 'Voo até Maputo (MPM)',
        details: 'Chegada ao Aeroporto Internacional de Maputo com assistência de acolhimento VIP na manga.',
        operator: 'LAM Moçambique / Airlink',
        time: '08:30'
      },
      {
        type: 'transfer',
        title: 'Transfer 4x4 Expresso Climatizado',
        details: 'Travessia da Ponte Maputo-Katembe e Estrada R200 com ar condicionado e Wi-Fi até à Ponta.',
        operator: 'Frota Oficial Axofácil! Turismo',
        time: '10:00 (1h45m)'
      },
      {
        type: 'lodge',
        title: 'Estadia em Eco-Lodge Frente ao Mar',
        details: '2 Noites com Pequeno Almoço tropical incluído e acesso direto à praia.',
        operator: 'Ponta Beach & Dive Lodge',
        time: 'Check-in 14:00'
      },
      {
        type: 'guide',
        title: 'Mergulho com Golfinhos & Safari de Elefantes',
        details: 'Guia marinho biólogo certificado e safari 4x4 na Reserva Especial de Maputo.',
        operator: 'Dolphin Care Africa + Guia Axofácil!',
        time: 'Dia 2 (Manhã)'
      }
    ],
    includes: [
      'Transporte 4x4 ida e volta porta-a-porta',
      '2 Noites de Hospedagem',
      'Entrada na Reserva Especial de Elefantes',
      'Mergulho com equipamento e guia',
      'Seguro de Viagem & Assistência 24/7'
    ]
  },
  {
    id: 'multi-bazaruto-vilankulo',
    title: 'Maputo ⇄ Arquipélago de Bazaruto & Ilha de Benguerra',
    destination: 'Bazaruto, Ilha de Santa Carolina & Vilankulo',
    region: 'Inhambane / Costa Tropical',
    tag: 'Exclusivo · Safari Marinho',
    rating: 5.0,
    duration: '4 Dias / 3 Noites',
    priceMT: 42000,
    originalPriceMT: 51000,
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
    segments: [
      {
        type: 'flight',
        title: 'Voo Maputo (MPM) ⇄ Vilankulo (VNX)',
        details: 'Voo direto em Embraer 145 / Dash 8 com franquia de 23kg bagagem porão incluída.',
        operator: 'LAM Moçambique (TM140)',
        time: '09:15 (1h10m)'
      },
      {
        type: 'boat',
        title: 'Lancha Rápida Marina Vilankulo ⇄ Benguerra',
        details: 'Travessia de lancha rápida com coletes salva-vidas e bebidas tropicais de boas-vindas.',
        operator: 'Bazaruto Boat Escapes',
        time: '11:00 (35min)'
      },
      {
        type: 'lodge',
        title: 'Bungalow de Praia em Vilankulo / Ilha',
        details: '3 Noites com pequeno-almoço e jantar marisqueiro com lagosta e camarão fresco.',
        operator: 'Vilankulo Ocean View Resort',
        time: 'Check-in 12:30'
      },
      {
        type: 'guide',
        title: 'Expedição aos Corais & Observação de Dugongos',
        details: 'Snorkeling no Two Mile Reef com guia aquático especializado.',
        operator: 'Marine Heritage Mozambique',
        time: 'Dia 2 & Dia 3'
      }
    ],
    includes: [
      'Passagem aérea ida e volta com taxas',
      'Todos os barcos e transfers terrestres',
      '3 Noites de alojamento',
      'Taxas do Parque Nacional Marinho de Bazaruto',
      'Equipamento de mergulho e piquenique nas dunas'
    ]
  },
  {
    id: 'multi-gorongosa-safari',
    title: 'Maputo ⇄ Safari Selvagem no Parque Nacional da Gorongosa',
    destination: 'Gorongosa & Beira',
    region: 'Sofala / Centro de Moçambique',
    tag: 'Aventura & Vida Selvagem',
    rating: 4.9,
    duration: '3 Dias / 2 Noites',
    priceMT: 34500,
    originalPriceMT: 40000,
    image: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1000&q=80',
    segments: [
      {
        type: 'flight',
        title: 'Voo Maputo (MPM) ⇄ Beira (BEW)',
        details: 'Voo matinal até à Beira com bilhete eletrónico sincronizado.',
        operator: 'LAM Moçambique',
        time: '07:00 (1h20m)'
      },
      {
        type: 'transfer',
        title: 'Expedição 4x4 Beira ⇄ Chitengo Gorongosa',
        details: 'Veículo 4x4 adaptado para safari com teto panorâmico aberto.',
        operator: 'Gorongosa Expedition Shuttle',
        time: '09:00 (2h30m)'
      },
      {
        type: 'lodge',
        title: 'Montebelo Gorongosa Safari Camp',
        details: 'Chalés de luxo na savana cercados de leões, elefantes e antílopes raros.',
        operator: 'Montebelo Gorongosa',
        time: 'Check-in 12:00'
      },
      {
        type: 'guide',
        title: '2 Game Drives com Rangers & Visita aos Leões',
        details: 'Acompanhamento por biólogos e rastreadores do Parque.',
        operator: 'Gorongosa Restoration Project Guides',
        time: 'Nascer e Pôr do Sol'
      }
    ],
    includes: [
      'Voos ida e volta Maputo-Beira',
      'Transfers 4x4 privativos',
      'Alojamento em pensão completa',
      'Taxas de conservação do Parque',
      'Dois Safaris Game Drives diários'
    ]
  },
  {
    id: 'multi-ilha-mocambique',
    title: 'Maputo ⇄ Património Mundial da Ilha de Moçambique',
    destination: 'Ilha de Moçambique & Nampula',
    region: 'Norte de Moçambique',
    tag: 'Cultura & História UNESCO',
    rating: 4.8,
    duration: '3 Dias / 2 Noites',
    priceMT: 29000,
    originalPriceMT: 35000,
    image: 'https://images.unsplash.com/photo-1548625361-165b48cb943d?auto=format&fit=crop&w=1000&q=80',
    segments: [
      {
        type: 'flight',
        title: 'Voo Maputo (MPM) ⇄ Nampula (APL)',
        details: 'Voo doméstico com assistência no terminal de Nampula.',
        operator: 'LAM Moçambique',
        time: '11:20 (2h10m)'
      },
      {
        type: 'transfer',
        title: 'Minibus VIP Nampula ⇄ Ponte da Ilha',
        details: 'Viagem panorâmica através dos inselbergs de Nampula e Monapo.',
        operator: 'Axofácil! Norte Expresso',
        time: '14:00 (2h00m)'
      },
      {
        type: 'lodge',
        title: 'Pousada Histórica na Cidade de Pedra e Cal',
        details: 'Edifício colonial restaurado do século XVIII com pátio árabe.',
        operator: 'Casa de Pedra Boutique Hotel',
        time: 'Check-in 16:30'
      },
      {
        type: 'guide',
        title: 'Passeio Guiado: Fortaleza de São Sebastião & Capela de N. Sra do Baluarte',
        details: 'Historiador local e passeio tradicional em dhow à vela.',
        operator: 'Guias Nativos da Ilha de Moçambique',
        time: 'Dia 2'
      }
    ],
    includes: [
      'Voos ida e volta',
      'Transfers terrestres completos',
      'Hospedagem com pequeno-almoço',
      'Entradas nos museus da Fortaleza',
      'Passeio de barco dhow tradicional'
    ]
  }
];

interface MultimodalHubProps {
  onOpenXitique: (tripTitle: string, totalMT: number) => void;
  onOpenEVisa: () => void;
}

export default function MultimodalHub({
  onOpenXitique,
  onOpenEVisa
}: MultimodalHubProps) {
  const [selectedPkg, setSelectedPkg] = useState<MultimodalPackage | null>(null);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('843005000');
  const [passengerDoc, setPassengerDoc] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'mpesa' | 'emola' | 'card'>('mpesa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedPassId, setGeneratedPassId] = useState<string>('');

  const handleStartBooking = (pkg: MultimodalPackage) => {
    setSelectedPkg(pkg);
    setIsBookingSuccess(false);
  };

  const handleConfirmSuperPass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerDoc.trim()) {
      notify('Por favor preencha o nome completo e o número de documento.', 'error');
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      const passCode = `MZ-SUPERPASS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
      setGeneratedPassId(passCode);
      setIsProcessing(false);
      setIsBookingSuccess(true);
      notify(`Passe Multimodal emitido com sucesso! Código: ${passCode}`, 'success');
    }, 1000);
  };

  const handlePrintPass = () => {
    window.print();
  };

  return (
    <div className="space-y-8">
      
      {/* Continental & Regional Differential Banner */}
      <div className="bg-linear-to-r from-slate-950 via-indigo-950 to-cyan-950 rounded-3xl p-6 sm:p-8 text-white border border-cyan-500/30 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 space-y-4 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-linear-to-r from-amber-400 to-orange-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider shadow-xs">
              ★ Primeiro no Continente Africano
            </span>
            <span className="bg-cyan-500/20 text-cyan-200 border border-cyan-400/40 font-bold text-xs px-3 py-1 rounded-full">
              Passe Multimodal Unificado Axofácil!
            </span>
          </div>

          <h2 className="font-serif font-extrabold text-2xl sm:text-3xl lg:text-4xl text-white leading-tight">
            Voo + Transfer 4x4 / Barco + Hotel + Guia num <span className="text-cyan-400 underline decoration-amber-400 decoration-4">Único Bilhete Integrado</span>.
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            Acabe com a dor de cabeça de comprar voo num site, procurar um transfer ou táxi noutro lugar, negociar lanchas marítimas e pagar guias em dinheiro vivo. O nosso motor inteligente sincroniza todos os modais de transporte e emite um <strong>Único Código QR Master Pass</strong> com pagamento direto por <strong>M-Pesa</strong> ou <strong>e-Mola</strong>.
          </p>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 text-xs">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-1">
              <Plane className="w-4 h-4 text-cyan-300" />
              <div className="font-bold text-white">Voo Sincronizado</div>
              <div className="text-[11px] text-slate-300">Horários alinhados com o aeroporto</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-1">
              <Bus className="w-4 h-4 text-emerald-300" />
              <div className="font-bold text-white">Transfer Porta-a-Porta</div>
              <div className="text-[11px] text-slate-300">Motorista à sua espera com placa</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-1">
              <Ship className="w-4 h-4 text-amber-300" />
              <div className="font-bold text-white">Lanchas & Barcos</div>
              <div className="text-[11px] text-slate-300">Bazaruto, Inhaca e Bilene</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 space-y-1">
              <Smartphone className="w-4 h-4 text-orange-300" />
              <div className="font-bold text-white">M-Pesa & Xitique</div>
              <div className="text-[11px] text-slate-300">Divida ou poupe em grupo</div>
            </div>
          </div>

          {/* Action Hub Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenXitique('Passe Multimodal Moçambique', 24000)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm py-2.5 px-5 rounded-2xl shadow-lg flex items-center gap-2 transition-all cursor-pointer hover:scale-105"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>Xitique de Viagem & Split M-Pesa</span>
            </button>

            <button
              type="button"
              onClick={onOpenEVisa}
              className="bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-2xl flex items-center gap-2 transition-all cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4 text-cyan-300" />
              <span>Assistente e-Visa & Fronteiras</span>
            </button>
          </div>
        </div>
      </div>

      {/* Multimodal Packages Catalog */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif font-bold text-xl text-slate-900">
              SuperPasses Multimodais Recomendados
            </h3>
            <p className="text-xs text-slate-500">
              Pacotes completos com bilhética aérea, conexões terrestres/marítimas, lodges verificados e guias.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {MULTIMODAL_PACKAGES.map((pkg, idx) => (
            <div
              key={`multi-card-${pkg.id}-${idx}`}
              className="bg-white rounded-3xl border-2 border-slate-200 hover:border-cyan-500/60 shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col justify-between group"
            >
              <div>
                {/* Image Header */}
                <div className="relative h-56 overflow-hidden">
                  <img
                    src={pkg.image}
                    alt={pkg.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>

                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="bg-amber-500 text-slate-950 font-black text-[10px] uppercase px-2.5 py-1 rounded-full tracking-wider shadow-sm">
                      {pkg.tag}
                    </span>
                    <span className="bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {pkg.duration}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 text-white space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-cyan-300 font-semibold">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{pkg.destination}</span>
                    </div>
                    <h4 className="font-serif font-bold text-lg text-white leading-snug">
                      {pkg.title}
                    </h4>
                  </div>
                </div>

                {/* Multimodal Timeline Strip */}
                <div className="p-5 space-y-4">
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Itinerário Multimodal Integrado (4 Etapas):
                    </span>

                    <div className="space-y-2.5 relative pl-4 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                      {pkg.segments.map((seg, idx) => (
                        <div key={`seg-${idx}`} className="relative text-xs space-y-0.5">
                          <span className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                            seg.type === 'flight' ? 'bg-cyan-600' :
                            seg.type === 'transfer' ? 'bg-emerald-600' :
                            seg.type === 'boat' ? 'bg-indigo-600' :
                            seg.type === 'lodge' ? 'bg-amber-600' : 'bg-orange-600'
                          }`}></span>

                          <div className="flex items-center justify-between font-bold text-slate-800">
                            <span className="flex items-center gap-1">
                              {seg.type === 'flight' && <Plane className="w-3 h-3 text-cyan-600" />}
                              {seg.type === 'transfer' && <Bus className="w-3 h-3 text-emerald-600" />}
                              {seg.type === 'boat' && <Ship className="w-3 h-3 text-indigo-600" />}
                              {seg.type === 'lodge' && <Building2 className="w-3 h-3 text-amber-600" />}
                              {seg.type === 'guide' && <Compass className="w-3 h-3 text-orange-600" />}
                              <span>{seg.title}</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 font-semibold">{seg.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            {seg.details}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Feature Bullets */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs space-y-1">
                    <span className="font-bold text-slate-700 block text-[11px]">Incluído no SuperPass:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-600">
                      {pkg.includes.slice(0, 4).map((inc, i) => (
                        <div key={`inc-${i}`} className="flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span className="truncate">{inc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Price & Action Bottom */}
              <div className="p-5 pt-0 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between pt-3 mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Preço SuperPass Completo</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-serif font-black text-2xl text-slate-900">
                        {pkg.priceMT.toLocaleString('pt-PT')} <span className="text-xs font-sans font-bold text-slate-500">MT</span>
                      </span>
                      <span className="text-xs text-slate-400 line-through">
                        {pkg.originalPriceMT.toLocaleString('pt-PT')} MT
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl">
                    Poupa {(pkg.originalPriceMT - pkg.priceMT).toLocaleString('pt-PT')} MT
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenXitique(pkg.title, pkg.priceMT)}
                    className="w-full bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <HeartHandshake className="w-3.5 h-3.5 text-amber-700" />
                    <span>Dividir c/ Xitique</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartBooking(pkg)}
                    className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-2.5 px-3 rounded-2xl shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-[1.02]"
                  >
                    <Ticket className="w-3.5 h-3.5" />
                    <span>Emitir SuperPass</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

      {/* SUPERPASS BOOKING MODAL */}
      {selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 text-slate-900 my-auto flex flex-col">
            
            {/* Header */}
            <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-5 sm:p-6 sticky top-0 z-20 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base sm:text-lg text-white">
                    Emissão de Passe Multimodal Unificado
                  </h3>
                  <p className="text-xs text-slate-300">
                    {selectedPkg.title}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPkg(null)}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-6 flex-1 overflow-y-auto text-xs">
              
              {!isBookingSuccess ? (
                <form onSubmit={handleConfirmSuperPass} className="space-y-4">
                  <div className="bg-cyan-50 border border-cyan-200 p-4 rounded-2xl space-y-1">
                    <div className="font-bold text-cyan-950 text-sm">Resumo do Seu Passe Multimodal</div>
                    <p className="text-cyan-800 text-xs">
                      Este bilhete cobre todos os 4 modais: bilhete de voo, transporte 4x4 / barco, hospedagem e atividades com guia certificado.
                    </p>
                    <div className="font-serif font-extrabold text-lg text-cyan-950 pt-1">
                      Total a Pagar: {selectedPkg.priceMT.toLocaleString('pt-PT')} MT
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-slate-700 font-bold mb-1">
                        Nome Completo do Titular do Passe *
                      </label>
                      <input
                        type="text"
                        required
                        value={passengerName}
                        onChange={(e) => setPassengerName(e.target.value)}
                        placeholder="Ex: Armando Emílio Guebuza"
                        className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-semibold text-slate-900 outline-hidden"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Nº de BI ou Passaporte *
                        </label>
                        <input
                          type="text"
                          required
                          value={passengerDoc}
                          onChange={(e) => setPassengerDoc(e.target.value.toUpperCase())}
                          placeholder="Ex: 110100234567M ou Passaporte"
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-mono font-bold text-slate-900 outline-hidden uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 font-bold mb-1">
                          Telefone M-Pesa / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={passengerPhone}
                          onChange={(e) => setPassengerPhone(e.target.value)}
                          placeholder="84xxxxxxx ou 86xxxxxxx"
                          className="w-full bg-slate-50 border-2 border-slate-200 focus:border-cyan-500 rounded-xl py-2.5 px-3 font-mono font-bold text-slate-900 outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1.5">
                      Método de Pagamento Local Instantâneo
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('mpesa')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'mpesa'
                            ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/20 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-rose-600" />
                        <span>M-Pesa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('emola')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'emola'
                            ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/20 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-amber-600" />
                        <span>e-Mola</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20 font-bold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <ShieldCheck className="w-5 h-5 text-indigo-600" />
                        <span>SIMO / Cartão</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedPkg(null)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 px-4 rounded-xl cursor-pointer"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-2xl shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                    >
                      <Ticket className="w-4 h-4" />
                      <span>{isProcessing ? 'A processar emissão...' : 'Confirmar & Emitir SuperPass'}</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* ISSUED SUPERPASS MASTER CARD */
                <div className="space-y-5">
                  <div className="bg-emerald-50 border-2 border-emerald-300 p-4 rounded-2xl flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-bold text-emerald-950 text-sm">SuperPass Emitido com Sucesso!</h4>
                      <p className="text-emerald-800 text-xs">
                        O seu passe está ativo e sincronizado com os motoristas, companhia aérea e lodge.
                      </p>
                    </div>
                  </div>

                  {/* Printable Boarding SuperPass Ticket */}
                  <div className="bg-slate-950 text-white rounded-3xl p-6 border-2 border-cyan-400/40 space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                          Axofácil! Mozambique Multimodal Pass
                        </span>
                        <h4 className="font-serif font-bold text-base text-white">{selectedPkg.title}</h4>
                      </div>
                      <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 text-xs font-mono font-bold px-3 py-1 rounded-xl">
                        {generatedPassId}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Passageiro:</span>
                        <strong className="text-white">{passengerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Documento:</span>
                        <strong className="font-mono text-cyan-300">{passengerDoc}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Total Pago:</span>
                        <strong className="font-mono text-amber-300">{selectedPkg.priceMT.toLocaleString('pt-PT')} MT</strong>
                      </div>
                    </div>

                    {/* Integrated Segments Included */}
                    <div className="bg-white/5 p-3 rounded-2xl space-y-1.5 text-[11px] border border-white/10">
                      <div className="font-bold text-cyan-300">Modais Sincronizados com este QR Code:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-slate-300">
                        <div>✓ Voo Sincronizado LAM/Airlink</div>
                        <div>✓ Transfer 4x4 Porta-a-Porta</div>
                        <div>✓ Reserva de Lodge / Quarto VIP</div>
                        <div>✓ Guia Local & Seguros</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-12 h-12 text-cyan-400 bg-white p-1 rounded-xl" />
                        <div className="text-[10px] text-slate-400 leading-tight">
                          Validação Única em todos os modais de transporte e alojamento.
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handlePrintPass}
                        className="bg-white text-slate-950 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 cursor-pointer hover:bg-cyan-400 transition-all"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Imprimir / Salvar PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        const text = `Meu SuperPass Axofácil! para ${selectedPkg.title} emitido: ${generatedPassId}`;
                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                      }}
                      className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Enviar bilhete via WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedPkg(null)}
                      className="bg-slate-900 text-white font-bold text-xs py-2 px-5 rounded-xl cursor-pointer"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
