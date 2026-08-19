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
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* ── Dark green header ────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={handleEdit}
            accessibilityRole="button"
            accessibilityLabel="Go back to edit report"
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.stepSubtitle}>STEP 2 OF 3 · REVIEW</Text>
            <Text style={styles.title}>Review Your Report</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >

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
            <Text style={styles.editBtnText}>Edit</Text>
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
              <Text style={styles.submitBtnText}>Submit Incident</Text>
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

  // Dark green header
  header: {
    backgroundColor: COLORS.HEADER_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  backText: { color: COLORS.TEXT_INVERSE, fontSize: 22, fontWeight: "300", marginRight: 10 },
  stepSubtitle: { fontSize: 11, color: COLORS.PRIMARY_TINT, letterSpacing: 1, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_INVERSE },

  scroll: { padding: 16, paddingBottom: 48 },

  stepRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", marginBottom: 20, paddingHorizontal: 8,
  },
  stepDotWrap: { alignItems: "center" },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.STEP_INACTIVE,
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: COLORS.STEP_INACTIVE,
  },
  stepDotActive: { backgroundColor: COLORS.STEP_ACTIVE, borderColor: COLORS.STEP_ACTIVE },
  stepDotDone:   { backgroundColor: COLORS.STEP_DONE,   borderColor: COLORS.STEP_DONE },
  stepDotNum:    { fontSize: 13, fontWeight: "bold", color: COLORS.TEXT_SECONDARY },
  stepDotNumActive: { color: COLORS.TEXT_INVERSE },
  stepLabel:     { fontSize: 9, color: COLORS.TEXT_DISABLED, marginTop: 4, fontWeight: "700", letterSpacing: 0.5 },
  stepLabelActive: { color: COLORS.STEP_ACTIVE },
  stepLabelDone:   { color: COLORS.STEP_DONE },
  stepLine:     { flex: 1, height: 2, backgroundColor: COLORS.STEP_LINE, marginHorizontal: 4, marginBottom: 18 },
  stepLineDone: { flex: 1, height: 2, backgroundColor: COLORS.STEP_DONE, marginHorizontal: 4, marginBottom: 18 },

  photo: { width: "100%", height: 210, borderRadius: 12, marginBottom: 16 },
  noPhotoBox: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    height: 80, justifyContent: "center", alignItems: "center",
    marginBottom: 16, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  noPhotoText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  reviewRow: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  reviewLabel: {
    fontSize: 10, color: COLORS.TEXT_SECONDARY,
    marginBottom: 4, fontWeight: "700",
    textTransform: "uppercase", letterSpacing: 0.8,
  },
  reviewValue: { fontSize: 15, color: COLORS.TEXT_PRIMARY, lineHeight: 22 },

  actions: { flexDirection: "row", gap: 10, marginTop: 24 },
  editBtn: {
    flex: 1, paddingVertical: 15, borderRadius: 12,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE, alignItems: "center",
  },
  editBtnText: { color: COLORS.TEXT_PRIMARY, fontSize: 15, fontWeight: "700" },
  submitBtn: {
    flex: 2, paddingVertical: 15, borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    alignItems: "center", justifyContent: "center",
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnText: { color: COLORS.TEXT_INVERSE, fontSize: 15, fontWeight: "bold" },

  disclaimer: {
    fontSize: 11, color: COLORS.TEXT_DISABLED,
    textAlign: "center", marginTop: 16, lineHeight: 16,
  },
});

export default ReportReviewScreen;
