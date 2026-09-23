/**
 * BinGo – Schedule Routes (Member 3)
 */
const express = require("express");
const router = express.Router();
const c = require("../controllers/scheduleController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

router.get("/",     authenticateUser, c.getSchedules);
router.get("/:id",  authenticateUser, c.getScheduleById);
router.post("/",    authenticateUser, authorizeRoles("admin", "waste_authority"), c.createSchedule);
router.put("/:id",  authenticateUser, authorizeRoles("admin", "waste_authority"), c.updateSchedule);
router.delete("/:id", authenticateUser, authorizeRoles("admin"), c.deleteSchedule);

module.exports = router;
