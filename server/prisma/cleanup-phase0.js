async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const revs = await p.review.findMany({ where: { text: 'Phase0 probe review' }, select: { id: true } });
  for (const r of revs) {
    await p.review.delete({ where: { id: r.id } });
    console.log('del review', r.id);
  }
  console.log('probe reviews remaining:', revs.length ? 'cleaned' : 'none');
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
