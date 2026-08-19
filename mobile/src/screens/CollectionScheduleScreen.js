/**
 * BinGo – Collection Schedule Screen
 * TODO (Member 3 – Sprint 2): Implement schedule fetching and display.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const CollectionScheduleScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>📅</Text>
      <Text style={styles.title}>Collection Schedule</Text>
      <Text style={styles.description}>
        Waste collection schedules are coming in Sprint 2.{"\n"}
        This feature is owned by Member 3.
      </Text>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  description: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 22 },
});

export default CollectionScheduleScreen;