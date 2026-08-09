/**
 * BinGo – Report Details Screen
 *
 * Displays the full details of a single waste report.
 * Navigated to from ReportStatusScreen or HomeScreen recent reports.
 *
 * TODO (Member 2): Add review notes display, admin status update UI.
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native";
import { getReportById } from "../services/reportService";
import COLORS from "../constants/colors";

const STATUS_COLORS = {
  pending: COLORS.STATUS_PENDING,
  under_review: COLORS.STATUS_UNDER_REVIEW,
  cleaned: COLORS.STATUS_CLEANED,
  rejected: COLORS.STATUS_REJECTED,
};

const STATUS_LABELS = {
  pending: "Pending",
  under_review: "Under Review",
  cleaned: "Cleaned",
  rejected: "Rejected",
};

const ReportDetailsScreen = ({ route, navigation }) => {
  const { reportId } = route.params || {};
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) {
      Alert.alert("Error", "Report not found.");
      navigation.goBack();
      return;
    }

    const fetchReport = async () => {
      try {
        const data = await getReportById(reportId);
        setReport(data);
      } catch (error) {
        Alert.alert("Error", error.message || "Failed to load report.");
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportId]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  if (!report) return null;

  const statusColor = STATUS_COLORS[report.status] || COLORS.TEXT_SECONDARY;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.back}
          accessibilityRole="button"
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Report Details</Text>

        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>
            {STATUS_LABELS[report.status] || report.status}
          </Text>
        </View>

        {/* Image */}
        {report.imageUrl && (
          <Image
            source={{ uri: report.imageUrl }}
            style={styles.image}
            accessibilityLabel="Report photo"
          />
        )}

        {/* Details */}
        <InfoRow label="Waste Type" value={report.wasteType} />
        <InfoRow label="Description" value={report.description} />
        {report.address && <InfoRow label="Address" value={report.address} />}
        <InfoRow
          label="Location"
          value={`${report.location?.coordinates?.[1]?.toFixed(5)}, ${report.location?.coordinates?.[0]?.toFixed(5)}`}
        />
        <InfoRow
          label="Submitted"
          value={new Date(report.createdAt).toLocaleString()}
        />
        {report.reviewNote && (
          <InfoRow label="Review Note" value={report.reviewNote} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollContent: { padding: 16 },
  back: { marginBottom: 12 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  statusText: { color: COLORS.TEXT_INVERSE, fontWeight: "700", fontSize: 13 },
  image: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    marginBottom: 16,
    resizeMode: "cover",
  },
  infoRow: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  infoLabel: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  infoValue: { fontSize: 15, color: COLORS.TEXT_PRIMARY },
});

export default ReportDetailsScreen;
