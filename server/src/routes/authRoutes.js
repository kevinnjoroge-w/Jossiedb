const express = require('express');
const router = express.Router();
const AuthService = require('../services/AuthService');
const Joi = require('joi');

const registerSchema = Joi.object({
    username: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    full_name: Joi.string().required(),
    role: Joi.string().valid('admin', 'supervisor', 'foreman', 'worker', 'personnel')
});

router.post('/register', async (req, res, next) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ error: error.details[0].message });

        const result = await AuthService.register(req.body);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

        const result = await AuthService.login(username, password);
        res.json(result);
    } catch (err) {
        res.status(401).json({ error: err.message });
    }
});

const { authenticate } = require('../middlewares/authMiddleware');
router.get('/profile', authenticate, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
