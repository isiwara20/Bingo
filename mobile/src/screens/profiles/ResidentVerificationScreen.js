/**
 * BinGo – Resident Verification Screen
 *
 * 3-step verification flow:
 *   Step 0 – Pin location on Google Map (drag to exact residence)
 *   Step 1 – Upload/capture residence photo
 *   Step 2 – Take selfie (face capture via camera)
 *
 * On success → updates user context → navigates back to profile
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ActivityIndicator, Image, ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker } from "react-native-maps";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import Geolocation from "react-native-geolocation-service";
import { check, request, PERMISSIONS, RESULTS } from "react-native-permissions";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/apiClient";
import COLORS from "../../constants/colors";

const STEPS = [
  { icon: "map-marker-radius", label: "Location",     title: "Pin Your Residence",           sub: "Drag the map to pin your exact home location." },
  { icon: "home-city-outline", label: "Residence",    title: "Upload Residence Photo",        sub: "Take or upload a clear photo of the front of your home." },
  { icon: "face-recognition",  label: "Face",         title: "Capture Your Face",            sub: "Take a selfie so we can confirm your identity." },
];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepBar = ({ current }) => (
  <View style={s.stepBar}>
    {STEPS.map((step, i) => (
      <React.Fragment key={step.label}>
        <View style={s.stepItem}>
          <View style={[s.stepCircle, i <= current && s.stepCircleActive]}>
            {i < current
              ? <Icon name="check" size={14} color="#fff" />
              : <Icon name={step.icon} size={16} color={i <= current ? "#fff" : COLORS.TEXT_DISABLED} />
            }
          </View>
          <Text style={[s.stepLabel, i === current && s.stepLabelActive]}>{step.label}</Text>
        </View>
        {i < STEPS.length - 1 && (
          <View style={[s.stepLine, i < current && s.stepLineDone]} />
        )}
      </React.Fragment>
    ))}
  </View>
);

// ── Main Screen ───────────────────────────────────────────────────────────────
const ResidentVerificationScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [step, setStep]                 = useState(0);
  const [location, setLocation]         = useState({ latitude: 6.9271, longitude: 79.8612 }); // Default: Colombo
  const [locationAddress, setAddress]   = useState("");
  const [residenceImage, setResidence]  = useState(null);
  const [faceImage, setFace]            = useState(null);
  const [submitting, setSubmitting]     = useState(false);
  const [locating, setLocating]         = useState(false);
  const mapRef = useRef(null);

  // Get current location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    setLocating(true);
    try {
      const perm = Platform.OS === "android"
        ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
        : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;

      const result = await check(perm);
      let granted = result === RESULTS.GRANTED;

      if (!granted) {
        const req = await request(perm);
        granted = req === RESULTS.GRANTED;
      }

      if (!granted) {
        Alert.alert("Permission Required", "Location permission is needed to pin your residence.");
        setLocating(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setLocation({ latitude, longitude });
          mapRef.current?.animateToRegion({
            latitude, longitude, latitudeDelta: 0.005, longitudeDelta: 0.005,
          }, 1000);
          setLocating(false);
        },
        (err) => {
          console.warn("Location error:", err.message || err);
          // Don't crash — user can still manually drag the map pin
          setLocating(false);
          Alert.alert(
            "Location Unavailable",
            "Could not get your current location. Please drag the map pin to your residence manually.",
            [{ text: "OK" }]
          );
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 30000 }
      );
    } catch (e) {
      setLocating(false);
    }
  };

  // ── Image pickers ────────────────────────────────────────────────────────
  const pickResidenceImage = () => {
    Alert.alert("Residence Photo", "How would you like to add your residence photo?", [
      { text: "Take Photo", onPress: () => openCamera(setResidence) },
      { text: "Choose from Gallery", onPress: () => openGallery(setResidence) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const captureFace = () => {
    Alert.alert("Selfie", "We need a clear selfie to verify your identity.", [
      { text: "Open Camera", onPress: () => openCamera(setFace, true) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const openCamera = (setter, frontCamera = false) => {
    launchCamera(
      {
        mediaType: "photo",
        quality: 0.7,
        includeBase64: true,
        cameraType: frontCamera ? "front" : "back",
        saveToPhotos: false,
      },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        const asset = res.assets?.[0];
        if (asset?.base64) {
          setter(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    );
  };

  const openGallery = (setter) => {
    launchImageLibrary(
      { mediaType: "photo", quality: 0.7, includeBase64: true },
      (res) => {
        if (res.didCancel || res.errorCode) return;
        const asset = res.assets?.[0];
        if (asset?.base64) {
          setter(`data:image/jpeg;base64,${asset.base64}`);
        }
      }
    );
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 0) {
      if (!location.latitude || !location.longitude) {
        Alert.alert("Location Required", "Please pin your residence location on the map.");
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!residenceImage) {
        Alert.alert("Photo Required", "Please upload or take a photo of your residence.");
        return;
      }
      setStep(2);
    }
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!faceImage) {
      Alert.alert("Selfie Required", "Please take a selfie to complete verification.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.post("/users/verify", {
        latitude:        location.latitude,
        longitude:       location.longitude,
        address:         locationAddress,
        residenceImage,
        faceImage,
      });
      // Update user in context
      await updateUser({
        ...user,
        profileVerified:      true,
        verificationStatus:   "verified",
        verifiedAt:           new Date().toISOString(),
        faceImage,
        residenceImage,
      });
      Alert.alert(
        "Verified! ✅",
        "Your profile has been verified. You now have full access to BinGo.",
        [{ text: "Continue", onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      Alert.alert("Verification Failed", e.message || "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render steps ──────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <View style={s.stepContent}>
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          style={s.map}
          initialRegion={{
            latitude:      location.latitude,
            longitude:     location.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          onRegionChangeComplete={(region) => {
            setLocation({ latitude: region.latitude, longitude: region.longitude });
          }}
          showsUserLocation
          showsMyLocationButton={false}
        >
          <Marker
            coordinate={location}
            draggable
            onDragEnd={(e) => setLocation(e.nativeEvent.coordinate)}
            title="My Residence"
            pinColor={COLORS.PRIMARY}
          />
        </MapView>

        {/* Centre crosshair */}
        <View style={s.crosshair} pointerEvents="none">
          <Icon name="crosshairs-gps" size={32} color={COLORS.PRIMARY} />
        </View>
      </View>

      <View style={s.coordRow}>
        <Icon name="map-marker" size={16} color={COLORS.PRIMARY} />
        <Text style={s.coordTxt}>
          {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
        </Text>
        <TouchableOpacity onPress={getCurrentLocation} disabled={locating} style={s.locateBtn}>
          {locating
            ? <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            : <Icon name="crosshairs-gps" size={18} color={COLORS.PRIMARY} />
          }
        </TouchableOpacity>
      </View>

      <View style={s.mapTip}>
        <Icon name="information-outline" size={14} color={COLORS.TEXT_SECONDARY} />
        <Text style={s.mapTipTxt}>
          Drag the map or the marker to pin your exact residence location.
        </Text>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={s.stepContent}>
      {residenceImage ? (
        <View style={s.photoPreview}>
          <Image source={{ uri: residenceImage }} style={s.previewImg} />
          <TouchableOpacity style={s.retakeBtn} onPress={() => setResidence(null)}>
            <Icon name="refresh" size={16} color={COLORS.PRIMARY} />
            <Text style={s.retakeTxt}>Retake</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.photoPlaceholder} onPress={pickResidenceImage}>
          <View style={s.photoIconBox}>
            <Icon name="home-camera" size={40} color={COLORS.PRIMARY} />
          </View>
          <Text style={s.photoPlaceholderTitle}>Add Residence Photo</Text>
          <Text style={s.photoPlaceholderSub}>
            Take a clear photo of the front of your home
          </Text>
        </TouchableOpacity>
      )}

      <View style={s.photoTips}>
        <Text style={s.photoTipTitle}>📸 Photo Tips</Text>
        {[
          "Capture the full front of your residence",
          "Ensure good lighting — avoid dark or blurry images",
          "Include the house number or name plate if visible",
        ].map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Icon name="check-circle-outline" size={14} color={COLORS.PRIMARY} />
            <Text style={s.tipTxt}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={s.stepContent}>
      {faceImage ? (
        <View style={s.photoPreview}>
          <Image source={{ uri: faceImage }} style={[s.previewImg, s.faceImg]} />
          <TouchableOpacity style={s.retakeBtn} onPress={() => setFace(null)}>
            <Icon name="refresh" size={16} color={COLORS.PRIMARY} />
            <Text style={s.retakeTxt}>Retake Selfie</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={s.photoPlaceholder} onPress={captureFace}>
          <View style={s.faceIconBox}>
            <Icon name="face-recognition" size={44} color={COLORS.PRIMARY} />
          </View>
          <Text style={s.photoPlaceholderTitle}>Take a Selfie</Text>
          <Text style={s.photoPlaceholderSub}>
            Look directly at the camera with your face clearly visible
          </Text>
        </TouchableOpacity>
      )}

      <View style={s.photoTips}>
        <Text style={s.photoTipTitle}>🤳 Selfie Tips</Text>
        {[
          "Face the camera directly in good lighting",
          "Remove glasses, hats or face coverings",
          "Make sure your full face is visible",
        ].map((tip, i) => (
          <View key={i} style={s.tipRow}>
            <Icon name="check-circle-outline" size={14} color={COLORS.PRIMARY} />
            <Text style={s.tipTxt}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => step > 0 ? setStep(p => p - 1) : navigation.goBack()}
          style={s.backBtn}
          disabled={submitting}
          accessibilityRole="button"
        >
          <Icon name="arrow-left" size={22} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>{STEPS[step].title}</Text>
          <Text style={s.headerSub}>{STEPS[step].sub}</Text>
        </View>
      </View>

      {/* Step bar */}
      <StepBar current={step} />

      {/* Content */}
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>

      {/* Bottom action */}
      <View style={s.footer}>
        {step < 2 ? (
          <TouchableOpacity
            style={[s.nextBtn,
              (step === 0 && !location) && s.btnDisabled,
              (step === 1 && !residenceImage) && s.btnDisabled,
            ]}
            onPress={handleNext}
            accessibilityRole="button"
          >
            <Text style={s.nextBtnTxt}>Continue</Text>
            <Icon name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[s.nextBtn, s.submitBtn, (!faceImage || submitting) && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={!faceImage || submitting}
            accessibilityRole="button"
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={s.submitBtnInner}>
                  <Icon name="shield-check" size={20} color="#fff" />
                  <Text style={s.nextBtnTxt}>Submit Verification</Text>
                </View>
              )
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: "row", alignItems: "flex-start",
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.BORDER, marginTop: 2,
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17, marginTop: 2 },

  // Step bar
  stepBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER,
  },
  stepItem:  { alignItems: "center", gap: 4 },
  stepCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.BORDER,
    justifyContent: "center", alignItems: "center",
  },
  stepCircleActive: { backgroundColor: COLORS.PRIMARY },
  stepLine:     { flex: 1, height: 2, backgroundColor: COLORS.BORDER, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: COLORS.PRIMARY },
  stepLabel:    { fontSize: 10, color: COLORS.TEXT_DISABLED, fontWeight: "500" },
  stepLabelActive: { color: COLORS.PRIMARY, fontWeight: "700" },

  scroll: { padding: 16, paddingBottom: 20 },
  stepContent: { gap: 16 },

  // Map
  mapContainer: {
    height: 300, borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: COLORS.BORDER,
    position: "relative",
  },
  map:       { ...StyleSheet.absoluteFillObject },
  crosshair: {
    position: "absolute", top: "50%", left: "50%",
    marginLeft: -16, marginTop: -16,
  },
  coordRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.SURFACE, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  coordTxt:  { flex: 1, fontSize: 13, color: COLORS.TEXT_SECONDARY, fontFamily: "monospace" },
  locateBtn: { padding: 4 },
  mapTip: {
    flexDirection: "row", alignItems: "flex-start", gap: 6,
    backgroundColor: "#FFF8E1", borderRadius: 8, padding: 10,
  },
  mapTipTxt: { flex: 1, fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },

  // Photos
  photoPlaceholder: {
    height: 220, borderRadius: 14,
    borderWidth: 2, borderColor: COLORS.PRIMARY, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: 10,
    backgroundColor: "#F1F8F4",
  },
  photoIconBox: {
    width: 80, height: 80, borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  faceIconBox: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  photoPlaceholderTitle: { fontSize: 16, fontWeight: "700", color: COLORS.PRIMARY },
  photoPlaceholderSub:   { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center", paddingHorizontal: 20 },

  photoPreview: { alignItems: "center", gap: 12 },
  previewImg:   { width: "100%", height: 240, borderRadius: 14 },
  faceImg:      { width: 220, height: 220, borderRadius: 110 },
  retakeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderWidth: 1.5, borderColor: COLORS.PRIMARY, borderRadius: 20,
  },
  retakeTxt: { color: COLORS.PRIMARY, fontSize: 13, fontWeight: "600" },

  // Tips
  photoTips: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.BORDER, gap: 8,
  },
  photoTipTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 2 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  tipTxt: { flex: 1, fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },

  // Footer
  footer: {
    padding: 16, backgroundColor: COLORS.SURFACE,
    borderTopWidth: 1, borderTopColor: COLORS.BORDER,
  },
  nextBtn: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 15,
    borderRadius: 12, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  submitBtn: { backgroundColor: COLORS.SUCCESS },
  submitBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnDisabled: { opacity: 0.5 },
  nextBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ResidentVerificationScreen;
