/**
 * BinGo – Plan Model
 *
 * Subscription plans available to residents.
 * Prices and benefits are managed by admin from the dashboard.
 */

const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      enum: ["free", "plus", "pro"],
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    tagline: {
      type: String,
      trim: true,
      default: "",
    },

    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    currency: {
      type: String,
      default: "LKR",
    },

    billingPeriod: {
      type: String,
      enum: ["month", "year", "one-time", "free"],
      default: "month",
    },

    benefits: {
      type: [String],
      default: [],
    },

    color: {
      type: String,
      default: "#2E7D32",
    },

    badge: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    sortOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Plan", planSchema);
