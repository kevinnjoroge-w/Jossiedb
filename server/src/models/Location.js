const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    type: {
        type: String,
        enum: ['warehouse', 'site', 'office', 'vehicle'],
        default: 'warehouse'
    },
    address: {
        type: String
    },
    capacity: {
        type: Number
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for items at this location
locationSchema.virtual('Items', {
    ref: 'Item',
    localField: '_id',
    foreignField: 'location_id'
});

// Virtual for foremen assigned to this location via UserLocations
locationSchema.virtual('foremen', {
    ref: 'UserLocations',
    localField: '_id',
    foreignField: 'location_id'
});

const Location = mongoose.model('Location', locationSchema);

module.exports = Location;
