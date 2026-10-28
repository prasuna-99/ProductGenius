import React, { useState } from 'react';
import { X, Trash2, ShoppingBag, ArrowRight, Sparkles, Tag, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPrice } from '../utils/format';
import { ImageWithFallback } from './common/ImageWithFallback';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    cartSubtotal,
    removeFromCart,
    updateCartQuantity,
    cartRecommendations,
    addToCart,
    setActiveMathModalRule,
    setIsCheckoutModalOpen,
    activeCampaigns,
  } = useApp();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    const camp = activeCampaigns.find(c => c.discountCode.toUpperCase() === clean);
    if (camp) {
      setAppliedCoupon(camp.discountCode);
    } else if (clean === 'GENIUS10' || clean === 'BUNDLE15') {
      setAppliedCoupon(clean);
    }
  };

  let discountRate = 0;
  if (appliedCoupon) {
    const camp = activeCampaigns.find(c => c.discountCode === appliedCoupon);
    if (camp) {
      discountRate = camp.discountPercent / 100;
    } else if (appliedCoupon === 'GENIUS10') {
      discountRate = 0.10;
    } else if (appliedCoupon === 'BUNDLE15') {
      discountRate = 0.15;
    }
  }

  const discountAmount = Math.round(cartSubtotal * discountRate);
  const finalTotal = Math.max(0, cartSubtotal - discountAmount);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-[#FAF7F2] shadow-2xl border-l border-[#E8DDD8] flex flex-col">
          
          {/* Header */}
          <div className="p-5 border-b border-[#E8DDD8] bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#5B1423]" />
              <h2 className="font-display text-xl font-semibold text-[#2D1217]">
                Shopping Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-[#7A5B61] hover:text-[#2D1217] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-16 space-y-4">
                <div className="w-16 h-16 rounded-full bg-[#FCECE9] text-[#5B1423] mx-auto flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 opacity-70" />
                </div>
                <h3 className="text-sm font-semibold text-[#2D1217]">Your bag is empty</h3>
                <p className="text-xs text-[#7A5B61] max-w-xs mx-auto">
                  Explore our curated selection of Skincare, Makeup, Bodycare, and Fragrance in Rupees.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-2 px-4 py-2 bg-[#5B1423] text-white text-xs font-semibold uppercase tracking-wider rounded-lg hover:bg-[#7A1C30] transition-colors cursor-pointer"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="p-3 bg-white rounded-xl border border-[#E8DDD8] flex gap-3 shadow-sm"
                  >
                    <ImageWithFallback
                      src={item.product.imageUrl}
                      alt={item.product.title}
                      className="w-18 h-18 rounded-lg border border-[#E8DDD8]"
                    />

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-semibold text-[#2D1217] truncate">
                            {item.product.title}
                          </h4>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-[#7A5B61] hover:text-rose-600 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-[#7A5B61]">
                          {formatPrice(item.product.price)} each
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center border border-[#E8DDD8] rounded-md overflow-hidden bg-[#FAF7F2]">
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-[#5B1423] hover:bg-[#FCECE9] transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-semibold font-mono text-[#2D1217]">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-[#5B1423] hover:bg-[#FCECE9] transition-colors cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <div className="text-xs font-bold font-mono text-[#5B1423]">
                          {formatPrice(item.product.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Apriori In-Cart Recommendations */}
            {cart.length > 0 && cartRecommendations.length > 0 && (
              <div className="pt-4 border-t border-[#E8DDD8]">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-[#5B1423]" />
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#5B1423]">
                    Apriori Market Basket Recommendations
                  </h4>
                </div>
                <p className="text-[11px] text-[#5C4449] mb-3 leading-snug">
                  Based on items in your bag, these products have the highest co-purchase frequency in our 300 transaction history:
                </p>

                <div className="space-y-2">
                  {cartRecommendations.slice(0, 2).map(rec => (
                    <div
                      key={rec.recommendedProduct.id}
                      className="p-3 bg-[#FCECE9]/60 rounded-xl border border-[#F2CAC2] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ImageWithFallback
                          src={rec.recommendedProduct.imageUrl}
                          alt={rec.recommendedProduct.title}
                          className="w-12 h-12 rounded-lg border border-[#E8DDD8]"
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-semibold text-[#2D1217] truncate">
                            {rec.recommendedProduct.title}
                          </h5>
                          <div className="text-xs font-mono font-bold text-[#5B1423]">
                            {formatPrice(rec.recommendedProduct.price)}
                          </div>
                          <div className="text-[10px] text-[#7A1C30]">
                            {rec.confidencePercent}% Confidence · {rec.supportPercent}% Support
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <button
                          onClick={() => addToCart(rec.recommendedProduct, 1)}
                          className="px-2.5 py-1 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-[11px] font-medium rounded-md transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => setActiveMathModalRule(rec.rule)}
                          className="text-[10px] text-[#7A5B61] hover:underline cursor-pointer"
                        >
                          See Math
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer & Checkout Module */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-[#E8DDD8] bg-white space-y-3">
              {/* Coupon Form */}
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Coupon code (e.g. FESTIVE25)"
                  value={couponCode}
                  onChange={e => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E8DDD8] rounded-lg text-[#2D1217] uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#FCECE9] text-[#5B1423] text-xs font-semibold rounded-lg border border-[#E8DDD8] transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>

              {appliedCoupon && (
                <div className="text-[11px] text-emerald-700 flex items-center gap-1">
                  <Tag className="w-3 h-3" /> Coupon active: <strong>{appliedCoupon}</strong> ({(discountRate * 100).toFixed(0)}% off)
                </div>
              )}

              {/* Order Calculations in Rs */}
              <div className="space-y-1.5 text-xs text-[#5C4449]">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatPrice(cartSubtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono">-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Shipping</span>
                  <span className="text-emerald-700 font-medium">Complimentary</span>
                </div>
                <div className="pt-2 border-t border-[#E8DDD8] flex justify-between text-sm font-bold text-[#2D1217]">
                  <span>Total Amount</span>
                  <span className="font-mono text-[#5B1423] text-base">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  setIsCheckoutModalOpen(true);
                }}
                className="w-full py-3 px-4 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-[#7A5B61] text-center pt-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Encrypted checkout · Orders in Rupees (Rs)</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
