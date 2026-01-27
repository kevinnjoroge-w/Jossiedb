const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supplier = sequelize.define('Supplier', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    contact_person: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        validate: { isEmail: true }
    },
    phone: {
        type: DataTypes.STRING
    },
    rating: {
        type: DataTypes.INTEGER,
        validate: { min: 1, max: 5 }
    }
});

module.exports = Supplier;
