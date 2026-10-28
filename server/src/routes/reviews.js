const express = require('express');
const prisma = require('../db');
const { requireAuth } = require('../middleware/auth');
const { nextSeq, reviewId, dayOf } = require('../ids');

const router = express.Router();

// GET /api/recent (public, latest 200 — lets the React shop boot-sync reviews)
router.get('/recent', async (req, res, next) => {
  try {
    res.json(await prisma.review.findMany({ orderBy: { createdAt: 'desc' }, take: 200 }));
  } catch (e) { next(e); }
});

// GET /api/products/:id/reviews
router.get('/products/:id/reviews', async (req, res, next) => {
  try {
    res.json(await prisma.review.findMany({ where: { productId: req.params.id }, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

// POST /api/products/:id/reviews  {rating 1-5, text, imageUrl?}
// Server enforces: only buyers with a Delivered order containing this product.
router.post('/products/:id/reviews', requireAuth, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Not found' });
    const eligible = await prisma.order.findFirst({
      where: {
        customerId: req.user.id, status: 'Delivered',
        items: { some: { productId: product.id } },
      },
    });
    if (!eligible && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Review allowed only after delivery' });
    const rating = Math.max(1, Math.min(5, Math.round(Number(req.body.rating))));
    if (!req.body.text || !req.body.text.trim()) return res.status(400).json({ error: 'text required' });
    // ID = REV-<authorSeq>-<perAuthorSeq>
    const author = await prisma.user.findUnique({ where: { id: req.user.id } });
    const review = await prisma.review.create({
      data: {
        id: reviewId(author.seqNum || 0, await nextSeq(prisma, `REV:${req.user.id}`)),
        productId: product.id, userId: req.user.id, userName: req.user.name,
        rating, text: req.body.text.trim(), imageUrl: req.body.imageUrl || null,
        date: new Date().toISOString().split('T')[0],
      },
    });
    const agg = await prisma.review.aggregate({ where: { productId: product.id }, _avg: { rating: true }, _count: true });
    await prisma.product.update({
      where: { id: product.id },
      data: { rating: Math.round((agg._avg.rating || 5) * 10) / 10, reviewsCount: agg._count },
    });
    res.status(201).json(review);
  } catch (e) { next(e); }
});

module.exports = router;
