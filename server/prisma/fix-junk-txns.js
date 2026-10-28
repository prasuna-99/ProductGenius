async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  // Mixed row: keep the valid HIGHLIGHTER signal, drop the junk token
  await p.transaction.update({
    where: { id: 'TXN-20261007-000005' },
    data: { itemIds: ['HIGHLIGHTER'] },
  });
  console.log('repaired TXN-20261007-000005 -> [HIGHLIGHTER]');
  // Pure-junk singletons (orders themselves stay untouched in Order tables)
  for (const id of ['TXN-20261006-000003', 'TXN-20261007-000014']) {
    await p.transaction.delete({ where: { id } }).catch(() => {});
    console.log('deleted', id);
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
