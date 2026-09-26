/**
 * BinGo – Reward Service
 * Member 4 – Rewards & Gamification
 *
 * All reward/leaderboard API calls go through this module.
 * Screens must NOT import api directly.
 */

import api from "../api/apiClient";

/**
 * Get the authenticated user's points, rank, and earned badges.
 *
 * @returns {{ points: number, rank: number, badges: Array }}
 */
export const getRewards = async () => {
  const response = await api.get("/rewards");
  return response.data.data;
};

/**
 * Get the leaderboard for a period, plus the authenticated user's own entry.
 *
 * @param {"all"|"month"} [period="all"]
 * @returns {{ period: string, top: Array, me: object }}
 */
export const getLeaderboard = async (period = "all") => {
  const response = await api.get("/rewards/leaderboard", { params: { period } });
  return response.data.data;
};
