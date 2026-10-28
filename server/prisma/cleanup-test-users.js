async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  for (const email of ['idtest1791395005211@x.com', 'recheck1791395423463@x.com']) {
    const u = await p.user.findUnique({ where: { email } });
    if (!u) { console.log('absent', email); continue; }
    const counts = {
      products: await p.product.count({ where: { sellerId: u.id } }),
      reviews: await p.review.count({ where: { userId: u.id } }),
      requests: await p.categoryRequest.count({ where: { requestedBy: u.id } }),
      orders: await p.order.count({ where: { customerId: u.id } }),
    };
    console.log(u.id, email, JSON.stringify(counts));
    if (Object.values(counts).every(c => c === 0)) {
      await p.user.delete({ where: { id: u.id } });
      console.log('deleted test user', u.id);
    } else {
      console.log('KEEP (has data)');
    }
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
