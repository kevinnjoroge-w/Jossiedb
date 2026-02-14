const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const logger = require('./utils/logger');
require('dotenv').config();

// Initialize app
const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date() });
});

// API Routes
const apiRoutes = require('./routes');
app.use('/api/v1', apiRoutes);

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
    const server = app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
    });

    // Graceful shutdown
    const shutdown = () => {
        logger.info('Shutting down server...');
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
