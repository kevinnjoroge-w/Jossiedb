const mongoose = require('mongoose');

const userLocationsSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    location_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Location',
        required: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Composite unique index to mimic Sequelize behavior
userLocationsSchema.index({ user_id: 1, location_id: 1 }, { unique: true });

const UserLocations = mongoose.model('UserLocations', userLocationsSchema);

module.exports = UserLocations;
