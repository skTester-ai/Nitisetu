const { body, param, validationResult } = require('express-validator');
const logger = require('../config/logger');

/**
 * Middleware to check validation results and return errors.
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation Error Details:', { errors: errors.array() });
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

/**
 * Validation chain for creating a farmer profile.
 */
const validateProfile = [
  body('age')
    .isInt({ min: 18, max: 120 })
    .withMessage('Age must be an integer between 18 and 120'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 })
    .withMessage('Name must be under 100 characters'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('district').trim().notEmpty().withMessage('District is required'),
  body('subRegion').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Sub-region must be under 100 characters'),
  body('landHolding')
    .isFloat({ min: 0 })
    .withMessage('Land holding must be a positive number (in acres)'),
  body('cropType').trim().notEmpty().withMessage('Crop type is required'),
  body('category')
    .isIn(['General', 'SC', 'ST', 'OBC', 'EWS', 'Minority'])
    .withMessage('Category must be General, SC, ST, OBC, EWS, or Minority'),
  body('annualIncome')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Annual income must be a positive number'),
  body('hasIrrigationAccess')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('hasIrrigationAccess must be true or false'),
  body('gender')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),
  body('hasBPLCard')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('hasBPLCard must be true or false'),
  body('ownershipType')
    .isIn(['Owner', 'Tenant/Sharecropper', 'Co-owner'])
    .withMessage('Ownership must be Owner, Tenant/Sharecropper, or Co-owner'),
  body('hasKcc')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('hasKcc must be true or false'),
  body('isDifferentlyAbled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('isDifferentlyAbled must be true or false'),
  body('hasAadharSeededBank')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('hasAadharSeededBank must be true or false'),
  body('activeSchemes')
    .optional({ nullable: true })
    .isArray()
    .withMessage('activeSchemes must be an array of strings'),
  body('primaryIncomeSource')
    .optional({ nullable: true })
    .isIn(['Agriculture', 'Dairy', 'Poultry', 'Fisheries', 'Horticulture', 'Other'])
    .withMessage('Primary income source must be Agriculture, Dairy, Poultry, Fisheries, Horticulture, or Other'),
  body('isFarmerRelated')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('isFarmerRelated must be true or false'),
  handleValidationErrors,
];

/**
 * Validation chain for eligibility check requests.
 */
const validateEligibilityCheck = [
  body('profileId')
    .trim()
    .notEmpty()
    .withMessage('profileId is required')
    .isMongoId()
    .withMessage('profileId must be a valid MongoDB ObjectId'),
  body('schemeName')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('schemeName must be under 200 characters'),
  handleValidationErrors,
];

/**
 * Validation chain for voice transcript processing.
 */
const validateVoiceTranscript = [
  body('transcript')
    .trim()
    .notEmpty()
    .withMessage('Transcript text is required')
    .isLength({ min: 10, max: 5000 })
    .withMessage('Transcript must be between 10 and 5000 characters'),
  handleValidationErrors,
];

/**
 * Validate MongoDB ObjectId parameter.
 */
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

module.exports = {
  validateProfile,
  validateEligibilityCheck,
  validateVoiceTranscript,
  validateObjectId,
};
