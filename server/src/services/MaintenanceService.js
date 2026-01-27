const { Maintenance, Item, User } = require('../models');
const { Op } = require('sequelize');

class MaintenanceService {
    async getMaintenanceRecords(filters = {}) {
        try {
            const where = {};
            if (filters.status) where.status = filters.status;

            const limit = filters.limit ? parseInt(filters.limit) : undefined;

            return await Maintenance.findAll({
                where,
                limit,
                include: [
                    { model: Item, attributes: ['name', 'sku'] },
                    { model: User, as: 'technician', attributes: ['full_name'] }
                ],
                order: [['scheduled_date', 'ASC']]
            });
        } catch (error) {
            throw error;
        }
    }

    async scheduleMaintenance(data) {
        try {
            return await Maintenance.create(data);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MaintenanceService();
