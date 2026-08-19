/**
 * BinGo – Onboarding Screen
 *
 * Shown to first-time users before login.
 * TODO: Implement multi-step onboarding with Figma designs.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const OnboardingScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🌍</Text>
        <Text style={styles.title}>Welcome to BinGo</Text>
        <Text style={styles.description}>
          Help keep your neighbourhood clean.{"\n"}
          Report illegal dumping, find recycling centres,{"\n"}
          and stay informed about collection schedules.
        </Text>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate("Register")}
          accessibilityRole="button"
          accessibilityLabel="Create a new BinGo account"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate("Login")}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
        >
          <Text style={styles.secondaryButtonText}>I already have an account</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: {
    flex: 1, justifyContent: "center",
    alignItems: "center", paddingHorizontal: 32,
  },
  emoji: { fontSize: 80, marginBottom: 24 },
  title: {
    fontSize: 28, fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY, marginBottom: 16, textAlign: "center",
  },
  description: {
    fontSize: 16, color: COLORS.TEXT_SECONDARY,
    textAlign: "center", lineHeight: 24,
  },
  actions: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
  primaryButton: {
    backgroundColor: COLORS.PRIMARY,         // dark green
    paddingVertical: 16, borderRadius: 12, alignItems: "center",
  },
  primaryButtonText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },
  secondaryButton: {
    backgroundColor: COLORS.TRANSPARENT,
    paddingVertical: 16, borderRadius: 12,
    alignItems: "center", borderWidth: 1.5, borderColor: COLORS.PRIMARY,
  },
  secondaryButtonText: { color: COLORS.PRIMARY, fontSize: 16, fontWeight: "600" },
});

export default OnboardingScreen;
