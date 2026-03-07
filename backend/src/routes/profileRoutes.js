const express = require('express');
const router = express.Router();

const FarmerProfile = require('../models/FarmerProfile');
const EligibilityCheck = require('../models/EligibilityCheck');
const User = require('../models/User'); // Import User for email retrieval
const { asyncHandler } = require('../middleware/errorHandler');
const { validateProfile, validateObjectId } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const logger = require('../config/logger');

/**
 * POST /api/profiles
 * Create a new farmer profile with validation.
 */
router.post(
  '/',
  protect,
  validateProfile,
  asyncHandler(async (req, res) => {
    const profileData = {
      name: req.body.name,
      age: req.body.age,
      state: req.body.state,
      district: req.body.district,
      subRegion: req.body.subRegion || '',
      landHolding: req.body.landHolding,
      cropType: req.body.cropType,
      category: req.body.category,
      annualIncome: req.body.annualIncome || null,
      hasIrrigationAccess: req.body.hasIrrigationAccess || false,
      gender: req.body.gender,
      hasBPLCard: req.body.hasBPLCard || false,
      ownershipType: req.body.ownershipType,
      hasKcc: req.body.hasKcc || false,
      isDifferentlyAbled: req.body.isDifferentlyAbled || false,
      hasAadharSeededBank: req.body.hasAadharSeededBank || false,
      activeSchemes: req.body.activeSchemes || [],
      primaryIncomeSource: req.body.primaryIncomeSource || 'Agriculture',
      isFarmerRelated: req.body.isFarmerRelated !== undefined ? req.body.isFarmerRelated : true,
      userId: req.user.id,
    };

    const profile = await FarmerProfile.create(profileData);

    res.status(201).json({
      success: true,
      data: profile,
    });
  })
);

/**
 * GET /api/profiles
 * List all active farmer profiles.
 */
router.get(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = { isActive: true };
    if (req.user.role === 'farmer') {
      query.userId = req.user.id;
    }

    const [profiles, total] = await Promise.all([
      FarmerProfile.find(query)
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FarmerProfile.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: profiles.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      data: profiles,
    });
  })
);

/**
 * GET /api/profiles/:id
 * Get a single farmer profile.
 */
router.get(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const query = { _id: req.params.id };
    if (req.user.role === 'farmer') {
      query.userId = req.user.id;
    }
    const profile = await FarmerProfile.findOne(query).select('-__v').lean();

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  })
);

/**
 * PUT /api/profiles/:id
 * Update a farmer profile.
 */
router.put(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const allowedFields = [
      'name', 'age', 'state',      'district', 'subRegion', 'landHolding',
      'cropType', 'category', 'annualIncome', 'hasIrrigationAccess',
      'gender', 'hasBPLCard', 'ownershipType', 'hasKcc', 'isDifferentlyAbled', 'hasAadharSeededBank', 'activeSchemes', 'primaryIncomeSource', 'isFarmerRelated'
    ];

    const updateData = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const query = { _id: req.params.id };
    if (req.user.role === 'farmer') {
      query.userId = req.user.id;
    }

    const profile = await FarmerProfile.findOneAndUpdate(
      query,
      updateData,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    res.json({ success: true, data: profile });
  })
);

/**
 * DELETE /api/profiles/:id
 * Delete a farmer profile and all associated eligibility checks.
 */
router.delete(
  '/:id',
  protect,
  validateObjectId,
  asyncHandler(async (req, res) => {
    const profile = await FarmerProfile.findById(req.params.id).populate('userId', 'email name');

    if (!profile) {
      return res.status(404).json({ success: false, error: 'Profile not found' });
    }

    if (req.user.role === 'farmer') {
      if (!profile.userId || profile.userId._id.toString() !== req.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized to delete this profile' });
      }
    }

    const userEmail = profile.userId?.email;
    const userName = profile.name || req.user.name;

    // Delete associated eligibility checks first
    await EligibilityCheck.deleteMany({ farmerId: req.params.id });
    
    // Delete the profile
    await FarmerProfile.findByIdAndDelete(req.params.id);

    // Send security email if deleted by admin/superadmin
    if (userEmail && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
      try {
        const emailContent = `
          <h2 style="color: #991b1b; margin-top: 0;">Profile Security Termination</h2>
          <p>Dear <strong>${userName}</strong>,</p>
          
          <p>This is an official notice that your Niti-Setu farmer profile has been <strong>deleted</strong> by the system administration effective immediately.</p>
          
          <div style="background-color: #fee2e2; border-left: 4px solid #b91c1c; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #991b1b; font-weight: 600;">Status: Mandatory Account Action</p>
            <p style="margin: 5px 0 0; font-size: 14px; color: #7f1d1d;">
              Regulatory Basis: <strong>Information Technology Act, 2000 (India)</strong> & Associated Cyber Laws
            </p>
          </div>
          
          <p>As per Niti-Setu's security framework, the administration holds the authority to remove accounts that are flagged during routine audits for potential <strong>security vulnerabilities, malicious patterns, or compliance violations</strong>.</p>
          
          <p>This measure is taken to maintain the integrity of the Digital India agricultural ecosystem and prevent unauthorized data manipulation.</p>
          
          <h3 style="color: #334155; font-size: 16px;">Formal Appeal Process</h3>
          <p>If you wish to contest this deletion, you must file a formal appeal within 7 business days. Please reply to this email or send a detailed clarification to: 
          <a href="mailto:patil.abhay214@gmail.com" style="color: #166534; font-weight: 600; text-decoration: none;">patil.abhay214@gmail.com</a></p>
          
          <p style="font-size: 13px; color: #64748b; font-style: italic;">
            Note: System-level terminations are irreversible without formal verification. New registration attempts with the same credentials may be subject to additional verification.
          </p>
          
          <p>Regards,<br><strong>Security Operations Center</strong><br>Niti-Setu Systems</p>
        `;

        await sendEmail({
          email: userEmail,
          subject: "Security Notification: Profile Termination (IT Act Compliance)",
          html: emailContent
        });
      } catch (emailErr) {
        logger.error('Failed to send deletion notice email:', emailErr);
      }
    }

    res.json({ success: true, data: { message: 'Profile and history deleted successfully' } });
  })
);

module.exports = router;
