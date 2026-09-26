/**
 * BinGo – Plan Routes
 *
 * GET  /api/v1/plans           – public, list active plans
 * POST /api/v1/plans/select    – authenticated resident, select a plan
 * PUT  /api/v1/plans/:key      – admin only, update plan details
 */

const express = require("express");
const router = express.Router();
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");
const { getPlans, selectPlan, updatePlan } = require("../controllers/planController");

router.get("/", getPlans);

router.post(
  "/select",
  authenticateUser,
  authorizeRoles("resident"),
  selectPlan
);

router.put(
  "/:key",
  authenticateUser,
  authorizeRoles("admin"),
  updatePlan
);

module.exports = router;
