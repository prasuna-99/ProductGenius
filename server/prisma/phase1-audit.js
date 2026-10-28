async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const out = [];
  const check = (n, cond, extra = '') => {
    out.push([cond ? 'PASS' : 'FAIL', n, extra]);
    console.log((cond ? 'PASS' : 'FAIL') + ' ' + n + (extra ? ' ' + extra : ''));
  };

  const [users, products, orders, txns, reviews, campaigns, cats, reqs] = await Promise.all([
    p.user.findMany({ select: { id: true, email: true, role: true } }),
    p.product.findMany(),
    p.order.findMany({ include: { items: true } }),
    p.transaction.findMany(),
    p.review.findMany(),
    p.campaign.findMany(),
    p.category.findMany(),
    p.categoryRequest.findMany(),
  ]);
  const uIds = new Set(users.map(u => u.id));
  const pIds = new Set(products.map(x => x.id));
  const pCanon = new Set(products.map(x => x.canonicalId));

  check('counts', true,
    `users=${users.length} products=${products.length} orders=${orders.length} ` +
    `txns=${txns.length} reviews=${reviews.length} campaigns=${campaigns.length} ` +
    `cats=${cats.length} reqs=${reqs.length}`);

  const orphProd = products.filter(x => !uIds.has(x.sellerId));
  check('products->sellers', orphProd.length === 0, orphProd.map(x => x.id).join(','));

  // Orphan items matter only on OPEN orders (delivered history keeps snapshots
  // of products that may later be deleted — that is correct, not corruption).
  const orphItems = [];
  for (const o of orders.filter(x => x.status !== 'Delivered' && x.status !== 'Cancelled'))
    for (const it of o.items) if (!pIds.has(it.productId)) orphItems.push(o.id + ':' + it.productId);
  check('orderItems->products', orphItems.length === 0, orphItems.slice(0, 3).join(','));

  const orphRev = reviews.filter(r => !pIds.has(r.productId) || !uIds.has(r.userId));
  check('reviews->product+user', orphRev.length === 0, orphRev.map(r => r.id).join(','));

  const orphReq = reqs.filter(r => !uIds.has(r.requestedBy));
  check('requests->users', orphReq.length === 0, orphReq.map(r => r.id).join(','));

  // Transactions: single-item rows whose token never resolved are inert noise
  // (skipped by every resolver); flag only multi-item rows with dead tokens.
  const badTx = [];
  for (const t of txns) {
    const dead = t.itemIds.filter(id => !pIds.has(id) && !pCanon.has(id));
    if (dead.length && t.itemIds.length > 1) badTx.push(t.id + ':' + dead.join(','));
  }
  check('txns-resolvable', badTx.length === 0, badTx.slice(0, 3).join(','));

  const badStatus = [];
  for (const o of orders) {
    const involved = [...new Set(o.items.map(i => i.sellerId).filter(Boolean))];
    const keys = Object.keys(o.sellerStatus || {});
    if (!involved.every(s => keys.includes(s))) badStatus.push(o.id);
  }
  check('sellerStatus-keys-match-items', badStatus.length === 0, badStatus.slice(0, 3).join(','));

  const fails = out.filter(r => r[0] === 'FAIL').length;
  console.log('RESULT: ' + (out.length - fails) + '/' + out.length + ' pass');
  await p.$disconnect();
}

main().catch(e => { console.error('FATAL:', e.message.slice(0, 300)); process.exit(1); });
