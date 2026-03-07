const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { asyncHandler } = require('../middleware/errorHandler');
const config = require('../config/env');
const logger = require('../config/logger');
const { protect, authorize } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');
const { OAuth2Client } = require('google-auth-library');
const { sendWhatsAppOTP } = require('../services/whatsappService');

const client = new OAuth2Client(config.googleClientId);

/**
 * POST /api/auth/send-otp
 * Generate and send OTP for registration or password reset
 */
router.post(
  '/send-otp',
  asyncHandler(async (req, res) => {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ success: false, error: 'Please provide email and purpose' });
    }

    // If purpose is registration, check if user already exists
    if (purpose === 'registration') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ success: false, error: 'An account with this email already exists. Please log in instead.' });
      }
    }

    // If purpose is password reset, check if user exists
    if (purpose === 'password_reset') {
      const existingUser = await User.findOne({ email });
      if (!existingUser) {
        return res.status(404).json({ success: false, error: 'No account found with this email address. Please register first.' });
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in DB
    await OTP.findOneAndUpdate(
      { email, purpose },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send Email
    try {
      const subject = purpose === 'registration' ? 'Verification Code for Registration' : 'Password Reset Code';
      const action = purpose === 'registration' ? 'your account registration' : 'resetting your password';
      
      await sendEmail({
        email,
        subject,
        html: `
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px;">Action Required: Verification Code</h2>
          <p style="margin: 0 0 32px; color: #475569; font-size: 16px;">To proceed with <strong>${action}</strong> on the Niti-Setu portal, please use the secure 6-digit verification code provided below. This code is unique to your current request.</p>
          
          <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 20px; padding: 40px; text-align: center; margin-bottom: 32px;">
            <div style="font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 16px;">Your Secure Code</div>
            <div style="font-size: 48px; font-weight: 800; letter-spacing: 16px; color: #166534; font-family: 'Courier New', Courier, monospace; margin-left: 16px;">${otp}</div>
          </div>

          <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; color: #92400e;">
              <strong>Security Protocol:</strong> This code is valid for 10 minutes. Do not share this code with anyone. Niti-Setu representatives will never ask for your code via phone or chat.
            </p>
          </div>

          <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.5;">
            If you did not initiate this request, no further action is required. Your account remains secure.
          </p>
        `
      });

      res.status(200).json({ success: true, message: 'OTP sent to email' });
    } catch (err) {
      logger.error('OTP email could not be sent', err);
      return res.status(500).json({ success: false, error: 'Email could not be sent' });
    }
  })
);

// Helper to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign({ id: user._id }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      contactNumber: user.contactNumber,
      isPhoneVerified: user.isPhoneVerified,
      activeSchemes: user.activeSchemes,
    }
  });
};

/**
 * POST /api/auth/register
 * Register a new farmer with OTP
 */
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password, otp, contactNumber } = req.body;

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, purpose: 'registration' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    // Create user (Force role to farmer, admins must be created manually in DB)
    const userData = {
      name,
      email,
      password,
      role: 'farmer',
    };

    // Save contactNumber if provided during registration
    if (contactNumber) {
      userData.contactNumber = contactNumber;
    }

    const user = await User.create(userData);

    // Delete OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Send Welcome Email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Welcome to Niti-Setu Intelligence',
        html: `
          <div style="font-family: 'Inter', sans-serif; width: 100%; max-width: 600px; margin: 0 auto; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0;">
            <div style="background: linear-gradient(135deg, #065f46 0%, #166534 100%); padding: 40px 20px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Protocol Initiated</h1>
            </div>
            
            <div style="padding: 32px 20px; background: #ffffff;">
              <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 22px; font-weight: 800;">Welcome, ${user.name.split(' ')[0]}</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 24px; font-size: 15px;">
                Your account has been successfully provisioned within the Niti-Setu ecosystem. You now have full jurisdictional access to our AI-powered agricultural intelligence suite.
              </p>
              
              <div style="margin-bottom: 30px;">
                <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 16px; border-radius: 12px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 4px; color: #166534; font-size: 14px; font-weight: 700;">Scheme Matching</h4>
                  <p style="margin: 0; font-size: 13px; color: #166534; opacity: 0.8;">Automated discovery of government incentives tailored to your profile.</p>
                </div>
                <div style="background-color: #f0fdf4; border: 1px solid #dcfce7; padding: 16px; border-radius: 12px; margin-bottom: 12px;">
                  <h4 style="margin: 0 0 4px; color: #166534; font-size: 14px; font-weight: 700;">Krishi Mitra</h4>
                  <p style="margin: 0; font-size: 13px; color: #166534; opacity: 0.8;">24/7 agricultural AI assistant for real-time problem solving.</p>
                </div>
              </div>
 
              <div style="text-align: center;">
                <a href="${config.frontendUrl}/dashboard" style="background-color: #166534; color: #ffffff; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 800; display: inline-block; width: 100%; box-sizing: border-box;">Explore Dashboard</a>
              </div>
            </div>
          </div>
        `
      });
    } catch (err) {
      logger.error('Welcome email could not be sent', err);
    }

    sendTokenResponse(user, 201, res);
  })
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please provide an email and password' });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  })
);

/**
 * GET /api/auth/me
 * Get current logged in user
 */
router.get(
  '/me',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

/**
 * PUT /api/auth/updatedetails
 * Update user details (Name, Email)
 */
router.put(
  '/updatedetails',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id);
    
    // If phone changes, it must be re-verified
    if (req.body.contactNumber && req.body.contactNumber !== user.contactNumber) {
        user.isPhoneVerified = false;
        user.contactNumber = req.body.contactNumber;
    }
    
    user.name = req.body.name || user.name;
    user.email = req.body.email || user.email;
    user.activeSchemes = req.body.activeSchemes || user.activeSchemes;

    await user.save({ runValidators: true });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Security Alert: Profile Updated',
        html: `
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px;">Security Alert: Profile Update</h2>
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">Hello, ${user.name}. This is an automated security notification to inform you that several attributes of your Niti-Setu profile (Name/Email) have been modified.</p>
          
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Suspicious Activity?</p>
            <p style="margin: 0; font-size: 15px; color: #b91c1c; line-height: 1.5;">
              If you did not authorize this change, your account security may be at risk. Please contact our security operations center immediately or reset your credentials.
            </p>
          </div>
        `
      });
    } catch (err) {
      logger.error('Profile update email could not be sent', err);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  })
);

/**
 * PUT /api/auth/updatepassword
 * Update password
 */
router.put(
  '/updatepassword',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    user.password = req.body.newPassword;
    await user.save();

    try {
      await sendEmail({
        email: user.email,
        subject: 'Security Alert: Password Changed',
        html: `
          <h2 style="color: #0f172a; font-size: 24px; font-weight: 800; margin: 0 0 16px;">Security Alert: Password Changed</h2>
          <p style="margin: 0 0 24px; color: #475569; font-size: 16px;">Hello, ${user.name}. We are writing to confirm that the security credentials (password) for your Niti-Setu account were successfully changed.</p>
          
          <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 16px; padding: 24px; margin-bottom: 32px;">
            <p style="margin: 0; font-size: 14px; font-weight: 700; color: #9f1239; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">Critical Alert</p>
            <p style="margin: 0; font-size: 15px; color: #b91c1c; line-height: 1.5;">
              This is a high-priority security event. If this password reset was not performed by you, please take immediate steps to secure your account.
            </p>
          </div>
        `
      });
    } catch (err) {
      logger.error('Password update email could not be sent', err);
    }

    sendTokenResponse(user, 200, res);
  })
);


/**
 * PUT /api/auth/resetpassword
 * Reset password with OTP
 */
router.put(
  '/resetpassword',
  asyncHandler(async (req, res) => {
    const { email, otp, password } = req.body;

    // Verify OTP
    const otpRecord = await OTP.findOne({ email, otp, purpose: 'password_reset' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Set new password
    user.password = password;
    await user.save();

    sendTokenResponse(user, 200, res);
  })
);

/**
 * POST /api/auth/send-whatsapp-otp
 * Generate and send OTP via WhatsApp for phone verification
 */
router.post(
  '/send-whatsapp-otp',
  protect,
  asyncHandler(async (req, res) => {
    const { contactNumber } = req.body;

    if (!contactNumber) {
      return res.status(400).json({ success: false, error: 'Please provide a WhatsApp number' });
    }

    // Clean number and ensure it starts with +91 and has 10 digits after it
    let cleanNumber = contactNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) {
      cleanNumber = '+91' + cleanNumber;
    } else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) {
      cleanNumber = '+' + cleanNumber;
    } else {
      return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
    }

    // Check if number is taken by someone else
    const existing = await User.findOne({ contactNumber: cleanNumber, _id: { $ne: req.user.id } });
    if (existing) {
      return res.status(400).json({ success: false, error: 'This number is already registered to another account.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save/Update OTP in DB
    await OTP.findOneAndUpdate(
      { contactNumber: cleanNumber, purpose: 'phone_verification' },
      { otp, createdAt: Date.now() },
      { upsert: true, new: true }
    );

    // Send WhatsApp OTP
    await sendWhatsAppOTP(cleanNumber, otp);
    
    res.status(200).json({ success: true, message: 'Verification code sent to WhatsApp', formattedNumber: cleanNumber });
  })
);

/**
 * POST /api/auth/verify-whatsapp-otp
 * Verify WhatsApp OTP and update user's verification status
 */
router.post(
  '/verify-whatsapp-otp',
  protect,
  asyncHandler(async (req, res) => {
    const { contactNumber, otp } = req.body;

    if (!contactNumber || !otp) {
      return res.status(400).json({ success: false, error: 'Please provide number and code' });
    }

    // Clean number for verification
    let cleanNumber = contactNumber.replace(/\D/g, '');
    if (cleanNumber.length === 10) cleanNumber = '+91' + cleanNumber;
    else if (cleanNumber.length === 12 && cleanNumber.startsWith('91')) cleanNumber = '+' + cleanNumber;

    // Verify OTP record
    const otpRecord = await OTP.findOne({ contactNumber: cleanNumber, otp, purpose: 'phone_verification' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
    }

    // Update User
    const user = await User.findById(req.user.id);
    user.contactNumber = cleanNumber; // Save the cleaned number
    user.isPhoneVerified = true;
    await user.save();

    // Delete OTP
    await OTP.deleteOne({ _id: otpRecord._id });

    res.status(200).json({ 
      success: true, 
      message: 'Phone number verified successfully!',
      data: {
        contactNumber: user.contactNumber,
        isPhoneVerified: user.isPhoneVerified
      }
    });
  })
);

/**
 * POST /api/auth/google
 * Authenticate with Google OAuth ID Token
 */
router.post(
  '/google',
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    
    // Verify the Google ID Token
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: config.googleClientId,  
    });
    
    const payload = ticket.getPayload();
    const { email, name, sub: googleId } = payload;
    
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // If user doesn't exist, create a new Farmer account seamlessly
      // We generate a secure random password since they use Google
      const randomPassword = crypto.randomBytes(16).toString('hex') + 'A1!'; // ensure it passes the regex
      user = await User.create({
        name: name,
        email: email,
        password: randomPassword,
        role: 'farmer'
      });
    }
    
    // Send standard JWT
    sendTokenResponse(user, 200, res);
  })
);

/**
 * GET /api/auth/users
 * Get all registered users (Admin only)
 */
router.get(
  '/users',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const users = await User.find({}).select('-password').sort('-createdAt');
    res.status(200).json({ success: true, data: users });
  })
);

/**
 * DELETE /api/auth/users/:id
 * Delete a user account (Admin only)
 */
router.delete(
  '/users/:id',
  protect,
  authorize('admin'),
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Prevent admin from deleting themselves (safety)
    if (user.id === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own admin account' });
    }

    await user.deleteOne();

    res.status(200).json({ success: true, message: 'User deleted successfully' });
  })
);

/**
 * @desc    Update user role (Super Admin only)
 * @route   PUT /api/auth/users/:id/role
 * @access  Private/SuperAdmin
 */
router.put(
  '/users/:id/role',
  protect,
  authorize('superadmin'),
  asyncHandler(async (req, res) => {
    const { role: targetRole } = req.body;
    
    logger.info(`[AUTH] Jurisdictional Update Request - User: ${req.params.id}, Target Tier: ${targetRole}`);

    if (!targetRole) {
      return res.status(400).json({ success: false, error: 'Protocol violation: Target role tier not specified.' });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Entity trace failed: User not found in central directory.' });
    }

    // Conflict Check: Prevent redundant assignments
    if (user.role === targetRole) {
      return res.status(400).json({ success: false, error: `Conflict Detected: User is already provisioned as ${targetRole}.` });
    }

    // Prevent downgrading/modifying the primary super admin
    if (user.email === 'admin@nitisetu.gov.in') {
      return res.status(400).json({ 
        success: false, 
        error: 'Authorization Breach: The primary system orchestrator cannot be modified by external protocols.' 
      });
    }

    // Single Orchestrator Policy: Only admin@nitisetu.gov.in can be superadmin
    if (targetRole === 'superadmin' && user.email !== 'admin@nitisetu.gov.in') {
      return res.status(400).json({ 
        success: false, 
        error: 'Strategic Violation: The Central Orchestrator tier is reserved exclusively for the primary system account.' 
      });
    }

    const oldRole = user.role;
    const roleRanks = { superadmin: 3, admin: 2, farmer: 1 };
    const currentRank = roleRanks[oldRole] || 0;
    const targetRank = roleRanks[targetRole] || 0;
    const isUpgrade = targetRank > currentRank;

    // Persist calibration
    try {
      user.role = targetRole;
      await user.save();
      logger.info(`[AUTH] System Calibration Success: ${user.email} -> ${targetRole}`);
    } catch (saveErr) {
      logger.error('[AUTH] Calibration Error:', saveErr.message);
      return res.status(500).json({ success: false, error: 'Systemic failure during database persistence.' });
    }

    // Send Detailed Jurisdictional Notification
    try {
      const subject = isUpgrade 
        ? 'Security Protocol: Administrative Elevation' 
        : 'Jurisdictional Realignment Notice';
      
      const roleDetails = {
        superadmin: {
          title: 'Central System Orchestrator',
          desc: 'Primary authority for platform governance and administrative orchestration.'
        },
        admin: {
          title: 'Regional Administrator',
          desc: 'Managed authority over localized schemes, demographics, and intelligence pipelines.'
        },
        farmer: {
          title: 'Field Integrity Partner',
          desc: 'Standard jurisdictional access focusing on personalized agricultural intelligence.'
        }
      };

      const selected = roleDetails[targetRole] || { title: targetRole, desc: `Your access permissions have been recalibrated to the ${targetRole} tier.` };
      const former = roleDetails[oldRole] || { title: oldRole };

      await sendEmail({
        email: user.email,
        subject: subject,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Arial, sans-serif; width: 100%; max-width: 600px; margin: 0 auto; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; background-color: #ffffff;">
            <div style="background: ${isUpgrade ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : '#fff1f2'}; padding: 40px 20px; text-align: center; border-bottom: 2px solid ${isUpgrade ? '#334155' : '#fecaca'};">
              <h1 style="color: ${isUpgrade ? '#ffffff' : '#991b1b'}; margin: 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Authority Status Modified</h1>
            </div>
            
            <div style="padding: 32px 20px;">
              <h2 style="color: #0f172a; margin: 0 0 16px; font-size: 22px; font-weight: 700;">Hello, ${user.name}</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 24px; font-size: 15px;">
                This formal notification confirms a <strong>jurisdictional shift</strong> in your operational authority within the Niti-Setu ecosystem.
              </p>
              
              <div style="display: flex; gap: 10px; margin-bottom: 24px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 140px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; text-align: center;">
                  <span style="display: block; font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; font-weight: 800;">Former Tier</span>
                  <span style="color: #64748b; font-weight: 700; font-size: 13px;">${former.title}</span>
                </div>
                <div style="display: flex; align-items: center; color: #94a3b8; padding: 0 5px;">&rarr;</div>
                <div style="flex: 1; min-width: 140px; background: ${isUpgrade ? '#f0fdf4' : '#fff1f2'}; border: 1px solid ${isUpgrade ? '#bcf0da' : '#fecaca'}; padding: 16px; border-radius: 12px; text-align: center;">
                  <span style="display: block; font-size: 10px; color: ${isUpgrade ? '#166534' : '#991b1b'}; text-transform: uppercase; margin-bottom: 4px; font-weight: 800;">New Jurisdiction</span>
                  <span style="color: ${isUpgrade ? '#15803d' : '#dc2626'}; font-weight: 700; font-size: 14px;">${selected.title}</span>
                </div>
              </div>

              <div style="background-color: #f8fafc; border-left: 4px solid ${isUpgrade ? '#6366f1' : '#f43f5e'}; padding: 20px; border-radius: 4px 12px 12px 4px; margin-bottom: 30px;">
                <h4 style="margin: 0 0 8px; color: #1e293b; font-size: 15px; font-weight: 800;">Mandatory Protocol Impact:</h4>
                <p style="margin: 0; font-size: 14px; color: #475569; line-height: 1.5;">${selected.desc}</p>
              </div>
 
              <div style="text-align: center;">
                <a href="${config.frontendUrl}/dashboard" style="background-color: #0f172a; color: #ffffff; padding: 16px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block; width: 100%; box-sizing: border-box;">Access platform</a>
              </div>
            </div>
            
            <div style="padding: 24px; background: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #94a3b8; font-size: 11px; margin: 0;">
                System Signature: NS-IDENTITY-SECURE &bull; Audited by Central Command &bull; ${new Date().toUTCString()}
              </p>
            </div>
          </div>
        `
      });
      logger.info(`[AUTH] Notification dispatched to ${user.email}`);
    } catch (emailErr) {
      logger.error('[AUTH] Jurisdictional email failed:', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: `User protocol successfully updated to ${targetRole} tier. Notification dispatched.`,
      data: user
    });
  })
);

/**
 * POST /api/auth/admins
 * Create a new admin or superadmin (Super Admin only)
 * Access: Private (Super Admin)
 */
router.post(
  '/admins',
  protect,
  authorize('superadmin'),
  asyncHandler(async (req, res) => {
    const { name, email, role } = req.body;

    if (!name || !email || !role) {
      return res.status(400).json({ success: false, error: 'Please provide name, email and role' });
    }

    if (!['admin', 'superadmin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid admin role tier.' });
    }

    // Single Orchestrator Policy: Only admin@nitisetu.gov.in can be superadmin
    if (role === 'superadmin' && email !== 'admin@nitisetu.gov.in') {
      return res.status(400).json({ 
        success: false, 
        error: 'Strategic Violation: The Central Orchestrator tier is reserved exclusively for the primary system account.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'User already exists' });
    }

    // Generate a secure temporary password
    const tempPassword = crypto.randomBytes(12).toString('hex') + 'A1!';

    // Create Admin
    const user = await User.create({
      name,
      email,
      password: tempPassword,
      role
    });

    // Send welcome email with instructions
    try {
      await sendEmail({
        email: user.email,
        subject: 'Niti-Setu Administrative Onboarding',
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em;">Admin Provisioning</h1>
            </div>
            <div style="padding: 40px; background-color: #ffffff;">
              <h2 style="color: #0f172a; margin: 0 0 20px; font-size: 20px; font-weight: 700;">Welcome to the Orchestration Team, ${user.name}</h2>
              <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
                You have been provisioned with <strong>${role.toUpperCase()}</strong> access to the Niti-Setu platform. Your account is now active and ready for governance.
              </p>
              
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 25px; margin-bottom: 30px;">
                <p style="margin: 0 0 10px; font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase;">Login Credentials</p>
                <p style="margin: 5px 0; color: #1e293b;"><strong>Email:</strong> ${user.email}</p>
                <p style="margin: 5px 0; color: #1e293b;"><strong>Temp Password:</strong> <code style="background-color: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${tempPassword}</code></p>
              </div>

              <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 10px; font-size: 14px; color: #92400e;">Security Mandate:</h3>
                <p style="margin: 0; font-size: 14px; color: #78350f; line-height: 1.5;">
                  Upon your first login, you are <strong>required</strong> to navigate to Settings and reset your password to a private, high-entropy unique credential.
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${config.frontendUrl}/login" style="background-color: #0f172a; color: #ffffff; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; display: inline-block;">Access Admin Console</a>
              </div>

              <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 40px 0;">
              
              <p style="color: #94a3b8; font-size: 12px; line-height: 1.6; text-align: center;">
                This account was provisioned by the Central Super Admin. If you have any questions regarding your access level or jurisdictional responsibilities, please refer to the internal Ops Guide.
              </p>
            </div>
          </div>
        `
      });
    } catch (err) {
      logger.error('Provisioning email failed:', err);
    }

    res.status(201).json({
      success: true,
      message: `${role} account provisioned successfully. Instructions sent to ${email}`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  })
);

module.exports = router;
