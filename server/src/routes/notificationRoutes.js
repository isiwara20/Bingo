/**
 * BinGo – Notification Routes
 *
 * Base: /api/v1/notifications
 *
 * GET   /              – List notifications (paginated, ?type=)
 * PATCH /read-all      – Mark all as read
 * GET   /settings       – Get notification settings
 * PUT   /settings       – Update notification settings
 * PATCH /:id/read      – Mark one notification as read
 */

const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticateUser } = require("../middleware/authMiddleware");

router.use(authenticateUser);

router.get("/", notificationController.getNotifications);
router.patch("/read-all", notificationController.markAllAsRead);
router.get("/settings", notificationController.getSettings);
router.put("/settings", notificationController.updateSettings);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
