const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const login = async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.json({ token, user: { id: user.id, username: user.username, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  res.json({ user: { id: req.user.id, username: req.user.username, role: req.user.role } });
};

module.exports = {
  login,
  getProfile,
};