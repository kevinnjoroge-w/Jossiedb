const express = require('express');
const router = express.Router();
const TransactionService = require('../services/TransactionService');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/checkout', async (req, res, next) => {
    try {
        const checkout = await TransactionService.checkoutItem(req.body, req.user.id);
        res.status(201).json(checkout);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.post('/:id/checkin', async (req, res, next) => {
    try {
        const result = await TransactionService.checkinItem(req.params.id, req.body);
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
