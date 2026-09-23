/**
 * BinGo – Report Review Screen (Member 2)
 * US-M2-01 – review step before final submission
 *
 * UI styled to match Member 3's CollectionScheduleScreen pattern:
 *   – Dark green header with back/step badge
 *   – White detail cards with left-color border (Member 3 todayCard pattern)
 *   – Info rows with icon box + label + value (Member 3 infoRow pattern)
 *   – Amber Submit button, outlined Edit button
 */

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createReport } from "../services/reportService";
import COLORS from "../constants/colors";

const WASTE_CONFIG = {
  plastic:      { label: "Plastic Waste",      emoji: "🧴", color: "#3B82F6" },
  organic:      { label: "Organic Waste",      emoji: "🌿", color: "#16A34A" },
  electronic:   { label: "Electronic Waste",   emoji: "📱", color: "#DC2626" },
  construction: { label: "Construction Waste", emoji: "🧱", color: "#D97706" },
  general:      { label: "General Waste",      emoji: "🗑️", color: "#6B7280" },
  glass:        { label: "Glass",              emoji: "🍶", color: "#8B5CF6" },
  metal:        { label: "Metal",              emoji: "🔩", color: "#6B7280" },
  hazardous:    { label: "Hazardous",          emoji: "⚠️", color: "#DC2626" },
  other:        { label: "Other",              emoji: "❓", color: COLORS.PRIMARY },
};
const getWC = (t) => WASTE_CONFIG[t] || { label: t, emoji: "🗑️", color: COLORS.PRIMARY };

export default function ReportReviewScreen({ route, navigation }) {
  const { wasteType, description, latitude, longitude, imageUri } = route.params || {};
  const [submitting, setSubmitting] = useState(false);
  const wc = getWC(wasteType);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const report = await createReport({
        wasteType, description, latitude, longitude,
        imageUrl: imageUri || null,
      });
      navigation.replace("ReportStatus", { newReport: report });
    } catch (err) {
      Alert.alert("Submission Failed",
        err.message || "Unable to submit your report. Please try again.",
        [{ text: "OK" }]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={S.root} edges={["top"]}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button" accessibilityLabel="Go back to edit">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Review Incident</Text>
          <Text style={S.headerSub}>CONFIRM BEFORE SUBMITTING</Text>
        </View>
        <View style={S.headerBadge}>
          <View style={S.syncDot} />
          <Text style={S.headerBadgeTxt}>Synced</Text>
        </View>
      </View>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Photo or placeholder ──────────────────────────────────── */}
        <View style={[S.photoCard, { borderLeftColor: wc.color }]}>
          {/* Type badge */}
          <View style={[S.typeBadge, { backgroundColor: wc.color }]}>
            <View style={S.typeBadgeDot} />
            <Text style={S.typeBadgeTxt}>{wc.label.toUpperCase()}</Text>
          </View>

          {imageUri ? (
            <Image source={{ uri: imageUri }} style={S.photo} resizeMode="cover"
              accessibilityLabel="Report photo evidence" />
          ) : (
            <View style={S.noPhoto}>
              <Text style={S.noPhotoTxt}>[ No photo attached ]</Text>
            </View>
          )}
        </View>

        {/* ── Detail rows (Member 3 infoRow card pattern) ─────────────── */}
        <InfoRow label="INCIDENT TYPE"
          content={<View style={S.typeRow}>
            <View style={[S.typeColorDot, { backgroundColor: wc.color }]} />
            <Text style={S.typeLabel}>{wc.emoji}  {wc.label}</Text>
          </View>} />

        <InfoRow label="LOCATION (GPS)"
          content={<Text style={S.infoValue}>
            {latitude?.toFixed(4)}° N, {longitude?.toFixed(4)}° E
          </Text>} />

        <InfoRow label="NOTE"
          content={<Text style={S.infoValue} numberOfLines={0}>
            {description}
          </Text>} />

        <InfoRow label="TIMESTAMP"
          content={<Text style={S.infoValue}>
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric", month: "short", year: "numeric",
              hour: "2-digit", minute: "2-digit",
            })}
          </Text>} />

        <InfoRow label="INITIAL STATUS"
          content={<Text style={[S.infoValue, { color: COLORS.STATUS_PENDING, fontWeight: "700" }]}>
            ⏳  Pending Review
          </Text>} />

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <View style={S.actions}>
          <TouchableOpacity style={S.editBtn} onPress={() => navigation.goBack()}
            disabled={submitting} accessibilityRole="button" accessibilityLabel="Edit report">
            <Text style={S.editBtnTxt}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[S.submitBtn, submitting && S.submitBtnDisabled]}
            onPress={handleSubmit} disabled={submitting}
            accessibilityRole="button" accessibilityLabel="Submit incident">
            {submitting
              ? <ActivityIndicator color={COLORS.TEXT_INVERSE} />
              : <Text style={S.submitBtnTxt}>Submit Incident</Text>}
          </TouchableOpacity>
        </View>

        <Text style={S.disclaimer}>
          Your report will be submitted to local waste management authorities.
          You can track its status after submission.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── InfoRow (matches Member 3's infoRow pattern) ──────────────────────────
const InfoRow = ({ label, content }) => (
  <View style={S.infoCard}>
    <Text style={S.infoLabel}>{label}</Text>
    {content}
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root:  { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { flex: 1 },

  // Header
  header:  { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG,
              paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)",
              justifyContent: "center", alignItems: "center" },
  backIcon: { color: COLORS.TEXT_INVERSE, fontSize: 18, fontWeight: "600" },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_INVERSE },
  headerSub:   { fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 1, letterSpacing: 1 },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 4,
                  backgroundColor: "rgba(255,255,255,0.12)", borderRadius: 8,
                  paddingHorizontal: 8, paddingVertical: 4 },
  syncDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: "#22C55E" },
  headerBadgeTxt: { fontSize: 11, fontWeight: "600", color: COLORS.TEXT_INVERSE },

  // Photo card — left border stripe (Member 3 todayCard pattern)
  photoCard: { margin: 16, borderRadius: 14, backgroundColor: COLORS.SURFACE,
                borderWidth: 1, borderColor: COLORS.BORDER, borderLeftWidth: 4,
                overflow: "hidden" },
  typeBadge: { flexDirection: "row", alignItems: "center", gap: 6,
                paddingHorizontal: 12, paddingVertical: 8 },
  typeBadgeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.8)" },
  typeBadgeTxt: { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_INVERSE, letterSpacing: 1 },
  photo:     { width: "100%", height: 200, resizeMode: "cover" },
  noPhoto:   { height: 100, justifyContent: "center", alignItems: "center",
                backgroundColor: "#F9FAFB" },
  noPhotoTxt: { fontSize: 13, color: COLORS.TEXT_SECONDARY },

  // Info cards — Member 3 infoRow style
  infoCard:   { marginHorizontal: 16, marginBottom: 4, backgroundColor: COLORS.SURFACE,
                 borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12,
                 borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER },
  infoLabel:  { fontSize: 10, fontWeight: "700", color: COLORS.TEXT_SECONDARY,
                 letterSpacing: 1, marginBottom: 6 },
  infoValue:  { fontSize: 14, color: COLORS.TEXT_PRIMARY, lineHeight: 20 },
  typeRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  typeColorDot: { width: 14, height: 14, borderRadius: 3 },
  typeLabel:  { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },

  // Buttons
  actions:   { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 24 },
  editBtn:   { flex: 1, paddingVertical: 15, borderRadius: 14, borderWidth: 1.5,
                borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE, alignItems: "center" },
  editBtnTxt: { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  submitBtn:  { flex: 2, paddingVertical: 15, borderRadius: 14,
                 backgroundColor: COLORS.PRIMARY, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.65 },
  submitBtnTxt: { color: COLORS.TEXT_INVERSE, fontSize: 15, fontWeight: "800" },

  disclaimer: { fontSize: 11, color: COLORS.TEXT_DISABLED, textAlign: "center",
                 marginTop: 14, marginHorizontal: 16, lineHeight: 16 },
});
