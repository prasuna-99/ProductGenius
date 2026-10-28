async function main() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  const t = await db.transaction.findUnique({ where: { id: 'TXN-20261009-000003' } });
  console.log('txn TXN-20261009-000003:', t ? JSON.stringify(t) : 'ABSENT');
  const o = await db.order.findMany({
    where: { status: 'Processing' },
    select: { id: true, status: true, items: { select: { productId: true, title: true, sellerId: true } } },
  });
  console.log('open orders:', o.map(x => x.id + '[' + x.items.map(i => i.productId).join(',') + ']').join(' | ') || 'none');
  await db.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
