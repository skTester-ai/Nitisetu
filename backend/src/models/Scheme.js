const mongoose = require('mongoose');

const schemeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Scheme name is required'],
      unique: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['income_support', 'infrastructure', 'energy', 'insurance', 'credit', 'soil', 'horticulture', 'livestock', 'other'],
      default: 'other',
    },
    benefits: {
      amount: { type: Number, default: 0 },
      frequency: { type: String, default: 'One-time' },
      description: { type: String, default: '' },
    },
    criteria: {
      maxLandHectares: { type: Number, default: null },
      minLandHectares: { type: Number, default: null },
      applicableStates: { type: [String], default: ['All'] },
      applicableCategories: { type: [String], default: ['All'] },
      applicableCrops: { type: [String], default: ['All'] },
    },
    documents: [{
      path: { type: String, required: true },
      type: { 
        type: String, 
        enum: ['guidelines', 'amendment', 'faq', 'addendum', 'state_addendum'],
        default: 'guidelines'
      },
      state: { type: String, default: 'All' },
      language: { type: String, default: 'en' },
      uploadedAt: { type: Date, default: Date.now }
    }],
    officialWebsite: {
      type: String,
      default: '',
    },
    version: {
      type: String,
      default: '1.0',
    },
    totalChunks: {
      type: Number,
      default: 0,
    },
    processedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Phase 5 Performance: Indexing for faster getAllSchemes lookup
schemeSchema.index({ isActive: 1, createdAt: -1 });
schemeSchema.index({ category: 1 });

module.exports = mongoose.model('Scheme', schemeSchema);
