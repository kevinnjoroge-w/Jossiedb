const { User } = require('../models');
const logger = require('../utils/logger');

class UserService {
    async getAllUsers(filters = {}) {
        try {
            return await User.findAll({
                attributes: { exclude: ['password'] },
                order: [['createdAt', 'DESC']]
            });
        } catch (error) {
            throw error;
        }
    }

    async createUser(userData) {
        try {
            const existingUser = await User.findOne({ where: { username: userData.username } });
            if (existingUser) {
                throw new Error('Username already exists');
            }

            const user = await User.create(userData);
            const userResponse = user.toJSON();
            delete userResponse.password;
            return userResponse;
        } catch (error) {
            throw error;
        }
    }

    async updateUser(id, userData) {
        try {
            const user = await User.findByPk(id);
            if (!user) throw new Error('User not found');

            await user.update(userData);

            const userResponse = user.toJSON();
            delete userResponse.password;
            return userResponse;
        } catch (error) {
            throw error;
        }
    }

    async deleteUser(id) {
        try {
            const user = await User.findByPk(id);
            if (!user) throw new Error('User not found');

            // Prevent deleting self? (Controller can handle, but good to check)
            // Prevent deleting last admin?

            await user.destroy();
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new UserService();
