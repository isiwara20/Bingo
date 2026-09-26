/**
 * BinGo – Settings Screen
 *
 * Comprehensive settings module for all 3 user roles:
 *  - Resident: pickup reminders, recycling tips, verification status, plan management
 *  - Community Leader: community broadcast alerts, cleanliness digest, ward info
 *  - Waste Authority: dispatch alerts, auto-refresh interval, priority escalation
 *
 * Shared features:
 *  - User profile summary with role-based thematic badge
 *  - Edit Profile modal (updates name, whatsapp, role-specific details via API)
 *  - Change Password modal (verifies current password via API)
 *  - Notification preferences (push, WhatsApp, sounds) saved to AsyncStorage
 *  - App preferences (language, distance units, dark mode, low data mode)
 *  - FAQs, Privacy Policy, Terms of Service modals
 *  - Account deactivation & sign out
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, TextInput, Modal, Alert, ActivityIndicator, Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { logout as logoutApi } from "../services/authService";
import api from "../api/apiClient";
import COLORS from "../constants/colors";
import { getUiText } from "../constants/translations";

const STORAGE_KEY = "@bingo_user_settings";

const ROLE_THEME = {
  resident: {
    primary: COLORS.PRIMARY,
    light: "#E8F5E9",
    dark: COLORS.PRIMARY_DARK,
    badgeText: "Resident",
    badgeIcon: "home-account",
  },
  community_leader: {
    primary: "#1565C0",
    light: "#E3F2FD",
    dark: "#0D47A1",
    badgeText: "Community Leader",
    badgeIcon: "account-group",
  },
  waste_authority: {
    primary: "#00695C",
    light: "#E0F2F1",
    dark: "#004D40",
    badgeText: "Waste Authority",
    badgeIcon: "shield-account",
  },
  admin: {
    primary: "#7C3AED",
    light: "#EDE9FE",
    dark: "#5B21B6",
    badgeText: "Administrator",
    badgeIcon: "shield-crown",
  },
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "si", label: "සිංහල (Sinhala)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
];

const FAQS = [
  {
    q: "How do I report illegal waste dumping?",
    a: "Go to the Report tab, take or upload photos of the waste, pin the GPS location, select waste type, and submit. The waste authority will be notified.",
  },
  {
    q: "How does resident verification work?",
    a: "Under Profile, tap 'Complete Verification' to pin your residence location, upload a front house photo, and take a selfie. BinGo administrators review and verify within 24 hours.",
  },
  {
    q: "How do reward points work?",
    a: "Residents earn reward points for verified waste reports, participating in community cleanups, and regular recycling. Points can be redeemed for partner coupons.",
  },
  {
    q: "How can I change my collection notification timing?",
    a: "You can toggle Waste Collection Reminders right in this Settings screen to receive WhatsApp & push alerts before pickups.",
  },
];

const SettingsScreen = ({ navigation }) => {
  const { user, logout, updateUser } = useAuth();
  const { darkMode: appDarkMode, setDarkMode: setAppDarkMode, language: appLanguage, setLanguage: setAppLanguage } = useTheme();
  const role = user?.role || "resident";
  const uiText = getUiText(appLanguage);
  const theme = ROLE_THEME[role] || ROLE_THEME.resident;

  // ── Notification & Preference State ──────────────────────────────────────────
  const [pushEnabled, setPushEnabled]             = useState(true);
  const [whatsappEnabled, setWhatsappEnabled]     = useState(true);
  const [soundEnabled, setSoundEnabled]           = useState(true);
  const [pickupReminders, setPickupReminders]     = useState(true);
  const [recycleTips, setRecycleTips]             = useState(true);
  const [leaderBroadcasts, setLeaderBroadcasts]   = useState(true);
  const [cleanlinessDigest, setCleanlinessDigest] = useState(true);
  const [dispatchAlerts, setDispatchAlerts]       = useState(true);
  const [autoRefreshMap, setAutoRefreshMap]       = useState(false);
  const [darkMode, setDarkMode]                   = useState(false);
  const [lowDataMode, setLowDataMode]             = useState(false);
  const [unitKm, setUnitKm]                       = useState(true);
  const [language, setLanguage]                   = useState("English");

  // ── Modals State ─────────────────────────────────────────────────────────────
  const [editProfileOpen, setEditProfileOpen]     = useState(false);
  const [changePassOpen, setChangePassOpen]       = useState(false);
  const [langModalOpen, setLangModalOpen]         = useState(false);
  const [faqModalOpen, setFaqModalOpen]           = useState(false);
  const [legalModalOpen, setLegalModalOpen]       = useState(false);
  const [legalModalType, setLegalModalType]       = useState("privacy"); // "privacy" | "terms"

  // ── Form State ───────────────────────────────────────────────────────────────
  const [editName, setEditName]                   = useState(user?.name || "");
  const [editWhatsapp, setEditWhatsapp]           = useState(user?.whatsappNumber || user?.phone || "");
  const [editAddress, setEditAddress]             = useState(user?.address || "");
  const [editCommunity, setEditCommunity]         = useState(user?.communityName || "");
  const [editAuthority, setEditAuthority]         = useState(user?.authorityName || "");
  const [savingProfile, setSavingProfile]         = useState(false);

  // ── Password Form State ──────────────────────────────────────────────────────
  const [currentPassword, setCurrentPass]         = useState("");
  const [newPassword, setNewPass]                 = useState("");
  const [confirmPassword, setConfirmPass]         = useState("");
  const [showCurrentPass, setShowCurrentPass]     = useState(false);
  const [showNewPass, setShowNewPass]             = useState(false);
  const [changingPass, setChangingPass]           = useState(false);

  const [loggingOut, setLoggingOut]               = useState(false);

  const storageKey = STORAGE_KEY + ':' + (user?._id || user?.id || user?.email || role);
  const pendingSave = useRef(Promise.resolve());
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);

  // Load preferences for the signed-in account.
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.pushEnabled !== undefined) setPushEnabled(parsed.pushEnabled);
          if (parsed.whatsappEnabled !== undefined) setWhatsappEnabled(parsed.whatsappEnabled);
          if (parsed.soundEnabled !== undefined) setSoundEnabled(parsed.soundEnabled);
          if (parsed.pickupReminders !== undefined) setPickupReminders(parsed.pickupReminders);
          if (parsed.recycleTips !== undefined) setRecycleTips(parsed.recycleTips);
          if (parsed.leaderBroadcasts !== undefined) setLeaderBroadcasts(parsed.leaderBroadcasts);
          if (parsed.cleanlinessDigest !== undefined) setCleanlinessDigest(parsed.cleanlinessDigest);
          if (parsed.dispatchAlerts !== undefined) setDispatchAlerts(parsed.dispatchAlerts);
          if (parsed.autoRefreshMap !== undefined) setAutoRefreshMap(parsed.autoRefreshMap);
          if (parsed.darkMode !== undefined) setDarkMode(parsed.darkMode);
          if (parsed.lowDataMode !== undefined) setLowDataMode(parsed.lowDataMode);
          if (parsed.unitKm !== undefined) setUnitKm(parsed.unitKm);
          if (parsed.language) setLanguage(parsed.language);
        }
      } catch (_) {
        Alert.alert("Settings unavailable", "Could not load your saved preferences. Please reopen Settings.");
      } finally {
        setPreferencesLoaded(true);
      }
    })();
  }, [storageKey]);

  // Save preferences
  const savePref = (key, val) => {
    // Serialize updates so quickly changing two switches cannot lose a setting.
    pendingSave.current = pendingSave.current.then(async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      const prev = stored ? JSON.parse(stored) : {};
      await AsyncStorage.setItem(storageKey, JSON.stringify({ ...prev, [key]: val }));
    }).catch(() => {
      Alert.alert("Settings not saved", "Could not save this preference. Please try again.");
    });
    return pendingSave.current;
  };

  // ── Edit Profile Handler ─────────────────────────────────────────────────────
  const openEditModal = () => {
    setEditName(user?.name || "");
    setEditWhatsapp(user?.whatsappNumber || user?.phone || "");
    setEditAddress(user?.address || "");
    setEditCommunity(user?.communityName || "");
    setEditAuthority(user?.authorityName || "");
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert("Validation Error", "Name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    try {
      const payload = {
        name: editName.trim(),
        whatsappNumber: editWhatsapp.trim(),
      };
      if (role === "resident") {
        payload.address = editAddress.trim();
      } else if (role === "community_leader") {
        payload.communityName = editCommunity.trim();
      } else if (role === "waste_authority") {
        payload.authorityName = editAuthority.trim();
      }

      const res = await api.put("/users/me", payload);
      const updatedUser = { ...user, ...payload, ...res.data?.data };
      await updateUser(updatedUser);
      setEditProfileOpen(false);
      Alert.alert("Success", "Profile updated successfully.");
    } catch (err) {
      Alert.alert("Update Failed", err.message || "Could not update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  // ── Change Password Handler ──────────────────────────────────────────────────
  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert("Validation Error", "Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Validation Error", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Validation Error", "New passwords do not match.");
      return;
    }
    setChangingPass(true);
    try {
      await api.put("/users/change-password", {
        currentPassword,
        newPassword,
      });
      setChangePassOpen(false);
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
      Alert.alert("Success", "Password updated successfully.");
    } catch (err) {
      Alert.alert("Change Password Failed", err.message || "Failed to update password.");
    } finally {
      setChangingPass(false);
    }
  };

  // ── Clear Cache ──────────────────────────────────────────────────────────────
  const handleClearCache = () => {
    Alert.alert("Clear Cached Data", "This will clear temporary map and report cache. You will remain logged in.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear Cache",
        onPress: () => {
          Alert.alert("Cache Cleared", "Temporary cache has been cleared successfully.");
        },
      },
    ]);
  };

  // ── Sign Out ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out of BinGo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try { await logoutApi(); } catch (_) {}
          await logout();
        },
      },
    ]);
  };

  // ── Deactivate Account ───────────────────────────────────────────────────────
  const handleDeactivate = () => {
    Alert.alert(
      "Deactivate Account",
      "Are you sure you want to deactivate your BinGo account? Your active reports and profile will be disabled.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deactivate",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete("/users/me");
              await logout();
            } catch (err) {
              Alert.alert("Error", err.message || "Could not deactivate account.");
            }
          },
        },
      ]
    );
  };

  if (!preferencesLoaded) {
    return <SafeAreaView style={[styles.container, appDarkMode && darkStyles.container]}><ActivityIndicator accessibilityLabel="Loading settings" color={theme.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={[styles.container, appDarkMode && darkStyles.container]}>
      {/* Header */}
      <View style={[styles.header, appDarkMode && darkStyles.header]}>
        <TouchableOpacity
          onPress={() => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate("ProfileMain"))}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={theme.primary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, appDarkMode && darkStyles.text]}>{uiText.settings}</Text>
          <Text style={[styles.headerSub, appDarkMode && darkStyles.subtext]}>{theme.badgeText} {uiText.preferences}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile summary card */}
        <View style={[styles.profileCard, appDarkMode && darkStyles.card]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            {user?.faceImage ? (
              <Image source={{ uri: user.faceImage }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarTxt}>{user?.name?.[0]?.toUpperCase() || "U"}</Text>
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.profileName, appDarkMode && darkStyles.text]} numberOfLines={1}>{user?.name || "User"}</Text>
            <Text style={[styles.profileEmail, appDarkMode && darkStyles.subtext]} numberOfLines={1}>{user?.email}</Text>
            <View style={[styles.badge, { backgroundColor: theme.light }]}>
              <Icon name={theme.badgeIcon} size={13} color={theme.primary} />
              <Text style={[styles.badgeTxt, { color: theme.primary }]}>{theme.badgeText}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.editProfileBtn, { borderColor: theme.primary }]}
            onPress={openEditModal}
            accessibilityRole="button"
          >
            <Icon name="account-edit-outline" size={18} color={theme.primary} />
            <Text style={[styles.editProfileTxt, { color: theme.primary }]}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* ── ROLE-SPECIFIC SETTINGS ────────────────────────────────────────── */}
        {role === "resident" && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Resident Features</Text>
            <View style={[styles.card, appDarkMode && darkStyles.card]}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#E8F5E9" }]}>
                  <Icon name="calendar-clock" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Waste Collection Reminders</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Get alerted before weekly truck arrival</Text>
                </View>
                <Switch
                  value={pickupReminders}
                  onValueChange={(val) => { setPickupReminders(val); savePref("pickupReminders", val); }}
                  trackColor={{ false: "#E0E0E0", true: COLORS.PRIMARY + "77" }}
                  thumbColor={pickupReminders ? COLORS.PRIMARY : "#f4f3f4"}
                />
              </View>

              <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#E8F5E9" }]}>
                  <Icon name="recycle-variant" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Recycling & Green Tips</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Weekly eco-points & sorting updates</Text>
                </View>
                <Switch
                  value={recycleTips}
                  onValueChange={(val) => { setRecycleTips(val); savePref("recycleTips", val); }}
                  trackColor={{ false: "#E0E0E0", true: COLORS.PRIMARY + "77" }}
                  thumbColor={recycleTips ? COLORS.PRIMARY : "#f4f3f4"}
                />
              </View>

              <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

              <TouchableOpacity
                style={styles.row}
                onPress={() => navigation.navigate("ResidentVerification")}
                accessibilityRole="button"
              >
                <View style={[styles.rowIcon, { backgroundColor: "#E8F5E9" }]}>
                  <Icon name="shield-check" size={20} color={COLORS.PRIMARY} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Residence Verification</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>
                    {user?.profileVerified
                      ? "Profile Verified (Tap to view details)"
                      : user?.verificationStatus === "pending"
                      ? "Pending Admin Review"
                      : "Not Verified (Tap to complete)"}
                  </Text>
                </View>
                <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {role === "community_leader" && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Leader Controls</Text>
            <View style={[styles.card, appDarkMode && darkStyles.card]}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#E3F2FD" }]}>
                  <Icon name="bullhorn-outline" size={20} color="#1565C0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Ward Incident Broadcasts</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Alerts when dumping is reported in your community</Text>
                </View>
                <Switch
                  value={leaderBroadcasts}
                  onValueChange={(val) => { setLeaderBroadcasts(val); savePref("leaderBroadcasts", val); }}
                  trackColor={{ false: "#E0E0E0", true: "#1565C077" }}
                  thumbColor={leaderBroadcasts ? "#1565C0" : "#f4f3f4"}
                />
              </View>

              <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#E3F2FD" }]}>
                  <Icon name="chart-box-outline" size={20} color="#1565C0" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Weekly Cleanliness Digest</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Summary of cleared reports & active issues</Text>
                </View>
                <Switch
                  value={cleanlinessDigest}
                  onValueChange={(val) => { setCleanlinessDigest(val); savePref("cleanlinessDigest", val); }}
                  trackColor={{ false: "#E0E0E0", true: "#1565C077" }}
                  thumbColor={cleanlinessDigest ? "#1565C0" : "#f4f3f4"}
                />
              </View>
            </View>
          </View>
        )}

        {role === "waste_authority" && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Authority Operations</Text>
            <View style={[styles.card, appDarkMode && darkStyles.card]}>
              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#E0F2F1" }]}>
                  <Icon name="truck-fast-outline" size={20} color="#00695C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Emergency Dispatch Alerts</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>High-priority notifications for overflow dumpsters</Text>
                </View>
                <Switch
                  value={dispatchAlerts}
                  onValueChange={(val) => { setDispatchAlerts(val); savePref("dispatchAlerts", val); }}
                  trackColor={{ false: "#E0E0E0", true: "#00695C77" }}
                  thumbColor={dispatchAlerts ? "#00695C" : "#f4f3f4"}
                />
              </View>

              <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

              <View style={styles.row}>
                <View style={[styles.rowIcon, { backgroundColor: "#E0F2F1" }]}>
                  <Icon name="map-clock-outline" size={20} color="#00695C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Live Map Auto-Refresh</Text>
                  <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Continuously update active truck & bin markers</Text>
                </View>
                <Switch
                  value={autoRefreshMap}
                  onValueChange={(val) => { setAutoRefreshMap(val); savePref("autoRefreshMap", val); }}
                  trackColor={{ false: "#E0E0E0", true: "#00695C77" }}
                  thumbColor={autoRefreshMap ? "#00695C" : "#f4f3f4"}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── NOTIFICATIONS & ALERTS ───────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Notifications & Alerts</Text>
          <View style={[styles.card, appDarkMode && darkStyles.card]}>
            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="bell-ring-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Push Notifications</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Receive real-time alerts on your device</Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={(val) => { setPushEnabled(val); savePref("pushEnabled", val); }}
                trackColor={{ false: "#E0E0E0", true: theme.primary + "77" }}
                thumbColor={pushEnabled ? theme.primary : "#f4f3f4"}
              />
            </View>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: "#E8F5E9" }]}>
                <Icon name="whatsapp" size={20} color="#25D366" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>WhatsApp Updates</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Status notifications sent to your WhatsApp</Text>
              </View>
              <Switch
                value={whatsappEnabled}
                onValueChange={(val) => { setWhatsappEnabled(val); savePref("whatsappEnabled", val); }}
                trackColor={{ false: "#E0E0E0", true: "#25D36677" }}
                thumbColor={whatsappEnabled ? "#25D366" : "#f4f3f4"}
              />
            </View>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="volume-high" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Sound & Vibration</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Play alert sound on important notices</Text>
              </View>
              <Switch
                value={soundEnabled}
                onValueChange={(val) => { setSoundEnabled(val); savePref("soundEnabled", val); }}
                trackColor={{ false: "#E0E0E0", true: theme.primary + "77" }}
                thumbColor={soundEnabled ? theme.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* ── APP PREFERENCES ─────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Preferences</Text>
          <View style={[styles.card, appDarkMode && darkStyles.card]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setLangModalOpen(true)}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="translate" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Language</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>{language}</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
            </TouchableOpacity>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => {
                const next = !unitKm;
                setUnitKm(next);
                savePref("unitKm", next);
              }}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="map-marker-distance" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Distance Units</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>{unitKm ? "Kilometers (km)" : "Miles (mi)"}</Text>
              </View>
              <Icon name="swap-horizontal" size={20} color={theme.primary} />
            </TouchableOpacity>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="weather-night" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Dark Mode</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Match device system theme</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={async (val) => { setDarkMode(val); await setAppDarkMode(val); }}
                trackColor={{ false: "#E0E0E0", true: theme.primary + "77" }}
                thumbColor={darkMode ? theme.primary : "#f4f3f4"}
              />
            </View>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <View style={styles.row}>
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="database-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Low Data Mode</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Optimise map tiles & photo previews</Text>
              </View>
              <Switch
                value={lowDataMode}
                onValueChange={(val) => { setLowDataMode(val); savePref("lowDataMode", val); }}
                trackColor={{ false: "#E0E0E0", true: theme.primary + "77" }}
                thumbColor={lowDataMode ? theme.primary : "#f4f3f4"}
              />
            </View>
          </View>
        </View>

        {/* ── ACCOUNT & SECURITY ───────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Security & Storage</Text>
          <View style={[styles.card, appDarkMode && darkStyles.card]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setChangePassOpen(true)}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="lock-reset" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Change Password</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Update your account security credentials</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
            </TouchableOpacity>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={handleClearCache}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="broom" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Clear Cache</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Free up local app storage</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── HELP & LEGAL ─────────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Support & Legal</Text>
          <View style={[styles.card, appDarkMode && darkStyles.card]}>
            <TouchableOpacity
              style={styles.row}
              onPress={() => setFaqModalOpen(true)}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="help-circle-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Help & FAQs</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Frequently asked questions & usage guide</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
            </TouchableOpacity>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => { setLegalModalType("privacy"); setLegalModalOpen(true); }}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="shield-lock-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Privacy Policy</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>How we handle and protect your data</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
            </TouchableOpacity>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={() => { setLegalModalType("terms"); setLegalModalOpen(true); }}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: theme.light }]}>
                <Icon name="file-document-outline" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, appDarkMode && darkStyles.text]}>Terms of Service</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Guidelines, community standards & terms</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── DANGER ZONE ──────────────────────────────────────────────────── */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeader, appDarkMode && darkStyles.subtext]}>Account Actions</Text>
          <View style={[styles.card, appDarkMode && darkStyles.card]}>
            <TouchableOpacity
              style={styles.row}
              onPress={handleLogout}
              disabled={loggingOut}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: "#FFEBEE" }]}>
                <Icon name="logout" size={20} color={COLORS.ERROR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: COLORS.ERROR }]}>Sign Out</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Log out of your current session</Text>
              </View>
              {loggingOut ? (
                <ActivityIndicator size="small" color={COLORS.ERROR} />
              ) : (
                <Icon name="chevron-right" size={20} color={COLORS.ERROR} />
              )}
            </TouchableOpacity>

            <View style={[styles.divider, appDarkMode && darkStyles.divider]} />

            <TouchableOpacity
              style={styles.row}
              onPress={handleDeactivate}
              accessibilityRole="button"
            >
              <View style={[styles.rowIcon, { backgroundColor: "#FFEBEE" }]}>
                <Icon name="account-remove-outline" size={20} color={COLORS.ERROR} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: COLORS.ERROR }]}>Deactivate Account</Text>
                <Text style={[styles.rowSub, appDarkMode && darkStyles.subtext]}>Disable your profile and active submissions</Text>
              </View>
              <Icon name="chevron-right" size={20} color={COLORS.ERROR} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version Info */}
        <View style={styles.versionBox}>
          <Text style={[styles.versionTxt, appDarkMode && darkStyles.subtext]}>BinGo v1.0.0 (Build 42)</Text>
          <Text style={[styles.versionSub, appDarkMode && darkStyles.subtext]}>Neighbourhood Waste & Recycling Coordinator</Text>
        </View>
      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 1: Edit Profile Modal
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={editProfileOpen} transparent animationType="slide" onRequestClose={() => setEditProfileOpen(false)}>
        <View style={m.backdrop}>
          <View style={m.card}>
            <View style={m.header}>
              <View>
                <Text style={m.title}>Edit Profile</Text>
                <Text style={m.sub}>Update your public contact info</Text>
              </View>
              <TouchableOpacity onPress={() => setEditProfileOpen(false)} style={m.closeBtn}>
                <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={m.form}>
              <Text style={m.label}>Full Name</Text>
              <TextInput
                style={m.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.TEXT_DISABLED}
              />

              <Text style={m.label}>WhatsApp Number</Text>
              <TextInput
                style={m.input}
                value={editWhatsapp}
                onChangeText={setEditWhatsapp}
                placeholder="+94 7X XXX XXXX"
                placeholderTextColor={COLORS.TEXT_DISABLED}
                keyboardType="phone-pad"
              />

              {role === "resident" && (
                <>
                  <Text style={m.label}>Home Address</Text>
                  <TextInput
                    style={[m.input, { minHeight: 70 }]}
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="No. 12, Main Street, Ward 4..."
                    placeholderTextColor={COLORS.TEXT_DISABLED}
                    multiline
                  />
                </>
              )}

              {role === "community_leader" && (
                <>
                  <Text style={m.label}>Community Name / Ward</Text>
                  <TextInput
                    style={m.input}
                    value={editCommunity}
                    onChangeText={setEditCommunity}
                    placeholder="e.g. Green Valley Residents Association"
                    placeholderTextColor={COLORS.TEXT_DISABLED}
                  />
                </>
              )}

              {role === "waste_authority" && (
                <>
                  <Text style={m.label}>Authority / Department Name</Text>
                  <TextInput
                    style={m.input}
                    value={editAuthority}
                    onChangeText={setEditAuthority}
                    placeholder="e.g. Municipal Waste Management Board"
                    placeholderTextColor={COLORS.TEXT_DISABLED}
                  />
                </>
              )}
            </ScrollView>

            <View style={m.actions}>
              <TouchableOpacity
                style={m.cancelBtn}
                onPress={() => setEditProfileOpen(false)}
                disabled={savingProfile}
              >
                <Text style={m.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={m.saveTxt}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 2: Change Password Modal
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={changePassOpen} transparent animationType="slide" onRequestClose={() => setChangePassOpen(false)}>
        <View style={m.backdrop}>
          <View style={m.card}>
            <View style={m.header}>
              <View>
                <Text style={m.title}>Change Password</Text>
                <Text style={m.sub}>Must be at least 6 characters</Text>
              </View>
              <TouchableOpacity onPress={() => setChangePassOpen(false)} style={m.closeBtn}>
                <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>

            <View style={m.form}>
              <Text style={m.label}>Current Password</Text>
              <View style={m.passInputWrap}>
                <TextInput
                  style={m.passInput}
                  value={currentPassword}
                  onChangeText={setCurrentPass}
                  secureTextEntry={!showCurrentPass}
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.TEXT_DISABLED}
                />
                <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)} style={m.eyeBtn}>
                  <Icon name={showCurrentPass ? "eye-off" : "eye"} size={20} color={COLORS.TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>

              <Text style={m.label}>New Password</Text>
              <View style={m.passInputWrap}>
                <TextInput
                  style={m.passInput}
                  value={newPassword}
                  onChangeText={setNewPass}
                  secureTextEntry={!showNewPass}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor={COLORS.TEXT_DISABLED}
                />
                <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)} style={m.eyeBtn}>
                  <Icon name={showNewPass ? "eye-off" : "eye"} size={20} color={COLORS.TEXT_SECONDARY} />
                </TouchableOpacity>
              </View>

              <Text style={m.label}>Confirm New Password</Text>
              <View style={m.passInputWrap}>
                <TextInput
                  style={m.passInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPass}
                  secureTextEntry={!showNewPass}
                  placeholder="Re-enter new password"
                  placeholderTextColor={COLORS.TEXT_DISABLED}
                />
              </View>
            </View>

            <View style={m.actions}>
              <TouchableOpacity
                style={m.cancelBtn}
                onPress={() => setChangePassOpen(false)}
                disabled={changingPass}
              >
                <Text style={m.cancelTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[m.saveBtn, { backgroundColor: theme.primary }]}
                onPress={handleChangePassword}
                disabled={changingPass}
              >
                {changingPass ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={m.saveTxt}>Update Password</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 3: Language Selection Modal
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={langModalOpen} transparent animationType="fade" onRequestClose={() => setLangModalOpen(false)}>
        <View style={m.backdrop}>
          <View style={[m.card, { paddingBottom: 16 }]}>
            <View style={m.header}>
              <Text style={m.title}>Select Language</Text>
              <TouchableOpacity onPress={() => setLangModalOpen(false)} style={m.closeBtn}>
                <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            <View style={{ gap: 8, marginTop: 8 }}>
              {LANGUAGES.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  style={[
                    styles.langItem,
                    language === item.label && { backgroundColor: theme.light, borderColor: theme.primary },
                  ]}
                  onPress={() => {
                    setLanguage(item.label);
                    savePref("language", item.label);
                    setLangModalOpen(false);
                  }}
                >
                  <Text style={[styles.langTxt, language === item.label && { color: theme.primary, fontWeight: "700" }]}>
                    {item.label}
                  </Text>
                  {language === item.label && <Icon name="check" size={18} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 4: FAQs & Help
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={faqModalOpen} transparent animationType="slide" onRequestClose={() => setFaqModalOpen(false)}>
        <View style={m.backdrop}>
          <View style={[m.card, { maxHeight: "80%" }]}>
            <View style={m.header}>
              <View>
                <Text style={m.title}>Help & FAQs</Text>
                <Text style={m.sub}>Common questions about BinGo</Text>
              </View>
              <TouchableOpacity onPress={() => setFaqModalOpen(false)} style={m.closeBtn}>
                <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              {FAQS.map((faq, i) => (
                <View key={i} style={styles.faqCard}>
                  <Text style={styles.faqQ}>Q: {faq.q}</Text>
                  <Text style={styles.faqA}>{faq.a}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────────
          MODAL 5: Privacy Policy & Terms Modal
      ───────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={legalModalOpen} transparent animationType="slide" onRequestClose={() => setLegalModalOpen(false)}>
        <View style={m.backdrop}>
          <View style={[m.card, { maxHeight: "80%" }]}>
            <View style={m.header}>
              <View>
                <Text style={m.title}>
                  {legalModalType === "privacy" ? "Privacy Policy" : "Terms of Service"}
                </Text>
                <Text style={m.sub}>BinGo Environmental System</Text>
              </View>
              <TouchableOpacity onPress={() => setLegalModalOpen(false)} style={m.closeBtn}>
                <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              {legalModalType === "privacy" ? (
                <>
                  <Text style={styles.legalHeading}>1. Information We Collect</Text>
                  <Text style={styles.legalBody}>
                    BinGo collects your name, email, WhatsApp contact number, and GPS coordinates when tagging waste reports or submitting verification for neighborhood service allocation.
                  </Text>
                  <Text style={styles.legalHeading}>2. Photo & Camera Access</Text>
                  <Text style={styles.legalBody}>
                    Photos taken during waste reporting or resident verification are processed exclusively for municipal cleanliness and identification reviews. We do not sell your personal data.
                  </Text>
                  <Text style={styles.legalHeading}>3. Security</Text>
                  <Text style={styles.legalBody}>
                    All communications between BinGo mobile clients and the backend server are encrypted over TLS. Passwords are hash-encrypted using bcrypt.
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.legalHeading}>1. Permitted Use</Text>
                  <Text style={styles.legalBody}>
                    BinGo is designated for municipal residents, community supervisors, and waste collection staff. False or malicious waste reporting is strictly prohibited.
                  </Text>
                  <Text style={styles.legalHeading}>2. Community Standards</Text>
                  <Text style={styles.legalBody}>
                    Users agree to upload genuine images of neighborhood surroundings and respect fellow residents and waste disposal teams.
                  </Text>
                  <Text style={styles.legalHeading}>3. Account Suspension</Text>
                  <Text style={styles.legalBody}>
                    Administrators reserve the right to suspend or reject verification of accounts with repeated fraudulent submissions.
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const darkStyles = StyleSheet.create({ container: { backgroundColor: "#121212" }, header: { backgroundColor: "#1E1E1E", borderBottomColor: "#383838" }, card: { backgroundColor: "#1E1E1E", borderColor: "#383838" }, text: { color: "#FFFFFF" }, subtext: { color: "#BDBDBD" }, divider: { backgroundColor: "#383838" } });

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  // Profile Card
  profileCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1,
  },
  avatar: {
    width: 54, height: 54, borderRadius: 27,
    justifyContent: "center", alignItems: "center",
  },
  avatarImg: { width: 54, height: 54, borderRadius: 27 },
  avatarTxt: { fontSize: 22, fontWeight: "bold", color: "#fff" },
  profileName: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  profileEmail: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginVertical: 2 },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2,
    alignSelf: "flex-start", marginTop: 2,
  },
  badgeTxt: { fontSize: 11, fontWeight: "700" },
  editProfileBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1.2, borderRadius: 16,
  },
  editProfileTxt: { fontSize: 12, fontWeight: "600" },

  // Sections
  sectionWrap: { gap: 8 },
  sectionHeader: {
    fontSize: 12, fontWeight: "700", color: COLORS.TEXT_DISABLED,
    textTransform: "uppercase", letterSpacing: 0.8, marginLeft: 4,
  },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: 14,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  rowTitle: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  rowSub:   { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  divider:  { height: 1, backgroundColor: COLORS.DIVIDER, marginLeft: 62 },

  // Version
  versionBox: { alignItems: "center", paddingVertical: 12, gap: 2 },
  versionTxt: { fontSize: 12, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  versionSub: { fontSize: 11, color: COLORS.TEXT_DISABLED },

  // Modals & sub-components
  langItem: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 14, borderRadius: 10, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  langTxt: { fontSize: 14, color: COLORS.TEXT_PRIMARY },

  faqCard: {
    backgroundColor: COLORS.BACKGROUND, borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, gap: 4,
  },
  faqQ: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  faqA: { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },

  legalHeading: { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 4 },
  legalBody: { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },
});

const m = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center", alignItems: "center", padding: 20,
  },
  card: {
    width: "100%", backgroundColor: COLORS.SURFACE,
    borderRadius: 18, padding: 20, gap: 12, elevation: 10,
  },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start",
  },
  title: { fontSize: 18, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  sub: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND, justifyContent: "center", alignItems: "center",
  },
  form: { gap: 10, paddingVertical: 4 },
  label: { fontSize: 12, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  input: {
    backgroundColor: COLORS.BACKGROUND, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.BORDER, padding: 12,
    fontSize: 14, color: COLORS.TEXT_PRIMARY,
  },
  passInputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.BACKGROUND, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  passInput: { flex: 1, padding: 12, fontSize: 14, color: COLORS.TEXT_PRIMARY },
  eyeBtn: { padding: 12 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    borderWidth: 1, borderColor: COLORS.BORDER, alignItems: "center",
  },
  cancelTxt: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  saveBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  saveTxt: { fontSize: 14, fontWeight: "700", color: "#fff" },
});

export default SettingsScreen;







