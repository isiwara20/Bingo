/**
 * BinGo – Waste Authority Dashboard
 *
 * Sticky header + scrollable content.
 * Sections: Priority Stats · Assigned Reports · Collection Routes · Actions
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

const PriorityCard = ({ emoji, label, value, color, bg }) => (
  <View style={[styles.priorityCard, { backgroundColor: bg, borderColor: color }]}>
    <Text style={styles.priorityEmoji}>{emoji}</Text>
    <Text style={[styles.priorityValue, { color }]}>{value ?? "—"}</Text>
    <Text style={styles.priorityLabel}>{label}</Text>
  </View>
);

const STATUS_COLOR = {
  pending:      { text: COLORS.WARNING,  bg: "#FFF3E0" },
  under_review: { text: COLORS.INFO,     bg: "#E3F2FD" },
  cleaned:      { text: COLORS.SUCCESS,  bg: "#E8F5E9" },
  rejected:     { text: COLORS.ERROR,    bg: "#FFEBEE" },
};
const STATUS_LABEL = {
  pending: "Pending", under_review: "In Review", cleaned: "Cleaned", rejected: "Rejected",
};

const ReportRow = ({ item, onPress }) => {
  const cfg = STATUS_COLOR[item.status] || { text: COLORS.TEXT_SECONDARY, bg: COLORS.BACKGROUND };
  return (
    <TouchableOpacity style={styles.reportRow} onPress={onPress}>
      <View style={[styles.statusDot, { backgroundColor: cfg.text }]} />
      <View style={styles.reportInfo}>
        <Text style={styles.reportTitle} numberOfLines={1}>
          {item.title || (item.wasteType ? item.wasteType.charAt(0).toUpperCase() + item.wasteType.slice(1) + " Waste" : "Report")}
        </Text>
        <Text style={styles.reportMeta}>
          {item.address || "Location unknown"} · {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.statusBadgeText, { color: cfg.text }]}>
          {STATUS_LABEL[item.status] || item.status}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const WasteAuthorityDashboard = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [reports, setReports]  = useState([]);
  const [loading, setLoading]  = useState(true);
  const [refresh, setRefresh]  = useState(false);

  const load = useCallback(async () => {
    try {
      const api = require("../api/apiClient").default;
      const res = await api.get("/reports?limit=5").catch(() => ({ data: { data: [] } }));
      setReports(res.data.data || []);
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

  const pending    = reports.filter(r => r.status === "pending").length;
  const inReview   = reports.filter(r => r.status === "under_review").length;
  const cleaned    = reports.filter(r => r.status === "cleaned").length;

  return (
    <View style={styles.screen}>
      {/* Sticky header */}
      <DashboardHeader
        title={`Hi, ${user?.name?.split(" ")[0] || "Officer"} 👋`}
        subtitle="Waste Authority · BinGo"
        accentColor="#00695C"
        onNotif={() => navigation.navigate("Notifications")}
        onLogout={handleLogout}
      />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refresh} onRefresh={() => { setRefresh(true); load(); }} tintColor="#00695C" />
        }
      >
        {/* Priority stats */}
        <SectionTitle>Today's Overview</SectionTitle>
        <View style={styles.priorityRow}>
          <PriorityCard emoji="🚨" label="Pending"   value={pending}  color={COLORS.ERROR}   bg="#FFEBEE" />
          <PriorityCard emoji="🔍" label="In Review" value={inReview} color={COLORS.INFO}    bg="#E3F2FD" />
          <PriorityCard emoji="✅" label="Cleaned"   value={cleaned}  color={COLORS.SUCCESS} bg="#E8F5E9" />
          <PriorityCard emoji="📋" label="Total"     value={reports.length} color="#00695C"  bg="#E0F2F1" />
        </View>

        {/* Assigned reports */}
        <SectionTitle>Recent Reports</SectionTitle>
        {loading ? (
          <ActivityIndicator color="#00695C" style={{ marginVertical: 16 }} />
        ) : reports.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyEmoji}>✅</Text>
            <Text style={styles.emptyText}>All clear — no reports to action</Text>
          </View>
        ) : (
          <View style={styles.reportList}>
            {reports.map(r => (
              <ReportRow
                key={r._id}
                item={r}
                onPress={() => navigation.navigate("Map", { screen: "ReportDetails", params: { reportId: r._id } })}
              />
            ))}
            <TouchableOpacity onPress={() => navigation.navigate("Map")}>
              <Text style={styles.viewAll}>View all on map →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Quick actions */}
        <SectionTitle>Actions</SectionTitle>
        <View style={styles.actionGrid}>
          {[
            { emoji: "🗺️", label: "Waste Map",        desc: "View all reported locations",  color: COLORS.INFO,    screen: "Map" },
            { emoji: "📅", label: "Collection Schedule", desc: "Manage pickup routes",        color: "#00695C",      screen: "Schedule" },
            { emoji: "👥", label: "Community Board",   desc: "Communicate with residents",   color: COLORS.PRIMARY, screen: "Community" },
            { emoji: "♻️", label: "Recycling Guide",   desc: "Update recycling information", color: COLORS.SUCCESS, screen: "Recycling" },
          ].map(a => (
            <TouchableOpacity
              key={a.label}
              style={[styles.actionCard, { borderLeftColor: a.color }]}
              onPress={() => navigation.navigate(a.screen)}
              accessibilityRole="button"
            >
              <Text style={styles.actionEmoji}>{a.emoji}</Text>
              <View>
                <Text style={styles.actionLabel}>{a.label}</Text>
                <Text style={styles.actionDesc}>{a.desc}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Collection status banner */}
        <View style={styles.routeBanner}>
          <Text style={styles.routeTitle}>🚛  Collection Routes</Text>
          <Text style={styles.routeDesc}>
            Today's scheduled collections are active. Tap Schedule to manage routes and mark completions.
          </Text>
          <TouchableOpacity
            style={styles.routeBtn}
            onPress={() => navigation.navigate("Schedule")}
            accessibilityRole="button"
          >
            <Text style={styles.routeBtnText}>Manage Routes</Text>
          </TouchableOpacity>
        </View>
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

  priorityRow: { flexDirection: "row", gap: 8 },
  priorityCard: {
    flex: 1, borderRadius: 12, padding: 10,
    alignItems: "center", borderWidth: 1.5, gap: 2,
  },
  priorityEmoji: { fontSize: 20 },
  priorityValue: { fontSize: 22, fontWeight: "800" },
  priorityLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, textAlign: "center" },

  reportList: { gap: 1, backgroundColor: COLORS.SURFACE, borderRadius: 12, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  reportRow: {
    flexDirection: "row", alignItems: "center", padding: 12, gap: 10,
    backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  reportInfo: { flex: 1 },
  reportTitle: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  reportMeta:  { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusBadgeText: { fontSize: 10, fontWeight: "700" },

  viewAll: { color: "#00695C", fontSize: 13, fontWeight: "600", textAlign: "right", padding: 10 },

  emptyCard: {
    backgroundColor: "#E0F2F1", borderRadius: 12, padding: 24,
    alignItems: "center", gap: 8,
  },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 14, color: "#00695C", fontWeight: "500" },

  actionGrid: { gap: 10 },
  actionCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderLeftWidth: 4, elevation: 1,
  },
  actionEmoji: { fontSize: 26 },
  actionLabel: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  actionDesc:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  routeBanner: {
    backgroundColor: "#004D40", borderRadius: 14, padding: 18,
    marginTop: 8, gap: 8,
  },
  routeTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  routeDesc:  { fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 18 },
  routeBtn: {
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8,
    paddingVertical: 10, alignItems: "center", marginTop: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  routeBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});

export default WasteAuthorityDashboard;
