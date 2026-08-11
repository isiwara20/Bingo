/**
 * BinGo – Report Waste Screen
 * Member 2 – US-M2-01, US-M2-02, US-M2-03, US-M2-04
 *
 * Step 1 of the reporting flow:
 *   Select waste category → Add description → Capture location → Add photo
 *   → Navigate to ReportReviewScreen for preview before submitting
 *
 * NOTE on image storage:
 *   Images are currently stored as local device URIs only.
 *   TODO Sprint 2: Integrate Cloudinary/S3 upload before sending to backend.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentLocation } from "../services/locationService";
import { takePhoto, pickImageFromLibrary } from "../services/imageService";
import COLORS from "../constants/colors";

// ── Waste categories (US-M2-03) ───────────────────────────────────────────
const WASTE_CATEGORIES = [
  { value: "general",      label: "General",      emoji: "🗑️" },
  { value: "plastic",      label: "Plastic",      emoji: "🧴" },
  { value: "glass",        label: "Glass",        emoji: "🍶" },
  { value: "paper",        label: "Paper",        emoji: "📄" },
  { value: "metal",        label: "Metal",        emoji: "🔩" },
  { value: "electronic",   label: "Electronic",   emoji: "📱" },
  { value: "construction", label: "Construction", emoji: "🧱" },
  { value: "organic",      label: "Organic",      emoji: "🌿" },
  { value: "hazardous",    label: "Hazardous",    emoji: "☢️" },
  { value: "mixed",        label: "Mixed",        emoji: "♻️" },
  { value: "other",        label: "Other",        emoji: "❓" },
];

const MAX_DESCRIPTION = 1000;
const MIN_DESCRIPTION = 10;

const ReportWasteScreen = ({ navigation }) => {
  const [wasteType, setWasteType]           = useState(null);
  const [description, setDescription]       = useState("");
  const [imageUri, setImageUri]             = useState(null);
  const [location, setLocation]             = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [errors, setErrors]                 = useState({});

  // ── Clear individual field error on change ───────────────────────────────
  const clearError = (field) =>
    setErrors((prev) => ({ ...prev, [field]: null }));

  // ── GPS location (US-M2-04) ──────────────────────────────────────────────
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

  // ── Image selection (US-M2-02) ───────────────────────────────────────────
  const handleImageOption = () => {
    Alert.alert("Add Photo Evidence", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const img = await takePhoto();
            setImageUri(img.uri);
          } catch (err) {
            if (err.code !== "CANCELLED") {
              Alert.alert("Camera Error", err.message);
            }
          }
        },
      },
      {
        text: "Choose from Library",
        onPress: async () => {
          try {
            const img = await pickImageFromLibrary();
            setImageUri(img.uri);
          } catch (err) {
            if (err.code !== "CANCELLED") {
              Alert.alert("Gallery Error", err.message);
            }
          }
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

  // ── Form validation ──────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!wasteType) {
      newErrors.wasteType = "Please select a waste category.";
    }
    const trimmed = description.trim();
    if (!trimmed) {
      newErrors.description = "Description is required.";
    } else if (trimmed.length < MIN_DESCRIPTION) {
      newErrors.description = `Description must be at least ${MIN_DESCRIPTION} characters.`;
    } else if (trimmed.length > MAX_DESCRIPTION) {
      newErrors.description = `Description cannot exceed ${MAX_DESCRIPTION} characters.`;
    }
    if (!location) {
      newErrors.location = "Location is required. Tap the button to get your GPS coordinates.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Proceed to review screen (US-M2 review step) ─────────────────────────
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Report Illegal Dumping</Text>
          <Text style={styles.subtitle}>
            Help your neighbourhood by reporting waste problems
          </Text>
        </View>

        {/* ── Step indicator ──────────────────────────────────────────── */}
        <View style={styles.stepRow}>
          <StepDot n={1} label="Details" active />
          <View style={styles.stepLine} />
          <StepDot n={2} label="Review" />
          <View style={styles.stepLine} />
          <StepDot n={3} label="Done" />
        </View>

        {/* ── Waste category (US-M2-03) ────────────────────────────────── */}
        <SectionLabel text="Waste Category *" />
        <View style={styles.categoryGrid}>
          {WASTE_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[
                styles.categoryBtn,
                wasteType === cat.value && styles.categoryBtnSelected,
              ]}
              onPress={() => { setWasteType(cat.value); clearError("wasteType"); }}
              accessibilityRole="button"
              accessibilityLabel={`Waste category: ${cat.label}`}
              accessibilityState={{ selected: wasteType === cat.value }}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryLabel,
                wasteType === cat.value && styles.categoryLabelSelected,
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <FieldError msg={errors.wasteType} />

        {/* ── Description ──────────────────────────────────────────────── */}
        <SectionLabel text="Description *" />
        <TextInput
          style={[styles.textArea, errors.description && styles.inputError]}
          placeholder={`Describe the waste – type, quantity, any hazard...\n(minimum ${MIN_DESCRIPTION} characters)`}
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
          <Text style={[
            styles.charCount,
            description.length > MAX_DESCRIPTION * 0.9 && styles.charCountWarn,
          ]}>
            {description.length}/{MAX_DESCRIPTION}
          </Text>
        </View>

        {/* ── GPS location (US-M2-04) ──────────────────────────────────── */}
        <SectionLabel text="Location *" />
        <TouchableOpacity
          style={[
            styles.locationBtn,
            location   && styles.locationBtnSet,
            errors.location && styles.locationBtnError,
          ]}
          onPress={handleGetLocation}
          disabled={locationLoading}
          accessibilityRole="button"
          accessibilityLabel={location ? "Location captured. Tap to update." : "Tap to get current GPS location"}
        >
          {locationLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} />
          ) : location ? (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>✅</Text>
              <View>
                <Text style={styles.locationCoords}>
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </Text>
                <Text style={styles.locationHint}>Tap to update location</Text>
              </View>
            </View>
          ) : (
            <View style={styles.locationRow}>
              <Text style={styles.locationIcon}>📍</Text>
              <Text style={styles.locationPlaceholder}>Tap to get my current location</Text>
            </View>
          )}
        </TouchableOpacity>
        <FieldError msg={errors.location} />

        {/* ── Photo (US-M2-02) ─────────────────────────────────────────── */}
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
                <Text style={styles.imageActionText}>Replace</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.imageActionBtn, styles.imageActionRemove]}
                onPress={handleRemoveImage}
                accessibilityRole="button"
                accessibilityLabel="Remove photo"
              >
                <Text style={[styles.imageActionText, styles.imageActionRemoveText]}>
                  Remove
                </Text>
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

        {/* ── TODO note (transparent to users, visible in code) ────────── */}
        {/* TODO Sprint 2: Upload imageUri to cloud storage here before submit */}

        {/* ── Continue to review ───────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.continueBtn}
          onPress={handleProceedToReview}
          accessibilityRole="button"
          accessibilityLabel="Continue to review report"
        >
          <Text style={styles.continueBtnText}>Review Report →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Small shared sub-components ───────────────────────────────────────────
const SectionLabel = ({ text }) => (
  <Text style={styles.sectionLabel}>{text}</Text>
);

const FieldError = ({ msg }) =>
  msg ? <Text style={styles.errorText}>{msg}</Text> : null;

const StepDot = ({ n, label, active = false }) => (
  <View style={styles.stepDotWrap}>
    <View style={[styles.stepDot, active && styles.stepDotActive]}>
      <Text style={[styles.stepDotNum, active && styles.stepDotNumActive]}>{n}</Text>
    </View>
    <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
  </View>
);

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll: { padding: 16, paddingBottom: 48 },

  header: { marginBottom: 20 },
  backText: { color: COLORS.PRIMARY, fontSize: 16, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },

  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  stepDotWrap: { alignItems: "center" },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.BORDER,
    justifyContent: "center", alignItems: "center",
  },
  stepDotActive: { backgroundColor: COLORS.PRIMARY },
  stepDotNum: { fontSize: 12, fontWeight: "bold", color: COLORS.TEXT_SECONDARY },
  stepDotNumActive: { color: COLORS.TEXT_INVERSE },
  stepLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 4 },
  stepLabelActive: { color: COLORS.PRIMARY, fontWeight: "600" },
  stepLine: { flex: 1, height: 2, backgroundColor: COLORS.BORDER, marginHorizontal: 4, marginBottom: 16 },

  sectionLabel: {
    fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY,
    marginBottom: 8, marginTop: 18,
  },

  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryBtn: {
    width: "30%",
    paddingVertical: 10,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryBtnSelected: { borderColor: COLORS.PRIMARY, backgroundColor: "#E8F5E9" },
  categoryEmoji: { fontSize: 22, marginBottom: 4 },
  categoryLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  categoryLabelSelected: { color: COLORS.PRIMARY, fontWeight: "700" },

  textArea: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: COLORS.TEXT_PRIMARY,
    minHeight: 110,
  },
  inputError: { borderColor: COLORS.ERROR },
  charRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  charCount: { fontSize: 11, color: COLORS.TEXT_DISABLED },
  charCountWarn: { color: COLORS.WARNING },
  errorText: { fontSize: 12, color: COLORS.ERROR, marginTop: 4, flex: 1 },

  locationBtn: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 14,
    minHeight: 54,
    justifyContent: "center",
  },
  locationBtnSet: { borderColor: COLORS.SUCCESS },
  locationBtnError: { borderColor: COLORS.ERROR },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  locationIcon: { fontSize: 20 },
  locationCoords: { fontSize: 13, fontWeight: "600", color: COLORS.SUCCESS },
  locationHint: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 2 },
  locationPlaceholder: { fontSize: 14, color: COLORS.TEXT_SECONDARY },

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
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    borderStyle: "dashed",
    borderRadius: 12,
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  imagePickerIcon: { fontSize: 32 },
  imagePickerText: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  imagePickerHint: { fontSize: 12, color: COLORS.TEXT_DISABLED },

  continueBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 28,
  },
  continueBtnText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },
});

export default ReportWasteScreen;
