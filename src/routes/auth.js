const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authLimiter, strictAuthLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validatePhoneLogin,
  validatePasswordChange,
  validateForgotPassword,
  validateResetPassword,
  validateVerifyPasswordResetOTP,
  validateResetPasswordWithOTP,
  validateProfileUpdate,
  sanitizeInput
} = require('../middleware/validation');

router.use(sanitizeInput);

// Send OTP for email verification during registration
router.post('/send-registration-otp', authLimiter, authController.sendRegistrationOTP);

// Simplified register without rate limiter for testing
router.post('/register-simple', validateRegistration, authController.register);

router.post('/register', authLimiter, validateRegistration, authController.register);

// Temporarily disable strict rate limiter for debugging
router.post('/login', authLimiter, validateLogin, authController.login);

// Phone number OTP login (no password required)
router.post('/login-with-phone', authLimiter, validatePhoneLogin, authController.loginWithPhoneOtp);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authenticate, authController.logout);

router.get('/profile', authenticate, authController.getProfile);

router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);

router.put('/change-password', authenticate, validatePasswordChange, authController.changePassword);

// Also support POST for change-password (frontend compatibility)
router.post('/change-password', authenticate, validatePasswordChange, authController.changePassword);

router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, authController.forgotPassword);

router.post('/reset-password', validateResetPassword, authController.resetPassword);

router.post('/send-password-reset-otp', passwordResetLimiter, validateForgotPassword, authController.sendPasswordResetOTP);

router.post('/verify-password-reset-otp', validateVerifyPasswordResetOTP, authController.verifyPasswordResetOTP);

router.post('/reset-password-with-otp', validateResetPasswordWithOTP, authController.resetPasswordWithOTP);

router.get('/me', authenticate, authController.getProfile);

// API Key management
router.get('/api-key', authenticate, authController.getApiKey);
router.post('/regenerate-api-key', authenticate, authController.regenerateApiKey);

// User preferences
router.get('/preferences', authenticate, authController.getPreferences);
router.put('/preferences', authenticate, authController.updatePreferences);

// Delete account
router.delete('/account', authenticate, authController.deleteAccount);

module.exports = router;