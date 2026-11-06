import React from 'react';
import { Establishment } from "../../types/types";
import { MapPin, Star } from 'lucide-react';

export type CardTheme = 'indigo' | 'emerald' | 'amber' | 'sky' | 'slate' | 'blue';

const THEME_CLASSES: Record<CardTheme, { pill: string; hoverTitle: string; meta: string; ring: string }> = {
  indigo: { pill: 'bg-[#0B254B] text-white', hoverTitle: 'group-hover:text-[#0B254B]', meta: 'text-[#0B254B] bg-slate-100', ring: 'text-slate-400' },
  emerald: { pill: 'bg-[#103B75] text-white', hoverTitle: 'group-hover:text-[#103B75]', meta: 'text-[#103B75] bg-slate-100', ring: 'text-slate-400' },
  amber: { pill: 'bg-[#0B254B] text-white', hoverTitle: 'group-hover:text-[#0B254B]', meta: 'text-[#0B254B] bg-slate-100', ring: 'text-slate-400' },
  sky: { pill: 'bg-[#1E3A8A] text-white', hoverTitle: 'group-hover:text-[#1E3A8A]', meta: 'text-[#1E3A8A] bg-slate-100', ring: 'text-slate-400' },
  slate: { pill: 'bg-slate-800 text-white', hoverTitle: 'group-hover:text-slate-900', meta: 'text-slate-700 bg-slate-100', ring: 'text-slate-400' },
  blue: { pill: 'bg-[#0B254B] text-white', hoverTitle: 'group-hover:text-[#0B254B]', meta: 'text-[#0B254B] bg-slate-100', ring: 'text-slate-400' }
};

export interface CardBadge {
  label: string;
  icon?: React.ElementType;
}

interface EstablishmentCardProps {
  est: Establishment;
  theme: CardTheme;
  /** Small pill shown top-left over the image, e.g. category or delivery badge */
  badges: CardBadge[];
  /** Extra block rendered inside the padded body, e.g. address or room-type info. Optional. */
  detailSlot?: React.ReactNode;
  /** Overrides the default rating footer with custom content (e.g. a shipping CTA). Optional. */
  footerSlot?: React.ReactNode;
  onClick: () => void;
}

// Shared establishment card used across all 5 segment pages (Lojas, Supermercados,
// Bares, Hospedagens, Construção). Only the accent color and the badges shown
// change per segment — image, title, description, products preview, meta footer
// and promo ribbon are always in the same place.
export default function EstablishmentCard({ est, theme, badges, detailSlot, footerSlot, onClick }: EstablishmentCardProps) {
  const t = THEME_CLASSES[theme];

  return (
    <div
      onClick={onClick}
      className="group border border-slate-200/90 rounded-2xl overflow-hidden bg-white shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col justify-between relative"
    >
      <div>
        <div className="h-44 relative overflow-hidden bg-slate-900 ambient-sheen">
          {est.imageUrl ? (
            <img 
              src={est.imageUrl} 
              alt={est.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ambient-image-breathe" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white font-serif italic text-lg opacity-20" style={{ backgroundColor: est.coverColor && ['#0B254B', '#103B75', '#0F2E5C', '#0284C7', '#475569', '#334155', '#1E293B', '#0F172A', '#0369A1', '#0891B2', '#1E3A8A', '#1E1B4B', '#0E7490'].includes(est.coverColor) ? est.coverColor : '#0B254B' }}>
              Axofácil!
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap max-w-[90%] z-20">
            {badges.map((badge, idx) => {
              const BadgeIcon = badge.icon;
              return (
                <span key={`est-badge-${badge.label}-${idx}`} className={`text-[9.5px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-xs flex items-center gap-1 ambient-badge-float ${t.pill}`}>
                  {BadgeIcon && <BadgeIcon className="w-3 h-3" />}
                  {badge.label}
                </span>
              );
            })}
          </div>

          <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white z-20">
            <div className="text-[10.5px] font-medium text-slate-200 flex items-center gap-1 mb-0.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-blue-200" />
              <span className="truncate">{est.zone}</span>
            </div>
            <h3 className={`font-serif font-bold text-base leading-snug truncate transition-colors ${t.hoverTitle}`}>
              {est.name}
            </h3>
          </div>

          {est.promotion && (
            <div className="absolute top-2.5 right-2.5 bg-[#103B75] text-white text-[9px] font-black uppercase py-1 px-2.5 rounded-lg shadow-sm max-w-[48%] truncate border border-white/20 z-20 ambient-badge-float">
              {est.promotion}
            </div>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed font-normal">{est.description}</p>

          {detailSlot}

          {est.productsList && est.productsList.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {est.productsList.slice(0, 3).map((prod, idx) => (
                <span key={`est-prod-chip-${prod}-${idx}`} className="text-[9.5px] font-medium text-slate-700 bg-slate-100 border border-slate-200 py-0.5 px-2 rounded-md transition-colors hover:bg-slate-200">
                  {prod}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0">
        {footerSlot ? footerSlot : (
          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
            <span className={`font-semibold py-0.5 px-2.5 rounded-lg truncate max-w-[65%] text-[10px] ${t.meta}`}>
              {est.metaInfo.split(' · ')[0]}
            </span>
            <span className="flex items-center gap-1 font-bold text-slate-800 shrink-0 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
              <Star className="w-3.5 h-3.5 text-[#103B75] fill-[#103B75]" />
              <span>{est.rating}</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
