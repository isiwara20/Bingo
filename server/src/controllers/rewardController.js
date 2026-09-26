/**
 * BinGo – Rewards Controller
 *
 * GET /api/v1/rewards            – Authenticated user's points, rank, and badges
 * GET /api/v1/rewards/leaderboard – Top users by points (?period=all|month), plus own rank
 */

const { Reward, Achievement } = require("../models/Reward");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/rewards
// ─────────────────────────────────────────────────────────────────────────
const getRewards = asyncHandler(async (req, res) => {
  const badges = await Achievement.find({ userId: req.user._id }).sort({ earnedAt: -1 });
  const higherRankedCount = await User.countDocuments({ rewardPoints: { $gt: req.user.rewardPoints } });

  sendSuccess(res, 200, "Rewards fetched successfully.", {
    points: req.user.rewardPoints,
    rank: higherRankedCount + 1,
    badges,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// GET /api/v1/rewards/leaderboard?period=all|month
// ─────────────────────────────────────────────────────────────────────────
const getLeaderboard = asyncHandler(async (req, res) => {
  const period = req.query.period === "month" ? "month" : "all";

  let ranked;

  if (period === "all") {
    const users = await User.find({ isActive: true })
      .select("name profileImage rewardPoints")
      .sort({ rewardPoints: -1 })
      .lean();
    ranked = users.map((u) => ({ userId: u._id, name: u.name, profileImage: u.profileImage, points: u.rewardPoints }));
  } else {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const agg = await Reward.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      { $group: { _id: "$userId", points: { $sum: "$points" } } },
      { $sort: { points: -1 } },
    ]);

    const users = await User.find({ _id: { $in: agg.map((a) => a._id) } })
      .select("name profileImage")
      .lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    ranked = agg.map((a) => ({
      userId: a._id,
      name: userMap.get(a._id.toString())?.name || "Unknown",
      profileImage: userMap.get(a._id.toString())?.profileImage || null,
      points: a.points,
    }));
  }

  const top = ranked.slice(0, 10).map((r, i) => ({ ...r, rank: i + 1 }));

  const myIndex = ranked.findIndex((r) => r.userId.toString() === req.user._id.toString());
  const me = myIndex >= 0
    ? { ...ranked[myIndex], rank: myIndex + 1 }
    : { userId: req.user._id, name: req.user.name, profileImage: req.user.profileImage, points: 0, rank: null };

  sendSuccess(res, 200, "Leaderboard fetched successfully.", { period, top, me });
});

module.exports = { getRewards, getLeaderboard };
