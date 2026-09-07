/**
 * BinGo – Community Controller
 *
 * GET    /api/v1/community      – List all posts (paginated)
 * POST   /api/v1/community      – Create a post (auth required)
 * GET    /api/v1/community/:id  – Get single post
 * PUT    /api/v1/community/:id  – Update own post (auth required)
 * DELETE /api/v1/community/:id  – Delete own post (auth required)
 */

const mongoose  = require("mongoose");
const CommunityPost = require("../models/CommunityPost");
const AppError  = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess, sendPaginated } = require("../utils/apiResponse");
const { ROLES } = require("../config/constants");
const { awardPoints } = require("../services/rewardService");

// ── Helper ────────────────────────────────────────────────────────────────
const AUTHOR_FIELDS = "name profileImageUrl";
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);
const ORGANIZER_ROLES = [ROLES.COMMUNITY_LEADER, ROLES.WASTE_AUTHORITY];
const RESTRICTED_TYPES = ["event", "announcement"];

const canModerate = (post, user) =>
  post.authorId?.toString() === user._id.toString() || user.role === ROLES.WASTE_AUTHORITY;

const withAttendance = (post, userId) => {
  const attendees = post.attendees || [];
  post.attendeeCount = attendees.length;
  if (userId) {
    post.isAttending = attendees.some((a) => a.toString() === userId);
  }
  return post;
};

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/community
// Public – list published posts, newest first, paginated
// Query params: ?page=1&limit=10&type=event
// ─────────────────────────────────────────────────────────────────────────
const getPosts = asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const skip  = (page - 1) * limit;

  const filter = { isPublished: true };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.search) {
    const searchRegex = new RegExp(req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ title: searchRegex }, { content: searchRegex }];
  }

  const requestingUserId = req.user._id.toString();

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate("authorId", AUTHOR_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    CommunityPost.countDocuments(filter),
  ]);

  posts.forEach((post) => withAttendance(post, requestingUserId));

  sendPaginated(res, "Posts fetched successfully.", posts, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/v1/community
// Auth – create a new post
// ─────────────────────────────────────────────────────────────────────────
const createPost = asyncHandler(async (req, res) => {
  const { title, content, type, imageUrl, eventDate, location } = req.body;
  const postType = type || "post";

  if (RESTRICTED_TYPES.includes(postType) && !ORGANIZER_ROLES.includes(req.user.role)) {
    throw new AppError(
      `Only community leaders or waste authority can create posts of type "${postType}".`,
      403
    );
  }

  const post = await CommunityPost.create({
    authorId:  req.user._id,
    title,
    content,
    type:      postType,
    imageUrl:  imageUrl  || null,
    eventDate: eventDate || null,
    location:  location  || null,
  });

  if (postType === "announcement") {
    await awardPoints(req.user._id, "announcement_created", {
      description: `Created announcement: ${post.title}`,
      relatedId: post._id,
    });
  }

  sendSuccess(res, 201, "Post created successfully.", post);
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/community/:id
// Public – get single post by ID
// ─────────────────────────────────────────────────────────────────────────
const getPostById = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new AppError("Invalid post ID.", 400);

  const post = await CommunityPost.findById(req.params.id)
    .populate("authorId", AUTHOR_FIELDS)
    .lean({ virtuals: true });

  if (!post) throw new AppError("Post not found.", 404);

  withAttendance(post, req.user._id.toString());

  sendSuccess(res, 200, "Post fetched successfully.", post);
});

// ─────────────────────────────────────────────────────────────────────────
// PUT /api/v1/community/:id
// Auth – update own post (admin can update any)
// ─────────────────────────────────────────────────────────────────────────
const updatePost = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new AppError("Invalid post ID.", 400);

  const post = await CommunityPost.findById(req.params.id);

  if (!post) throw new AppError("Post not found.", 404);
  if (!canModerate(post, req.user)) {
    throw new AppError("You do not have permission to update this post.", 403);
  }

  const { title, content, type, imageUrl, eventDate, location } = req.body;

  if (title)              post.title     = title;
  if (content)            post.content   = content;
  if (type)               post.type      = type;
  if (imageUrl  !== undefined) post.imageUrl  = imageUrl;
  if (eventDate !== undefined) post.eventDate = eventDate;
  if (location  !== undefined) post.location  = location;

  await post.save();

  sendSuccess(res, 200, "Post updated successfully.", post);
});

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/community/:id
// Auth – delete own post (admin can delete any)
// ─────────────────────────────────────────────────────────────────────────
const deletePost = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new AppError("Invalid post ID.", 400);

  const post = await CommunityPost.findById(req.params.id);

  if (!post) throw new AppError("Post not found.", 404);
  if (!canModerate(post, req.user)) {
    throw new AppError("You do not have permission to delete this post.", 403);
  }

  await post.deleteOne();

  sendSuccess(res, 200, "Post deleted successfully.", null);
});

// ─────────────────────────────────────────────────────────────────────────
// POST /api/v1/community/:id/join
// Register userId (from body) as an attendee of an event. No-op if already joined.
// ─────────────────────────────────────────────────────────────────────────
const joinEvent = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new AppError("Invalid post ID.", 400);

  const userId = req.user._id.toString();

  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError("Post not found.", 404);
  if (post.type !== "event") throw new AppError("Only events can be joined.", 400);

  const alreadyAttending = post.attendees.some((a) => a.toString() === userId);
  if (!alreadyAttending) {
    post.attendees.push(userId);
    await post.save();
    await awardPoints(userId, "event_joined", {
      description: `Joined event: ${post.title}`,
      relatedId: post._id,
    });
  }

  sendSuccess(res, 200, "Joined event successfully.", {
    attendeeCount: post.attendees.length,
    isAttending: true,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// DELETE /api/v1/community/:id/join
// Remove userId (from body) from an event's attendees.
// ─────────────────────────────────────────────────────────────────────────
const leaveEvent = asyncHandler(async (req, res) => {
  if (!isValidId(req.params.id)) throw new AppError("Invalid post ID.", 400);

  const userId = req.user._id.toString();

  const post = await CommunityPost.findById(req.params.id);
  if (!post) throw new AppError("Post not found.", 404);

  post.attendees = post.attendees.filter((a) => a.toString() !== userId);
  await post.save();

  sendSuccess(res, 200, "Left event successfully.", {
    attendeeCount: post.attendees.length,
    isAttending: false,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/community/mine?userId=
// Events the given user has joined, split into upcoming and completed.
// ─────────────────────────────────────────────────────────────────────────
const getMyEvents = asyncHandler(async (req, res) => {
  const userId = req.user._id.toString();

  const events = await CommunityPost.find({ type: "event", attendees: userId })
    .populate("authorId", AUTHOR_FIELDS)
    .sort({ eventDate: 1 })
    .lean({ virtuals: true });

  const now = new Date();
  const upcoming = [];
  const completed = [];

  events.forEach((event) => {
    withAttendance(event, userId);
    if (event.eventDate && new Date(event.eventDate) < now) {
      completed.push(event);
    } else {
      upcoming.push(event);
    }
  });

  sendSuccess(res, 200, "Joined events fetched successfully.", { upcoming, completed });
});

module.exports = {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  joinEvent,
  leaveEvent,
  getMyEvents,
};
