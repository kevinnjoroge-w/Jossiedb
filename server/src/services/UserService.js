const { User } = require('../models');
const logger = require('../utils/logger');

class UserService {
    async getAllUsers(filters = {}) {
        try {
            const { UserLocations } = require('../models');
            const users = await User.find({}, '-password').sort({ createdAt: -1 });

            // Map users to include their assigned locations
            const usersWithLocations = await Promise.all(users.map(async (user) => {
                const locations = await UserLocations.find({ user_id: user._id })
                    .populate('location_id', 'name');
                const userObj = user.toObject();
                userObj.assigned_locations = locations.map(ul => ul.location_id);
                return userObj;
            }));

            return usersWithLocations;
        } catch (error) {
            logger.error('Get all users error:', error);
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const { UserLocations } = require('../models');
            const { assigned_location_ids, ...data } = userData;

            const existingUser = await User.findOne({ username: data.username });
            if (existingUser) {
                throw new Error('Username already exists');
            }

            const user = await User.create(data);

            // Assign locations if provided
            if (assigned_location_ids && Array.isArray(assigned_location_ids)) {
                const assignments = assigned_location_ids.map(locId => ({
                    user_id: user._id,
                    location_id: locId
                }));
                await UserLocations.insertMany(assignments);
            }

            const userResponse = user.toObject();
            delete userResponse.password;

            // Fetch and include assigned locations in response
            const locations = await UserLocations.find({ user_id: user._id })
                .populate('location_id', 'name');
            userResponse.assigned_locations = locations.map(ul => ul.location_id);

            return userResponse;
        } catch (error) {
            logger.error('Create user error:', error);
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            const { UserLocations } = require('../models');
            const { assigned_location_ids, ...data } = userData;

            const user = await User.findById(id);
            if (!user) throw new Error('User not found');

            // Handle password update if provided
            if (data.password && data.password.trim() !== '') {
                user.password = data.password;
            }
            delete data.password;

            user.set(data);
            await user.save();

            // Update location assignments if provided
            if (assigned_location_ids !== undefined && Array.isArray(assigned_location_ids)) {
                // Delete existing assignments
                await UserLocations.deleteMany({ user_id: id });

                // Add new assignments
                const assignments = assigned_location_ids.map(locId => ({
                    user_id: id,
                    location_id: locId
                }));
                await UserLocations.insertMany(assignments);
            }

            const userResponse = user.toObject();
            delete userResponse.password;

            // Fetch and include assigned locations in response
            const locations = await UserLocations.find({ user_id: id })
                .populate('location_id', 'name');
            userResponse.assigned_locations = locations.map(ul => ul.location_id);

            return userResponse;
        } catch (error) {
            logger.error('Update user error:', error);
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            const user = await User.findByIdAndDelete(id);
            if (!user) throw new Error('User not found');
        } catch (error) {
            logger.error('Delete user error:', error);
            throw error;
        }
    }
}

module.exports = new UserService();
