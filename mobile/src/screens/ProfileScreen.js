/**
 * BinGo – Profile Screen
 * TODO (Member 1): Implement profile editing, password change in Sprint 2.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { logout } from "../services/authService";
import COLORS from "../constants/colors";

const ProfileScreen = ({ navigation }) => {
  const { user, logout: clearAuth } = useAuth();

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch {
            // Ignore backend errors on logout
          } finally {
            await clearAuth();
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || "User"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role?.replace("_", " ")}</Text>
        </View>
        <Text style={styles.points}>⭐ {user?.rewardPoints || 0} reward points</Text>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("Settings")}
            accessibilityRole="button"
          >
            <Text style={styles.menuItemText}>⚙️  Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.logoutItem]}
            onPress={handleLogout}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>🚪  Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { flex: 1, alignItems: "center", padding: 24, paddingTop: 48 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: COLORS.PRIMARY, justifyContent: "center", alignItems: "center",
    marginBottom: 16,
  },
  avatarText: { fontSize: 32, fontWeight: "bold", color: COLORS.TEXT_INVERSE },
  name: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  email: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 12 },
  roleBadge: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, marginBottom: 8,
  },
  roleText: { color: COLORS.TEXT_INVERSE, fontSize: 12, fontWeight: "600", textTransform: "capitalize" },
  points: { fontSize: 14, color: COLORS.TEXT_SECONDARY, marginBottom: 32 },
  actions: { width: "100%", gap: 10 },
  menuItem: {
    backgroundColor: COLORS.SURFACE,
    padding: 16, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  menuItemText: { fontSize: 15, color: COLORS.TEXT_PRIMARY },
  logoutItem: { borderColor: COLORS.ERROR },
  logoutText: { fontSize: 15, color: COLORS.ERROR },
});

export default ProfileScreen;
