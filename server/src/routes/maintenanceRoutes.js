const express = require('express');
const router = express.Router();
const MaintenanceService = require('../services/MaintenanceService');
const { authenticate } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);

router.get('/', locationFilter, async (req, res, next) => {
    try {
        const filters = { ...req.query, locationIds: req.assignedLocationIds };
        const records = await MaintenanceService.getMaintenanceRecords(filters);
        res.json(records);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const record = await MaintenanceService.scheduleMaintenance(req.body);
        res.status(201).json(record);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
