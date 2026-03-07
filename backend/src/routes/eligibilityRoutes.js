const express = require('express');
const router = express.Router();

const Scheme = require('../models/Scheme');
const FarmerProfile = require('../models/FarmerProfile');
const EligibilityCheck = require('../models/EligibilityCheck');
const embeddingService = require('../services/embeddingService');
const vectorSearchService = require('../services/vectorSearchService');
const llmService = require('../services/llmService');
const suggestionEngine = require('../services/suggestionEngine');
const graphService = require('../services/graphService');
const { asyncHandler } = require('../middleware/errorHandler');
const { eligibilityLimiter, publicEligibilityLimiter } = require('../middleware/rateLimiter');
const { validateEligibilityCheck, validateObjectId } = require('../middleware/validators');
const { protect } = require('../middleware/auth');
const logger = require('../config/logger');
const crypto = require('crypto');
const PublicCheckCache = require('../models/PublicCheckCache');

/**
 * Generate a deterministic hash for a profile object.
 */
function hashProfile(profile) {
  const sortedKeys = ['age', 'annualIncome', 'category', 'cropType', 'district', 'hasIrrigationAccess', 'landHolding', 'name', 'state', 'primaryIncomeSource', 'isFarmerRelated'];
  const coreString = sortedKeys
    .map(key => {
      let value = profile[key];
      if (key === 'primaryIncomeSource' && !value) {
        value = 'Agriculture';
      } else if (key === 'isFarmerRelated' && value === undefined) {
        value = true;
      }
      return `${key}:${value || ''}`;
    })
    .join('|');
  const activeSchemesString = Array.isArray(profile.activeSchemes) ? profile.activeSchemes.sort().join(',') : '';
  const baseString = coreString + '|activeSchemes:' + activeSchemesString;
  return crypto.createHash('sha256').update(baseString).digest('hex');
}

/**
 * POST /api/eligibility/check
 * The core RAG endpoint: runs the full eligibility pipeline.
 *
 * Flow:
 *   1. Load farmer profile
 *   2. Find scheme
 *   3. Build search query from profile
 *   4. Generate query embedding
 *   5. Vector search for relevant document chunks
 *   6. Send profile + chunks to LLM
 *   7. If not eligible, find alternative schemes
 *   8. Save result and return
 */
router.post(
  '/check',
  protect,
  eligibilityLimiter,
  validateEligibilityCheck,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { profileId, schemeName, language = 'en' } = req.body;

    // Step 1: Load farmer profile
    const profile = await FarmerProfile.findById(profileId).lean();
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Farmer profile not found' });
    }

    // Role check: Farmer can only check their own profile
    if (req.user.role === 'farmer' && profile.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Not authorized to check this profile' });
    }

    // New: Get matching categories from Graph
    const graphStart = Date.now();
    const matchingCategories = await graphService.getRecommendedCategories(profile);
    const graphLatency = Date.now() - graphStart;
    logger.info(`Matching categories for ${profile.name}: ${matchingCategories.join(', ')}`);

    // Step 2: Determine which schemes to check
    let schemesToCheck = [];
    let preFilterEmbeddingLatency = 0;
    let preFilterVectorSearchLatency = 0;

    if (schemeName && schemeName !== 'all') {
      const scheme = await Scheme.findOne({ name: schemeName, isActive: true }).lean();
      if (!scheme) {
        return res.status(404).json({
          success: false,
          error: `Scheme "${schemeName}" not found.`,
        });
      }
      schemesToCheck.push(scheme);
    } else {
      let query = { isActive: true };
      if (req.body.category) {
        query.category = req.body.category;
      }
      schemesToCheck = await Scheme.find(query).lean();
      if (schemesToCheck.length === 0) {
        return res.status(404).json({ success: false, error: 'No active schemes found in database.' });
      }

      // PRE-FILTERING FOR "SCAN ALL": Limit to top 3 schemes via semantic routing
      if (schemesToCheck.length > 3) {
        logger.info(`Pre-filtering category from ${schemesToCheck.length} down to Top 3 to save LLM tokens.`);
        const userQuery = `farmer from ${profile.state || ''} ${profile.district || ''} with ${profile.landHolding || 0} acres land, income ${profile.annualIncome || 0}, crop ${profile.cropType || ''}`;
        
        const embStart = Date.now();
        const queryEmbedding = await embeddingService.generateEmbedding(userQuery);
        preFilterEmbeddingLatency = Date.now() - embStart;

        const vsStart = Date.now();
        const topChunks = await vectorSearchService.searchSimilarChunks(userQuery, queryEmbedding, null, 30, req.body.category);
        preFilterVectorSearchLatency = Date.now() - vsStart;
        
        const topSchemeIds = [...new Set(topChunks.map(c => c.schemeId.toString()))];
        const rankedSchemes = topSchemeIds
          .map(id => schemesToCheck.find(s => s._id.toString() === id))
          .filter(Boolean);
        
        schemesToCheck = rankedSchemes.length > 0 ? rankedSchemes.slice(0, 3) : schemesToCheck.slice(0, 3);
      }
    }

    logger.info(`Eligibility check: ${profile.name} → ${schemeName === 'all' || !schemeName ? 'ALL SCHEMES' : schemeName}`);

    // Process schemes in parallel (subject to LLM service internal concurrency limit)
    const results = await Promise.all(
      schemesToCheck.map(async (scheme) => {
        const perf = {
          graph: graphLatency,
          embedding: preFilterEmbeddingLatency,
          vectorSearch: preFilterVectorSearchLatency,
          llm: 0,
          suggestion: 0,
          total: 0
        };

        try {
          // Calculate a deterministic profile hash so cache invalidates if user changes active schemes or land size
          const profileStringForHash = JSON.stringify({
            age: profile.age, state: profile.state, landHolding: profile.landHolding, 
            cropType: profile.cropType, category: profile.category, income: profile.annualIncome, 
            activeSchemes: profile.activeSchemes || []
          });
          const profileHash = crypto.createHash('sha256').update(profileStringForHash).digest('hex');

          // Caching Logic: Check for recent existing results (last 24h) matching this EXACT profile state
          const recentCheck = await EligibilityCheck.findOne({
            farmerId: profile._id,
            schemeId: scheme._id,
            profileHash: profileHash,
            createdAt: { $gt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
          })
            .sort({ createdAt: -1 })
            .lean();

          if (recentCheck) {
            logger.info(`Cache HIT for ${profile.name} on scheme ${scheme.name} (ID: ${recentCheck._id})`);
            return {
              checkId: recentCheck._id,
              scheme: scheme.name,
              eligible: recentCheck.eligible,
              confidence: recentCheck.confidence,
              reason: recentCheck.reason,
              citation: recentCheck.citation,
              citationSource: recentCheck.citationSource,
              officialWebsite: recentCheck.officialWebsite,
              documentUrl: recentCheck.documentUrl,
              benefitAmount: recentCheck.benefitAmount,
              requiredDocuments: recentCheck.requiredDocuments,
              suggestions: recentCheck.suggestions,
              responseTime: 0,
              chunksAnalyzed: 0,
              isCached: true,
              category: scheme.category,
              latencies: { ...perf, total: Date.now() - startTime }
            };
          }

          // Use a generic search query aimed at retrieving the RULES
          const searchQuery = `eligibility criteria, beneficiary conditions, who is eligible, age limit, land holding limit, income limit, exclusions for ${scheme.name}`;
          
          const embStart2 = Date.now();
          const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
          perf.embedding += (Date.now() - embStart2);

          // Pass scheme category for optimized filtering
          const vsStart2 = Date.now();
          const relevantChunks = await vectorSearchService.searchSimilarChunks(
            searchQuery,
            queryEmbedding,
            scheme._id.toString(),
            8,
            scheme.category
          );
          perf.vectorSearch += (Date.now() - vsStart2);

          if (relevantChunks.length === 0) {
            return { scheme: scheme.name, error: 'No relevant document sections found.', latencies: perf };
          }

          // New: Check for Graph Conflicts (Exclusive schemes)
          const graphStart2 = Date.now();
          const graphConflicts = await graphService.checkConflicts(profile.activeSchemes || [], scheme.name);
          perf.graph += (Date.now() - graphStart2);

          if (graphConflicts.length > 0) {
            logger.info(`Graph CONFLICT detected for ${profile.name} on ${scheme.name}: ${graphConflicts.map(c => c.scheme).join(', ')}`);
          }

          const llmStart = Date.now();
          const llmResult = await llmService.checkEligibility(profile, relevantChunks, scheme.name, language, graphConflicts, 'registered');
          perf.llm = Date.now() - llmStart;

          let suggestions = [];
          if (!llmResult.eligible && schemesToCheck.length === 1) {
            const sugStart = Date.now();
            suggestions = await suggestionEngine.findAlternatives(profile, scheme._id, language);
            perf.suggestion = Date.now() - sugStart;
          }

          perf.total = Date.now() - startTime;
          const totalResponseTimeFloat = parseFloat((perf.total / 1000).toFixed(2));

          const officialWebsiteUrl = scheme.officialWebsite || llmResult.officialWebsite;
          // IMPORTANT: Rely on actual DB file path, ignore hallucinated file names from LLM
          const citedDoc = (scheme.documents && scheme.documents.length > 0) ? scheme.documents[0].path : scheme.sourceFile;
          const documentUrl = citedDoc ? `${req.protocol}://${req.get('host')}/api/schemes/docs/${encodeURIComponent(citedDoc)}` : null;

          const eligibilityRecord = await EligibilityCheck.create({
            farmerId: profile._id,
            schemeId: scheme._id,
            schemeName: scheme.name,
            profileHash: profileHash,
            eligible: llmResult.eligible,
            confidence: llmResult.confidence,
            reason: llmResult.reason,
            citation: llmResult.citation,
            citationSource: llmResult.citationSource,
            officialWebsite: officialWebsiteUrl,
            documentUrl: documentUrl,
            benefitAmount: llmResult.benefitAmount,
            requiredDocuments: llmResult.requiredDocuments,
            suggestions: suggestions,
            responseTime: totalResponseTimeFloat,
            latencies: perf,
          });

          return {
            checkId: eligibilityRecord._id,
            scheme: scheme.name,
            eligible: llmResult.eligible,
            confidence: llmResult.confidence,
            reason: llmResult.reason,
            citation: llmResult.citation,
            citationSource: llmResult.citationSource,
            officialWebsite: officialWebsiteUrl,
            documentUrl: documentUrl,
            benefitAmount: llmResult.benefitAmount,
            requiredDocuments: llmResult.requiredDocuments,
            suggestions: suggestions,
            responseTime: totalResponseTimeFloat,
            chunksAnalyzed: relevantChunks.length,
            category: scheme.category,
            latencies: perf
          };
        } catch (err) {
          logger.error(`Error processing scheme ${scheme.name}:`, err.message);
          return { scheme: scheme.name, error: err.message, latencies: perf };
        }
      })
    );

    // Return array if all, or single object if one scheme for backwards compatibility
    const responseData = (schemesToCheck.length === 1 && schemeName !== 'all') ? results[0] : results;

    res.json({
      success: true,
      data: responseData,
    });

  })
);

/**
 * POST /api/eligibility/public-check
 * UNAUTHENTICATED RAG endpoint for the Freemium public access model.
 * 
 * Flow:
 *   1. Accept raw profile data from body (not a database ID)
 *   2. Find scheme
 *   3. Generate query embedding & vector search
 *   4. Send to LLM
 *   5. Return result WITHOUT saving to database
 */
router.post(
  '/public-check',
  publicEligibilityLimiter,
  asyncHandler(async (req, res) => {
    const startTime = Date.now();
    const { profileData, schemeName, language = 'en' } = req.body;

    if (!profileData || !profileData.name || !profileData.state) {
      return res.status(400).json({ success: false, error: 'Basic profile data (Name, State) is required.' });
    }

    // Determine which schemes to check
    let schemesToCheck = [];
    if (schemeName && schemeName !== 'all') {
      const scheme = await Scheme.findOne({ name: schemeName, isActive: true }).lean();
      if (!scheme) {
        return res.status(404).json({ success: false, error: `Scheme "${schemeName}" not found.` });
      }
      schemesToCheck.push(scheme);
    } else {
      let query = { isActive: true };
      if (req.body.category) {
        query.category = req.body.category;
      }
      schemesToCheck = await Scheme.find(query).lean();
      if (schemesToCheck.length === 0) {
        return res.status(404).json({ success: false, error: 'No active schemes found in database.' });
      }

      // PRE-FILTERING FOR "SCAN ALL" (Public check)
      if (schemesToCheck.length > 3) {
        logger.info(`Public Check: Pre-filtering category from ${schemesToCheck.length} down to Top 3 to save LLM tokens.`);
        const userQuery = `farmer from ${profileData.state || ''} ${profileData.district || ''} with ${profileData.landHolding || 0} acres land, income ${profileData.annualIncome || 0}, crop ${profileData.cropType || ''}`;
        const queryEmbedding = await embeddingService.generateEmbedding(userQuery);
        const topChunks = await vectorSearchService.searchSimilarChunks(userQuery, queryEmbedding, null, 30, req.body.category);
        
        const topSchemeIds = [...new Set(topChunks.map(c => c.schemeId.toString()))];
        const rankedSchemes = topSchemeIds
          .map(id => schemesToCheck.find(s => s._id.toString() === id))
          .filter(Boolean);
        
        schemesToCheck = rankedSchemes.length > 0 ? rankedSchemes.slice(0, 3) : schemesToCheck.slice(0, 3);
      }
    }

    logger.info(`Public Eligibility check: ${profileData.name} → ${schemeName === 'all' || !schemeName ? 'ALL SCHEMES' : schemeName}`);

    const profileHash = hashProfile(profileData);


    // Process schemes in parallel (subject to LLM service internal concurrency limit)
    const results = await Promise.all(
      schemesToCheck.map(async (scheme) => {
        const perf = {
          embedding: 0,
          vectorSearch: 0,
          llm: 0,
          suggestion: 0,
          total: 0
        };

        try {
          // Public Caching Logic: Check for identical profile + scheme
          const cachedResult = await PublicCheckCache.findOne({
            profileHash,
            schemeName: scheme.name,
          }).lean();

          if (cachedResult) {
            logger.info(`Public Cache HIT for ${profileData.name} on scheme ${scheme.name}`);
            return {
              ...cachedResult.result,
              isCached: true,
              latencies: { ...perf, total: Date.now() - startTime }
            };
          }

          const searchQuery = `eligibility criteria, beneficiary conditions, who is eligible, age limit, land holding limit, income limit, exclusions for ${scheme.name}`;
          
          const embStart = Date.now();
          const queryEmbedding = await embeddingService.generateEmbedding(searchQuery);
          perf.embedding = Date.now() - embStart;

          const vsStart = Date.now();
          const relevantChunks = await vectorSearchService.searchSimilarChunks(
            searchQuery,
            queryEmbedding,
            scheme._id.toString(),
            8,
            scheme.category
          );
          perf.vectorSearch = Date.now() - vsStart;

          if (relevantChunks.length === 0) {
            return { scheme: scheme.name, error: 'No relevant document sections found.', latencies: perf };
          }

          const llmStart = Date.now();
          const llmResult = await llmService.checkEligibility(profileData, relevantChunks, scheme.name, language, [], 'public');
          perf.llm = Date.now() - llmStart;

          let suggestions = [];
          if (!llmResult.eligible && schemesToCheck.length === 1) {
            const sugStart = Date.now();
            suggestions = await suggestionEngine.findAlternatives(profileData, scheme._id, language);
            perf.suggestion = Date.now() - sugStart;
          }

          perf.total = Date.now() - startTime;
          const totalResponseTimeFloat = parseFloat((perf.total / 1000).toFixed(2));

          const officialWebsiteUrl = scheme.officialWebsite || llmResult.officialWebsite;
          // IMPORTANT: Rely on actual DB file path, ignore hallucinated file names from LLM
          const citedDoc = (scheme.documents && scheme.documents.length > 0) ? scheme.documents[0].path : scheme.sourceFile;
          const documentUrl = citedDoc ? `${req.protocol}://${req.get('host')}/api/schemes/docs/${encodeURIComponent(citedDoc)}` : null;

          const result = {
            checkId: 'public-' + Date.now(),
            scheme: scheme.name,
            ...llmResult,
            officialWebsite: officialWebsiteUrl,
            documentUrl: documentUrl,
            suggestions: suggestions,
            responseTime: totalResponseTimeFloat,
            chunksAnalyzed: relevantChunks.length,
            isPublicCheck: true,
            category: scheme.category,
            latencies: perf
          };

          // Save to Public Cache
          await PublicCheckCache.create({
            profileHash,
            schemeName: scheme.name,
            result: result,
          });

          return result;
        } catch (err) {
          logger.error(`Error processing public scheme check ${scheme.name}:`, err.message);
          return { scheme: scheme.name, error: err.message, latencies: perf };
        }
      })
    );

    const responseData = (schemesToCheck.length === 1 && schemeName !== 'all') ? results[0] : results;
    res.json({ success: true, data: responseData });

  })
);

/**
 * GET /api/eligibility/history/:profileId
 * Get eligibility check history for a farmer profile.
 */
router.get(
  '/history/:id',
  protect,
  asyncHandler(async (req, res) => {
    // Check if profile belongs to user
    const profile = await FarmerProfile.findById(req.params.id);
    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }
    
    if (req.user.role === 'farmer') {
      if (!profile.userId || profile.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }
    }

    const checks = await EligibilityCheck.find({ farmerId: req.params.id })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: checks.length,
      data: checks,
    });
  })
);

/**
 * DELETE /api/eligibility/:id
 * Delete an eligibility check record.
 */
router.delete(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const check = await EligibilityCheck.findById(req.params.id);
    
    if (!check) {
      return res.status(404).json({ success: false, error: 'Eligibility check not found' });
    }

    // Role check: Farmer can only delete their own checks
    if (req.user.role === 'farmer') {
      const profile = await FarmerProfile.findById(check.farmerId);
      if (profile && (!profile.userId || profile.userId.toString() !== req.user.id)) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this check' });
      }
    }

    await EligibilityCheck.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      data: {},
    });
  })
);

/**
 * POST /api/eligibility/translate-result
 * Translates an existing eligibility result into a target language.
 */
router.post(
  '/translate-result',
  asyncHandler(async (req, res) => {
    const { result, language } = req.body;
    if (!result || !language) {
      return res.status(400).json({ success: false, error: 'Result object and language are required' });
    }

    try {
      const translatedData = await llmService.translateEligibilityResult(result, language);
      res.json({
        success: true,
        data: translatedData
      });
    } catch (err) {
      logger.error('Failed to translate result:', err.message);
      res.status(500).json({ success: false, error: 'Failed to translate result' });
    }
  })
);

module.exports = router;
