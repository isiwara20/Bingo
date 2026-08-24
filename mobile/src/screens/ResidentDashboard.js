/**
 * BinGo – Resident Dashboard
 *
 * Sticky header (never scrolls), scrollable body below.
 * Sections: Quick Actions · Upcoming Collection · Recent Reports · Reward Points
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

// ── constants ─────────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { id: "report",   label: "Report Waste",   emoji: "🚨", screen: "Report",   desc: "Report illegal dumping",   color: COLORS.ERROR },
  { id: "map",      label: "Waste Map",       emoji: "🗺️", screen: "Map",      desc: "View waste locations",     color: COLORS.INFO },
  { id: "schedule", label: "Schedule",        emoji: "📅", screen: "Schedule", desc: "Collection schedule",       color: COLORS.SUCCESS },
  { id: "recycle",  label: "Recycling",       emoji: "♻️", screen: "Recycling",desc: "Recycling guide",          color: COLORS.PRIMARY },
];

const STATUS_COLOR = {
  pending:      COLORS.WARNING,
  under_review: COLORS.INFO,
  cleaned:      COLORS.SUCCESS,
  rejected:     COLORS.ERROR,
};
const STATUS_EMOJI = { pending:"⏳", under_review:"🔍", cleaned:"✅", rejected:"❌" };

// ── small components ──────────────────────────────────────────────────────────
const SectionTitle = ({ children }) => <Text style={styles.sectionTitle}>{children}</Text>;

const QuickAction = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.qaCard, { borderLeftColor: item.color }]}
    onPress={() => onPress(item.screen)}
    accessibilityRole="button"
    accessibilityLabel={item.label}
  >
    <Text style={styles.qaEmoji}>{item.emoji}</Text>
    <View>
      <Text style={styles.qaLabel}>{item.label}</Text>
      <Text style={styles.qaDesc}>{item.desc}</Text>
    </View>
  </TouchableOpacity>
);

const StatChip = ({ emoji, label, value, color }) => (
  <View style={[styles.chip, { borderColor: color }]}>
    <Text style={styles.chipEmoji}>{emoji}</Text>
    <Text style={[styles.chipValue, { color }]}>{value}</Text>
    <Text style={styles.chipLabel}>{label}</Text>
  </View>
);

// ── main ──────────────────────────────────────────────────────────────────────
const ResidentDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [reports,  setReports]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [refresh,  setRefresh]  = useState(false);

  const load = useCallback(async () => {
    try {
      const api = require("../api/apiClient").default;
      const res = await api.get("/reports/my");
      setReports((res.data.data || []).slice(0, 3));
    } catch (_) {
      setReports([]);
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

  const nav = (screen) => navigation.navigate(screen);

  const pending  = reports.filter(r => r.status === "pending").length;
  const resolved = reports.filter(r => r.status === "cleaned").length;

  return (
    <View style={styles.screen}>
      {/* ── Sticky header ── */}
      <DashboardHeader
        title={`Hi, ${user?.name?.split(" ")[0] || "there"} 👋`}
        subtitle="Resident · BinGo"
        accentColor={COLORS.PRIMARY}
        onNotif={() => navigation.navigate("Notifications")}
        onLogout={handleLogout}
      />

      {/* ── Scrollable body ── */}
      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor={COLORS.PRIMARY} />
        }
      >
        {/* Stats row */}
        <View style={styles.chipRow}>
          <StatChip emoji="📋" label="Reports"  value={reports.length} color={COLORS.INFO} />
          <StatChip emoji="⏳" label="Pending"  value={pending}        color={COLORS.WARNING} />
          <StatChip emoji="✅" label="Resolved" value={resolved}       color={COLORS.SUCCESS} />
          <StatChip emoji="⭐" label="Points"   value={user?.rewardPoints || 0} color={COLORS.SECONDARY} />
        </View>

        {/* Quick actions */}
        <SectionTitle>Quick Actions</SectionTitle>
        <View style={styles.qaGrid}>
          {QUICK_ACTIONS.map(a => <QuickAction key={a.id} item={a} onPress={nav} />)}
        </View>

        {/* Upcoming collection */}
        <SectionTitle>Upcoming Collection</SectionTitle>
        <TouchableOpacity style={styles.placeholderCard} onPress={() => nav("Schedule")}>
          <Text style={styles.placeholderEmoji}>📅</Text>
          <Text style={styles.placeholderText}>Tap to view your collection schedule</Text>
        </TouchableOpacity>

        {/* Recent reports */}
        <SectionTitle>Your Recent Reports</SectionTitle>
        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginVertical: 16 }} />
        ) : reports.length === 0 ? (
          <TouchableOpacity style={styles.placeholderCard} onPress={() => nav("Report")}>
            <Text style={styles.placeholderEmoji}>📋</Text>
            <Text style={styles.placeholderText}>No reports yet — tap to report waste</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.reportList}>
            {reports.map(r => (
              <TouchableOpacity
                key={r._id}
                style={[styles.reportCard, { borderLeftColor: STATUS_COLOR[r.status] || COLORS.BORDER }]}
                onPress={() => navigation.navigate("Report", { screen: "ReportDetails", params: { reportId: r._id } })}
              >
                <View style={styles.reportBody}>
                  <Text style={styles.reportType}>
                    {r.wasteType ? r.wasteType.charAt(0).toUpperCase() + r.wasteType.slice(1) + " Waste" : "Waste Report"}
                  </Text>
                  <Text style={styles.reportDate}>{new Date(r.createdAt).toLocaleDateString()}</Text>
                </View>
                <Text style={{ fontSize: 22 }}>{STATUS_EMOJI[r.status] || "📋"}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => nav("Report")}>
              <Text style={styles.viewAll}>View all reports →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reward points */}
        <SectionTitle>Reward Points</SectionTitle>
        <TouchableOpacity style={styles.rewardCard} onPress={() => navigation.navigate("Rewards")}>
          <Text style={styles.rewardPoints}>{user?.rewardPoints || 0}</Text>
          <Text style={styles.rewardLabel}>points earned</Text>
          <Text style={styles.rewardLink}>View rewards →</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ── styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  body: { padding: 16, paddingBottom: 32, gap: 4 },

  sectionTitle: {
    fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY,
    marginTop: 16, marginBottom: 10,
  },

  chipRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 4 },
  chip: {
    flex: 1, minWidth: "22%", backgroundColor: COLORS.SURFACE,
    borderRadius: 10, padding: 10, alignItems: "center",
    borderWidth: 1.5, gap: 2,
  },
  chipEmoji: { fontSize: 18 },
  chipValue: { fontSize: 18, fontWeight: "800" },
  chipLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, textAlign: "center" },

  qaGrid: { gap: 10 },
  qaCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderLeftWidth: 4, elevation: 1,
  },
  qaEmoji: { fontSize: 26 },
  qaLabel: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  qaDesc:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  placeholderCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 18,
    alignItems: "center", borderWidth: 1, borderColor: COLORS.BORDER,
    borderStyle: "dashed", gap: 6,
  },
  placeholderEmoji: { fontSize: 28 },
  placeholderText: { color: COLORS.TEXT_SECONDARY, fontSize: 13, textAlign: "center" },

  reportList: { gap: 8 },
  reportCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 10, padding: 12,
    flexDirection: "row", alignItems: "center", borderLeftWidth: 4, elevation: 1,
  },
  reportBody: { flex: 1 },
  reportType: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  reportDate: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 2 },
  viewAll: { color: COLORS.PRIMARY, fontSize: 13, fontWeight: "600", textAlign: "right", marginTop: 4 },

  rewardCard: {
    backgroundColor: COLORS.SECONDARY, borderRadius: 14,
    padding: 20, alignItems: "center", gap: 4,
  },
  rewardPoints: { fontSize: 36, fontWeight: "bold", color: "#fff" },
  rewardLabel:  { fontSize: 13, color: "rgba(255,255,255,0.85)" },
  rewardLink:   { fontSize: 13, fontWeight: "600", color: "#fff", marginTop: 8 },
});

export default ResidentDashboard;
