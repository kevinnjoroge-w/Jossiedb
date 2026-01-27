const { AuditLog, User } = require('../models');

class AuditService {
    async getLogs(filters = {}) {
        try {
            const where = {};
            if (filters.entity_type) where.entity_type = filters.entity_type;
            if (filters.action) where.action = filters.action;
            if (filters.user_id) where.user_id = filters.user_id;

            return await AuditLog.findAll({
                where,
                include: [
                    { model: User, attributes: ['username', 'full_name'] }
                ],
                order: [['createdAt', 'DESC']],
                limit: filters.limit ? parseInt(filters.limit) : 100
            });
        } catch (error) {
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
