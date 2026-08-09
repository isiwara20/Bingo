/**
 * BinGo – Community Controller
 *
 * TODO (Member 4 – Sprint 2):
 *   GET    /api/v1/community             – List community posts/events
 *   POST   /api/v1/community             – Create post (authenticated)
 *   GET    /api/v1/community/:id         – Single post
 *   DELETE /api/v1/community/:id         – Delete own post
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getPosts = asyncHandler(async (req, res) => {
  // TODO (Member 4): Implement with CommunityPost model
  sendSuccess(res, 200, "Community endpoint – coming in Sprint 2.", []);
});

const createPost = asyncHandler(async (req, res) => {
  // TODO (Member 4): Implement post creation
  sendSuccess(res, 201, "Create community post – coming in Sprint 2.", null);
});

module.exports = { getPosts, createPost };
