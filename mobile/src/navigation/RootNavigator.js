/**
 * BinGo – Root Navigator
 *
 * Decides whether to show:
 *   - SplashScreen (initial load / auth check)
 *   - AuthNavigator (unauthenticated users)
 *   - MainNavigator (authenticated users)
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import SplashScreen from "../screens/SplashScreen";
import COLORS from "../constants/colors";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, isLoggedIn } = useAuth();

  // Show splash/loading while checking stored credentials
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.BACKGROUND,
  },
});

export default RootNavigator;
