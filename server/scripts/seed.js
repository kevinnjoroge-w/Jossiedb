const { sequelize, User, Category, Location, Supplier, Item, Project } = require('../src/models');
const logger = require('../src/utils/logger');

const seedUsers = async () => {
    const users = [
        { username: 'admin', password: 'adminpass', full_name: 'System Admin', role: 'admin', email: 'admin@jossiedb.com' },
        { username: 'supervisor1', password: 'supervisorpass', full_name: 'Site Supervisor', role: 'supervisor', email: 'supervisor@jossiedb.com' },
        { username: 'foreman1', password: 'foremanpass', full_name: 'Field Foreman', role: 'foreman', email: 'foreman@jossiedb.com' },
        { username: 'worker1', password: 'workerpass', full_name: 'Construction Worker', role: 'worker', email: 'worker@jossiedb.com' },
    ];

    for (const userData of users) {
        // Check if user exists
        const exists = await User.findOne({ where: { username: userData.username } });
        if (!exists) {
            await User.create(userData);
            logger.info(`Created user: ${userData.username}`);
        } else {
            logger.info(`User already exists: ${userData.username}`);
        }
    }
};

const seedInventory = async () => {
    // Categories
    const categories = await Promise.all([
        Category.create({ name: 'Power Tools', description: 'Electric and battery operated tools' }),
        Category.create({ name: 'Safety Gear', description: 'PPE and safety equipment' }),
        Category.create({ name: 'Heavy Machinery', description: 'Excavators, bulldozers, etc.' }),
    ]);

    // Locations
    const locations = await Promise.all([
        Location.create({ name: 'Main Warehouse', type: 'warehouse', address: '123 Industrial Park' }),
        Location.create({ name: 'Downtown Site', type: 'site', address: '456 Main St' }),
        Location.create({ name: 'Service Van 1', type: 'vehicle' }),
    ]);

    // Suppliers
    const suppliers = await Promise.all([
        Supplier.create({ name: 'BuildHard Inc.', rating: 5, email: 'sales@buildhard.com' }),
        Supplier.create({ name: 'Safety First Supplies', rating: 4, email: 'contact@safetyfirst.com' }),
    ]);

    // Items
    await Item.create({
        name: 'Dewalt Cordless Drill',
        sku: 'DT-DRILL-001',
        description: '20V Max XR Brushless Drill',
        quantity: 15,
        min_quantity: 5,
        unit_cost: 199.99,
        category_id: categories[0].id,
        location_id: locations[0].id,
        supplier_id: suppliers[0].id,
        attributes: { voltage: '20V', brand: 'Dewalt' }
    });

    await Item.create({
        name: 'Hard Hat (Yellow)',
        sku: 'PPE-HAT-Y',
        description: 'Standard ANSI certified hard hat',
        quantity: 50,
        min_quantity: 10,
        unit_cost: 25.00,
        category_id: categories[1].id,
        location_id: locations[0].id,
        supplier_id: suppliers[1].id,
        attributes: { color: 'Yellow', size: 'Universal' }
    });

    await Item.create({
        name: 'Caterpillar Excavator',
        sku: 'CAT-EX-320',
        description: 'Medium hydraulic excavator',
        quantity: 2,
        min_quantity: 1,
        unit_cost: 250000.00,
        category_id: categories[2].id,
        location_id: locations[1].id,
        supplier_id: suppliers[0].id,
        condition: 'good',
        attributes: { model: '320', fuel: 'Diesel' }
    });
};

const seedProjects = async () => {
    await Project.create({
        name: 'Skyline Tower',
        description: '50-story residential complex',
        status: 'active',
        location: 'Downtown',
        start_date: new Date(),
        budget: 5000000.00
    });

    await Project.create({
        name: 'Highway Expansion',
        description: 'Lane addition to I-95',
        status: 'planning',
        budget: 12000000.00
    });
};

const seed = async () => {
    try {
        await sequelize.sync({ alter: true }); // Ensure tables exist
        await seedUsers();

        // Check if items exist to avoid duplicate seeding (simple check)
        const itemCount = await Item.count();
        if (itemCount === 0) {
            await seedInventory();
            await seedProjects();
            logger.info('Inventory and projects seeded.');
        } else {
            logger.info('Inventory data already seeded.');
        }

        logger.info('Seeding completed successfully.');
        process.exit(0);
    } catch (error) {
        logger.error('Seeding failed:', error);
        process.exit(1);
    }
};

seed();
