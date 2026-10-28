// Full seed: users + categories + 63 products + 300 transactions + campaigns.
// Reads the REAL frontend seed files so Neon matches the shop exactly.
// Run from repo ROOT:  npx tsx server/prisma/seed-full.ts
import { config } from 'dotenv';
config({ path: 'server/.env' });

import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { GOOGLE_ADJUSTED_PRODUCTS, INITIAL_PARSED_DATASET } from '../../src/data/userDataset.js';
import { INITIAL_USERS, INITIAL_CAMPAIGNS } from '../../src/data/mockData.js';

const prisma = new PrismaClient();

async function main() {
  // 1. Users (password for all: demo1234). Frontend USR- ids + seqNum kept
  // in sync so product.sellerId FKs and PRD-/REV- owner prefixes line up.
  const hash = await bcrypt.hash('demo1234', 10);
  for (const u of INITIAL_USERS as any[]) {
    await prisma.user.deleteMany({ where: { email: u.email } });
    await prisma.user.create({
      data: {
        id: u.id, seqNum: u.seqNum ?? null, name: u.name, email: u.email, passwordHash: hash,
        role: u.role as any, storeName: u.storeName ?? null,
        avatar: u.avatar ?? null, joinedDate: u.joinedDate ?? '2026',
      },
    });
  }
  console.log('users:', INITIAL_USERS.length);

  // 2. Base categories (global; sellers can request more via /api/categories/requests)
  const cats = [...new Set(GOOGLE_ADJUSTED_PRODUCTS.map(p => p.category))];
  for (const name of cats) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    await prisma.category.upsert({
      where: { slug },
      update: {},
      create: { name, slug, description: `${name} department` },
    });
  }
  const catRows = await prisma.category.findMany();
  const catId = new Map(catRows.map(c => [c.name, c.id]));
  console.log('categories:', catRows.length);

  // 3. Products (listingId kept, so seller isolation matches the frontend)
  for (const p of GOOGLE_ADJUSTED_PRODUCTS as any[]) {
    await prisma.product.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id, canonicalId: p.canonicalId, title: p.title, category: p.category,
        categoryId: catId.get(p.category) ?? null,
        price: p.price, originalPrice: p.originalPrice ?? null,
        rating: p.rating, reviewsCount: p.reviewsCount,
        inStock: p.inStock, stockCount: p.stockCount, sku: p.sku ?? null,
        sellerId: p.sellerId, sellerName: p.sellerName,
        description: p.description ?? '', features: p.features ?? [],
        imageUrl: p.imageUrl ?? '', tags: p.tags ?? [], isFeatured: !!p.isFeatured,
      },
    });
  }
  console.log('products:', GOOGLE_ADJUSTED_PRODUCTS.length);

  // 4. Transactions — stored as CANONICAL ids (deduped across sellers),
  // exactly what the backend mining engine expects.
  const byId = new Map((GOOGLE_ADJUSTED_PRODUCTS as any[]).map(p => [p.id, p.canonicalId]));
  let n = 0;
  for (const t of INITIAL_PARSED_DATASET.transactions as any[]) {
    const canon = [...new Set(t.itemIds.map((id: string) => byId.get(id) || id))];
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: { itemIds: canon },
      create: { id: t.id, orderId: t.orderId ?? null, date: t.date, itemIds: canon },
    });
    n++;
  }
  console.log('transactions:', n);

  // 5. Campaigns
  for (const c of INITIAL_CAMPAIGNS as any[]) {
    const existing = await prisma.campaign.findFirst({ where: { discountCode: c.discountCode } });
    if (!existing) {
      await prisma.campaign.create({
        data: {
          title: c.title, type: c.type, tagline: c.tagline, discountCode: c.discountCode,
          discountPercent: c.discountPercent, themeColor: c.themeColor, badgeText: c.badgeText,
          bannerImageUrl: c.bannerImageUrl ?? null, startDate: c.startDate, endDate: c.endDate,
          isActive: c.isActive, featuredCategory: c.featuredCategory, description: c.description,
        },
      });
    }
  }
  console.log('campaigns:', INITIAL_CAMPAIGNS.length);
}

main()
  .then(() => prisma.$disconnect().then(() => process.exit(0)))
  .catch(e => { console.error(e); process.exit(1); });
