/**
 * BinGo – Reward Service
 * Member 4 – Rewards & Gamification
 *
 * Central place to award points and unlock badges. Called from other
 * controllers (e.g. communityController) rather than duplicating this logic.
 */

const { Reward, Achievement } = require("../models/Reward");
const User = require("../models/User");

const POINTS_TABLE = {
  event_joined: 10,
  announcement_created: 20,
};

// Milestone badges: after awarding `action`, count the user's total Reward
// docs for that action and unlock the badge once the threshold is reached.
const BADGE_RULES = [
  { action: "event_joined", threshold: 1, title: "Community Starter", description: "Joined your first community event.", badgeIcon: "🌱" },
  { action: "event_joined", threshold: 5, title: "Community Champion", description: "Joined 5 community events.", badgeIcon: "🏆" },
  { action: "announcement_created", threshold: 1, title: "Voice of the Community", description: "Posted your first announcement.", badgeIcon: "📢" },
  { action: "announcement_created", threshold: 5, title: "Top Contributor", description: "Posted 5 announcements.", badgeIcon: "🌟" },
];

/**
 * Award points to a user for a given action, log the transaction, and
 * unlock any badge whose threshold has just been reached.
 *
 * @param {string} userId
 * @param {string} action - one of POINTS_TABLE's keys
 * @param {{ description?: string, relatedId?: string }} [options]
 */
const awardPoints = async (userId, action, { description, relatedId } = {}) => {
  const points = POINTS_TABLE[action];
  if (!points) return;

  await Reward.create({ userId, action, points, description: description || null, relatedId: relatedId || null });
  await User.findByIdAndUpdate(userId, { $inc: { rewardPoints: points } });

  const rules = BADGE_RULES.filter((r) => r.action === action);
  if (rules.length === 0) return;

  const actionCount = await Reward.countDocuments({ userId, action });

  for (const rule of rules) {
    if (actionCount < rule.threshold) continue;
    const alreadyEarned = await Achievement.findOne({ userId, title: rule.title });
    if (alreadyEarned) continue;
    await Achievement.create({
      userId,
      title: rule.title,
      description: rule.description,
      badgeIcon: rule.badgeIcon,
    });
  }
};

module.exports = { awardPoints, POINTS_TABLE, BADGE_RULES };
