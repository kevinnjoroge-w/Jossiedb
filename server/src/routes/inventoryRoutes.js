const express = require('express');
const router = express.Router();
const InventoryService = require('../services/InventoryService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);

router.get('/', locationFilter, async (req, res, next) => {
    try {
        const filters = { ...req.query };
        if (req.assignedLocationIds) {
            filters.assignedLocationIds = req.assignedLocationIds;
        }
        const items = await InventoryService.getAllItems(filters);
        res.json(items);
    } catch (err) {
        next(err);
    }
});

router.get('/:id', locationFilter, async (req, res, next) => {
    try {
        const item = await InventoryService.getItemById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        if (err.message === 'Item not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const item = await InventoryService.createItem(req.body);
        res.status(201).json(item);
    } catch (err) {
        if (err.message.includes('duplicate key') || err.message.includes('unique')) {
            return res.status(409).json({ error: err.message });
        }
        next(err);
    }
});

router.put('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const item = await InventoryService.updateItem(req.params.id, req.body);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        if (err.message === 'Item not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

// Update item location manually (Scenario 1) - also restricted by locationFilter
router.put('/:id/location', locationFilter, authorize(['admin']), async (req, res, next) => {
    try {
        const { location_id, notes } = req.body;
        const item = await InventoryService.updateItemLocation(
            req.params.id,
            location_id,
            req.user.id,
            notes
        );
        if (!item) return res.status(404).json({ error: 'Item not found' });
        res.json(item);
    } catch (err) {
        if (err.message === 'Item not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

// Get item location history
router.get('/:id/location-history', async (req, res, next) => {
    try {
        const history = await InventoryService.getLocationHistory(req.params.id);
        res.json(history);
    } catch (err) {
        if (err.message === 'Item not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        await InventoryService.deleteItem(req.params.id);
        res.status(204).send();
    } catch (err) {
        if (err.message === 'Item not found') {
            return res.status(404).json({ error: err.message });
        }
        next(err);
    }
});

module.exports = router;
