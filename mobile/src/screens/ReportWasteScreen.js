/**
 * BinGo – Report Waste Screen (Member 2)
 * US-M2-01 · US-M2-02 · US-M2-03 · US-M2-04
 *
 * UI styled to match Member 3's CollectionScheduleScreen / RecyclingGuideScreen pattern:
 *   – Dark green header (#1A3010) with back arrow + badge
 *   – Tab-style step indicator matching Member 3's tab bar style
 *   – White cards with left-color border and category config pattern
 *   – Amber (#E8950A) CTA buttons
 *   – Emoji-first icon approach
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

// ── Waste category config (matches Member 3 CAT_CONFIG pattern) ───────────
const WASTE_CATEGORIES = [
  { value: "plastic",      label: "Plastic Waste",       emoji: "🧴", color: "#3B82F6", bg: "#EFF6FF", desc: "Bottles, bags, packaging" },
  { value: "organic",      label: "Organic Waste",       emoji: "🌿", color: "#16A34A", bg: "#F0FDF4", desc: "Food, garden, compostable" },
  { value: "electronic",   label: "Electronic Waste",    emoji: "📱", color: "#DC2626", bg: "#FEF2F2", desc: "Devices, cables, batteries" },
  { value: "construction", label: "Construction Waste",  emoji: "🧱", color: "#D97706", bg: "#FFFBEB", desc: "Rubble, timber, metals" },
  { value: "general",      label: "General Waste",       emoji: "🗑️", color: "#6B7280", bg: "#F9FAFB", desc: "Mixed or unclassified waste" },
  { value: "glass",        label: "Glass",               emoji: "🍶", color: "#8B5CF6", bg: "#F5F3FF", desc: "Bottles, jars, mirrors" },
  { value: "metal",        label: "Metal",               emoji: "🔩", color: "#6B7280", bg: "#F9FAFB", desc: "Cans, pipes, scrap metal" },
  { value: "hazardous",    label: "Hazardous",           emoji: "⚠️", color: "#DC2626", bg: "#FEF2F2", desc: "Chemicals, paint, batteries" },
  { value: "other",        label: "Other",               emoji: "❓", color: COLORS.PRIMARY, bg: COLORS.PRIMARY_TINT, desc: "Doesn't fit above categories" },
];

const MAX_DESC = 1000;
const MIN_DESC = 10;

const STEPS = ["PHOTO", "TYPE", "LOCATION", "SUBMIT"];

export default function ReportWasteScreen({ navigation }) {
  const [wasteType,        setWasteType]        = useState(null);
  const [description,      setDescription]      = useState("");
  const [imageUri,         setImageUri]         = useState(null);
  const [location,         setLocation]         = useState(null);
  const [locationLoading,  setLocationLoading]  = useState(false);
  const [errors,           setErrors]           = useState({});

  const clearError = (f) => setErrors((p) => ({ ...p, [f]: null }));

  // ── GPS ──────────────────────────────────────────────────────────────────
  const handleGetLocation = async () => {
    setLocationLoading(true);
    clearError("location");
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch (err) {
      setErrors((p) => ({ ...p, location: err.message }));
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Image ─────────────────────────────────────────────────────────────────
  const handleImageOption = () => {
    Alert.alert("Add Photo Evidence", "Choose an option", [
      { text: "Take Photo", onPress: async () => {
          try { const img = await takePhoto(); setImageUri(img.uri); }
          catch (err) { if (err.code !== "CANCELLED") Alert.alert("Camera Error", err.message); }
        },
      },
      { text: "Choose from Library", onPress: async () => {
          try { const img = await pickImageFromLibrary(); setImageUri(img.uri); }
          catch (err) { if (err.code !== "CANCELLED") Alert.alert("Gallery Error", err.message); }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Validate ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!wasteType) e.wasteType = "Please select a waste type.";
    const t = description.trim();
    if (!t) e.description = "Description is required.";
    else if (t.length < MIN_DESC) e.description = `Minimum ${MIN_DESC} characters.`;
    if (!location) e.location = "Location is required. Tap to detect GPS.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    navigation.navigate("ReportReview", {
      wasteType, description: description.trim(),
      latitude: location.latitude, longitude: location.longitude,
      imageUri: imageUri || null,
    });
  };

  const selectedCat = WASTE_CATEGORIES.find((c) => c.value === wasteType);

  return (
    <SafeAreaView style={S.root} edges={["top"]}>
      {/* ── Header (matches Member 3 Header component) ─────────────────── */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Report Illegal Dumping</Text>
          <Text style={S.headerSub}>Help keep your neighbourhood clean</Text>
        </View>
        <View style={S.headerBadge}>
          <Text style={S.headerBadgeTxt}>NEW</Text>
        </View>
      </View>

      {/* ── Step indicator (matches Member 3 tab bar style) ─────────────── */}
      <View style={S.stepBar}>
        {STEPS.map((s, i) => {
          const done   = (s === "PHOTO"    && imageUri) ||
                         (s === "TYPE"     && wasteType) ||
                         (s === "LOCATION" && location);
          const active = (s === "PHOTO"    && !imageUri) ||
                         (s === "TYPE"     && imageUri && !wasteType) ||
                         (s === "LOCATION" && wasteType && !location) ||
                         (s === "SUBMIT"   && location);
          return (
            <React.Fragment key={s}>
              {i > 0 && <View style={[S.stepLine, (done || active) && S.stepLineActive]} />}
              <View style={S.stepDotWrap}>
                <View style={[S.stepDot, done && S.stepDotDone, active && S.stepDotActive]}>
                  <Text style={[S.stepDotTxt, (done || active) && S.stepDotTxtActive]}>
                    {done ? "✓" : i + 1}
                  </Text>
                </View>
                <Text style={[S.stepLabel, (done || active) && S.stepLabelActive]}>{s}</Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      <ScrollView style={S.scroll} keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* ── Section: Photo (Member 3 info-row card style) ───────────── */}
        <SectionLabel text="📷  Photo Evidence" note="Optional — helps authorities" />

        {imageUri ? (
          <View style={S.imageCard}>
            <Image source={{ uri: imageUri }} style={S.imagePreview} resizeMode="cover"
              accessibilityLabel="Report photo evidence" />
            <View style={S.imageActions}>
              <TouchableOpacity style={S.imageBtn} onPress={handleImageOption}>
                <Text style={S.imageBtnTxt}>🔄  Replace Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.imageBtn, S.imageBtnDanger]} onPress={() =>
                Alert.alert("Remove Photo", "Are you sure?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Remove", style: "destructive", onPress: () => setImageUri(null) },
                ])}>
                <Text style={[S.imageBtnTxt, { color: COLORS.ERROR }]}>✕  Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={S.imagePickerCard} onPress={handleImageOption}
            accessibilityRole="button" accessibilityLabel="Add photo evidence">
            <Text style={S.imagePickerEmoji}>📷</Text>
            <Text style={S.imagePickerTitle}>Add Photo Evidence</Text>
            <Text style={S.imagePickerSub}>Camera or gallery · Optional but recommended</Text>
          </TouchableOpacity>
        )}

        {/* ── Section: Waste Type grid (matches Member 3 2×2 category grid) */}
        <SectionLabel text="🗂️  Waste Type" note="Select a waste type to continue *" />
        {errors.wasteType && <ErrorText msg={errors.wasteType} />}

        <View style={S.catGrid}>
          {WASTE_CATEGORIES.map((cat) => {
            const sel = wasteType === cat.value;
            return (
              <TouchableOpacity key={cat.value}
                style={[S.catCard, { borderColor: sel ? cat.color : COLORS.BORDER },
                  sel && { backgroundColor: cat.bg }]}
                onPress={() => { setWasteType(cat.value); clearError("wasteType"); }}
                accessibilityRole="button"
                accessibilityLabel={`${cat.label}: ${cat.desc}`}
                accessibilityState={{ selected: sel }}>
                {/* Colored top strip when selected (Member 3 today-card pattern) */}
                {sel && <View style={[S.catStrip, { backgroundColor: cat.color }]} />}
                <View style={[S.catIconBox, { backgroundColor: sel ? cat.color : cat.bg }]}>
                  <Text style={S.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text style={[S.catLabel, sel && { color: cat.color }]}>{cat.label}</Text>
                <Text style={S.catDesc}>{cat.desc}</Text>
                {/* SELECT radio (Member 3 pattern) */}
                <View style={S.catSelectRow}>
                  <View style={[S.catRadio, sel && { backgroundColor: cat.color, borderColor: cat.color }]} />
                  <Text style={[S.catSelectTxt, sel && { color: cat.color }]}>
                    {sel ? "SELECTED" : "SELECT"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Section: Description ────────────────────────────────────── */}
        <SectionLabel text="📝  Description" note="Minimum 10 characters *" />
        <TextInput style={[S.textArea, errors.description && S.inputError]}
          placeholder={`Describe the waste — type, quantity, any hazard...\n(minimum ${MIN_DESC} characters)`}
          placeholderTextColor={COLORS.TEXT_DISABLED}
          value={description}
          onChangeText={(t) => { setDescription(t); clearError("description"); }}
          multiline numberOfLines={4} maxLength={MAX_DESC} textAlignVertical="top"
          accessibilityLabel="Waste description" />
        <View style={S.charRow}>
          {errors.description ? <ErrorText msg={errors.description} /> : <View />}
          <Text style={[S.charCount, description.length > MAX_DESC * 0.9 && { color: COLORS.WARNING }]}>
            {description.length}/{MAX_DESC}
          </Text>
        </View>

        {/* ── Section: Location (matches Member 3 infoRow card) ───────── */}
        <SectionLabel text="📍  GPS Location" note="Required for submission *" />

        {/* Use Current Location button */}
        <TouchableOpacity
          style={[S.locationCard, location && S.locationCardSet,
            errors.location && S.locationCardError]}
          onPress={handleGetLocation} disabled={locationLoading}
          accessibilityRole="button"
          accessibilityLabel={location ? "Location captured. Tap to update." : "Tap to detect GPS location"}>
          <View style={[S.locationIconBox, { backgroundColor: location ? COLORS.PRIMARY + "15" : COLORS.PRIMARY_TINT }]}>
            <Text style={{ fontSize: 22 }}>📡</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.locationCardTitle}>Use Current Location</Text>
            <Text style={S.locationCardSub}>
              {locationLoading ? "Detecting your position..."
                : location
                  ? `${location.latitude.toFixed(4)}° N, ${location.longitude.toFixed(4)}° E`
                  : "Automatically detect via GPS"}
            </Text>
          </View>
          {locationLoading
            ? <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            : location
              ? <Text style={{ fontSize: 20 }}>✅</Text>
              : <Text style={S.locationArrow}>›</Text>}
        </TouchableOpacity>

        {/* GPS coordinates card (shows when location captured) */}
        {location && (
          <View style={S.coordsCard}>
            <Text style={S.coordsLabel}>GPS COORDINATES</Text>
            <Text style={S.coordsValue}>
              {location.latitude.toFixed(5)}° N, {location.longitude.toFixed(5)}° E
            </Text>
            {location.accuracy && (
              <Text style={S.coordsAccuracy}>Accuracy: ±{Math.round(location.accuracy)}m</Text>
            )}
            <TouchableOpacity onPress={handleGetLocation} style={S.retryRow}>
              <Text style={S.retryTxt}>↻  Retake location</Text>
            </TouchableOpacity>
          </View>
        )}
        {errors.location && <ErrorText msg={errors.location} />}

        {/* ── Continue CTA (amber, Member 3 pattern) ──────────────────── */}
        <TouchableOpacity style={S.ctaBtn} onPress={handleNext}
          accessibilityRole="button" accessibilityLabel="Continue to review">
          <Text style={S.ctaBtnTxt}>Continue  ›</Text>
        </TouchableOpacity>

        {!wasteType && (
          <Text style={S.ctaHint}>SELECT A WASTE TYPE TO CONTINUE</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────
const SectionLabel = ({ text, note }) => (
  <View style={S.sectionRow}>
    <Text style={S.sectionLabel}>{text}</Text>
    {note && <Text style={S.sectionNote}>{note}</Text>}
  </View>
);
const ErrorText = ({ msg }) => msg ? <Text style={S.errorTxt}>{msg}</Text> : null;

// ── Styles (matching Member 3's S style object pattern) ───────────────────
const S = StyleSheet.create({
  root:        { flex: 1, backgroundColor: COLORS.BACKGROUND },

  // Header — dark green, same as Member 3
  header:      { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG,
                 paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:     { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.15)",
                 justifyContent: "center", alignItems: "center" },
  backIcon:    { color: COLORS.TEXT_INVERSE, fontSize: 18, fontWeight: "600" },
  headerMid:   { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_INVERSE },
  headerSub:   { fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 1 },
  headerBadge: { backgroundColor: COLORS.ACCENT, paddingHorizontal: 8, paddingVertical: 3,
                 borderRadius: 6 },
  headerBadgeTxt: { fontSize: 10, fontWeight: "800", color: COLORS.TEXT_INVERSE, letterSpacing: 0.5 },

  // Step bar — matches Member 3 tab indicator style
  stepBar:     { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE,
                 paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
                 borderBottomColor: COLORS.BORDER },
  stepDotWrap: { alignItems: "center" },
  stepDot:     { width: 28, height: 28, borderRadius: 14, backgroundColor: COLORS.BORDER,
                 justifyContent: "center", alignItems: "center" },
  stepDotActive: { backgroundColor: COLORS.PRIMARY },
  stepDotDone:   { backgroundColor: COLORS.STEP_DONE },
  stepDotTxt:    { fontSize: 11, fontWeight: "700", color: COLORS.TEXT_SECONDARY },
  stepDotTxtActive: { color: COLORS.TEXT_INVERSE },
  stepLine:      { flex: 1, height: 2, backgroundColor: COLORS.BORDER },
  stepLineActive: { backgroundColor: COLORS.STEP_DONE },
  stepLabel:     { fontSize: 9, color: COLORS.TEXT_DISABLED, marginTop: 3, fontWeight: "700",
                   letterSpacing: 0.5 },
  stepLabelActive: { color: COLORS.PRIMARY },

  scroll:      { flex: 1 },

  // Section header — matches Member 3 sectionLabel
  sectionRow:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                 marginTop: 20, marginBottom: 10, paddingHorizontal: 16 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: COLORS.TEXT_PRIMARY, letterSpacing: 0.3 },
  sectionNote:  { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  errorTxt:    { fontSize: 12, color: COLORS.ERROR, marginTop: 4, paddingHorizontal: 16 },

  // Photo picker — dashed card
  imagePickerCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: "dashed",
                     borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE, height: 120,
                     justifyContent: "center", alignItems: "center", gap: 6 },
  imagePickerEmoji: { fontSize: 32 },
  imagePickerTitle: { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_SECONDARY },
  imagePickerSub:   { fontSize: 11, color: COLORS.TEXT_DISABLED },
  imageCard:        { marginHorizontal: 16, borderRadius: 14, overflow: "hidden",
                      borderWidth: 1, borderColor: COLORS.BORDER },
  imagePreview:     { width: "100%", height: 200 },
  imageActions:     { flexDirection: "row", gap: 8, padding: 10, backgroundColor: COLORS.SURFACE },
  imageBtn:         { flex: 1, paddingVertical: 9, borderRadius: 8, backgroundColor: COLORS.BACKGROUND,
                      borderWidth: 1, borderColor: COLORS.BORDER, alignItems: "center" },
  imageBtnDanger:   { borderColor: COLORS.ERROR },
  imageBtnTxt:      { fontSize: 12, fontWeight: "600", color: COLORS.PRIMARY },

  // Category grid — 2 columns, Member 3 card pattern
  catGrid:  { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, gap: 10 },
  catCard:  { width: "47%", backgroundColor: COLORS.SURFACE, borderRadius: 14, borderWidth: 1.5,
              borderColor: COLORS.BORDER, overflow: "hidden", paddingHorizontal: 12,
              paddingBottom: 12, alignItems: "center", gap: 5 },
  catStrip: { height: 4, width: "100%", marginBottom: 4 },
  catIconBox: { width: 52, height: 52, borderRadius: 12, justifyContent: "center",
                alignItems: "center", marginTop: 4 },
  catEmoji: { fontSize: 26 },
  catLabel: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  catDesc:  { fontSize: 10, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 14 },
  catSelectRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  catRadio:     { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5,
                  borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE },
  catSelectTxt: { fontSize: 9, fontWeight: "700", color: COLORS.TEXT_DISABLED, letterSpacing: 0.5 },

  // Description
  textArea:    { marginHorizontal: 16, backgroundColor: COLORS.SURFACE, borderWidth: 1.5,
                 borderColor: COLORS.BORDER, borderRadius: 12, padding: 14, fontSize: 14,
                 color: COLORS.TEXT_PRIMARY, minHeight: 110 },
  inputError:  { borderColor: COLORS.ERROR },
  charRow:     { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16,
                 marginTop: 4 },
  charCount:   { fontSize: 11, color: COLORS.TEXT_DISABLED },

  // Location — info-row card style (Member 3 infoRow)
  locationCard:      { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE,
                        borderRadius: 14, borderWidth: 1.5, borderColor: COLORS.BORDER,
                        padding: 14, marginHorizontal: 16, gap: 12 },
  locationCardSet:   { borderColor: COLORS.PRIMARY, backgroundColor: COLORS.PRIMARY + "08" },
  locationCardError: { borderColor: COLORS.ERROR },
  locationIconBox:   { width: 44, height: 44, borderRadius: 10, justifyContent: "center",
                        alignItems: "center" },
  locationCardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  locationCardSub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  locationArrow:     { fontSize: 22, color: COLORS.TEXT_SECONDARY },
  coordsCard:        { marginHorizontal: 16, marginTop: 8, backgroundColor: COLORS.SURFACE,
                        borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  coordsLabel:       { fontSize: 10, fontWeight: "700", color: COLORS.TEXT_SECONDARY,
                        letterSpacing: 1, marginBottom: 4 },
  coordsValue:       { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  coordsAccuracy:    { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  retryRow:          { marginTop: 8 },
  retryTxt:          { fontSize: 12, color: COLORS.PRIMARY, fontWeight: "600" },

  // CTA button — amber, Member 3 pattern
  ctaBtn:  { marginHorizontal: 16, marginTop: 28, backgroundColor: COLORS.ACCENT,
              paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  ctaBtnTxt: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "800" },
  ctaHint:   { textAlign: "center", color: COLORS.TEXT_DISABLED, fontSize: 10, fontWeight: "600",
               letterSpacing: 0.8, marginTop: 8 },
});
