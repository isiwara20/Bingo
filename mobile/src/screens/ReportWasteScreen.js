/**
 * BinGo – Report Waste Screen
 * Member 2 – US-M2-01, US-M2-02, US-M2-03, US-M2-04
 *
 * Redesigned to match high-fidelity wireframes:
 *   - Dark green header bar
 *   - 4-step progress indicator (green circles)
 *   - 2×2 waste category grid with icon backgrounds + SELECT radio
 *   - GPS location button
 *   - Image picker
 *   - Amber "Continue >" CTA button
 */

import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentLocation } from "../services/locationService";
import { takePhoto, pickImageFromLibrary } from "../services/imageService";
import COLORS from "../constants/colors";

// ── Waste categories matching wireframe style ─────────────────────────────
const WASTE_CATEGORIES = [
  { value: "plastic",      label: "Plastic Waste",       emoji: "🧴", desc: "Bottles, bags, packaging" },
  { value: "organic",      label: "Organic Waste",       emoji: "🌿", desc: "Food, garden, compostable" },
  { value: "electronic",   label: "Electronic Waste",    emoji: "📱", desc: "Devices, cables, batteries" },
  { value: "construction", label: "Construction Waste",  emoji: "🧱", desc: "Rubble, timber, metals" },
  { value: "general",      label: "General Waste",       emoji: "🗑️", desc: "Mixed or unclassified waste" },
  { value: "glass",        label: "Glass",               emoji: "🍶", desc: "Bottles, jars, mirrors" },
  { value: "metal",        label: "Metal",               emoji: "🔩", desc: "Cans, pipes, scrap metal" },
  { value: "hazardous",    label: "Hazardous",           emoji: "☢️", desc: "Chemicals, paint, batteries" },
  { value: "other",        label: "Other",               emoji: "❓", desc: "Doesn't fit above categories" },
];

const MAX_DESCRIPTION = 1000;
const MIN_DESCRIPTION = 10;

const ReportWasteScreen = ({ navigation }) => {
  const [wasteType, setWasteType]             = useState(null);
  const [description, setDescription]         = useState("");
  const [imageUri, setImageUri]               = useState(null);
  const [location, setLocation]               = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors]                   = useState({});

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: null }));

  // ── GPS ───────────────────────────────────────────────────────────────
  const handleGetLocation = async () => {
    setLocationLoading(true);
    clearError("location");
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch (err) {
      setErrors((prev) => ({ ...prev, location: err.message }));
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Image ─────────────────────────────────────────────────────────────
  const handleImageOption = () => {
    Alert.alert("Add Photo Evidence", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          try { const img = await takePhoto(); setImageUri(img.uri); }
          catch (err) { if (err.code !== "CANCELLED") Alert.alert("Camera Error", err.message); }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          try { const img = await pickImageFromLibrary(); setImageUri(img.uri); }
          catch (err) { if (err.code !== "CANCELLED") Alert.alert("Gallery Error", err.message); }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleRemoveImage = () => {
    Alert.alert("Remove Photo", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setImageUri(null) },
    ]);
  };

  // ── Validation ────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!wasteType) newErrors.wasteType = "Please select a waste category.";
    const trimmed = description.trim();
    if (!trimmed) {
      newErrors.description = "Description is required.";
    } else if (trimmed.length < MIN_DESCRIPTION) {
      newErrors.description = `At least ${MIN_DESCRIPTION} characters required.`;
    }
    if (!location) newErrors.location = "Location is required. Tap to detect GPS.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToReview = () => {
    if (!validate()) return;
    navigation.navigate("ReportReview", {
      wasteType,
      description: description.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
      imageUri: imageUri || null,
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>

      {/* ── Dark green header bar ──────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.stepLabel}>STEP 1 OF 3 · DETAILS</Text>
            <Text style={styles.title}>Report Illegal Dumping</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Progress steps ──────────────────────────────────────────── */}
        <View style={styles.stepRow}>
          <StepDot n={1} label="DETAILS" active />
          <View style={styles.stepLine} />
          <StepDot n={2} label="REVIEW" />
          <View style={styles.stepLine} />
          <StepDot n={3} label="DONE" />
        </View>

        {/* ── Waste category grid ────────────────────────────────────── */}
        <Text style={styles.sectionHint}>
          Choose the category that best describes the dumped waste.
        </Text>
        <View style={styles.categoryGrid}>
          {WASTE_CATEGORIES.map((cat) => {
            const selected = wasteType === cat.value;
            return (
              <TouchableOpacity
                key={cat.value}
                style={[styles.categoryBtn, selected && styles.categoryBtnSelected]}
                onPress={() => { setWasteType(cat.value); clearError("wasteType"); }}
                accessibilityRole="button"
                accessibilityLabel={`${cat.label}: ${cat.desc}`}
                accessibilityState={{ selected }}
              >
                <View style={[styles.categoryIconWrap, selected && styles.categoryIconWrapSelected]}>
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={[styles.categoryLabel, selected && styles.categoryLabelSelected]}>
                  {cat.label}
                </Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
                <View style={styles.categorySelectRow}>
                  <View style={[styles.categoryRadio, selected && styles.categoryRadioSelected]} />
                  <Text style={[styles.categorySelectText, selected && { color: COLORS.PRIMARY }]}>
                    SELECT
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
        <FieldError msg={errors.wasteType} />

        {/* ── Description ─────────────────────────────────────────────── */}
        <SectionLabel text="Description *" />
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder={`Describe the waste – type, quantity, any hazard...\n(min ${MIN_DESCRIPTION} characters)`}
          placeholderTextColor={COLORS.TEXT_DISABLED}
          value={description}
          onChangeText={(t) => { setDescription(t); clearError("description"); }}
          multiline
          numberOfLines={4}
          maxLength={MAX_DESCRIPTION}
          textAlignVertical="top"
          accessibilityLabel="Waste description"
        />
        <View style={styles.charRow}>
          <FieldError msg={errors.description} />
          <Text style={[styles.charCount, description.length > MAX_DESCRIPTION * 0.9 && styles.charCountWarn]}>
            {description.length}/{MAX_DESCRIPTION}
          </Text>
        </View>

        {/* ── GPS location ────────────────────────────────────────────── */}
        <SectionLabel text="Location *" />

        {/* Use Current Location button */}
        <TouchableOpacity
          style={[styles.locationOptionBtn, location && styles.locationOptionBtnActive]}
          onPress={handleGetLocation}
          disabled={locationLoading}
          accessibilityRole="button"
          accessibilityLabel="Use current GPS location"
        >
          <View style={styles.locationOptionIcon}>
            <Text style={{ fontSize: 18 }}>📡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.locationOptionTitle}>Use Current Location</Text>
            <Text style={styles.locationOptionSub}>
              {locationLoading
                ? "Detecting your position..."
                : location
                  ? `${location.latitude.toFixed(5)}° N, ${location.longitude.toFixed(5)}° E`
                  : "Automatically detect via GPS"}
            </Text>
          </View>
          {locationLoading
            ? <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            : location
              ? <Text style={{ fontSize: 18 }}>✅</Text>
              : <Text style={styles.locationArrow}>›</Text>
          }
        </TouchableOpacity>

        <FieldError msg={errors.location} />

        {/* GPS coordinates detail card */}
        {location && (
          <View style={styles.coordsCard}>
            <Text style={styles.coordsLabel}>GPS COORDINATES</Text>
            <Text style={styles.coordsValue}>
              {location.latitude.toFixed(4)}° N, {location.longitude.toFixed(4)}° E
            </Text>
            <TouchableOpacity onPress={handleGetLocation}>
              <Text style={styles.coordsRetry}>↻ Retake location</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Photo evidence ──────────────────────────────────────────── */}
        <SectionLabel text="Photo Evidence (optional)" />
        {imageUri ? (
          <View style={styles.imagePreviewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={styles.imagePreview}
              accessibilityLabel="Selected photo evidence"
            />
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.imageActionBtn}
                onPress={handleImageOption}
                accessibilityRole="button"
                accessibilityLabel="Replace photo"
              >
                <Text style={styles.imageActionText}>Replace Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageActionBtn, styles.imageActionRemove]}
                onPress={handleRemoveImage}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Text style={[styles.imageActionText, styles.imageActionRemoveText]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.imagePickerBtn}
            onPress={handleImageOption}
            accessibilityRole="button"
            accessibilityLabel="Add photo evidence"
          >
            <Text style={styles.imagePickerIcon}>📷</Text>
            <Text style={styles.imagePickerText}>Add Photo</Text>
            <Text style={styles.imagePickerHint}>Camera or gallery</Text>
          </TouchableOpacity>
        )}

        {/* ── Continue CTA ────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleProceedToReview}
          accessibilityRole="button"
          accessibilityLabel="Continue to review report"
        >
          <Text style={styles.continueBtnText}>Continue  ›</Text>
        </TouchableOpacity>
        {!wasteType && (
          <Text style={styles.continueBtnHint}>SELECT A WASTE TYPE TO CONTINUE</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Sub-components ────────────────────────────────────────────────────────
const SectionLabel = ({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

const FieldError = ({ msg }) =>
  msg ? <Text style={styles.errorText}>{msg}</Text> : null;

const StepDot = ({ n, label, active = false, done = false }) => (
  <View style={styles.stepDotWrap}>
    <View style={[
      styles.stepDot,
      active && styles.stepDotActive,
      done && styles.stepDotDone,
    ]}>
      <Text style={[styles.stepDotNum, (active || done) && styles.stepDotNumActive]}>
        {done ? "✓" : n}
      </Text>
    </View>
    <Text style={[styles.stepDotLabel, active && styles.stepDotLabelActive]}>{label}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  // Dark green header
  header: {
    backgroundColor: COLORS.HEADER_BG,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerTop: { flexDirection: "row", alignItems: "center" },
  backText: { color: COLORS.TEXT_INVERSE, fontSize: 22, fontWeight: "300" },
  stepLabel: { fontSize: 11, color: COLORS.PRIMARY_TINT, letterSpacing: 1, fontWeight: "600" },
  title: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_INVERSE },

  scroll: { padding: 16, paddingBottom: 48 },

  // Progress step indicator
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingHorizontal: 8,
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
  stepDotLabel:  { fontSize: 9, color: COLORS.TEXT_DISABLED, marginTop: 4, fontWeight: "700", letterSpacing: 0.5 },
  stepDotLabelActive: { color: COLORS.STEP_ACTIVE },
  stepLine: {
    flex: 1, height: 2,
    backgroundColor: COLORS.STEP_LINE,
    marginHorizontal: 4, marginBottom: 18,
  },

  sectionHint: {
    fontSize: 13,
    color: COLORS.TEXT_SECONDARY,
    lineHeight: 20,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11, fontWeight: "700",
    color: COLORS.TEXT_SECONDARY,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 10, marginTop: 20,
  },

  // Category grid – 2 columns matching wireframe
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  categoryBtn: {
    width: "47%",
    backgroundColor: COLORS.SURFACE,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    padding: 14,
    alignItems: "center",
    gap: 6,
  },
  categoryBtnSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY_TINT,
  },
  categoryIconWrap: {
    width: 56, height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.PRIMARY_TINT,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryIconWrapSelected: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: {
    fontSize: 13, fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    textAlign: "center",
  },
  categoryLabelSelected: { color: COLORS.PRIMARY },
  categoryDesc: {
    fontSize: 11, color: COLORS.TEXT_SECONDARY,
    textAlign: "center", lineHeight: 15,
  },
  categorySelectRow: {
    flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4,
  },
  categoryRadio: {
    width: 16, height: 16, borderRadius: 8,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
  },
  categoryRadioSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY,
  },
  categorySelectText: {
    fontSize: 10, fontWeight: "700",
    color: COLORS.TEXT_DISABLED, letterSpacing: 0.5,
  },

  // Description
  textArea: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    borderRadius: 12, padding: 14,
    fontSize: 14, color: COLORS.TEXT_PRIMARY,
    minHeight: 110,
  },
  inputError: { borderColor: COLORS.ERROR },
  charRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  charCount: { fontSize: 11, color: COLORS.TEXT_DISABLED },
  charCountWarn: { color: COLORS.WARNING },
  errorText: { fontSize: 12, color: COLORS.ERROR, marginTop: 4, flex: 1 },

  // Location buttons matching wireframe "Use Current / Select Manually" style
  locationOptionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    padding: 14,
    gap: 12,
    marginBottom: 8,
  },
  locationOptionBtnActive: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#F0FAF0",
  },
  locationOptionIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: COLORS.PRIMARY_TINT,
    justifyContent: "center", alignItems: "center",
  },
  locationOptionTitle: {
    fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY,
  },
  locationOptionSub: {
    fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2,
  },
  locationArrow: { fontSize: 22, color: COLORS.TEXT_SECONDARY },

  // GPS coordinates card
  coordsCard: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  coordsLabel: {
    fontSize: 10, fontWeight: "700",
    color: COLORS.TEXT_SECONDARY, letterSpacing: 1,
    marginBottom: 4,
  },
  coordsValue: {
    fontSize: 16, fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
  },
  coordsRetry: {
    fontSize: 12, color: COLORS.PRIMARY,
    fontWeight: "600", marginTop: 8,
  },

  // Photo
  imagePreviewContainer: { borderRadius: 12, overflow: "hidden", marginBottom: 4 },
  imagePreview: { width: "100%", height: 200, resizeMode: "cover" },
  imageActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  imageActionBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, alignItems: "center",
  },
  imageActionRemove: { borderColor: COLORS.ERROR },
  imageActionText: { fontSize: 13, fontWeight: "600", color: COLORS.PRIMARY },
  imageActionRemoveText: { color: COLORS.ERROR },
  imagePickerBtn: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    borderStyle: "dashed", borderRadius: 12,
    height: 120, justifyContent: "center",
    alignItems: "center", gap: 6,
  },
  imagePickerIcon: { fontSize: 32 },
  imagePickerText: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  imagePickerHint: { fontSize: 12, color: COLORS.TEXT_DISABLED },

  // Amber CTA – "Continue >"
  continueBtn: {
    backgroundColor: COLORS.ACCENT,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  continueBtnText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },
  continueBtnHint: {
    fontSize: 10, color: COLORS.TEXT_DISABLED,
    textAlign: "center", marginTop: 8,
    letterSpacing: 0.8, fontWeight: "600",
  },
});

export default ReportWasteScreen;
