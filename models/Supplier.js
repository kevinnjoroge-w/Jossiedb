const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Supplier = sequelize.define('Supplier', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  contact: {
    type: DataTypes.STRING,
    allowNull: true,
  },
}, {
  tableName: 'suppliers',
  timestamps: false,
});

module.exports = Supplier;