const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  role: {
    type: String,
    enum: ['admin', 'super_admin', 'moderator'],
    default: 'admin'
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  permissions: {
    type: [String],
    default: ['create_character', 'edit_character', 'delete_character', 'view_analytics']
  },
  lastLogin: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Admin', adminSchema);

