const mongoose = require("mongoose");
const { UNITS } = require("../config/goalConstants");
const schema = new mongoose.Schema({
  goalId: { type: mongoose.Schema.Types.ObjectId, ref: "SustainabilityGoal", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  requestId: { type: String, required: true, maxlength: 100 },
  requestedAmount: { type: Number, required: true },
  amountAdded: { type: Number, required: true, min: 0.01 },
  note: { type: String, trim: true, default: "", maxlength: 500 },
  progressAfterUpdate: { type: Number, required: true },
  // Snapshot the measurement so later edits do not rewrite history.
  targetAtUpdate: { type: Number, required: true },
  unit: { type: String, enum: UNITS, required: true },
}, { timestamps: { createdAt: true, updatedAt: false }, toJSON: { virtuals: true } });
schema.index({ goalId: 1, requestId: 1 }, { unique: true });
schema.index({ userId: 1, goalId: 1, createdAt: -1 });
schema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("GoalProgressEntry", schema);
