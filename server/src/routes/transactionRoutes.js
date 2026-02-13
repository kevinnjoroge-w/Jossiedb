const express = require('express');
const router = express.Router();
const TransactionService = require('../services/TransactionService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);

// Checkout item (admin, supervisor, foreman, worker)
router.post('/checkout', authorize(['admin', 'supervisor', 'foreman', 'worker']), locationFilter, async (req, res, next) => {
    try {
        const checkout = await TransactionService.checkoutItem(req.body, req.user.id);
        res.status(201).json(checkout);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Checkin item (admin, supervisor, foreman, worker - but workers only their own)
router.post('/:id/checkin', locationFilter, async (req, res, next) => {
    try {
        // Add user_id to returnData for location history tracking
        const returnData = { ...req.body, user_id: req.user.id };
        const result = await TransactionService.checkinItem(req.params.id, returnData);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.get('/', async (req, res, next) => {
    try {
        const transactions = await TransactionService.getCheckouts(req.query);
        res.json(transactions);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
