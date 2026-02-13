const mongoose = require('mongoose');
const logger = require('../utils/logger');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jossiedb';

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(MONGODB_URI);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

connectDB();

module.exports = mongoose;
