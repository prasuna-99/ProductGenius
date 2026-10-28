const express = require('express');
const prisma = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { nextSeq, datedId, dayOf } = require('../ids');

const router = express.Router();

// GET /api/campaigns (all) — customer reads active only via ?active=1
router.get('/', async (req, res, next) => {
  try {
    const where = req.query.active === '1' ? { isActive: true } : {};
    res.json(await prisma.campaign.findMany({ where, orderBy: { createdAt: 'desc' } }));
  } catch (e) { next(e); }
});

// POST /api/campaigns  (admin) — ID = CMP-<date>-<seq>
router.post('/', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const d = dayOf();
    res.status(201).json(await prisma.campaign.create({
      data: { ...req.body, id: datedId('CMP', d, await nextSeq(prisma, `CMP:${d}`)) },
    }));
  } catch (e) { next(e); }
});

// PATCH / DELETE /api/campaigns/:id  (admin)
router.patch('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    res.json(await prisma.campaign.update({ where: { id: req.params.id }, data: req.body }));
  } catch (e) { next(e); }
});
router.delete('/:id', requireAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const { tombstone } = require('../tombstones');
    await prisma.$transaction(async (tx) => {
      await tx.campaign.delete({ where: { id: req.params.id } });
      await tombstone(tx, 'campaigns', req.params.id, req.user.id);
    });
    res.json({ ok: true, tombstoned: true });
  } catch (e) { next(e); }
});

module.exports = router;
