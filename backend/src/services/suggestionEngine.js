const Scheme = require('../models/Scheme');
const embeddingService = require('./embeddingService');
const vectorSearchService = require('./vectorSearchService');
const llmService = require('./llmService');
const graphService = require('./graphService');
const logger = require('../config/logger');

/**
 * Find alternative schemes when a farmer is ineligible for their target scheme.
 * Uses Neo4j Graph traversal to find related/complementary schemes.
 *
 * @param {Object} profile - Farmer profile data
 * @param {string} excludeSchemeId - Scheme ID to exclude (the one they were ineligible for)
 * @param {string} [language='en'] - The regional language code to translate AI output into.
 * @returns {Array} Top suggestions with reasoning
 */
async function findAlternatives(profile, excludeSchemeId, language = 'en') {
  const startTime = Date.now();

  try {
    // Step 1: Get current scheme name for graph lookup
    const currentScheme = await Scheme.findById(excludeSchemeId).lean();
    if (!currentScheme) return [];

    // Step 2: Get suggested scheme names from Neo4j
    const graphSuggestions = await graphService.getSuggestions(currentScheme.name, 3);
    
    if (graphSuggestions.length === 0) {
      logger.info('No graph-based suggestions found');
      // Hybrid fallback: if no graph link, use category-targeted vector search
      return await fallbackCategorySearch(profile, currentScheme.category, excludeSchemeId, language);
    }

    const suggestions = [];
    const searchQuery = `eligibility criteria for farmer from ${profile.state} with ${profile.landHolding} acres`;
    const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);

    // Step 3: Validate suggestions with LLM to ensure accuracy
    for (const suggested of graphSuggestions) {
      try {
        const scheme = await Scheme.findOne({ name: suggested.name, isActive: true }).lean();
        if (!scheme) continue;

        const chunks = await vectorSearchService.searchSimilarChunks(
          searchQuery,
          queryEmbedding,
          scheme._id.toString(),
          3,
          scheme.category
        );

        if (chunks.length === 0) continue;

        const result = await llmService.checkEligibility(profile, chunks, scheme.name, language);

        suggestions.push({
          schemeName: scheme.name,
          schemeId: scheme._id,
          eligible: result.eligible,
          reason: result.reason,
          benefitAmount: result.benefitAmount,
          matchScore: chunks[0]?.score || 0,
          citation: result.citation,
        });
      } catch (err) {
        logger.warn(`Suggestion check failed for ${suggested.name}: ${err.message}`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`Found ${suggestions.length} Graph-based suggestions in ${duration}s`);

    return suggestions.sort((a, b) => b.eligible - a.eligible).slice(0, 3);
  } catch (error) {
    logger.error('Suggestion engine error:', error.message);
    return [];
  }
}

/**
 * Fallback to category-based vector search if no explicit graph links exist.
 */
async function fallbackCategorySearch(profile, category, excludeId, language) {
  const otherSchemes = await Scheme.find({
    category,
    _id: { $ne: excludeId },
    isActive: true
  }).limit(3).lean();

  if (otherSchemes.length === 0) return [];

  const searchQuery = `eligibility for ${category}`;
  const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
  const suggestions = [];

  for (const scheme of otherSchemes) {
    const chunks = await vectorSearchService.searchSimilarChunks(searchQuery, queryEmbedding, scheme._id.toString(), 3, category);
    if (chunks.length === 0) continue;
    
    const result = await llmService.checkEligibility(profile, chunks, scheme.name, language);
    suggestions.push({
      schemeName: scheme.name,
      schemeId: scheme._id,
      eligible: result.eligible,
      reason: result.reason,
      matchScore: chunks[0]?.score || 0
    });
  }
  return suggestions;
}

module.exports = {
  findAlternatives,
};
