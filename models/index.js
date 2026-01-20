const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'inventory.db'),
  logging: false, // Set to console.log for debugging
});

module.exports = sequelize;