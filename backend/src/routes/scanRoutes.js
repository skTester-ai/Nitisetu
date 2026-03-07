const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { protect } = require('../middleware/auth');
const llmService = require('../services/llmService');
const logger = require('../config/logger');

// Setup multer to store files temporarily in memory or a temp directory
// Using a temp directory ensures we don't blow up server RAM if multiple large files upload at once
const tempDir = path.join(__dirname, '..', 'tmp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, `scan-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are supported for scanning.'), false);
    }
  }
});

/**
 * @route   POST /api/scan/document
 * @desc    Upload an image (e.g. 7/12 extract or Aadhaar) to auto-extract profile fields.
 *          Strict zero-storage: The image is analyzed and IMMEDIATELY deleted.
 * @access  Private
 */
router.post('/document', protect, upload.single('document'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, error: 'No document image provided.' });
  }

  const filePath = req.file.path;

  try {
    logger.info(`Starting ephemeral scan for user ${req.user.id}, file: ${req.file.filename}`);

    // Read the file as base64 to send to Groq Vision
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString('base64');
    const docType = req.body.documentType || 'Official ID / Land Record';
    const landUnit = req.body.landUnit || 'Hectares';

    // Extract data using our specialized multi-modal LLM
    const extractedData = await llmService.extractProfileFromDocument(base64Image, docType, "self-scan", landUnit);

    logger.info(`Extraction complete for user ${req.user.id}`);

    res.status(200).json({
      success: true,
      data: extractedData,
      message: 'Document scanned successfully. Data extracted.'
    });

  } catch (error) {
    logger.error(`Document scan error for user ${req.user.id}: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to scan and extract data from the document.' });
  } finally {
    // CRITICAL PRIVACY STEP: Always delete the file from the temp directory!
    fs.unlink(filePath, (err) => {
      if (err) {
        logger.error(`CRITICAL: Failed to delete temp file ${filePath}: ${err.message}`);
      } else {
        logger.info(`Temp file ${filePath} securely deleted.`);
      }
    });
  }
});

module.exports = router;
