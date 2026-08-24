/**
 * BinGo – Admin Navigator
 * Bottom tab navigation shown only when the logged-in user has role "admin".
 * Tabs: Dashboard | Users | Reports | SMS Config | Settings
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import COLORS from "../constants/colors";

import AdminDashboardScreen from "../screens/admin/AdminDashboardScreen";
import AdminUsersScreen     from "../screens/admin/AdminUsersScreen";
import AdminReportsScreen   from "../screens/admin/AdminReportsScreen";
import AdminSmsConfigScreen from "../screens/admin/AdminSmsConfigScreen";
import AdminSettingsScreen  from "../screens/admin/AdminSettingsScreen";

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard:  { active: "📊", inactive: "📊" },
  Users:      { active: "👥", inactive: "👥" },
  Reports:    { active: "📋", inactive: "📋" },
  "SMS Config": { active: "💬", inactive: "💬" },
  Settings:   { active: "⚙️", inactive: "⚙️" },
};

const AdminNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: COLORS.PRIMARY,
      tabBarInactiveTintColor: COLORS.TEXT_SECONDARY,
      tabBarStyle: {
        backgroundColor: COLORS.SURFACE,
        borderTopColor: COLORS.BORDER,
        height: 62,
        paddingBottom: 8,
        paddingTop: 4,
      },
      tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
      tabBarIcon: ({ focused }) => (
        <Text style={{ fontSize: 20 }}>
          {focused ? ICONS[route.name]?.active : ICONS[route.name]?.inactive}
        </Text>
      ),
    })}
  >
    <Tab.Screen name="Dashboard"  component={AdminDashboardScreen} />
    <Tab.Screen name="Users"      component={AdminUsersScreen} />
    <Tab.Screen name="Reports"    component={AdminReportsScreen} />
    <Tab.Screen name="SMS Config" component={AdminSmsConfigScreen} />
    <Tab.Screen name="Settings"   component={AdminSettingsScreen} />
  </Tab.Navigator>
);

export default AdminNavigator;
