/**
 * BinGo – Root Navigator
 *
 * Routing logic:
 *   Not logged in              → AuthNavigator
 *   admin                      → AdminNavigator
 *   resident, no plan selected → PlanSelectionScreen (shown once)
 *   all others                 → MainNavigator
 */

import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuth }        from "../context/AuthContext";
import AuthNavigator      from "./AuthNavigator";
import MainNavigator      from "./MainNavigator";
import GoalsNavigator from "./GoalsNavigator";
import AdminNavigator     from "./AdminNavigator";
import PlanSelectionScreen from "../screens/PlanSelectionScreen";
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

  if (!isLoggedIn) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth" component={AuthNavigator} />
      </Stack.Navigator>
    );
  }

  // Admin
  if (user?.role === "admin") {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Admin" component={AdminNavigator} />
      </Stack.Navigator>
    );
  }

  // Resident who hasn't chosen a plan yet
  if (user?.role === "resident" && !user?.hasSelectedPlan) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="PlanSelection" component={PlanSelectionScreen} />
        <Stack.Screen name="Payment" component={require("../screens/PaymentScreen").default} />
      </Stack.Navigator>
    );
  }

  // All other authenticated users
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen name="EcoGoals" component={GoalsNavigator} />
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
