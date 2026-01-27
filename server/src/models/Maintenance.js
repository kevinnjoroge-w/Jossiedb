const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Maintenance = sequelize.define('Maintenance', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    type: {
        type: DataTypes.ENUM('preventive', 'corrective', 'inspection'),
        defaultValue: 'preventive'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('scheduled', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'scheduled'
    },
    scheduled_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    completed_date: {
        type: DataTypes.DATE
    },
    cost: {
        type: DataTypes.DECIMAL(10, 2)
    },
    technician_notes: {
        type: DataTypes.TEXT
    }
});

module.exports = Maintenance;
