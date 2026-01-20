const express = require('express');
const { getSuppliers } = require('../controllers/supplierController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getSuppliers);

module.exports = router;