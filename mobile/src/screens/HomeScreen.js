/**
 * BinGo – Home Dashboard Screen
 *
 * US-09: As a resident, I want to access important actions from the dashboard.
 *
 * Member 2: Connected "Your Recent Reports" section to reportService.
 * TODO (Member 3): Replace schedule placeholder with CollectionScheduleWidget.
 * TODO (Member 4): Replace reward points with live rewardService data.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getMyReports } from "../services/reportService";
import COLORS from "../constants/colors";

const STATUS_COLORS = {
  pending:      COLORS.STATUS_PENDING,
  under_review: COLORS.STATUS_UNDER_REVIEW,
  cleaned:      COLORS.STATUS_CLEANED,
  rejected:     COLORS.STATUS_REJECTED,
};
const STATUS_EMOJIS = {
  pending: "⏳", under_review: "🔍", cleaned: "✅", rejected: "❌",
};
const WASTE_EMOJIS = {
  general:"🗑️", plastic:"🧴", glass:"🍶", paper:"📄",
  metal:"🔩", electronic:"📱", construction:"🧱",
  organic:"🌿", hazardous:"☢️", mixed:"♻️", other:"❓",
};

// ── Quick Action data ──────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  {
    id: "report",
    label: "Report Waste",
    emoji: "🚨",
    screen: "Report",
    description: "Report illegal dumping",
    color: COLORS.ERROR,
  },
  {
    id: "map",
    label: "Waste Map",
    emoji: "🗺️",
    screen: "Map",
    description: "View waste locations",
    color: COLORS.INFO,
  },
  {
    id: "schedule",
    label: "Schedule",
    emoji: "📅",
    screen: "Schedule",
    description: "Collection schedule",
    color: COLORS.SUCCESS,
  },
  {
    id: "dashboard",
    label: "Alerts",
    emoji: "🔔",
    screen: "CollectionDashboard",
    description: "Reminders & alerts",
    color: COLORS.ACCENT,
  },
  {
    id: "recycling",
    label: "Recycling",
    emoji: "♻️",
    screen: "Recycling",
    description: "Recycling guide",
    color: COLORS.PRIMARY,
  },
  {
    id: "progress",
    label: "My Progress",
    emoji: "🏆",
    screen: "RecyclingProgress",
    description: "Your eco journey",
    color: "#D97706",
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────
const WelcomeBanner = ({ user }) => (
  <View style={styles.welcomeCard}>
    <Text style={styles.welcomeGreeting}>
      Hello, {user?.name?.split(" ")[0] || "there"} 👋
    </Text>
    <Text style={styles.welcomeSubtitle}>
      Help keep your neighbourhood clean
    </Text>
  </View>
);

const QuickActionButton = ({ action, onPress }) => (
  <TouchableOpacity
    style={[styles.quickAction, { borderLeftColor: action.color }]}
    onPress={() => onPress(action.screen)}
    accessibilityRole="button"
    accessibilityLabel={action.label}
  >
    <Text style={styles.quickActionEmoji}>{action.emoji}</Text>
    <View>
      <Text style={styles.quickActionLabel}>{action.label}</Text>
      <Text style={styles.quickActionDesc}>{action.description}</Text>
    </View>
  </TouchableOpacity>
);

const SectionHeader = ({ title }) => (
  <Text style={styles.sectionTitle}>{title}</Text>
);

const PlaceholderCard = ({ message }) => (
  <View style={styles.placeholderCard}>
    <Text style={styles.placeholderText}>{message}</Text>
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();

  // Member 2: live recent reports
  const [recentReports, setRecentReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  const loadRecentReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const data = await getMyReports();
      setRecentReports(data.slice(0, 3)); // show last 3
    } catch {
      // Fail silently on dashboard – user can visit Reports tab for full list
    } finally {
      setReportsLoading(false);
    }
  }, []);

  useEffect(() => { loadRecentReports(); }, [loadRecentReports]);

  const navigateTo = (tab) => navigation.navigate(tab);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App bar */}
        <View style={styles.appBar}>
          <Text style={styles.appTitle}>BinGo</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Notifications")}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* Welcome banner */}
        <WelcomeBanner user={user} />

        {/* Quick Actions */}
        <SectionHeader title="Quick Actions" />
        <View style={styles.quickActionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionButton
              key={action.id}
              action={action}
              onPress={navigateTo}
            />
          ))}
        </View>

        {/* Upcoming Collection */}
        <SectionHeader title="Upcoming Collection" />
        {/* TODO (Member 3): Replace with CollectionScheduleWidget */}
        <PlaceholderCard message="📅 Collection schedule will appear here – Sprint 2" />

        {/* Recent Reports – Member 2 */}
        <SectionHeader title="Your Recent Reports" />
        {reportsLoading ? (
          <View style={styles.reportsLoading}>
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          </View>
        ) : recentReports.length === 0 ? (
          <TouchableOpacity
            style={styles.placeholderCard}
            onPress={() => navigateTo("Report")}
            accessibilityRole="button"
            accessibilityLabel="Submit your first report"
          >
            <Text style={styles.placeholderText}>
              📋 No reports yet – tap to report illegal dumping
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.recentReportsWrap}>
            {recentReports.map((r) => {
              const statusColor = STATUS_COLORS[r.status] || COLORS.TEXT_SECONDARY;
              const statusEmoji = STATUS_EMOJIS[r.status] || "📋";
              const wasteEmoji  = WASTE_EMOJIS[r.wasteType] || "🗑️";
              return (
                <TouchableOpacity
                  key={r._id}
                  style={[styles.miniReportCard, { borderLeftColor: statusColor }]}
                  onPress={() => navigation.navigate("Report", {
                    screen: "ReportDetails",
                    params: { reportId: r._id },
                  })}
                  accessibilityRole="button"
                  accessibilityLabel={`Report ${r.wasteType}, status ${r.status}`}
                >
                  <Text style={styles.miniReportEmoji}>{wasteEmoji}</Text>
                  <View style={styles.miniReportBody}>
                    <Text style={styles.miniReportType}>
                      {r.wasteType?.charAt(0).toUpperCase() + r.wasteType?.slice(1)} Waste
                    </Text>
                    <Text style={styles.miniReportDate}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.miniReportStatus}>{statusEmoji}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              onPress={() => navigateTo("Report")}
              accessibilityRole="button"
            >
              <Text style={styles.viewAllLink}>View all reports →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reward Points */}
        <SectionHeader title="Reward Points" />
        {/* TODO (Member 4): Replace with RewardPointsWidget */}
        <View style={styles.rewardCard}>
          <Text style={styles.rewardPoints}>
            {user?.rewardPoints || 0} pts
          </Text>
          <Text style={styles.rewardLabel}>Your total reward points</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("Rewards")}
            accessibilityRole="button"
            accessibilityLabel="View all rewards"
          >
            <Text style={styles.rewardLink}>View all →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { paddingBottom: 32 },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.HEADER_BG,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  appTitle: { fontSize: 24, fontWeight: "bold", color: COLORS.TEXT_INVERSE, letterSpacing: 1 },
  notificationIcon: { fontSize: 22 },
  welcomeCard: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginBottom: 0,
  },
  welcomeGreeting: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_INVERSE },
  welcomeSubtitle: { fontSize: 14, color: COLORS.PRIMARY_TINT, marginTop: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10,
    marginTop: 20,
    paddingHorizontal: 16,
  },
  quickActionsGrid: { gap: 8, paddingHorizontal: 16, marginBottom: 4 },
  quickAction: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 1,
  },
  quickActionEmoji: { fontSize: 26 },
  quickActionLabel: { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  quickActionDesc: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  placeholderCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    marginBottom: 4,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
  },
  placeholderText: { color: COLORS.TEXT_SECONDARY, fontSize: 13, textAlign: "center" },
  rewardCard: {
    backgroundColor: COLORS.ACCENT,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    marginHorizontal: 16,
  },
  rewardPoints: { fontSize: 32, fontWeight: "bold", color: COLORS.TEXT_INVERSE },
  rewardLabel: { fontSize: 13, color: COLORS.TEXT_INVERSE, marginTop: 4 },
  rewardLink: { color: COLORS.TEXT_INVERSE, marginTop: 12, fontWeight: "600" },

  // Member 2: recent reports styles
  reportsLoading: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    marginHorizontal: 16,
  },
  recentReportsWrap: { marginBottom: 4, gap: 8, paddingHorizontal: 16 },
  miniReportCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    elevation: 1,
  },
  miniReportEmoji: { fontSize: 22 },
  miniReportBody: { flex: 1 },
  miniReportType: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  miniReportDate: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 2 },
  miniReportStatus: { fontSize: 20 },
  viewAllLink: {
    color: COLORS.PRIMARY,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "right",
    marginTop: 4,
  },
});

export default HomeScreen;
