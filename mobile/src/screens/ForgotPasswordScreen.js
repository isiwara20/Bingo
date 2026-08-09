/**
 * BinGo – Forgot Password Screen
 * TODO (Member 1): Implement password reset via email in Sprint 2.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";

const ForgotPasswordScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.content}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.description}>
          Password reset functionality will be available in Sprint 2.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND, padding: 24 },
  back: { marginBottom: 24 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 16 },
  description: { fontSize: 15, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
});

export default ForgotPasswordScreen;
