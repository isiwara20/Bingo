/**
 * BinGo – Community Routes
 *
 * Base: /api/v1/community
 *
 * GET    /            – List all posts (public, paginated)
 * POST   /            – Create a post (auth)
 * GET    /mine        – Events the requesting user has joined
 * GET    /:id         – Get single post (public)
 * PUT    /:id         – Update own post (auth)
 * DELETE /:id         – Delete own post (auth)
 * POST   /:id/join    – Join an event
 * DELETE /:id/join    – Leave an event
 */

const express = require("express");
const router  = express.Router();

const {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
  joinEvent,
  leaveEvent,
  getMyEvents,
} = require("../controllers/communityController");

const { validateCreatePost, validateUpdatePost } = require("../validators/communityValidator");
const { authenticateUser } = require("../middleware/authMiddleware");

router.use(authenticateUser);

router.get("/mine", getMyEvents);
router.get("/",    getPosts);
router.get("/:id", getPostById);
router.post(  "/",    validateCreatePost, createPost);
router.put(   "/:id", validateUpdatePost, updatePost);
router.delete("/:id", deletePost);
router.post(  "/:id/join", joinEvent);
router.delete("/:id/join", leaveEvent);

module.exports = router;
