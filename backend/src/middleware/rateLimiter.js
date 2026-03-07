const rateLimit = require('express-rate-limit');

/**
 * General rate limiter: 500 requests per 15 minutes per IP.
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: {
    success: false,
    error: 'Too many requests. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Eligibility check rate limiter: 60 requests per 15 minutes per IP.
 * Stricter because each request hits LLM + vector search.
 */
const eligibilityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    error: 'Too many eligibility checks. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Upload rate limiter: 5 uploads per 15 minutes per IP.
 */
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many uploads. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Public checking rate limiter: Extremely strict limit for unauthenticated users.
 * 1 check per hour per IP.
 */
const publicEligibilityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1,
  message: {
    success: false,
    error: 'You have reached the maximum number of free checks (1). To prevent spam, please log in or register to continue checking schemes.',
    requiresLogin: true
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { generalLimiter, eligibilityLimiter, uploadLimiter, publicEligibilityLimiter };
