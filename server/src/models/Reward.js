/**
 * BinGo – Reward & Achievement Models
 *
 * Tracks reward point transactions and user achievements.
 *
 * TODO (Member 4 – Sprint 2): Implement full gamification logic.
 */

const mongoose = require("mongoose");

// ── Reward Transaction ────────────────────────────────────────────────────
const REWARD_ACTIONS = [
  "report_submitted",
  "report_verified",
  "community_participation",
  "recycling_activity",
  "referral",
  "admin_grant",
];

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    action: {
      type: String,
      enum: REWARD_ACTIONS,
      required: true,
    },

    points: {
      type: Number,
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
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

rewardSchema.index({ userId: 1, createdAt: -1 });

// ── Achievement ────────────────────────────────────────────────────────────
const achievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      default: null,
    },

    badgeIcon: {
      type: String,
      default: null,
    },

    earnedAt: {
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

achievementSchema.index({ userId: 1 });

const Reward = mongoose.model("Reward", rewardSchema);
const Achievement = mongoose.model("Achievement", achievementSchema);

module.exports = { Reward, Achievement };
