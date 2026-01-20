const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Category = require('./Category');
const Supplier = require('./Supplier');
const Location = require('./Location');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Category,
      key: 'id',
    },
  },
  supplier_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Supplier,
      key: 'id',
    },
  },
  location_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Location,
      key: 'id',
    },
  },
}, {
  tableName: 'items',
  timestamps: false,
});

// Associations
Item.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });
Item.belongsTo(Supplier, { foreignKey: 'supplier_id', as: 'supplier' });
Item.belongsTo(Location, { foreignKey: 'location_id', as: 'location' });

module.exports = Item;