const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Location = sequelize.define('Location', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
}, {
  tableName: 'locations',
  timestamps: false,
});

module.exports = Location;