async function main() {
  const B = 'http://localhost:5000';
  const out = [];
  const check = (n, cond, extra = '') => {
    out.push([cond ? 'PASS' : 'FAIL', n, extra]);
    console.log((cond ? 'PASS' : 'FAIL') + ' ' + n + (extra ? ' ' + extra : ''));
  };
  const call = async (m, p, t, b, tries = 3) => {
    for (let i = 0; i < tries; i++) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (t) headers.Authorization = 'Bearer ' + t;
        const r = await fetch(B + p, { method: m, headers, body: b ? JSON.stringify(b) : undefined });
        const j = await r.json().catch(() => ({}));
        if (r.status === 500 || r.status === 503) { await new Promise(r2 => setTimeout(r2, 15000)); continue; }
        return { s: r.status, j };
      } catch (e) { await new Promise(r2 => setTimeout(r2, 8000)); }
    }
    return { s: 'FAIL', j: {} };
  };
  const login = async (email) => (await call('POST', '/api/auth/login', null, { email, password: 'demo1234' })).j;
  const elena = await login('elena.rostova@boutique.com');
  const rosy = await login('rosy@rosyglow.com');
  const marcus = await login('marcus@productgenius.internal');
  check('auth-x3', !!(elena.token && rosy.token && marcus.token));

  // transport: raw row counts before
  const beforeTx = await call('GET', '/api/dataset/transactions', marcus.token);
  const n0 = Array.isArray(beforeTx.j) ? beforeTx.j.length : -1;

  // seller write
  const pub = await call('POST', '/api/products', rosy.token,
    { title: 'Conn Probe', category: 'Skincare', price: 100, stockCount: 5 });
  check('write-product', pub.s === 201, pub.j.id || JSON.stringify(pub.j).slice(0, 80));
  const pid = pub.j.id;

  // customer order containing it
  const ord = await call('POST', '/api/orders', elena.token,
    { items: [{ productId: pid, quantity: 1 }], shippingAddress: { street: 's', city: 'c', state: 's', zip: '1' } });
  check('write-order', !!ord.j.id, ord.j.id || JSON.stringify(ord.j).slice(0, 80));

  // seller delivers -> ingest?
  const del = await call('PATCH', '/api/orders/' + ord.j.id + '/status', rosy.token, { status: 'Delivered' });
  check('deliver-ingest', del.j.order && del.j.order.status === 'Delivered' && del.j.ingested === true,
    'global=' + (del.j.order && del.j.order.status) + ' ingested=' + del.j.ingested);

  // review (delivered gate)
  const rev = await call('POST', '/api/products/' + pid + '/reviews', elena.token, { rating: 5, text: 'probe' });
  check('write-review', rev.s === 201, 'status=' + rev.s);

  // transaction visible?
  const afterTx = await call('GET', '/api/dataset/transactions', marcus.token);
  const n1 = Array.isArray(afterTx.j) ? afterTx.j.length : -1;
  check('txn-visible', n1 === n0 + 1, n0 + '->' + n1);

  // cleanup test rows
  await call('DELETE', '/api/products/' + pid, marcus.token);
  const fails = out.filter(r => r[0] === 'FAIL').length;
  console.log('RESULT: ' + (out.length - fails) + '/' + out.length + ' pass');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
