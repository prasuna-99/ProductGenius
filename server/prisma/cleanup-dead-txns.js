async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  for (const id of ['TXN-20261009-000017', 'TXN-20261009-000018', 'TXN-20261009-000019']) {
    await p.transaction.delete({ where: { id } }).catch((e) => console.log(id, 'skip:', e.message.slice(0, 60)));
    console.log('deleted', id);
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
