const { Item } = require('../models');
const logger = require('../utils/logger');

const locationFilter = async (req, res, next) => {
    // Admins and Supervisors are not restricted
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
        req.assignedLocationIds = null; // Signal that they see everything
        return next();
    }

    try {
        const { UserLocations } = require('../models');
        const userLocations = await UserLocations.find({ user_id: req.user.id });

        const assignedLocationIds = userLocations.map(ul => ul.location_id.toString());
        req.assignedLocationIds = assignedLocationIds;

        // If a location_id is provided in query or body, check if it's assigned
        const requestedLocationId = req.query.location_id || req.body.location_id || req.params.location_id;

        if (requestedLocationId && !assignedLocationIds.includes(requestedLocationId.toString())) {
            return res.status(403).json({ error: 'Access denied to this location' });
        }

        // If an item ID is provided, check if the item is at an assigned location
        if (req.params.id && req.baseUrl.includes('inventory')) {
            try {
                const item = await Item.findById(req.params.id);
                if (!item) {
                    return res.status(404).json({ error: 'Item not found' });
                }
                if (item.location_id && !assignedLocationIds.includes(item.location_id.toString())) {
                    return res.status(403).json({ error: 'Access denied: Item is at another location' });
                }
            } catch (error) {
                logger.error('Location filter error:', error);
                return res.status(500).json({ error: 'Location verification failed' });
            }
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { locationFilter };
