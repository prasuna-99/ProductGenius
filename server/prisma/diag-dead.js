async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const ids = ['PRD-000008-000003', 'PRD-000007-000011', 'PRD-000007-000014', 'PRD-000007-000017',
    'PRD-000007-000023', 'PRD-000012-000001', 'PRD-000008-000006', 'PRD-000007-000020', 'PRD-000008-000020'];
  for (const id of ids) {
    const r = await p.product.findUnique({ where: { id }, select: { id: true, title: true } });
    console.log(id, '=>', r ? r.title : 'MISSING');
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
