/**
 * BinGo – Report Status Screen
 * Member 2 – US-M2-05
 *
 * Displays the authenticated user's submitted reports.
 * Shows a success banner when navigated from a fresh submission.
 *
 * route.params.newReport → show success banner
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyReports } from "../services/reportService";
import COLORS from "../constants/colors";

// ── Status configuration ───────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: COLORS.STATUS_PENDING,
    emoji: "⏳",
    bg: "#FFF3E0",
  },
  under_review: {
    label: "Under Review",
    color: COLORS.STATUS_UNDER_REVIEW,
    emoji: "🔍",
    bg: "#E3F2FD",
  },
  cleaned: {
    label: "Cleaned ✓",
    color: COLORS.STATUS_CLEANED,
    emoji: "✅",
    bg: "#E8F5E9",
  },
  rejected: {
    label: "Rejected",
    color: COLORS.STATUS_REJECTED,
    emoji: "❌",
    bg: "#FFEBEE",
  },
};

const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || {
    label: status,
    color: COLORS.TEXT_SECONDARY,
    emoji: "📋",
    bg: COLORS.SURFACE,
  };

const WASTE_EMOJIS = {
  general: "🗑️", plastic: "🧴", glass: "🍶", paper: "📄",
  metal: "🔩", electronic: "📱", construction: "🧱",
  organic: "🌿", hazardous: "☢️", mixed: "♻️", other: "❓",
};

// ── Report Card ────────────────────────────────────────────────────────────
const ReportCard = ({ report, onPress }) => {
  const cfg = getStatusConfig(report.status);
  const wasteEmoji = WASTE_EMOJIS[report.wasteType] || "🗑️";

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: cfg.color }]}
      onPress={() => onPress(report._id)}
      accessibilityRole="button"
      accessibilityLabel={`Report: ${report.wasteType}, status: ${cfg.label}`}
    >
      {/* Left: waste emoji */}
      <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg }]}>
        <Text style={styles.cardIcon}>{wasteEmoji}</Text>
      </View>

      {/* Middle: details */}
      <View style={styles.cardBody}>
        <Text style={styles.cardType}>
          {report.wasteType?.charAt(0).toUpperCase() + report.wasteType?.slice(1)} Waste
        </Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {report.description}
        </Text>
        <Text style={styles.cardMeta}>
          {new Date(report.createdAt).toLocaleDateString("en-US", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* Right: status badge */}
      <View style={[styles.statusBadge, { backgroundColor: cfg.color }]}>
        <Text style={styles.statusEmoji}>{cfg.emoji}</Text>
        <Text style={styles.statusLabel}>{cfg.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ onReport }) => (
  <View style={styles.empty}>
    <Text style={styles.emptyEmoji}>📋</Text>
    <Text style={styles.emptyTitle}>No Reports Yet</Text>
    <Text style={styles.emptyText}>
      You haven't submitted any waste reports.{"\n"}
      Be the first to report a dumping site in your neighbourhood.
    </Text>
    <TouchableOpacity
      style={styles.emptyBtn}
      onPress={onReport}
      accessibilityRole="button"
      accessibilityLabel="Submit first report"
    >
      <Text style={styles.emptyBtnText}>Report Waste Now</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Screen ────────────────────────────────────────────────────────────
const ReportStatusScreen = ({ route, navigation }) => {
  const newReport = route.params?.newReport;

  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState(null);

  const fetchReports = useCallback(async () => {
    setError(null);
    try {
      const data = await getMyReports();
      setReports(data);
    } catch (err) {
      setError(err.message || "Failed to load your reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const goToDetails = (reportId) =>
    navigation.navigate("ReportDetails", { reportId });

  const goToNewReport = () => navigation.navigate("ReportWaste");

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading your reports…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ── Success banner (shown once after submission) ─────────────── */}
      {newReport && (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>✅  Report Submitted!</Text>
          <Text style={styles.successText}>
            Your report has been received with status{" "}
            <Text style={{ fontWeight: "700" }}>Pending</Text>.
            We'll notify you when its status changes.
          </Text>
        </View>
      )}

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>My Reports</Text>
        <TouchableOpacity
          onPress={goToNewReport}
          accessibilityRole="button"
          accessibilityLabel="Submit new report"
        >
          <Text style={styles.newReportLink}>+ New Report</Text>
        </TouchableOpacity>
      </View>

      {/* ── Error state ─────────────────────────────────────────────── */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchReports}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ────────────────────────────────────────────────────── */}
      {reports.length === 0 && !error ? (
        <EmptyState onReport={goToNewReport} />
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReportCard report={item} onPress={goToDetails} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListFooterComponent={
            <Text style={styles.footer}>{reports.length} report{reports.length !== 1 ? "s" : ""} submitted</Text>
          }
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  successBanner: {
    backgroundColor: COLORS.SUCCESS,
    margin: 16,
    marginBottom: 0,
    borderRadius: 12,
    padding: 14,
  },
  successTitle: { color: COLORS.TEXT_INVERSE, fontWeight: "bold", fontSize: 15, marginBottom: 4 },
  successText: { color: COLORS.TEXT_INVERSE, fontSize: 13, lineHeight: 18 },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  listTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  newReportLink: { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 14 },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFEBEE",
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorText: { color: COLORS.ERROR, fontSize: 13, flex: 1 },
  retryText: { color: COLORS.ERROR, fontWeight: "700", marginLeft: 8 },

  list: { padding: 16, paddingTop: 4, paddingBottom: 24 },

  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    borderLeftWidth: 4,
  },
  cardIconWrap: {
    width: 44, height: 44, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  cardIcon: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardType: {
    fontSize: 12, fontWeight: "700",
    color: COLORS.TEXT_PRIMARY, marginBottom: 2,
  },
  cardDesc: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },
  cardMeta: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 4 },
  statusBadge: {
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    minWidth: 72,
  },
  statusEmoji: { fontSize: 14 },
  statusLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.TEXT_INVERSE,
    marginTop: 2,
    textAlign: "center",
  },

  empty: {
    flex: 1, justifyContent: "center", alignItems: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  emptyText: {
    fontSize: 14, color: COLORS.TEXT_SECONDARY,
    textAlign: "center", lineHeight: 20,
  },
  emptyBtn: {
    marginTop: 24,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold", fontSize: 15 },

  footer: {
    textAlign: "center",
    color: COLORS.TEXT_DISABLED,
    fontSize: 12,
    marginTop: 8,
    marginBottom: 8,
  },
});

export default ReportStatusScreen;
