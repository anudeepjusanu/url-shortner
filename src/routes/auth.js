const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const googleAuthController = require("../controllers/googleAuthController");
const { authenticate, optionalAuth } = require("../middleware/auth");
const {
  authLimiter,
  loginLimiter,
  strictAuthLimiter,
  passwordResetLimiter,
  otpVerificationLimiter,
} = require("../middleware/rateLimiter");
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
  sanitizeInput,
} = require("../middleware/validation");

router.use(sanitizeInput);

// Send OTP for email verification during registration
router.post("/check-email", authLimiter, authController.checkEmail);

router.post(
  "/send-registration-otp",
  authLimiter,
  authController.sendRegistrationOTP,
);

// Simplified register without rate limiter for testing
router.post("/register-simple", validateRegistration, authController.register);

router.post(
  "/register",
  authLimiter,
  validateRegistration,
  authController.register,
);

// Own bucket (keyed by email) so login isn't starved by register/OTP/Google
// traffic sharing authLimiter's IP-only pool — see loginLimiter for details.
router.post("/login", loginLimiter, validateLogin, authController.login);

// Phone number OTP login (no password required)
router.post(
  "/login-with-phone",
  loginLimiter,
  validatePhoneLogin,
  authController.loginWithPhoneOtp,
);

router.post("/refresh", authController.refreshToken);

router.post("/logout", authenticate, authController.logout);

router.get("/profile", authenticate, authController.getProfile);

router.put(
  "/profile",
  authenticate,
  validateProfileUpdate,
  authController.updateProfile,
);

router.put(
  "/change-password",
  authenticate,
  validatePasswordChange,
  authController.changePassword,
);

// Also support POST for change-password (frontend compatibility)
router.post(
  "/change-password",
  authenticate,
  validatePasswordChange,
  authController.changePassword,
);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  validateForgotPassword,
  authController.forgotPassword,
);

router.post(
  "/reset-password",
  validateResetPassword,
  authController.resetPassword,
);

router.post(
  "/send-password-reset-otp",
  passwordResetLimiter,
  validateForgotPassword,
  authController.sendPasswordResetOTP,
);

router.post(
  "/verify-password-reset-otp",
  otpVerificationLimiter,
  validateVerifyPasswordResetOTP,
  authController.verifyPasswordResetOTP,
);

router.post(
  "/reset-password-with-otp",
  passwordResetLimiter,
  validateResetPasswordWithOTP,
  authController.resetPasswordWithOTP,
);

router.get("/me", authenticate, authController.getProfile);

// API Key management
router.get("/api-key", authenticate, authController.getApiKey);
router.post(
  "/regenerate-api-key",
  authenticate,
  authController.regenerateApiKey,
);
router.delete("/api-key", authenticate, authController.deleteApiKey);

// User preferences
router.get("/preferences", authenticate, authController.getPreferences);
router.put("/preferences", authenticate, authController.updatePreferences);

// Google OAuth authentication
router.post("/google", authLimiter, googleAuthController.googleAuthenticate);
router.post(
  "/google/send-otp",
  authLimiter,
  googleAuthController.sendGoogleSignupOTP,
);
router.post(
  "/google/verify-otp",
  otpVerificationLimiter,
  googleAuthController.verifyGoogleSignupOTP,
);
router.post(
  "/google/cancel",
  authLimiter,
  googleAuthController.cancelGoogleSignup,
);

// Generic phone OTP (email-based registration flow) - TEMPORARY for India testing
router.post("/phone/send-otp", authLimiter, googleAuthController.sendPhoneOTP);
router.post(
  "/phone/verify-otp",
  otpVerificationLimiter,
  googleAuthController.verifyPhoneOTP,
);

// Delete account
router.delete("/account", authenticate, authController.deleteAccount);

module.exports = router;
