const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  await p.product.update({
    where: { id: 'PRD-000003-000001' },
    data: { rating: 4.4, reviewsCount: 21 },
  });
  console.log('restored Himalayan Soap to 4.4/21');
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
