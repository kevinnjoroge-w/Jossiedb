const { Server } = require('socket.io');
const logger = require('./logger');

let io;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: process.env.CORS_ORIGIN || 'http://localhost:3000', // Secure CORS origin
            methods: ['GET', 'POST'],
            credentials: true
        }
    });

    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

const emit = (event, data) => {
    if (io) {
        io.emit(event, data);
    }
};

module.exports = {
    init,
    getIO,
    emit
};
