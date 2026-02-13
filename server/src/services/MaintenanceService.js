const { Maintenance } = require('../models');
const logger = require('../utils/logger');

class MaintenanceService {
    async getMaintenanceRecords(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;

            const limit = filters.limit ? parseInt(filters.limit) : 0;

            const records = await Maintenance.find(query)
                .populate('item_id', 'name sku')
                .populate('technician_id', 'full_name')
                .sort({ scheduled_date: 1 })
                .limit(limit);

            return records;
        } catch (error) {
            logger.error('Get maintenance records error:', error);
            throw error;
        }
    }

    async scheduleMaintenance(data) {
        try {
            return await Maintenance.create(data);
        } catch (error) {
            logger.error('Schedule maintenance error:', error);
            throw error;
        }
    }
}

module.exports = new MaintenanceService();
