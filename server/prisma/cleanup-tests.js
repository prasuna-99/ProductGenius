async function main() {
  const B = 'http://localhost:5000';
  const J = async (m, p, b) => {
    const headers = { 'Content-Type': 'application/json' };
    if (b && b.t) headers.Authorization = 'Bearer ' + b.t;
    const r = await fetch(B + p, { method: m, headers, body: b && b.b ? JSON.stringify(b.b) : undefined });
    return { s: r.status, j: await r.json().catch(() => ({})) };
  };
  const login = await J('POST', '/api/auth/login', { b: { email: 'marcus@productgenius.internal', password: 'demo1234' } });
  const A = login.j;
  const H = { t: A.token };
  for (const pid of ['PRD-000004-000020', 'PRD-000012-000002']) {
    const d = await J('DELETE', '/api/products/' + pid, H);
    console.log('del product', pid, d.s);
  }
  const Rq = await J('GET', '/api/categories/requests', H);
  const R = Rq.j;
  for (const r of (Array.isArray(R) ? R : []).filter(x => /Test Cat$/.test(x.name))) {
    const d = await J('DELETE', '/api/categories/requests/' + r.id, H);
    console.log('del request', r.name, d.s);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
