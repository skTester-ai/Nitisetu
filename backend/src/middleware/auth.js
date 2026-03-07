const jwt = require('jsonwebtoken');
const asyncHandler = require('./errorHandler').asyncHandler;
const User = require('../models/User');
const config = require('../config/env');

// Protect routes
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, config.jwtSecret);

    req.user = await User.findById(decoded.id);

    if (req.user) {
      // Industry Standard: Expose role in header for immediate frontend synchronization
      res.setHeader('X-User-Role', req.user.role);
    }

    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: 'Not authorized to access this route' });
  }
});

// Grant access to specific roles (Hierarchical)
exports.authorize = (...roles) => {
  return (req, res, next) => {
    // Define role priority
    const roleHierarchy = {
      'farmer': 1,
      'admin': 2,
      'superadmin': 3
    };

    const userRoleValue = roleHierarchy[req.user.role] || 0;
    
    // Check if user has ANY of the required roles OR a higher-level role
    const isAuthorized = roles.some(role => {
      const requiredRoleValue = roleHierarchy[role] || 0;
      return userRoleValue >= requiredRoleValue;
    });

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};
