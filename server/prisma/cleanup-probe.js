async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const oid = 'ORD-20261010-000003';
  await p.review.deleteMany({ where: { productId: 'PRD-000004-000026' } });
  await p.transaction.deleteMany({ where: { orderId: oid } });
  await p.orderItem.deleteMany({ where: { orderId: oid } });
  await p.order.delete({ where: { id: oid } }).catch(() => {});
  console.log('probe trace removed');
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
