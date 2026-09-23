/**
 * BinGo – Verification Gate
 *
 * Wraps any screen that requires a verified resident profile.
 * If the resident is not verified, shows a full-screen block
 * with a button to start verification.
 *
 * Usage:
 *   const ReportWasteScreen = () => (
 *     <VerificationGate navigation={navigation}>
 *       <ActualContent />
 *     </VerificationGate>
 *   );
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import COLORS from "../constants/colors";

const VerificationGate = ({ children, navigation }) => {
  const { user } = useAuth();

  // Only gate residents
  if (user?.role !== "resident") return <>{children}</>;

  // Verified — show content
  if (user?.profileVerified || user?.verificationStatus === "verified") return <>{children}</>;

  // Pending — show waiting state
  if (user?.verificationStatus === "pending") {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.content}>
          <View style={[s.iconBox, { backgroundColor: "#FFF3E0" }]}>
            <Icon name="clock-outline" size={52} color={COLORS.WARNING} />
          </View>
          <Text style={s.title}>Verification Pending</Text>
          <Text style={s.sub}>
            Your verification is being reviewed. You'll be notified once it's approved.
          </Text>
          <View style={s.stepsCard}>
            {[
              { icon: "check-circle", label: "Verification submitted", done: true },
              { icon: "clock-outline", label: "Under review", done: false },
              { icon: "shield-check-outline", label: "Access granted", done: false },
            ].map((item, i) => (
              <View key={i} style={s.stepRow}>
                <Icon name={item.icon} size={18} color={item.done ? COLORS.SUCCESS : COLORS.TEXT_DISABLED} />
                <Text style={[s.stepLabel, item.done && s.stepDone]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Unverified — show gate
  return (
    <SafeAreaView style={s.container}>
      <View style={s.content}>
        <View style={s.iconBox}>
          <Icon name="shield-account-outline" size={52} color={COLORS.PRIMARY} />
        </View>
        <Text style={s.title}>Verification Required</Text>
        <Text style={s.sub}>
          You need to verify your profile before accessing this feature. It only takes a few minutes.
        </Text>

        <View style={s.stepsCard}>
          <Text style={s.stepsTitle}>What you'll need:</Text>
          {[
            { icon: "map-marker-radius",  label: "Pin your residence on the map" },
            { icon: "home-city-outline",  label: "Photo of your residence" },
            { icon: "face-recognition",   label: "A quick selfie" },
          ].map((item, i) => (
            <View key={i} style={s.stepRow}>
              <View style={s.stepIcon}>
                <Icon name={item.icon} size={18} color={COLORS.PRIMARY} />
              </View>
              <Text style={s.stepLabel}>{item.label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={s.verifyBtn}
          onPress={() => navigation.navigate("Profile", { screen: "ResidentVerification" })}
          accessibilityRole="button"
        >
          <Icon name="shield-check" size={20} color="#fff" />
          <Text style={s.verifyBtnTxt}>Verify My Profile</Text>
        </TouchableOpacity>

        <Text style={s.note}>
          Verification helps keep the BinGo community safe and trusted.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: {
    flex: 1, padding: 24,
    justifyContent: "center", alignItems: "center", gap: 16,
  },
  iconBox: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "800", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  sub: {
    fontSize: 14, color: COLORS.TEXT_SECONDARY,
    textAlign: "center", lineHeight: 20, paddingHorizontal: 8,
  },
  stepsCard: {
    width: "100%", backgroundColor: COLORS.SURFACE,
    borderRadius: 14, padding: 16, gap: 12,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  stepsTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  stepLabel: { fontSize: 13, color: COLORS.TEXT_PRIMARY, flex: 1 },
  stepDone:  { color: COLORS.SUCCESS, fontWeight: "600" },

  verifyBtn: {
    width: "100%", backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15, borderRadius: 12,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  verifyBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  note: {
    fontSize: 11, color: COLORS.TEXT_DISABLED,
    textAlign: "center", lineHeight: 16, paddingHorizontal: 16,
  },
});

export default VerificationGate;
