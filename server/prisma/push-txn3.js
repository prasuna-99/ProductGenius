async function main() {
  const B = 'http://localhost:5000';
  const login = async (email) => (await (await fetch(B + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo1234' }),
  })).json());
  // What the user's browser sends on its next signed-in sync for that row:
  // same id, same listing id, same shape as ingestOrderToDataset wrote it.
  const payload = {
    products: [], orders: [], campaigns: [], requests: [], reviews: [],
    transactions: [{
      id: 'TXN-20261009-000003',
      orderId: null, // browser row's order link unknown here; upsert keeps id stable
      date: '2026-10-09',
      itemIds: ['PRD-000004-000014'],
    }],
  };
  const M = await login('marcus@productgenius.internal');
  const r = await fetch(B + '/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + M.token },
    body: JSON.stringify(payload),
  });
  console.log('push status:', r.status, JSON.stringify(await r.json()));
  const { PrismaClient } = require('@prisma/client');
  const db = new PrismaClient();
  const t = await db.transaction.findUnique({ where: { id: 'TXN-20261009-000003' } });
  console.log('in Neon now:', t ? JSON.stringify(t.itemIds) : 'ABSENT');
  await db.$disconnect();
}

main().catch(e => { console.error(e.message.slice(0, 200)); process.exit(1); });
