const { Item, Category, Location } = require('../models');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class InventoryService {
    async getAllItems(filters = {}) {
        try {
            const query = {};

            if (filters.category_id) query.category_id = filters.category_id;
            if (filters.location_id) query.location_id = filters.location_id;
            if (filters.assignedLocationIds) {
                if (query.location_id) {
                    if (!filters.assignedLocationIds.includes(query.location_id.toString())) {
                        query.location_id = new mongoose.Types.ObjectId(); // Force empty result
                    }
                } else {
                    query.location_id = { $in: filters.assignedLocationIds };
                }
            }
            if (filters.status) query.status = filters.status;
            if (filters.search) {
                query.$or = [
                    { name: { $regex: filters.search, $options: 'i' } },
                    { sku: { $regex: filters.search, $options: 'i' } }
                ];
            }

            const items = await Item.find(query)
                .populate('category_id', 'name')
                .populate('location_id', 'name')
                .sort({ createdAt: -1 });

            return items.map(item => {
                const itemObj = item.toObject();
                const category = itemObj.category_id;
                const location = itemObj.location_id;

                return {
                    ...itemObj,
                    category_id: category ? category._id : null,
                    location_id: location ? location._id : null,
                    category: category,
                    location: location
                };
            });
        } catch (error) {
            logger.error('Get all items error:', error);
            throw error;
        }
    }

    async getItemById(id) {
        try {
            const item = await Item.findById(id)
                .populate('category_id')
                .populate('location_id');
            if (!item) throw new Error('Item not found');
            const itemObj = item.toObject();
            const category = itemObj.category_id;
            const location = itemObj.location_id;

            return {
                ...itemObj,
                category_id: category ? category._id : null,
                location_id: location ? location._id : null,
                category: category,
                location: location
            };
        } catch (error) {
            throw error;
        }
    }

    async createItem(itemData) {
        try {
            if (itemData.location_name) {
                let location = await Location.findOne({ name: itemData.location_name });
                if (!location) {
                    location = await Location.create({ name: itemData.location_name });
                }
                itemData.location_id = location._id;
            }

            // Sanitize unique fields
            if (itemData.sku === '') delete itemData.sku;
            if (itemData.serial_number === '') delete itemData.serial_number;

            return await Item.create(itemData);
        } catch (error) {
            logger.error('Create item error:', error);
            throw error;
        }
    }

    async updateItem(id, itemData) {
        try {
            if (itemData.location_name) {
                let location = await Location.findOne({ name: itemData.location_name });
                if (!location) {
                    location = await Location.create({ name: itemData.location_name });
                }
                itemData.location_id = location._id;
            }

            // Sanitize unique fields
            if (itemData.sku === '') itemData.sku = null;
            if (itemData.serial_number === '') itemData.serial_number = null;

            const item = await Item.findByIdAndUpdate(id, itemData, { new: true });
            if (!item) throw new Error('Item not found');
            return item;
        } catch (error) {
            throw error;
        }
    }

    async updateItemLocation(itemId, newLocationId, userId, notes = '') {
        const { LocationHistory } = require('../models');
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const item = await Item.findById(itemId); // Removed session
            if (!item) throw new Error('Item not found');

            const oldLocationId = item.location_id;

            // Update item location
            item.location_id = newLocationId;
            await item.save(); // Removed session

            // Create location history entry
            await LocationHistory.create([{
                item_id: itemId,
                from_location_id: oldLocationId,
                to_location_id: newLocationId,
                changed_by: userId,
                change_type: 'manual',
                notes: notes
            }]); // Removed session

            // await session.commitTransaction();
            // session.endSession();

            logger.info(`Item ${itemId} location updated from ${oldLocationId} to ${newLocationId}`);
            return await this.getItemById(itemId);
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            logger.error('Update item location error:', error);
            throw error;
        }
    }

    async getLocationHistory(itemId) {
        const { LocationHistory } = require('../models');
        try {
            const history = await LocationHistory.find({ item_id: itemId })
                .populate('from_location_id', 'name')
                .populate('to_location_id', 'name')
                .populate('changed_by', 'full_name username')
                .sort({ changed_at: -1 });

            // Map to match old Sequelize naming if frontend expects it
            return history.map(h => ({
                ...h.toObject(),
                from_location: h.from_location_id,
                to_location: h.to_location_id,
                changer: h.changed_by
            }));
        } catch (error) {
            logger.error('Get location history error:', error);
            throw error;
        }
    }

    async deleteItem(id) {
        try {
            const item = await Item.findByIdAndDelete(id);
            if (!item) throw new Error('Item not found');
            return item;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new InventoryService();
