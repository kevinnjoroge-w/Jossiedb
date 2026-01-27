const express = require('express');
const router = express.Router();
const InventoryService = require('../services/InventoryService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', async (req, res, next) => {
    try {
        const items = await InventoryService.getAllItems(req.query);
        res.json(items);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const item = await InventoryService.getItemById(req.params.id);
        res.json(item);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const item = await InventoryService.createItem(req.body);
        res.status(201).json(item);
    } catch (err) {
        next(err);
    }
});

router.put('/:id', authorize(['admin', 'supervisor']), async (req, res, next) => {
    try {
        const item = await InventoryService.updateItem(req.params.id, req.body);
        res.json(item);
    } catch (err) {
        next(err);
    }
});

router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        await InventoryService.deleteItem(req.params.id);
        res.status(204).send();
    } catch (err) {
        next(err);
    }
});

module.exports = router;
