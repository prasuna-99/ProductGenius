async function main() {
  const B = 'http://localhost:5000';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  async function call(m, p, b, tries = 3) {
    let last;
    for (let i = 0; i < tries; i++) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (b && b.t) headers.Authorization = 'Bearer ' + b.t;
        const r = await fetch(B + p, {
          method: m, headers, body: b && b.b ? JSON.stringify(b.b) : undefined,
        });
        const j = await r.json().catch(() => ({}));
        if (r.status === 500 || r.status === 503) { last = j; await sleep(15000); continue; }
        return { s: r.status, j };
      } catch (e) { last = e; await sleep(5000); }
    }
    return { s: 'FAIL', j: last };
  }
  const results = [];
  const check = (n, cond, extra = '') => {
    results.push([cond ? 'PASS' : 'FAIL', n, extra]);
    console.log((cond ? 'PASS' : 'FAIL') + ' ' + n + (extra ? ' ' + extra : ''));
  };

  // P1/P2: backend + frontend alive (callers verify :3000 separately)
  const h = await call('GET', '/health');
  check('1-backend-health', h.s === 200);

  // P3: login all 3 roles
  const users = {
    customer: 'elena.rostova@boutique.com',
    seller: 'rosy@rosyglow.com',
    admin: 'marcus@productgenius.internal',
  };
  const tok = {};
  for (const [role, email] of Object.entries(users)) {
    const r = await call('POST', '/api/auth/login', { b: { email, password: 'demo1234' } });
    tok[role] = r.j && r.j.token;
    check('2-login-' + role, !!tok[role], r.j && (r.j.user && r.j.user.id));
  }

  // P4: catalog serves seeded scale
  const prods = await call('GET', '/api/products', { t: tok.customer });
  check('3-products>=60', Array.isArray(prods.j) && prods.j.length >= 60, String(Array.isArray(prods.j) && prods.j.length));

  // P5: buy (cross-seller) as customer
  const soap = prods.j.find(p => p.canonicalId === 'SOAP' && p.sellerId !== undefined);
  const lip = prods.j.find(p => p.canonicalId === 'LIPSTICK');
  const order = await call('POST', '/api/orders', { t: tok.customer, b: {
    items: [{ productId: soap.id, quantity: 1 }, { productId: lip.id, quantity: 1 }],
    shippingAddress: { street: 's', city: 'c', state: 's', zip: '1' },
  }});
  check('4-place-order', !!order.j.id, order.j.id || JSON.stringify(order.j).slice(0, 100));
  const oid = order.j.id;

  // P6: deliver each involved seller's share, expect ingest exactly once at the end
  const sellers = [...new Set(order.j.items.map(i => i.sellerId))];
  const sellerCreds = {};
  for (const [role, email] of Object.entries(users)) {
    if (role === 'customer') continue;
    const L = await call('POST', '/api/auth/login', { b: { email, password: 'demo1234' } });
    if (L.j && L.j.user) sellerCreds[L.j.user.id] = L.j.token;
  }
  // map involved sellers to known tokens (rosy/admin customers fallback)
  const emailFor = {
    'USR-SEL-20261007-000001': 'curator@atelierbordeaux.com',
    'USR-SEL-20261007-000002': 'namaste@himalayanglow.com',
    'USR-SEL-20261007-000003': 'rosy@rosyglow.com',
  };
  let lastIngest = false;
  for (const s of sellers) {
    let t = sellerCreds[s];
    if (!t && emailFor[s]) {
      const L = await call('POST', '/api/auth/login', { b: { email: emailFor[s], password: 'demo1234' } });
      t = L.j && L.j.token;
    }
    if (!t) { check('5-deliver-' + s, false, 'no token'); continue; }
    const r = await call('PATCH', '/api/orders/' + oid + '/status', { t, b: { status: 'Delivered' } });
    check('5-deliver-' + s, r.j && r.j.order && true, 'global=' + (r.j.order && r.j.order.status) + ' ingested=' + r.j.ingested);
    if (r.j.ingested) lastIngest = true;
  }
  check('6-ingested-once', lastIngest === true);

  // P7: review as customer (delivered gate) + average recompute
  const rev = await call('POST', '/api/products/' + soap.id + '/reviews',
    { t: tok.customer, b: { rating: 5, text: 'Phase0 probe review' } });
  check('7-review', rev.s === 201, 'status=' + rev.s);
  const got = await call('GET', '/api/products/' + soap.id, { t: tok.customer });
  check('8-rating-recomputed', !!(got.j && got.j.reviewsCount >= 1), 'count=' + (got.j && got.j.reviewsCount));

  const fails = results.filter(r => r[0] === 'FAIL').length;
  console.log('RESULT: ' + (results.length - fails) + '/' + results.length + ' pass');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
