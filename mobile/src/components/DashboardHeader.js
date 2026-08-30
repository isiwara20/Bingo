/**
 * BinGo – Shared Dashboard Header
 *
 * Sticky header used by all role dashboards.
 * Sits OUTSIDE ScrollView so it never moves when scrolling.
 *
 * Uses MaterialCommunityIcons (SVG-rendered via react-native-vector-icons).
 *
 * Props:
 *   title       {string}   – main heading
 *   subtitle    {string}   – role / community label below title
 *   accentColor {string}   – header background colour
 *   onNotif     {function} – bell icon press (optional, hides bell if omitted)
 *   onLogout    {function} – called after user confirms sign-out
 */

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../constants/colors";

const DashboardHeader = ({
  title,
  subtitle,
  accentColor = COLORS.PRIMARY,
  onNotif,
  onLogout,
}) => {
  const confirmLogout = () =>
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: onLogout },
    ]);

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.safe, { backgroundColor: accentColor }]}
    >
      <View style={styles.row}>
        {/* Titles */}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>

        {/* Action buttons */}
        <View style={styles.actions}>
          {onNotif && (
            <TouchableOpacity
              onPress={onNotif}
              style={styles.iconBtn}
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="bell-outline" size={22} color="#fff" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={confirmLogout}
            style={[styles.iconBtn, styles.logoutBtn]}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Icon name="logout" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { width: "100%" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  titleBlock: { flex: 1, marginRight: 12 },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.78)",
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  logoutBtn: {
    backgroundColor: "rgba(255,80,80,0.35)",
  },
});

export default DashboardHeader;
