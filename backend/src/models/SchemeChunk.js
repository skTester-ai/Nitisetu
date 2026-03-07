const mongoose = require('mongoose');

const schemeChunkSchema = new mongoose.Schema(
  {
    schemeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Scheme',
      required: true,
      index: true,
    },
    schemeName: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      index: true,
    },
    text: {
      type: String,
      required: [true, 'Chunk text is required'],
    },
    embedding: {
      type: [Number],
      required: true,
      validate: {
        validator: function (arr) {
          return arr.length === 384;
        },
        message: 'Embedding must be exactly 384 dimensions',
      },
    },
    metadata: {
      page: { type: Number, default: 1 },
      section: { type: String, default: 'Unknown' },
      paragraph: { type: Number, default: 1 },
      chunkIndex: { type: Number, required: true },
      documentPath: { type: String }, // Link to source document in Scheme.documents
      documentType: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient filtering during vector search
schemeChunkSchema.index({ schemeId: 1, 'metadata.chunkIndex': 1 });

// Full-text index for BM25 hybrid keyword search fallback
schemeChunkSchema.index({ text: 'text' });

module.exports = mongoose.model('SchemeChunk', schemeChunkSchema, 'scheme_chunks');
