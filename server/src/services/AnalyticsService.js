const { Item, CheckOut, Maintenance, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

class AnalyticsService {
    async getSummary() {
        try {
            const [
                totalItems,
                lowStockItems,
                checkedOutItems,
                activeProjects,
                pendingMaintenance
            ] = await Promise.all([
                Item.count(),
                Item.count({ where: { quantity: { [Op.lte]: sequelize.col('min_quantity') } } }),
                CheckOut.count({ where: { status: 'active' } }),
                Project.count({ where: { status: 'active' } }),
                Maintenance.count({ where: { status: { [Op.in]: ['scheduled', 'in_progress'] } } })
            ]);

            return {
                totalItems,
                lowStockItems,
                checkedOutItems,
                activeProjects,
                pendingMaintenance
            };
        } catch (error) {
            throw error;
        }
    }

    async getLowStockAlerts() {
        try {
            return await Item.findAll({
                where: {
                    quantity: { [Op.lte]: sequelize.col('min_quantity') }
                },
                limit: 5,
                order: [['quantity', 'ASC']]
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
