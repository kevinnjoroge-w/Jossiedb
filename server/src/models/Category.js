const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    description: {
        type: String
    },
    parent_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
