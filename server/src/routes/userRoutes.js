const express = require('express');
const router = express.Router();
const UserService = require('../services/UserService');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.use(authenticate);
router.use(authorize(['admin'])); // Only admins can access these routes

router.get('/', async (req, res, next) => {
    try {
        const users = await UserService.getAllUsers();
        res.json(users);
    } catch (err) {
        next(err);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const user = await UserService.createUser(req.body);
        res.status(201).json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.put('/:id', async (req, res, next) => {
    try {
        const user = await UserService.updateUser(req.params.id, req.body);
        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        await UserService.deleteUser(req.params.id);
        res.status(204).send();
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;
