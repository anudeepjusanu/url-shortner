const { body, param, query, validationResult } = require('express-validator');
const { validateUrl } = require('../utils/urlValidator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please enter a valid email'),
  handleValidationErrors
];

const validateResetPassword = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

const validateUrlCreation = [
  body('originalUrl')
    .custom((value) => {
      const validation = validateUrl(value);
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      return true;
    }),
  body('customCode')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Custom code must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Custom code can only contain letters, numbers, hyphens, and underscores'),
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiration date must be in the future');
      }
      return true;
    }),
  body('password')
    .optional()
    .isLength({ min: 4, max: 100 })
    .withMessage('Password must be between 4 and 100 characters'),
  body('redirectType')
    .optional()
    .isIn([301, 302, 307])
    .withMessage('Redirect type must be 301, 302, or 307'),
  handleValidationErrors
];

const validateUrlUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Each tag must be between 1 and 30 characters'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('password')
    .optional()
    .isLength({ min: 4, max: 100 })
    .withMessage('Password must be between 4 and 100 characters'),
  body('redirectType')
    .optional()
    .isIn([301, 302, 307])
    .withMessage('Redirect type must be 301, 302, or 307'),
  handleValidationErrors
];

const validateBulkDelete = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs array is required and must contain at least one ID'),
  body('ids.*')
    .isMongoId()
    .withMessage('Each ID must be a valid MongoDB ObjectId'),
  handleValidationErrors
];

const validateProfileUpdate = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('preferences.defaultExpiration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Default expiration must be a positive integer'),
  body('preferences.allowAnalytics')
    .optional()
    .isBoolean()
    .withMessage('Allow analytics must be a boolean'),
  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),
  handleValidationErrors
];

const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'clickCount', 'title'])
    .withMessage('Sort by must be one of: createdAt, updatedAt, clickCount, title'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be either asc or desc'),
  handleValidationErrors
];

const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d'])
    .withMessage('Period must be one of: 7d, 30d, 90d'),
  query('groupBy')
    .optional()
    .isIn(['day', 'hour'])
    .withMessage('Group by must be either day or hour'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  handleValidationErrors
];

const validateExportQuery = [
  query('format')
    .optional()
    .isIn(['json', 'csv'])
    .withMessage('Format must be either json or csv'),
  query('period')
    .optional()
    .isIn(['7d', '30d', '90d'])
    .withMessage('Period must be one of: 7d, 30d, 90d'),
  handleValidationErrors
];

const validateAdminUserUpdate = [
  body('role')
    .optional()
    .isIn(['user', 'admin', 'premium'])
    .withMessage('Role must be one of: user, admin, premium'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('limits.monthlyUrls')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Monthly URLs limit must be a non-negative integer'),
  body('limits.analyticsRetention')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Analytics retention must be a positive integer'),
  handleValidationErrors
];

const validateDomain = [
  body('domain')
    .notEmpty()
    .withMessage('Domain name is required')
    .matches(/^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/)
    .withMessage('Invalid domain format'),
  body('subdomain')
    .optional()
    .matches(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/)
    .withMessage('Invalid subdomain format'),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  handleValidationErrors
];

const validateDomainUpdate = [
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
  body('configuration.redirectType')
    .optional()
    .isIn([301, 302, 307])
    .withMessage('Redirect type must be 301, 302, or 307'),
  body('configuration.allowWildcard')
    .optional()
    .isBoolean()
    .withMessage('Allow wildcard must be a boolean'),
  handleValidationErrors
];

const sanitizeInput = (req, res, next) => {
  const sanitizeObject = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
        if (obj[key] === '') {
          obj[key] = undefined;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitizeObject(obj[key]);
      }
    }
  };

  if (req.body) sanitizeObject(req.body);
  if (req.query) sanitizeObject(req.query);
  if (req.params) sanitizeObject(req.params);

  next();
};

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateForgotPassword,
  validateResetPassword,
  validateUrlCreation,
  validateUrlUpdate,
  validateBulkDelete,
  validateProfileUpdate,
  validateObjectId,
  validatePagination,
  validateAnalyticsQuery,
  validateExportQuery,
  validateAdminUserUpdate,
  validateDomain,
  validateDomainUpdate,
  sanitizeInput
};