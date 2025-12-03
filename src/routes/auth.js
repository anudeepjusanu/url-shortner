const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { authLimiter, strictAuthLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateForgotPassword,
  validateResetPassword,
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
router.post('/login', validateLogin, authController.login);

router.post('/refresh', authController.refreshToken);

router.post('/logout', authenticate, authController.logout);

router.get('/profile', authenticate, authController.getProfile);

router.put('/profile', authenticate, validateProfileUpdate, authController.updateProfile);

router.put('/change-password', authenticate, validatePasswordChange, authController.changePassword);

router.post('/forgot-password', passwordResetLimiter, validateForgotPassword, authController.forgotPassword);

router.post('/reset-password', validateResetPassword, authController.resetPassword);

router.get('/me', authenticate, authController.getProfile);

module.exports = router;