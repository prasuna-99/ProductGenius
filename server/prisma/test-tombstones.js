async function main() {
  const B = 'http://localhost:5000';
  const out = [];
  const check = (n, cond, extra = '') => {
    out.push([cond ? 'PASS' : 'FAIL', n, extra]);
    console.log((cond ? 'PASS' : 'FAIL') + ' ' + n + (extra ? ' ' + extra : ''));
  };
  const call = async (m, p, t, b) => {
    for (let i = 0; i < 4; i++) {
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
  const login = async (email) =>
    (await call('POST', '/api/auth/login', null, { email, password: 'demo1234' })).j;

  const rosy = await login('rosy@rosyglow.com');
  const marcus = await login('marcus@productgenius.internal');
  check('login-x2', !!(rosy.token && marcus.token));

  // Session A (seller): create then delete a product
  const created = await call('POST', '/api/products', rosy.token,
    { title: 'Tombstone Probe', category: 'Skincare', price: 111, stockCount: 3 });
  const pid = created.j.id;
  check('A-create', created.s === 201 && !!pid, pid);
  const del = await call('DELETE', '/api/products/' + pid, rosy.token);
  check('A-delete-tombstoned', del.s === 200 && del.j.tombstoned === true);

  // Tombstone feed lists it
  const tombs = await call('GET', '/api/sync/tombstones', marcus.token);
  check('feed-lists-it',
    Array.isArray(tombs.j) && tombs.j.some(t => t.table === 'products' && t.recordId === pid));

  // Session B (stale browser): push the same product payload -> must be BLOCKED
  const stale = {
    products: [{
      id: pid, canonicalId: 'TOMBSTONE-PROBE', title: 'Tombstone Probe', category: 'Skincare',
      price: 111, stockCount: 3, sellerId: rosy.user.id, sellerName: 'Rosy Glow Studio',
    }],
    orders: [], campaigns: [], requests: [], reviews: [], transactions: [],
  };
  const push = await call('POST', '/api/sync/push', marcus.token, stale);
  const blocked = (push.j.blocked || []).join(',');
  check('B-push-blocked', blocked.includes('products:' + pid), blocked || JSON.stringify(push.j).slice(0, 120));

  // Product stays gone
  const gone = await call('GET', '/api/products/' + pid, marcus.token);
  check('stays-gone', gone.s === 404, 'status=' + gone.s);

  const fails = out.filter(r => r[0] === 'FAIL').length;
  console.log('RESULT: ' + (out.length - fails) + '/' + out.length + ' pass');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
