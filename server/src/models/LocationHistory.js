const mongoose = require('mongoose');

const locationHistorySchema = new mongoose.Schema({
    item_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
        required: true
    },
    from_location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    to_location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location'
    },
    changed_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    change_type: {
        type: String,
        enum: ['manual', 'checkout', 'checkin'],
        required: true,
        default: 'manual'
    },
    notes: {
        type: String
    },
    changed_at: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const LocationHistory = mongoose.model('LocationHistory', locationHistorySchema);

module.exports = LocationHistory;
