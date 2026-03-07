const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: {
    type: String,
  },
  contactNumber: {
    type: String,
  },
  otp: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
    enum: ['registration', 'password_reset', 'phone_verification'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600, // Automatically delete after 10 minutes (600 seconds)
  },
});

module.exports = mongoose.model('OTP', OTPSchema);
