/**
 * BinGo – CommunityPost Model
 *
 * Represents community posts, events, and announcements.
 */

const mongoose = require("mongoose");

const POST_TYPES = ["post", "event", "announcement", "cleanup_activity"];

const communityPostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    type: {
      type: String,
      enum: {
        values: POST_TYPES,
        message: `Type must be one of: ${POST_TYPES.join(", ")}`,
      },
      default: "post",
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },

    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [2000, "Content cannot exceed 2000 characters"],
    },

    imageUrl: {
      type: String,
      default: null,
    },

    eventDate: {
      type: Date,
      default: null,
    },

    location: {
      type: String,
      trim: true,
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    attendees: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
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

communityPostSchema.index({ authorId: 1, createdAt: -1 });
communityPostSchema.index({ type: 1, isPublished: 1 });
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ attendees: 1 });

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

module.exports = CommunityPost;
