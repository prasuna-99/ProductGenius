async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const prods = await p.product.findMany({ select: { id: true, canonicalId: true } });
  const known = new Set([...prods.map(x => x.id), ...prods.map(x => x.canonicalId)]);
  const ids = ['TXN-20261009-000020', 'TXN-20261009-000003', 'TXN-20261009-000005'];
  for (const id of ids) {
    const t = await p.transaction.findUnique({ where: { id } });
    if (!t) { console.log(id, 'absent'); continue; }
    const dead = t.itemIds.filter(x => !known.has(x));
    console.log(id, 'items:', t.itemIds.length, 'dead:', dead.length, 'order:', t.orderId);
    if (dead.length === t.itemIds.length) {
      await p.transaction.delete({ where: { id } });
      console.log('deleted', id, '(all tokens dead)');
    } else {
      console.log('KEPT (has live tokens)');
    }
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
