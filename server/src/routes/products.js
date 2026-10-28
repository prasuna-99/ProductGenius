const express = require('express');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { canonicalOfTitle } = require('../dataset');
const { tombstone } = require('../tombstones');
const { productId: newProductId, nextSeq } = require('../ids');

const router = express.Router();

// GET /api/products?sellerId=&category=  (public storefront)
router.get('/', async (req, res, next) => {
  try {
    const where = {};
    if (req.query.sellerId) where.sellerId = req.query.sellerId;
    if (req.query.category) where.category = req.query.category;
    res.json(await prisma.product.findMany({ where, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const p = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (e) { next(e); }
});

// POST /api/products  (seller; server stamps sellerId + canonicalId — never trusts client)
router.post('/', requireAuth, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const b = req.body;
    if (!b.title || !b.price) return res.status(400).json({ error: 'title, price required' });
    const sellerId = req.user.role === 'seller' ? req.user.id : (b.sellerId || req.user.id);
    const seller = await prisma.user.findUnique({ where: { id: sellerId } });
    // ID = PRD-<sellerSeq>-<perSellerSeq>
    const n = await nextSeq(prisma, `PRD:${sellerId}`);
    const p = await prisma.product.create({
      data: {
        id: newProductId(seller.seqNum || 0, n),
        title: b.title, category: b.category || 'Skincare',
        price: Number(b.price), originalPrice: b.originalPrice != null ? Number(b.originalPrice) : null,
        stockCount: b.stockCount != null ? Number(b.stockCount) : 10,
        inStock: (b.stockCount != null ? Number(b.stockCount) : 10) > 0,
        sku: b.sku || null, sellerId, sellerName: (seller && (seller.storeName || seller.name)) || 'Artisan Partner',
        description: b.description || '', features: b.features || [], imageUrl: b.imageUrl || '',
        tags: b.tags || [b.category || 'Skincare'], isFeatured: !!b.isFeatured,
        canonicalId: b.canonicalId || canonicalOfTitle(b.title),
      },
    });
    res.status(201).json(p);
  } catch (e) { next(e); }
});

async function ownerOrAdmin(req, res, next) {
  const p = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!p) return res.status(404).json({ error: 'Not found' });
  if (req.user.role !== 'admin' && p.sellerId !== req.user.id)
    return res.status(403).json({ error: 'Not your listing' });
  req.listing = p;
  next();
}

// PATCH /api/products/:id  (owner or admin; title change re-syncs canonical)
router.patch('/:id', requireAuth, ownerOrAdmin, async (req, res, next) => {
  try {
    const b = req.body;
    const data = { ...b };
    delete data.id; delete data.sellerId; delete data.sellerName;
    if (b.title && !b.canonicalId) data.canonicalId = canonicalOfTitle(b.title);
    if (data.stockCount != null) data.inStock = Number(data.stockCount) > 0;
    res.json(await prisma.product.update({ where: { id: req.params.id }, data }));
  } catch (e) { next(e); }
});

// DELETE /api/products/:id  (owner or admin) — tombstoned atomically
router.delete('/:id', requireAuth, ownerOrAdmin, async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.product.delete({ where: { id: req.params.id } });
      await tombstone(tx, 'products', req.params.id, req.user.id);
    });
    res.json({ ok: true, tombstoned: true });
  } catch (e) { next(e); }
});

module.exports = router;
