import express from 'express';
import { Notification } from '../models/index.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.use(protect);

// GET /api/notifications
router.get('/', async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      unreadCount,
      data: notifications
    });
  } catch (err) {
    console.error('[Notification GET Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve notifications.' });
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', async (req, res) => {
  try {
    const userId = req.user._id;
    const notif = await Notification.findById(req.params.id);

    if (!notif || String(notif.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    notif.read = true;
    await notif.save();

    res.json({ success: true, message: 'Notification marked as read.', data: notif });
  } catch (err) {
    console.error('[Notification PATCH Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to update notification.' });
  }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', async (req, res) => {
  try {
    const userId = req.user._id;
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('[Notification Read All Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to mark all notifications as read.' });
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user._id;
    const notif = await Notification.findById(req.params.id);

    if (!notif || String(notif.userId) !== String(userId)) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }

    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification removed.' });
  } catch (err) {
    console.error('[Notification DELETE Error]:', err);
    res.status(500).json({ success: false, message: 'Failed to delete notification.' });
  }
});

export default router;
