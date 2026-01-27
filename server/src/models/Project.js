const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Project = sequelize.define('Project', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    start_date: {
        type: DataTypes.DATEONLY
    },
    end_date: {
        type: DataTypes.DATEONLY
    },
    status: {
        type: DataTypes.ENUM('planning', 'active', 'completed', 'on_hold', 'cancelled'),
        defaultValue: 'planning'
    },
    budget: {
        type: DataTypes.DECIMAL(12, 2)
    },
    location: {
        type: DataTypes.STRING
    }
});

module.exports = Project;
