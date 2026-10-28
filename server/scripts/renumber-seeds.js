// One-off: rewrite frontend seed ids to the migrated Neon ids (idmap.json).
// Run from repo ROOT: node server/scripts/renumber-seeds.js   (writes in place)
const fs = require('fs');
const path = require('path');

const idmap = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'idmap.json'), 'utf-8')
);

// Build old->new pairs. Users values are {newId, seq}; everything else is a plain string.
const pairs = [];
for (const [oldId, v] of Object.entries(idmap.users || {})) {
  pairs.push([oldId, typeof v === 'string' ? v : v.newId]);
}
for (const table of ['products', 'orders', 'campaigns', 'categories', 'requests', 'reviews', 'transactions']) {
  for (const [oldId, v] of Object.entries(idmap[table] || {})) {
    pairs.push([oldId, typeof v === 'string' ? v : v.newId]);
  }
}
// Longest-first so 'pg-s1-01' can't clash with a shorter key; replace only
// inside single/double quotes to avoid touching prose.
pairs.sort((a, b) => b[0].length - a[0].length);

const files = ['src/data/userDataset.ts', 'src/data/mockData.ts'];
for (const f of files) {
  let s = fs.readFileSync(f, 'utf-8');
  let n = 0;
  for (const [o, nid] of pairs) {
    if (o === nid) continue;
    const sq = s.split(`'${o}'`).length - 1;
    const dq = s.split(`"${o}"`).length - 1;
    if (sq + dq > 0) {
      s = s.split(`'${o}'`).join(`'${nid}'`).split(`"${o}"`).join(`"${nid}"`);
      n += sq + dq;
    }
  }
  fs.writeFileSync(f, s);
  console.log(f, 'replacements:', n);
}
