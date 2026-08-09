/**
 * BinGo – Report Status Screen
 *
 * US-07: As a resident, I want to view my report status.
 *
 * Two modes:
 *   1. Success confirmation after report submission (route.params.report)
 *   2. List of all user's reports (route.params.reportId → single view)
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

const STATUS_CONFIG = {
  pending: { label: "Pending", color: COLORS.STATUS_PENDING, emoji: "⏳" },
  under_review: { label: "Under Review", color: COLORS.STATUS_UNDER_REVIEW, emoji: "🔍" },
  cleaned: { label: "Cleaned", color: COLORS.STATUS_CLEANED, emoji: "✅" },
  rejected: { label: "Rejected", color: COLORS.STATUS_REJECTED, emoji: "❌" },
};

// ── Single report card ────────────────────────────────────────────────────
const ReportCard = ({ report, onPress }) => {
  const config = STATUS_CONFIG[report.status] || { label: report.status, color: COLORS.TEXT_SECONDARY, emoji: "📋" };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(report._id)}
      accessibilityRole="button"
      accessibilityLabel={`Report: ${report.wasteType}, status: ${config.label}`}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardEmoji}>{config.emoji}</Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardType}>{report.wasteType?.toUpperCase()}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>
          {report.description}
        </Text>
        <Text style={styles.cardDate}>
          {new Date(report.createdAt).toLocaleDateString()}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={styles.statusText}>{config.label}</Text>
      </View>
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────
const ReportStatusScreen = ({ route, navigation }) => {
  const newReport = route.params?.report;

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const data = await getMyReports();
      setReports(data);
    } catch (error) {
      console.error("Failed to load reports:", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  const handleViewDetails = (reportId) => {
    navigation.navigate("ReportDetails", { reportId });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Success banner after new submission */}
      {newReport && (
        <View style={styles.successBanner}>
          <Text style={styles.successTitle}>✅ Report Submitted!</Text>
          <Text style={styles.successText}>
            Your report has been received. We'll update you on its status.
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>My Reports</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("ReportWaste")}
          accessibilityRole="button"
          accessibilityLabel="Submit new report"
        >
          <Text style={styles.newReportLink}>+ New Report</Text>
        </TouchableOpacity>
      </View>

      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>No Reports Yet</Text>
          <Text style={styles.emptyText}>
            You haven't submitted any waste reports yet.
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate("ReportWaste")}
            accessibilityRole="button"
          >
            <Text style={styles.emptyButtonText}>Report Waste Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <ReportCard report={item} onPress={handleViewDetails} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.PRIMARY]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  successBanner: {
    backgroundColor: COLORS.SUCCESS,
    padding: 16,
    margin: 16,
    borderRadius: 12,
  },
  successTitle: { color: COLORS.TEXT_INVERSE, fontWeight: "bold", fontSize: 16, marginBottom: 4 },
  successText: { color: COLORS.TEXT_INVERSE, fontSize: 13 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  newReportLink: { color: COLORS.PRIMARY, fontWeight: "600", fontSize: 14 },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    elevation: 1,
  },
  cardLeft: { width: 36, alignItems: "center" },
  cardEmoji: { fontSize: 28 },
  cardContent: { flex: 1 },
  cardType: { fontSize: 11, fontWeight: "700", color: COLORS.TEXT_SECONDARY, letterSpacing: 0.5 },
  cardDesc: { fontSize: 14, color: COLORS.TEXT_PRIMARY, marginTop: 2, lineHeight: 20 },
  cardDate: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 4 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    alignItems: "center",
  },
  statusText: { color: COLORS.TEXT_INVERSE, fontSize: 10, fontWeight: "700" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  emptyButton: {
    marginTop: 24,
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  emptyButtonText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold", fontSize: 15 },
});

export default ReportStatusScreen;
