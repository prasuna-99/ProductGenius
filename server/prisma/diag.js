require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const bad = await p.$queryRawUnsafe(
    'SELECT id, "sellerId" FROM "Product" WHERE "sellerId" NOT IN (SELECT "id" FROM "User")'
  );
  console.log('dangling products:', JSON.stringify(bad));
  const users = await p.user.findMany({ select: { id: true, email: true } });
  console.log('users:', users.map(u => `${u.id}<${u.email}>`).join(' | '));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
