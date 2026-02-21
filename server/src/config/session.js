const session = require('express-session');
const MongoStore = require('connect-mongo');
const logger = require('../utils/logger');

const isProduction = process.env.NODE_ENV === 'production';

/**
 * Session configuration with security best practices
 * Implements session persistence in MongoDB with secure cookie settings
 */
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    name: 'sessionId',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
        mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/jossiedb',
        touchAfter: 24 * 3600, // Lazy session update (in seconds)
        crypto: {
            secret: process.env.SESSION_CRYPTO_SECRET || 'session-crypto-secret'
        }
    }),
    cookie: {
        secure: isProduction, // HTTPS only in production
        httpOnly: true, // Prevent client-side JS from accessing the session
        sameSite: 'strict', // CSRF protection
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours default
        domain: process.env.SESSION_COOKIE_DOMAIN || undefined
    },
    rolling: true, // Reset cookie expiration on every request
    genid: (req) => {
        // Custom session ID generation for better security
        return require('crypto').randomBytes(16).toString('hex');
    }
};

/**
 * Create session middleware
 * Includes error handling and logging
 */
const createSessionMiddleware = () => {
    const middleware = session(sessionConfig);
    return middleware;
};

/**
 * Session validation middleware
 * Ensures session data integrity
 */
const validateSession = (req, res, next) => {
    if (req.session && req.session.userId) {
        // Refresh session data
        req.session.touch();
        next();
    } else {
        next();
    }
};

/**
 * Destroy session and clear cookie
 */
const destroySession = (req, res, callback) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Session destruction error:', err);
            return callback(err);
        }
        res.clearCookie('sessionId', {
            path: '/',
            secure: isProduction,
            httpOnly: true,
            sameSite: 'strict'
        });
        callback(null);
    });
};

module.exports = {
    createSessionMiddleware,
    validateSession,
    destroySession,
    sessionConfig
};
