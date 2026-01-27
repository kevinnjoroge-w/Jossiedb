const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AuditLog = sequelize.define('AuditLog', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    action: {
        type: DataTypes.STRING, // CREATE, UPDATE, DELETE, LOGIN, CHECKOUT
        allowNull: false
    },
    entity_type: {
        type: DataTypes.STRING, // Item, User, Project
        allowNull: false
    },
    entity_id: {
        type: DataTypes.UUID,
        allowNull: false
    },
    user_id: {
        type: DataTypes.UUID
    },
    details: {
        type: DataTypes.JSON // Flexible storage for change diffs
    },
    ip_address: {
        type: DataTypes.STRING
    }
});

module.exports = AuditLog;
