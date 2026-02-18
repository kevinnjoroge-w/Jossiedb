const mongoose = require('../config/database');
const User = require('./User');
const Item = require('./Item');
const Category = require('./Category');
const Location = require('./Location');
const Supplier = require('./Supplier');
const Project = require('./Project');
const CheckOut = require('./CheckOut');
const Maintenance = require('./Maintenance');
const AuditLog = require('./AuditLog');
const LocationHistory = require('./LocationHistory');
const TransferRequest = require('./TransferRequest');
const UserLocations = require('./UserLocations');
const Notification = require('./Notification');
const SessionLog = require('./SessionLog');
const Webhook = require('./Webhook');
const WebhookEvent = require('./WebhookEvent');

module.exports = {
    mongoose,
    User,
    Item,
    Category,
    Location,
    Supplier,
    Project,
    CheckOut,
    Maintenance,
    AuditLog,
    LocationHistory,
    TransferRequest,
    UserLocations,
    Notification,
    SessionLog,
    Webhook,
    WebhookEvent
};
