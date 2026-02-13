const sqlite3 = require('sqlite3').verbose();
const mongoose = require('mongoose');
const {
    User, Item, Category, Location, Supplier,
    Project, CheckOut, Maintenance, AuditLog,
    LocationHistory, TransferRequest, UserLocations
} = require('../models');
const logger = require('../utils/logger');
require('dotenv').config();

const SQLITE_DB_PATH = 'jossiedb.sqlite';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/jossiedb';

const idMap = new Map(); // Maps SQLite UUID to Mongoose ObjectId

async function migrate() {
    try {
        await mongoose.connect(MONGODB_URI);
        logger.info('Connected to MongoDB');

        // Drop database for a clean start (resets indexes)
        await mongoose.connection.dropDatabase();
        logger.info('Dropped existing database for clean migration');

        const db = new sqlite3.Database(SQLITE_DB_PATH);

        const getRows = (query) => new Promise((resolve, reject) => {
            db.all(query, [], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        // 1. Categories
        logger.info('Migrating Categories...');
        const categories = await getRows('SELECT * FROM Categories');
        for (const cat of categories) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(cat.id, newId);
            await Category.create({
                _id: newId,
                name: cat.name,
                description: cat.description,
                parent_id: idMap.get(cat.parent_id) || null
            });
        }

        // 2. Locations
        logger.info('Migrating Locations...');
        const locations = await getRows('SELECT * FROM Locations');
        for (const loc of locations) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(loc.id, newId);
            await Location.create({
                _id: newId,
                name: loc.name,
                type: loc.type,
                address: loc.address,
                capacity: loc.capacity,
                is_active: loc.is_active === 1
            });
        }

        // 3. Suppliers
        logger.info('Migrating Suppliers...');
        const suppliers = await getRows('SELECT * FROM Suppliers');
        for (const sup of suppliers) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(sup.id, newId);
            await Supplier.create({
                _id: newId,
                name: sup.name,
                contact_person: sup.contact_person,
                email: sup.email,
                phone: sup.phone,
                address: sup.address,
                rating: sup.rating
            });
        }

        // 4. Users
        logger.info('Migrating Users...');
        const users = await getRows('SELECT * FROM Users');
        for (const user of users) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(user.id, newId);
            await User.create({
                _id: newId,
                username: user.username,
                email: user.email,
                password: user.password, // Keep hashed password
                role: user.role,
                full_name: user.full_name,
                status: user.status,
                last_login: user.last_login ? new Date(user.last_login) : null
            });
        }

        // 5. UserLocations (Join table)
        logger.info('Migrating UserLocations...');
        const userLocs = await getRows('SELECT * FROM UserLocations');
        for (const ul of userLocs) {
            await UserLocations.create({
                user_id: idMap.get(ul.user_id),
                location_id: idMap.get(ul.location_id)
            });
        }

        // 6. Projects
        logger.info('Migrating Projects...');
        const projects = await getRows('SELECT * FROM Projects');
        for (const proj of projects) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(proj.id, newId);
            await Project.create({
                _id: newId,
                name: proj.name,
                description: proj.description,
                start_date: proj.start_date ? new Date(proj.start_date) : null,
                end_date: proj.end_date ? new Date(proj.end_date) : null,
                status: proj.status,
                budget: proj.budget,
                location_id: idMap.get(proj.location_id) || null
            });
        }

        // 7. Items
        logger.info('Migrating Items...');
        const items = await getRows('SELECT * FROM Items');
        for (const item of items) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(item.id, newId);
            const itemData = {
                _id: newId,
                name: item.name,
                description: item.description,
                category_id: idMap.get(item.category_id),
                location_id: idMap.get(item.location_id),
                supplier_id: idMap.get(item.supplier_id),
                quantity: item.quantity,
                min_quantity: item.min_quantity,
                unit_cost: item.unit_cost,
                condition: item.condition,
                status: item.status,
                purchase_date: item.purchase_date ? new Date(item.purchase_date) : null,
                attributes: JSON.parse(item.attributes || '{}')
            };

            if (item.sku) itemData.sku = item.sku;
            if (item.serial_number) itemData.serial_number = item.serial_number;

            await Item.create(itemData);
        }

        // 8. CheckOuts
        logger.info('Migrating CheckOuts...');
        const checkouts = await getRows('SELECT * FROM CheckOuts');
        for (const co of checkouts) {
            const newId = new mongoose.Types.ObjectId();
            idMap.set(co.id, newId);
            await CheckOut.create({
                _id: newId,
                item_id: idMap.get(co.item_id),
                user_id: idMap.get(co.user_id),
                project_id: idMap.get(co.project_id),
                quantity: co.quantity,
                checkout_date: co.checkout_date ? new Date(co.checkout_date) : null,
                due_date: co.due_date ? new Date(co.due_date) : null,
                actual_return_date: co.actual_return_date ? new Date(co.actual_return_date) : null,
                status: co.status,
                notes: co.notes,
                approved_by: idMap.get(co.approved_by),
                destination_location_id: idMap.get(co.destination_location_id),
                location_note: co.location_note
            });
        }

        // 9. Maintenances
        logger.info('Migrating Maintenances...');
        const maints = await getRows('SELECT * FROM Maintenances');
        for (const m of maints) {
            await Maintenance.create({
                item_id: idMap.get(m.item_id),
                technician_id: idMap.get(m.technician_id),
                type: m.type,
                description: m.description,
                status: m.status,
                scheduled_date: m.scheduled_date ? new Date(m.scheduled_date) : null,
                completed_date: m.completed_date ? new Date(m.completed_date) : null,
                cost: m.cost,
                notes: m.notes
            });
        }

        // 10. AuditLogs
        logger.info('Migrating AuditLogs...');
        const logs = await getRows('SELECT * FROM AuditLogs');
        for (const log of logs) {
            await AuditLog.create({
                action: log.action,
                entity_type: log.entity_type,
                entity_id: idMap.get(log.entity_id) || log.entity_id,
                user_id: idMap.get(log.user_id),
                details: JSON.parse(log.details || '{}'),
                ip_address: log.ip_address
            });
        }

        // 11. LocationHistories
        logger.info('Migrating LocationHistories...');
        const history = await getRows('SELECT * FROM LocationHistories');
        for (const h of history) {
            await LocationHistory.create({
                item_id: idMap.get(h.item_id),
                from_location_id: idMap.get(h.from_location_id),
                to_location_id: idMap.get(h.to_location_id),
                changed_by: idMap.get(h.changed_by),
                change_type: h.change_type,
                notes: h.notes,
                changed_at: h.changed_at ? new Date(h.changed_at) : null
            });
        }

        // 12. TransferRequests
        logger.info('Migrating TransferRequests...');
        const transfers = await getRows('SELECT * FROM TransferRequests');
        for (const t of transfers) {
            await TransferRequest.create({
                item_id: idMap.get(t.item_id),
                from_location_id: idMap.get(t.from_location_id),
                to_location_id: idMap.get(t.to_location_id),
                quantity: t.quantity,
                status: t.status,
                requested_by: idMap.get(t.requested_by),
                approved_by: idMap.get(t.approved_by),
                reason: t.reason,
                notes: t.notes,
                estimated_arrival: t.estimated_arrival ? new Date(t.estimated_arrival) : null,
                actual_arrival: t.actual_arrival ? new Date(t.actual_arrival) : null
            });
        }

        logger.info('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        logger.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
