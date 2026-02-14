const Notification = require('../models/Notification');
const logger = require('../utils/logger');

class NotificationService {
    async createNotification(data) {
        try {
            return await Notification.create(data);
        } catch (error) {
            logger.error('Error creating notification:', error);
            throw error;
        }
    }

    async getNotifications(userId, filters = {}) {
        try {
            const query = { user_id: userId };
            if (filters.is_read !== undefined) {
                query.is_read = filters.is_read;
            }
            return await Notification.find(query).sort({ createdAt: -1 }).limit(filters.limit || 50);
        } catch (error) {
            logger.error('Error fetching notifications:', error);
            throw error;
        }
    }

    async markAsRead(notificationId, userId) {
        try {
            return await Notification.findOneAndUpdate(
                { _id: notificationId, user_id: userId },
                { is_read: true },
                { new: true }
            );
        } catch (error) {
            logger.error('Error marking notification as read:', error);
            throw error;
        }
    }

    async markAllAsRead(userId) {
        try {
            return await Notification.updateMany(
                { user_id: userId, is_read: false },
                { is_read: true }
            );
        } catch (error) {
            logger.error('Error marking all notifications as read:', error);
            throw error;
        }
    }

    async deleteNotification(notificationId, userId) {
        try {
            return await Notification.findOneAndDelete({ _id: notificationId, user_id: userId });
        } catch (error) {
            logger.error('Error deleting notification:', error);
            throw error;
        }
    }

    async getUnreadCount(userId) {
        try {
            return await Notification.countDocuments({ user_id: userId, is_read: false });
        } catch (error) {
            logger.error('Error fetching unread count:', error);
            throw error;
        }
    }
}

module.exports = new NotificationService();
