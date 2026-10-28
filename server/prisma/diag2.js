require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const rows = await p.$queryRawUnsafe(
    'SELECT id, title, price, "sellerId", "createdAt" FROM "Product" WHERE "sellerId" NOT IN (SELECT "id" FROM "User")'
  );
  console.log(JSON.stringify(rows, null, 1));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
