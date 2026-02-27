const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
const socketUtil = require('./utils/socket');
const cache = require('./utils/cache');
const { createSessionMiddleware, validateSession } = require('./config/session');
const { sessionActivityLogger, initializeSessionCleanup } = require('./utils/sessionManager');
const { apiLimiter } = require('./middlewares/rateLimitMiddleware');
const { startMaintenanceCron } = require('./cron/maintenanceCron');
require('dotenv').config();

// Initialize app
const app = express();

// Middleware
app.use(helmet()); // Security headers
const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : 'http://localhost:3000';

app.use(cors({
    origin: allowedOrigins,
    credentials: true // Allow credentials (cookies)
})); // CORS support with credentials
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Session Middleware - must come after security middleware and before routes
app.use(createSessionMiddleware());
app.use(validateSession);
app.use(sessionActivityLogger); // Track session activity

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'ok',
        timestamp: new Date(),
        cacheConnected: cache.isConnected()
    });
});

// API Routes
const apiRoutes = require('./routes');
// Apply general rate limit to all /api/v1 routes
app.use('/api/v1', apiLimiter.middleware(), apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('SERVER ERROR:', err);
    logger.error(err.stack);
    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

const { mongoose } = require('./models');

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // In production, you might want to restart the process
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    // Mandatory cleanup and exit
    process.exit(1);
});

// Start server
const PORT = process.env.PORT || 3002;
if (require.main === module) {
    // Validate critical environment variables
    const validateEnvVars = () => {
        const SESSION_SECRET = process.env.SESSION_SECRET;
        const SESSION_CRYPTO_SECRET = process.env.SESSION_CRYPTO_SECRET;
        const JWT_SECRET = process.env.JWT_SECRET;

        if (!SESSION_SECRET || SESSION_SECRET === 'your-session-secret-change-in-production') {
            logger.error('CRITICAL: SESSION_SECRET not set or using default value');
            process.exit(1);
        }

        if (!SESSION_CRYPTO_SECRET || SESSION_CRYPTO_SECRET === 'session-crypto-secret') {
            logger.error('CRITICAL: SESSION_CRYPTO_SECRET not set or using default value');
            process.exit(1);
        }

        if (!JWT_SECRET || JWT_SECRET === 'your-secret-key-change-in-production') {
            logger.error('CRITICAL: JWT_SECRET not set or using default value');
            process.exit(1);
        }

        if (SESSION_SECRET === SESSION_CRYPTO_SECRET) {
            logger.error('CRITICAL: SESSION_SECRET and SESSION_CRYPTO_SECRET must be different');
            process.exit(1);
        }

        logger.info('All security secrets validated');
    };

    validateEnvVars();

    const server = app.listen(PORT, async () => {
        logger.info(`Server running on port ${PORT}`);

        // Initialize cache (Redis)
        try {
            await cache.initializeRedis();
        } catch (err) {
            logger.warn('Cache initialization failed, continuing without cache:', err.message);
        }

        // Initialize session cleanup scheduler
        initializeSessionCleanup();

        // Initialize recurring maintenance cron jobs
        startMaintenanceCron();
    });

    // Initialize Socket.io
    socketUtil.init(server);

    // Graceful shutdown
    const shutdown = async () => {
        logger.info('Shutting down server...');

        // Close cache connection
        await cache.close();

        server.close(() => {
            logger.info('Server closed');
            mongoose.connection.close(false, () => {
                logger.info('MongoDB connection closed');
                process.exit(0);
            });
        });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

module.exports = app;
