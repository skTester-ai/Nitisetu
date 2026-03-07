const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const fs      = require('fs');
const path    = require('path');

const llmService  = require('../services/llmService');
const { asyncHandler }        = require('../middleware/errorHandler');
const { validateVoiceTranscript } = require('../middleware/validators');
const { protect } = require('../middleware/auth');
const logger = require('../config/logger');
const ResourceUsage = require('../models/ResourceUsage');

// ── Make sure uploads dir always exists (absolute path from project root) ──
const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB max
  fileFilter: (req, file, cb) => {
    // Accept any audio/* MIME
    if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/octet-stream') {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`), false);
    }
  },
});

/**
 * POST /api/voice/process
 * Accept a text transcript → extract farmer profile fields via LLM.
 */
router.post(
  '/process',
  protect,
  validateVoiceTranscript,
  asyncHandler(async (req, res) => {
    const { transcript } = req.body;
    logger.info(`Voice process request – transcript length: ${transcript?.length}`);

    const extractedProfile = await llmService.extractProfileFromTranscript(transcript, 'registered');

    const extractedFields = Object.entries(extractedProfile)
      .filter(([, value]) => value !== null && value !== undefined)
      .map(([key]) => key);
    const missingFields = ['name', 'age', 'state', 'district', 'landHolding', 'cropType', 'category']
      .filter((field) => !extractedFields.includes(field));

    res.json({
      success: true,
      data: { extractedProfile, extractedFields, missingFields, isComplete: missingFields.length === 0 },
    });
  })
);

/**
 * POST /api/voice/transcribe
 * Accepts multipart/form-data audio → Groq Whisper → extract profile
 */
router.post(
  '/transcribe',
  protect,
  upload.single('audio'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No audio file provided – send field named "audio"' });
    }

    // Rename temp file with correct extension so Groq can detect format
    const ext     = path.extname(req.file.originalname || 'recording.webm') || '.webm';
    const newPath = req.file.path + ext;
    fs.renameSync(req.file.path, newPath);

    logger.info(`Audio file received: ${req.file.originalname} (${req.file.size} bytes) → ${newPath}`);

    try {
      const { language = 'en' } = req.body;
      const transcript     = await llmService.transcribeAudio(newPath, language, 'registered');
      const extractedProfile = await llmService.extractProfileFromTranscript(transcript, 'registered');

      const extractedFields = Object.entries(extractedProfile)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([k]) => k);
      const missingFields = ['name', 'age', 'state', 'district', 'landHolding', 'cropType', 'category']
        .filter((field) => !extractedFields.includes(field));

      res.json({
        success: true,
        data: { transcript, extractedProfile, extractedFields, missingFields, isComplete: missingFields.length === 0 },
      });
    } catch (err) {
      logger.error('Voice transcribe route error:', err.message);
      // Clean up temp file before re-throwing
      if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
      throw err; // Let asyncHandler convert to 500 with the real message
    } finally {
      // Always clean up (error re-throw goes to asyncHandler, so finally still runs)
      try { if (fs.existsSync(newPath)) fs.unlinkSync(newPath); } catch (_) {}
    }
  })
);

/**
 * POST /api/voice/tts
 * Proxy text to ElevenLabs API and stream back the MP3
 * Added: In-memory LRU caching to heavily save expensive TTS API calls.
 */
const config = require('../config/env');
const axios = require('axios');
const crypto = require('crypto');

// Set up a simple in-memory cache for audio buffers. 
// In a highly-scaled production environment, Redis would replace this.
const ttsCache = new Map();

router.post(
  '/tts',
  asyncHandler(async (req, res) => {
    const { text, language = 'hi' } = req.body;
    if (!text) return res.status(400).json({ success: false, error: 'No text provided' });

    if (!config.elevenlabsApiKey) {
       return res.status(500).json({ success: false, error: 'ElevenLabs API key is not configured' });
    }

    try {
      // 1. Generate a deterministic hash for this specific TTS request
      const cacheKey = crypto.createHash('sha256').update(`${language}:${text}`).digest('hex');

      // 2. Check if we already paid for and translated this exact string
      if (ttsCache.has(cacheKey)) {
        logger.info(`TTS Cache HIT: Serving pre-generated audio for hash ${cacheKey.substring(0,8)}...`);
        res.set({
          'Content-Type': 'audio/mpeg',
          'X-Cache': 'HIT'
        });
        return res.send(ttsCache.get(cacheKey));
      }

      const voiceMapping = {
        'hi': '21m00Tcm4TlvDq8ikWAM', // Rachel (Multi-lingual v2 supports Hindi perfectly)
        'mr': '21m00Tcm4TlvDq8ikWAM', // Rachel (Multi-lingual v2 supports Marathi perfectly)
        'en': '21m00Tcm4TlvDq8ikWAM'  // Rachel
      };
      
      const voiceId = voiceMapping[language] || voiceMapping['en'];
      
      logger.info(`TTS Cache MISS: Generating new audio for language: ${language} using voice: ${voiceId}`);

      const response = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.6,
            similarity_boost: 0.8,
            style: 0.0,
            use_speaker_boost: true
          }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': config.elevenlabsApiKey,
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer' // CRITICAL: Treat download as RAW bits, not string JSON
        }
      );

      // Convert downloaded stream to Buffer
      const buffer = Buffer.from(response.data);

      // Track usage
      const usageCategory = (req.headers.authorization || req.cookies?.token) ? 'registered' : 'public';
      ResourceUsage.recordUsage('ElevenLabs-TTS', text.length, usageCategory).catch(e => logger.error('Usage track error:', e));

      // 3. Save to cache
      ttsCache.set(cacheKey, buffer);
      
      // Limit memory cache to roughly the last 500 requests to prevent memory leaks
      if (ttsCache.size > 500) {
        const firstKey = ttsCache.keys().next().value;
        ttsCache.delete(firstKey);
      }

      res.set({
        'Content-Type': 'audio/mpeg',
        'X-Cache': 'MISS'
      });

      // Send the audio buffer back to the client
      res.send(buffer);

    } catch (err) {
      logger.error('TTS route error detail:', {
        message: err.message,
        stack: err.stack,
        textSnippet: text?.substring(0, 50),
        language
      });
      
      // If axios error, get response detail
      if (err.response && err.response.data) {
        try {
          const errorDetail = JSON.parse(Buffer.from(err.response.data).toString());
          logger.error('ElevenLabs API Error Detail:', errorDetail);
        } catch (e) {
          logger.error('Could not parse ElevenLabs error detail');
        }
      }

      res.status(500).json({ 
        success: false, 
        error: err.message || 'Failed to generate speech audio',
        detail: err.response?.data ? 'ElevenLabs API reported an error' : 'Internal processing error'
      });
    }
  })
);


module.exports = router;
