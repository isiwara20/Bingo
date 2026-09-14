/**
 * BinGo – Rewards Screen
 * Member 4 – Rewards & Gamification
 *
 * Points + rank header, earned badges grid, and a leaderboard with
 * an All-Time / This Month toggle, highlighting the current user's row.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import { getRewards, getLeaderboard } from "../services/rewardService";
import COLORS from "../constants/colors";

const PERIODS = [
  { value: "all",   label: "All Time" },
  { value: "month", label: "This Month" },
];

const BadgeCard = ({ badge }) => (
  <View style={styles.badgeCard}>
    <Text style={styles.badgeEmoji}>{badge.badgeIcon || "🏅"}</Text>
    <Text style={styles.badgeTitle} numberOfLines={2}>{badge.title}</Text>
    <Text style={styles.badgeDesc} numberOfLines={2}>{badge.description}</Text>
  </View>
);

const LeaderboardRow = ({ entry, isMe }) => (
  <View style={[styles.leaderRow, isMe && styles.leaderRowMe]}>
    <Text style={[styles.leaderRank, isMe && styles.leaderTextMe]}>#{entry.rank ?? "—"}</Text>
    <Text style={[styles.leaderName, isMe && styles.leaderTextMe]} numberOfLines={1}>
      {isMe ? "You" : entry.name}
    </Text>
    <Text style={[styles.leaderPoints, isMe && styles.leaderTextMe]}>{entry.points} pts</Text>
  </View>
);

const RewardsScreen = () => {
  const { user } = useAuth();

  const [rewards, setRewards] = useState(null);
  const [period, setPeriod] = useState("all");
  const [leaderboard, setLeaderboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async (periodOverride) => {
    setError(null);
    try {
      const [rewardsData, leaderboardData] = await Promise.all([
        getRewards(),
        getLeaderboard(periodOverride || period),
      ]);
      setRewards(rewardsData);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(err.message || "Failed to load rewards.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useFocusEffect(useCallback(() => { fetchAll(); }, [fetchAll]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchAll();
  };

  const onPeriodChange = async (value) => {
    setPeriod(value);
    try {
      const leaderboardData = await getLeaderboard(value);
      setLeaderboard(leaderboardData);
    } catch (err) {
      setError(err.message || "Failed to load leaderboard.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading rewards…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !rewards) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLoading(true); fetchAll(); }}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} tintColor={COLORS.PRIMARY} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.emoji}>⭐</Text>
          <Text style={styles.points}>{rewards?.points ?? user?.rewardPoints ?? 0}</Text>
          <Text style={styles.pointsLabel}>Points earned</Text>
          <View style={styles.rankPill}>
            <Text style={styles.rankPillText}>Rank #{rewards?.rank ?? "—"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Badges</Text>
        {rewards?.badges?.length ? (
          <View style={styles.badgeGrid}>
            {rewards.badges.map((badge) => (
              <BadgeCard key={badge._id} badge={badge} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyBadges}>
            <Text style={styles.emptyBadgesText}>
              No badges yet — join an event or post an announcement to start earning them.
            </Text>
          </View>
        )}

        <View style={styles.leaderHeader}>
          <Text style={styles.sectionTitle}>Leaderboard</Text>
          <View style={styles.periodRow}>
            {PERIODS.map((p) => (
              <TouchableOpacity
                key={p.value}
                style={[styles.periodPill, period === p.value && styles.periodPillActive]}
                onPress={() => onPeriodChange(p.value)}
              >
                <Text style={[styles.periodPillText, period === p.value && styles.periodPillTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.leaderboardCard}>
          {leaderboard?.top?.length ? (
            leaderboard.top.map((entry) => (
              <LeaderboardRow
                key={entry.userId}
                entry={entry}
                isMe={entry.userId === leaderboard.me?.userId}
              />
            ))
          ) : (
            <Text style={styles.emptyLeaderboardText}>No activity yet for this period.</Text>
          )}

          {leaderboard?.me && !leaderboard.top?.some((e) => e.userId === leaderboard.me.userId) ? (
            <>
              <View style={styles.leaderDivider} />
              <LeaderboardRow entry={leaderboard.me} isMe />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  errorMsg: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  retryBtn: { marginTop: 8, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold" },

  scroll: { padding: 16, paddingBottom: 48 },

  header: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    paddingVertical: 28,
    alignItems: "center",
    marginBottom: 8,
  },
  emoji: { fontSize: 40, marginBottom: 4 },
  points: { fontSize: 40, fontWeight: "bold", color: COLORS.TEXT_INVERSE },
  pointsLabel: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  rankPill: {
    marginTop: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  rankPillText: { color: COLORS.TEXT_INVERSE, fontWeight: "700", fontSize: 13 },

  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 20, marginBottom: 10 },

  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "31%",
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  badgeEmoji: { fontSize: 26, marginBottom: 4 },
  badgeTitle: { fontSize: 11, fontWeight: "700", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  badgeDesc: { fontSize: 9, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 2 },

  emptyBadges: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  emptyBadgesText: { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 18 },

  leaderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  periodRow: { flexDirection: "row", gap: 8, marginTop: 20 },
  periodPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  periodPillActive: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  periodPillText: { fontSize: 11, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  periodPillTextActive: { color: COLORS.TEXT_INVERSE },

  leaderboardCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: "hidden",
  },
  leaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.DIVIDER,
  },
  leaderRowMe: { backgroundColor: COLORS.PRIMARY_TINT },
  leaderRank: { width: 40, fontSize: 13, fontWeight: "700", color: COLORS.TEXT_SECONDARY },
  leaderName: { flex: 1, fontSize: 14, color: COLORS.TEXT_PRIMARY },
  leaderPoints: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_SECONDARY },
  leaderTextMe: { color: COLORS.PRIMARY },
  leaderDivider: { height: 1, backgroundColor: COLORS.BORDER },

  emptyLeaderboardText: { padding: 16, fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
});

export default RewardsScreen;
