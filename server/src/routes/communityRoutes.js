/**
 * BinGo – Community Routes
 * TODO (Member 4 – Sprint 2): Implement community features.
 */

const express = require("express");
const router = express.Router();
const communityController = require("../controllers/communityController");
const { authenticateUser } = require("../middleware/authMiddleware");

router.get("/", communityController.getPosts);
router.post("/", authenticateUser, communityController.createPost);

module.exports = router;
