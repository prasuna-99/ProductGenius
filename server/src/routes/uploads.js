const express = require('express');
const multer = require('multer');
const { requireAuth } = require('../middleware/auth');
const { uploadBuffer, configured } = require('../cloudinary');

const router = express.Router();
// Memory storage: file never touches disk, streams straight to Cloudinary.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB (client already compresses to ~800px)
  fileFilter: (req, file, cb) => {
    if (file.mimetype && file.mimetype.startsWith('image/')) cb(null, true);
    else cb(Object.assign(new Error('Only image files allowed'), { status: 400 }));
  },
});

// POST /api/uploads/image  (any logged-in user; header Authorization: Bearer <JWT>)
// form-data: photo=<file>, folder?=(products|campaigns|reviews)
router.post(
  '/image',
  requireAuth,
  (req, res, next) => upload.single('photo')(req, res, err => (err ? next(err) : next())),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Field "photo" required' });
      const folder = `productgenius/${['products', 'campaigns', 'reviews'].includes(req.body.folder) ? req.body.folder : 'misc'}`;
      const result = await uploadBuffer(req.file.buffer, { folder });
      res.status(201).json({ url: result.secure_url, publicId: result.public_id });
    } catch (e) { next(e); }
  }
);

// GET /api/uploads/status — viva/demo helper: is Cloudinary wired?
router.get('/status', (req, res) => res.json({ configured }));

module.exports = router;
