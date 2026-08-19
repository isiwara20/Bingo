/**
 * BinGo – Splash Screen
 * Shown briefly on app launch before auth check completes.
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import COLORS from "../constants/colors";

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🗑️</Text>
      <Text style={styles.title}>BinGo</Text>
      <Text style={styles.subtitle}>Neighbourhood Waste & Recycling</Text>
      <ActivityIndicator
        size="large"
        color={COLORS.PRIMARY_LIGHT}
        style={styles.spinner}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.HEADER_BG,   // deep dark green
  },
  logo: { fontSize: 64, marginBottom: 16 },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.TEXT_INVERSE,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.PRIMARY_TINT,
    marginTop: 8,
    marginBottom: 48,
    letterSpacing: 1,
  },
  spinner: { marginTop: 24 },
});

export default SplashScreen;
