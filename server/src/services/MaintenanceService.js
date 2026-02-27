const { Maintenance, Item, User } = require('../models');
const logger = require('../utils/logger');

class MaintenanceService {
    async getMaintenanceRecords(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;
            if (filters.locationIds) {
                query.location_id = { $in: filters.locationIds };
            }

            const limit = filters.limit ? parseInt(filters.limit) : 0;

            const records = await Maintenance.find(query)
                .populate('item_id', 'name sku location_id')
                .populate('technician_id', 'full_name username')
                .sort({ scheduled_date: 1 })
                .limit(limit);

            return records.map(r => ({
                ...r.toObject(),
                item: r.item_id,
                technician: r.technician_id
            }));
        } catch (error) {
            logger.error('Get maintenance records error:', error);
            throw error;
        }
    }

    async getMaintenanceById(id) {
        try {
            const record = await Maintenance.findById(id)
                .populate('item_id', 'name sku')
                .populate('technician_id', 'full_name username');
            if (!record) throw new Error('Maintenance record not found');
            return {
                ...record.toObject(),
                item: record.item_id,
                technician: record.technician_id
            };
        } catch (error) {
            throw error;
        }
    }

    async scheduleMaintenance(data) {
        try {
            const record = await Maintenance.create(data);
            logger.info(`Maintenance scheduled: ${record._id} for item ${data.item_id}`);
            return record;
        } catch (error) {
            logger.error('Schedule maintenance error:', error);
            throw error;
        }
    }

    async updateMaintenanceStatus(id, { status, technician_notes, completed_date }) {
        try {
            const record = await Maintenance.findById(id);
            if (!record) throw new Error('Maintenance record not found');

            record.status = status;
            if (technician_notes !== undefined) record.technician_notes = technician_notes;
            if (status === 'completed') {
                record.completed_date = completed_date || new Date();
            }
            await record.save();
            logger.info(`Maintenance ${id} status updated to ${status}`);
            return this.getMaintenanceById(id);
        } catch (error) {
            logger.error('Update maintenance status error:', error);
            throw error;
        }
    }

    async deleteMaintenance(id) {
        try {
            const record = await Maintenance.findByIdAndDelete(id);
            if (!record) throw new Error('Maintenance record not found');
            return record;
        } catch (error) {
            logger.error('Delete maintenance error:', error);
            throw error;
        }
    }
}

module.exports = new MaintenanceService();
