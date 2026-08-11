/**
 * BinGo – Schedule Routes
 * TODO (Member 3 – Sprint 2): Implement full schedule management.
 */

const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/", authenticateUser, scheduleController.getSchedules);

router.post(
  "/",
  authenticateUser,
  authorizeRoles("admin", "waste_authority"),
  scheduleController.createSchedule
);

module.exports = router;
