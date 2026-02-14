const { Server } = require('socket.io');
const logger = require('./logger');

let io;

const init = (server) => {
    io = new Server(server, {
        cors: {
            origin: '*', // Adjust this in production
            methods: ['GET', 'POST']
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
