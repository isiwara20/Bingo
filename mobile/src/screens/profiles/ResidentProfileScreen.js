/**
 * BinGo – Resident Profile Screen
 *
 * Shows profile info, plan badge, reward points, verification status.
 * Unverified residents see a prominent banner to complete verification.
 * Verified residents see a green verified badge.
 */

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { logout as logoutApi } from "../../services/authService";
import COLORS from "../../constants/colors";

const PLAN_COLOR = { free: "#757575", plus: "#1565C0", pro: "#6A1B9A" };
const PLAN_ICON  = { free: "sprout",  plus: "star-circle", pro: "crown" };

const VerificationBadge = ({ status }) => {
  if (status === "verified") {
    return (
      <View style={s.verifiedBadge}>
        <Icon name="check-decagram" size={16} color="#fff" />
        <Text style={s.verifiedBadgeTxt}>Verified Resident</Text>
      </View>
    );
  }
  if (status === "pending") {
    return (
      <View style={[s.verifiedBadge, { backgroundColor: COLORS.WARNING }]}>
        <Icon name="clock-outline" size={16} color="#fff" />
        <Text style={s.verifiedBadgeTxt}>Pending Admin Review</Text>
      </View>
    );
  }
  return (
    <View style={[s.verifiedBadge, { backgroundColor: COLORS.TEXT_DISABLED }]}>
      <Icon name="shield-alert-outline" size={16} color="#fff" />
      <Text style={s.verifiedBadgeTxt}>Not Verified</Text>
    </View>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <View style={s.infoRow}>
    <View style={s.infoIcon}>
      <Icon name={icon} size={18} color={COLORS.PRIMARY} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || "—"}</Text>
    </View>
  </View>
);

const ResidentProfileScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const isVerified = user?.profileVerified || user?.verificationStatus === "verified";
  const planKey    = user?.plan || "free";
  const planColor  = PLAN_COLOR[planKey] || COLORS.TEXT_SECONDARY;

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try { await logoutApi(); } catch (_) {}
          await logout();
        },
      },
    ]);
  };

  const handleVerify = () => {
    navigation.navigate("ResidentVerification");
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header card */}
        <View style={s.headerCard}>
          {/* Avatar */}
          <View style={s.avatarContainer}>
            {user?.faceImage ? (
              <Image source={{ uri: user.faceImage }} style={s.avatarImg} />
            ) : (
              <View style={s.avatar}>
                <Text style={s.avatarTxt}>{user?.name?.[0]?.toUpperCase() || "R"}</Text>
              </View>
            )}
            {isVerified && (
              <View style={s.avatarBadge}>
                <Icon name="check-decagram" size={18} color={COLORS.SUCCESS} />
              </View>
            )}
          </View>

          <Text style={s.name}>{user?.name || "Resident"}</Text>
          <Text style={s.email}>{user?.email}</Text>

          {/* Verification badge */}
          <VerificationBadge status={user?.verificationStatus || "unverified"} />

          {/* Plan badge */}
          <View style={[s.planBadge, { backgroundColor: planColor + "18", borderColor: planColor }]}>
            <Icon name={PLAN_ICON[planKey]} size={14} color={planColor} />
            <Text style={[s.planTxt, { color: planColor }]}>
              {planKey.charAt(0).toUpperCase() + planKey.slice(1)} Plan
            </Text>
          </View>

          {/* Reward points */}
          <View style={s.pointsRow}>
            <Icon name="star-circle" size={18} color={COLORS.SECONDARY} />
            <Text style={s.pointsTxt}>{user?.rewardPoints || 0} reward points</Text>
          </View>
        </View>

        {/* Verified confirmation */}
        {isVerified && (
          <View style={s.verifiedCard}>
            <Icon name="shield-check" size={24} color={COLORS.SUCCESS} />
            <View style={{ flex: 1 }}>
              <Text style={s.verifiedCardTitle}>Profile Verified</Text>
              <Text style={s.verifiedCardSub}>
                Verified on {user?.verifiedAt
                  ? new Date(user.verifiedAt).toLocaleDateString()
                  : "—"}
              </Text>
            </View>
          </View>
        )}

        {/* Verification CTA — only when not verified and not pending/rejected */}
        {!isVerified && user?.verificationStatus !== "pending" && user?.verificationStatus !== "rejected" && (
          <TouchableOpacity
            style={s.verifyBanner}
            onPress={handleVerify}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <View style={s.verifyBannerLeft}>
              <View style={s.verifyIconBox}>
                <Icon name="shield-account" size={26} color={COLORS.PRIMARY} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.verifyTitle}>Complete Verification</Text>
                <Text style={s.verifySub}>
                  Pin your location, upload your residence photo and take a selfie to unlock all features.
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={22} color={COLORS.PRIMARY} />
          </TouchableOpacity>
        )}

        {/* Pending review card */}
        {user?.verificationStatus === "pending" && (
          <View style={[s.verifiedCard, { backgroundColor: "#FFF3E0", borderColor: "#FFE0B2" }]}>
            <Icon name="clock-outline" size={24} color={COLORS.WARNING} />
            <View style={{ flex: 1 }}>
              <Text style={[s.verifiedCardTitle, { color: COLORS.WARNING }]}>Under Review</Text>
              <Text style={s.verifiedCardSub}>
                Your verification is being reviewed by the BinGo admin team. You'll be notified via WhatsApp.
              </Text>
            </View>
          </View>
        )}

        {/* Rejected card */}
        {user?.verificationStatus === "rejected" && (
          <TouchableOpacity
            style={[s.verifiedCard, { backgroundColor: "#FFEBEE", borderColor: "#FFCDD2" }]}
            onPress={handleVerify}
          >
            <Icon name="close-circle" size={24} color={COLORS.ERROR} />
            <View style={{ flex: 1 }}>
              <Text style={[s.verifiedCardTitle, { color: COLORS.ERROR }]}>Verification Rejected</Text>
              <Text style={s.verifiedCardSub}>
                {user?.verificationRejectedReason || "Your verification was not approved. Tap to resubmit."}
              </Text>
            </View>
            <Icon name="chevron-right" size={18} color={COLORS.ERROR} />
          </TouchableOpacity>
        )}

        {/* Info section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Profile Details</Text>
          <View style={s.infoCard}>
            <InfoRow icon="account-outline"     label="Full Name"      value={user?.name} />
            <View style={s.divider} />
            <InfoRow icon="email-outline"        label="Email"          value={user?.email} />
            <View style={s.divider} />
            <InfoRow icon="whatsapp"             label="WhatsApp"       value={user?.whatsappNumber} />
            <View style={s.divider} />
            <InfoRow icon="map-marker-outline"   label="Home Address"   value={user?.address} />
            <View style={s.divider} />
            <InfoRow icon="calendar-outline"     label="Member Since"   value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} />
          </View>
        </View>

        {/* Actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <View style={s.actionCard}>
            {[
              { icon: "cog-outline",        label: "Settings",          onPress: () => navigation.navigate("Settings") },
              { icon: "tag-outline",         label: "My Plan",           onPress: () => navigation.navigate("Payment", { plan: { key: planKey, name: planKey, price: 0 } }) },
              { icon: "star-outline",        label: "Rewards",           onPress: () => navigation.navigate("Rewards") },
              { icon: "bell-outline",        label: "Notifications",     onPress: () => navigation.navigate("Notifications") },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={s.actionRow}
                  onPress={item.onPress}
                  accessibilityRole="button"
                >
                  <View style={s.actionIcon}>
                    <Icon name={item.icon} size={20} color={COLORS.PRIMARY} />
                  </View>
                  <Text style={s.actionLabel}>{item.label}</Text>
                  <Icon name="chevron-right" size={18} color={COLORS.TEXT_DISABLED} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={s.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[s.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
        >
          <Icon name="logout" size={20} color={COLORS.ERROR} />
          <Text style={s.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll:    { padding: 16, paddingBottom: 40, gap: 12 },

  headerCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 16,
    padding: 20, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: COLORS.BORDER, elevation: 2,
  },
  avatarContainer: { position: "relative", marginBottom: 4 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: "center", alignItems: "center",
  },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarTxt: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  avatarBadge: {
    position: "absolute", bottom: 0, right: 0,
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    padding: 1,
  },
  name:  { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  email: { fontSize: 13, color: COLORS.TEXT_SECONDARY },

  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: COLORS.SUCCESS, borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  verifiedBadgeTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },

  planBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1,
  },
  planTxt: { fontSize: 12, fontWeight: "700" },

  pointsRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pointsTxt: { fontSize: 13, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },

  // Verification CTA
  verifyBanner: {
    backgroundColor: "#E8F5E9", borderRadius: 14, padding: 14,
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: COLORS.PRIMARY,
    gap: 10, elevation: 1,
  },
  verifyBannerLeft: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  verifyIconBox: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: COLORS.SURFACE,
    justifyContent: "center", alignItems: "center",
  },
  verifyTitle: { fontSize: 15, fontWeight: "700", color: COLORS.PRIMARY_DARK, marginBottom: 2 },
  verifySub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },

  // Verified card
  verifiedCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#E8F5E9", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#C8E6C9",
  },
  verifiedCardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.SUCCESS },
  verifiedCardSub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  // Info
  section: { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_DISABLED, textTransform: "uppercase", letterSpacing: 0.8 },
  infoCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  infoLabel: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginBottom: 1 },
  infoValue: { fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  divider:   { height: 1, backgroundColor: COLORS.DIVIDER, marginLeft: 60 },

  // Actions
  actionCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  actionRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  actionIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  actionLabel: { flex: 1, fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: COLORS.ERROR, borderRadius: 12,
    paddingVertical: 14, marginTop: 4,
  },
  logoutTxt: { color: COLORS.ERROR, fontSize: 15, fontWeight: "600" },
});

export default ResidentProfileScreen;
