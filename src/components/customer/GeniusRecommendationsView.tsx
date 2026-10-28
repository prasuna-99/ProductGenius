import React, { useState } from 'react';
import {
  Sparkles,
  ShoppingBag,
  Sliders,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { formatPrice } from '../../utils/format';
import { ImageWithFallback } from '../common/ImageWithFallback';

export const GeniusRecommendationsView: React.FC = () => {
  const {
    products,
    associationRules,
    addToCart,
    instantOrder,
    setSelectedProductDetail,
    minConfidence,
  } = useApp();

  const productMap = new Map(products.map(p => [p.id, p]));
  // Rules are mined on canonicalIds (multi-seller dedup); resolve to a real listing for display.
  const repOf = (canonicalOrId: string) =>
    productMap.get(canonicalOrId) || products.find(p => p.canonicalId === canonicalOrId);

  // Selected seed item for interactive Apriori basket pairing simulator
  const [selectedSeedProductId, setSelectedSeedProductId] = useState<string>(
    products[0]?.id || 'PRD-000002-000001'
  );

  // Mined rules where antecedent contains the selected seed product (compare canonicals)
  const seedCanonical = productMap.get(selectedSeedProductId)?.canonicalId || selectedSeedProductId;
  const matchingSeedRules = associationRules.filter(r =>
    r.antecedent.includes(seedCanonical)
  );

  // Top overall rules with highest confidence & support
  const topRules = [...associationRules]
    .sort((a, b) => b.confidence * b.support - a.confidence * a.support)
    .slice(0, 6);

  const selectedSeedProduct = productMap.get(selectedSeedProductId);

  const handleAddBundle = (p1: Product, p2: Product) => {
    addToCart(p1, 1);
    addToCart(p2, 1);
  };

  const handleOrderBundle = (p1: Product, p2: Product) => {
    addToCart(p1, 1);
    instantOrder(p2, 1);
  };

  return (
    <div className="space-y-12 pb-16">

      {/* Feature 1: Highest Support & Confidence Top Mined Pairs */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-[#E8DDD8] pb-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#7A5B61] font-semibold">
              Frequently Bought Together
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#2D1217] tracking-tight">
              Top Pairs
            </h2>
          </div>
          <p className="text-xs text-[#5C4449] max-w-md">
            Pairs our customers love buying together.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topRules.map((rule, idx) => {
            const antecedentProduct = repOf(rule.antecedent[0]);
            const consequentProduct = repOf(rule.consequent[0]);
            if (!antecedentProduct || !consequentProduct) return null;

            const bundlePrice = antecedentProduct.price + consequentProduct.price;
            const discountedBundle = Math.round(bundlePrice * 0.9); // 10% bundle discount

            return (
              <div
                key={rule.id}
                className="bg-white rounded-2xl border border-[#E8DDD8] p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Top Stats Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-[#F5EBE6]">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B1423]">
                      <Sparkles className="w-3.5 h-3.5 text-[#5B1423]" />
                      <span>Pair #{idx + 1}</span>
                    </div>
                  </div>

                  {/* Visual Pair Showcase */}
                  <div className="grid grid-cols-2 gap-3 my-4">
                    {/* Item A */}
                    <div
                      onClick={() => setSelectedProductDetail(antecedentProduct)}
                      className="cursor-pointer group text-center"
                    >
                      <div className="rounded-lg overflow-hidden border border-[#E8DDD8] bg-[#FAF7F2] aspect-square mb-2">
                        <ImageWithFallback
                          src={antecedentProduct.imageUrl}
                          alt={antecedentProduct.title}
                          className="w-full h-full group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] text-[#7A5B61] uppercase tracking-wider block">
                        If You Buy
                      </span>
                      <h4 className="text-xs font-semibold text-[#2D1217] truncate">
                        {antecedentProduct.title}
                      </h4>
                      <div className="text-xs font-mono font-bold text-[#5B1423]">
                        {formatPrice(antecedentProduct.price)}
                      </div>
                    </div>

                    {/* Item B */}
                    <div
                      onClick={() => setSelectedProductDetail(consequentProduct)}
                      className="cursor-pointer group text-center"
                    >
                      <div className="rounded-lg overflow-hidden border border-[#F2CAC2] bg-[#FCECE9]/30 aspect-square mb-2">
                        <ImageWithFallback
                          src={consequentProduct.imageUrl}
                          alt={consequentProduct.title}
                          className="w-full h-full group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <span className="text-[10px] text-[#5B1423] font-semibold uppercase tracking-wider block">
                        Recommended
                      </span>
                      <h4 className="text-xs font-semibold text-[#2D1217] truncate">
                        {consequentProduct.title}
                      </h4>
                      <div className="text-xs font-mono font-bold text-[#5B1423]">
                        {formatPrice(consequentProduct.price)}
                      </div>
                    </div>
                  </div>

                </div>

                {/* Bottom Actions */}
                <div className="mt-4 pt-3 border-t border-[#F5EBE6] space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddBundle(antecedentProduct, consequentProduct)}
                      className="flex-1 py-2 px-2.5 bg-white hover:bg-[#FAF7F2] text-[#5B1423] border border-[#E8DDD8] text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Add Pair</span>
                    </button>
                    <button
                      onClick={() => handleOrderBundle(antecedentProduct, consequentProduct)}
                      className="flex-1 py-2 px-2.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F2CAC2]" />
                      <span>Order ({formatPrice(discountedBundle)})</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature 2: Interactive Apriori Basket Simulator */}
      <div className="bg-white rounded-2xl border border-[#E8DDD8] p-6 sm:p-8 shadow-sm space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#5B1423] mb-1">
            <Sliders className="w-3.5 h-3.5" /> Mix & Match
          </div>
          <h3 className="font-display text-2xl font-semibold text-[#2D1217]">
            Complete Your Basket
          </h3>
          <p className="text-xs text-[#5C4449] mt-1 leading-relaxed">
            Pick a product below and we will instantly suggest what goes well with it.
          </p>
        </div>

        {/* Product Selector Ribbon */}
        <div>
          <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-2">
            Step 1: Choose Your Primary Interest Item
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {products.slice(0, 4).map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedSeedProductId(p.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                  selectedSeedProductId === p.id
                    ? 'border-[#5B1423] bg-[#FCECE9] shadow-sm'
                    : 'border-[#E8DDD8] bg-[#FAF7F2] hover:border-[#7A1C30]'
                }`}
              >
                <ImageWithFallback
                  src={p.imageUrl}
                  alt={p.title}
                  className="w-12 h-12 rounded-lg border border-[#E8DDD8]"
                />
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#2D1217] truncate">{p.title}</div>
                  <div className="text-xs font-mono font-bold text-[#5B1423]">{formatPrice(p.price)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Mined Association Results */}
        <div className="pt-4 border-t border-[#E8DDD8]">
          <label className="block text-xs font-semibold text-[#7A5B61] uppercase tracking-wider mb-3">
            Step 2: Picks for {selectedSeedProduct?.title}
          </label>

          {matchingSeedRules.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DDD8] text-xs text-[#7A5B61]">
              No association rules meet the current threshold of min_conf: {(minConfidence * 100).toFixed(0)}%.
              Adjust thresholds in the Admin Dashboard or inspect other catalog items!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matchingSeedRules.map(rule => {
                const conseqProd = repOf(rule.consequent[0]);
                if (!conseqProd) return null;

                return (
                  <div
                    key={rule.id}
                    className="p-4 bg-[#FAF7F2] rounded-xl border border-[#E8DDD8] flex flex-col justify-between"
                  >
                    <div className="flex gap-4 items-start">
                      <ImageWithFallback
                        src={conseqProd.imageUrl}
                        alt={conseqProd.title}
                        className="w-20 h-20 rounded-lg border border-[#E8DDD8]"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-[#2D1217] truncate">
                          {conseqProd.title}
                        </h4>
                        <div className="text-xs font-mono font-bold text-[#5B1423] mt-0.5">
                          {formatPrice(conseqProd.price)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#E8DDD8] flex items-center justify-end gap-2">
                        <button
                          onClick={() => addToCart(conseqProd, 1)}
                          className="px-3 py-1.5 bg-white hover:bg-[#FAF7F2] text-[#5B1423] border border-[#E8DDD8] text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                        >
                          + Add
                        </button>
                        <button
                          onClick={() => instantOrder(conseqProd, 1)}
                          className="px-3 py-1.5 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3 text-[#F2CAC2]" />
                          <span>Order</span>
                        </button>
                      </div>
                    </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
