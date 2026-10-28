async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const prods = await p.product.findMany({
    select: { id: true, title: true, sellerId: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
  console.log('newest products:', JSON.stringify(prods, null, 1).slice(0, 900));
  const o = await p.order.findUnique({
    where: { id: 'ORD-20261007-000020' }, include: { items: true },
  });
  console.log('ghost order:', o ? o.status + ' items=' + o.items.length : 'absent');
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
