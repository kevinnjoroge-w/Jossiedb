const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    sku: {
        type: String,
        unique: true,
        sparse: true // Allow multiple nulls/missing SKUs if needed, though they should be unique if present
    },
    serial_number: {
        type: String,
        unique: true,
        sparse: true
    },
    description: {
        type: String
    },
    quantity: {
        type: Number,
        default: 0
    },
    reserved_quantity: {
        type: Number,
        default: 0,
        min: 0
    },
    min_quantity: {
        type: Number,
        default: 5
    },
    condition: {
        type: String,
        enum: ['new', 'excellent', 'good', 'fair', 'poor', 'damaged'],
        default: 'new'
    },
    status: {
        type: String,
        enum: ['available', 'checked_out', 'maintenance', 'retired', 'lost'],
        default: 'available'
    },
    purchase_date: {
        type: Date
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    },
    location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    supplier_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier'
    },
    attributes: {
        type: Map,
        of: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
