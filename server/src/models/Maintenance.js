const mongoose = require('mongoose');

const maintenanceSchema = new mongoose.Schema({
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    technician_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['preventive', 'corrective', 'inspection'],
        default: 'preventive'
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['scheduled', 'in_progress', 'completed', 'cancelled'],
        default: 'scheduled'
    },
    scheduled_date: {
        type: Date,
        required: true
    },
    completed_date: {
        type: Date
    },
    cost: {
        type: Number
    },
    technician_notes: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Maintenance = mongoose.model('Maintenance', maintenanceSchema);

module.exports = Maintenance;
