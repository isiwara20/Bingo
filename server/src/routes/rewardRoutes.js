/**
 * BinGo – Reward Routes
 * TODO (Member 4 – Sprint 2): Implement rewards and gamification.
 */

const express = require("express");
const router = express.Router();
const rewardController = require("../controllers/rewardController");
const { authenticateUser } = require("../middleware/authMiddleware");

router.use(authenticateUser);

router.get("/", rewardController.getRewards);
router.get("/leaderboard", rewardController.getLeaderboard);

module.exports = router;
