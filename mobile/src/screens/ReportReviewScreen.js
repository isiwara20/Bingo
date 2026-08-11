/**
 * BinGo – Report Review Screen
 * Member 2 – US-M2-01 (review step before final submission)
 *
 * Displays a full summary of the report for the user to confirm
 * before it is submitted to the backend.
 *
 * Receives via route.params:
 *   wasteType, description, latitude, longitude, imageUri
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createReport } from "../services/reportService";
import COLORS from "../constants/colors";

const WASTE_LABELS = {
  general:      { label: "General Waste",    emoji: "🗑️" },
  plastic:      { label: "Plastic",          emoji: "🧴" },
  glass:        { label: "Glass",            emoji: "🍶" },
  paper:        { label: "Paper",            emoji: "📄" },
  metal:        { label: "Metal",            emoji: "🔩" },
  electronic:   { label: "Electronic Waste", emoji: "📱" },
  construction: { label: "Construction Waste",emoji: "🧱" },
  organic:      { label: "Organic Waste",    emoji: "🌿" },
  hazardous:    { label: "Hazardous Waste",  emoji: "☢️" },
  mixed:        { label: "Mixed Waste",      emoji: "♻️" },
  other:        { label: "Other",            emoji: "❓" },
};

const ReportReviewScreen = ({ route, navigation }) => {
  const { wasteType, description, latitude, longitude, imageUri } =
    route.params || {};

  const [submitting, setSubmitting] = useState(false);

  const waste = WASTE_LABELS[wasteType] || { label: wasteType, emoji: "🗑️" };

  // ── Submit to backend ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const report = await createReport({
        wasteType,
        description,
        latitude,
        longitude,
        // TODO Sprint 2: Replace local URI with cloud storage URL
        imageUrl: imageUri || null,
      });
      // Navigate to status screen, passing the new report and flag for success banner
      navigation.replace("ReportStatus", { newReport: report });
    } catch (err) {
      Alert.alert(
        "Submission Failed",
        err.message || "Unable to submit your report. Please try again.",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Edit – go back to form ───────────────────────────────────────────────
  const handleEdit = () => navigation.goBack();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleEdit}
            accessibilityRole="button"
            accessibilityLabel="Go back to edit report"
          >
            <Text style={styles.backText}>← Edit</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Review Your Report</Text>
          <Text style={styles.subtitle}>
            Check the details before submitting
          </Text>
        </View>

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <View style={styles.stepRow}>
          <StepDot n={1} label="Details" done />
          <View style={styles.stepLineDone} />
          <StepDot n={2} label="Review" active />
          <View style={styles.stepLine} />
          <StepDot n={3} label="Done" />
        </View>

        {/* ── Photo ───────────────────────────────────────────────────── */}
        {imageUri ? (
          <Image
            source={{ uri: imageUri }}
            style={styles.photo}
            resizeMode="cover"
            accessibilityLabel="Report photo evidence"
          />
        ) : (
          <View style={styles.noPhotoBox}>
            <Text style={styles.noPhotoText}>📷  No photo attached</Text>
          </View>
        )}

        {/* ── Summary cards ───────────────────────────────────────────── */}
        <ReviewRow
          label="Waste Category"
          value={`${waste.emoji}  ${waste.label}`}
        />
        <ReviewRow
          label="Description"
          value={description}
          multiline
        />
        <ReviewRow
          label="Location (GPS)"
          value={`${latitude?.toFixed(6) ?? "—"}, ${longitude?.toFixed(6) ?? "—"}`}
        />
        <ReviewRow
          label="Initial Status"
          value="⏳  Pending review"
          valueStyle={{ color: COLORS.STATUS_PENDING, fontWeight: "600" }}
        />

        {/* ── Action buttons ───────────────────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={handleEdit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Edit report"
          >
            <Text style={styles.editBtnText}>✏️  Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            accessibilityRole="button"
            accessibilityLabel="Submit report"
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.TEXT_INVERSE} />
            ) : (
              <Text style={styles.submitBtnText}>Submit Report</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.disclaimer}>
          Your report will be submitted to local waste management authorities.
          You can track its status after submission.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────
const ReviewRow = ({ label, value, multiline = false, valueStyle }) => (
  <View style={styles.reviewRow}>
    <Text style={styles.reviewLabel}>{label}</Text>
    <Text
      style={[styles.reviewValue, valueStyle]}
      numberOfLines={multiline ? 0 : 2}
    >
      {value}
    </Text>
  </View>
);

const StepDot = ({ n, label, active = false, done = false }) => (
  <View style={styles.stepDotWrap}>
    <View style={[
      styles.stepDot,
      active && styles.stepDotActive,
      done   && styles.stepDotDone,
    ]}>
      <Text style={[
        styles.stepDotNum,
        (active || done) && styles.stepDotNumActive,
      ]}>
        {done ? "✓" : n}
      </Text>
    </View>
    <Text style={[
      styles.stepLabel,
      active && styles.stepLabelActive,
      done   && styles.stepLabelDone,
    ]}>
      {label}
    </Text>
  </View>
);

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, paddingBottom: 48 },

  header: { marginBottom: 20 },
  backText: { color: COLORS.PRIMARY, fontSize: 16, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.TEXT_SECONDARY },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  stepDotWrap: { alignItems: "center" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.BORDER,
    justifyContent: "center", alignItems: "center",
  },
  stepDotActive: { backgroundColor: COLORS.PRIMARY },
  stepDotDone:   { backgroundColor: COLORS.SUCCESS },
  stepDotNum: { fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_SECONDARY },
  stepDotNumActive: { color: COLORS.TEXT_INVERSE },
  stepLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  stepLabelActive: { color: COLORS.PRIMARY, fontWeight: "600" },
  stepLabelDone:   { color: COLORS.SUCCESS, fontWeight: "600" },
  stepLine:     { flex: 1, height: 2, backgroundColor: COLORS.BORDER, marginHorizontal: 4, marginBottom: 16 },
  stepLineDone: { flex: 1, height: 2, backgroundColor: COLORS.SUCCESS, marginHorizontal: 4, marginBottom: 16 },

  photo: {
    width: "100%", height: 210,
    borderRadius: 12, marginBottom: 16,
  },
  noPhotoBox: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    height: 80,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  noPhotoText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  reviewRow: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  reviewLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  reviewValue: { fontSize: 15, color: COLORS.TEXT_PRIMARY, lineHeight: 22 },

  actions: { flexDirection: "row", gap: 10, marginTop: 20 },
  editBtn: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
    alignItems: "center",
  },
  editBtnText: { color: COLORS.PRIMARY, fontSize: 15, fontWeight: "600" },
  submitBtn: {
    flex: 2,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { color: COLORS.TEXT_INVERSE, fontSize: 15, fontWeight: "bold" },

  disclaimer: {
    fontSize: 11,
    color: COLORS.TEXT_DISABLED,
    textAlign: "center",
    marginTop: 16,
    lineHeight: 16,
  },
});

export default ReportReviewScreen;
