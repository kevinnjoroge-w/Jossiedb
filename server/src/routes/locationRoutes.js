const express = require('express');
const router = express.Router();
const LocationService = require('../services/LocationService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const { locationFilter } = require('../middlewares/locationFilterMiddleware');

router.use(authenticate);

// Get all locations (accessible to all authenticated users, filtered for foremen)
router.get('/', locationFilter, async (req, res, next) => {
    try {
        const filters = {};
        if (req.assignedLocationIds) {
            filters.assignedLocationIds = req.assignedLocationIds;
        }
        const locations = await LocationService.getAllLocations(filters);
        res.json(locations);
    } catch (err) {
        next(err);
    }
});

// Get location by ID with items (filtered for foremen)
router.get('/:id', locationFilter, async (req, res, next) => {
    try {
        const location = await LocationService.getLocationById(req.params.id);
        res.json(location);
    } catch (err) {
        res.status(404).json({ error: err.message });
    }
});

// Get location history
router.get('/:id/history', async (req, res, next) => {
    try {
        const history = await LocationService.getLocationHistory(req.params.id);
        res.json(history);
    } catch (err) {
        next(err);
    }
});

// Create location (admin only)
router.post('/', authorize(['admin']), async (req, res, next) => {
    try {
        const location = await LocationService.createLocation(req.body);
        res.status(201).json(location);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Update location (admin only)
router.put('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const location = await LocationService.updateLocation(req.params.id, req.body);
        res.json(location);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Delete location (admin only)
router.delete('/:id', authorize(['admin']), async (req, res, next) => {
    try {
        const result = await LocationService.deleteLocation(req.params.id);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Assign foreman to location (admin only)
router.post('/:id/foremen', authorize(['admin']), async (req, res, next) => {
    try {
        const { userId } = req.body;
        const result = await LocationService.assignForeman(req.params.id, userId);
        res.json(result);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Unassign foreman from location (admin only)
router.delete('/:id/foremen/:userId', authorize(['admin']), async (req, res, next) => {
    try {
        const result = await LocationService.unassignForeman(req.params.id, req.params.userId);
        res.json(result);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
