const { Location, User, Item } = require('../models');

const locationFilter = async (req, res, next) => {
    // Admins and Supervisors are not restricted
    if (req.user.role === 'admin' || req.user.role === 'supervisor') {
        return next();
    }

    if (req.user.role === 'foreman') {
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
                const item = await Item.findById(req.params.id);
                if (item && item.location_id && !assignedLocationIds.includes(item.location_id.toString())) {
                    return res.status(403).json({ error: 'Access denied: Item is at another location' });
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    } else {
        // Other roles might have different restrictions, but for now we focus on Foremen
        next();
    }
};

module.exports = { locationFilter };
