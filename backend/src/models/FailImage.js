const mongoose = require('mongoose');

const failImageSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  order: {
    type: Number,
    default: 0,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    index: true
  }
}, {
  timestamps: true
});

failImageSchema.index({ order: 1, isActive: 1 });

module.exports = mongoose.model('FailImage', failImageSchema);

