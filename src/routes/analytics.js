const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const { authenticate, authenticateAny } = require("../middleware/auth");
const { checkFeatureAccess } = require("../middleware/roleCheck");
const { apiLimiter } = require("../middleware/rateLimiter");
const {
  validateObjectId,
  validateAnalyticsQuery,
  validateExportQuery,
  sanitizeInput,
} = require("../middleware/validation");

router.use(sanitizeInput);
router.use(authenticateAny); // Accept both Bearer token and API key
router.use(apiLimiter);

router.get(
  "/dashboard",
  validateAnalyticsQuery,
  analyticsController.getDashboardAnalytics,
);

// Registered before /:id/export so "dashboard" in the path isn't swallowed
// by the :id param of that route.
router.get(
  "/dashboard/export",
  checkFeatureAccess("analytics_export"),
  validateExportQuery,
  analyticsController.exportDashboardAnalytics,
);

router.get(
  "/:id/overview",
  validateObjectId,
  validateAnalyticsQuery,
  analyticsController.getUrlOverview,
);

router.get(
  "/:id/devices",
  validateObjectId,
  validateAnalyticsQuery,
  analyticsController.getDeviceAnalytics,
);

router.get(
  "/:id/geographic",
  validateObjectId,
  validateAnalyticsQuery,
  analyticsController.getGeographicAnalytics,
);

router.get(
  "/:id/clicks",
  validateObjectId,
  validateAnalyticsQuery,
  analyticsController.getClickAnalytics,
);

router.get(
  "/:id/export",
  validateObjectId,
  checkFeatureAccess("analytics_export"),
  validateExportQuery,
  analyticsController.exportAnalytics,
);

router.get(
  "/:id",
  validateObjectId,
  validateAnalyticsQuery,
  analyticsController.getUrlAnalytics,
);

module.exports = router;
