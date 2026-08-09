/**
 * BinGo – CollectionSchedule Model
 *
 * Represents waste collection schedules for specific areas.
 * Managed by waste_authority or admin.
 *
 * TODO (Member 3 – Sprint 2): Extend with notification triggers.
 */

const mongoose = require("mongoose");

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

const collectionScheduleSchema = new mongoose.Schema(
  {
    area: {
      type: String,
      required: [true, "Area name is required"],
      trim: true,
    },

    wasteType: {
      type: String,
      required: [true, "Waste type is required"],
      trim: true,
    },

    collectionDay: {
      type: String,
      required: [true, "Collection day is required"],
      enum: {
        values: DAYS_OF_WEEK,
        message: `Collection day must be one of: ${DAYS_OF_WEEK.join(", ")}`,
      },
    },

    collectionTime: {
      type: String,
      default: null, // e.g., "07:00 AM"
    },

    frequency: {
      type: String,
      enum: ["weekly", "biweekly", "monthly"],
      default: "weekly",
    },

    notes: {
      type: String,
      default: null,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

collectionScheduleSchema.index({ area: 1, collectionDay: 1 });

const CollectionSchedule = mongoose.model(
  "CollectionSchedule",
  collectionScheduleSchema
);

module.exports = CollectionSchedule;
