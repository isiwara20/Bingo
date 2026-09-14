/**
 * BinGo – Notification Settings Model
 *
 * One document per user, controlling which notification categories and
 * delivery methods are enabled. Storage only — no real push/email
 * delivery is implemented yet.
 */

const mongoose = require("mongoose");

const notificationSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // ── Categories ────────────────────────────────────────────────────────
    collectionReminders:  { type: Boolean, default: true },
    communityEvents:      { type: Boolean, default: true },
    rewardUpdates:        { type: Boolean, default: true },
    reportUpdates:        { type: Boolean, default: true },
    generalAnnouncements: { type: Boolean, default: true },

    // ── Delivery methods ─────────────────────────────────────────────────
    push:  { type: Boolean, default: true },
    email: { type: Boolean, default: false },
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

const NotificationSettings = mongoose.model("NotificationSettings", notificationSettingsSchema);

module.exports = NotificationSettings;
