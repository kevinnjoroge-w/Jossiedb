const { CheckOut, Item, User, Project } = require('../models');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class TransactionService {
    async checkoutItem(checkoutData, userId) {
        // Transactions require a Replica Set. For local standalone, we skip transactions.
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const { LocationHistory } = require('../models');
            const item = await Item.findById(checkoutData.item_id); // Removed session
            if (!item) throw new Error('Item not found');

            if (item.quantity < checkoutData.quantity) {
                throw new Error('Insufficient quantity available');
            }

            // Create checkout record
            const [checkout] = await CheckOut.create([{
                ...checkoutData,
                user_id: userId
            }]); // Removed session

            // Update item quantity
            item.quantity -= checkoutData.quantity;
            if (item.quantity === 0) item.status = 'checked_out';

            // Scenario 2: Auto-update location if destination is provided
            const oldLocationId = item.location_id;
            if (checkoutData.destination_location_id) {
                item.location_id = checkoutData.destination_location_id;

                // Create location history entry
                await LocationHistory.create([{
                    item_id: item._id,
                    from_location_id: oldLocationId,
                    to_location_id: checkoutData.destination_location_id,
                    changed_by: userId,
                    change_type: 'checkout',
                    notes: checkoutData.location_note || `Checked out to destination location`
                }]); // Removed session
            }

            await item.save(); // Removed session

            await AuditService.logAction('CHECKOUT', 'Item', item._id, userId, {
                checkout_id: checkout._id,
                quantity: checkoutData.quantity,
                project_id: checkoutData.project_id,
                destination_location_id: checkoutData.destination_location_id
            });

            // await session.commitTransaction();
            // session.endSession();
            return checkout;
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            logger.error('Checkout error:', error);
            throw error;
        }
    }

    async checkinItem(checkoutId, returnData) {
        // const session = await mongoose.startSession();
        // session.startTransaction();

        try {
            const { LocationHistory } = require('../models');
            const checkout = await CheckOut.findById(checkoutId); // Removed session
            if (!checkout) throw new Error('Checkout record not found');

            if (checkout.status === 'returned') {
                throw new Error('Item already returned');
            }

            // Update checkout status
            checkout.status = 'returned';
            checkout.actual_return_date = new Date();
            checkout.notes = returnData.notes ? `${checkout.notes}\nReturn notes: ${returnData.notes}` : checkout.notes;
            await checkout.save(); // Removed session

            // Restore item quantity
            const item = await Item.findById(checkout.item_id); // Removed session
            if (!item) throw new Error('Item not found');

            item.quantity += checkout.quantity;
            if (item.status === 'checked_out' && item.quantity > 0) item.status = 'available';

            // Scenario 3: Update location during check-in if provided
            const oldLocationId = item.location_id;
            if (returnData.location_id && returnData.location_id.toString() !== (oldLocationId ? oldLocationId.toString() : '')) {
                item.location_id = returnData.location_id;

                // Create location history entry
                await LocationHistory.create([{
                    item_id: item._id,
                    from_location_id: oldLocationId,
                    to_location_id: returnData.location_id,
                    changed_by: returnData.user_id || checkout.user_id,
                    change_type: 'checkin',
                    notes: returnData.location_note || 'Location updated during check-in'
                }]); // Removed session
            }

            await item.save(); // Removed session

            await AuditService.logAction('CHECKIN', 'Item', item._id, returnData.user_id || checkout.user_id, {
                checkout_id: checkout._id,
                location_id: returnData.location_id
            });

            // await session.commitTransaction();
            // session.endSession();
            return checkout;
        } catch (error) {
            // await session.abortTransaction();
            // session.endSession();
            logger.error('Checkin error:', error);
            throw error;
        }
    }

    async getCheckouts(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;
            if (filters.user_id) query.user_id = filters.user_id;

            const checkouts = await CheckOut.find(query)
                .populate('item_id', 'name sku')
                .populate('user_id', 'username full_name')
                .populate('project_id', 'name')
                .sort({ createdAt: -1 })
                .limit(filters.limit ? parseInt(filters.limit) : 0)
                .skip(filters.offset ? parseInt(filters.offset) : 0);

            // Map to match old Sequelize naming
            return checkouts.map(c => ({
                ...c.toObject(),
                item: c.item_id,
                borrower: c.user_id,
                project: c.project_id
            }));
        } catch (error) {
            logger.error('Get checkouts error:', error);
            throw error;
        }
    }
}

module.exports = new TransactionService();
