/**
 * BinGo – Main Navigator
 *
 * Bottom tab navigation matching the high-fidelity wireframe design:
 *   - White nav bar background
 *   - Dark green active tab icon + label
 *   - Grey inactive icons
 *   - Centre FAB (dark green circle with + / report icon) for quick reporting
 *
 * Tabs: Home | Map | [FAB] | Alerts | Profile
 */

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import COLORS from "../constants/colors";
import { useAuth } from "../context/AuthContext";

// ── Screens ───────────────────────────────────────────────────────────────
import HomeScreen                  from "../screens/HomeScreen";
import ReportWasteScreen           from "../screens/ReportWasteScreen";
import ReportReviewScreen          from "../screens/ReportReviewScreen";
import ReportDetailsScreen         from "../screens/ReportDetailsScreen";
import ReportStatusScreen          from "../screens/ReportStatusScreen";
import WasteMapScreen              from "../screens/WasteMapScreen";
import CollectionScheduleScreen    from "../screens/CollectionScheduleScreen";
import ScheduleManagementScreen    from "../screens/ScheduleManagementScreen";
import ScheduleFormScreen          from "../screens/ScheduleFormScreen";
import CollectionDashboardScreen   from "../screens/CollectionDashboardScreen";
import AlertManagementScreen       from "../screens/AlertManagementScreen";
import SetReminderScreen           from "../screens/SetReminderScreen";
import RecyclingGuideScreen        from "../screens/RecyclingGuideScreen";
import CommunityScreen             from "../screens/CommunityScreen";
import NotificationsScreen         from "../screens/NotificationsScreen";
import RewardsScreen               from "../screens/RewardsScreen";
import ProfileScreen               from "../screens/ProfileScreen";
import SettingsScreen              from "../screens/SettingsScreen";
import PaymentScreen               from "../screens/PaymentScreen";

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── SVG-free icon set using Unicode / emoji ───────────────────────────────
// Wireframe tabs: Home | Map | [FAB centre] | Alerts | Profile
const TAB_ICONS = {
  Home:    { active: "⌂",  inactive: "⌂"  },
  Map:     { active: "▦",  inactive: "▦"  },
  Alerts:  { active: "🔔", inactive: "🔔" },
  Profile: { active: "👤", inactive: "👤" },
};

// ── Tab icon component ────────────────────────────────────────────────────
const TabIcon = ({ name, focused }) => {
  const icons = {
    Home:    focused ? "🏠" : "🏠",
    Map:     focused ? "🗺" : "🗺",
    Alerts:  focused ? "🔔" : "🔔",
    Profile: focused ? "👤" : "👤",
  };
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.45 }}>
      {icons[name] || "●"}
    </Text>
  );
};

// ── Centre FAB – floating report button ───────────────────────────────────
const ReportFAB = ({ onPress }) => (
  <TouchableOpacity
    style={styles.fab}
    onPress={onPress}
    activeOpacity={0.85}
    accessibilityRole="button"
    accessibilityLabel="Report illegal dumping"
  >
    <Text style={styles.fabIcon}>＋</Text>
  </TouchableOpacity>
);

// ── Stack navigators ──────────────────────────────────────────────────────

const HomeStack = () => {
  const { user } = useAuth();
  const isAuthority = ["admin", "waste_authority"].includes(user?.role);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"      component={HomeScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Rewards"       component={RewardsScreen} />
      <Stack.Screen name="Payment"       component={PaymentScreen} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
      {/* Member 3 – Feature 1: role-based schedule screen */}
      <Stack.Screen name="Schedule"      component={isAuthority ? ScheduleManagementScreen : CollectionScheduleScreen} />
      <Stack.Screen name="ScheduleForm"  component={ScheduleFormScreen} />
      {/* Member 3 – Feature 2: set reminder (resident) / alert management (authority) */}
      <Stack.Screen name="SetReminder"   component={SetReminderScreen} />
      <Stack.Screen name="CollectionDashboard" component={isAuthority ? AlertManagementScreen : CollectionDashboardScreen} />
      <Stack.Screen name="Recycling"     component={RecyclingGuideScreen} />
    </Stack.Navigator>
  );
};

const ReportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportWaste"   component={ReportWasteScreen} />
    <Stack.Screen name="ReportReview"  component={ReportReviewScreen} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
    <Stack.Screen name="ReportStatus"  component={ReportStatusScreen} />
  </Stack.Navigator>
);

const MapStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WasteMap"      component={WasteMapScreen} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
  </Stack.Navigator>
);

const AlertsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AlertsMain"    component={NotificationsScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => {
  const { user } = useAuth();
  const isAuthority = ["admin", "waste_authority"].includes(user?.role);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain"   component={ProfileScreen} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
      <Stack.Screen name="Schedule"      component={isAuthority ? ScheduleManagementScreen : CollectionScheduleScreen} />
      <Stack.Screen name="ScheduleForm"  component={ScheduleFormScreen} />
      <Stack.Screen name="SetReminder"   component={SetReminderScreen} />
      <Stack.Screen name="CollectionDashboard" component={isAuthority ? AlertManagementScreen : CollectionDashboardScreen} />
      <Stack.Screen name="Recycling"     component={RecyclingGuideScreen} />
      <Stack.Screen name="Community"     component={CommunityScreen} />
      <Stack.Screen name="Rewards"       component={RewardsScreen} />
    </Stack.Navigator>
  );
};

// ── Main Tab Navigator ────────────────────────────────────────────────────
const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.NAV_ACTIVE,
        tabBarInactiveTintColor: COLORS.NAV_INACTIVE,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}
    >
      {/* Tab 1 – Home */}
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: "Home" }}
      />

      {/* Tab 2 – Map */}
      <Tab.Screen
        name="Map"
        component={MapStack}
        options={{ tabBarLabel: "Map" }}
      />

      {/* Tab 3 – Centre FAB (Report) – hidden label + custom button */}
      <Tab.Screen
        name="Report"
        component={ReportStack}
        options={{
          tabBarLabel: () => null,
          tabBarIcon: () => null,
          tabBarButton: (props) => (
            <ReportFAB onPress={props.onPress} />
          ),
        }}
      />

      {/* Tab 4 – Alerts */}
      <Tab.Screen
        name="Alerts"
        component={AlertsStack}
        options={{ tabBarLabel: "Alerts" }}
      />

      {/* Tab 5 – Profile */}
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ tabBarLabel: "Profile" }}
      />
    </Tab.Navigator>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Bottom nav bar
  tabBar: {
    backgroundColor: COLORS.NAV_BG,           // white
    borderTopWidth: 1,
    borderTopColor: COLORS.DIVIDER,
    height: Platform.OS === "android" ? 64 : 80,
    paddingBottom: Platform.OS === "android" ? 8 : 20,
    paddingTop: 6,
    // Subtle shadow matching wireframe
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },

  // Centre FAB
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.NAV_FAB,          // dark green
    justifyContent: "center",
    alignItems: "center",
    // Lift it above the nav bar
    marginBottom: Platform.OS === "android" ? 18 : 28,
    // Shadow
    shadowColor: COLORS.SHADOW,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.NAV_FAB_ICON,               // white
    lineHeight: 32,
    includeFontPadding: false,
  },
});

export default MainNavigator;
