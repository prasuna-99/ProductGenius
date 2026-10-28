const express = require('express');
const bcrypt = require('bcryptjs');
const prisma = require('../db');
const { signToken } = require('../middleware/auth');
const { userId, dayOf } = require('../ids');

const router = express.Router();
const publicUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, storeName: u.storeName, avatar: u.avatar, joinedDate: u.joinedDate, seqNum: u.seqNum });

// POST /api/auth/register  {name,email,password,role,storeName?}
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'customer', storeName } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' });
    if (!['customer', 'seller', 'admin'].includes(role)) return res.status(400).json({ error: 'bad role' });
    const exists = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    // ID = USR-<ROLE>-<date>-<seqNum>. seqNum is autoincremented on create,
    // then the PK is renamed (safe: brand-new row has no relations yet).
    const created = await prisma.user.create({
      data: { name, email: email.toLowerCase(), passwordHash: await bcrypt.hash(password, 10), role, storeName: storeName || null },
    });
    const user = await prisma.user.update({
      where: { id: created.id },
      data: { id: userId(role, created.seqNum, dayOf()) },
    });
    res.status(201).json({ user: publicUser(user), token: signToken(user) });
  } catch (e) { next(e); }
});

// POST /api/auth/login  {email,password}
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: (email || '').toLowerCase() } });
    if (!user || !(await bcrypt.compare(password || '', user.passwordHash)))
      return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ user: publicUser(user), token: signToken(user) });
  } catch (e) { next(e); }
});

module.exports = router;
