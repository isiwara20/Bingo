/**
 * BinGo – Main Navigator
 *
 * Bottom tab navigation for all non-admin authenticated users.
 * Home tab renders the correct dashboard per role:
 *   resident          → ResidentDashboard
 *   community_leader  → CommunityLeaderDashboard
 *   waste_authority   → WasteAuthorityDashboard
 *
 * Uses MaterialCommunityIcons for all tab icons.
 * useSafeAreaInsets ensures the tab bar clears the phone's gesture/nav bar.
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAuth } from "../context/AuthContext";
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
import RecyclingCategoryScreen     from "../screens/RecyclingCategoryScreen";
import WasteScanScreen             from "../screens/WasteScanScreen";
import CommunityScreen             from "../screens/CommunityScreen";
import NotificationsScreen         from "../screens/NotificationsScreen";
import RewardsScreen               from "../screens/RewardsScreen";
import ProfileScreen               from "../screens/ProfileScreen";
import SettingsScreen              from "../screens/SettingsScreen";
import PaymentScreen               from "../screens/PaymentScreen";

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// ── Role → Dashboard ──────────────────────────────────────────────────────────
const ROLE_DASHBOARDS = {
  resident:         ResidentDashboard,
  community_leader: CommunityLeaderDashboard,
  waste_authority:  WasteAuthorityDashboard,
};

// ── Tab icon names (MaterialCommunityIcons) ───────────────────────────────────
const TAB_ICONS = {
  Home:      { active: "home",             inactive: "home-outline" },
  Report:    { active: "clipboard-edit",   inactive: "clipboard-edit-outline" },
  Map:       { active: "map",              inactive: "map-outline" },
  Schedule:  { active: "calendar-check",  inactive: "calendar-check-outline" },
  Community: { active: "account-group",   inactive: "account-group-outline" },
  Recycling: { active: "recycle",         inactive: "recycle" },
  Profile:   { active: "account-circle",  inactive: "account-circle-outline" },
};

// ── Stacks ────────────────────────────────────────────────────────────────────
const makeHomeStack = (role) => {
  const Dashboard = ROLE_DASHBOARDS[role] || ResidentDashboard;
  const HomeStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain"      component={Dashboard} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="Rewards"       component={RewardsScreen} />
      <Stack.Screen name="Payment"       component={PaymentScreen} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
    </Stack.Navigator>
  );
  return HomeStack;
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
      <Stack.Screen name="Recycling"          component={RecyclingGuideScreen} />
      <Stack.Screen name="RecyclingCategory"  component={RecyclingCategoryScreen} />
      {/* Member 3 – Feature 4: AI Waste Assistant */}
      <Stack.Screen name="WasteScan"          component={WasteScanScreen} />
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
      <Stack.Screen name="RecyclingCategory" component={RecyclingCategoryScreen} />
      <Stack.Screen name="WasteScan"     component={WasteScanScreen} />
      <Stack.Screen name="Community"     component={CommunityScreen} />
      <Stack.Screen name="Rewards"       component={RewardsScreen} />
    </Stack.Navigator>
  );
};

// ── Main Tab Navigator ────────────────────────────────────────────────────────
const MainNavigator = () => {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const role = user?.role || "resident";
  const HomeStack = React.useMemo(() => makeHomeStack(role), [role]);

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
          // Respect phone's navigation bar height
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
        tabBarIcon: ({ focused, color }) => {
          const iconName = focused
            ? TAB_ICONS[route.name]?.active
            : TAB_ICONS[route.name]?.inactive;
          return <Icon name={iconName || "circle-outline"} size={24} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home"      component={HomeStack}               options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Report"    component={ReportStack}             options={{ tabBarLabel: "Report" }} />
      <Tab.Screen name="Map"       component={MapStack}                options={{ tabBarLabel: "Map" }} />
      <Tab.Screen name="Schedule"  component={CollectionScheduleScreen} options={{ tabBarLabel: "Schedule" }} />
      <Tab.Screen name="Community" component={CommunityScreen}         options={{ tabBarLabel: "Community" }} />
      <Tab.Screen name="Recycling" component={RecyclingGuideScreen}    options={{ tabBarLabel: "Recycle" }} />
      <Tab.Screen name="Profile"   component={ProfileStack}            options={{ tabBarLabel: "Profile" }} />
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
