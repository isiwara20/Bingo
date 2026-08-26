/**
 * BinGo – Reminder Model (Member 3 – Feature 2)
 *
 * Stores schedule-driven reminders and area-broadcast alerts.
 * Distinct from Member 4's Notification model (which handles
 * report updates, community events, rewards).
 *
 * Types:
 *   morning_reminder   – day-of collection alert (auto)
 *   one_hour_reminder  – 1 hour before collection (auto)
 *   missed_collection  – bin not placed alert (auto)
 *   holiday_alert      – schedule change on public holiday (authority)
 *   route_change       – collection route changed (authority)
 *   weather_delay      – delay due to weather (authority)
 */

const mongoose = require("mongoose");

const REMINDER_TYPES = [
  "morning_reminder",
  "one_hour_reminder",
  "missed_collection",
  "holiday_alert",
  "route_change",
  "weather_delay",
];

const reminderSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: REMINDER_TYPES,
      required: [true, "Reminder type is required"],
    },

    area: {
      type: String,
      required: [true, "Area is required"],
      trim: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [500, "Message cannot exceed 500 characters"],
    },

    // Linked schedule (optional – for morning/1hr/missed types)
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CollectionSchedule",
      default: null,
    },

    // For authority-pushed alerts: additional detail
    affectedDate: {
      type: String, // e.g. "14 Apr 2026" – human readable
      default: null,
    },

    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      default: "info",
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Who created this (null = system-generated)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    broadcastAt: {
      type: Date,
      default: Date.now,
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

// Indexes for efficient querying
reminderSchema.index({ area: 1, isActive: 1, broadcastAt: -1 });
reminderSchema.index({ type: 1, isActive: 1 });
reminderSchema.index({ broadcastAt: -1 });

const Reminder = mongoose.model("Reminder", reminderSchema);

module.exports = Reminder;
