// Seed demo accounts (password for all: demo1234).
// Dataset: import via POST /api/dataset/import with the 300-row text
// (copy from the React app's Admin -> View/Edit Raw Data).
require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../src/db');
const { userId, dayOf } = require('../src/ids');

async function main() {
  const hash = await bcrypt.hash('demo1234', 10);
  const users = [
    { name: 'Elena Rostova', email: 'elena.rostova@boutique.com', role: 'customer' },
    { name: 'Atelier Bordeaux', email: 'curator@atelierbordeaux.com', role: 'seller', storeName: 'Atelier Bordeaux & Co.' },
    { name: 'Himalayan Glow', email: 'namaste@himalayanglow.com', role: 'seller', storeName: 'Himalayan Glow House' },
    { name: 'Rosy Shrestha', email: 'rosy@rosyglow.com', role: 'seller', storeName: 'Rosy Glow Studio' },
    { name: 'Marcus Vance', email: 'marcus@productgenius.internal', role: 'admin' },
  ];
  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      console.log('exists', u.email, existing.id);
      continue;
    }
    const created = await prisma.user.create({ data: { ...u, passwordHash: hash } });
    // ID = USR-<ROLE>-<date>-<seqNum> (seqNum autoincremented on create)
    const renamed = await prisma.user.update({
      where: { id: created.id },
      data: { id: userId(u.role, created.seqNum, dayOf()) },
    });
    console.log('seeded', u.email, renamed.id);
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
