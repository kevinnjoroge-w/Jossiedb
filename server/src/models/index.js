const sequelize = require('../config/database');
const User = require('./User');
const Item = require('./Item');
const Category = require('./Category');
const Location = require('./Location');
const Supplier = require('./Supplier');
const Project = require('./Project');
const CheckOut = require('./CheckOut');
const Maintenance = require('./Maintenance');
const AuditLog = require('./AuditLog');

// Category Associations (Self-referential)
Category.hasMany(Category, { as: 'subcategories', foreignKey: 'parent_id' });
Category.belongsTo(Category, { as: 'parent', foreignKey: 'parent_id' });

// Item Associations
Category.hasMany(Item, { foreignKey: 'category_id' });
Item.belongsTo(Category, { foreignKey: 'category_id' });

Location.hasMany(Item, { foreignKey: 'location_id' });
Item.belongsTo(Location, { foreignKey: 'location_id' });

Supplier.hasMany(Item, { foreignKey: 'supplier_id' });
Item.belongsTo(Supplier, { foreignKey: 'supplier_id' });

// Transaction Associations (CheckOut)
User.hasMany(CheckOut, { as: 'borrowals', foreignKey: 'user_id' });
CheckOut.belongsTo(User, { as: 'borrower', foreignKey: 'user_id' });

User.hasMany(CheckOut, { as: 'approvals', foreignKey: 'approved_by' });
CheckOut.belongsTo(User, { as: 'approver', foreignKey: 'approved_by' });

Item.hasMany(CheckOut, { foreignKey: 'item_id' });
CheckOut.belongsTo(Item, { foreignKey: 'item_id' });

Project.hasMany(CheckOut, { foreignKey: 'project_id' });
CheckOut.belongsTo(Project, { foreignKey: 'project_id' });

// Maintenance Associations
Item.hasMany(Maintenance, { foreignKey: 'item_id' });
Maintenance.belongsTo(Item, { foreignKey: 'item_id' });

User.hasMany(Maintenance, { as: 'assigned_maintenance', foreignKey: 'technician_id' });
Maintenance.belongsTo(User, { as: 'technician', foreignKey: 'technician_id' });

AuditLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });

// Export all models
module.exports = {
    sequelize,
    User,
    Item,
    Category,
    Location,
    Supplier,
    Project,
    CheckOut,
    Maintenance,
    AuditLog
};
