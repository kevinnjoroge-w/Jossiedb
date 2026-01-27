const express = require('express');
const router = express.Router();
const AnalyticsService = require('../services/AnalyticsService');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/summary', async (req, res, next) => {
    try {
        const summary = await AnalyticsService.getSummary();
        res.json(summary);
    } catch (err) {
        next(err);
    }
});

router.get('/low-stock-alerts', async (req, res, next) => {
    try {
        const alerts = await AnalyticsService.getLowStockAlerts();
        res.json(alerts);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
