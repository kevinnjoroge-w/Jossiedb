const express = require('express');
const router = express.Router();
const MaintenanceService = require('../services/MaintenanceService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);

// Get all maintenance records
router.get('/', locationFilter, async (req, res, next) => {
    try {
        const filters = { ...req.query, locationIds: req.assignedLocationIds };
        const records = await MaintenanceService.getMaintenanceRecords(filters);
        res.json(records);
    } catch (err) {
        next(err);
    }
});

// Schedule new maintenance (admin only)
router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const record = await MaintenanceService.scheduleMaintenance(req.body);
        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update maintenance status
router.put('/:id/status', async (req, res, next) => {
    try {
        const record = await MaintenanceService.updateMaintenanceStatus(req.params.id, req.body);
        res.json(record);
    } catch (err) {
        if (err.message === 'Maintenance record not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

// Delete maintenance record (admin only)
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        await MaintenanceService.deleteMaintenance(req.params.id);
        res.status(204).send();
    } catch (err) {
        if (err.message === 'Maintenance record not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

module.exports = router;
