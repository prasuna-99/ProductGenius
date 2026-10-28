require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
// CORS: explicit list from CLIENT_URL plus any localhost / LAN origin
// (phone testing over Wi-Fi changes the last octet — exact-match lists
// silently break sync, so LAN origins are pattern-allowed for this demo).
const LAN_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;
const listed = (process.env.CLIENT_URL || 'http://localhost:3000').split(',').map(s => s.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || listed.includes(origin) || LAN_ORIGIN.test(origin)) cb(null, true);
    else cb(new Error('CORS blocked for ' + origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/mining', require('./routes/mining'));
app.use('/api/dataset', require('./routes/dataset'));
// Reviews live under /api/products/:id/reviews (friendlier path, same router)
app.use('/api', require('./routes/reviews'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/sync', require('./routes/sync'));

// Reviews live under /api/products/:id/reviews too (same router, friendlier path)
app.use('/api', require('./routes/reviews'));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = Number(process.env.PORT || 5000);
app.listen(PORT, () => console.log(`ProductGenius API on http://localhost:${PORT}`));
