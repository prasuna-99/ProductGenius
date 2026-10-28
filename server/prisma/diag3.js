require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const badP = await p.$queryRawUnsafe(
    'SELECT id, "productId", "userId" FROM "Review" WHERE "productId" NOT IN (SELECT "id" FROM "Product")'
  );
  const badU = await p.$queryRawUnsafe(
    'SELECT id, "productId", "userId" FROM "Review" WHERE "userId" NOT IN (SELECT "id" FROM "User")'
  );
  console.log('reviews/bad-product:', JSON.stringify(badP));
  console.log('reviews/bad-user:', JSON.stringify(badU));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
