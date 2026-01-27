const express = require('express');
const router = express.Router();
const MaintenanceService = require('../services/MaintenanceService');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const records = await MaintenanceService.getMaintenanceRecords(req.query);
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
        next(err);
    }
});

module.exports = router;
