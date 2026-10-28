const express = require('express');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { nextSeq, datedId, dayOf } = require('../ids');

const router = express.Router();

function deriveGlobal(sellerStatus, involved) {
  const vals = involved.map(s => sellerStatus[s] || 'Processing');
  if (vals.every(v => v === 'Delivered')) return 'Delivered';
  if (vals.some(v => v === 'Shipped' || v === 'Delivered')) return 'Shipped';
  if (vals.every(v => v === 'Cancelled')) return 'Cancelled';
  if (vals.some(v => v === 'Processing')) return 'Processing';
  return vals[0] || 'Processing';
}

// POST /api/orders  (customer; multi-seller split, atomic stock decrement)
router.post('/', requireAuth, requireRole('customer', 'admin'), async (req, res, next) => {
  try {
    const { items = [], shippingAddress, discountCode } = req.body; // items: [{productId, quantity}]
    if (!items.length || !shippingAddress) return res.status(400).json({ error: 'items + shippingAddress required' });
    const listings = await prisma.product.findMany({ where: { id: { in: items.map(i => i.productId) } } });
    const byId = new Map(listings.map(p => [p.id, p]));
    for (const i of items) {
      const p = byId.get(i.productId);
      if (!p) return res.status(400).json({ error: 'Unknown product ' + i.productId });
      if (!p.inStock || p.stockCount < (i.quantity || 1)) return res.status(400).json({ error: `Out of stock: ${p.title}` });
    }
    const subtotal = items.reduce((s, i) => s + byId.get(i.productId).price * (i.quantity || 1), 0);
    const code = (discountCode || '').trim().toUpperCase();
    let discount = 0;
    if (code) {
      const camp = await prisma.campaign.findFirst({ where: { discountCode: code, isActive: true } });
      if (camp) discount = (subtotal * camp.discountPercent) / 100;
      else if (code === 'GENIUS10') discount = subtotal * 0.1;
      else if (code === 'BUNDLE15') discount = subtotal * 0.15;
    }
    const order = await prisma.$transaction(async tx => {
      for (const i of items) {
        const r = await tx.product.updateMany({
          where: { id: i.productId, stockCount: { gte: i.quantity || 1 } },
          data: { stockCount: { decrement: i.quantity || 1 } },
        });
        if (!r.count) throw Object.assign(new Error('Race: out of stock'), { status: 409 });
      }
      // NOTE: stock decrement here reserves at checkout; adapt to decrement-on-delivery if preferred.
      const sellers = [...new Set(items.map(i => byId.get(i.productId).sellerId))];
      const d = dayOf();
      const orderNo = await nextSeq(tx, `ORD:${d}`);
      const itemIds = [];
      for (const i of items) itemIds.push(await nextSeq(tx, `ITM:${d}`));
      const created = await tx.order.create({
        data: {
          // ID = ORD-<date>-<seq>; lines ITM-<date>-<seq>
          id: datedId('ORD', d, orderNo),
          customerId: req.user.id, customerName: req.user.name, customerEmail: req.user.email,
          subtotal, shipping: 0, discount, total: Math.max(0, subtotal - discount),
          status: 'Processing',
          sellerStatus: Object.fromEntries(sellers.map(s => [s, 'Processing'])),
          date: new Date().toISOString().split('T')[0], shippingAddress,
          trackingNumber: `PG-EXP-${Math.floor(100000 + Math.random() * 900000)}-NP`,
          items: {
            create: items.map((i, idx) => {
              const p = byId.get(i.productId);
              return {
                id: datedId('ITM', d, itemIds[idx]),
                productId: p.id, canonicalId: p.canonicalId, sellerId: p.sellerId,
                title: p.title, price: p.price, quantity: i.quantity || 1, imageUrl: p.imageUrl,
              };
            }),
          },
        },
        include: { items: true },
      });
      return created;
    });
    res.status(201).json(order);
  } catch (e) { next(e); }
});

// GET /api/orders/mine  (customer: own; seller: only orders with own lines, items filtered; admin: all)
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    let orders;
    if (req.user.role === 'admin') {
      orders = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
    } else if (req.user.role === 'seller') {
      const all = await prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' } });
      orders = all
        .map(o => ({ ...o, items: o.items.filter(i => i.sellerId === req.user.id) }))
        .filter(o => o.items.length);
    } else {
      orders = await prisma.order.findMany({ where: { customerId: req.user.id }, include: { items: true }, orderBy: { createdAt: 'desc' } });
    }
    res.json(orders);
  } catch (e) { next(e); }
});

// PATCH /api/orders/:id/status  {status}
// seller -> own share only; global Delivered only when ALL sellers delivered (then ingest once)
router.patch('/:id/status', requireAuth, async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { items: true } });
    if (!order) return res.status(404).json({ error: 'Not found' });
    const involved = [...new Set(order.items.map(i => i.sellerId).filter(Boolean))];
    const prevSeller = { ...(order.sellerStatus || {}) };
    for (const s of involved) if (!prevSeller[s]) prevSeller[s] = order.status;
    const prevGlobal = order.status;
    let nextSeller = { ...prevSeller }, nextGlobal = prevGlobal;

    const isSellerLine = req.user.role === 'seller' && involved.includes(req.user.id);
    if (isSellerLine) {
      nextSeller[req.user.id] = status;
      nextGlobal = deriveGlobal(nextSeller, involved);
    } else if (req.user.role === 'admin' || req.user.role === 'customer') {
      nextGlobal = status;
      for (const s of involved) nextSeller[s] = status;
    } else {
      return res.status(403).json({ error: 'Not your order line' });
    }

    // NOTE: stock is reserved atomically at checkout (see POST / above, which
    // throws 409 on races), so delivery only flips flags — never decrements twice.
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: nextGlobal, sellerStatus: nextSeller },
      include: { items: true },
    });

    // Ingest full canonical itemset ONLY on first all-delivered transition
    let ingested = false;
    if (nextGlobal === 'Delivered' && prevGlobal !== 'Delivered') {
      const canon = [...new Set(updated.items.map(i => i.canonicalId).filter(Boolean))];
      if (canon.length && !(await prisma.transaction.findFirst({ where: { orderId: order.id } }))) {
        const d = dayOf();
        // ID = TXN-<date>-<seq>
        await prisma.transaction.create({
          data: { id: datedId('TXN', d, await nextSeq(prisma, `TXN:${d}`)), orderId: order.id, date: updated.date, itemIds: canon },
        });
        ingested = true;
      }
      // refresh inStock flags
      await prisma.product.updateMany({ where: { stockCount: { lte: 0 } }, data: { inStock: false } });
    }
    res.json({ order: updated, ingested });
  } catch (e) { next(e); }
});

module.exports = router;
