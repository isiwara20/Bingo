/**
 * BinGo – Notification Model
 *
 * Stores in-app notifications for users.
 *
 * TODO (Member 4 – Sprint 2): Integrate push notifications (FCM).
 */

const mongoose = require("mongoose");

const NOTIFICATION_TYPES = [
  "report_status_update",
  "collection_reminder",
  "community_event",
  "reward_earned",
  "announcement",
  "general",
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    type: {
      type: String,
      enum: NOTIFICATION_TYPES,
      default: "general",
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    message: {
      type: String,
      required: true,
    },

    isRead: {
      type: Boolean,
      default: false,
    },

    // Optional reference to related document (report, post, etc.)
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },

    relatedModel: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
