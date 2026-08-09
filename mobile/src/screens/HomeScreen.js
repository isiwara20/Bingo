/**
 * BinGo – Home Dashboard Screen
 *
 * US-09: As a resident, I want to access important actions from the dashboard.
 *
 * Modular layout – each section can be extended independently by team members.
 * TODO: Connect upcoming collection from scheduleService (Member 3)
 * TODO: Connect recent reports from reportService (Member 2)
 * TODO: Connect reward points from AuthContext/rewardService (Member 4)
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import COLORS from "../constants/colors";

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
    id: "recycling",
    label: "Recycling",
    emoji: "♻️",
    screen: "Recycling",
    description: "Recycling guide",
    color: COLORS.PRIMARY,
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

  const navigateTo = (tab) => {
    navigation.navigate(tab);
  };

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

        {/* Recent Reports */}
        <SectionHeader title="Your Recent Reports" />
        {/* TODO (Member 2): Replace with RecentReportsWidget */}
        <PlaceholderCard message="📋 Your recent reports will appear here" />

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
  scrollContent: { padding: 16, paddingBottom: 32 },
  appBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  appTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.PRIMARY },
  notificationIcon: { fontSize: 22 },
  welcomeCard: {
    backgroundColor: COLORS.PRIMARY,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  welcomeGreeting: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_INVERSE },
  welcomeSubtitle: { fontSize: 14, color: COLORS.PRIMARY_LIGHT, marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 12,
    marginTop: 8,
  },
  quickActionsGrid: { gap: 10, marginBottom: 24 },
  quickAction: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderLeftWidth: 4,
    elevation: 1,
  },
  quickActionEmoji: { fontSize: 28 },
  quickActionLabel: { fontSize: 15, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  quickActionDesc: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  placeholderCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
  },
  placeholderText: { color: COLORS.TEXT_SECONDARY, fontSize: 14, textAlign: "center" },
  rewardCard: {
    backgroundColor: COLORS.SECONDARY,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
  },
  rewardPoints: { fontSize: 32, fontWeight: "bold", color: COLORS.TEXT_INVERSE },
  rewardLabel: { fontSize: 13, color: COLORS.TEXT_INVERSE, marginTop: 4 },
  rewardLink: { color: COLORS.TEXT_INVERSE, marginTop: 12, fontWeight: "600" },
});

export default HomeScreen;
