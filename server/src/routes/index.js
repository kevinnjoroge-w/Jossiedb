const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const transactionRoutes = require('./transactionRoutes');
const projectRoutes = require('./projectRoutes');

router.use('/auth', authRoutes);
router.use('/auth', authRoutes);
router.use('/items', inventoryRoutes);
router.use('/checkouts', transactionRoutes);
router.use('/projects', projectRoutes);
router.use('/analytics', require('./analyticsRoutes'));
router.use('/maintenance', require('./maintenanceRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/audit', require('./auditRoutes'));
router.use('/locations', require('./locationRoutes'));

module.exports = router;
