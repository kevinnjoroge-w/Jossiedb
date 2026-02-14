const mongoose = require('mongoose');

const checkoutSchema = new mongoose.Schema({
    quantity: {
        type: Number,
        default: 1
    },
    checkout_date: {
        type: Date,
        default: Date.now
    },
    expected_return_date: {
        type: Date
    },
    actual_return_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['active', 'returned', 'overdue', 'lost', 'pending_authorization'],
        default: 'active'
    },
    destination_location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    project_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    location_note: {
        type: String
    },
    notes: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const CheckOut = mongoose.model('CheckOut', checkoutSchema);

module.exports = CheckOut;
