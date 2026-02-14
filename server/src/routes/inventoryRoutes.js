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
        res.status(400).json({ error: err.message });
    }
});

router.get('/:id', locationFilter, async (req, res, next) => {
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
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const item = await InventoryService.updateItem(req.params.id, req.body);
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
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
        res.json(item);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Get item location history
router.get('/:id/location-history', async (req, res, next) => {
    try {
        const history = await InventoryService.getLocationHistory(req.params.id);
        res.json(history);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        await InventoryService.deleteItem(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
