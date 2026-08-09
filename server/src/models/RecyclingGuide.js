/**
 * BinGo – RecyclingGuide Model
 *
 * Stores recycling guidance entries.
 * Managed by admin or waste_authority.
 *
 * TODO (Member 3 – Sprint 2): Add guide categories and search indexing.
 */

const mongoose = require("mongoose");

const recyclingGuideSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },

    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },

    content: {
      type: String,
      required: [true, "Content is required"],
    },

    imageUrl: {
      type: String,
      default: null,
    },

    tips: {
      type: [String],
      default: [],
    },

    isPublished: {
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

recyclingGuideSchema.index({ category: 1 });

const RecyclingGuide = mongoose.model("RecyclingGuide", recyclingGuideSchema);

module.exports = RecyclingGuide;
