/**
 * BinGo – Rewards Controller
 *
 * TODO (Member 4 – Sprint 2):
 *   GET /api/v1/rewards            – Get user's reward history
 *   GET /api/v1/rewards/leaderboard – Points leaderboard
 */

const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../utils/asyncHandler");

const getRewards = asyncHandler(async (req, res) => {
  // TODO (Member 4): Implement with Reward model
  sendSuccess(res, 200, "Rewards endpoint – coming in Sprint 2.", {
    points: req.user.rewardPoints,
    history: [],
  });
});

const getLeaderboard = asyncHandler(async (req, res) => {
  // TODO (Member 4): Implement leaderboard
  sendSuccess(res, 200, "Leaderboard – coming in Sprint 2.", []);
});

module.exports = { getRewards, getLeaderboard };
