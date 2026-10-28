async function main() {
  const { PrismaClient } = require('@prisma/client');
  const p = new PrismaClient();
  const [pid, oid, cid, rid, cat] = process.argv.slice(2);
  // review(s) on the probe product (restores seed rating via recompute below)
  const revs = await p.review.findMany({ where: { productId: pid } });
  for (const r of revs) await p.review.delete({ where: { id: r.id } });
  console.log('del reviews:', revs.length);
  // ingested txn for the probe order
  const txns = await p.transaction.findMany({ where: { orderId: oid } });
  for (const t of txns) await p.transaction.delete({ where: { id: t.id } });
  console.log('del txns:', txns.length);
  await p.orderItem.deleteMany({ where: { orderId: oid } });
  await p.order.delete({ where: { id: oid } }).catch(() => {});
  console.log('del order', oid);
  await p.product.delete({ where: { id: pid } }).catch((e) => console.log('product:', e.message.slice(0, 80)));
  await p.campaign.delete({ where: { id: cid } }).catch(() => {});
  console.log('del campaign', cid);
  await p.categoryRequest.delete({ where: { id: rid } }).catch(() => {});
  console.log('del request', rid);
  if (cat) {
    await p.category.delete({ where: { id: cat } }).catch((e) => console.log('category:', e.message.slice(0, 80)));
    console.log('del category', cat);
  }
  await p.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
