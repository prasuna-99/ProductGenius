const express = require('express');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { nextSeq, datedId, dayOf } = require('../ids');

const router = express.Router();
const slugOf = name => name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// GET /api/categories — global list every seller can use
router.get('/', async (req, res, next) => {
  try {
    res.json(await prisma.category.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } }));
  } catch (e) { next(e); }
});

// POST /api/categories/requests  (seller) — lifecycle: pending, ID = REQ-<date>-<seq>
router.post('/requests', requireAuth, requireRole('seller', 'admin'), async (req, res, next) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'name required' });
    const slug = slugOf(name);
    if (await prisma.category.findFirst({ where: { OR: [{ slug }, { name: { equals: name.trim(), mode: 'insensitive' } }] } }))
      return res.status(409).json({ error: 'Category already exists' });
    const d = dayOf();
    res.status(201).json(await prisma.categoryRequest.create({
      data: { id: datedId('REQ', d, await nextSeq(prisma, `REQ:${d}`)), name: name.trim(), slug, description: description || '', requestedBy: req.user.id },
    }));
  } catch (e) { next(e); }
});

// GET /api/categories/requests  (seller: own; admin: all)
router.get('/requests', requireAuth, async (req, res, next) => {
  try {
    const where = req.user.role === 'admin' ? {} : { requestedBy: req.user.id };
    res.json(await prisma.categoryRequest.findMany({ where, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

// POST /api/categories/requests/:id/approve  (admin) — ATOMIC: category + request flip together
router.post('/requests/:id/approve', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const result = await prisma.$transaction(async tx => {
      const r = await tx.categoryRequest.findUnique({ where: { id: req.params.id } });
      if (!r) throw Object.assign(new Error('Not found'), { status: 404 });
      if (r.status !== 'pending') throw Object.assign(new Error('Already decided'), { status: 409 });
      const dd = dayOf();
      const category = await tx.category.create({
        // ID = CAT-<date>-<seq>
        data: { id: datedId('CAT', dd, await nextSeq(tx, `CAT:${dd}`)), name: r.name, slug: r.slug, description: r.description, createdBy: r.requestedBy },
      });
      const request = await tx.categoryRequest.update({
        where: { id: r.id },
        data: { status: 'approved', adminNote: req.body.adminNote || '', decidedBy: req.user.id, decidedAt: new Date(), categoryId: category.id },
      });
      return { category, request };
    });
    res.json(result);
  } catch (e) { next(e); }
});

// POST /api/categories/requests/:id/reject  (admin)
router.post('/requests/:id/reject', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    res.json(await prisma.categoryRequest.update({
      where: { id: req.params.id },
      data: { status: 'rejected', adminNote: req.body.adminNote || '', decidedBy: req.user.id, decidedAt: new Date() },
    }));
  } catch (e) { next(e); }
});

// DELETE /api/categories/requests/:id  (admin cleanup) — tombstoned atomically
router.delete('/requests/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { tombstone } = require('../tombstones');
    await prisma.$transaction(async (tx) => {
      await tx.categoryRequest.delete({ where: { id: req.params.id } });
      await tombstone(tx, 'requests', req.params.id, req.user.id);
    });
    res.json({ ok: true, tombstoned: true });
  } catch (e) { next(e); }
});

module.exports = router;
