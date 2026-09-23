/**
 * BinGo – Report Status Screen (Member 2)
 * US-M2-05 – shows submitted reports list, success banner
 *
 * UI styled to match Member 3's CollectionScheduleScreen pattern:
 *   – Dark green header, section labels, list cards with left-color border
 *   – Status badges matching Member 3's wasteType color pattern
 *   – Empty state with emoji and CTA button
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getMyReports } from "../services/reportService";
import COLORS from "../constants/colors";

// ── Status config (matches Member 3 color pattern) ───────────────────────
const STATUS_CONFIG = {
  pending:      { label: "Pending",      emoji: "⏳", color: COLORS.STATUS_PENDING,      bg: "#FFF3E0" },
  under_review: { label: "Under Review", emoji: "🔍", color: COLORS.STATUS_UNDER_REVIEW, bg: "#E3F2FD" },
  cleaned:      { label: "Cleaned ✓",   emoji: "✅", color: COLORS.STATUS_CLEANED,      bg: "#E8F5E9" },
  rejected:     { label: "Rejected",     emoji: "❌", color: COLORS.STATUS_REJECTED,     bg: "#FFEBEE" },
};
const getSC = (s) => STATUS_CONFIG[s] || { label: s, emoji: "📋", color: COLORS.TEXT_SECONDARY, bg: COLORS.SURFACE };

const WASTE_CONFIG = {
  plastic:      { emoji: "🧴", color: "#3B82F6", label: "Plastic Waste" },
  organic:      { emoji: "🌿", color: "#16A34A", label: "Organic Waste" },
  electronic:   { emoji: "📱", color: "#DC2626", label: "Electronic Waste" },
  construction: { emoji: "🧱", color: "#D97706", label: "Construction Waste" },
  general:      { emoji: "🗑️", color: "#6B7280", label: "General Waste" },
  glass:        { emoji: "🍶", color: "#8B5CF6", label: "Glass" },
  metal:        { emoji: "🔩", color: "#6B7280", label: "Metal" },
  hazardous:    { emoji: "⚠️", color: "#DC2626", label: "Hazardous" },
  other:        { emoji: "❓", color: COLORS.PRIMARY, label: "Other" },
};
const getWC = (t) => WASTE_CONFIG[t] || { emoji: "🗑️", color: COLORS.PRIMARY, label: t };

// ── Report Card (Member 3 todayCard + comingRow pattern) ──────────────────
const ReportCard = ({ report, onPress }) => {
  const sc = getSC(report.status);
  const wc = getWC(report.wasteType);

  return (
    <TouchableOpacity style={[S.card, { borderLeftColor: sc.color }]}
      onPress={() => onPress(report._id)}
      accessibilityRole="button"
      accessibilityLabel={`Report: ${wc.label}, status: ${sc.label}`}>

      {/* Left: waste emoji icon box */}
      <View style={[S.cardIconBox, { backgroundColor: wc.color + "18" }]}>
        <Text style={S.cardEmoji}>{wc.emoji}</Text>
      </View>

      {/* Middle: details */}
      <View style={S.cardBody}>
        <Text style={S.cardType}>{wc.label}</Text>
        <Text style={S.cardDesc} numberOfLines={2}>{report.description}</Text>
        <Text style={S.cardMeta}>
          {new Date(report.createdAt).toLocaleDateString("en-GB", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </Text>
      </View>

      {/* Right: status badge (Member 3 coming-up days pill pattern) */}
      <View style={[S.statusPill, { backgroundColor: sc.bg }]}>
        <Text style={S.statusEmoji}>{sc.emoji}</Text>
        <Text style={[S.statusTxt, { color: sc.color }]}>{sc.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Empty state (Member 3 emptyCard pattern) ──────────────────────────────
const EmptyState = ({ onReport }) => (
  <View style={S.emptyCard}>
    <Text style={{ fontSize: 52, marginBottom: 12 }}>📋</Text>
    <Text style={S.emptyTitle}>No Reports Yet</Text>
    <Text style={S.emptySub}>
      You haven't submitted any waste reports.{"\n"}
      Be the first to report illegal dumping in your neighbourhood.
    </Text>
    <TouchableOpacity style={S.emptyBtn} onPress={onReport}
      accessibilityRole="button" accessibilityLabel="Submit first report">
      <Text style={S.emptyBtnTxt}>Report Waste Now →</Text>
    </TouchableOpacity>
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────
export default function ReportStatusScreen({ route, navigation }) {
  const newReport = route.params?.newReport;

  const [reports,    setReports]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState(null);

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

  if (loading) {
    return (
      <SafeAreaView style={S.root}>
        <View style={S.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
            <Text style={S.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={S.headerMid}>
            <Text style={S.headerTitle}>My Reports</Text>
          </View>
        </View>
        <View style={S.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={{ color: COLORS.TEXT_SECONDARY, marginTop: 8 }}>Loading your reports…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.root} edges={["top"]}>
      {/* ── Header ─────────────────────────────────────────────────── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>My Reports</Text>
          <Text style={S.headerSub}>{reports.length} report{reports.length !== 1 ? "s" : ""} submitted</Text>
        </View>
        <TouchableOpacity style={S.headerAction}
          onPress={() => navigation.navigate("ReportWaste")}
          accessibilityRole="button" accessibilityLabel="New report">
          <Text style={S.headerActionTxt}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* ── Success banner (Member 3 greetBanner pattern) ──────────── */}
      {newReport && (
        <View style={S.successBanner}>
          <Text style={S.successTitle}>✅  Report Submitted!</Text>
          <Text style={S.successSub}>
            Your report is now{" "}
            <Text style={{ fontWeight: "800" }}>Pending Review</Text>.
            We'll notify you when its status changes.
          </Text>
        </View>
      )}

      {/* ── Error ──────────────────────────────────────────────────── */}
      {error && (
        <View style={S.errorBanner}>
          <Text style={S.errorTxt}>{error}</Text>
          <TouchableOpacity onPress={fetchReports}>
            <Text style={S.retryTxt}>Retry →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Section label (Member 3 sectionLabel pattern) ───────────── */}
      {reports.length > 0 && (
        <View style={S.sectionRow}>
          <Text style={S.sectionLabel}>SUBMITTED REPORTS</Text>
        </View>
      )}

      {/* ── List ────────────────────────────────────────────────────── */}
      {reports.length === 0 && !error ? (
        <EmptyState onReport={() => navigation.navigate("ReportWaste")} />
      ) : (
        <FlatList data={reports} keyExtractor={(r) => r._id}
          renderItem={({ item }) => (
            <ReportCard report={item}
              onPress={(id) => navigation.navigate("ReportDetails", { reportId: id })} />
          )}
          contentContainerStyle={S.list}
          refreshControl={
            <RefreshControl refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchReports(); }}
              colors={[COLORS.PRIMARY]} tintColor={COLORS.PRIMARY} />
          }
          ListFooterComponent={
            <Text style={S.footer}>
              {reports.length} report{reports.length !== 1 ? "s" : ""} total
            </Text>
          } />
      )}
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:   { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  // Header
  header:  { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG,
              paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center", alignItems: "center" },
  backIcon: { color: COLORS.TEXT_INVERSE, fontSize: 18, fontWeight: "600" },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_INVERSE },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.60)", marginTop: 1 },
  headerAction: { backgroundColor: COLORS.ACCENT, paddingHorizontal: 10, paddingVertical: 5,
                   borderRadius: 8 },
  headerActionTxt: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_INVERSE },

  // Success banner (Member 3 greetBanner pattern with PRIMARY color)
  successBanner: { backgroundColor: COLORS.PRIMARY, margin: 14, borderRadius: 14, padding: 14 },
  successTitle:  { fontSize: 15, fontWeight: "800", color: COLORS.TEXT_INVERSE, marginBottom: 4 },
  successSub:    { fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 18 },

  // Error
  errorBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  backgroundColor: "#FFEBEE", marginHorizontal: 14, borderRadius: 10,
                  padding: 12, marginBottom: 4 },
  errorTxt:    { color: COLORS.ERROR, fontSize: 13, flex: 1 },
  retryTxt:    { color: COLORS.ERROR, fontWeight: "700", marginLeft: 8 },

  // Section label
  sectionRow:   { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY,
                   letterSpacing: 1, textTransform: "uppercase" },

  list: { padding: 14, paddingTop: 4, paddingBottom: 24 },

  // Report card — Member 3 todayCard pattern (left border + icon + body + pill)
  card: { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 12, marginBottom: 8,
           flexDirection: "row", alignItems: "center", gap: 10, borderLeftWidth: 4,
           borderWidth: 1, borderColor: COLORS.BORDER,
           shadowColor: COLORS.SHADOW, shadowOffset: { width: 0, height: 1 },
           shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  cardIconBox: { width: 46, height: 46, borderRadius: 12, justifyContent: "center",
                  alignItems: "center" },
  cardEmoji:   { fontSize: 24 },
  cardBody:    { flex: 1 },
  cardType:    { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 2 },
  cardDesc:    { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },
  cardMeta:    { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 4 },

  // Status pill — Member 3 coming-up days pill
  statusPill:  { alignItems: "center", paddingHorizontal: 8, paddingVertical: 6,
                  borderRadius: 10, minWidth: 76 },
  statusEmoji: { fontSize: 16, marginBottom: 2 },
  statusTxt:   { fontSize: 9, fontWeight: "800", textAlign: "center" },

  // Empty state — Member 3 emptyCard pattern
  emptyCard: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  emptySub:   { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center",
                 lineHeight: 20, marginBottom: 24 },
  emptyBtn:   { backgroundColor: COLORS.ACCENT, paddingHorizontal: 28, paddingVertical: 14,
                 borderRadius: 14 },
  emptyBtnTxt: { color: COLORS.TEXT_INVERSE, fontWeight: "800", fontSize: 15 },

  footer: { textAlign: "center", color: COLORS.TEXT_DISABLED, fontSize: 12, marginTop: 8 },
});
