// One-off repair: reseeds every Sequence counter from live row maxima.
// (The migration bump under-counted some sellers, causing duplicate PKs.)
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const bump = async (key, last) => {
    const cur = await p.sequence.findUnique({ where: { key } });
    if (!cur) await p.sequence.create({ data: { key, last } });
    else if (cur.last < last) await p.sequence.update({ where: { key }, data: { last } });
  };

  const prods = await p.product.findMany({ select: { id: true, sellerId: true } });
  const perSeller = {};
  for (const x of prods) {
    const m = /^PRD-(\d+)-(\d+)$/.exec(x.id || '');
    if (m) {
      const k = `PRD:${x.sellerId}`;
      perSeller[k] = Math.max(perSeller[k] || 0, Number(m[2]));
    }
  }
  for (const [k, v] of Object.entries(perSeller)) await bump(k, v);

  const revs = await p.review.findMany({ select: { id: true, userId: true } });
  const perOwner = {};
  for (const r of revs) {
    const m = /^REV-(\d+)-(\d+)$/.exec(r.id || '');
    if (m) {
      const k = `REV:${r.userId}`;
      perOwner[k] = Math.max(perOwner[k] || 0, Number(m[2]));
    }
  }
  for (const [k, v] of Object.entries(perOwner)) await bump(k, v);

  const perDay = {};
  const scan = (id) => {
    const m = /^(ORD|ITM|TXN|CMP|CAT|REQ)-(\d{8})-(\d+)$/.exec(id || '');
    if (m) {
      const k = `${m[1]}:${m[2]}`;
      perDay[k] = Math.max(perDay[k] || 0, Number(m[3]));
    }
  };
  const orders = await p.order.findMany({ select: { id: true, items: { select: { id: true } } } });
  for (const o of orders) { scan(o.id); for (const it of o.items) scan(it.id); }
  for (const t of await p.transaction.findMany({ select: { id: true } })) scan(t.id);
  for (const c of await p.campaign.findMany({ select: { id: true } })) scan(c.id);
  for (const c of await p.category.findMany({ select: { id: true } })) scan(c.id);
  for (const r of await p.categoryRequest.findMany({ select: { id: true } })) scan(r.id);
  for (const [k, v] of Object.entries(perDay)) await bump(k, v);

  console.log('sellers:', Object.keys(perSeller).length, 'owners:', Object.keys(perOwner).length, 'days:', Object.keys(perDay).length);
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 300)); process.exit(1); });
