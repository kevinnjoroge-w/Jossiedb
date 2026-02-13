const { TransferRequest, Item, Location, LocationHistory } = require('../models');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class TransferService {
    async getAllTransfers(filters = {}) {
        try {
            const query = {};
            if (filters.status) query.status = filters.status;
            if (filters.requested_by) query.requested_by = filters.requested_by;
            if (filters.from_location_id) query.from_location_id = filters.from_location_id;
            if (filters.to_location_id) query.to_location_id = filters.to_location_id;

            const transfers = await TransferRequest.find(query)
                .populate('item_id', 'name sku')
                .populate('from_location_id', 'name')
                .populate('to_location_id', 'name')
                .populate('requested_by', 'full_name username')
                .populate('approved_by', 'full_name username')
                .sort({ createdAt: -1 });

            // Map to match old Sequelize naming
            return transfers.map(t => ({
                ...t.toObject(),
                Item: t.item_id,
                from_location: t.from_location_id,
                to_location: t.to_location_id,
                requester: t.requested_by,
                approver: t.approved_by
            }));
        } catch (error) {
            logger.error('Get all transfers error:', error);
            throw error;
        }
    }

    async getTransferById(id) {
        try {
            const transfer = await TransferRequest.findById(id)
                .populate('item_id', 'name sku')
                .populate('from_location_id', 'name')
                .populate('to_location_id', 'name')
                .populate('requested_by', 'full_name username')
                .populate('approved_by', 'full_name username');

            if (!transfer) throw new Error('Transfer request not found');
            return transfer;
        } catch (error) {
            throw error;
        }
    }

    async createTransferRequest(transferData) {
        try {
            const { item_id, from_location_id, to_location_id, quantity, requested_by, reason } = transferData;

            if (!item_id || !from_location_id || !to_location_id || !quantity || !requested_by) {
                throw new Error('Missing required fields for transfer request');
            }

            if (from_location_id.toString() === to_location_id.toString()) {
                throw new Error('Source and destination locations must be different');
            }

            const item = await Item.findById(item_id);
            if (!item) throw new Error('Item not found');
            if (item.location_id.toString() !== from_location_id.toString()) {
                throw new Error('Item is not currently at the source location');
            }
            if (item.quantity < quantity) {
                throw new Error('Insufficient item quantity at source location');
            }

            const transfer = await TransferRequest.create({
                item_id,
                from_location_id,
                to_location_id,
                quantity,
                requested_by,
                reason,
                status: 'pending'
            });

            await AuditService.logAction('CREATE_TRANSFER', 'TransferRequest', transfer._id, requested_by, transferData);

            logger.info(`Transfer request created: ${transfer._id} for item ${item.name}`);
            return transfer;
        } catch (error) {
            logger.error('Create transfer request error:', error);
            throw error;
        }
    }

    async approveTransfer(id, approvedBy) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const transfer = await TransferRequest.findById(id).session(session);
            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'pending') throw new Error('Only pending requests can be approved');

            transfer.status = 'approved';
            transfer.approved_by = approvedBy;
            await transfer.save({ session });

            await AuditService.logAction('APPROVE_TRANSFER', 'TransferRequest', transfer._id, approvedBy);

            await session.commitTransaction();
            session.endSession();
            logger.info(`Transfer request ${id} approved by ${approvedBy}`);
            return await this.getTransferById(id);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Approve transfer error:', error);
            throw error;
        }
    }

    async rejectTransfer(id, approvedBy, reason) {
        try {
            const transfer = await TransferRequest.findById(id);
            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'pending') throw new Error('Only pending requests can be rejected');

            transfer.status = 'rejected';
            transfer.approved_by = approvedBy;
            transfer.notes = reason;
            await transfer.save();

            await AuditService.logAction('REJECT_TRANSFER', 'TransferRequest', id, approvedBy, { reason });

            logger.info(`Transfer request ${id} rejected by ${approvedBy}`);
            return await this.getTransferById(id);
        } catch (error) {
            logger.error('Reject transfer error:', error);
            throw error;
        }
    }

    async completeTransfer(id) {
        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            const transfer = await TransferRequest.findById(id).session(session);
            if (!transfer) throw new Error('Transfer request not found');
            if (transfer.status !== 'approved' && transfer.status !== 'in_transit') {
                throw new Error('Only approved or in-transit requests can be completed');
            }

            const item = await Item.findById(transfer.item_id).session(session);
            if (!item) throw new Error('Item not found');

            const oldLocationId = item.location_id;
            item.location_id = transfer.to_location_id;
            await item.save({ session });

            await LocationHistory.create([{
                item_id: transfer.item_id,
                from_location_id: oldLocationId,
                to_location_id: transfer.to_location_id,
                changed_by: transfer.requested_by,
                change_type: 'manual',
                notes: `Transfer completed. Request ID: ${transfer._id}`
            }], { session });

            transfer.status = 'completed';
            transfer.actual_arrival = new Date();
            await transfer.save({ session });

            await AuditService.logAction('COMPLETE_TRANSFER', 'TransferRequest', transfer._id, transfer.requested_by);

            await session.commitTransaction();
            session.endSession();
            logger.info(`Transfer ${id} completed. Item ${item.name} moved to ${transfer.to_location_id}`);
            return await this.getTransferById(id);
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            logger.error('Complete transfer error:', error);
            throw error;
        }
    }
}

module.exports = new TransferService();
