/**
 * BinGo – Admin Navigator
 *
 * Bottom tab navigation for admin role.
 * Tabs: Dashboard | Users | Reports | SMS Config | Settings
 *
 * Uses MaterialCommunityIcons for all tab icons.
 * useSafeAreaInsets ensures the tab bar clears the phone's
 * gesture bar / navigation buttons on all Android devices.
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../constants/colors";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminUsersScreen     from "../screens/admin/AdminUsersScreen";
import AdminReportsScreen   from "../screens/admin/AdminReportsScreen";
import AdminSmsConfigScreen from "../screens/admin/AdminSmsConfigScreen";
import AdminSettingsScreen  from "../screens/admin/AdminSettingsScreen";

const Tab = createBottomTabNavigator();

// icon name per tab (MaterialCommunityIcons)
const TAB_ICONS = {
  Dashboard:    { active: "view-dashboard",       inactive: "view-dashboard-outline" },
  Users:        { active: "account-group",         inactive: "account-group-outline" },
  Reports:      { active: "clipboard-list",        inactive: "clipboard-list-outline" },
  "SMS Config": { active: "message-cog",           inactive: "message-cog-outline" },
  Settings:     { active: "cog",                   inactive: "cog-outline" },
};

const AdminNavigator = () => {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.PRIMARY,
        tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: COLORS.SURFACE,
          borderTopColor:  COLORS.BORDER,
          borderTopWidth:  1,
          // Add insets.bottom so bar sits above phone nav buttons
          height: 56 + insets.bottom,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
          marginBottom: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = focused
            ? TAB_ICONS[route.name]?.active
            : TAB_ICONS[route.name]?.inactive;
          return <Icon name={iconName || "circle"} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard"  component={AdminDashboardScreen} />
      <Tab.Screen name="Users"      component={AdminUsersScreen} />
      <Tab.Screen name="Reports"    component={AdminReportsScreen} />
      <Tab.Screen name="SMS Config" component={AdminSmsConfigScreen} />
      <Tab.Screen name="Settings"   component={AdminSettingsScreen} />
    </Tab.Navigator>
  );
};

export default AdminNavigator;
