/**
 * BinGo – Notification Controller
 *
 * TODO (Member 4 – Sprint 2):
 *   GET   /api/v1/notifications           – Get user's notifications
 *   PATCH /api/v1/notifications/:id/read  – Mark as read
 *   DELETE /api/v1/notifications/:id      – Delete notification
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  // TODO (Member 4): Implement with Notification model
  sendSuccess(res, 200, "Notifications endpoint – coming in Sprint 2.", []);
});

const markAsRead = asyncHandler(async (req, res) => {
  // TODO (Member 4): Implement mark as read
  sendSuccess(res, 200, "Mark as read – coming in Sprint 2.", null);
});

module.exports = { getNotifications, markAsRead };
