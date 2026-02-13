const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    action: {
        type: String, // CREATE, UPDATE, DELETE, LOGIN, CHECKOUT
        required: true
    },
    entity_type: {
        type: String, // Item, User, Project
        required: true
    },
    entity_id: {
        type: mongoose.Schema.Types.Mixed, // Can be ObjectId or other ID
        required: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    details: {
        type: mongoose.Schema.Types.Mixed // Flexible storage for change diffs
    },
    ip_address: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
