import React from 'react';
import { UserProfile } from "../../types/types";
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import NowBoardingHeroBanner from './NowBoardingHeroBanner';
import { CarouselSlide } from './HeroCarousel';

export interface HeroTag {
  icon: React.ElementType;
  label: string;
  colorClass: string;
}

interface SegmentPageHeroProps {
  gradientClass?: string;
  badgeIcon: React.ElementType;
  badgeLabel: string;
  badgeColorClass?: string;
  title: string;
  subtitle: string;
  tags?: HeroTag[];
  carouselSlides?: CarouselSlide[];
  carouselKey: string;
  currentUser?: UserProfile | null;
  /** Optional content rendered top-right, next to the badge pill, e.g. owner login/signup CTAs */
  topRightSlot?: React.ReactNode;
  /** Optional extra content rendered below the main hero grid, e.g. an owner sign-up banner */
  children?: React.ReactNode;
  onNavigate?: (page: any, filter?: string) => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  onGoHome?: () => void;
  onInquireClick?: () => void;
}

// Cinematic full-width cover-page hero used across segment pages (Lojas, Supermercados, Bares, Hospedagens, Turismo, Construção)
export default function SegmentPageHero({
  badgeIcon: BadgeIcon,
  badgeLabel,
  badgeColorClass = 'bg-white/10 text-white border-white/20',
  title,
  subtitle,
  tags,
  carouselKey,
  topRightSlot,
  children,
  onNavigate,
  canGoBack,
  onGoBack,
  onGoHome,
  onInquireClick
}: SegmentPageHeroProps) {
  return (
    <div className="w-full flex flex-col mb-10">
      
      {/* 1. Grand NowBoarding Top Cinematic Header Banner with Animated Images Specific to this Menu */}
      <NowBoardingHeroBanner 
        category={carouselKey}
        pageTitle={badgeLabel}
        pageSubtitle={title}
        heightClass="min-h-[380px] sm:min-h-[440px]"
        onNavigate={onNavigate}
        canGoBack={canGoBack}
        onGoBack={onGoBack}
        onGoHome={onGoHome}
        onInquireClick={onInquireClick}
        isLandingPage={false}
        showPromoButton={false}
      />

      {/* 2. Segment info strip — Fundo 100% Branco com elementos elegantes e contraste perfeito */}
      <div className="relative w-full bg-white text-slate-900 pt-6 sm:pt-7 pb-7 sm:pb-8 px-[5vw] lg:px-[7vw] border-b border-slate-200 shadow-2xs">
        <div className="max-w-6xl mx-auto space-y-4 relative z-10">

          {topRightSlot && (
            <div className="flex justify-end">
              {topRightSlot}
            </div>
          )}

          <div className="space-y-3 max-w-4xl">
            {/* Value Proposition — the one thing this menu needs to say */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl font-normal">
              {subtitle}
            </p>

            {/* Service Highlights - Paleta Azul Escuro, Branco e Cinzento */}
            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-2.5 text-xs sm:text-sm font-medium text-slate-700">
                {tags.map((tag, idx) => {
                  const TagIcon = tag.icon;
                  return (
                    <span 
                      key={`hero-tag-${tag.label}-${idx}`} 
                      className="bg-slate-50 hover:bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200/90 flex items-center gap-2 shadow-2xs transition-colors"
                    >
                      <TagIcon className="w-3.5 h-3.5 text-[#0B254B]" /> 
                      <span>{tag.label}</span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}
