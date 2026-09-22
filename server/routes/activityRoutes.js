import express from 'express';
import { Activity } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/activities
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const activities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .limit(25)
      .lean();

    res.json({ success: true, data: activities });
  } catch (err) {
    console.error('[Activity GET Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve activities.' });
  }
});

// DELETE /api/activities (Clear feed)
router.delete('/', async (req, res) => {
  try {
    const userId = req.user._id;
    await Activity.deleteMany({ userId });
    res.json({ success: true, message: 'Activity feed cleared.' });
  } catch (err) {
    console.error('[Activity Clear Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to clear activities.' });
  }
});

export default router;
