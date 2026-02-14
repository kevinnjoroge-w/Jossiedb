const { Item, CheckOut, Maintenance, Project, TransferRequest } = require('../models');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class AnalyticsService {
    async getSummary(locationIds = null) {
        try {
            const query = {};
            let itemIds = null;

            if (locationIds) {
                const objectIdLocationIds = locationIds.map(id => new mongoose.Types.ObjectId(id));
                query.location_id = { $in: objectIdLocationIds };

                // Get all items in these locations to filter related models
                const items = await Item.find(query).select('_id');
                itemIds = items.map(item => item._id);
            }

            let projectQuery = { status: 'active' };
            if (locationIds) {
                const { Location } = require('../models');
                const locations = await Location.find({ _id: { $in: locationIds } });
                const locationNames = locations.map(l => l.name);
                projectQuery.location = { $in: locationNames };
            }

            const relatedQuery = {};
            if (itemIds) {
                relatedQuery.item_id = { $in: itemIds };
            }

            const [
                totalItems,
                lowStockItems,
                pendingTransfers,
                activeTransfers,
                activeProjects,
                pendingMaintenance
            ] = await Promise.all([
                Item.countDocuments(query),
                Item.countDocuments({ ...query, $expr: { $lte: ['$quantity', '$min_quantity'] } }),
                TransferRequest.countDocuments({ ...relatedQuery, status: 'pending' }),
                TransferRequest.countDocuments({ ...relatedQuery, status: 'approved' }),
                Project.countDocuments(projectQuery),
                Maintenance.countDocuments({ ...relatedQuery, status: { $in: ['scheduled', 'in_progress'] } })
            ]);

            return {
                totalItems,
                lowStockItems,
                pendingTransfers,
                activeTransfers,
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
            const pipeline = [];

            // If locationIds provided, lookup Item first and match location_id
            if (locationIds) {
                const objectIdLocationIds = locationIds.map(id => new mongoose.Types.ObjectId(id));
                pipeline.push(
                    {
                        $lookup: {
                            from: 'items',
                            localField: 'item_id',
                            foreignField: '_id',
                            as: 'item_info'
                        }
                    },
                    { $unwind: '$item_info' },
                    { $match: { 'item_info.location_id': { $in: objectIdLocationIds } } }
                );
            }

            pipeline.push(
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
            );

            const stats = await CheckOut.aggregate(pipeline);
            return stats;
        } catch (error) {
            logger.error('Get most used items error:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
