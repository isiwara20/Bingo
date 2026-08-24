/**
 * BinGo – Root Navigator
 *
 * Routes authenticated users to the correct navigator based on role:
 *   admin           → AdminNavigator
 *   all others      → MainNavigator
 *
 * Unauthenticated → AuthNavigator
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth } from "../context/AuthContext";
import AuthNavigator  from "./AuthNavigator";
import MainNavigator  from "./MainNavigator";
import AdminNavigator from "./AdminNavigator";
import COLORS from "../constants/colors";

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const { isLoading, isLoggedIn, user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
      </View>
    );
  }

  const getHomeNavigator = () => {
    if (user?.role === "admin") return AdminNavigator;
    return MainNavigator;
  };

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="Main" component={getHomeNavigator()} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1, justifyContent: "center",
    alignItems: "center", backgroundColor: COLORS.BACKGROUND,
  },
});

export default RootNavigator;
