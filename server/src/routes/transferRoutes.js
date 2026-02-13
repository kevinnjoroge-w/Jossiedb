const express = require('express');
const router = express.Router();
const TransferService = require('../services/TransferService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);

// Get all transfers (Admins and Supervisors see all, Foremen see their own/assigned)
router.get('/', async (req, res, next) => {
    try {
        const filters = { ...req.query };
        if (req.user.role === 'foreman') {
            filters.requested_by = req.user.id;
        }
        const transfers = await TransferService.getAllTransfers(filters);
        res.json(transfers);
    } catch (err) {
        next(err);
    }
});

// Get transfer by ID
router.get('/:id', async (req, res, next) => {
    try {
        const transfer = await TransferService.getTransferById(req.params.id);
        res.json(transfer);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// Create transfer request
router.post('/', async (req, res, next) => {
    try {
        const transferData = {
            ...req.body,
            requested_by: req.user.id
        };
        const transfer = await TransferService.createTransferRequest(transferData);
        res.status(201).json(transfer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Approve transfer (Admin/Supervisor only)
router.post('/:id/approve', authorize(['admin', 'supervisor']), async (req, res, next) => {
    try {
        const transfer = await TransferService.approveTransfer(req.params.id, req.user.id);
        res.json(transfer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Reject transfer (Admin/Supervisor only)
router.post('/:id/reject', authorize(['admin', 'supervisor']), async (req, res, next) => {
    try {
        const { reason } = req.body;
        const transfer = await TransferService.rejectTransfer(req.params.id, req.user.id, reason);
        res.json(transfer);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Complete transfer (Admin, Supervisor, or Requester)
router.post('/:id/complete', async (req, res, next) => {
    try {
        const transfer = await TransferService.getTransferById(req.params.id);
        if (req.user.role !== 'admin' && req.user.role !== 'supervisor' && req.user.id !== transfer.requested_by) {
            return res.status(403).json({ error: 'Not authorized to complete this transfer' });
        }
        const result = await TransferService.completeTransfer(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
