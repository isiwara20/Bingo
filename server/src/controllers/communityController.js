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

// ── Helper ────────────────────────────────────────────────────────────────
const AUTHOR_FIELDS = "name profileImageUrl";
const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

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

  const [posts, total] = await Promise.all([
    CommunityPost.find(filter)
      .populate("authorId", AUTHOR_FIELDS)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean({ virtuals: true }),
    CommunityPost.countDocuments(filter),
  ]);

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
  const { title, content, type, imageUrl, eventDate, location, authorId } = req.body;

  const post = await CommunityPost.create({
    authorId:  authorId  || null,
    title,
    content,
    type:      type      || "post",
    imageUrl:  imageUrl  || null,
    eventDate: eventDate || null,
    location:  location  || null,
  });

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

  await post.deleteOne();

  sendSuccess(res, 200, "Post deleted successfully.", null);
});

module.exports = { getPosts, createPost, getPostById, updatePost, deletePost };
