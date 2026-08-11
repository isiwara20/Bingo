/**
 * BinGo – Notification Routes
 * TODO (Member 4 – Sprint 2): Implement notification management.
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateUser } = require("../middleware/authMiddleware");

router.use(authenticateUser);

router.get("/", notificationController.getNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
