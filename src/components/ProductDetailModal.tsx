import React, { useState } from 'react';
import { X, Star, ShoppingBag, Heart, Sparkles, Check, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Product } from '../types';
import { formatPrice } from '../utils/format';
import { ImageWithFallback } from './common/ImageWithFallback';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProductDetail,
    setSelectedProductDetail,
    addToCart,
    wishlist,
    toggleWishlist,
    associationRules,
    products,
    instantOrder,
    reviews,
  } = useApp();

  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  if (!selectedProductDetail) return null;

  const product = selectedProductDetail;
  const isWishlisted = wishlist.includes(product.id);
  const productMap = new Map(products.map(p => [p.id, p]));
  // Rules are mined on canonicalIds (multi-seller dedup); resolve to listings for display.
  const repOf = (canonicalOrId: string) =>
    productMap.get(canonicalOrId) || products.find(p => p.canonicalId === canonicalOrId);

  // Find Apriori rules where antecedent contains this product (compare canonicals)
  const myCanonical = product.canonicalId || product.id;
  const relatedRules = associationRules.filter(r => r.antecedent.includes(myCanonical));

  // Extract distinct recommendations (skip self)
  const relatedItems = relatedRules.flatMap(rule =>
    rule.consequent.map(conseqId => ({
      rule,
      product: repOf(conseqId),
    }))
  ).filter((item): item is { rule: typeof relatedRules[0]; product: Product } =>
    Boolean(item.product) && item.product!.id !== product.id
  );

  const productReviews = reviews.filter(r => r.productId === product.id);
  const avgRating =
    productReviews.length > 0
      ? productReviews.reduce((s, r) => s + r.rating, 0) / productReviews.length
      : product.rating;

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E8DDD8] bg-white">
          <div className="text-xs font-semibold uppercase tracking-wider text-[#7A5B61]">
            {product.category} · SKU: {product.sku}
          </div>
          <button
            onClick={() => setSelectedProductDetail(null)}
            className="text-[#7A5B61] hover:text-[#2D1217] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Product Image & Badges */}
            <div className="relative rounded-xl overflow-hidden bg-white border border-[#E8DDD8] shadow-sm">
              <ImageWithFallback
                src={product.imageUrl}
                alt={product.title}
                className="w-full h-80 sm:h-96"
              />
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`absolute top-4 right-4 p-2.5 rounded-full backdrop-blur-md shadow-md transition-colors cursor-pointer ${
                  isWishlisted ? 'bg-[#5B1423] text-white' : 'bg-white/80 text-[#5B1423] hover:bg-white'
                }`}
                aria-label="Wishlist"
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>

              <div className="p-4 bg-[#FAF7F2] border-t border-[#E8DDD8] flex items-center justify-between text-xs text-[#5C4449]">
                <span>Artisan: <strong>{product.sellerName}</strong></span>
                <span className={product.inStock ? 'text-emerald-700 font-medium' : 'text-rose-700 font-medium'}>
                  {product.inStock ? `In Stock (${product.stockCount} available)` : 'Out of Stock'}
                </span>
              </div>
            </div>

            {/* Contiguous Purchase Module */}
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#2D1217] tracking-tight">
                  {product.title}
                </h2>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-[#7A5B61]">
                  <div className="flex items-center text-amber-600">
                    <Star className="w-4 h-4 fill-current text-amber-500 mr-1" />
                    <span className="font-bold">{product.rating}</span>
                  </div>
                  <span>·</span>
                  <span>{product.reviewsCount} Verified Reviews</span>
                  <span>·</span>
                  <span className="text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Authenticity Verified
                  </span>
                </div>
              </div>

              {/* Pricing in Rs */}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-[#5B1423] font-mono tabular-nums">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <span className="text-base text-[#7A5B61] line-through font-mono tabular-nums">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-[#5C4449] leading-relaxed">
                {product.description}
              </p>

              {/* Features List */}
              <div className="space-y-1.5 pt-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#7A5B61]">
                  Artisanal Specifications
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#2D1217]">
                  {product.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="text-[#5B1423] font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quantity & Add to Cart */}
              <div className="pt-4 border-t border-[#E8DDD8] space-y-3">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-[#E8DDD8] rounded-lg bg-white overflow-hidden">
                    <button
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      className="px-3 py-1.5 text-sm text-[#5B1423] hover:bg-[#FCECE9] transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1.5 text-sm font-semibold font-mono text-[#2D1217]">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(q => q + 1)}
                      className="px-3 py-1.5 text-sm text-[#5B1423] hover:bg-[#FCECE9] transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={!product.inStock}
                      className={`flex-1 py-3 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-[#E8DDD8] shadow-xs cursor-pointer ${
                        product.inStock
                          ? addedNotice
                            ? 'bg-emerald-700 text-white'
                            : 'bg-white hover:bg-[#FAF7F2] text-[#5B1423]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {addedNotice ? (
                        <>
                          <Check className="w-4 h-4" /> Added!
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-4 h-4" /> Add to Bag
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => instantOrder(product, quantity)}
                      disabled={!product.inStock}
                      className={`flex-1 py-3 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer ${
                        product.inStock
                          ? 'bg-[#5B1423] hover:bg-[#7A1C30] text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-4 h-4 text-[#F2CAC2]" />
                      <span>Order Now ({formatPrice(product.price * quantity)})</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Apriori Pairings Section */}
          {relatedItems.length > 0 && (
            <div className="pt-6 border-t border-[#E8DDD8]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#5B1423]" />
                  <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                    A Little Something for You
                  </h3>
                </div>
                <div className="text-xs text-[#7A5B61]">
                  Mined with Apriori algorithm from 300 checkout baskets
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedItems.slice(0, 2).map(({ rule, product: pairedProd }) => (
                  <div
                    key={`${rule.id}-${pairedProd.id}`}
                    className="p-4 bg-white rounded-xl border border-[#E8DDD8] shadow-sm flex flex-col justify-between"
                  >
                    <div className="flex gap-3">
                      <ImageWithFallback
                        src={pairedProd.imageUrl}
                        alt={pairedProd.title}
                        className="w-16 h-16 rounded-lg border border-[#E8DDD8]"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#7A5B61] uppercase tracking-wider">
                          Frequently Bought Together
                        </div>
                        <h4 className="text-xs font-semibold text-[#2D1217] truncate">
                          {pairedProd.title}
                        </h4>
                        <div className="text-xs font-mono font-bold text-[#5B1423] mt-0.5">
                          {formatPrice(pairedProd.price)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#F5EBE6] flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => addToCart(pairedProd, 1)}
                          className="px-2.5 py-1 bg-white hover:bg-[#FAF7F2] text-[#5B1423] text-xs font-semibold rounded-md border border-[#E8DDD8] transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => instantOrder(pairedProd, 1)}
                          className="px-2.5 py-1 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-md transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-[#F2CAC2]" />
                          <span>Order</span>
                        </button>
                      </div>
                    </div>
                ))}
              </div>
            </div>
          )}

          {/* Customer Reviews (live average of rates) */}
          <div className="pt-6 border-t border-[#E8DDD8]">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              <h3 className="font-display text-xl font-semibold text-[#2D1217]">
                Customer Reviews ({productReviews.length})
              </h3>
            </div>
            {productReviews.length > 0 && (
              <div className="text-xs text-[#7A5B61] mb-4">
                Average rating <strong className="font-mono text-[#5B1423]">{avgRating.toFixed(1)}/5</strong> from verified delivered orders
              </div>
            )}
            {productReviews.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-xl border border-[#E8DDD8] text-xs text-[#7A5B61]">
                No reviews yet. Customers can review this product after delivery from My Orders.
              </div>
            ) : (
              <div className="space-y-3">
                {productReviews.map(r => (
                  <div key={r.id} className="p-4 bg-white rounded-xl border border-[#E8DDD8] flex gap-3">
                    {r.imageUrl && (
                      <ImageWithFallback
                        src={r.imageUrl}
                        alt={`Photo by ${r.userName}`}
                        className="w-16 h-16 rounded-lg border border-[#E8DDD8] shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(n => (
                          <Star
                            key={n}
                            className={`w-3.5 h-3.5 ${n <= r.rating ? 'fill-amber-400 text-amber-500' : 'text-[#D8C9C4]'}`}
                          />
                        ))}
                        <span className="ml-1 text-[11px] font-mono font-bold text-[#5B1423]">{r.rating}/5</span>
                      </div>
                      <p className="text-xs text-[#2D1217] mt-1 leading-relaxed">{r.text}</p>
                      <div className="text-[11px] text-[#7A5B61] mt-1">
                        {r.userName} · {r.date}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
