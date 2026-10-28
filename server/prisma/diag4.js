require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const users = await p.user.findMany({ select: { id: true, email: true, role: true, storeName: true, seqNum: true } });
  for (const u of users) {
    const n = await p.product.count({ where: { sellerId: u.id } });
    console.log(`${u.id} seq=${u.seqNum} ${u.role} ${u.storeName || u.name} <${u.email}> products=${n}`);
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message); process.exit(1); });
