const mongoose = require('mongoose');

const nameSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    maxlength: 100,
    index: true,
    trim: true
  },
  pdfFilePath: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    index: true
  }
}, {
  timestamps: true
});

nameSchema.index({ name: 1, isActive: 1 });

module.exports = mongoose.model('Name', nameSchema);

