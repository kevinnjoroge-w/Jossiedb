const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CheckOut = sequelize.define('CheckOut', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 1
    },
    checkout_date: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    expected_return_date: {
        type: DataTypes.DATE
    },
    actual_return_date: {
        type: DataTypes.DATE
    },
    status: {
        type: DataTypes.ENUM('active', 'returned', 'overdue', 'lost'),
        defaultValue: 'active'
    },
    notes: {
        type: DataTypes.TEXT
    }
});

module.exports = CheckOut;
