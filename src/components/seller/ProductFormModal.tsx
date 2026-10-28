import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon, Link as LinkIcon, Sparkles, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ProductCategory } from '../../types';
import { compressImage } from '../../utils/imageCompressor';
import { uploadPhoto, dataUrlToBlob } from '../../utils/api';
import { formatPrice } from '../../utils/format';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, editProduct, currentUser, backendOnline, categories } = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ProductCategory>('Skincare');
  const [price, setPrice] = useState(1450);
  const [originalPrice, setOriginalPrice] = useState(1750);
  const [stockCount, setStockCount] = useState(25);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/skincare_cleanser_moisturizer_1790516249925.jpg');
  const [features, setFeatures] = useState('Artisanal botanical formulation\nDermatologist tested & hypoallergenic\nHand-crafted with clean ingredients');
  const [imageMethod, setImageMethod] = useState<'gallery' | 'presets' | 'url'>('gallery');
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sampleImages = [
    { label: 'Skincare & Hydration', path: '/src/assets/images/skincare_cleanser_moisturizer_1790516249925.jpg' },
    { label: 'Velvet Matte Makeup', path: '/src/assets/images/luxury_matte_foundation_lipstick_1790516270933.jpg' },
    { label: 'Hair & Bodycare Elixir', path: '/src/assets/images/luxury_hair_repair_serum_1790516287700.jpg' },
    { label: 'Artisanal Rose Perfume', path: '/src/assets/images/botanical_perfume_rose_1790511914245.jpg' },
  ];

  const allowedCategories: ProductCategory[] =
    categories.length > 0 ? categories.map(c => c.name) : ['Skincare', 'Makeup', 'Bodycare', 'Fragrance'];

  useEffect(() => {
    if (productToEdit) {
      setTitle(productToEdit.title);
      setCategory(productToEdit.category);
      setPrice(productToEdit.price);
      setOriginalPrice(productToEdit.originalPrice || productToEdit.price);
      setStockCount(productToEdit.stockCount);
      setSku(productToEdit.sku);
      setDescription(productToEdit.description);
      setImageUrl(productToEdit.imageUrl);
      setUrlInput(productToEdit.imageUrl);
      setFeatures(productToEdit.features.join('\n'));
      setUploadedFileName(productToEdit.imageUrl.startsWith('data:') ? 'Optimized Device Photo' : null);
    } else {
      setTitle('');
      setCategory('Skincare');
      setPrice(1450);
      setOriginalPrice(1750);
      setStockCount(25);
      setSku(`PG-${Math.floor(100 + Math.random() * 900)}`);
      setDescription('');
      setImageUrl('/src/assets/images/skincare_cleanser_moisturizer_1790516249925.jpg');
      setUrlInput('');
      setUploadedFileName(null);
      setFeatures('Artisanal botanical formulation\nDermatologist tested & hypoallergenic\nHand-crafted with clean ingredients');
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  // Compress, then upload to Cloudinary when signed in (permanent URL shared by
  // all devices); otherwise keep the local dataURL so the shop works offline.
  const handleFileProcess = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WebP, etc.).');
      return;
    }

    setIsCompressing(true);
    try {
      const optimizedDataUrl = await compressImage(file, 800, 800, 0.82);
      try {
        const url = await uploadPhoto(dataUrlToBlob(optimizedDataUrl), 'products', file.name);
        setImageUrl(url);
      } catch {
        setImageUrl(optimizedDataUrl);
      }
      setUploadedFileName(file.name);
      setImageMethod('gallery');
    } catch (err) {
      console.error('Failed to compress image:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const featureList = features
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    setIsSaving(true);
    try {
      if (productToEdit) {
        await editProduct(productToEdit.id, {
          title,
          category,
          price: Number(price),
          originalPrice: Number(originalPrice),
          stockCount: Number(stockCount),
          inStock: Number(stockCount) > 0,
          sku,
          description,
          imageUrl,
          features: featureList,
        });
      } else {
        await addProduct({
          title,
          category,
          price: Number(price),
          originalPrice: Number(originalPrice),
          rating: 5.0,
          reviewsCount: 1,
          inStock: Number(stockCount) > 0,
          stockCount: Number(stockCount),
          sku: sku || `PG-${Math.floor(100 + Math.random() * 900)}`,
          sellerId: currentUser.id,
          sellerName: currentUser.storeName || currentUser.name || 'Artisan Partner',
          description,
          features: featureList,
          imageUrl,
          tags: [category, 'New Arrival', 'Artisan'],
          isFeatured: false,
        });
      }
    } finally {
      setIsSaving(false);
    }

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
            <span className="text-[10px] uppercase font-bold tracking-widest bg-white/10 px-2 py-0.5 rounded text-[#F2CAC2]">
              Merchant Catalog Management
            </span>
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight block">
            {productToEdit ? 'Edit Product Specification' : 'Add New Boutique Product'}
          </span>
          <p className="text-xs text-[#F2CAC2] mt-1">
            Specify pricing in Rupees (Rs), assign one of the 4 core categories, and upload optimized product images.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Basic Info */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#2D1217] pb-2 border-b border-[#E8DDD8]">
              Product Identification & Category
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Squalane Peptide Restorative Face Cream"
                className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Product Category *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as ProductCategory)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] cursor-pointer font-medium"
                >
                  {allowedCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-[#7A5B61] mt-1">
                  Mapped to Apriori market basket association engine.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Catalog SKU
                </label>
                <input
                  type="text"
                  value={sku}
                  onChange={e => setSku(e.target.value)}
                  placeholder="e.g. PG-SKN-204"
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Inventory in Rs */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#2D1217] pb-2 border-b border-[#E8DDD8]">
              Pricing (in Rupees Rs) & Stock
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Selling Price (Rs) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#7A5B61] text-xs font-bold">
                    Rs
                  </span>
                  <input
                    type="number"
                    required
                    min="1"
                    value={price}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] font-mono focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  MSRP / Original Price (Rs)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-[#7A5B61] text-xs font-bold">
                    Rs
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={originalPrice}
                    onChange={e => setOriginalPrice(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] font-mono focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Stock Units Available
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockCount}
                  onChange={e => setStockCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] font-mono focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
              </div>
            </div>
          </div>

          {/* Image Selection with Crash-Proof Compression */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#E8DDD8]">
              <h4 className="font-semibold text-sm text-[#2D1217]">
                Product Visual Asset
              </h4>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                ✓ Auto-Compressed & Safe
              </span>
            </div>

            {/* Method Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E8DDD8] pb-2">
              <button
                type="button"
                onClick={() => setImageMethod('gallery')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  imageMethod === 'gallery'
                    ? 'bg-[#5B1423] text-white shadow-xs'
                    : 'bg-white text-[#5C4449] hover:bg-[#FCECE9]'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload From Device</span>
              </button>

              <button
                type="button"
                onClick={() => setImageMethod('presets')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  imageMethod === 'presets'
                    ? 'bg-[#5B1423] text-white shadow-xs'
                    : 'bg-white text-[#5C4449] hover:bg-[#FCECE9]'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Boutique Presets</span>
              </button>

              <button
                type="button"
                onClick={() => setImageMethod('url')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium cursor-pointer transition-colors ${
                  imageMethod === 'url'
                    ? 'bg-[#5B1423] text-white shadow-xs'
                    : 'bg-white text-[#5C4449] hover:bg-[#FCECE9]'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image Web URL</span>
              </button>
            </div>

            {/* Gallery Upload Box */}
            {imageMethod === 'gallery' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[#5B1423] bg-[#FCECE9]'
                    : 'border-[#E8DDD8] bg-white hover:border-[#7A1C30]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                {isCompressing ? (
                  <div className="flex flex-col items-center justify-center space-y-2 py-4">
                    <Loader2 className="w-8 h-8 text-[#5B1423] animate-spin" />
                    <p className="font-semibold text-[#5B1423]">
                      Optimizing image resolution & compressing...
                    </p>
                    <p className="text-[11px] text-[#7A5B61]">
                      Downscaling to safe dimensions to prevent system crashes.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-[#7A5B61] mx-auto opacity-70" />
                    <div className="font-semibold text-[#2D1217]">
                      {uploadedFileName ? (
                        <span className="text-emerald-700 flex items-center justify-center gap-1">
                          <Check className="w-4 h-4" /> Ready: {uploadedFileName}
                        </span>
                      ) : (
                        <span>Click to browse device or drag and drop photo</span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#7A5B61]">
                      Supports PNG, JPG, WebP. High-res camera photos are automatically compressed safely without quality loss.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Presets */}
            {imageMethod === 'presets' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {sampleImages.map(sample => (
                  <div
                    key={sample.path}
                    onClick={() => {
                      setImageUrl(sample.path);
                      setUploadedFileName(null);
                    }}
                    className={`p-2 bg-white rounded-xl border cursor-pointer transition-all ${
                      imageUrl === sample.path
                        ? 'border-[#5B1423] ring-1 ring-[#5B1423]'
                        : 'border-[#E8DDD8] hover:border-[#7A1C30]'
                    }`}
                  >
                    <img
                      src={sample.path}
                      alt={sample.label}
                      className="w-full h-20 object-cover rounded-lg mb-1"
                    />
                    <div className="text-[10px] font-semibold text-[#2D1217] truncate">
                      {sample.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* URL Input */}
            {imageMethod === 'url' && (
              <div className="space-y-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => {
                    setUrlInput(e.target.value);
                    setImageUrl(e.target.value);
                  }}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
                <p className="text-[10px] text-[#7A5B61]">
                  Paste an image link from Unsplash, Shopify CDN, or secure cloud storage.
                </p>
              </div>
            )}

            {/* Live Preview */}
            <div className="p-3 bg-white rounded-xl border border-[#E8DDD8] flex items-center gap-4">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-16 h-16 rounded-lg object-cover border border-[#E8DDD8] bg-[#FAF7F2]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/src/assets/images/skincare_cleanser_moisturizer_1790516249925.jpg';
                }}
              />
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#7A5B61] tracking-wider block">
                  Active Asset Preview
                </span>
                <p className="text-xs text-[#2D1217] font-semibold truncate">
                  {title || 'Untitled Product'}
                </p>
                <p className="text-xs font-mono font-bold text-[#5B1423]">
                  {formatPrice(price)}
                </p>
              </div>
            </div>
          </div>

          {/* Description & Features */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-[#2D1217] pb-2 border-b border-[#E8DDD8]">
              Product Story & Highlights
            </h4>

            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Description *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe active ingredients, texture, sensory notes, and benefits..."
                className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                Features & Bullet Points (One per line)
              </label>
              <textarea
                rows={3}
                value={features}
                onChange={e => setFeatures(e.target.value)}
                placeholder="Triple Hyaluronic Acid&#10;100% Vegan & Cruelty Free&#10;pH 5.5 Barrier Balancing"
                className="w-full px-3 py-2 bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30] font-mono text-xs"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#E8DDD8] flex items-center justify-end gap-3 shrink-0">
            {backendOnline === false && (
              <span className="text-[11px] text-amber-700 mr-auto">
                Backend unreachable — saves locally, syncs on next sign-in.
              </span>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-[#E8DDD8] text-[#5C4449] rounded-lg font-semibold hover:bg-[#FCECE9] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCompressing || isSaving}
              className="px-6 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F2CAC2]" />
              <span>{isSaving ? 'Publishing...' : productToEdit ? 'Save Changes' : 'Publish Product to Catalog'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
