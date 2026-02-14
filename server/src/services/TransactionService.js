const { CheckOut, Item } = require('../models');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');

class TransactionService {
    async checkoutItem(checkoutData, userId) {
        try {
            const { User, Item, CheckOut, LocationHistory } = require('../models');
            const currentUser = await User.findById(userId);
            if (!currentUser) throw new Error('User not found');

            const item = await Item.findById(checkoutData.item_id);
            if (!item) throw new Error('Item not found');

            if (item.quantity < checkoutData.quantity) {
                throw new Error('Insufficient quantity available');
            }

            const isAdmin = currentUser.role === 'admin';
            const status = isAdmin ? 'active' : 'pending_authorization';

            // Create checkout record
            const [checkout] = await CheckOut.create([{
                ...checkoutData,
                user_id: userId,
                status: status,
                approved_by: isAdmin ? userId : null
            }]);

            if (isAdmin) {
                // Update item quantity only if admin (auto-authorized)
                item.quantity -= checkoutData.quantity;
                if (item.quantity === 0) item.status = 'checked_out';

                // Scenario 2: Auto-update location if destination is provided
                const oldLocationId = item.location_id;
                if (checkoutData.destination_location_id) {
                    item.location_id = checkoutData.destination_location_id;

                    await LocationHistory.create([{
                        item_id: item._id,
                        from_location_id: oldLocationId,
                        to_location_id: checkoutData.destination_location_id,
                        changed_by: userId,
                        change_type: 'checkout',
                        notes: checkoutData.location_note || `Checked out to destination location`
                    }]);
                }
                await item.save();
            }

            await AuditService.logAction('CHECKOUT', 'Item', item._id, userId, {
                checkout_id: checkout._id,
                quantity: checkoutData.quantity,
                status: status,
                is_authorized: isAdmin
            });

            return checkout;
        } catch (error) {
            logger.error('Checkout error:', error);
            throw error;
        }
    }

    async authorizeCheckout(checkoutId, adminId) {
        try {
            const { User, Item, CheckOut, LocationHistory } = require('../models');

            const adminUser = await User.findById(adminId);
            if (!adminUser || adminUser.role !== 'admin') {
                throw new Error('Unauthorized: Only admins can authorize checkouts');
            }

            const checkout = await CheckOut.findById(checkoutId);
            if (!checkout) throw new Error('Checkout not found');
            if (checkout.status !== 'pending_authorization') {
                throw new Error('Checkout is not pending authorization');
            }

            const item = await Item.findById(checkout.item_id);
            if (!item) throw new Error('Item not found');

            if (item.quantity < checkout.quantity) {
                throw new Error('Insufficient item quantity available for authorization');
            }

            // Update item quantity
            item.quantity -= checkout.quantity;
            if (item.quantity === 0) item.status = 'checked_out';

            // Update location if destination was provided in checkout
            if (checkout.destination_location_id) {
                const oldLocationId = item.location_id;
                item.location_id = checkout.destination_location_id;

                await LocationHistory.create([{
                    item_id: item._id,
                    from_location_id: oldLocationId,
                    to_location_id: checkout.destination_location_id,
                    changed_by: adminId,
                    change_type: 'checkout_authorization',
                    notes: checkout.location_note || `Location updated via checkout authorization`
                }]);
            }

            await item.save();

            // Update checkout status
            checkout.status = 'active';
            checkout.approved_by = adminId;
            await checkout.save();

            await AuditService.logAction('CHECKOUT_AUTHORIZATION', 'Item', item._id, adminId, {
                checkout_id: checkout._id,
                user_id: checkout.user_id
            });

            return checkout;
        } catch (error) {
            logger.error('Authorize checkout error:', error);
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

            if (filters.locationIds) {
                query.location_id = { $in: filters.locationIds };
            }

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
