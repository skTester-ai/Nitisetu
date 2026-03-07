const mongoose = require('mongoose');

const publicCheckCacheSchema = new mongoose.Schema(
  {
    profileHash: {
      type: String,
      required: true,
      index: true,
    },
    schemeName: {
      type: String,
      required: true,
      index: true,
    },
    result: {
      type: Object,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // Default 24 hours
      index: { expires: 0 }, // TTL index
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster lookups
publicCheckCacheSchema.index({ profileHash: 1, schemeName: 1 });

module.exports = mongoose.model('PublicCheckCache', publicCheckCacheSchema, 'public_check_cache');
