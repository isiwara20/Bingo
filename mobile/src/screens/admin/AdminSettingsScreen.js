/**
 * BinGo Admin – Settings Screen
 * App info and admin logout.
 */

import React, { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { logout as logoutApi } from "../../services/authService";
import COLORS from "../../constants/colors";

const SettingRow = ({ emoji, label, value, onPress, danger }) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    disabled={!onPress}
    accessibilityRole={onPress ? "button" : "text"}
  >
    <Text style={styles.rowEmoji}>{emoji}</Text>
    <View style={styles.rowContent}>
      <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
    {onPress && <Text style={styles.arrow}>›</Text>}
  </TouchableOpacity>
);

const AdminSettingsScreen = () => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out", style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try { await logoutApi(); } catch (_) {}
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Settings</Text>

        {/* Admin profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || "A"}</Text>
          </View>
          <View>
            <Text style={styles.profileName}>{user?.name}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>Administrator</Text>
            </View>
          </View>
        </View>

        {/* App info */}
        <Text style={styles.sectionLabel}>App Information</Text>
        <View style={styles.section}>
          <SettingRow emoji="📱" label="App Name"    value="BinGo" />
          <SettingRow emoji="🔖" label="Version"     value="1.0.0" />
          <SettingRow emoji="🌍" label="Environment" value={__DEV__ ? "Development" : "Production"} />
        </View>

        {/* Account */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.section}>
          <SettingRow emoji="✉️"  label="Email" value={user?.email} />
          <SettingRow emoji="🔐" label="Role"   value="Admin" />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          {loggingOut
            ? <ActivityIndicator color={COLORS.ERROR} />
            : <Text style={styles.logoutText}>Log Out</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  profileCard: {
    flexDirection: "row", gap: 14, alignItems: "center",
    backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.PRIMARY, justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  profileName: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  profileEmail: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  adminBadge: { backgroundColor: "#EDE9FE", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  adminBadgeText: { fontSize: 11, fontWeight: "700", color: "#7C3AED" },
  sectionLabel: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_DISABLED, textTransform: "uppercase", letterSpacing: 0.8, marginTop: 4 },
  section: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  row: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER, gap: 12 },
  rowEmoji: { fontSize: 20, width: 28 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  rowValue: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  danger: { color: COLORS.ERROR },
  arrow: { fontSize: 20, color: COLORS.TEXT_DISABLED },
  logoutButton: {
    borderWidth: 1.5, borderColor: COLORS.ERROR, borderRadius: 12,
    paddingVertical: 14, alignItems: "center", marginTop: 8,
  },
  logoutText: { color: COLORS.ERROR, fontSize: 16, fontWeight: "600" },
});

export default AdminSettingsScreen;
