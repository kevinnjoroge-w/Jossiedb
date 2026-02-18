const jwt = require('jsonwebtoken');
const { User, SessionLog } = require('../models');
const logger = require('../utils/logger');
const WebhookService = require('./WebhookService');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000;

/**
 * Extract client information from request
 */
const getClientInfo = (req) => {
    return {
        userAgent: req.get('user-agent') || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        deviceInfo: req.get('user-agent')?.split(' ').slice(-1)[0] || 'Unknown'
    };
};

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

    /**
     * Login with session creation
     * Supports both JWT and session-based authentication
     */
    async login(username, password, req = null) {
        try {
            const user = await User.findOne({ username });

            if (!user || !(await user.validatePassword(password))) {
                throw new Error('Invalid credentials');
            }

            // Update last login
            user.last_login = new Date();
            await user.save();

            // Generate JWT token
            const token = this.generateToken(user);

            // Create session if request object is provided
            if (req && req.session) {
                await this.createSession(req, user);
            }

            const userResponse = user.toObject();
            delete userResponse.password;

            // Trigger webhook for user login
            const clientInfo = req ? getClientInfo(req) : {};
            await WebhookService.triggerWebhookEvent('user-login', {
                userId: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                ...clientInfo,
                timestamp: new Date().toISOString()
            });

            return { user: userResponse, token };
        } catch (error) {
            logger.error('Login error:', error);
            throw error;
        }
    }

    /**
     * Create session log entry after successful login
     */
    async createSession(req, user) {
        try {
            const clientInfo = getClientInfo(req);
            const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

            // Store session data in express-session
            req.session.userId = user._id.toString();
            req.session.username = user.username;
            req.session.userRole = user.role;

            // Create session log entry for audit trail
            const sessionLog = await SessionLog.createSessionLog({
                userId: user._id,
                sessionId: req.sessionID,
                ...clientInfo,
                expiresAt,
                status: 'active'
            });

            logger.info(`Session created for user ${user.username}`, {
                sessionId: req.sessionID,
                userId: user._id
            });

            return sessionLog;
        } catch (error) {
            logger.error('Session creation error:', error);
            throw error;
        }
    }

    /**
     * Logout and destroy session
     */
    async logout(req) {
        try {
            if (!req.session) {
                throw new Error('No active session');
            }

            const sessionId = req.sessionID;
            const userId = req.session.userId;

            // Log session logout
            if (userId && sessionId) {
                await SessionLog.logoutSession(sessionId);
                logger.info(`Session logged out`, { sessionId, userId });

                // Trigger webhook for user logout
                const user = await User.findById(userId);
                if (user) {
                    await WebhookService.triggerWebhookEvent('user-logout', {
                        userId: user._id,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            // Destroy session
            return new Promise((resolve, reject) => {
                req.session.destroy((err) => {
                    if (err) {
                        logger.error('Session destruction error:', err);
                        reject(err);
                    }
                    resolve(true);
                });
            });
        } catch (error) {
            logger.error('Logout error:', error);
            throw error;
        }
    }

    /**
     * Logout from all devices (revoke all sessions)
     */
    async logoutAllDevices(userId) {
        try {
            // Revoke all active sessions
            const result = await SessionLog.revokeAllUserSessions(userId);
            logger.info(`All sessions revoked for user ${userId}`, {
                modifiedCount: result.modifiedCount
            });
            return result;
        } catch (error) {
            logger.error('Logout all devices error:', error);
            throw error;
        }
    }

    /**
     * Get active sessions for user
     */
    async getActiveSessions(userId) {
        try {
            const sessions = await SessionLog.getActiveSessions(userId);
            return sessions.map(session => ({
                sessionId: session.sessionId,
                loginTime: session.loginTime,
                lastActivityTime: session.lastActivityTime,
                userAgent: session.userAgent,
                ipAddress: session.ipAddress,
                deviceInfo: session.deviceInfo,
                location: session.location
            }));
        } catch (error) {
            logger.error('Error fetching active sessions:', error);
            throw error;
        }
    }

    /**
     * Revoke specific session
     */
    async revokeSession(sessionId, userId) {
        try {
            const result = await SessionLog.revokeSession(sessionId, userId);
            logger.info(`Session revoked`, { sessionId, userId });
            return result;
        } catch (error) {
            logger.error('Session revocation error:', error);
            throw error;
        }
    }

    /**
     * Get session statistics
     */
    async getSessionStats(userId) {
        try {
            return await SessionLog.getSessionStats(userId);
        } catch (error) {
            logger.error('Error fetching session stats:', error);
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

    /**
     * Verify and refresh token if needed
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token expired');
            }
            throw new Error('Invalid token');
        }
    }
}

module.exports = new AuthService();
