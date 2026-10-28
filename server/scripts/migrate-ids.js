// One-off Neon ID migration to the central scheme (see server/src/ids.js).
// Renames EVERY row deterministically and writes server/scripts/idmap.json
// (oldId -> newId per table) which the frontend codemod consumes, so both
// sides agree byte-for-byte. Safe to re-run: skips rows already renamed.
// Usage: node server/scripts/migrate-ids.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const { pad6, userId, productId, reviewId, datedId } = require('../src/ids');

const SEED_DATE = '20261007'; // recorded-on date stamped onto seed users
const ROLE_SEQ = {}; // role -> next per-day seq (users only; deterministic by id order)

function useq(role, date) {
  const k = `${role}:${date}`;
  ROLE_SEQ[k] = (ROLE_SEQ[k] || 0) + 1;
  return ROLE_SEQ[k];
}

const perDay = {};
function daySeq(prefix, date) {
  const k = `${prefix}:${date}`;
  perDay[k] = (perDay[k] || 0) + 1;
  return perDay[k];
}
const perOwner = {};
function ownerSeq(prefix, ownerId) {
  const k = `${prefix}:${ownerId}`;
  perOwner[k] = (perOwner[k] || 0) + 1;
  return perOwner[k];
}
// Per-seller product counters, keyed by NEW seller id (for Sequence seeding)
const perSellerProd = {};
function sellerProdSeq(newSellerId) {
  perSellerProd[newSellerId] = (perSellerProd[newSellerId] || 0) + 1;
  return perSellerProd[newSellerId];
}

const ymd = d => {
  const t = new Date(d);
  const d2 = isNaN(+t) ? new Date() : t;
  return d2.toISOString().split('T')[0].replace(/-/g, '');
};
const num = (s, dflt = '') => (s || dflt).replace(/-/g, '');

async function main() {
  const prisma = new PrismaClient();
  // idmap.json is written by the frontend codemod (scripts/renumber-frontend.ts):
  // seed rows keep byte-identical ids on both sides; anything absent gets a fresh id.
  let idmap = { users: {}, products: {}, orders: {}, campaigns: {}, categories: {}, requests: {}, reviews: {}, transactions: {} };
  try {
    idmap = JSON.parse(fs.readFileSync(path.join(__dirname, 'idmap.json'), 'utf-8'));
  } catch (e) {
    console.log('no idmap.json — all rows get fresh ids');
  }
  const known = table => idmap[table] || {};
  const userSeqNum = {}; // newUserId -> seqNum

  const users = await prisma.user.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  // Deterministic global account numbers: known seeds first (file order), then rest by createdAt.
  const seedOrder = ['user-customer-1', 'user-seller-1', 'user-seller-2', 'user-seller-3', 'user-admin-1'];
  const ordered = [
    ...seedOrder.map(id => users.find(u => u.id === id)).filter(Boolean),
    ...users.filter(u => !seedOrder.includes(u.id)),
  ];
  let g = Math.max(0, ...Object.values(known('users')).map(v => v.seq || 0));
  const newUsers = ordered.map(u => {
    if (known('users')[u.id]) {
      const k = known('users')[u.id];
      userSeqNum[k.newId] = k.seq;
      return { ...u, nid: k.newId, seq: k.seq };
    }
    g += 1;
    const nid = userId(u.role, g, SEED_DATE);
    idmap.users[u.id] = { newId: nid, seq: g };
    userSeqNum[nid] = g;
    return { ...u, nid, seq: g };
  });

  const products = await prisma.product.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const bySeller = {};
  for (const p of products) (bySeller[p.sellerId] = bySeller[p.sellerId] || []).push(p);
  const newProducts = [];
  for (const [sellerId, list] of Object.entries(bySeller)) {
    const seller = newUsers.find(u => u.id === sellerId);
    const sseq = seller ? seller.seq : 0;
    const newSellerId = seller ? seller.nid : sellerId;
    list.forEach(p => {
      if (known('products')[p.id]) {
        newProducts.push({ ...p, nid: known('products')[p.id] });
        const m = known('products')[p.id].match(/^PRD-\d+-(\d+)$/);
        if (m) perSellerProd[newSellerId] = Math.max(perSellerProd[newSellerId] || 0, Number(m[1]));
        return;
      }
      const n = sellerProdSeq(newSellerId);
      const nid = productId(sseq, n);
      idmap.products[p.id] = nid;
      newProducts.push({ ...p, nid });
    });
  }

  const orders = await prisma.order.findMany({ include: { items: true }, orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const newOrders = orders.map(o => {
    const d = num(o.date, ymd(o.createdAt));
    let nid;
    if (known('orders')[o.id]) nid = known('orders')[o.id];
    else { nid = datedId('ORD', d, daySeq('ORD', d)); idmap.orders[o.id] = nid; }
    const items = o.items.map(it => {
      const iid = datedId('ITM', d, daySeq('ITM', d));
      return { ...it, nid: iid };
    });
    return { ...o, nid, items };
  });

  const reviews = await prisma.review.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const newReviews = reviews.map(r => {
    const a = newUsers.find(u => u.id === r.userId);
    const newUserId = a ? a.nid : r.userId;
    let nid;
    if (known('reviews')[r.id]) nid = known('reviews')[r.id];
    else { nid = reviewId(a ? a.seq : 0, ownerSeq('REV', newUserId)); idmap.reviews[r.id] = nid; }
    return { ...r, nid };
  });

  const campaigns = await prisma.campaign.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const newCampaigns = campaigns.map(c => {
    const d = num((c.startDate || '').slice(0, 10), ymd(c.createdAt));
    let nid;
    if (known('campaigns')[c.id]) nid = known('campaigns')[c.id];
    else { nid = datedId('CMP', d, daySeq('CMP', d)); idmap.campaigns[c.id] = nid; }
    return { ...c, nid };
  });

  const categories = await prisma.category.findMany({ orderBy: [{ id: 'asc' }] });
  const newCategories = categories.map(c => {
    const d = ymd(c.createdAt);
    let nid;
    if (known('categories')[c.id]) nid = known('categories')[c.id];
    else { nid = datedId('CAT', d, daySeq('CAT', d)); idmap.categories[c.id] = nid; }
    return { ...c, nid };
  });

  const requests = await prisma.categoryRequest.findMany({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] });
  const newRequests = requests.map(r => {
    const d = ymd(r.createdAt);
    let nid;
    if (known('requests')[r.id]) nid = known('requests')[r.id];
    else { nid = datedId('REQ', d, daySeq('REQ', d)); idmap.requests[r.id] = nid; }
    return { ...r, nid };
  });

  const txns = await prisma.transaction.findMany({ orderBy: [{ id: 'asc' }] });
  const newTxns = txns.map(t => {
    // Seed rows T0001.. keep their numbers (matches frontend codemod byte-for-byte)
    const m = /^T(\d+)$/.exec(t.id);
    let nid;
    if (m) nid = `TXN-20260928-${pad6(Number(m[1]))}`;
    else if (known('transactions')[t.id]) nid = known('transactions')[t.id];
    else {
      const d = num((t.date || '').slice(0, 10), ymd(t.createdAt));
      nid = datedId('TXN', d, daySeq('TXN', d));
      idmap.transactions[t.id] = nid;
    }
    return { ...t, nid };
  });

  // Seed per-seller product counters from codemod-mapped rows so fresh
  // assignments continue past them (same file-order rule the frontend used).
  {
    const seedProds = await prisma.product.findMany({ select: { id: true, sellerId: true } });
    for (const p of seedProds) {
      const nid = (idmap.products || {})[p.id];
      if (!nid) continue;
      const m = /^PRD-\d+-(\d+)$/.exec(nid);
      const nseller = ((idmap.users || {})[p.sellerId] || {}).newId || p.sellerId;
      if (m) perSellerProd[nseller] = Math.max(perSellerProd[nseller] || 0, Number(m[1]));
    }
  }

  // (uses the products/orders/txns/... already fetched above)
  {
    const scanDated = id => {
      const m = /^(ORD|ITM|TXN|CMP|CAT|REQ)-(\d{8})-(\d+)$/.exec(id || '');
      if (m) { const k = `${m[1]}:${m[2]}`; perDay[k] = Math.max(perDay[k] || 0, Number(m[3])); }
    };
    for (const o of [...orders, ...txns, ...campaigns, ...categories, ...requests]) scanDated(o.id);
    for (const o of orders) for (const it of o.items || []) scanDated(it.id);
    const usersById = new Map(users.map(u => [u.id, u]));
    for (const p of products) {
      const m = /^PRD-(\d+)-(\d+)$/.exec(p.id || '');
      if (m) {
        // attribute to current seller row (old or already-new id)
        const sid = (known('users')[p.sellerId] ? known('users')[p.sellerId].newId : null) || p.sellerId;
        perSellerProd[sid] = Math.max(perSellerProd[sid] || 0, Number(m[2]));
      }
    }
    for (const r of reviews) {
      const m = /^REV-(\d+)-(\d+)$/.exec(r.id || '');
      if (m) {
        const uid = (known('users')[r.userId] ? known('users')[r.userId].newId : null) || r.userId;
        const k = `REV:${uid}`;
        perOwner[k] = Math.max(perOwner[k] || 0, Number(m[2]));
      }
    }
    void usersById;
  }

  // Already-migrated rows (id is a known NEW id) are skipped: re-runnable.
  const alreadyNew = new Set();
  for (const table of Object.values(idmap)) {
    for (const v of Object.values(table)) alreadyNew.add(typeof v === 'string' ? v : v.newId);
  }
  const pending = list => list.filter(r => !alreadyNew.has(r.id));

  // Product lookup oldId -> { nid } for FK rewrites
  const prodNew = new Map(newProducts.map(p => [p.id, p]));

  // Drop the five FK constraints (no interactive tx: serverless kills long ones).
  // Re-added with identical names afterwards, so `prisma db push` sees no drift.
  const FKS = [
    ['"Product"', '"Product_sellerId_fkey"', 'FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
    ['"Review"', '"Review_productId_fkey"', 'FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
    ['"Review"', '"Review_userId_fkey"', 'FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
    ['"CategoryRequest"', '"CategoryRequest_requestedBy_fkey"', 'FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
    ['"OrderItem"', '"OrderItem_orderId_fkey"', 'FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
  ];
  for (const [table, cons] of FKS) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} DROP CONSTRAINT IF EXISTS ${cons}`);
    } catch (e) { console.log('drop note:', String((e && e.message) || e).slice(0, 120)); }
  }

  // Persist the mapping BEFORE renaming (crash-safe: re-runs extend, never redo).
  fs.writeFileSync(path.join(__dirname, 'idmap.json'), JSON.stringify(idmap, null, 2));

  // Remove orphans from any earlier interrupted run (FKs were down, so
  // order deletes did not cascade). Safe: only rows pointing at nothing.
  await prisma.$executeRawUnsafe(
    'DELETE FROM "OrderItem" WHERE "orderId" NOT IN (SELECT "id" FROM "Order")'
  );
  {
    const users = new Set((await prisma.user.findMany({ select: { id: true } })).map(u => u.id));
    const prods = new Set((await prisma.product.findMany({ select: { id: true } })).map(x => x.id));
    for (const r of await prisma.review.findMany({ select: { id: true, productId: true, userId: true } })) {
      if (!prods.has(r.productId) || !users.has(r.userId)) {
        await prisma.review.delete({ where: { id: r.id } });
      }
    }
    await prisma.product.deleteMany({ where: { sellerId: { notIn: [...users] } } });
    await prisma.categoryRequest.deleteMany({ where: { requestedBy: { notIn: [...users] } } });
  }

  let done = 0;
  const tick = label => { done++; if (done % 50 === 0) console.log(`...${done} ${label}`); };
  for (const r of pending(newReviews)) {
    const p = prodNew.get(r.productId);
    await prisma.review.update({
      where: { id: r.id },
      data: {
        id: r.nid,
        productId: p ? p.nid : r.productId,
        userId: idmap.users[r.userId] ? idmap.users[r.userId].newId : r.userId,
      },
    });
    tick('reviews');
  }
    for (const p of pending(newProducts)) {
      await prisma.product.update({
        where: { id: p.id },
        data: {
          id: p.nid,
          sellerId: idmap.users[p.sellerId] ? idmap.users[p.sellerId].newId : p.sellerId,
        },
      });
      tick('products');
    }
    for (const u of pending(newUsers)) {
      await prisma.user.update({ where: { id: u.id }, data: { id: u.nid, seqNum: u.seq } });
      tick('users');
    }
    for (const r of pending(newRequests)) {
      await prisma.categoryRequest.update({
        where: { id: r.id },
        data: {
          id: r.nid,
          requestedBy: idmap.users[r.requestedBy] ? idmap.users[r.requestedBy].newId : r.requestedBy,
          categoryId: r.categoryId && idmap.categories[r.categoryId] ? idmap.categories[r.categoryId] : r.categoryId,
          decidedBy: r.decidedBy && idmap.users[r.decidedBy] ? idmap.users[r.decidedBy].newId : r.decidedBy,
        },
      });
      tick('requests');
    }
    for (const c of pending(newCategories)) {
      await prisma.category.update({ where: { id: c.id }, data: { id: c.nid } });
      tick('categories');
    }
    for (const o of pending(newOrders)) {
      await prisma.orderItem.deleteMany({ where: { orderId: o.id } });
      await prisma.order.delete({ where: { id: o.id } });
      // Keep dataset links intact across the order rename (plain-string FK)
      await prisma.transaction.updateMany({ where: { orderId: o.id }, data: { orderId: o.nid } });
      await prisma.order.create({
        data: {
          id: o.nid, customerId: idmap.users[o.customerId] ? idmap.users[o.customerId].newId : o.customerId,
          customerName: o.customerName, customerEmail: o.customerEmail,
          subtotal: o.subtotal, shipping: o.shipping, discount: o.discount, total: o.total,
          status: o.status, sellerStatus: o.sellerStatus ?? {},
          date: o.date, shippingAddress: o.shippingAddress ?? {}, trackingNumber: o.trackingNumber,
          items: {
            create: o.items.map(it => {
              const p = prodNew.get(it.productId);
              return {
                id: it.nid, productId: p ? p.nid : it.productId,
                canonicalId: it.canonicalId, sellerId: it.sellerId && idmap.users[it.sellerId] ? idmap.users[it.sellerId].newId : it.sellerId,
                title: it.title, price: it.price, quantity: it.quantity, imageUrl: it.imageUrl,
              };
            }),
          },
        },
      });
      tick('orders');
    }
    for (const c of pending(newCampaigns)) {
      await prisma.campaign.update({ where: { id: c.id }, data: { id: c.nid } });
      tick('campaigns');
    }
    for (const t of pending(newTxns)) {
      await prisma.transaction.update({ where: { id: t.id }, data: { id: t.nid } });
      tick('txns');
    }
    // Re-add the FK constraints with identical names (no drift for future db push).
    // Skipped when already present, so re-runs are safe.
    const existing = await prisma.$queryRawUnsafe(
      `SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace`
    );
    const have = new Set(existing.map(r => r.conname));
    for (const [table, cons, def] of [
      ['"Product"', '"Product_sellerId_fkey"', 'FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
      ['"Review"', '"Review_productId_fkey"', 'FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
      ['"Review"', '"Review_userId_fkey"', 'FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
      ['"CategoryRequest"', '"CategoryRequest_requestedBy_fkey"', 'FOREIGN KEY ("requestedBy") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
      ['"OrderItem"', '"OrderItem_orderId_fkey"', 'FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE NO ACTION'],
    ]) {
      if (have.has(cons.replace(/"/g, ''))) continue;
      await prisma.$executeRawUnsafe(`ALTER TABLE ${table} ADD CONSTRAINT ${cons} ${def}`);
    }
    // Seed runtime counters past migration maxima (keep newer values on re-run)
    const bump = async (key, last) => {
      const cur = await prisma.sequence.findUnique({ where: { key } });
      if (!cur) await prisma.sequence.create({ data: { key, last } });
      else if (cur.last < last) await prisma.sequence.update({ where: { key }, data: { last } });
    };
    for (const [k, v] of Object.entries(perOwner)) await bump(`REV:${k.split(':')[1]}`, v);
    for (const [k, v] of Object.entries(perDay)) await bump(k, v);
    for (const [sellerId, v] of Object.entries(perSellerProd)) await bump(`PRD:${sellerId}`, v);
    // Restart the User.seqNum autoincrement past backfilled values
    await prisma.$executeRawUnsafe(`SELECT setval(pg_get_serial_sequence('"User"', 'seqNum'), (SELECT COALESCE(MAX("seqNum"), 0) FROM "User"))`);

  fs.writeFileSync(path.join(__dirname, 'idmap.json'), JSON.stringify(idmap, null, 2));
  const counts = Object.fromEntries(Object.entries(idmap).map(([k, v]) => [k, Object.keys(v).length]));
  console.log('migrated:', JSON.stringify(counts));
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
