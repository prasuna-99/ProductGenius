async function main() {
  const B = 'http://localhost:5000';
  const login = async (email) => (await (await fetch(B + '/api/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'demo1234' }),
  })).json());
  const L = await login('marcus@productgenius.internal');
  if (!L.token) { console.log('LOGIN FAILED:', JSON.stringify(L).slice(0, 200)); return; }
  const H = { Authorization: 'Bearer ' + L.token };
  const o = await (await fetch(B + '/api/orders/mine', { headers: H })).json();
  if (!Array.isArray(o)) { console.log('ORDERS FAILED:', JSON.stringify(o).slice(0, 200)); return; }
  for (const x of o.filter(x => x.status === 'Processing').slice(0, 4)) {
    console.log(x.id, x.status, JSON.stringify(x.sellerStatus),
      x.items.map(i => i.sellerId + ':' + i.title).join(' | '));
  }
  // Deliver first processing order fully (each involved seller), watch ingest
  const target = o.filter(x => x.status === 'Processing')[0];
  if (!target) { console.log('no open orders'); return; }
  const sellers = [...new Set(target.items.map(i => i.sellerId).filter(Boolean))];
  console.log('delivering', target.id, 'sellers:', sellers.join(','));
  const creds = {
    'USR-SEL-20261007-000001': 'curator@atelierbordeaux.com',
    'USR-SEL-20261007-000002': 'namaste@himalayanglow.com',
    'USR-SEL-20261007-000003': 'rosy@rosyglow.com',
  };
  for (const s of sellers) {
    const email = creds[s];
    if (!email) { console.log('no creds for seller', s); continue; }
    const SL = await login(email);
    const r = await fetch(B + '/api/orders/' + target.id + '/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + SL.token },
      body: JSON.stringify({ status: 'Delivered' }),
    });
    const j = await r.json();
    console.log(s, '->', r.status, 'global=' + (j.order && j.order.status), 'ingested=' + j.ingested);
  }
  const tx = await (await fetch(B + '/api/dataset/transactions', { headers: H })).json();
  console.log('txns now:', Array.isArray(tx) ? tx.length : JSON.stringify(tx).slice(0, 100));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
