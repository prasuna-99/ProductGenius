async function main() {
  const B = 'http://localhost:5000';
  const J = async (m, p, b) => {
    const headers = { 'Content-Type': 'application/json' };
    if (b && b.t) headers.Authorization = 'Bearer ' + b.t;
    const r = await fetch(B + p, {
      method: m, headers, body: b && b.b ? JSON.stringify(b.b) : undefined,
    });
    return { s: r.status, j: await r.json().catch(() => ({})) };
  };
  const A = await J('POST', '/api/auth/login', { b: { email: 'marcus@productgenius.internal', password: 'demo1234' } });
  const H = { t: A.j.token };
  console.log('idmap:', (await J('GET', '/api/sync/idmap', H)).s);
  console.log('categories:', (await J('GET', '/api/categories', H)).s);
  console.log('recent:', (await J('GET', '/api/recent', H)).s);
  const C = await J('POST', '/api/campaigns', { t: H.t, b: { title: 'VerifyMe', discountCode: 'VRF' + String(Date.now() % 100000), discountPercent: 5, startDate: '2026-10-07', endDate: '2026-10-08' } });
  console.log('campaignPOST:', C.s, C.j.id || C.j.error);
  if (C.j.id) {
    const D = await J('DELETE', '/api/campaigns/' + C.j.id, H);
    console.log('campaignDELETE:', D.s);
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
