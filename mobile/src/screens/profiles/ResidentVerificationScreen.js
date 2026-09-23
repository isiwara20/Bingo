/**
 * BinGo – Resident Verification Screen
 *
 * Step 0 – Pin location on map (tap or drag — no Google API key needed)
 * Step 1 – Residence photo (camera or gallery with runtime permission)
 * Step 2 – Face capture (front camera)
 *
 * On submit → status set to "pending" → admin reviews in dashboard.
 * All alerts/messages shown as in-app overlay modals (no native Alert).
 *
 * Map uses PROVIDER_DEFAULT (OpenStreetMap) — works without a Google Maps key.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Image, ScrollView, Platform,
  Modal, Animated, Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, UrlTile } from "react-native-maps";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import { check, request, PERMISSIONS, RESULTS, openSettings } from "react-native-permissions";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { getCurrentLocation } from "../../services/locationService";
import api from "../../api/apiClient";
import COLORS from "../../constants/colors";

const { height: SCREEN_H } = Dimensions.get("window");

// ─────────────────────────────────────────────────────────────────────────────
// Overlay Modal — replaces all native Alert calls
// ─────────────────────────────────────────────────────────────────────────────
const OverlayModal = ({ visible, icon, iconColor, title, message, buttons, onClose }) => {
  const insets = useSafeAreaInsets();
  const scale  = useRef(new Animated.Value(0.85)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      scale.setValue(0.85);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(scale,   { toValue: 1,    friction: 7, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      <View style={ov.backdrop}>
        <Animated.View style={[ov.card, { opacity, transform: [{ scale }], paddingBottom: insets.bottom + 16 }]}>
          {/* Icon */}
          <View style={[ov.iconBox, { backgroundColor: (iconColor || COLORS.PRIMARY) + "18" }]}>
            <Icon name={icon || "information-outline"} size={36} color={iconColor || COLORS.PRIMARY} />
          </View>

          {/* Text */}
          <Text style={ov.title}>{title}</Text>
          {message ? <Text style={ov.message}>{message}</Text> : null}

          {/* Buttons */}
          <View style={ov.btnRow}>
            {(buttons || [{ text: "OK", onPress: onClose }]).map((btn, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  ov.btn,
                  btn.style === "destructive" && ov.btnDestructive,
                  btn.primary && ov.btnPrimary,
                  (buttons || []).length === 1 && ov.btnFull,
                ]}
                onPress={() => { onClose?.(); btn.onPress?.(); }}
                accessibilityRole="button"
              >
                <Text style={[
                  ov.btnTxt,
                  btn.style === "destructive" && ov.btnTxtDestructive,
                  btn.primary && ov.btnTxtPrimary,
                ]}>
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const ov = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center", alignItems: "center", padding: 24,
  },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: 20,
    padding: 24, width: "100%", alignItems: "center", gap: 10,
    shadowColor: "#000", shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2, shadowRadius: 20, elevation: 20,
  },
  iconBox: {
    width: 70, height: 70, borderRadius: 35,
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  title:   { fontSize: 18, fontWeight: "800", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  message: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 20 },
  btnRow:  { flexDirection: "row", gap: 10, marginTop: 8, width: "100%" },
  btn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.BORDER, alignItems: "center",
  },
  btnFull:            { flex: 1 },
  btnPrimary:         { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  btnDestructive:     { borderColor: COLORS.ERROR },
  btnTxt:             { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  btnTxtPrimary:      { color: "#fff" },
  btnTxtDestructive:  { color: COLORS.ERROR },
});

// ─────────────────────────────────────────────────────────────────────────────
// Success overlay — shown after submission (pending)
// ─────────────────────────────────────────────────────────────────────────────
const SuccessOverlay = ({ visible, onContinue }) => {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    if (!visible) return;
    scale.setValue(0);
    opacity.setValue(0);
    slideY.setValue(30);
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible}>
      <Animated.View style={[so.overlay, { opacity }]}>
        <Animated.View style={[so.circle, { transform: [{ scale }] }]}>
          <Icon name="shield-check" size={60} color="#ffffff" />
        </Animated.View>

        <Animated.View style={{ transform: [{ translateY: slideY }], alignItems: "center", gap: 8 }}>
          <Text style={so.title}>Submitted for Review</Text>
          <Text style={so.sub}>
            Your verification has been sent to the BinGo admin team. You'll be notified once it's reviewed.
          </Text>
        </Animated.View>

        {/* Steps */}
        <View style={so.stepsCard}>
          {[
            { icon: "check-circle",       label: "Location pinned",       done: true },
            { icon: "check-circle",       label: "Residence photo added", done: true },
            { icon: "check-circle",       label: "Face captured",         done: true },
            { icon: "clock-outline",      label: "Admin review pending",  done: false },
            { icon: "shield-check-outline", label: "Verification approved", done: false },
          ].map((item, i) => (
            <View key={i} style={so.stepRow}>
              <Icon
                name={item.icon}
                size={18}
                color={item.done ? COLORS.SUCCESS : COLORS.TEXT_DISABLED}
              />
              <Text style={[so.stepTxt, item.done && so.stepTxtDone]}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={so.btn} onPress={onContinue} accessibilityRole="button">
          <Text style={so.btnTxt}>Back to Profile</Text>
        </TouchableOpacity>

        <Text style={so.note}>
          You'll receive a WhatsApp notification once your profile is verified.
        </Text>
      </Animated.View>
    </Modal>
  );
};

const so = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: "#1B5E20",
    justifyContent: "center", alignItems: "center",
    padding: 24, gap: 20,
  },
  circle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.22)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.55)",
  },
  title: { fontSize: 26, fontWeight: "800", color: "#fff", textAlign: "center" },
  sub:   { fontSize: 14, color: "rgba(255,255,255,0.8)", textAlign: "center", lineHeight: 20 },
  stepsCard: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 14, padding: 16, gap: 12,
  },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepTxt:     { fontSize: 13, color: "rgba(255,255,255,0.55)", fontWeight: "500" },
  stepTxtDone: { color: "#fff", fontWeight: "600" },
  btn: {
    width: "100%", backgroundColor: "rgba(255,255,255,0.2)",
    paddingVertical: 14, borderRadius: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.3)",
  },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  note:   { fontSize: 11, color: "rgba(255,255,255,0.5)", textAlign: "center" },
});

// ─────────────────────────────────────────────────────────────────────────────
// Step bar
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  { icon: "map-marker-radius", label: "Location" },
  { icon: "home-city-outline", label: "Residence" },
  { icon: "face-recognition",  label: "Face ID" },
];

const StepBar = ({ current }) => (
  <View style={s.stepBar}>
    {STEPS.map((step, i) => (
      <React.Fragment key={step.label}>
        <View style={s.stepItem}>
          <View style={[s.stepCircle, i <= current && s.stepActive]}>
            {i < current
              ? <Icon name="check" size={14} color="#fff" />
              : <Icon name={step.icon} size={16} color={i <= current ? "#fff" : COLORS.TEXT_DISABLED} />
            }
          </View>
          <Text style={[s.stepLbl, i === current && s.stepLblActive]}>{step.label}</Text>
        </View>
        {i < STEPS.length - 1 && (
          <View style={[s.stepLine, i < current && s.stepLineDone]} />
        )}
      </React.Fragment>
    ))}
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────────────────────────────────────
const ResidentVerificationScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();

  const [step, setStep]             = useState(0);
  const [pinCoord, setPinCoord]     = useState({ latitude: 6.9271, longitude: 79.8612 });
  const [loadingLocation, setLoadingLoc] = useState(false);
  const [residenceImage, setRes]    = useState(null);
  const [faceImage, setFace]        = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setSuccess]   = useState(false);
  const mapRef = useRef(null);

  // Overlay state
  const [overlay, setOverlay] = useState({
    visible: false, icon: "", iconColor: "", title: "", message: "", buttons: [],
  });

  const showOverlay = (icon, iconColor, title, message, buttons) => {
    setOverlay({ visible: true, icon, iconColor, title, message, buttons: buttons || [] });
  };
  const closeOverlay = () => setOverlay(o => ({ ...o, visible: false }));

  // ── Auto-detect current GPS location ─────────────────────────────────────────
  const fetchCurrentLocation = async (silent = false) => {
    if (!silent) setLoadingLoc(true);
    try {
      const loc = await getCurrentLocation();
      if (loc?.latitude && loc?.longitude) {
        const coord = { latitude: loc.latitude, longitude: loc.longitude };
        setPinCoord(coord);
        mapRef.current?.animateToRegion({
          ...coord,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        }, 800);
      }
    } catch (e) {
      if (!silent) {
        mapRef.current?.animateToRegion({
          ...pinCoord,
          latitudeDelta: 0.006,
          longitudeDelta: 0.006,
        }, 600);
      }
    } finally {
      if (!silent) setLoadingLoc(false);
    }
  };

  useEffect(() => {
    fetchCurrentLocation(true);
  }, []);

  // ── Map handlers ────────────────────────────────────────────────────────────
  const handleMapPress  = (e) => setPinCoord(e.nativeEvent.coordinate);
  const handleDragEnd   = (e) => setPinCoord(e.nativeEvent.coordinate);
  const handleRecenter  = () => fetchCurrentLocation(false);

  // ── Camera permission helper ────────────────────────────────────────────────
  const ensureCameraPermission = async () => {
    const perm = Platform.OS === "android"
      ? PERMISSIONS.ANDROID.CAMERA : PERMISSIONS.IOS.CAMERA;
    const status = await check(perm);
    if (status === RESULTS.GRANTED) return true;
    const result = await request(perm);
    if (result === RESULTS.GRANTED) return true;
    showOverlay(
      "camera-off", COLORS.ERROR,
      "Camera Permission Required",
      "Please allow camera access in Settings to continue.",
      [
        { text: "Cancel" },
        { text: "Open Settings", primary: true, onPress: () => openSettings() },
      ]
    );
    return false;
  };

  // ── Residence photo ─────────────────────────────────────────────────────────
  const pickResidenceImage = () => {
    showOverlay(
      "home-city-outline", COLORS.PRIMARY,
      "Residence Photo",
      "How would you like to add your residence photo?",
      [
        {
          text: "Take Photo", primary: true,
          onPress: async () => {
            const ok = await ensureCameraPermission();
            if (!ok) return;
            launchCamera(
              { mediaType: "photo", quality: 0.7, includeBase64: true, cameraType: "back", saveToPhotos: false },
              (res) => {
                if (res.didCancel || res.errorCode) return;
                const a = res.assets?.[0];
                if (a?.base64) setRes(`data:image/jpeg;base64,${a.base64}`);
              }
            );
          },
        },
        {
          text: "Gallery",
          onPress: () => {
            launchImageLibrary(
              { mediaType: "photo", quality: 0.7, includeBase64: true },
              (res) => {
                if (res.didCancel || res.errorCode) return;
                const a = res.assets?.[0];
                if (a?.base64) setRes(`data:image/jpeg;base64,${a.base64}`);
              }
            );
          },
        },
      ]
    );
  };

  // ── Face capture ────────────────────────────────────────────────────────────
  const captureFace = async () => {
    const ok = await ensureCameraPermission();
    if (!ok) return;
    launchCamera(
      { mediaType: "photo", quality: 0.8, includeBase64: true, cameraType: "front", saveToPhotos: false },
      (res) => {
        if (res.didCancel) return;
        if (res.errorCode) {
          showOverlay("alert-circle", COLORS.ERROR, "Camera Error",
            res.errorMessage || "Could not open camera. Please try again.", []);
          return;
        }
        const a = res.assets?.[0];
        if (a?.base64) setFace(`data:image/jpeg;base64,${a.base64}`);
      }
    );
  };

  // ── Navigation ──────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else if (step === 1) {
      if (!residenceImage) {
        showOverlay("home-alert-outline", COLORS.WARNING,
          "Photo Required",
          "Please take or upload a photo of the front of your residence before continuing.",
          [{ text: "OK", primary: true }]);
        return;
      }
      setStep(2);
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!faceImage) {
      showOverlay("face-recognition", COLORS.WARNING,
        "Face Required",
        "Please capture your face using the front camera to complete verification.",
        [{ text: "OK", primary: true }]);
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/users/verify", {
        latitude:       pinCoord.latitude,
        longitude:      pinCoord.longitude,
        residenceImage,
        faceImage,
      });
      // Update local context to "pending"
      await updateUser({
        ...user,
        verificationStatus: "pending",
        profileVerified:    false,
      });
      setSuccess(true);
    } catch (e) {
      showOverlay("alert-circle", COLORS.ERROR,
        "Submission Failed",
        e.message || "Could not submit verification. Please check your connection and try again.",
        [{ text: "Try Again", primary: true }]);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step renders ────────────────────────────────────────────────────────────
  const renderStep0 = () => (
    <View style={s.stepContent}>
      <View style={s.infoBanner}>
        <Icon name="gesture-tap" size={20} color={COLORS.PRIMARY} />
        <Text style={s.infoBannerTxt}>
          Tap anywhere on the map to move the pin, or drag the pin to your exact residence.
        </Text>
      </View>

      {/* Map with Google Maps provider + OpenStreetMap tile fallback */}
      <View style={s.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={s.map}
          initialRegion={{
            latitude: pinCoord.latitude,
            longitude: pinCoord.longitude,
            latitudeDelta: 0.008,
            longitudeDelta: 0.008,
          }}
          onPress={handleMapPress}
          showsUserLocation
          showsMyLocationButton={false}
          showsCompass
          showsScale
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          <Marker
            coordinate={pinCoord}
            draggable
            onDragEnd={handleDragEnd}
            title="My Residence"
            pinColor={COLORS.PRIMARY}
          />
        </MapView>

        <View style={s.zoomHint} pointerEvents="none">
          <Icon name="magnify-plus-outline" size={13} color={COLORS.TEXT_SECONDARY} />
          <Text style={s.zoomHintTxt}>Pinch to zoom for accuracy</Text>
        </View>
      </View>

      {/* Coordinates */}
      <View style={s.coordCard}>
        <Icon name="map-marker-check" size={20} color={COLORS.PRIMARY} />
        <View style={{ flex: 1 }}>
          <Text style={s.coordLabel}>Pinned Location</Text>
          <Text style={s.coordVal} numberOfLines={1}>
            {pinCoord.latitude.toFixed(6)}, {pinCoord.longitude.toFixed(6)}
          </Text>
        </View>
        <TouchableOpacity
          style={s.recenterBtn}
          onPress={handleRecenter}
          disabled={loadingLocation}
          accessibilityRole="button"
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <Icon name="crosshairs-gps" size={18} color={COLORS.PRIMARY} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep1 = () => (
    <View style={s.stepContent}>
      {residenceImage ? (
        <View style={s.previewBox}>
          <Image source={{ uri: residenceImage }} style={s.previewImg} />
          <View style={s.previewActions}>
            <View style={s.previewOk}>
              <Icon name="check-circle" size={16} color={COLORS.SUCCESS} />
              <Text style={s.previewOkTxt}>Photo added</Text>
            </View>
            <TouchableOpacity style={s.retakeBtn} onPress={() => setRes(null)}>
              <Icon name="refresh" size={15} color={COLORS.PRIMARY} />
              <Text style={s.retakeTxt}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={s.photoPlaceholder} onPress={pickResidenceImage}>
          <View style={s.photoIconBox}>
            <Icon name="home-city-outline" size={42} color={COLORS.PRIMARY} />
          </View>
          <Text style={s.photoTitle}>Add Residence Photo</Text>
          <Text style={s.photoSub}>Tap to take a photo or choose from gallery</Text>
        </TouchableOpacity>
      )}
      <View style={s.tipsCard}>
        <Text style={s.tipsTitle}>📸 Photo Tips</Text>
        {[
          "Show the full front of your residence",
          "Take during daylight for clarity",
          "Include the house number / name plate",
          "Ensure the photo is not blurry",
        ].map((t, i) => (
          <View key={i} style={s.tipRow}>
            <Icon name="check-circle-outline" size={14} color={COLORS.PRIMARY} />
            <Text style={s.tipTxt}>{t}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={s.stepContent}>
      {faceImage ? (
        <View style={s.previewBox}>
          <Image source={{ uri: faceImage }} style={s.facePreview} />
          <View style={s.previewActions}>
            <View style={s.previewOk}>
              <Icon name="check-decagram" size={16} color={COLORS.SUCCESS} />
              <Text style={s.previewOkTxt}>Face captured</Text>
            </View>
            <TouchableOpacity style={s.retakeBtn} onPress={() => setFace(null)}>
              <Icon name="refresh" size={15} color={COLORS.PRIMARY} />
              <Text style={s.retakeTxt}>Retake</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={s.faceStep}>
          {/* Face oval guide */}
          <View style={s.faceOvalContainer}>
            <Icon name="face-man" size={110} color="rgba(46,125,50,0.12)" />
            <View style={s.faceOval} />
            <View style={s.faceCorners}>
              <View style={[s.corner, s.cTL]} />
              <View style={[s.corner, s.cTR]} />
              <View style={[s.corner, s.cBL]} />
              <View style={[s.corner, s.cBR]} />
            </View>
            <Text style={s.faceGuide}>Position your face here</Text>
          </View>

          <View style={s.faceInstr}>
            {[
              { icon: "lightbulb-outline",        text: "Find a well-lit area" },
              { icon: "glasses",                  text: "Remove glasses or hats" },
              { icon: "eye-outline",              text: "Look directly at the front camera" },
              { icon: "emoticon-neutral-outline", text: "Keep a neutral expression" },
            ].map((item, i) => (
              <View key={i} style={s.instrRow}>
                <View style={s.instrIcon}>
                  <Icon name={item.icon} size={18} color={COLORS.PRIMARY} />
                </View>
                <Text style={s.instrTxt}>{item.text}</Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={s.captureBtn} onPress={captureFace} accessibilityRole="button">
            <Icon name="camera-front" size={22} color="#fff" />
            <Text style={s.captureBtnTxt}>Open Front Camera</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      {/* Sticky header */}
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
          <Text style={s.headerTitle}>
            {["Pin Residence Location", "Residence Photo", "Face Recognition"][step]}
          </Text>
          <Text style={s.headerSub}>Step {step + 1} of 3</Text>
        </View>
      </View>

      <StepBar current={step} />

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {step === 0 && renderStep0()}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
      </ScrollView>

      {/* Footer */}
      <View style={s.footer}>
        {step < 2 ? (
          <TouchableOpacity style={s.nextBtn} onPress={handleNext} accessibilityRole="button">
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
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <View style={s.submitInner}>
                <Icon name="send-check" size={20} color="#fff" />
                <Text style={s.nextBtnTxt}>Submit for Review</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Overlay modal */}
      <OverlayModal
        visible={overlay.visible}
        icon={overlay.icon}
        iconColor={overlay.iconColor}
        title={overlay.title}
        message={overlay.message}
        buttons={overlay.buttons}
        onClose={closeOverlay}
      />

      {/* Success overlay */}
      <SuccessOverlay
        visible={showSuccess}
        onContinue={() => { setSuccess(false); navigation.goBack(); }}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
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
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  stepBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 14,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER,
  },
  stepItem:    { alignItems: "center", gap: 4 },
  stepCircle:  { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.BORDER, justifyContent: "center", alignItems: "center" },
  stepActive:  { backgroundColor: COLORS.PRIMARY },
  stepLine:    { flex: 1, height: 2, backgroundColor: COLORS.BORDER, marginHorizontal: 4 },
  stepLineDone:{ backgroundColor: COLORS.PRIMARY },
  stepLbl:     { fontSize: 10, color: COLORS.TEXT_DISABLED, fontWeight: "500" },
  stepLblActive:{ color: COLORS.PRIMARY, fontWeight: "700" },

  scroll:      { padding: 16, paddingBottom: 24 },
  stepContent: { gap: 14 },

  infoBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    backgroundColor: "#E8F5E9", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#C8E6C9",
  },
  infoBannerTxt: { flex: 1, fontSize: 13, color: COLORS.PRIMARY_DARK, lineHeight: 18 },

  mapContainer: {
    height: 320, width: "100%", borderRadius: 14, overflow: "hidden",
    borderWidth: 1, borderColor: COLORS.BORDER,
    backgroundColor: "#E8ECE9",
  },
  map: { width: "100%", height: "100%" },
  zoomHint: {
    position: "absolute", bottom: 10, left: 10,
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  zoomHintTxt: { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  coordCard:   { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: COLORS.BORDER },
  coordLabel:  { fontSize: 11, color: COLORS.TEXT_DISABLED, marginBottom: 1 },
  coordVal:    { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontFamily: "monospace" },
  recenterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },

  photoPlaceholder: {
    height: 200, borderRadius: 14, borderWidth: 2,
    borderColor: COLORS.PRIMARY, borderStyle: "dashed",
    justifyContent: "center", alignItems: "center", gap: 10,
    backgroundColor: "#F1F8F4",
  },
  photoIconBox: { width: 72, height: 72, borderRadius: 18, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  photoTitle:   { fontSize: 16, fontWeight: "700", color: COLORS.PRIMARY },
  photoSub:     { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center", paddingHorizontal: 20 },

  previewBox:     { alignItems: "center", gap: 10 },
  previewImg:     { width: "100%", height: 240, borderRadius: 14 },
  facePreview:    { width: 220, height: 220, borderRadius: 110, borderWidth: 3, borderColor: COLORS.SUCCESS },
  previewActions: { flexDirection: "row", gap: 14, alignItems: "center" },
  previewOk:      { flexDirection: "row", alignItems: "center", gap: 5 },
  previewOkTxt:   { fontSize: 13, color: COLORS.SUCCESS, fontWeight: "600" },
  retakeBtn:      { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1.5, borderColor: COLORS.PRIMARY, borderRadius: 20 },
  retakeTxt:      { color: COLORS.PRIMARY, fontSize: 13, fontWeight: "600" },

  tipsCard:  { backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER, gap: 8 },
  tipsTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 2 },
  tipRow:    { flexDirection: "row", alignItems: "flex-start", gap: 7 },
  tipTxt:    { flex: 1, fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },

  faceStep:   { gap: 16, alignItems: "center" },
  faceOvalContainer: { width: 240, height: 300, justifyContent: "center", alignItems: "center", position: "relative" },
  faceOval:   { position: "absolute", width: 200, height: 260, borderRadius: 100, borderWidth: 3, borderColor: COLORS.PRIMARY, borderStyle: "dashed" },
  faceCorners:{ position: "absolute", width: 200, height: 260 },
  corner:     { position: "absolute", width: 22, height: 22, borderColor: COLORS.PRIMARY },
  cTL: { top: 0,    left: 0,  borderTopWidth: 3,    borderLeftWidth: 3 },
  cTR: { top: 0,    right: 0, borderTopWidth: 3,    borderRightWidth: 3 },
  cBL: { bottom: 0, left: 0,  borderBottomWidth: 3, borderLeftWidth: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  faceGuide:  { position: "absolute", bottom: -26, fontSize: 12, color: COLORS.TEXT_SECONDARY },

  faceInstr:  { width: "100%", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER, gap: 10 },
  instrRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  instrIcon:  { width: 32, height: 32, borderRadius: 8, backgroundColor: "#E8F5E9", justifyContent: "center", alignItems: "center" },
  instrTxt:   { flex: 1, fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },

  captureBtn: { width: "100%", backgroundColor: COLORS.PRIMARY, paddingVertical: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  captureBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  footer: { padding: 16, backgroundColor: COLORS.SURFACE, borderTopWidth: 1, borderTopColor: COLORS.BORDER },
  nextBtn:     { backgroundColor: COLORS.PRIMARY, paddingVertical: 15, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  submitBtn:   { backgroundColor: COLORS.SUCCESS },
  submitInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnDisabled: { opacity: 0.5 },
  nextBtnTxt:  { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ResidentVerificationScreen;
