// Apriori + association rules. Line-for-line port of src/utils/apriori.ts
// (TypeScript) to plain Node. Operates on CANONICAL ids so same product
// from different sellers merges instead of splitting support.
function isSubset(subset, superset) {
  const s = new Set(superset);
  return subset.every(x => s.has(x));
}

function getCombinations(arr, k) {
  if (k === 0) return [[]];
  if (arr.length === 0) return [];
  const [head, ...tail] = arr;
  return [
    ...getCombinations(tail, k - 1).map(c => [head, ...c]),
    ...getCombinations(tail, k),
  ];
}

function generateCandidates(prev, k) {
  const out = [];
  for (let i = 0; i < prev.length; i++) {
    for (let j = i + 1; j < prev.length; j++) {
      const a = prev[i], b = prev[j];
      if (a.slice(0, k - 2).every((v, x) => v === b.slice(0, k - 2)[x])) {
        const union = [...new Set([...a, ...b])].sort();
        if (union.length === k) {
          const subs = getCombinations(union, k - 1);
          const ok = subs.every(sub =>
            prev.some(f => f.length === sub.length && sub.every((v, x) => v === f[x]))
          );
          if (ok) out.push(union);
        }
      }
    }
  }
  const seen = new Set(), uniq = [];
  for (const c of out) {
    const key = c.join(':::');
    if (!seen.has(key)) { seen.add(key); uniq.push(c); }
  }
  return uniq;
}

function countSupport(itemset, transactions) {
  let n = 0;
  for (const tx of transactions) if (isSubset(itemset, tx.itemIds)) n++;
  return n;
}

function runApriori(transactions, minSupport = 0.04, maxItemsetSize = 3) {
  const total = transactions.length;
  if (!total) return [];
  const minCount = Math.max(1, Math.ceil(minSupport * total));
  const all = [];
  const counts = {};
  for (const tx of transactions)
    for (const id of tx.itemIds) counts[id] = (counts[id] || 0) + 1;
  let cur = [];
  for (const [id, c] of Object.entries(counts)) {
    if (c >= minCount) {
      cur.push([id]);
      all.push({ items: [id], supportCount: c, support: +(c / total).toFixed(4) });
    }
  }
  cur.sort((a, b) => a[0].localeCompare(b[0]));
  let k = 2;
  while (cur.length && k <= maxItemsetSize) {
    const next = [];
    for (const cand of generateCandidates(cur, k)) {
      const c = countSupport(cand, transactions);
      if (c >= minCount) {
        next.push(cand);
        all.push({ items: cand, supportCount: c, support: +(c / total).toFixed(4) });
      }
    }
    cur = next;
    k++;
  }
  return all;
}

function generateAssociationRules(frequentItemsets, transactions, minConfidence = 0.4) {
  const total = transactions.length;
  if (!total) return [];
  const sup = new Map();
  for (const fi of frequentItemsets)
    sup.set([...fi.items].sort().join(':::'), { count: fi.supportCount, support: fi.support });
  const get = items => {
    const key = [...items].sort().join(':::');
    if (sup.has(key)) return sup.get(key);
    const count = countSupport(items, transactions);
    return { count, support: count / total };
  };
  const rules = [];
  for (const fi of frequentItemsets.filter(f => f.items.length >= 2)) {
    for (let r = 1; r < fi.items.length; r++) {
      for (const ant of getCombinations(fi.items, r)) {
        const set = new Set(ant);
        const cons = fi.items.filter(x => !set.has(x));
        const a = get(ant);
        if (!a.count) continue;
        const conf = fi.supportCount / a.count;
        if (conf >= minConfidence) {
          const c = get(cons);
          rules.push({
            id: `${[...ant].sort().join('+')}_to_${[...cons].sort().join('+')}`,
            antecedent: [...ant].sort(),
            consequent: [...cons].sort(),
            support: +fi.support.toFixed(4),
            confidence: +conf.toFixed(4),
            lift: c.support > 0 ? +(conf / c.support).toFixed(2) : 1.0,
            transactionCount: fi.supportCount,
            antecedentCount: a.count,
          });
        }
      }
    }
  }
  const seen = new Set();
  const uniq = rules.filter(r => !seen.has(r.id) && (seen.add(r.id), true));
  uniq.sort((a, b) => b.confidence - a.confidence || b.support - a.support || b.lift - a.lift);
  return uniq;
}

// resolve(canonical) -> representative product row (prefer in-stock). Injected by routes.
function getRecommendations(cartCanonicals, rules, products, limit = 4, resolve) {
  const have = new Set(cartCanonicals);
  const match = rules
    .filter(r => r.antecedent.every(a => have.has(a)) && r.consequent.some(c => !have.has(c)))
    .sort((a, b) => b.confidence * b.support - a.confidence * a.support);
  const out = [], used = new Set(cartCanonicals);
  const push = rule => {
    for (const c of rule.consequent) {
      if (used.has(c)) continue;
      const p = resolve(c);
      if (!p) continue;
      used.add(c);
      out.push({ rule, recommendedProduct: p, confidencePercent: Math.round(rule.confidence * 100), supportPercent: Math.round(rule.support * 100), lift: rule.lift });
      if (out.length >= limit) return true;
    }
    return false;
  };
  for (const r of match) if (push(r)) return out;
  for (const r of rules) if (push(r)) break;
  return out;
}

module.exports = { runApriori, generateAssociationRules, getRecommendations };
