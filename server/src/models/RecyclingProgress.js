/**
 * BinGo – RecyclingProgress Model (Member 3 – Feature 3)
 * Tracks each resident's recycling education journey.
 */
const mongoose = require("mongoose");

const recyclingProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    savedGuides:          { type: [String], default: [] }, // guide _id strings
    completedStories:     { type: [String], default: [] }, // story ids
    categoriesExplored:   { type: [String], default: [] }, // category names
    detectiveCasesPlayed: { type: Number,   default: 0  },
    detectiveCasesCorrect:{ type: Number,   default: 0  },
    totalScore:           { type: Number,   default: 0  },
    lastActive:           { type: Date,     default: Date.now },
  },
  {
    timestamps: true,
    toJSON: { transform: (doc, ret) => { delete ret.__v; return ret; } },
  }
);

recyclingProgressSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model("RecyclingProgress", recyclingProgressSchema);
