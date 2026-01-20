const express = require('express');
const { getItems, createItem, updateItemLocation, updateItemQuantity } = require('../controllers/itemController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getItems);
router.post('/', authenticateToken, requireAdmin, createItem);
router.put('/:id/location', authenticateToken, updateItemLocation);
router.put('/:id/quantity', authenticateToken, requireAdmin, updateItemQuantity);

module.exports = router;