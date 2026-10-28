const { PrismaClient } = require('@prisma/client');

async function main() {
  const p = new PrismaClient();
  const seqs = await p.sequence.findMany({ where: { key: { startsWith: 'PRD:' } } });
  console.log('PRD counters:', seqs.map(s => `${s.key}=${s.last}`).join(' | '));
  const prods = await p.product.findMany({
    where: { sellerId: 'USR-SEL-20261007-000003' },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  console.log('rosy products:', prods.length, prods.slice(0, 3).map(x => x.id).join(','));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 300)); process.exit(1); });
