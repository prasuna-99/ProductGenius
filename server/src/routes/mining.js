const express = require('express');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { runApriori, generateAssociationRules, getRecommendations } = require('../apriori');

const router = express.Router();

// In-memory rule cache (swap for Redis in production: key minSupport:minConfidence)
let cache = { key: '', rules: [], frequent: [], at: 0 };

async function mine(minSupport = 0.04, minConfidence = 0.4) {
  const key = `${minSupport}:${minConfidence}`;
  if (cache.key === key && cache.rules.length) return cache;
  const txns = await prisma.transaction.findMany();
  const canon = txns.map(t => ({ ...t, itemIds: [...new Set(t.itemIds)] }));
  const frequent = runApriori(canon, minSupport, 3);
  const rules = generateAssociationRules(frequent, canon, minConfidence);
  cache = { key, rules, frequent, at: Date.now() };
  return cache;
}

function repOf(products, canonical) {
  return (
    products.find(p => p.canonicalId === canonical && p.inStock) ||
    products.find(p => p.canonicalId === canonical)
  );
}

// GET /api/mining/rules?minSupport=0.04&minConfidence=0.4
router.get('/rules', async (req, res, next) => {
  try {
    const ms = Number(req.query.minSupport ?? 0.04);
    const mc = Number(req.query.minConfidence ?? 0.4);
    const { rules, frequent, at } = await mine(ms, mc);
    res.json({ rules, frequentItemsets: frequent, minedAt: at });
  } catch (e) { next(e); }
});

// GET /api/mining/recommend?cart=<listingId,listingId>  (resolves to listings)
router.get('/recommend', async (req, res, next) => {
  try {
    const ms = Number(req.query.minSupport ?? 0.04);
    const mc = Number(req.query.minConfidence ?? 0.4);
    const cartIds = String(req.query.cart || '').split(',').map(s => s.trim()).filter(Boolean);
    const { rules } = await mine(ms, mc);
    const products = await prisma.product.findMany({ where: { inStock: true } });
    const byId = new Map(products.map(p => [p.id, p]));
    const cartCanon = [...new Set(cartIds.map(id => (byId.get(id) || {}).canonicalId || id))];
    const canonProducts = [...new Map(products.map(p => [p.canonicalId, { ...p, id: p.canonicalId }])).values()];
    const raw = getRecommendations(cartCanon, rules, canonProducts, 4, c => repOf(products, c));
    res.json(
      raw.map(r => ({
        ...r,
        recommendedProduct: repOf(products, r.recommendedProduct.id) || r.recommendedProduct,
      }))
    );
  } catch (e) { next(e); }
});

// POST /api/mining/recompute  (admin; e.g. after dataset import)
router.post('/recompute', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    cache = { key: '', rules: [], frequent: [], at: 0 };
    const { rules, frequent } = await mine(
      Number(req.query.minSupport ?? 0.04), Number(req.query.minConfidence ?? 0.4)
    );
    res.json({ rules: rules.length, frequentItemsets: frequent.length });
  } catch (e) { next(e); }
});

module.exports = router;
