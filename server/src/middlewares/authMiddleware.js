const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Authenticate user via JWT token or session
 * Supports both stateless (JWT) and stateful (session) authentication
 */
const authenticate = (req, res, next) => {
    try {
        // Check for session first (session-based auth)
        if (req.session && req.session.userId) {
            req.user = {
                id: req.session.userId,
                role: req.session.userRole,
                username: req.session.username,
                sessionId: req.sessionID
            };
            return next();
        }

        // Fallback to JWT token (stateless auth)
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: 'No authentication provided' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role,
            username: decoded.username
        };
        next();
    } catch (error) {
        logger.warn('Authentication failed:', error.message);
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Authorize user based on roles
 */
const authorize = (roles = []) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
        }

        next();
    };
};

/**
 * Require active session (for session-based operations only)
 */
const requireSession = (req, res, next) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ error: 'Active session required' });
    }
    next();
};

/**
 * Optional authentication - doesn't fail if no auth present
 */
const optionalAuth = (req, res, next) => {
    try {
        if (req.session && req.session.userId) {
            req.user = {
                id: req.session.userId,
                role: req.session.userRole,
                username: req.session.username
            };
        } else {
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = {
                    id: decoded.id,
                    role: decoded.role,
                    username: decoded.username
                };
            }
        }
    } catch (error) {
        logger.debug('Optional auth failed (non-blocking):', error.message);
    }
    next();
};

module.exports = { authenticate, authorize, requireSession, optionalAuth };
