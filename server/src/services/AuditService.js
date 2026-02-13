const { AuditLog, User } = require('../models');
const logger = require('../utils/logger');

class AuditService {
    async getLogs(filters = {}) {
        try {
            const query = {};
            if (filters.entity_type) query.entity_type = filters.entity_type;
            if (filters.action) query.action = filters.action;
            if (filters.user_id) query.user_id = filters.user_id;

            const logs = await AuditLog.find(query)
                .populate('user_id', 'username full_name')
                .sort({ createdAt: -1 })
                .limit(filters.limit ? parseInt(filters.limit) : 100);

            return logs;
        } catch (error) {
            logger.error('Get logs error:', error);
            throw error;
        }
    }

    async logAction(action, entityType, entityId, userId, details = {}) {
        try {
            await AuditLog.create({
                action,
                entity_type: entityType,
                entity_id: entityId,
                user_id: userId,
                details
            });
        } catch (error) {
            console.error('Failed to create audit log:', error);
            // Don't throw, just log error so main flow isn't interrupted
        }
    }
}

module.exports = new AuditService();
