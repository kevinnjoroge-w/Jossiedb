const express = require('express');
const { getLocations, createLocation } = require('../controllers/locationController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getLocations);
router.post('/', authenticateToken, requireAdmin, createLocation);

module.exports = router;