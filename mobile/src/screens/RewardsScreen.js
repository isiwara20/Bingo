/**
 * BinGo – Rewards Screen
 * TODO (Member 4 – Sprint 2): Implement full gamification and rewards.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import COLORS from "../constants/colors";

const RewardsScreen = () => {
  const { user } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>⭐</Text>
        <Text style={styles.title}>Rewards</Text>
        <Text style={styles.points}>{user?.rewardPoints || 0} Points</Text>
        <Text style={styles.description}>
          Full rewards and gamification are coming in Sprint 2.{"\n"}
          This feature is owned by Member 4.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  points: { fontSize: 32, fontWeight: "bold", color: COLORS.SECONDARY, marginBottom: 16 },
  description: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 22 },
});

export default RewardsScreen;
