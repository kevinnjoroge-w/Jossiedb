const { Item, CheckOut, Maintenance, Project } = require('../models');
const logger = require('../utils/logger');

class AnalyticsService {
    async getSummary(locationIds = null) {
        try {
            const query = {};
            if (locationIds) {
                query.location_id = { $in: locationIds.map(id => new mongoose.Types.ObjectId(id)) };
            }

            const [
                totalItems,
                lowStockItems,
                checkedOutItems,
                activeProjects,
                pendingMaintenance
            ] = await Promise.all([
                Item.countDocuments(query),
                Item.countDocuments({ ...query, $expr: { $lte: ['$quantity', '$min_quantity'] } }),
                CheckOut.countDocuments({ ...query, status: 'active' }),
                Project.countDocuments({ status: 'active' }), // Projects are generally global? Or should they also be filtered?
                Maintenance.countDocuments({ ...query, status: { $in: ['scheduled', 'in_progress'] } })
            ]);

            return {
                totalItems,
                lowStockItems,
                checkedOutItems,
                activeProjects,
                pendingMaintenance
            };
        } catch (error) {
            logger.error('Get analytics summary error:', error);
            throw error;
        }
    }

    async getLowStockAlerts(locationIds = null) {
        try {
            const query = {};
            if (locationIds) {
                query.location_id = { $in: locationIds.map(id => new mongoose.Types.ObjectId(id)) };
            }
            return await Item.find({ ...query, $expr: { $lte: ['$quantity', '$min_quantity'] } })
                .sort({ quantity: 1 })
                .limit(5);
        } catch (error) {
            logger.error('Get low stock alerts error:', error);
            throw error;
        }
    }

    async getInventoryByLocation(locationIds = null) {
        try {
            const match = {};
            if (locationIds) {
                match.location_id = { $in: locationIds.map(id => new mongoose.Types.ObjectId(id)) };
            }

            const stats = await Item.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$location_id',
                        total_quantity: { $sum: '$quantity' },
                        item_count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'locations',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'location'
                    }
                },
                { $unwind: { path: '$location', preserveNullAndEmptyArrays: true } },
                { $sort: { total_quantity: -1 } }
            ]);
            return stats;
        } catch (error) {
            logger.error('Get inventory by location error:', error);
            throw error;
        }
    }

    async getInventoryByCategory(locationIds = null) {
        try {
            const match = {};
            if (locationIds) {
                match.location_id = { $in: locationIds.map(id => new mongoose.Types.ObjectId(id)) };
            }

            const stats = await Item.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$category_id',
                        total_quantity: { $sum: '$quantity' },
                        item_count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                { $sort: { total_quantity: -1 } }
            ]);
            return stats;
        } catch (error) {
            logger.error('Get inventory by category error:', error);
            throw error;
        }
    }

    async getMostUsedItems(locationIds = null) {
        try {
            const match = {};
            if (locationIds) {
                match.location_id = { $in: locationIds.map(id => new mongoose.Types.ObjectId(id)) };
            }

            const stats = await CheckOut.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$item_id',
                        checkout_count: { $sum: 1 },
                        total_quantity_used: { $sum: '$quantity' }
                    }
                },
                {
                    $lookup: {
                        from: 'items',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'item'
                    }
                },
                { $unwind: { path: '$item', preserveNullAndEmptyArrays: true } },
                { $sort: { total_quantity_used: -1 } },
                { $limit: 5 }
            ]);
            return stats;
        } catch (error) {
            logger.error('Get most used items error:', error);
            throw error;
        }
    }

    async getCostAnalysis(locationIds = null) {
        try {
            const match = {};
            if (locationIds) {
                match.location_id = { $in: locationIds.map(id => new mongoose.Types.ObjectId(id)) };
            }

            const stats = await Item.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: '$category_id',
                        total_value: { $sum: { $multiply: ['$quantity', '$unit_cost'] } },
                        item_count: { $sum: 1 }
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'category'
                    }
                },
                { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
                { $sort: { total_value: -1 } }
            ]);
            return stats;
        } catch (error) {
            logger.error('Get cost analysis error:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
