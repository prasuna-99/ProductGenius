import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Gift, Upload, Loader2 } from 'lucide-react';
import { Campaign } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { uploadPhoto, dataUrlToBlob } from '../../utils/api';

interface CampaignManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignToEdit?: Campaign | null;
  onSave: (campaign: Omit<Campaign, 'id'>) => void;
}

export const CampaignManagerModal: React.FC<CampaignManagerModalProps> = ({
  isOpen,
  onClose,
  campaignToEdit,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'festival' | 'season'>('festival');
  const [tagline, setTagline] = useState('');
  const [discountCode, setDiscountCode] = useState('FESTIVE25');
  const [discountPercent, setDiscountPercent] = useState(25);
  const [themeColor, setThemeColor] = useState<Campaign['themeColor']>('amber');
  const [badgeText, setBadgeText] = useState('Festival Mega Offer');
  const [startDate, setStartDate] = useState('2026-09-28');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [isActive, setIsActive] = useState(true);
  const [featuredCategory, setFeaturedCategory] = useState<Campaign['featuredCategory']>('All');
  const [description, setDescription] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState<string | undefined>(undefined);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (campaignToEdit) {
      setTitle(campaignToEdit.title);
      setType(campaignToEdit.type);
      setTagline(campaignToEdit.tagline);
      setDiscountCode(campaignToEdit.discountCode);
      setDiscountPercent(campaignToEdit.discountPercent);
      setThemeColor(campaignToEdit.themeColor);
      setBadgeText(campaignToEdit.badgeText);
      setStartDate(campaignToEdit.startDate);
      setEndDate(campaignToEdit.endDate);
      setIsActive(campaignToEdit.isActive);
      setFeaturedCategory(campaignToEdit.featuredCategory);
      setDescription(campaignToEdit.description);
      setBannerImageUrl(campaignToEdit.bannerImageUrl);
    } else {
      setTitle('Grand Diwali & Tihar Festival Gala');
      setType('festival');
      setTagline('Exclusive Festival Savings on Luxury Skincare, Makeup, Bodycare & Fragrance');
      setDiscountCode('FESTIVE25');
      setDiscountPercent(25);
      setThemeColor('amber');
      setBadgeText('Festival Mega Offer');
      setStartDate('2026-09-28');
      setEndDate('2026-11-15');
      setIsActive(true);
      setFeaturedCategory('All');
      setDescription('Celebrate the festival of lights with handcrafted boutique luxury essentials in Rupees.');
      setBannerImageUrl(undefined);
    }
  }, [campaignToEdit, isOpen]);

  if (!isOpen) return null;

  const handleBannerFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsCompressing(true);
    try {
      const dataUrl = await compressImage(file, 1000, 600, 0.82);
      // Cloudinary when signed in (shared permanent URL), else local dataURL
      try {
        setBannerImageUrl(await uploadPhoto(dataUrlToBlob(dataUrl), 'campaigns', file.name));
      } catch {
        setBannerImageUrl(dataUrl);
      }
    } catch (e) {
      console.error('Banner compress failed', e);
    } finally {
      setIsCompressing(false);
    }
  };

  const presets = [
    {
      title: 'Grand Diwali & Tihar Festival Gala',
      type: 'festival' as const,
      tagline: 'Illuminate your glow with 25% Off on Skincare & Fragrance Bundles',
      code: 'FESTIVE25',
      pct: 25,
      theme: 'amber' as const,
      badge: 'Festival Mega Offer',
      category: 'All' as const,
    },
    {
      title: 'Dashain Festive Bonanza',
      type: 'festival' as const,
      tagline: 'Exclusive festive celebration: Flat 30% Off on Velvet Makeup & Bodycare',
      code: 'DASHAIN30',
      pct: 30,
      theme: 'burgundy' as const,
      badge: 'Festive Special',
      category: 'Makeup' as const,
    },
    {
      title: 'Autumn Glow Seasonal Revival',
      type: 'season' as const,
      tagline: 'Barrier protection & deep hydration: Flat 20% Off Skincare',
      code: 'AUTUMN20',
      pct: 20,
      theme: 'emerald' as const,
      badge: 'Season Offer',
      category: 'Skincare' as const,
    },
    {
      title: 'Spring Bloom Beauty Carnival',
      type: 'season' as const,
      tagline: 'Refresh your aesthetic: Flat 15% Off Fragrance & Bodycare',
      code: 'BLOOM15',
      pct: 15,
      theme: 'rose' as const,
      badge: 'Spring Season',
      category: 'Fragrance' as const,
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setTitle(p.title);
    setType(p.type);
    setTagline(p.tagline);
    setDiscountCode(p.code);
    setDiscountPercent(p.pct);
    setThemeColor(p.theme);
    setBadgeText(p.badge);
    setFeaturedCategory(p.category);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      type,
      tagline,
      discountCode: discountCode.toUpperCase().trim(),
      discountPercent: Number(discountPercent),
      themeColor,
      badgeText,
      startDate,
      endDate,
      isActive,
      featuredCategory,
      description,
      bannerImageUrl,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#5B1423] text-white p-6 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-[#FAF7F2]/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-4 h-4 text-[#F2CAC2]" />
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 px-2 py-0.5 rounded text-[#F2CAC2]">
              Campaign Marketing Suite
            </span>
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight block">
            {campaignToEdit ? 'Modify Offer Campaign' : 'Launch Festival or Season Campaign'}
          </span>
          <p className="text-xs text-[#F2CAC2] mt-1">
            Campaigns display in customer view below the navbar and alongside the Apriori recommendation engine.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Quick Presets */}
          {!campaignToEdit && (
            <div>
              <label className="block text-[11px] font-semibold text-[#7A5B61] uppercase tracking-wider mb-2">
                Quick Campaign Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {presets.map(p => (
                  <button
                    key={p.code}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className="p-2.5 bg-white border border-[#E8DDD8] rounded-xl text-left hover:border-[#5B1423] transition-all cursor-pointer shadow-2xs"
                  >
                    <span className="text-[10px] font-bold text-[#5B1423] block truncate">
                      {p.title}
                    </span>
                    <span className="text-[10px] font-mono text-[#7A5B61]">
                      {p.pct}% Off · {p.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Identification */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#2D1217] pb-2 border-b border-[#E8DDD8]">
              Campaign Details & Theme
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Grand Diwali Festival Gala"
                className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Campaign Type *
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as 'festival' | 'season')}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer"
                >
                  <option value="festival">Festival Offer (Diwali, Dashain, Eid, etc.)</option>
                  <option value="season">Season Offer (Monsoon, Autumn, Spring, etc.)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Badge Label
                </label>
                <input
                  type="text"
                  value={badgeText}
                  onChange={e => setBadgeText(e.target.value)}
                  placeholder="e.g. Festival Mega Offer"
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Visual Palette
                </label>
                <select
                  value={themeColor}
                  onChange={e => setThemeColor(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer font-medium"
                >
                  <option value="amber">Amber Gold (Festive Radiance)</option>
                  <option value="burgundy">Burgundy Luxe (Atelier Prestige)</option>
                  <option value="emerald">Emerald Green (Botanical Season)</option>
                  <option value="rose">Rose Blush (Romantic Floral)</option>
                  <option value="indigo">Indigo Midnight (Exclusive Night)</option>
                  <option value="purple">Royal Purple (Festive Splendor)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Headline Tagline
              </label>
              <input
                type="text"
                value={tagline}
                onChange={e => setTagline(e.target.value)}
                placeholder="e.g. Illuminate your skin with 25% Off on Skincare & Fragrance Bundles"
                className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
              />
            </div>
          </div>

          {/* Discount & Category Target */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#2D1217] pb-2 border-b border-[#E8DDD8]">
              Discount Mechanics & Target Category
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Discount Code *
                </label>
                <input
                  type="text"
                  required
                  value={discountCode}
                  onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="FESTIVE25"
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] uppercase font-mono font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  min="5"
                  max="70"
                  required
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] font-mono focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Target Category
                </label>
                <select
                  value={featuredCategory}
                  onChange={e => setFeaturedCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Skincare">Skincare</option>
                  <option value="Makeup">Makeup</option>
                  <option value="Bodycare">Bodycare</option>
                  <option value="Fragrance">Fragrance</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Campaign Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Briefly describe festival perks, terms, and highlights..."
                className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
              />
            </div>

            {/* Campaign Photo (gallery upload, shown big on customer banner) */}
            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Campaign Photo (from gallery)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) handleBannerFile(f);
                }}
                className="hidden"
              />
              {bannerImageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={bannerImageUrl}
                    alt="Campaign banner preview"
                    className="w-32 h-20 object-cover rounded-lg border border-[#E8DDD8]"
                  />
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-[#5B1423] font-semibold hover:underline cursor-pointer"
                    >
                      Change photo
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerImageUrl(undefined)}
                      className="text-[11px] text-rose-700 hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isCompressing}
                  className="w-full p-4 border-2 border-dashed border-[#E8DDD8] rounded-xl bg-white text-[#7A5B61] hover:border-[#7A1C30] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isCompressing ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5" />
                  )}
                  <span>{isCompressing ? 'Compressing...' : 'Upload campaign photo from gallery'}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-[#5B1423] focus:ring-[#7A1C30] cursor-pointer"
              />
              <label htmlFor="isActive" className="text-xs text-[#2D1217] font-semibold cursor-pointer">
                Publish as Active Campaign (immediately live in Customer Dashboard)
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#E8DDD8] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E8DDD8] text-[#5C4449] rounded-lg font-semibold hover:bg-[#FCECE9] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F2CAC2]" />
              <span>{campaignToEdit ? 'Save Campaign' : 'Launch Campaign Live'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
