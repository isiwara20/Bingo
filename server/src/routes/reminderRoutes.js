/**
 * BinGo – Reminder Routes (Member 3 – Feature 2)
 */
const express = require("express");
const router = express.Router();
const c = require("../controllers/reminderController");
const { authenticateUser, authorizeRoles } = require("../middleware/authMiddleware");

// All routes require auth
router.use(authenticateUser);

// Resident: get active reminders for their area
router.get("/", c.getReminders);

// Authority/Admin: get all (including inactive)
router.get("/all", authorizeRoles("admin", "waste_authority"), c.getAllReminders);

// Get single
router.get("/:id", c.getReminderById);

// Authority/Admin: create, update, deactivate
router.post("/",    authorizeRoles("admin", "waste_authority"), c.createReminder);
router.put("/:id",  authorizeRoles("admin", "waste_authority"), c.updateReminder);
router.delete("/:id", authorizeRoles("admin", "waste_authority"), c.deleteReminder);

module.exports = router;
