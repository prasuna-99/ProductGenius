import React, { useState, useEffect, useRef } from 'react';
import { X, Star, Image as ImageIcon, Check } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { compressImage } from '../utils/imageCompressor';
import { uploadPhoto, dataUrlToBlob } from '../utils/api';
import { ImageWithFallback } from './common/ImageWithFallback';

interface ReviewModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ product, onClose }) => {
  const { addReview, currentUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [isCompressing, setIsCompressing] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (product) {
      setRating(5);
      setHoverRating(0);
      setText('');
      setImageUrl(undefined);
      setDone(false);
    }
  }, [product]);

  if (!product) return null;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setIsCompressing(true);
    try {
      const dataUrl = await compressImage(file, 800, 800, 0.82);
      // Cloudinary when signed in (shared permanent URL), else local dataURL
      try {
        setImageUrl(await uploadPhoto(dataUrlToBlob(dataUrl), 'reviews', file.name));
      } catch {
        setImageUrl(dataUrl);
      }
    } catch (e) {
      console.error('Image compress failed', e);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addReview(product.id, { rating, text, imageUrl });
    setDone(true);
    setTimeout(onClose, 900);
  };

  const shown = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden max-h-[90vh] flex flex-col">
        <div className="bg-[#5B1423] text-white px-5 py-4 relative shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-[#FAF7F2]/80 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-[10px] uppercase font-bold tracking-widest text-[#F2CAC2]">
            Delivered Order Review
          </div>
          <div className="font-display text-xl font-semibold">Review {product.title}</div>
          <div className="text-xs text-[#F2CAC2]">as {currentUser.name}</div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto text-xs">
          {/* 5-star picker */}
          <div>
            <label className="block font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
              Your Rating *
            </label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHoverRating(n)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="cursor-pointer p-0.5"
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      n <= shown ? 'fill-amber-400 text-amber-500' : 'text-[#D8C9C4]'
                    }`}
                  />
                </button>
              ))}
              <span className="ml-2 font-mono font-bold text-[#5B1423]">{shown}/5</span>
            </div>
          </div>

          {/* Text */}
          <div>
            <label className="block font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
              Review *
            </label>
            <textarea
              required
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="How was the product?"
              className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
            />
          </div>

          {/* Gallery photo */}
          <div>
            <label className="block font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
              Photo (optional, from gallery)
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
              className="hidden"
            />
            {imageUrl ? (
              <div className="flex items-start gap-3">
                <ImageWithFallback src={imageUrl} alt="Review photo" className="w-20 h-20 rounded-lg border border-[#E8DDD8]" />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="text-rose-700 hover:underline cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isCompressing}
                className="w-full p-4 border-2 border-dashed border-[#E8DDD8] rounded-xl bg-white text-[#7A5B61] hover:border-[#7A1C30] flex items-center justify-center gap-2 cursor-pointer"
              >
                <ImageIcon className="w-5 h-5" />
                <span>{isCompressing ? 'Compressing...' : 'Pick a photo from gallery'}</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!text.trim() || isCompressing}
            className="w-full py-2.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {done ? (
              <>
                <Check className="w-4 h-4" /> Saved!
              </>
            ) : (
              <>
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Submit {rating}-Star Review
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
