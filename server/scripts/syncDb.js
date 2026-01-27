const { sequelize } = require('../src/models');
const logger = require('../src/utils/logger');

const syncDatabase = async () => {
    try {
        // force: true drops tables if they exist (good for dev, bad for prod)
        // alter: true updates tables to match models (safer)
        await sequelize.sync({ alter: true });
        logger.info('Database synchronized successfully.');
        process.exit(0);
    } catch (error) {
        logger.error('Error synchronizing database:', error);
        process.exit(1);
    }
};

syncDatabase();
