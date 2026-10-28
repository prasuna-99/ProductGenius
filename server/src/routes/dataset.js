const express = require('express');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { parseDatasetText } = require('../dataset');
const { nextSeq, datedId, dayOf } = require('../ids');

const router = express.Router();

// GET /api/dataset/transactions  (admin: raw rows for the Admin table)
router.get('/transactions', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const txns = await prisma.transaction.findMany({ orderBy: { id: 'asc' } });
    const products = await prisma.product.findMany();
    const titleOf = id => {
      const p = products.find(p => p.id === id) || products.find(p => p.canonicalId === id);
      return p ? p.title : id;
    };
    res.json(
      txns.map(t => ({
        transaction_id: t.id, products_purchased: t.itemIds.map(titleOf).join(', '),
        matchedProductIds: t.itemIds,
        type: t.itemIds.length >= 3 ? 'Strong' : t.itemIds.length === 2 ? 'Pair' : 'Single',
      }))
    );
  } catch (e) { next(e); }
});

// POST /api/dataset/import  {text: "T0001 | Soap, Shampoo\n..."}  (admin)
router.post('/import', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { txns } = parseDatasetText(req.body.text || '');
    if (!txns.length) return res.status(400).json({ error: 'No parseable rows' });
    // Imported rows get fresh IDs: TXN-<date>-<seq> (imports are new snapshots).
    // Re-importing the same text updates rows by orderId instead of duplicating.
    const d = dayOf();
    let n = 0;
    for (const t of txns) {
      const existing = await prisma.transaction.findFirst({ where: { orderId: t.orderId } });
      if (existing) {
        await prisma.transaction.update({ where: { id: existing.id }, data: { itemIds: t.itemIds, date: t.date } });
      } else {
        await prisma.transaction.create({
          data: { id: datedId('TXN', d, await nextSeq(prisma, `TXN:${d}`)), orderId: t.orderId, date: t.date, itemIds: t.itemIds },
        });
      }
      n++;
    }
    res.json({ count: n });
  } catch (e) { next(e); }
});

module.exports = router;
