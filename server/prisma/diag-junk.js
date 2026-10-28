async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  for (const id of ['TXN-20261006-000003', 'TXN-20261007-000005', 'TXN-20261007-000014']) {
    const t = await p.transaction.findUnique({ where: { id } });
    console.log(id, '=>', JSON.stringify(t && t.itemIds), 'order:', t && t.orderId);
  }
  for (const id of ['ORD-20261006-000001', 'ORD-20261007-000014', 'ORD-20261007-000020']) {
    const o = await p.order.findUnique({ where: { id }, include: { items: true } });
    console.log(id, o && o.status, 'items:', o && o.items.map(i => i.productId + ':' + i.title).join(' | '));
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
