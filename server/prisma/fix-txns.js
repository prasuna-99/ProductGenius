const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const prods = await p.product.findMany({ select: { id: true, canonicalId: true } });
  const m = new Map(prods.map(x => [x.id, x.canonicalId]));
  const txns = await p.transaction.findMany();
  let fixed = 0;
  for (const t of txns) {
    const canon = [...new Set(t.itemIds.map(id => m.get(id) || id))];
    const a = [...canon].sort().join(',');
    const b = [...t.itemIds].sort().join(',');
    if (a !== b) {
      await p.transaction.update({ where: { id: t.id }, data: { itemIds: canon } });
      fixed++;
    }
  }
  console.log('checked:', txns.length, 'canonicalized:', fixed);
  await p.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
