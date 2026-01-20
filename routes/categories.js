const express = require('express');
const { getCategories } = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', authenticateToken, getCategories);

module.exports = router;