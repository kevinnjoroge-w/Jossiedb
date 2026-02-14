const express = require('express');
const router = express.Router();
const NotificationService = require('../services/NotificationService');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Get all notifications for the logged-in user
router.get('/', async (req, res, next) => {
    try {
        const notifications = await NotificationService.getNotifications(req.user.id, req.query);
        res.json(notifications);
    } catch (err) {
        next(err);
    }
});

// Get unread count
router.get('/unread-count', async (req, res, next) => {
    try {
        const count = await NotificationService.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (err) {
        next(err);
    }
});

// Mark a notification as read
router.patch('/:id/read', async (req, res, next) => {
    try {
        const notification = await NotificationService.markAsRead(req.params.id, req.user.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.json(notification);
    } catch (err) {
        next(err);
    }
});

// Mark all as read
router.post('/mark-all-read', async (req, res, next) => {
    try {
        await NotificationService.markAllAsRead(req.user.id);
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        next(err);
    }
});

// Delete a notification
router.delete('/:id', async (req, res, next) => {
    try {
        const notification = await NotificationService.deleteNotification(req.params.id, req.user.id);
        if (!notification) {
            return res.status(404).json({ error: 'Notification not found' });
        }
        res.status(204).end();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
