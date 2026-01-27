const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Location = sequelize.define('Location', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    type: {
        type: DataTypes.ENUM('warehouse', 'site', 'office', 'vehicle'),
        defaultValue: 'warehouse'
    },
    address: {
        type: DataTypes.STRING
    },
    capacity: {
        type: DataTypes.INTEGER
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

module.exports = Location;
