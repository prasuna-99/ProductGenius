async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const o = await p.order.findUnique({
    where: { id: 'ORD-20261007-000020' }, include: { items: true },
  });
  if (!o) { console.log('already gone'); }
  else {
    await p.orderItem.deleteMany({ where: { orderId: o.id } });
    await p.order.delete({ where: { id: o.id } });
    console.log('deleted dead open order', o.id, 'status was', o.status);
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
