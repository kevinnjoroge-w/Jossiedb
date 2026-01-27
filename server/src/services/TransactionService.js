const { CheckOut, Item, User, Project, sequelize } = require('../models');
const logger = require('../utils/logger');

class TransactionService {
    async checkoutItem(checkoutData, userId) {
        const t = await sequelize.transaction();

        try {
            const item = await Item.findByPk(checkoutData.item_id, { transaction: t });
            if (!item) throw new Error('Item not found');

            if (item.quantity < checkoutData.quantity) {
                throw new Error('Insufficient quantity available');
            }

            // Create checkout record
            const checkout = await CheckOut.create({
                ...checkoutData,
                user_id: userId
            }, { transaction: t });

            // Update item quantity
            item.quantity -= checkoutData.quantity;
            if (item.quantity === 0) item.status = 'checked_out';
            await item.save({ transaction: t });

            await t.commit();
            return checkout;
        } catch (error) {
            await t.rollback();
            logger.error('Checkout error:', error);
            throw error;
        }
    }

    async checkinItem(checkoutId, returnData) {
        const t = await sequelize.transaction();

        try {
            const checkout = await CheckOut.findByPk(checkoutId, { transaction: t });
            if (!checkout) throw new Error('Checkout record not found');

            if (checkout.status === 'returned') {
                throw new Error('Item already returned');
            }

            // Update checkout status
            checkout.status = 'returned';
            checkout.actual_return_date = new Date();
            checkout.notes = returnData.notes ? `${checkout.notes}\nReturn notes: ${returnData.notes}` : checkout.notes;
            await checkout.save({ transaction: t });

            // Restore item quantity
            const item = await Item.findByPk(checkout.item_id, { transaction: t });
            item.quantity += checkout.quantity;
            if (item.status === 'checked_out' && item.quantity > 0) item.status = 'available';
            await item.save({ transaction: t });

            await t.commit();
            return checkout;
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    async getCheckouts(filters = {}) {
        try {
            const where = {};
            if (filters.status) where.status = filters.status;
            if (filters.user_id) where.user_id = filters.user_id;

            return await CheckOut.findAll({
                where,
                include: [
                    { model: Item, attributes: ['name', 'sku'] },
                    { model: User, as: 'borrower', attributes: ['username', 'full_name'] },
                    { model: Project, attributes: ['name'] }
                ],
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new TransactionService();
