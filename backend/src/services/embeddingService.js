const { pipeline } = require('@xenova/transformers');
const logger = require('../config/logger');

let embeddingPipeline = null;
let isInitializing = false;

// Phase 5 Performance: In-Memory cache for repeated embeddings (queries)
const embeddingCache = new Map();
const MAX_CACHE_SIZE = 1000;

/**
 * Initialize the embedding model.
 * Downloads Xenova/all-MiniLM-L6-v2 on first run (~80MB), cached after.
 * Returns 384-dimensional embeddings.
 */
async function initialize() {
  if (embeddingPipeline) return embeddingPipeline;
  if (isInitializing) {
    // Wait for in-progress initialization
    while (isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
    return embeddingPipeline;
  }

  isInitializing = true;
  try {
    logger.info('Loading embedding model: Xenova/all-MiniLM-L6-v2 ...');
    const startTime = Date.now();

    embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Embedding model loaded in ${duration}s`);

    return embeddingPipeline;
  } catch (error) {
    logger.error('Failed to load embedding model:', error.message);
    throw new Error(`Embedding model initialization failed: ${error.message}`);
  } finally {
    isInitializing = false;
  }
}

/**
 * Generate a 384-dimensional embedding for a single text string.
 */
async function generateEmbedding(text) {
  // Phase 5: Cache Check
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text);
  }

  const pipe = await initialize();

  const output = await pipe(text, {
    pooling: 'mean',
    normalize: true,
  });

  // Convert from Tensor to plain JS array
  const embeddingArray = Array.from(output.data);

  // Store in cache
  if (embeddingCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = embeddingCache.keys().next().value;
    embeddingCache.delete(oldestKey);
  }
  embeddingCache.set(text, embeddingArray);

  return embeddingArray;
}

/**
 * Generate embeddings for an array of texts.
 * Processes sequentially to manage memory on smaller machines.
 */
async function generateBatchEmbeddings(texts, batchSize = 10) {
  const pipe = await initialize();
  const embeddings = [];

  logger.info(`Generating embeddings for ${texts.length} texts in batches of ${batchSize}`);

  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = [];

    for (const text of batch) {
      const output = await pipe(text, {
        pooling: 'mean',
        normalize: true,
      });
      batchEmbeddings.push(Array.from(output.data));
    }

    embeddings.push(...batchEmbeddings);

    const progress = Math.min(i + batchSize, texts.length);
    logger.info(`Embedding progress: ${progress}/${texts.length}`);
  }

  return embeddings;
}

/**
 * Check if the model is loaded and ready.
 */
function isReady() {
  return embeddingPipeline !== null;
}

module.exports = {
  initialize,
  generateEmbedding,
  generateBatchEmbeddings,
  isReady,
};
