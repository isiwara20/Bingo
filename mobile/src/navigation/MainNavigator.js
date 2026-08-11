/**
 * BinGo – Main Navigator
 *
 * Bottom tab navigation for authenticated users.
 * Nested stack navigators handle in-flow navigation per tab.
 *
 * Tabs:
 *   Home → Report → Map → Schedule → Profile
 *
 * TODO: Replace placeholder icons with react-native-vector-icons
 * TODO: Add role-based tab visibility (admin tabs, authority tabs)
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Text } from "react-native";

import COLORS from "../constants/colors";

// Screens
import HomeScreen from "../screens/HomeScreen";
import ReportWasteScreen from "../screens/ReportWasteScreen";
import ReportReviewScreen from "../screens/ReportReviewScreen";
import ReportDetailsScreen from "../screens/ReportDetailsScreen";
import ReportStatusScreen from "../screens/ReportStatusScreen";
import WasteMapScreen from "../screens/WasteMapScreen";
import CollectionScheduleScreen from "../screens/CollectionScheduleScreen";
import RecyclingGuideScreen from "../screens/RecyclingGuideScreen";
import CommunityScreen from "../screens/CommunityScreen";
import NotificationsScreen from "../screens/NotificationsScreen";
import RewardsScreen from "../screens/RewardsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import PaymentScreen from "../screens/PaymentScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Tab icon helper (placeholder) ─────────────────────────────────────────
// TODO: Replace with react-native-vector-icons
const TabIcon = ({ label, focused }) => (
  <Text style={{ fontSize: 10, color: focused ? COLORS.PRIMARY : COLORS.TEXT_SECONDARY }}>
    {label}
  </Text>
);

// ── Home Stack ─────────────────────────────────────────────────────────────
const HomeStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="HomeMain" component={HomeScreen} />
    <Stack.Screen name="Notifications" component={NotificationsScreen} />
    <Stack.Screen name="Rewards" component={RewardsScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// ── Report Stack ───────────────────────────────────────────────────────────
const ReportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportWaste" component={ReportWasteScreen} />
    <Stack.Screen name="ReportReview" component={ReportReviewScreen} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
    <Stack.Screen name="ReportStatus" component={ReportStatusScreen} />
  </Stack.Navigator>
);

// ── Map Stack ──────────────────────────────────────────────────────────────
const MapStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WasteMap" component={WasteMapScreen} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
  </Stack.Navigator>
);

// ── Profile Stack ──────────────────────────────────────────────────────────
const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileMain" component={ProfileScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

// ── Main Tab Navigator ─────────────────────────────────────────────────────
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: COLORS.SURFACE,
          borderTopColor: COLORS.BORDER,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
        },
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeStack} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Report" component={ReportStack} options={{ tabBarLabel: "Report" }} />
      <Tab.Screen name="Map" component={MapStack} options={{ tabBarLabel: "Map" }} />
      <Tab.Screen name="Schedule" component={CollectionScheduleScreen} options={{ tabBarLabel: "Schedule" }} />
      <Tab.Screen name="Community" component={CommunityScreen} options={{ tabBarLabel: "Community" }} />
      <Tab.Screen name="Recycling" component={RecyclingGuideScreen} options={{ tabBarLabel: "Recycle" }} />
      <Tab.Screen name="Profile" component={ProfileStack} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;
