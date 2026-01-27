const { Item, Category, Location, Sequelize } = require('../models');
const logger = require('../utils/logger');

class InventoryService {
    async getAllItems(filters = {}) {
        try {
            const where = {};

            if (filters.category_id) where.category_id = filters.category_id;
            if (filters.location_id) where.location_id = filters.location_id;
            if (filters.status) where.status = filters.status;
            if (filters.search) {
                where[Sequelize.Op.or] = [
                    { name: { [Sequelize.Op.like]: `%${filters.search}%` } },
                    { sku: { [Sequelize.Op.like]: `%${filters.search}%` } }
                ];
            }

            const items = await Item.findAll({
                where,
                include: [
                    { model: Category, attributes: ['name'] },
                    { model: Location, attributes: ['name'] }
                ],
                order: [['createdAt', 'DESC']]
            });

            return items;
        } catch (error) {
            logger.error('Get all items error:', error);
            throw error;
        }
    }

    async getItemById(id) {
        try {
            const item = await Item.findByPk(id, {
                include: [Category, Location]
            });
            if (!item) throw new Error('Item not found');
            return item;
        } catch (error) {
            throw error;
        }
    }

    async createItem(itemData) {
        try {
            if (itemData.location_name) {
                const [location] = await Location.findOrCreate({
                    where: { name: itemData.location_name }
                });
                itemData.location_id = location.id;
            }
            return await Item.create(itemData);
        } catch (error) {
            logger.error('Create item error:', error);
            throw error;
        }
    }

    async updateItem(id, itemData) {
        try {
            if (itemData.location_name) {
                const [location] = await Location.findOrCreate({
                    where: { name: itemData.location_name }
                });
                itemData.location_id = location.id;
            }
            const item = await this.getItemById(id);
            return await item.update(itemData);
        } catch (error) {
            throw error;
        }
    }

    async deleteItem(id) {
        try {
            const item = await this.getItemById(id);
            return await item.destroy();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new InventoryService();
