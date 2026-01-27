const express = require('express');
const router = express.Router();
const AuditService = require('../services/AuditService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize(['admin'])); // Only admins can view audit logs

router.get('/', async (req, res, next) => {
    try {
        const logs = await AuditService.getLogs(req.query);
        res.json(logs);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
