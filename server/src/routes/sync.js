const express = require('express');
const fs = require('fs');
const path = require('path');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// GET /api/sync/idmap — oldId -> newId per table from the one-off rename
// migration. The React shop applies it once to browser storage so both
// sides agree byte-for-byte (no duplicate rows after merge).
router.get('/idmap', requireAuth, async (req, res, next) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'idmap.json'), 'utf-8');
    res.json(JSON.parse(raw));
  } catch (e) {
    next(e);
  }
});

// GET /api/sync/tombstones?since=ISO — rows deleted elsewhere since then
// (or everything when omitted). Clients drop these ids locally and exclude
// them from future pushes, so deletes propagate instead of resurrecting.
router.get('/tombstones', requireAuth, async (req, res, next) => {
  try {
    const where = req.query.since ? { deletedAt: { gt: new Date(String(req.query.since)) } } : {};
    res.json(await prisma.deletedRecord.findMany({ where, orderBy: { deletedAt: 'asc' } }));
  } catch (e) { next(e); }
});
// POST /api/sync/push  (any signed-in user)
// Uploads rows that were born locally (seed orders, offline products/campaigns/
// requests/reviews/transactions) so later PATCH/DELETE calls stop 404ing.
// Body: { products?, orders? (with items[]), campaigns?, requests?, reviews?, transactions? }
// Existing server rows are NEVER overwritten (skip), only missing ids are inserted.
// Items referencing unknown products/users are skipped and reported.
router.post('/push', requireAuth, async (req, res, next) => {
  try {
    const out = { pushed: {}, skipped: [], blocked: [] };
    const b = req.body || {};
    // Tombstoned ids must never be resurrected by a stale browser's push.
    const deadRows = await prisma.deletedRecord.findMany({ select: { table: true, recordId: true } });
    const dead = new Set(deadRows.map(t => `${t.table}:${t.recordId}`));
    const isDead = (table, id) => {
      if (dead.has(`${table}:${id}`)) {
        out.blocked.push(`${table}:${id}`);
        return true;
      }
      return false;
    };

    if (Array.isArray(b.products)) {
      let n = 0;
      for (const p of b.products) {
        try {
          const exists = await prisma.product.findUnique({ where: { id: p.id } });
          if (exists) continue;
          if (isDead('products', p.id)) continue;
          const seller = p.sellerId ? await prisma.user.findUnique({ where: { id: p.sellerId } }) : null;
          if (!seller) { out.skipped.push(`product ${p.id}: unknown seller`); continue; }
          await prisma.product.create({
            data: {
              id: p.id, canonicalId: p.canonicalId || p.title.toUpperCase().replace(/[^A-Z0-9]+/g, '-'),
              title: p.title, category: p.category || 'Skincare', price: Number(p.price) || 0,
              originalPrice: p.originalPrice ?? null, rating: p.rating ?? 5, reviewsCount: p.reviewsCount ?? 0,
              inStock: p.inStock ?? true, stockCount: p.stockCount ?? 10, sku: p.sku || null,
              sellerId: p.sellerId, sellerName: p.sellerName || seller.storeName || seller.name,
              description: p.description || '', features: p.features || [], imageUrl: p.imageUrl || '',
              tags: p.tags || [], isFeatured: !!p.isFeatured,
            },
          });
          n++;
        } catch (e) { out.skipped.push(`product ${p.id}: ${e.message}`); }
      }
      out.pushed.products = n;
    }

    if (Array.isArray(b.orders)) {
      let n = 0;
      for (const o of b.orders) {
        try {
          const exists = await prisma.order.findUnique({ where: { id: o.id } });
          if (exists) continue;
          if (isDead('orders', o.id)) continue;
          const items = (o.items || []).filter(i => i.productId);
          await prisma.order.create({
            data: {
              id: o.id, customerId: o.customerId, customerName: o.customerName || '',
              customerEmail: o.customerEmail || '', subtotal: o.subtotal ?? 0, shipping: o.shipping ?? 0,
              discount: o.discount ?? 0, total: o.total ?? 0, status: o.status || 'Processing',
              sellerStatus: o.sellerStatus || {}, date: o.date || new Date().toISOString().split('T')[0],
              shippingAddress: o.shippingAddress || {}, trackingNumber: o.trackingNumber || o.id,
              items: {
                create: items.map(i => ({
                  productId: i.productId, canonicalId: i.canonicalId || null, sellerId: i.sellerId || null,
                  title: i.title || '', price: Number(i.price) || 0, quantity: i.quantity || 1,
                  imageUrl: i.imageUrl || '',
                })),
              },
            },
          });
          n++;
        } catch (e) { out.skipped.push(`order ${o.id}: ${e.message}`); }
      }
      out.pushed.orders = n;
    }

    if (Array.isArray(b.campaigns)) {
      let n = 0;
      for (const c of b.campaigns) {
        try {
          const exists = await prisma.campaign.findFirst({
            where: { OR: [{ id: c.id }, { discountCode: c.discountCode }] },
          });
          if (exists) continue;
          if (isDead('campaigns', c.id)) continue;
          await prisma.campaign.create({
            data: {
              id: c.id, title: c.title, type: c.type || 'festival', tagline: c.tagline || '',
              discountCode: c.discountCode, discountPercent: c.discountPercent ?? 10,
              themeColor: c.themeColor || 'burgundy', badgeText: c.badgeText || '',
              bannerImageUrl: c.bannerImageUrl ?? null, startDate: c.startDate || '', endDate: c.endDate || '',
              isActive: c.isActive ?? true, featuredCategory: c.featuredCategory || 'All',
              description: c.description || '',
            },
          });
          n++;
        } catch (e) { out.skipped.push(`campaign ${c.id}: ${e.message}`); }
      }
      out.pushed.campaigns = n;
    }

    if (Array.isArray(b.requests)) {
      let n = 0;
      for (const r of b.requests) {
        try {
          const exists = await prisma.categoryRequest.findUnique({ where: { id: r.id } });
          if (exists) continue;
          if (isDead('requests', r.id)) continue;
          await prisma.categoryRequest.create({
            data: {
              id: r.id, name: r.name, slug: r.slug, description: r.description || '',
              requestedBy: r.requestedBy, status: ['pending', 'approved', 'rejected'].includes(r.status) ? r.status : 'pending',
              adminNote: r.adminNote || '',
            },
          });
          // Locally-approved requests also materialize their category (same as approve flow)
          if (r.status === 'approved' && r.categoryId !== false) {
            const cat = await prisma.category.findFirst({ where: { slug: r.slug } });
            if (!cat) {
              await prisma.category.create({ data: { name: r.name, slug: r.slug, description: r.description || '', createdBy: r.requestedBy } });
            }
          }
          n++;
        } catch (e) { out.skipped.push(`request ${r.id}: ${e.message}`); }
      }
      out.pushed.requests = n;
    }

    if (Array.isArray(b.reviews)) {
      let n = 0;
      for (const r of b.reviews) {
        try {
          const exists = await prisma.review.findUnique({ where: { id: r.id } });
          if (exists) continue;
          if (isDead('reviews', r.id)) continue;
          await prisma.review.create({
            data: {
              id: r.id, productId: r.productId, userId: r.userId, userName: r.userName || '',
              rating: r.rating, text: r.text || '', imageUrl: r.imageUrl || null, date: r.date || '',
            },
          });
          n++;
        } catch (e) { out.skipped.push(`review ${r.id}: ${e.message}`); }
      }
      out.pushed.reviews = n;
    }

    if (Array.isArray(b.transactions)) {
      // Canonicalize: local rows store listing IDs for display, but the mining
      // engine counts canonicals (else same product from 3 sellers splits support).
      const allProducts = await prisma.product.findMany({ select: { id: true, canonicalId: true } });
      const canonOf = new Map(allProducts.map(p => [p.id, p.canonicalId]));
      let n = 0;
      for (const t of b.transactions) {
        try {
          const exists = await prisma.transaction.findUnique({ where: { id: t.id } });
          if (exists) continue;
          if (isDead('transactions', t.id)) continue;
          const canonIds = [...new Set((t.itemIds || []).map(id => canonOf.get(id) || id))];
          await prisma.transaction.create({
            data: { id: t.id, orderId: t.orderId || null, date: t.date, itemIds: canonIds },
          });
          n++;
        } catch (e) { out.skipped.push(`transaction ${t.id}: ${e.message}`); }
      }
      out.pushed.transactions = n;
    }

    res.json(out);
  } catch (e) { next(e); }
});

module.exports = router;
