/**
 * BinGo – Splash Screen
 * Shown briefly on app launch before auth check completes.
 */

import React from "react";
import { View, StyleSheet, ActivityIndicator, Image } from "react-native";
import COLORS from "../constants/colors";

const SplashScreen = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="BinGo logo"
      />
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
    backgroundColor: COLORS.SURFACE,
  },
  logo: {
    width: 260,
    height: 100,
  },
  spinner: { marginTop: 48 },
});

export default SplashScreen;
