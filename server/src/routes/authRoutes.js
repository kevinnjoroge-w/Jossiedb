const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const Joi = require('joi');
const { authenticate, requireSession } = require('../middlewares/authMiddleware');
const { authLimiter } = require('../middlewares/rateLimitMiddleware');
const { User } = require('../models');
const logger = require('../utils/logger');

const registerSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().required(),
    role: Joi.string().valid('admin', 'supervisor', 'foreman', 'worker', 'personnel')
});

const loginSchema = Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required()
});

/**
 * Register new user
 */
router.post('/register', authLimiter.middleware(), async (req, res, next) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const result = await AuthService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        if (err.message === 'Username already taken') {
            return res.status(409).json({ error: err.message });
        }
        next(err);
    }
});

/**
 * Login with session creation
 * POST /auth/login
 * Body: { username, password }
 * Returns: { user, token, sessionId }
 */
router.post('/login', authLimiter.middleware(), async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const { username, password } = req.body;

        // Login with session support
        const result = await AuthService.login(username, password, req);

        res.json({
            ...result,
            sessionId: req.sessionID,
            message: 'Login successful'
        });
    } catch (err) {
        if (err.message === 'Invalid credentials') {
            res.status(401).json({ error: err.message });
        } else {
            next(err);
        }
    }
});

/**
 * Logout - destroy session and invalidate token
 * POST /auth/logout
 */
router.post('/logout', requireSession, async (req, res, next) => {
    try {
        await AuthService.logout(req);
        res.json({ message: 'Logout successful' });
    } catch (err) {
        logger.error('Logout error:', err);
        next(err);
    }
});

/**
 * Get current user profile
 * GET /auth/profile
 */
router.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        res.status(500).json({ error: 'Error fetching profile' });
    }
});

/**
 * Verify session is valid
 * GET /auth/verify-session
 */
router.get('/verify-session', (req, res) => {
    try {
        if (req.session && req.session.userId) {
            return res.json({
                valid: true,
                userId: req.session.userId,
                username: req.session.username,
                sessionId: req.sessionID
            });
        }
        res.status(401).json({ valid: false, error: 'Invalid or expired session' });
    } catch (err) {
        res.status(500).json({ error: 'Session verification failed' });
    }
});

/**
 * Get active sessions for current user
 * GET /auth/sessions
 */
router.get('/sessions', authenticate, async (req, res, next) => {
    try {
        const sessions = await AuthService.getActiveSessions(req.user.id);
        res.json({
            activeSessions: sessions,
            currentSessionId: req.sessionID
        });
    } catch (err) {
        logger.error('Error fetching sessions:', err);
        next(err);
    }
});

/**
 * Revoke specific session (logout from specific device)
 * DELETE /auth/sessions/:sessionId
 */
router.delete('/sessions/:sessionId', authenticate, async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        // Prevent users from revoking other users' sessions
        await AuthService.revokeSession(sessionId, req.user.id);

        res.json({ message: 'Session revoked successfully' });
    } catch (err) {
        logger.error('Error revoking session:', err);
        next(err);
    }
});

/**
 * Logout from all devices
 * POST /auth/logout-all
 */
router.post('/logout-all', authenticate, async (req, res, next) => {
    try {
        // Get current session ID
        const currentSessionId = req.sessionID;

        // Revoke all sessions
        await AuthService.logoutAllDevices(req.user.id);

        // Destroy current session
        await AuthService.logout(req);

        res.json({ message: 'Logged out from all devices' });
    } catch (err) {
        logger.error('Error logging out from all devices:', err);
        next(err);
    }
});

/**
 * Get session statistics
 * GET /auth/session-stats
 */
router.get('/session-stats', authenticate, async (req, res, next) => {
    try {
        const stats = await AuthService.getSessionStats(req.user.id);
        res.json(stats);
    } catch (err) {
        logger.error('Error fetching session stats:', err);
        next(err);
    }
});

/**
 * Refresh Auth Token
 * POST /auth/refresh
 * Body: { refreshToken }
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

        const result = await AuthService.refreshAuthToken(refreshToken);
        res.json(result);
    } catch (err) {
        logger.error('Failed to refresh token:', err.message);
        res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

module.exports = router;
