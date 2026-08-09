/**
 * BinGo – Payment Model
 *
 * Stores payment transaction records.
 *
 * TODO (Member 1 – Sprint 2+): Integrate with payment gateway (e.g., Stripe).
 */

const mongoose = require("mongoose");

const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
      min: [0, "Amount cannot be negative"],
    },

    currency: {
      type: String,
      default: "USD",
    },

    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },

    description: {
      type: String,
      default: null,
    },

    // External payment gateway reference
    gatewayTransactionId: {
      type: String,
      default: null,
    },

    gatewayProvider: {
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

paymentSchema.index({ userId: 1, status: 1 });

const Payment = mongoose.model("Payment", paymentSchema);

module.exports = Payment;
