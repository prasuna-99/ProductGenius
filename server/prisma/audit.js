require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const cons = await p.$queryRawUnsafe(
    `SELECT conname FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conname LIKE '%_fkey' ORDER BY conname`
  );
  console.log('FKs:', cons.map(c => c.conname).join(','));
  const users = new Set((await p.user.findMany({ select: { id: true } })).map(u => u.id));
  const prods = new Set((await p.product.findMany({ select: { id: true } })).map(x => x.id));
  const orders = new Set((await p.order.findMany({ select: { id: true } })).map(o => o.id));
  const bad = [];
  for (const x of await p.product.findMany({ select: { id: true, sellerId: true } }))
    if (!users.has(x.sellerId)) bad.push('product/' + x.id);
  for (const x of await p.review.findMany({ select: { id: true, productId: true, userId: true } })) {
    if (!prods.has(x.productId) || !users.has(x.userId)) bad.push('review/' + x.id);
  }
  for (const x of await p.categoryRequest.findMany({ select: { id: true, requestedBy: true } }))
    if (!users.has(x.requestedBy)) bad.push('request/' + x.id);
  for (const x of await p.orderItem.findMany({ select: { id: true, orderId: true } }))
    if (!orders.has(x.orderId)) bad.push('item/' + x.id);
  console.log('orphans:', bad.length ? bad.join(',') : 'NONE');
  const counts = {};
  for (const t of ['user', 'product', 'order', 'orderItem', 'transaction', 'review', 'campaign', 'category', 'categoryRequest', 'sequence'])
    counts[t] = await p[t].count();
  console.log('counts:', JSON.stringify(counts));
  const seqs = await p.sequence.findMany();
  console.log('sequences:', seqs.map(s => `${s.key}=${s.last}`).join(' | '));
  const sample = await p.product.findMany({ take: 3, select: { id: true } });
  const sampleO = await p.order.findMany({ take: 3, select: { id: true } });
  console.log('sample products:', sample.map(s => s.id).join(','));
  console.log('sample orders:', sampleO.map(s => s.id).join(','));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
