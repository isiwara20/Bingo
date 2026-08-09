/**
 * BinGo – Waste Report Routes
 *
 * POST   /api/v1/reports                    (resident)
 * GET    /api/v1/reports                    (waste_authority, admin)
 * GET    /api/v1/reports/my                 (authenticated – own reports)
 * GET    /api/v1/reports/:id                (authenticated)
 * PATCH  /api/v1/reports/:id/status         (waste_authority, admin)
 * DELETE /api/v1/reports/:id                (admin)
 */

const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");
const { createReportValidation, updateReportStatusValidation } = require("../validators/reportValidators");
const { handleValidationErrors } = require("../middleware/validationMiddleware");

// All report routes require authentication
router.use(authenticateUser);

router.post(
  "/",
  createReportValidation,
  handleValidationErrors,
  reportController.createReport
);

router.get(
  "/",
  authorizeRoles("admin", "waste_authority"),
  reportController.getAllReports
);

// /my must come before /:id to avoid ID mismatch
router.get("/my", reportController.getMyReports);

router.get("/:id", reportController.getReportById);

router.patch(
  "/:id/status",
  authorizeRoles("admin", "waste_authority"),
  updateReportStatusValidation,
  handleValidationErrors,
  reportController.updateReportStatus
);

router.delete("/:id", authorizeRoles("admin"), reportController.deleteReport);

module.exports = router;
