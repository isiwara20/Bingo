/**
 * BinGo – Report Details Screen
 * Member 2 – US-M2-05
 *
 * Full detail view for a single waste report.
 * Navigated to from ReportStatusScreen (by report ID) or
 * from WasteMapScreen (via marker "View Details").
 *
 * route.params.reportId  → fetch from API
 * route.params.report    → use data directly (from map callout)
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getReportById } from "../services/reportService";
import COLORS from "../constants/colors";

const STATUS_CONFIG = {
  pending:      { label: "Pending",       color: COLORS.STATUS_PENDING,      emoji: "⏳", bg: "#FFF3E0" },
  under_review: { label: "Under Review",  color: COLORS.STATUS_UNDER_REVIEW, emoji: "🔍", bg: "#E3F2FD" },
  cleaned:      { label: "Cleaned",       color: COLORS.STATUS_CLEANED,      emoji: "✅", bg: "#E8F5E9" },
  rejected:     { label: "Rejected",      color: COLORS.STATUS_REJECTED,     emoji: "❌", bg: "#FFEBEE" },
};

const WASTE_EMOJIS = {
  general: "🗑️", plastic: "🧴", glass: "🍶", paper: "📄",
  metal: "🔩", electronic: "📱", construction: "🧱",
  organic: "🌿", hazardous: "☢️", mixed: "♻️", other: "❓",
};

const ReportDetailsScreen = ({ route, navigation }) => {
  const { reportId, report: inlineReport } = route.params || {};

  const [report, setReport] = useState(inlineReport || null);
  const [loading, setLoading] = useState(!inlineReport);
  const [error, setError]   = useState(null);

  useEffect(() => {
    if (inlineReport) return; // already have data
    if (!reportId) {
      setError("Report ID not provided.");
      setLoading(false);
      return;
    }
    const fetch = async () => {
      try {
        const data = await getReportById(reportId);
        setReport(data);
      } catch (err) {
        setError(err.message || "Failed to load report details.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [reportId, inlineReport]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading report…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !report) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Report</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = STATUS_CONFIG[report.status] || {
    label: report.status, color: COLORS.TEXT_SECONDARY,
    emoji: "📋", bg: COLORS.SURFACE,
  };
  const wasteEmoji = WASTE_EMOJIS[report.wasteType] || "🗑️";
  const wasteLabel = report.wasteType
    ? report.wasteType.charAt(0).toUpperCase() + report.wasteType.slice(1) + " Waste"
    : "Unknown";

  // Coordinates come as GeoJSON [lng, lat]
  const lat = report.location?.coordinates?.[1];
  const lng = report.location?.coordinates?.[0];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Report Details</Text>

        {/* ── Status banner ───────────────────────────────────────────── */}
        <View style={[styles.statusBanner, { backgroundColor: cfg.bg }]}>
          <Text style={styles.statusBannerEmoji}>{cfg.emoji}</Text>
          <View>
            <Text style={[styles.statusBannerLabel, { color: cfg.color }]}>
              {cfg.label}
            </Text>
            <Text style={styles.statusBannerSub}>Current report status</Text>
          </View>
        </View>

        {/* ── Photo ───────────────────────────────────────────────────── */}
        {report.imageUrl ? (
          <Image
            source={{ uri: report.imageUrl }}
            style={styles.photo}
            resizeMode="cover"
            accessibilityLabel="Report photo evidence"
          />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.noPhotoText}>📷  No photo attached</Text>
          </View>
        )}

        {/* ── Detail rows ─────────────────────────────────────────────── */}
        <DetailRow
          label="Waste Category"
          value={`${wasteEmoji}  ${wasteLabel}`}
        />
        <DetailRow
          label="Description"
          value={report.description}
          multiline
        />
        {report.address ? (
          <DetailRow label="Address" value={report.address} />
        ) : null}
        <DetailRow
          label="GPS Coordinates"
          value={
            lat != null && lng != null
              ? `${lat.toFixed(6)}, ${lng.toFixed(6)}`
              : "Not available"
          }
        />
        <DetailRow
          label="Submitted"
          value={new Date(report.createdAt).toLocaleString("en-US", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
          })}
        />
        {report.reviewNote ? (
          <DetailRow
            label="Authority Review Note"
            value={report.reviewNote}
            multiline
            highlight
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────
const DetailRow = ({ label, value, multiline = false, highlight = false }) => (
  <View style={[styles.detailRow, highlight && styles.detailRowHighlight]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text
      style={[styles.detailValue, highlight && styles.detailValueHighlight]}
      numberOfLines={multiline ? 0 : 3}
    >
      {value}
    </Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  scroll: { padding: 16, paddingBottom: 48 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 16 },

  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  statusBannerEmoji: { fontSize: 28 },
  statusBannerLabel: { fontSize: 16, fontWeight: "bold" },
  statusBannerSub: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },

  photo: {
    width: "100%", height: 220,
    borderRadius: 12, marginBottom: 16,
  },
  noPhoto: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12, height: 80,
    justifyContent: "center", alignItems: "center",
    marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  noPhotoText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  detailRow: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  detailRowHighlight: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: COLORS.WARNING,
  },
  detailLabel: {
    fontSize: 11, color: COLORS.TEXT_SECONDARY, marginBottom: 4, fontWeight: "600",
  },
  detailValue: { fontSize: 15, color: COLORS.TEXT_PRIMARY, lineHeight: 22 },
  detailValueHighlight: { color: COLORS.TEXT_PRIMARY, fontStyle: "italic" },

  errorEmoji: { fontSize: 48, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  errorMsg: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold" },
});

export default ReportDetailsScreen;
