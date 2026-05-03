// features/notifications/notifRoutes.js
const express = require('express');
const router  = express.Router();
const { verifyToken } = require('../../middleware/verifyTokens');
const {
  getNotifications, markRead, markAllRead, countUnread,
} = require('./notifModel');

// GET /api/notifications — get all notifications for logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const notifs = await getNotifications(req.user.id);
    res.json({ notifications: notifs });
  } catch (err) {
    console.error('getNotifications error:', err.message);
    res.status(500).json({ error: 'could not fetch notifications.' });
  }
});

// GET /api/notifications/unread-count — badge count
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const count = await countUnread(req.user.id);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'could not count notifications.' });
  }
});

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', verifyToken, async (req, res) => {
  try {
    await markRead(parseInt(req.params.id), req.user.id);
    res.json({ message: 'marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'could not mark notification.' });
  }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', verifyToken, async (req, res) => {
  try {
    await markAllRead(req.user.id);
    res.json({ message: 'all notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'could not mark notifications.' });
  }
});

module.exports = router;