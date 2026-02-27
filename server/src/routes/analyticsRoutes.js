const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/AnalyticsService');
const { authenticate } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);
router.use(locationFilter);

router.get('/summary', async (req, res, next) => {
    try {
        const summary = await AnalyticsService.getSummary(req.assignedLocationIds);
        res.json(summary);
    } catch (err) {
        next(err);
    }
});

router.get('/low-stock-alerts', async (req, res, next) => {
    try {
        const alerts = await AnalyticsService.getLowStockAlerts(req.assignedLocationIds);
        res.json(alerts);
    } catch (err) {
        next(err);
    }
});

router.get('/by-location', async (req, res, next) => {
    try {
        const data = await AnalyticsService.getInventoryByLocation(req.assignedLocationIds);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/by-category', async (req, res, next) => {
    try {
        const data = await AnalyticsService.getInventoryByCategory(req.assignedLocationIds);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/most-used', async (req, res, next) => {
    try {
        const data = await AnalyticsService.getMostUsedItems(req.assignedLocationIds);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/transfer-time', async (req, res, next) => {
    try {
        const data = await AnalyticsService.getTransferApprovalTime(req.assignedLocationIds);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

router.get('/maintenance-compliance', async (req, res, next) => {
    try {
        const data = await AnalyticsService.getMaintenanceCompliance(req.assignedLocationIds);
        res.json(data);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
