async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const users = await p.user.findMany({ select: { id: true, email: true, role: true, storeName: true } });
  console.log('USERS:', users.map(u => `${u.id} ${u.role} ${u.storeName || u.name} <${u.email}>`).join('\n  '));
  const prods = await p.product.findMany({ select: { id: true, title: true, sellerId: true } });
  const testProds = prods.filter(x => /test|q$/i.test(x.title) && x.title.length < 12);
  console.log('SUSPECT PRODUCTS:', testProds.map(x => `${x.id} "${x.title}" ${x.sellerId}`).join(' | ') || 'none');
  const cats = await p.category.findMany({ select: { id: true, name: true, createdBy: true } });
  console.log('CATEGORIES:', cats.map(c => `${c.name} by=${c.createdBy || 'seed'}`).join(' | '));
  const reqs = await p.categoryRequest.findMany({ select: { id: true, name: true, status: true } });
  console.log('REQUESTS:', reqs.map(r => `${r.name}/${r.status}`).join(' | '));
  const tombs = await p.deletedRecord.findMany();
  console.log('TOMBSTONES:', tombs.length, tombs.map(t => t.table + ':' + t.recordId).join(' | '));
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
