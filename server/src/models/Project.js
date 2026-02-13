const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    start_date: {
        type: Date
    },
    end_date: {
        type: Date
    },
    status: {
        type: String,
        enum: ['planning', 'active', 'completed', 'on_hold', 'cancelled'],
        default: 'planning'
    },
    budget: {
        type: Number
    },
    location: {
        type: String
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
