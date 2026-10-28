import React from 'react';
import { X, Sparkles, HelpCircle, ArrowRight, CheckCircle2, TrendingUp, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const AprioriMathModal: React.FC = () => {
  const { activeMathModalRule, setActiveMathModalRule, products, transactions } = useApp();

  if (!activeMathModalRule) return null;

  const rule = activeMathModalRule;
  const productMap = new Map(products.map(p => [p.id, p]));
  // Rules are canonical; fall back to representative listing with same canonicalId.
  const repOf = (id: string) => productMap.get(id) || products.find(p => p.canonicalId === id);

  const antecedentProds = rule.antecedent.map(id => repOf(id)).filter(Boolean);
  const consequentProds = rule.consequent.map(id => repOf(id)).filter(Boolean);

  const totalN = transactions.length;
  const bothCount = rule.transactionCount;
  const antCount = rule.antecedentCount;
  const supportPct = (rule.support * 100).toFixed(1);
  const confidencePct = (rule.confidence * 100).toFixed(1);
  const liftVal = rule.lift.toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-2xl shadow-2xl border border-[#E8DDD8] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#5B1423] text-white p-6 relative">
          <button
            onClick={() => setActiveMathModalRule(null)}
            className="absolute top-5 right-5 text-[#FAF7F2]/80 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#F2CAC2]" />
            <span className="text-xs uppercase tracking-wider text-[#F2CAC2] font-semibold">
              Apriori Algorithm & Association Proof
            </span>
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight block">
            Why ProductGenius Recommended This Pair
          </span>
          <p className="text-xs text-[#E8DDD8] mt-1">
            Mathematical derivation mined from real-time customer market basket transactions.
          </p>
        </div>

        {/* Scrollable Proof Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-[#2D1217]">
          
          {/* Rule Statement Visualizer */}
          <div className="p-4 bg-white rounded-xl border border-[#E8DDD8] shadow-sm">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[#7A5B61] mb-2">
              Mined Association Rule (A ⇒ B)
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 bg-[#FAF7F2] p-3 rounded-lg border border-[#E8DDD8]">
                <span className="text-[10px] text-[#7A5B61] uppercase tracking-wider font-semibold block mb-1">
                  Antecedent Condition (A)
                </span>
                <div className="space-y-1">
                  {antecedentProds.map(p => (
                    <div key={p?.id} className="text-xs font-semibold text-[#5B1423]">
                      • {p?.title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center p-2 text-[#5B1423]">
                <ArrowRight className="w-6 h-6" />
              </div>

              <div className="flex-1 bg-[#FCECE9] p-3 rounded-lg border border-[#F2CAC2]">
                <span className="text-[10px] text-[#5B1423] uppercase tracking-wider font-semibold block mb-1">
                  Consequent Recommendation (B)
                </span>
                <div className="space-y-1">
                  {consequentProds.map(p => (
                    <div key={p?.id} className="text-xs font-semibold text-[#5B1423]">
                      • {p?.title}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tri-Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-white rounded-xl border border-[#E8DDD8]">
              <div className="text-xs text-[#7A5B61] uppercase tracking-wider font-semibold mb-1">
                Support (Frequency)
              </div>
              <div className="text-2xl font-bold text-[#5B1423] font-mono tabular-nums">
                {supportPct}%
              </div>
              <p className="text-[11px] text-[#5C4449] mt-1 leading-snug">
                {bothCount} out of {totalN} total customer checkout baskets contained this combination.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E8DDD8]">
              <div className="text-xs text-[#7A5B61] uppercase tracking-wider font-semibold mb-1">
                Confidence (Affinity)
              </div>
              <div className="text-2xl font-bold text-[#7A1C30] font-mono tabular-nums">
                {confidencePct}%
              </div>
              <p className="text-[11px] text-[#5C4449] mt-1 leading-snug">
                When buyers purchased A, {confidencePct}% of the time they also bought B.
              </p>
            </div>

            <div className="p-4 bg-white rounded-xl border border-[#E8DDD8]">
              <div className="text-xs text-[#7A5B61] uppercase tracking-wider font-semibold mb-1">
                Lift Ratio
              </div>
              <div className="text-2xl font-bold text-[#2D1217] font-mono tabular-nums flex items-center gap-1">
                <span>{liftVal}x</span>
                {rule.lift > 1.2 && <TrendingUp className="w-4 h-4 text-emerald-600 inline" />}
              </div>
              <p className="text-[11px] text-[#5C4449] mt-1 leading-snug">
                {rule.lift > 1.0 
                  ? `Item B is ${liftVal}x more likely to be co-purchased with A than random chance.`
                  : 'Independent purchasing behavior.'}
              </p>
            </div>
          </div>

          {/* Deep Formula Breakdown */}
          <div className="bg-white p-5 rounded-xl border border-[#E8DDD8] space-y-4 text-xs">
            <h4 className="font-semibold text-sm text-[#2D1217] flex items-center gap-2">
              <Info className="w-4 h-4 text-[#5B1423]" />
              Apriori Formula Walkthrough
            </h4>

            <div className="space-y-3 font-mono text-[11px] bg-[#FAF7F2] p-4 rounded-lg border border-[#E8DDD8]">
              <div>
                <strong className="text-[#5B1423]">1. Support Formula:</strong>
                <div className="text-[#2D1217] mt-0.5">
                  Support(A ∪ B) = Count(A ∪ B) / Total Baskets (N)
                </div>
                <div className="text-[#7A5B61] mt-0.5">
                  = {bothCount} / {totalN} = {(rule.support).toFixed(4)} ({supportPct}%)
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8DDD8]">
                <strong className="text-[#5B1423]">2. Confidence Formula:</strong>
                <div className="text-[#2D1217] mt-0.5">
                  Confidence(A ⇒ B) = Count(A ∪ B) / Count(A)
                </div>
                <div className="text-[#7A5B61] mt-0.5">
                  = {bothCount} / {antCount} = {(rule.confidence).toFixed(4)} ({confidencePct}%)
                </div>
              </div>

              <div className="pt-2 border-t border-[#E8DDD8]">
                <strong className="text-[#5B1423]">3. Lift Formula:</strong>
                <div className="text-[#2D1217] mt-0.5">
                  Lift(A ⇒ B) = Confidence(A ⇒ B) / Support(B)
                </div>
                <div className="text-[#7A5B61] mt-0.5">
                  = {rule.confidence.toFixed(2)} / {((rule.confidence / rule.lift) || 0.1).toFixed(2)} = {liftVal}
                </div>
              </div>
            </div>

            <p className="text-[#5C4449] leading-relaxed">
              Unlike black-box algorithmic recommendations, the Apriori association rule guarantee ensures full mathematical explainability. Customers purchasing these items together reflect consistent real-world purchase intent across our database.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-[#E8DDD8] flex justify-end">
          <button
            onClick={() => setActiveMathModalRule(null)}
            className="px-5 py-2 bg-[#5B1423] hover:bg-[#7A1C30] text-white text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
