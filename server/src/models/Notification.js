const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['low_stock', 'maintenance', 'transfer_request', 'transfer_approved', 'transfer_rejected', 'system', 'checkout_overdue']
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    related_id: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'related_type'
    },
    related_type: {
        type: String,
        enum: ['Item', 'Maintenance', 'TransferRequest', 'CheckOut']
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
