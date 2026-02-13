const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    contact_person: {
        type: String
    },
    email: {
        type: String,
        lowercase: true,
        trim: true
    },
    phone: {
        type: String
    },
    rating: {
        type: Number,
        min: 1,
        max: 5
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;
