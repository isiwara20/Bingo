/**
 * BinGo – Community Leader Dashboard
 *
 * Sticky header + scrollable content.
 * Sections: Community Stats · Quick Actions · Recent Activity · Members
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { logout as logoutApi } from "../services/authService";
import DashboardHeader from "../components/DashboardHeader";
import COLORS from "../constants/colors";

const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

const StatCard = ({ emoji, label, value, color }) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value ?? "—"}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const ActionCard = ({ emoji, label, desc, color, onPress }) => (
  <TouchableOpacity
    style={[styles.actionCard, { borderLeftColor: color }]}
    onPress={onPress}
    accessibilityRole="button"
  >
    <Text style={styles.actionEmoji}>{emoji}</Text>
    <View>
      <Text style={styles.actionLabel}>{label}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </View>
  </TouchableOpacity>
);

const CommunityLeaderDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(false);

  const load = useCallback(async () => {
    try {
      const api = require("../api/apiClient").default;
      // Try to load community-specific stats
      const res = await api.get("/community/my-stats").catch(() => ({ data: { data: null } }));
      setStats(res.data.data);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefresh(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLogout = async () => {
    try { await logoutApi(); } catch (_) {}
    await logout();
  };

  return (
    <View style={styles.screen}>
      {/* Sticky header */}
      <DashboardHeader
        title={`Hi, ${user?.name?.split(" ")[0] || "Leader"} 👋`}
        subtitle={user?.communityName ? `${user.communityName}` : "Community Leader · BinGo"}
        accentColor="#1565C0"
        onNotif={() => navigation.navigate("Notifications")}
        onLogout={handleLogout}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor="#1565C0" />
        }
      >
        {/* Community identity card */}
        <View style={styles.communityCard}>
          <Text style={styles.communityEmoji}>🏘️</Text>
          <View style={styles.communityInfo}>
            <Text style={styles.communityName}>{user?.communityName || "Your Community"}</Text>
            <Text style={styles.communityRole}>Community Leader</Text>
          </View>
          <View style={styles.communityBadge}>
            <Text style={styles.communityBadgeText}>Active</Text>
          </View>
        </View>

        {/* Stats */}
        <SectionTitle>Community Overview</SectionTitle>
        {loading ? (
          <ActivityIndicator color="#1565C0" style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard emoji="👥" label="Members"     value={stats?.members     ?? 0} color="#1565C0" />
            <StatCard emoji="📋" label="Reports"     value={stats?.reports     ?? 0} color={COLORS.INFO} />
            <StatCard emoji="🧹" label="Clean-ups"   value={stats?.cleanups    ?? 0} color={COLORS.SUCCESS} />
            <StatCard emoji="⏳" label="Pending"     value={stats?.pending     ?? 0} color={COLORS.WARNING} />
          </View>
        )}

        {/* Quick actions */}
        <SectionTitle>Quick Actions</SectionTitle>
        <View style={styles.actionGrid}>
          <ActionCard emoji="🗺️" label="Waste Map"        desc="View community waste reports"   color={COLORS.INFO}    onPress={() => navigation.navigate("Map")} />
          <ActionCard emoji="📢" label="Community Board"  desc="Post announcements & updates"   color="#1565C0"        onPress={() => navigation.navigate("Community")} />
          <ActionCard emoji="📅" label="Schedule"         desc="Collection schedule for area"   color={COLORS.SUCCESS} onPress={() => navigation.navigate("Schedule")} />
          <ActionCard emoji="♻️" label="Recycling Guide"  desc="Share recycling info"           color={COLORS.PRIMARY} onPress={() => navigation.navigate("Recycling")} />
        </View>

        {/* Recent community activity */}
        <SectionTitle>Recent Activity</SectionTitle>
        <View style={styles.activityCard}>
          {[
            { emoji: "📋", text: "3 new waste reports in your area", time: "2h ago" },
            { emoji: "✅", text: "Collection completed on Main Street", time: "Yesterday" },
            { emoji: "👤", text: "2 new members joined the community", time: "3 days ago" },
          ].map((item, i) => (
            <View key={i} style={[styles.activityRow, i < 2 && styles.activityBorder]}>
              <Text style={styles.activityEmoji}>{item.emoji}</Text>
              <View style={styles.activityBody}>
                <Text style={styles.activityText}>{item.text}</Text>
                <Text style={styles.activityTime}>{item.time}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Announce drive CTA */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("Community")}
          accessibilityRole="button"
        >
          <Text style={styles.ctaEmoji}>🧹</Text>
          <View>
            <Text style={styles.ctaTitle}>Organise a Clean-up Drive</Text>
            <Text style={styles.ctaDesc}>Coordinate volunteers in your community</Text>
          </View>
          <Text style={styles.ctaArrow}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  body: { padding: 16, paddingBottom: 32, gap: 4 },

  sectionTitle: {
    fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY,
    marginTop: 16, marginBottom: 10,
  },

  communityCard: {
    backgroundColor: "#E3F2FD", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 1, borderColor: "#BBDEFB",
  },
  communityEmoji: { fontSize: 36 },
  communityInfo: { flex: 1 },
  communityName: { fontSize: 16, fontWeight: "700", color: "#1565C0" },
  communityRole: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  communityBadge: { backgroundColor: "#1565C0", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  communityBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12,
    alignItems: "center", borderTopWidth: 3, elevation: 1, gap: 3,
  },
  statEmoji: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, textAlign: "center" },

  actionGrid: { gap: 10 },
  actionCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderLeftWidth: 4, elevation: 1,
  },
  actionEmoji: { fontSize: 26 },
  actionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  actionDesc:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  activityCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  activityRow: { flexDirection: "row", padding: 14, gap: 12, alignItems: "center" },
  activityBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER },
  activityEmoji: { fontSize: 22, width: 30 },
  activityBody: { flex: 1 },
  activityText: { fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },
  activityTime: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 2 },

  ctaButton: {
    backgroundColor: "#1565C0", borderRadius: 14, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14, marginTop: 8,
  },
  ctaEmoji: { fontSize: 28 },
  ctaTitle: { fontSize: 15, fontWeight: "700", color: "#fff" },
  ctaDesc:  { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 },
  ctaArrow: { marginLeft: "auto", fontSize: 24, color: "#fff", fontWeight: "bold" },
});

export default CommunityLeaderDashboard;
