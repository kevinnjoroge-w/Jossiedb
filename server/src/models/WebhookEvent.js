const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
    webhookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Webhook',
        required: true
    },
    eventType: {
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
        ],
        required: true
    },
    
    // Event payload
    data: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    
    // Delivery information
    deliveryStatus: {
        type: String,
        enum: ['pending', 'success', 'failed'],
        default: 'pending'
    },
    deliveryAttempts: {
        type: Number,
        default: 0
    },
    lastAttempt: Date,
    nextRetry: Date,
    
    // Response tracking
    httpResponse: {
        statusCode: Number,
        body: String
    },
    error: String,
    
    createdAt: {
        type: Date,
        default: Date.now,
        index: true,
        expires: 2592000 // Auto-delete after 30 days
    }
}, { timestamps: true });

// Index for queries
webhookEventSchema.index({ webhookId: 1, deliveryStatus: 1 });
webhookEventSchema.index({ eventType: 1 });

module.exports = mongoose.model('WebhookEvent', webhookEventSchema);
