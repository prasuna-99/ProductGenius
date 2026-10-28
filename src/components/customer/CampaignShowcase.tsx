import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Calendar,
  Gift,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ImageWithFallback } from '../common/ImageWithFallback';

interface CampaignShowcaseProps {
  onFilterCategory?: (category: string) => void;
}

export const CampaignShowcase: React.FC<CampaignShowcaseProps> = ({
  onFilterCategory,
}) => {
  const {
    activeCampaigns,
    setActiveCustomerTab,
  } = useApp();

  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Auto-slide every 6s when multiple campaigns are live
  useEffect(() => {
    if (activeCampaigns.length < 2) return;
    const t = setInterval(
      () => setActiveSlide(s => (s + 1) % activeCampaigns.length),
      6000
    );
    return () => clearInterval(t);
  }, [activeCampaigns.length]);

  // Keep slide in range if campaigns change
  useEffect(() => {
    setActiveSlide(s => (activeCampaigns.length > 0 ? s % activeCampaigns.length : 0));
  }, [activeCampaigns.length]);

  if (activeCampaigns.length === 0) return null;

  const currentCampaign = activeCampaigns[activeSlide % activeCampaigns.length];

  const handleCopyCode = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Color theme mappings
  const themeClasses: Record<string, { bg: string; text: string; badge: string; border: string; accent: string }> = {
    amber: {
      bg: 'from-[#4D2800] via-[#7A3E00] to-[#3B1C00]',
      text: 'text-amber-100',
      badge: 'bg-amber-400/20 text-amber-300 border-amber-400/30',
      border: 'border-amber-500/30',
      accent: 'bg-amber-500 hover:bg-amber-600 text-white',
    },
    burgundy: {
      bg: 'from-[#5B1423] via-[#7A1C30] to-[#3E0C17]',
      text: 'text-[#F2CAC2]',
      badge: 'bg-[#FAF7F2]/15 text-[#F2CAC2] border-white/20',
      border: 'border-[#7A1C30]/50',
      accent: 'bg-[#9E2A40] hover:bg-[#B3354C] text-white',
    },
    emerald: {
      bg: 'from-[#063826] via-[#0E523A] to-[#042418]',
      text: 'text-emerald-100',
      badge: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30',
      border: 'border-emerald-500/30',
      accent: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
    rose: {
      bg: 'from-[#52132A] via-[#7D1E42] to-[#3A0C1D]',
      text: 'text-rose-100',
      badge: 'bg-rose-400/20 text-rose-300 border-rose-400/30',
      border: 'border-rose-500/30',
      accent: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    indigo: {
      bg: 'from-[#1E1B4B] via-[#312E81] to-[#17143A]',
      text: 'text-indigo-100',
      badge: 'bg-indigo-400/20 text-indigo-300 border-indigo-400/30',
      border: 'border-indigo-500/30',
      accent: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    },
    purple: {
      bg: 'from-[#3B0764] via-[#581C87] to-[#260542]',
      text: 'text-purple-100',
      badge: 'bg-purple-400/20 text-purple-300 border-purple-400/30',
      border: 'border-purple-500/30',
      accent: 'bg-purple-600 hover:bg-purple-700 text-white',
    },
  };

  const theme = themeClasses[currentCampaign.themeColor] || themeClasses.burgundy;

  // Below Navbar Festive Campaign Banner (slider, large)
  {
    const goPrev = () =>
      setActiveSlide(s => (s - 1 + activeCampaigns.length) % activeCampaigns.length);
    const goNext = () => setActiveSlide(s => (s + 1) % activeCampaigns.length);
    return (
      <div className="w-full mb-6">
        <div
          className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${theme.bg} text-white shadow-xl border ${theme.border} p-8 sm:p-12 min-h-[280px] lg:min-h-[320px] flex flex-col justify-center transition-all`}
        >
          {/* Subtle festival sparkles background */}
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-black/20 rounded-full blur-2xl pointer-events-none" />

          {/* Slide arrows */}
          {activeCampaigns.length > 1 && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous campaign"
                className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next campaign"
                className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Left Content */}
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border backdrop-blur-md ${theme.badge}`}
                >
                  <Gift className="w-3.5 h-3.5" />
                  <span>{currentCampaign.badgeText}</span>
                </span>

                <span className="text-[11px] font-mono text-white/80 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Valid till {currentCampaign.endDate}</span>
                </span>

                {currentCampaign.featuredCategory && currentCampaign.featuredCategory !== 'All' && (
                  <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded font-semibold text-white">
                    Category: {currentCampaign.featuredCategory}
                  </span>
                )}
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-white leading-snug">
                {currentCampaign.title}
              </h2>

              <p className="text-sm sm:text-base text-white/90 leading-relaxed font-light">
                {currentCampaign.tagline}
              </p>
            </div>

            {/* Campaign Photo (gallery upload from admin, optional) */}
            {currentCampaign.bannerImageUrl && (
              <div className="w-full lg:w-72 shrink-0 rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-black/20">
                <ImageWithFallback
                  src={currentCampaign.bannerImageUrl}
                  alt={currentCampaign.title}
                  className="w-full h-44 lg:h-56"
                />
              </div>
            )}

            {/* Right Discount & Actions */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
              
              {/* Promo Code Box */}
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-3 border border-white/15 flex items-center gap-3">
                <div>
                  <span className="text-[10px] text-white/70 uppercase tracking-widest block font-bold">
                    Festive Coupon
                  </span>
                  <span className="font-mono text-base font-extrabold text-amber-300 tracking-wider">
                    {currentCampaign.discountCode}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(currentCampaign.discountCode)}
                  className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                  title="Copy coupon code"
                >
                  {copiedCode === currentCampaign.discountCode ? (
                    <span className="text-xs flex items-center gap-1 text-emerald-300 font-semibold">
                      <Check className="w-4 h-4" />
                    </span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Discount Percentage Callout */}
              <div className="bg-white text-[#2D1217] rounded-xl px-4 py-2.5 text-center shadow-lg border border-white">
                <span className="text-[10px] uppercase font-bold text-[#7A5B61] tracking-wider block">
                  Savings
                </span>
                <span className="font-display text-xl font-extrabold text-[#5B1423] leading-none block">
                  {currentCampaign.discountPercent}% OFF
                </span>
              </div>

              {/* Action Button */}
              {onFilterCategory && currentCampaign.featuredCategory && currentCampaign.featuredCategory !== 'All' ? (
                <button
                  type="button"
                  onClick={() => onFilterCategory(currentCampaign.featuredCategory!)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer whitespace-nowrap ${theme.accent}`}
                >
                  Shop {currentCampaign.featuredCategory}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveCustomerTab('recommendations')}
                  className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider shadow-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${theme.accent}`}
                >
                  <span>Explore Offers</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

            </div>

          </div>

          {/* Dots if multiple campaigns */}
          {activeCampaigns.length > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/10">
              {activeCampaigns.map((camp, idx) => (
                <button
                  key={camp.id}
                  onClick={() => setActiveSlide(idx)}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    activeSlide % activeCampaigns.length === idx
                      ? 'w-6 bg-white'
                      : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`View campaign ${camp.title}`}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    );
  }
};
