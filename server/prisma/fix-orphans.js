require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const users = new Set((await p.user.findMany({ select: { id: true } })).map(u => u.id));
  const prods = new Set((await p.product.findMany({ select: { id: true } })).map(x => x.id));
  const orders = new Set((await p.order.findMany({ select: { id: true } })).map(o => o.id));
  let n = 0;
  for (const r of await p.review.findMany({ select: { id: true, productId: true, userId: true } })) {
    if (!prods.has(r.productId) || !users.has(r.userId)) {
      await p.review.delete({ where: { id: r.id } });
      n++;
    }
  }
  const prodsGone = await p.product.deleteMany({
    where: { sellerId: { notIn: [...users] } },
  });
  const reqsGone = await p.categoryRequest.deleteMany({
    where: { requestedBy: { notIn: [...users] } },
  });
  console.log('deleted orphan reviews:', n, '| products:', prodsGone.count, '| requests:', reqsGone.count);
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
