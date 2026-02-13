const jwt = require('jsonwebtoken');
const { User } = require('../models');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

class AuthService {
    async register(userData) {
        try {
            // Check if user exists
            const existingUser = await User.findOne({
                username: userData.username
            });

            if (existingUser) {
                throw new Error('Username already taken');
            }

            // Create user
            const user = await User.create(userData);

            // Generate token
            const token = this.generateToken(user);

            // Return user without password
            const userResponse = user.toObject();
            delete userResponse.password;

            return { user: userResponse, token };
        } catch (error) {
            logger.error('Registration error:', error);
            throw error;
        }
    }

    async login(username, password) {
        try {
            const user = await User.findOne({ username });

            if (!user || !(await user.validatePassword(password))) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            user.last_login = new Date();
            await user.save();

            const token = this.generateToken(user);
            const userResponse = user.toObject();
            delete userResponse.password;

            return { user: userResponse, token };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    generateToken(user) {
        return jwt.sign(
            { id: user._id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
    }
}

module.exports = new AuthService();
