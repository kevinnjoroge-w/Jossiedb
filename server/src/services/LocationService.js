const { Location, Item, LocationHistory, User, UserLocations } = require('../models');
const AuditService = require('./AuditService');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class LocationService {
    async getAllLocations(filters = {}) {
        try {
            const query = {};
            if (filters.is_active !== undefined) query.is_active = filters.is_active;
            if (filters.assignedLocationIds) {
                query._id = { $in: filters.assignedLocationIds };
            }

            const locations = await Location.find(query)
                .populate({
                    path: 'Items',
                    select: 'id quantity'
                })
                .populate({
                    path: 'foremen',
                    populate: {
                        path: 'user_id',
                        select: 'id full_name username'
                    }
                })
                .sort({ name: 1 });

            // Add item count and occupancy calculation
            const locationsWithDetails = locations.map(loc => {
                const locationData = loc.toObject();

                // Flatten foremen
                locationData.foremen = (locationData.foremen || [])
                    .map(ul => ul.user_id)
                    .filter(u => !!u);

                locationData.item_count = locationData.Items ? locationData.Items.length : 0;
                locationData.current_occupancy = locationData.Items ?
                    locationData.Items.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;

                // Add occupancy percentage if capacity is set
                if (locationData.capacity && locationData.capacity > 0) {
                    locationData.occupancy_percentage = Math.round((locationData.current_occupancy / locationData.capacity) * 100);
                }

                delete locationData.Items;
                return locationData;
            });

            return locationsWithDetails;
        } catch (error) {
            logger.error('Get all locations error:', error);
            throw error;
        }
    }

    async getLocationById(id) {
        try {
            const location = await Location.findById(id)
                .populate({
                    path: 'Items',
                    select: 'id name sku quantity'
                });
            if (!location) throw new Error('Location not found');
            return location;
        } catch (error) {
            throw error;
        }
    }

    async createLocation(locationData) {
        try {
            if (!locationData.name) {
                throw new Error('Location name is required');
            }

            const location = await Location.create(locationData);
            logger.info(`Location created: ${location.name}`);
            return location;
        } catch (error) {
            logger.error('Create location error:', error);
            throw error;
        }
    }

    async updateLocation(id, locationData) {
        try {
            const location = await Location.findByIdAndUpdate(id, locationData, { new: true });
            if (!location) throw new Error('Location not found');
            logger.info(`Location updated: ${location.name}`);
            return location;
        } catch (error) {
            logger.error('Update location error:', error);
            throw error;
        }
    }

    async deleteLocation(id) {
        try {
            const itemCount = await Item.countDocuments({ location_id: id });

            if (itemCount > 0) {
                throw new Error(`Cannot delete location. ${itemCount} item(s) are currently at this location.`);
            }

            const location = await Location.findByIdAndDelete(id);
            if (!location) throw new Error('Location not found');
            logger.info(`Location deleted: ${location.name}`);
            return { message: 'Location deleted successfully' };
        } catch (error) {
            logger.error('Delete location error:', error);
            throw error;
        }
    }

    async getLocationHistory(locationId) {
        try {
            const history = await LocationHistory.find({
                $or: [
                    { from_location_id: locationId },
                    { to_location_id: locationId }
                ]
            })
                .populate('item_id', 'name')
                .populate('from_location_id', 'name')
                .populate('to_location_id', 'name')
                .populate('changed_by', 'full_name username')
                .sort({ changed_at: -1 });

            return history.map(h => ({
                ...h.toObject(),
                Item: h.item_id,
                from_location: h.from_location_id,
                to_location: h.to_location_id,
                changer: h.changed_by
            }));
        } catch (error) {
            logger.error('Get location history error:', error);
            throw error;
        }
    }

    async assignForeman(locationId, userId) {
        try {
            const location = await Location.findById(locationId);
            const user = await User.findById(userId);
            if (!location || !user) throw new Error('Location or User not found');
            if (user.role !== 'foreman') throw new Error('User must be a foreman');

            await UserLocations.findOneAndUpdate(
                { location_id: locationId, user_id: userId },
                { location_id: locationId, user_id: userId },
                { upsert: true, new: true }
            );

            await AuditService.logAction('ASSIGN_FOREMAN', 'Location', locationId, null, { userId });
            return location;
        } catch (error) {
            logger.error('Assign foreman error:', error);
            throw error;
        }
    }

    async unassignForeman(locationId, userId) {
        try {
            const location = await Location.findById(locationId);
            const user = await User.findById(userId);
            if (!location || !user) throw new Error('Location or User not found');

            await UserLocations.findOneAndDelete({ location_id: locationId, user_id: userId });

            await AuditService.logAction('UNASSIGN_FOREMAN', 'Location', locationId, null, { userId });
            return location;
        } catch (error) {
            logger.error('Unassign foreman error:', error);
            throw error;
        }
    }
}

module.exports = new LocationService();
