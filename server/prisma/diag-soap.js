async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const s = await p.product.findMany({
    where: { canonicalId: 'SOAP' },
    select: { id: true, title: true, sellerId: true, rating: true, reviewsCount: true },
  });
  console.log(JSON.stringify(s));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
