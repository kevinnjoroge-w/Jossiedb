const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Item = sequelize.define('Item', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    sku: {
        type: DataTypes.STRING,
        unique: true
    },
    serial_number: {
        type: DataTypes.STRING,
        unique: true
    },
    description: {
        type: DataTypes.TEXT
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    min_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    unit_cost: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0.00
    },
    condition: {
        type: DataTypes.ENUM('new', 'excellent', 'good', 'fair', 'poor', 'damaged'),
        defaultValue: 'new'
    },
    status: {
        type: DataTypes.ENUM('available', 'checked_out', 'maintenance', 'retired', 'lost'),
        defaultValue: 'available'
    },
    purchase_date: {
        type: DataTypes.DATEONLY
    },
    // Scalable JSONB field for dynamic attributes (specs, warranty info, etc.)
    attributes: {
        type: DataTypes.JSON, // Use JSONB in Postgres, JSON in SQLite
        defaultValue: {}
    }
});

module.exports = Item;
