const express = require('express');
const router = express.Router();
const { Location } = require('../models');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

// Get all locations
router.get('/', async (req, res, next) => {
    try {
        const locations = await Location.findAll({
            order: [['name', 'ASC']]
        });
        res.json(locations);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
