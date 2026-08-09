/**
 * BinGo – Payment Screen
 * TODO (Member 1 – Sprint 2+): Implement payment gateway integration.
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const PaymentScreen = () => (
  <SafeAreaView style={styles.container}>
    <View style={styles.content}>
      <Text style={styles.emoji}>💳</Text>
      <Text style={styles.title}>Payments</Text>
      <Text style={styles.description}>
        Payment gateway integration is planned for a future sprint.{"\n"}
        This feature is owned by Member 1.
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

export default PaymentScreen;
