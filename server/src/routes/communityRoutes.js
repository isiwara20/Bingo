/**
 * BinGo – Community Routes
 *
 * Base: /api/v1/community
 *
 * GET    /      – List all posts (public, paginated)
 * POST   /      – Create a post (auth)
 * GET    /:id   – Get single post (public)
 * PUT    /:id   – Update own post (auth)
 * DELETE /:id   – Delete own post (auth)
 */

const express = require("express");
const router  = express.Router();

const {
  getPosts,
  createPost,
  getPostById,
  updatePost,
  deletePost,
} = require("../controllers/communityController");

const { validateCreatePost, validateUpdatePost } = require("../validators/communityValidator");

router.get("/",    getPosts);
router.get("/:id", getPostById);
router.post(  "/",    validateCreatePost, createPost);
router.put(   "/:id", validateUpdatePost, updatePost);
router.delete("/:id", deletePost);

module.exports = router;
