/**
 * BinGo – Settings Screen
 * TODO (Member 1 – Sprint 2): Implement app settings.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const SettingsScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>⚙️</Text>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.description}>
        App settings are coming in Sprint 2.
      </Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  description: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
});

export default SettingsScreen;
