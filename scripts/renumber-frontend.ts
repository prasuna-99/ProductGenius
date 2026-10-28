// One-off frontend renumber to the central ID scheme (see server/src/ids.js).
// Rewrites src/data/userDataset.ts + src/data/mockData.ts (+ stray literals in
// AppContext/Genius view) and writes server/scripts/idmap.json, which
// server/scripts/migrate-ids.js consumes so DB rows get byte-identical ids.
// Run once from repo ROOT:  npx tsx scripts/renumber-frontend.ts
import * as fs from 'fs';
import * as path from 'path';

const ROOT = process.cwd();
const SEED_DATE = '20261007';
const pad6 = (n: number) => String(n).padStart(6, '0');

const USER_MAP: Record<string, { newId: string; seq: number }> = {
  'user-customer-1': { newId: `USR-CUS-${SEED_DATE}-000001`, seq: 1 },
  'user-seller-1': { newId: `USR-SEL-${SEED_DATE}-000001`, seq: 2 },
  'user-seller-2': { newId: `USR-SEL-${SEED_DATE}-000002`, seq: 3 },
  'user-seller-3': { newId: `USR-SEL-${SEED_DATE}-000003`, seq: 4 },
  'user-admin-1': { newId: `USR-ADM-${SEED_DATE}-000001`, seq: 5 },
};
const SELLER_SEQ: Record<string, number> = {
  'user-seller-1': 2, 'user-seller-2': 3, 'user-seller-3': 4,
};
// Fixed dates taken from the seed rows themselves
const ORDER_MAP: Record<string, string> = {
  'ORD-9821': 'ORD-20260925-000001',
  'ORD-9755': 'ORD-20260920-000001',
};
const CAMPAIGN_MAP: Record<string, string> = {
  'cmp-festive-01': 'CMP-20260920-000001',
  'cmp-dashain-02': 'CMP-20260925-000001',
  'cmp-season-03': 'CMP-20260915-000001',
};

const idmap: any = { users: {}, products: {}, orders: {}, campaigns: {}, categories: {}, requests: {}, reviews: {}, transactions: {} };
for (const [k, v] of Object.entries(USER_MAP)) idmap.users[k] = { newId: v.newId, seq: v.seq };
for (const [k, v] of Object.entries(ORDER_MAP)) idmap.orders[k] = v;
for (const [k, v] of Object.entries(CAMPAIGN_MAP)) idmap.campaigns[k] = v;

function read(p: string) { return fs.readFileSync(path.join(ROOT, p), 'utf-8'); }
function write(p: string, s: string) { fs.writeFileSync(path.join(ROOT, p), s); }

// ---- 1. userDataset.ts: products (file order, per-seller counters) ----
{
  const p = 'src/data/userDataset.ts';
  let s = read(p);
  const ids = [...s.matchAll(/id: '(pg-[A-Za-z0-9-]+)'/g)].map(m => m[1]);
  const sellers = [...s.matchAll(/sellerId: '([^']+)'/g)].map(m => m[1]);
  if (ids.length !== sellers.length) throw new Error(`product id/seller count mismatch: ${ids.length} vs ${sellers.length}`);
  const counters: Record<string, number> = {};
  const prodMap: Record<string, string> = {};
  ids.forEach((oldId, i) => {
    const seller = sellers[i];
    const sseq = SELLER_SEQ[seller];
    if (!sseq) throw new Error(`unknown seller ${seller} for product ${oldId}`);
    counters[seller] = (counters[seller] || 0) + 1;
    prodMap[oldId] = `PRD-${pad6(sseq)}-${pad6(counters[seller])}`;
  });
  for (const [k, v] of Object.entries(prodMap)) idmap.products[k] = v;
  // transactions T0001..T0300 -> TXN-20260928-<same number>
  s = s.replace(/id: 'T(\d+)'/g, (_m, n) => `id: 'TXN-20260928-${pad6(Number(n))}'`);
  // seed orderIds ORD-DATA-<n> -> ORD-20260928-<n>
  s = s.replace(/orderId: `ORD-DATA-\$\{idx \+ 1\}`/g, 'orderId: `ORD-20260928-${String(idx + 1).padStart(6, \'0\')}`');
  // every remaining quoted pg- literal must be known (map fn, refs)
  const unknown = new Set<string>();
  s = s.replace(/'(pg-[A-Za-z0-9-]+)'/g, (m, id) => {
    if (prodMap[id]) return `'${prodMap[id]}'`;
    unknown.add(id);
    return m;
  });
  if (unknown.size) throw new Error('unmapped product ids in userDataset.ts: ' + [...unknown].join(','));
  // product `id:` fields themselves
  s = s.replace(/id: '(pg-[A-Za-z0-9-]+)'/g, (m, id) => {
    if (!prodMap[id]) throw new Error('unmapped product id field: ' + id);
    return `id: '${prodMap[id]}'`;
  });
  write(p, s);
  console.log(`userDataset.ts: ${ids.length} products renumbered`);
}

// ---- 2. mockData.ts: users (+seqNum), orders, campaigns ----
{
  const p = 'src/data/mockData.ts';
  let s = read(p);
  for (const [oldId, u] of Object.entries(USER_MAP)) {
    const re = new RegExp(`id: '${oldId}',`);
    if (!s.includes(`id: '${oldId}',`)) throw new Error('user id missing in mockData: ' + oldId);
    s = s.replace(re, `id: '${u.newId}',\n    seqNum: ${u.seq},`);
  }
  for (const [oldId, nid] of Object.entries(ORDER_MAP)) {
    s = s.split(`'${oldId}'`).join(`'${nid}'`);
  }
  for (const [oldId, nid] of Object.entries(CAMPAIGN_MAP)) {
    s = s.split(`'${oldId}'`).join(`'${nid}'`);
  }
  // product + user refs inside orders
  const prodMap = idmap.products as Record<string, string>;
  const remapQuoted = (ids: Record<string, string>, label: string) => {
    const unknown = new Set<string>();
    s = s.replace(/'(pg-[A-Za-z0-9-]+|user-[A-Za-z0-9-]+)'/g, (m, id) => {
      if (ids[id] || USER_MAP[id]) return `'${ids[id] || USER_MAP[id].newId}'`;
      unknown.add(id);
      return m;
    });
    if (unknown.size) throw new Error(`unmapped refs in mockData.ts (${label}): ` + [...unknown].join(','));
  };
  remapQuoted(prodMap, 'products/users');
  write(p, s);
  console.log('mockData.ts: users/orders/campaigns renumbered');
}

// ---- 3. stray literals in AppContext + Genius view (wishlist, fallbacks) ----
for (const p of ['src/context/AppContext.tsx', 'src/components/customer/GeniusRecommendationsView.tsx']) {
  let s = read(p);
  const prodMap = idmap.products as Record<string, string>;
  let n = 0;
  s = s.replace(/'(pg-[A-Za-z0-9-]+)'/g, (m, id) => {
    if (prodMap[id]) { n++; return `'${prodMap[id]}'`; }
    return m; // leave (will grep-verify leftovers manually)
  });
  write(p, s);
  console.log(`${p}: ${n} product refs renumbered`);
}

fs.writeFileSync(path.join(ROOT, 'server/scripts/idmap.json'), JSON.stringify(idmap, null, 2));
console.log('idmap.json written:', Object.entries(idmap).map(([k, v]) => `${k}:${Object.keys(v).length}`).join(' '));
