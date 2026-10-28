async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const orders = await p.order.findMany({ include: { items: true } });
  let fixed = 0;
  for (const o of orders) {
    const involved = [...new Set(o.items.map(i => i.sellerId).filter(Boolean))];
    const prev = o.sellerStatus || {};
    const next = {};
    for (const s of involved) next[s] = prev[s] || o.status;
    if (JSON.stringify(next) !== JSON.stringify(prev)) {
      await p.order.update({ where: { id: o.id }, data: { sellerStatus: next } });
      fixed++;
    }
  }
  console.log('orders:', orders.length, 'sellerStatus repaired:', fixed);
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 300)); process.exit(1); });
