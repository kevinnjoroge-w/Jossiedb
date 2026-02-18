const mongoose = require('mongoose');

const webhookSchema = new mongoose.Schema({
    // Subscription details
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    url: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Invalid webhook URL'
        }
    },
    
    // Event types to subscribe to
    events: [{
        type: String,
        enum: [
            'low-stock-alert',
            'transfer-approval-needed',
            'transfer-approved',
            'transfer-rejected',
            'item-checkout',
            'item-checkin',
            'user-login',
            'user-logout',
            'item-created',
            'item-updated',
            'item-deleted'
        ]
    }],
    
    // Optional filters
    filters: {
        locations: [mongoose.Schema.Types.ObjectId],  // Only trigger for these locations
        categories: [mongoose.Schema.Types.ObjectId], // Only trigger for these categories
        minStockThreshold: Number                       // Low stock alert threshold
    },
    
    // Webhook configuration
    active: {
        type: Boolean,
        default: true
    },
    secret: {
        type: String,
        required: true
    },
    headers: {
        type: Map,
        of: String
    },
    
    // Metadata
    retryPolicy: {
        maxRetries: {
            type: Number,
            default: 3
        },
        retryDelay: {
            type: Number,
            default: 5000 // ms
        }
    },
    timeout: {
        type: Number,
        default: 30000 // ms
    },
    
    // Tracking
    statistics: {
        totalEvents: { type: Number, default: 0 },
        successfulDeliveries: { type: Number, default: 0 },
        failedDeliveries: { type: Number, default: 0 },
        lastDelivery: Date,
        lastFailure: Date
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Index for faster queries
webhookSchema.index({ userId: 1, active: 1 });
webhookSchema.index({ events: 1 });

module.exports = mongoose.model('Webhook', webhookSchema);
