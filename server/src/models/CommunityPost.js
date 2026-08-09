/**
 * BinGo – CommunityPost Model
 *
 * Represents community posts, events, and announcements.
 * Created by residents (posts) or community leaders (events/announcements).
 *
 * TODO (Member 4 – Sprint 2): Add comment/reaction sub-documents.
 */

const mongoose = require("mongoose");

const POST_TYPES = ["post", "event", "announcement", "cleanup_activity"];

const communityPostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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
    },

    content: {
      type: String,
      required: [true, "Content is required"],
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
      default: null,
    },

    isPublished: {
      type: Boolean,
      default: true,
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

const CommunityPost = mongoose.model("CommunityPost", communityPostSchema);

module.exports = CommunityPost;
