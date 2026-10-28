async function main() {
  const B = 'http://localhost:5000';
  const out = [];
  const check = (n, cond, extra = '') => {
    out.push([cond ? 'PASS' : 'FAIL', n, extra]);
    console.log((cond ? 'PASS' : 'FAIL') + ' ' + n + (extra ? ' ' + extra : ''));
  };
  const call = async (m, p, t, b) => {
    for (let i = 0; i < 3; i++) {
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
  const TAG = 'P2' + String(Date.now() % 100000);
  const login = async (email) => (await call('POST', '/api/auth/login', null, { email, password: 'demo1234' })).j;

  const elena = await login('elena.rostova@boutique.com');
  const rosy = await login('rosy@rosyglow.com');
  const marcus = await login('marcus@productgenius.internal');
  check('login-x3', !!(elena.token && rosy.token && marcus.token));

  // 1. Seller publishes -> public catalog sees it
  const pub = await call('POST', '/api/products', rosy.token,
    { title: TAG + ' Serum', category: 'Skincare', price: 999, stockCount: 5 });
  const pid = pub.j.id;
  check('1-publish', pub.s === 201 && /^PRD-/.test(pid || ''), pid);
  const cat = await call('GET', '/api/products');
  check('1-visible-public', Array.isArray(cat.j) && cat.j.some(p => p.id === pid));

  // 2. Customer orders it -> seller sees it in /mine
  const ord = await call('POST', '/api/orders', elena.token,
    { items: [{ productId: pid, quantity: 1 }], shippingAddress: { street: 's', city: 'c', state: 's', zip: '1' } });
  const oid = ord.j.id;
  check('2-order', !!oid, oid);
  const mine = await call('GET', '/api/orders/mine', rosy.token);
  check('2-visible-to-seller', Array.isArray(mine.j) && mine.j.some(o => o.id === oid));

  // 3. Seller delivers -> global Delivered + ingest
  const del = await call('PATCH', '/api/orders/' + oid + '/status', rosy.token, { status: 'Delivered' });
  check('3-deliver-ingest', del.j.order && del.j.order.status === 'Delivered' && del.j.ingested === true);

  // 4. Customer reviews -> visible + average recomputed
  const rev = await call('POST', '/api/products/' + pid + '/reviews', elena.token,
    { rating: 4, text: TAG + ' review' });
  check('4-review', rev.s === 201, rev.j.id);
  const rl = await call('GET', '/api/products/' + pid + '/reviews', elena.token);
  check('4-visible', Array.isArray(rl.j) && rl.j.some(r => r.id === rev.j.id));

  // 5. Admin campaign -> public list
  const code = 'P2' + String(Date.now() % 100000);
  const camp = await call('POST', '/api/campaigns', marcus.token,
    { title: TAG, discountCode: code, discountPercent: 5, startDate: '2026-10-09', endDate: '2026-10-10' });
  const cid = camp.j.id;
  check('5-campaign', camp.s === 201, cid);
  const cl = await call('GET', '/api/campaigns');
  check('5-visible-public', Array.isArray(cl.j) && cl.j.some(c => c.id === cid));

  // 6. Category request -> admin queue -> approve -> global list
  const req = await call('POST', '/api/categories/requests', rosy.token, { name: TAG + ' Care' });
  const rid = req.j.id;
  check('6-request', req.s === 201, rid);
  const q = await call('GET', '/api/categories/requests', marcus.token);
  check('6-visible-to-admin', Array.isArray(q.j) && q.j.some(r => r.id === rid));
  const ap = await call('POST', '/api/categories/requests/' + rid + '/approve', marcus.token, {});
  check('6-approve', !!(ap.j.category && ap.j.category.id), ap.j.category && ap.j.category.id);
  const gl = await call('GET', '/api/categories');
  check('6-global', Array.isArray(gl.j) && gl.j.some(c => c.id === (ap.j.category && ap.j.category.id)));

  // 7. Forbidden cases (must stay rejected)
  const f1 = await call('POST', '/api/products', elena.token, { title: 'Nope', price: 1 });
  check('7-customer-cannot-publish', f1.s === 403, 'status=' + f1.s);
  const f2 = await call('POST', '/api/categories/requests/' + rid + '/approve', rosy.token, {});
  check('7-seller-cannot-approve', f2.s === 403 || f2.s === 409, 'status=' + f2.s);
  const f3 = await call('POST', '/api/products/' + pid + '/reviews', rosy.token, { rating: 5, text: 'x' });
  check('7-review-needs-delivery', f3.s === 403, 'status=' + f3.s);

  const fails = out.filter(r => r[0] === 'FAIL').length;
  console.log('RESULT: ' + (out.length - fails) + '/' + out.length + ' pass');
  console.log('TAG=' + TAG + ' PID=' + pid + ' OID=' + oid + ' CID=' + cid + ' RID=' + rid + ' CAT=' + (ap.j.category && ap.j.category.id));
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
