const mongoose = require("mongoose");
const { CATEGORIES, UNITS, PERIODS, ICONS } = require("../config/goalConstants");
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, immutable: true },
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, default: "", maxlength: 1000 },
  category: { type: String, enum: CATEGORIES, required: true },
  targetAmount: { type: Number, required: true, min: 0.01, max: 1000000 },
  currentProgress: { type: Number, default: 0, min: 0 },
  unit: { type: String, enum: UNITS, required: true },
  period: { type: String, enum: PERIODS, required: true },
  startDate: { type: Date, required: true },
  targetDate: { type: Date, required: true },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  icon: { type: String, enum: ICONS, default: "sprout" },
  completedAt: { type: Date, default: null },
}, { timestamps: true, optimisticConcurrency: true, toJSON: { virtuals: true, transform: (_, value) => { delete value.__v; return value; } } });
schema.virtual("progressPercentage").get(function () {
  return Math.min(100, Math.floor(this.currentProgress / this.targetAmount * 100));
});
schema.pre("validate", function (next) {
  if (this.targetDate < this.startDate) this.invalidate("targetDate", "Target date cannot be before start date.");
  next();
});
schema.index({ userId: 1, status: 1, createdAt: -1 });
module.exports = mongoose.model("SustainabilityGoal", schema);
