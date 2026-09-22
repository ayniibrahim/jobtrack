import express from 'express';
import { Note } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/notes
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetType, targetId } = req.query;

    const query = { userId };
    if (targetType) query.targetType = targetType;
    if (targetId) query.targetId = targetId;

    const notes = await Note.find(query).sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: notes });
  } catch (err) {
    console.error('[Get Notes Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve notes.' });
  }
});

// POST /api/notes
router.post('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const { targetType = 'application', targetId = '', title = '', content, tags = [] } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Note content cannot be empty.' });
    }

    const note = await Note.create({
      userId,
      targetType,
      targetId,
      title: title.trim(),
      content: content.trim(),
      tags
    });

    res.status(201).json({ success: true, data: note, message: 'Note saved successfully.' });
  } catch (err) {
    console.error('[Create Note Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to save note.' });
  }
});

// PUT /api/notes/:id
router.put('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const note = await Note.findById(req.params.id);

    if (!note || String(note.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    const { title, content, tags } = req.body;
    if (title !== undefined) note.title = title.trim();
    if (content !== undefined) note.content = content.trim();
    if (tags !== undefined) note.tags = tags;

    await note.save();
    res.json({ success: true, data: note, message: 'Note updated.' });
  } catch (err) {
    console.error('[Update Note Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update note.' });
  }
});

// DELETE /api/notes/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const note = await Note.findById(req.params.id);

    if (!note || String(note.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Note not found.' });
    }

    await Note.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Note deleted.' });
  } catch (err) {
    console.error('[Delete Note Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete note.' });
  }
});

export default router;
