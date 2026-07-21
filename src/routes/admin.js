const express = require("express");
const router = express.Router();

const adminController = require("../controllers/adminController");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { bypassLimiter } = require("../middleware/rateLimiter");
const {
  validateObjectId,
  validatePagination,
  validateAdminUserUpdate,
  validateAdminOrgUpdate,
  sanitizeInput,
} = require("../middleware/validation");

router.use(sanitizeInput);
router.use(authenticate);
router.use(requireAdmin);
router.use(bypassLimiter);

router.get("/stats", adminController.getSystemStats);

router.get("/users", validatePagination, adminController.getUsers);
router.put(
  "/users/:id",
  validateObjectId,
  validateAdminUserUpdate,
  adminController.updateUser,
);
router.delete("/users/:id", validateObjectId, adminController.deleteUser);
router.post("/users/bulk-delete", adminController.bulkDeleteUsers);

router.get("/urls", validatePagination, adminController.getAllUrls);
router.put("/urls/:id", validateObjectId, adminController.updateUrl);
router.put(
  "/urls/:id/moderation",
  validateObjectId,
  adminController.updateUrlModeration,
);
router.delete("/urls/:id", validateObjectId, adminController.deleteUrl);

router.get("/bio-pages", validatePagination, adminController.getAllBioPages);
router.put("/bio-pages/:id", validateObjectId, adminController.updateBioPage);
router.delete(
  "/bio-pages/:id",
  validateObjectId,
  adminController.deleteBioPage,
);

router.get("/utm-links", validatePagination, adminController.getAllUtmLinks);
router.delete(
  "/utm-links/:id",
  validateObjectId,
  adminController.deleteUtmLinkAdmin,
);

router.get(
  "/organizations",
  validatePagination,
  adminController.getOrganizations,
);
router.put(
  "/organizations/:id",
  validateObjectId,
  validateAdminOrgUpdate,
  adminController.updateOrganization,
);

router.get("/stats/api-users", adminController.getApiUsers);

router.get("/export/links", adminController.exportLinks);
router.get("/export/users", adminController.exportUsers);

module.exports = router;
