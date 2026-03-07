const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const apicache = require('apicache');
const router = express.Router();

const cache = apicache.middleware;

const Scheme = require('../models/Scheme');
const SchemeChunk = require('../models/SchemeChunk');
const pdfProcessor = require('../services/pdfProcessor');
const embeddingService = require('../services/embeddingService');
const graphService = require('../services/graphService');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { validateObjectId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');
const logger = require('../config/logger');
const { logAction } = require('../utils/auditLogger');

// Multer config for PDF uploads
const uploadsDir = path.join(__dirname, '..', '..', 'data', 'schemes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
});

/**
 * POST /api/schemes/upload
 * Upload a PDF and trigger the full RAG ingestion pipeline:
 *   PDF → Extract → Chunk → Embed → Store in MongoDB
 */
router.post(
  '/upload',
  protect,
  authorize('admin'),
  uploadLimiter,
  upload.single('pdf'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No PDF file uploaded' });
    }

    const schemeName = req.body.schemeName || path.basename(req.file.originalname, '.pdf');
    const description = req.body.description || '';
    const docType = req.body.docType || 'guidelines';
    const state = req.body.state || 'All';
    const language = req.body.language || 'en';

    // Normalize category
    const rawCategory = (req.body.category || 'other').toLowerCase().trim().replace(/ /g, '_');
    const validCategories = ['income_support', 'infrastructure', 'energy', 'insurance', 'credit', 'soil', 'horticulture', 'livestock', 'other'];
    const category = validCategories.includes(rawCategory) ? rawCategory : 'other';

    logger.info(`Starting PDF ingestion for scheme: ${schemeName} (Type: ${docType})`);

    let scheme = await Scheme.findOne({ name: schemeName });

    if (!scheme) {
      // Create new scheme in MongoDB
      scheme = await Scheme.create({
        name: schemeName,
        description,
        category,
        documents: [],
        totalChunks: 0,
      });
      
      // Ensure Scheme node exists in Neo4j
      await graphService.ensureSchemeNode({
        id: scheme._id,
        name: schemeName,
        description,
        category
      });
    }

    // Step 1: Process PDF (extract + chunk)
    const { chunks, totalChunks, numPages } = await pdfProcessor.processPDF(
      req.file.path,
      schemeName,
      { filename: req.file.filename, type: docType, state, language }
    );

    // Step 2: Generate embeddings for all chunks
    const texts = chunks.map((c) => c.text);
    const embeddings = await embeddingService.generateBatchEmbeddings(texts);

    // Step 3: Update Scheme record (Add document)
    scheme.documents.push({
      path: req.file.filename,
      type: docType,
      state,
      language,
      uploadedAt: new Date()
    });
    scheme.totalChunks += totalChunks;
    scheme.processedAt = new Date();
    await scheme.save();

    // Step 4: Add Document to Scheme in Neo4j
    await graphService.addDocumentToScheme(schemeName, {
      path: req.file.filename,
      type: docType,
      state,
      language
    });

    // Step 5: Store chunks with embeddings in MongoDB
    const chunkDocs = chunks.map((chunk, i) => ({
      schemeId: scheme._id,
      schemeName: schemeName,
      category: category,
      text: chunk.text,
      embedding: embeddings[i],
      metadata: {
        ...chunk.metadata,
        documentPath: req.file.filename,
        documentType: docType
      },
    }));

    await SchemeChunk.insertMany(chunkDocs);

    logger.info(`PDF ingestion complete: ${schemeName} → ${totalChunks} new chunks stored`);

    // Audit Log
    await logAction(req, 'UPLOAD_SCHEME', schemeName, scheme._id, {
      documents: scheme.documents.length,
      newChunks: totalChunks,
      category
    });

    // Clear caches
    apicache.clear('/api/schemes');

    res.status(201).json({
      success: true,
      data: {
        schemeId: scheme._id,
        name: schemeName,
        numPages,
        newChunks: totalChunks,
        totalChunks: scheme.totalChunks,
        message: `Document "${req.file.originalname}" processed and linked to "${schemeName}"`,
      },
    });
  })
);

/**
 * GET /api/schemes
 * List all processed schemes.
 */
router.get(
  '/',
  cache('1 hour'),
  asyncHandler(async (req, res) => {
    const schemes = await Scheme.find({ isActive: true })
      .select('-__v')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      count: schemes.length,
      data: schemes,
    });
  })
);

/**
 * GET /api/schemes/:id
 * Get scheme details including chunk count.
 */
router.get(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const scheme = await Scheme.findById(req.params.id).select('-__v').lean();

    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found' });
    }

    const chunkCount = await SchemeChunk.countDocuments({ schemeId: scheme._id });

    res.json({
      success: true,
      data: { ...scheme, chunkCount },
    });
  })
);

/**
 * DELETE /api/schemes/:id
 * Remove a scheme and all its chunks.
 */
router.delete(
  '/:id',
  protect,
  authorize('admin'),
  validateObjectId,
  asyncHandler(async (req, res) => {
    const scheme = await Scheme.findById(req.params.id);

    if (!scheme) {
      return res.status(404).json({ success: false, error: 'Scheme not found' });
    }

    // Delete all chunks for this scheme
    const deletedChunks = await SchemeChunk.deleteMany({ schemeId: scheme._id });

    // Delete the scheme itself
    await Scheme.findByIdAndDelete(req.params.id);

    // Clean up all PDF files
    if (scheme.documents && scheme.documents.length > 0) {
      for (const doc of scheme.documents) {
        const filePath = path.join(uploadsDir, doc.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    } else if (scheme.sourceFile) {
      // Compatibility for old schemes
      const filePath = path.join(uploadsDir, scheme.sourceFile);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Neo4j cleanup (optional but recommended: delete Scheme node or its documents)
    // For now, we'll just log it. A full graph cleanup can be added later.

    logger.info(`Scheme deleted: ${scheme.name} (${deletedChunks.deletedCount} chunks removed)`);

    // Audit Log
    await logAction(req, 'DELETE_SCHEME', scheme.name, scheme._id, {
      chunksDeleted: deletedChunks.deletedCount,
      documentsDeletedCount: scheme.documents?.length || 1
    });

    // Clear the cached scheme list
    apicache.clear('/api/schemes');

    res.json({
      success: true,
      data: {
        message: `Scheme "${scheme.name}" and ${deletedChunks.deletedCount} chunks deleted`,
      },
    });
  })
);

/**
 * GET /api/schemes/docs/:filename
 * Serve a specific PDF document from the data/schemes directory.
 */
router.get(
  '/docs/:filename',
  // Note: We leave this public for now so shared proof cards can access it, 
  // but in a strict prod environment, we might add a signed-URL logic.
  asyncHandler(async (req, res) => {
    const fileName = decodeURIComponent(req.params.filename);
    let filePath = path.join(uploadsDir, fileName);

    // If perfectly found in normal uploads (for user-uploaded schemes)
    if (fs.existsSync(filePath)) {
      res.contentType('application/pdf');
      return res.sendFile(filePath);
    }

    // FALLBACK 1: Try appending .pdf if missing
    if (!fileName.toLowerCase().endsWith('.pdf') && fs.existsSync(`${filePath}.pdf`)) {
      res.contentType('application/pdf');
      return res.sendFile(`${filePath}.pdf`);
    }

    // FALLBACK 2: Search the original 'docs/schemes' seed directory structure
    const seedDocsDir = path.join(__dirname, '..', '..', '..', 'docs', 'schemes');
    if (fs.existsSync(seedDocsDir)) {
      // Find all PDF files recursively in the docs/schemes seed folder
      const getAllFiles = function(dirPath, arrayOfFiles) {
        const files = fs.readdirSync(dirPath);
        arrayOfFiles = arrayOfFiles || [];
        files.forEach(function(file) {
          if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
          } else {
            if(file.toLowerCase().endsWith('.pdf')) {
              arrayOfFiles.push(path.join(dirPath, file));
            }
          }
        });
        return arrayOfFiles;
      };
      
      const allSeededPdfs = getAllFiles(seedDocsDir);
      
      // Target filename (without .pdf if we want to do a fuzzy scan)
      const cleanTarget = fileName.toLowerCase().replace(/\.pdf$/, '');
      
      // Look for exact match or substring match
      let matchedPdf = allSeededPdfs.find(f => {
        const base = path.basename(f).toLowerCase().replace(/\.pdf$/, '');
        return base === cleanTarget || base.includes(cleanTarget) || cleanTarget.includes(base);
      });

      // Powerful Word-Intersection Matcher for hallucinated legacy names (e.g., "(KCC)" vs "Guidelines")
      if (!matchedPdf) {
        const targetWords = cleanTarget.split(/[\s_\-\(\)]+/).filter(w => w.length > 2);
        let bestScore = 0;
        
        for (const pdf of allSeededPdfs) {
          const pdfBase = path.basename(pdf).toLowerCase().replace(/\.pdf$/, '');
          let score = 0;
          for (const word of targetWords) {
            if (pdfBase.includes(word)) score++;
          }
          if (score > bestScore) {
            bestScore = score;
            matchedPdf = pdf;
          }
        }
        
        // If we found a PDF that matches at least 2 significant words
        if (bestScore < 2) {
          matchedPdf = null;
        }
      }

      if (matchedPdf) {
         logger.info(`Fuzzy PDF Match: Resolved "${req.params.filename}" to actual file "${path.basename(matchedPdf)}"`);
         res.contentType('application/pdf');
         return res.sendFile(matchedPdf);
      }
    }

    logger.error(`Document not found anywhere for: ${fileName}`);
    return res.status(404).json({ success: false, error: 'Document file not found' });
  })
);

module.exports = router;
