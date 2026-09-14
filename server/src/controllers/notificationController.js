/**
 * BinGo – Notification Controller
 *
 * GET   /api/v1/notifications           – List authenticated user's notifications (paginated, ?type=)
 * PATCH /api/v1/notifications/:id/read  – Mark one notification as read
 * PATCH /api/v1/notifications/read-all  – Mark all of the user's notifications as read
 * GET   /api/v1/notifications/settings  – Get the user's notification settings
 * PUT   /api/v1/notifications/settings  – Update the user's notification settings
 */

const mongoose = require("mongoose");
const Notification = require("../models/Notification");
const NotificationSettings = require("../models/NotificationSettings");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/notifications
// ─────────────────────────────────────────────────────────────────────────
const getNotifications = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 20);
  const skip  = (page - 1) * limit;

  const filter = { userId: req.user._id };
  if (req.query.type) filter.type = req.query.type;

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  sendPaginated(res, "Notifications fetched successfully.", notifications, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    unreadCount,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────
const markAsRead = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new AppError("Invalid notification ID.", 400);

  const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });
  if (!notification) throw new AppError("Notification not found.", 404);

  notification.isRead = true;
  await notification.save();

  sendSuccess(res, 200, "Notification marked as read.", notification);
});

// ─────────────────────────────────────────────────────────────────────────
// PATCH /api/v1/notifications/read-all
// ─────────────────────────────────────────────────────────────────────────
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { $set: { isRead: true } }
  );

  sendSuccess(res, 200, "All notifications marked as read.", null);
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/notifications/settings
// ─────────────────────────────────────────────────────────────────────────
const getSettings = asyncHandler(async (req, res) => {
  let settings = await NotificationSettings.findOne({ userId: req.user._id });
  if (!settings) {
    settings = await NotificationSettings.create({ userId: req.user._id });
  }

  sendSuccess(res, 200, "Notification settings fetched successfully.", settings);
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/v1/notifications/settings
// ─────────────────────────────────────────────────────────────────────────
const updateSettings = asyncHandler(async (req, res) => {
  const {
    collectionReminders,
    communityEvents,
    rewardUpdates,
    reportUpdates,
    generalAnnouncements,
    push,
    email,
  } = req.body;

  const update = {};
  if (collectionReminders  !== undefined) update.collectionReminders  = !!collectionReminders;
  if (communityEvents      !== undefined) update.communityEvents      = !!communityEvents;
  if (rewardUpdates        !== undefined) update.rewardUpdates        = !!rewardUpdates;
  if (reportUpdates        !== undefined) update.reportUpdates        = !!reportUpdates;
  if (generalAnnouncements !== undefined) update.generalAnnouncements = !!generalAnnouncements;
  if (push                 !== undefined) update.push                = !!push;
  if (email                !== undefined) update.email                = !!email;

  const settings = await NotificationSettings.findOneAndUpdate(
    { userId: req.user._id },
    { $set: update, $setOnInsert: { userId: req.user._id } },
    { new: true, upsert: true }
  );

  sendSuccess(res, 200, "Notification settings updated successfully.", settings);
});

module.exports = { getNotifications, markAsRead, markAllAsRead, getSettings, updateSettings };
