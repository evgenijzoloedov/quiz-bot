const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    index: true
  },
  tokenHash: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  userAgent: {
    type: String,
    default: null
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// TTL index for automatic session expiration
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Session', sessionSchema);

