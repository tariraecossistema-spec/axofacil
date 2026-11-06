import React from 'react';
import { Establishment } from "../../types/types";
import { Car, ShoppingCart, GlassWater, BedDouble, HardHat, Shirt, ChevronRight, Plane, Truck, Flower2 } from 'lucide-react';
import NowBoardingHeroBanner from './NowBoardingHeroBanner';

export type SegmentPageTarget = 'lojas' | 'supermercados' | 'bares' | 'hospedagens' | 'construcao' | 'turismo' | 'entregadores';

interface SegmentDefinition {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  targetPage: SegmentPageTarget;
  segmentFilter?: string; // narrows the target page to a sub-set of its establishments, e.g. 'pecas_auto'
  accent: string; // tailwind color token used for icon/border accents
}

const SEGMENTS: SegmentDefinition[] = [
  {
    id: 'loja',
    label: 'Lojas & Moda',
    description: 'Boutiques de vestuário, calçado, electrónica, telemóveis e comércio geral',
    icon: Shirt,
    targetPage: 'lojas',
    accent: 'text-indigo-brand'
  },
  {
    id: 'pecas_auto',
    label: 'Peças Auto & Acessórios',
    description: 'Baterias, lubrificantes, filtros, suspensão e peças para viaturas ligeiras e pesadas',
    icon: Car,
    targetPage: 'lojas',
    segmentFilter: 'pecas_auto',
    accent: 'text-blue-700'
  },
  {
    id: 'supermercado',
    label: 'Supermercados & Alimentação',
    description: 'Produtos alimentares, frescos, talho, mercearia a grosso e a retalho',
    icon: ShoppingCart,
    targetPage: 'supermercados',
    accent: 'text-emerald-700'
  },
  {
    id: 'bar',
    label: 'Restaurantes, Bares & Lazer',
    description: 'Restaurantes, marisqueiras, lounges, esplanadas e vida social',
    icon: GlassWater,
    targetPage: 'bares',
    accent: 'text-amber-700'
  },
  {
    id: 'hospedagem',
    label: 'Hospedagem & Alojamento',
    description: 'Hotéis executivos, lodges de praia, pensões e casas de hóspedes',
    icon: BedDouble,
    targetPage: 'hospedagens',
    accent: 'text-rose-700'
  },
  {
    id: 'construcao',
    label: 'Material de Construção & Ferragens',
    description: 'Cimento, chapas de cobertura, varões de aço, brita, blocos e estaleiros',
    icon: HardHat,
    targetPage: 'construcao',
    accent: 'text-orange-700'
  },
  {
    id: 'turismo',
    label: 'Turismo, Safaris & Viagens',
    description: 'Safaris, parques nacionais, pacotes internacionais, bilhetes aéreos e passeios',
    icon: Plane,
    targetPage: 'turismo',
    accent: 'text-cyan-700'
  },
  {
    id: 'entregador',
    label: 'Transporte, Estafetas & Fretes',
    description: 'Estafetas com mota, carrinhas de frete, camiões de carga e mudanças',
    icon: Truck,
    targetPage: 'entregadores',
    accent: 'text-indigo-700'
  },
  {
    id: 'floricultura',
    label: 'Florarias & Decoração',
    description: 'Flores frescas, buquês, arranjos de mesa, presentes e ornamentação para cerimónias',
    icon: Flower2,
    targetPage: 'lojas',
    segmentFilter: 'floricultura',
    accent: 'text-pink-700'
  }
];

interface SegmentSelectorProps {
  establishments: Establishment[];
  onSelectSegment: (targetPage: SegmentPageTarget, segmentFilter?: string) => void;
}

export default function SegmentSelector({ establishments, onSelectSegment }: SegmentSelectorProps) {
  const countFor = (seg: SegmentDefinition) => {
    if (seg.segmentFilter) {
      return establishments.filter(e => e.category === seg.segmentFilter).length;
    }
    return establishments.filter(e => e.category === seg.id).length;
  };

  return (
    <div className="min-h-screen bg-paper pb-16">
      
      <NowBoardingHeroBanner 
        category="segmentos"
        pageTitle="Escolha de Segmento"
        pageSubtitle="Explore por Categorias e Especialidades"
        heightClass="min-h-[380px] sm:min-h-[440px]"
        isLandingPage={false}
        showPromoButton={false}
      />

      <div className="bg-white text-slate-900 pt-8 pb-10 px-[6vw] mb-8 border-b border-slate-200 shadow-2xs relative">
        <div className="max-w-4xl mx-auto text-center space-y-2.5">
          <span className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 text-xs font-bold py-1 px-3.5 rounded-full border border-slate-200">
            Passo 1 de 3 · Escolher segmento
          </span>
          <h2 className="font-serif font-bold text-3xl sm:text-4xl text-slate-900 leading-tight">
            O que está a procurar hoje?
          </h2>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            Escolha um segmento para ver as lojas e serviços disponíveis na sua cidade.
          </p>
        </div>
      </div>

      <div className="px-[6vw] max-w-4xl mx-auto w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SEGMENTS.map((seg, idx) => {
            const Icon = seg.icon;
            const count = countFor(seg);
            return (
              <button
                key={`seg-${seg.id}-${idx}`}
                type="button"
                onClick={() => onSelectSegment(seg.targetPage, seg.segmentFilter)}
                className="group text-left bg-white border border-ink/12 rounded-2xl p-5 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-indigo-brand/40 transition-all cursor-pointer flex items-center gap-4"
              >
                <div className={`w-14 h-14 rounded-xl bg-sand-2/50 flex items-center justify-center shrink-0 ${seg.accent}`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans font-bold text-sm text-ink group-hover:text-indigo-brand transition-colors">
                    {seg.label}
                  </h3>
                  <p className="text-xs text-ink/60 leading-relaxed mt-0.5">{seg.description}</p>
                  <span className="text-[10px] font-bold text-ink/40 uppercase tracking-wider mt-1.5 inline-block">
                    {count} {count === 1 ? 'estabelecimento' : 'estabelecimentos'}
                  </span>
                </div>
                <ChevronRight className="w-5 h-5 text-ink/25 group-hover:text-indigo-brand group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
