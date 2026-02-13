const mongoose = require('mongoose');

const transferRequestSchema = new mongoose.Schema({
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    from_location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    to_location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    },
    quantity: {
        type: Number,
        default: 1,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'in_transit', 'completed', 'cancelled'],
        default: 'pending'
    },
    requested_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    approved_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    reason: {
        type: String
    },
    notes: {
        type: String
    },
    estimated_arrival: {
        type: Date
    },
    actual_arrival: {
        type: Date
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const TransferRequest = mongoose.model('TransferRequest', transferRequestSchema);

module.exports = TransferRequest;
