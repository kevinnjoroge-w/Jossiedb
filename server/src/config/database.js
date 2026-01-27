const { Sequelize } = require('sequelize');
const path = require('path');
const logger = require('../utils/logger');

const env = process.env.NODE_ENV || 'development';

let sequelize;

if (process.env.DATABASE_URL) {
    // Production PostgreSQL connection
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'postgres',
        protocol: 'postgres',
        logging: (msg) => logger.debug(msg),
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });
} else {
    // Development SQLite connection
    sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: path.join(__dirname, '../../jossiedb.sqlite'),
        logging: (msg) => logger.debug(msg),
    });
}

const testConnection = async () => {
    try {
        await sequelize.authenticate();
        logger.info('Database connection has been established successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
    }
};

testConnection();

module.exports = sequelize;
