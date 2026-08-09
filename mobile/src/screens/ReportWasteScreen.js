/**
 * BinGo – Report Waste Screen
 *
 * US-04: As a resident, I want to report illegal dumping.
 * US-05: As a resident, I want to attach a photo to a report.
 * US-06: As a resident, I want to attach my location.
 *
 * Sprint 1 implementation:
 *   ✅ Waste type selection
 *   ✅ Description input
 *   ✅ GPS location fetch
 *   ✅ Image picker (local URI)
 *   ✅ Form validation
 *   ✅ Submit to backend
 *
 * TODO (Sprint 2): Replace local image URI with Cloudinary upload.
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getCurrentLocation } from "../services/locationService";
import { takePhoto, pickImageFromLibrary } from "../services/imageService";
import { createReport } from "../services/reportService";
import COLORS from "../constants/colors";

const WASTE_TYPES = [
  { value: "plastic", label: "Plastic", emoji: "🧴" },
  { value: "glass", label: "Glass", emoji: "🍶" },
  { value: "paper", label: "Paper", emoji: "📄" },
  { value: "metal", label: "Metal", emoji: "🔩" },
  { value: "electronic", label: "Electronic", emoji: "📱" },
  { value: "organic", label: "Organic", emoji: "🌿" },
  { value: "mixed", label: "Mixed", emoji: "🗑️" },
  { value: "other", label: "Other", emoji: "❓" },
];

const ReportWasteScreen = ({ navigation }) => {
  const [description, setDescription] = useState("");
  const [wasteType, setWasteType] = useState(null);
  const [imageUri, setImageUri] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // ── Get GPS location ─────────────────────────────────────────────────────
  const handleGetLocation = async () => {
    setLocationLoading(true);
    setErrors((e) => ({ ...e, location: null }));
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch (error) {
      setErrors((e) => ({ ...e, location: error.message }));
    } finally {
      setLocationLoading(false);
    }
  };

  // ── Image selection ──────────────────────────────────────────────────────
  const handleImageOption = () => {
    Alert.alert("Add Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          try {
            const img = await takePhoto();
            setImageUri(img.uri);
          } catch (error) {
            if (error.code !== "CANCELLED") {
              Alert.alert("Camera Error", error.message);
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
          } catch (error) {
            if (error.code !== "CANCELLED") {
              Alert.alert("Gallery Error", error.message);
            }
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ── Validate form ────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!wasteType) newErrors.wasteType = "Please select a waste type";
    if (!description.trim() || description.trim().length < 10)
      newErrors.description = "Description must be at least 10 characters";
    if (!location) newErrors.location = "Location is required. Tap to get your location.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Submit report ────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    setSubmitting(true);
    try {
      const report = await createReport({
        description: description.trim(),
        wasteType,
        latitude: location.latitude,
        longitude: location.longitude,
        // TODO Sprint 2: Replace local URI with cloud-uploaded URL
        imageUrl: imageUri || null,
      });

      navigation.replace("ReportStatus", { report });
    } catch (error) {
      Alert.alert("Submission Failed", error.message || "Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Report Waste</Text>
          <Text style={styles.subtitle}>
            Report illegal dumping in your neighbourhood
          </Text>
        </View>

        {/* Waste Type */}
        <Text style={styles.sectionLabel}>Waste Type *</Text>
        <View style={styles.wasteTypeGrid}>
          {WASTE_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              style={[
                styles.wasteTypeButton,
                wasteType === type.value && styles.wasteTypeSelected,
              ]}
              onPress={() => {
                setWasteType(type.value);
                setErrors((e) => ({ ...e, wasteType: null }));
              }}
              accessibilityRole="button"
              accessibilityLabel={`Waste type: ${type.label}`}
              accessibilityState={{ selected: wasteType === type.value }}
            >
              <Text style={styles.wasteTypeEmoji}>{type.emoji}</Text>
              <Text
                style={[
                  styles.wasteTypeLabel,
                  wasteType === type.value && styles.wasteTypeLabelSelected,
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.wasteType && (
          <Text style={styles.errorText}>{errors.wasteType}</Text>
        )}

        {/* Description */}
        <Text style={styles.sectionLabel}>Description *</Text>
        <TextInput
          style={[
            styles.textArea,
            errors.description && styles.inputError,
          ]}
          placeholder="Describe the waste – type, quantity, any hazard..."
          value={description}
          onChangeText={(t) => {
            setDescription(t);
            setErrors((e) => ({ ...e, description: null }));
          }}
          multiline
          numberOfLines={4}
          maxLength={1000}
          accessibilityLabel="Waste description"
        />
        <Text style={styles.charCount}>{description.length}/1000</Text>
        {errors.description && (
          <Text style={styles.errorText}>{errors.description}</Text>
        )}

        {/* Location */}
        <Text style={styles.sectionLabel}>Location *</Text>
        <TouchableOpacity
          style={[
            styles.locationButton,
            location && styles.locationButtonSet,
            errors.location && styles.locationButtonError,
          ]}
          onPress={handleGetLocation}
          disabled={locationLoading}
          accessibilityRole="button"
          accessibilityLabel="Get current GPS location"
        >
          {locationLoading ? (
            <ActivityIndicator color={COLORS.PRIMARY} />
          ) : location ? (
            <Text style={styles.locationText}>
              ✅ {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </Text>
          ) : (
            <Text style={styles.locationPlaceholder}>
              📍 Tap to get my current location
            </Text>
          )}
        </TouchableOpacity>
        {errors.location && (
          <Text style={styles.errorText}>{errors.location}</Text>
        )}

        {/* Image */}
        <Text style={styles.sectionLabel}>Photo (optional)</Text>
        <TouchableOpacity
          style={styles.imageButton}
          onPress={handleImageOption}
          accessibilityRole="button"
          accessibilityLabel="Add photo evidence"
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>📷</Text>
              <Text style={styles.imagePlaceholderText}>Add Photo Evidence</Text>
              <Text style={styles.imagePlaceholderNote}>
                ⚠️ Cloud upload coming in Sprint 2
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          accessibilityRole="button"
          accessibilityLabel="Submit waste report"
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.TEXT_INVERSE} />
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { padding: 16, paddingBottom: 40 },
  header: { marginBottom: 24 },
  backText: { color: COLORS.PRIMARY, fontSize: 16, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 8,
    marginTop: 16,
  },
  wasteTypeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  wasteTypeButton: {
    width: "22%",
    aspectRatio: 1,
    backgroundColor: COLORS.SURFACE,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
  },
  wasteTypeSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#E8F5E9",
  },
  wasteTypeEmoji: { fontSize: 24 },
  wasteTypeLabel: { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  wasteTypeLabelSelected: { color: COLORS.PRIMARY, fontWeight: "600" },
  textArea: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
    textAlignVertical: "top",
    minHeight: 100,
  },
  inputError: { borderColor: COLORS.ERROR },
  charCount: { fontSize: 11, color: COLORS.TEXT_DISABLED, textAlign: "right", marginTop: 4 },
  errorText: { fontSize: 12, color: COLORS.ERROR, marginTop: 4 },
  locationButton: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    minHeight: 52,
    justifyContent: "center",
  },
  locationButtonSet: { borderColor: COLORS.SUCCESS },
  locationButtonError: { borderColor: COLORS.ERROR },
  locationText: { color: COLORS.SUCCESS, fontSize: 14, fontWeight: "600" },
  locationPlaceholder: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  imageButton: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    minHeight: 140,
  },
  imagePreview: { width: "100%", height: 200, resizeMode: "cover" },
  imagePlaceholder: {
    backgroundColor: COLORS.SURFACE,
    alignItems: "center",
    justifyContent: "center",
    height: 140,
    gap: 8,
  },
  imagePlaceholderIcon: { fontSize: 36 },
  imagePlaceholderText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  imagePlaceholderNote: { color: COLORS.WARNING, fontSize: 11 },
  submitButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  submitButtonDisabled: { opacity: 0.7 },
  submitText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },
});

export default ReportWasteScreen;
