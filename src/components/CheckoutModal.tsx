import React, { useState } from 'react';
import { X, CheckCircle, ArrowRight, ShoppingBag, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPrice } from '../utils/format';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutModalOpen,
    setIsCheckoutModalOpen,
    cart,
    cartSubtotal,
    placeOrder,
    setActiveCustomerTab,
    activeCampaigns,
  } = useApp();

  const [street, setStreet] = useState('Durbar Marg, Heritage Square 4');
  const [city, setCity] = useState('Kathmandu');
  const [state, setState] = useState('Bagmati');
  const [zip, setZip] = useState('44600');
  const [couponCode, setCouponCode] = useState(
    activeCampaigns.length > 0 ? activeCampaigns[0].discountCode : ''
  );
  const [placedOrderInfo, setPlacedOrderInfo] = useState<{ id: string; tracking: string } | null>(null);
  const [isPlacing, setIsPlacing] = useState(false);

  if (!isCheckoutModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPlacing(true);
    try {
      const order = await placeOrder({ street, city, state, zip }, couponCode);
      setPlacedOrderInfo({ id: order.id, tracking: order.trackingNumber });
    } finally {
      setIsPlacing(false);
    }
  };

  const handleFinish = (targetTab: 'orders' | 'storefront' = 'orders') => {
    setPlacedOrderInfo(null);
    setIsCheckoutModalOpen(false);
    setActiveCustomerTab(targetTab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#5B1423] text-white p-6 relative">
          {!placedOrderInfo && (
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-5 right-5 text-[#FAF7F2]/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
          <span className="font-display text-2xl font-semibold tracking-tight block">
            {placedOrderInfo ? 'Order Confirmed' : 'Boutique Checkout'}
          </span>
          <p className="text-xs text-[#F2CAC2] mt-1">
            {placedOrderInfo
              ? 'Thank you for your order. Your items are being prepared for dispatch.'
              : 'Complete your delivery destination for expedited, insured shipping in Rs.'}
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {placedOrderInfo ? (
            <div className="text-center py-6 space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 mx-auto flex items-center justify-center shadow-inner">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#2D1217]">
                  Order {placedOrderInfo.id} Successfully Placed
                </h3>
                <p className="text-xs text-[#5C4449] mt-1">
                  Tracking Reference: <strong className="font-mono text-[#5B1423]">{placedOrderInfo.tracking}</strong>
                </p>
              </div>

              <div className="p-4 bg-white rounded-xl border border-[#E8DDD8] text-left text-xs text-[#5C4449] space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>Dispatch in Progress</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  Your order is currently <strong>Processing</strong>. You can follow live transit updates, view order receipts, and track dispatch milestones directly in your order history.
                </p>
              </div>

              {/* Clean user navigation actions */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => handleFinish('orders')}
                  className="w-full sm:w-auto px-6 py-2.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#F2CAC2]" />
                  <span>View in My Orders</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFinish('storefront')}
                  className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-[#FCECE9] text-[#5B1423] border border-[#E8DDD8] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Order Summary Recap */}
              <div className="p-3.5 bg-white rounded-xl border border-[#E8DDD8] space-y-2 text-xs">
                <div className="font-semibold text-[#7A5B61] uppercase tracking-wider text-[10px]">
                  Order Items ({cart.length} item{cart.length !== 1 ? 's' : ''})
                </div>
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-2">
                  {cart.map(item => (
                    <div key={item.product.id} className="flex justify-between items-center text-[#2D1217]">
                      <span className="truncate max-w-[280px]">
                        {item.quantity}x {item.product.title}
                      </span>
                      <span className="font-mono font-medium text-[#5B1423]">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-[#E8DDD8] flex justify-between font-bold text-sm text-[#5B1423]">
                  <span>Total Amount</span>
                  <span className="font-mono text-base">{formatPrice(cartSubtotal)}</span>
                </div>
              </div>

              {/* Coupon / Campaign Code */}
              <div>
                <label className="block text-[11px] font-semibold text-[#7A5B61] uppercase tracking-wider mb-1">
                  Festival / Season Offer Coupon
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. FESTIVE25, DASHAIN30, AUTUMN20"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] uppercase font-mono tracking-wider focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                  />
                  {activeCampaigns.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCouponCode(activeCampaigns[0].discountCode)}
                      className="px-2.5 py-1.5 bg-[#FCECE9] text-[#5B1423] border border-[#F2CAC2] rounded-lg text-[10px] font-bold uppercase cursor-pointer hover:bg-[#F5DBD5]"
                    >
                      Use {activeCampaigns[0].discountCode}
                    </button>
                  )}
                </div>
              </div>

              {/* Shipping Address Inputs */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#7A5B61] uppercase tracking-wider">
                  Delivery Destination
                </div>

                <div>
                  <label className="block text-[11px] text-[#7A5B61] mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={street}
                    onChange={e => setStreet(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#7A5B61] mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7A5B61] mb-1">State / Province</label>
                    <input
                      type="text"
                      required
                      value={state}
                      onChange={e => setState(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#7A5B61] mb-1">Postal Code</label>
                    <input
                      type="text"
                      required
                      value={zip}
                      onChange={e => setZip(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E8DDD8] rounded-lg text-[#2D1217] focus:outline-none focus:ring-1 focus:ring-[#7A1C30]"
                    />
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isPlacing}
                  className="w-full py-3 bg-[#5B1423] hover:bg-[#7A1C30] text-white font-semibold text-xs uppercase tracking-wider rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <span>{isPlacing ? 'Placing Order...' : `Confirm Order (${formatPrice(cartSubtotal)})`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
