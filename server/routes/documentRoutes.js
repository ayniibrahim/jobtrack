import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Document, Activity } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

const router = express.Router();
router.use(protect);

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { applicationId, type } = req.query;

    const query = { userId };
    if (applicationId) query.applicationId = applicationId;
    if (type && type !== 'all') query.type = type;

    const documents = await Document.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: documents });
  } catch (err) {
    console.error('[Document GET All Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve documents.' });
  }
});

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, type = 'Resume', applicationId = '' } = req.body;

    let fileName = name;
    let fileSize = 1024 * 500; // default 500KB
    let fileUrl = '';

    if (req.file) {
      fileName = name || req.file.originalname;
      fileSize = req.file.size;
      fileUrl = `/uploads/${req.file.filename}`;
    } else {
      fileName = name || 'Career_Document.pdf';
      fileUrl = `/uploads/${encodeURIComponent(fileName)}`;
    }

    const doc = await Document.create({
      userId,
      name: fileName,
      type,
      size: fileSize,
      url: fileUrl,
      applicationId: applicationId || null
    });

    await Activity.create({
      userId,
      type: 'document',
      title: `Document Uploaded: ${fileName}`,
      description: `Category: ${type} · Size: ${(fileSize / (1024 * 1024)).toFixed(1)} MB`,
      company: 'Career Vault',
      relatedId: doc._id
    });

    res.status(201).json({
      success: true,
      message: 'Document saved successfully.',
      data: doc
    });
  } catch (err) {
    console.error('[Upload Document Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to upload document.' });
  }
});

// PATCH /api/documents/:id
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const doc = await Document.findById(req.params.id);

    if (!doc || String(doc.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    const { name, type, applicationId, notes } = req.body;
    if (name !== undefined) doc.name = name.trim();
    if (type !== undefined) doc.type = type;
    if (applicationId !== undefined) doc.applicationId = applicationId || null;
    if (notes !== undefined) doc.notes = notes;

    await doc.save();
    res.json({ success: true, message: 'Document updated.', data: doc });
  } catch (err) {
    console.error('[Document PATCH Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update document.' });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const doc = await Document.findById(req.params.id);

    if (!doc || String(doc.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Document not found.' });
    }

    // Try deleting physical file if in uploads
    if (doc.url && doc.url.startsWith('/uploads/')) {
      const filePath = path.join(UPLOADS_DIR, path.basename(doc.url));
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          /* ignore */
        }
      }
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Document removed from career vault.' });
  } catch (err) {
    console.error('[Document DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete document.' });
  }
});

export default router;
