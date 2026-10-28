async function main() {
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  const t = await db.transaction.findUnique({ where: { id: 'TXN-20261009-000003' } });
  console.log(t ? 'PRESENT: ' + JSON.stringify(t) : 'ABSENT');
  const n = await db.transaction.count();
  console.log('total txns:', n);
  await db.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
