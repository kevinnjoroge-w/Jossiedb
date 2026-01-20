require('dotenv').config();
const bcrypt = require('bcrypt');
const sequelize = require('../models');
const User = require('../models/User');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Location = require('../models/Location');
const Item = require('../models/Item');

async function initializeDatabase() {
  try {
    // Sync database
    await sequelize.sync({ force: true });
    console.log('Database synced');

    // Create categories
    const tools = await Category.create({ name: 'Tools' });
    const office = await Category.create({ name: 'Office Equipment' });

    // Create suppliers
    const supplier1 = await Supplier.create({ name: 'Construction Supplies Inc.', contact: 'contact@constsup.com' });
    const supplier2 = await Supplier.create({ name: 'Office Depot', contact: 'info@officedepot.com' });

    // Create locations
    const warehouseA = await Location.create({ name: 'Warehouse A' });
    const officeRoom = await Location.create({ name: 'Office Supply Room' });
    const site1 = await Location.create({ name: 'Site 1' });
    const site2 = await Location.create({ name: 'Site 2' });

    // Create users
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('adminpass', saltRounds);
    const personnelPassword = await bcrypt.hash('personnelpass', saltRounds);

    await User.create({ username: 'admin', password: adminPassword, role: 'admin' });
    await User.create({ username: 'personnel1', password: personnelPassword, role: 'personnel' });

    // Create items
    await Item.create({
      name: 'Hammer',
      description: 'Standard claw hammer',
      category_id: tools.id,
      supplier_id: supplier1.id,
      quantity: 50,
      location_id: warehouseA.id
    });

    await Item.create({
      name: 'Wheelbarrow',
      description: 'Heavy duty wheelbarrow',
      category_id: tools.id,
      supplier_id: supplier1.id,
      quantity: 20,
      location_id: warehouseA.id
    });

    await Item.create({
      name: 'Stapler',
      description: 'Heavy duty stapler',
      category_id: office.id,
      supplier_id: supplier2.id,
      quantity: 10,
      location_id: officeRoom.id
    });

    console.log('Database initialized with sample data');
  } catch (error) {
    console.error('Error initializing database:', error);
  } finally {
    await sequelize.close();
  }
}

initializeDatabase();