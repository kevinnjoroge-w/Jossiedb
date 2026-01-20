const Joi = require('joi');
const Item = require('../models/Item');
const Category = require('../models/Category');
const Supplier = require('../models/Supplier');
const Location = require('../models/Location');

const itemSchema = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  category_id: Joi.number().integer().required(),
  supplier_id: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(0).required(),
  location_id: Joi.number().integer().required(),
});

const getItems = async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [
        { model: Category, as: 'category' },
        { model: Supplier, as: 'supplier' },
        { model: Location, as: 'location' },
      ],
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createItem = async (req, res) => {
  try {
    const { error } = itemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const item = await Item.create(req.body);
    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateItemLocation = async (req, res) => {
  try {
    const { location_id } = req.body;
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.location_id = location_id;
    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateItemQuantity = async (req, res) => {
  try {
    const { quantity } = req.body;
    const item = await Item.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    item.quantity = quantity;
    await item.save();
    res.json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getItems,
  createItem,
  updateItemLocation,
  updateItemQuantity,
};