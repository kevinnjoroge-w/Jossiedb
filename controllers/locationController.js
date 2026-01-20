const Joi = require('joi');
const Location = require('../models/Location');

const locationSchema = Joi.object({
  name: Joi.string().required(),
});

const getLocations = async (req, res) => {
  try {
    const locations = await Location.findAll();
    res.json(locations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createLocation = async (req, res) => {
  try {
    const { error } = locationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const location = await Location.create(req.body);
    res.status(201).json(location);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getLocations,
  createLocation,
};