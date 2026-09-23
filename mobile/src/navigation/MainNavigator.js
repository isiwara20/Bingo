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
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { getUiText } from "../constants/translations";
import COLORS from "../constants/colors";

// Role dashboards
import ResidentDashboard        from "../screens/ResidentDashboard";
import CommunityLeaderDashboard from "../screens/CommunityLeaderDashboard";
import WasteAuthorityDashboard  from "../screens/WasteAuthorityDashboard";

// Screens
import ReportWasteScreen        from "../screens/ReportWasteScreen";
import ReportReviewScreen       from "../screens/ReportReviewScreen";
import ReportDetailsScreen      from "../screens/ReportDetailsScreen";
import ReportStatusScreen       from "../screens/ReportStatusScreen";
import WasteMapScreen           from "../screens/WasteMapScreen";
import CollectionScheduleScreen from "../screens/CollectionScheduleScreen";
import RecyclingGuideScreen     from "../screens/RecyclingGuideScreen";
import CommunityScreen          from "../screens/CommunityScreen";
import CommunityDetailsScreen   from "../screens/CommunityDetailsScreen";
import CommunityCreateScreen    from "../screens/CommunityCreateScreen";
import CommunityMineScreen      from "../screens/CommunityMineScreen";
import NotificationsScreen      from "../screens/NotificationsScreen";
import NotificationSettingsScreen from "../screens/NotificationSettingsScreen";
import RewardsScreen            from "../screens/RewardsScreen";
import ProfileScreen            from "../screens/ProfileScreen";
import SettingsScreen           from "../screens/SettingsScreen";
import PaymentScreen            from "../screens/PaymentScreen";
import ResidentProfileScreen    from "../screens/profiles/ResidentProfileScreen";
import CommunityLeaderProfileScreen from "../screens/profiles/CommunityLeaderProfileScreen";
import WasteAuthorityProfileScreen  from "../screens/profiles/WasteAuthorityProfileScreen";
import ResidentVerificationScreen   from "../screens/profiles/ResidentVerificationScreen";

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
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Rewards"       component={RewardsScreen} />
      <Stack.Screen name="Payment"       component={PaymentScreen} />
      <Stack.Screen name="Settings"      component={SettingsScreen} />
    </Stack.Navigator>
  );
  return HomeStack;
};

const ReportStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ReportWaste"   component={ReportWasteScreen} />
    <Stack.Screen name="ReportReview"  component={ReportReviewScreen} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
    <Stack.Screen name="ReportStatus"  component={ReportStatusScreen} />
  </Stack.Navigator>
);

const CommunityStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CommunityMain"    component={CommunityScreen} />
    <Stack.Screen name="CommunityDetails" component={CommunityDetailsScreen} />
    <Stack.Screen name="CommunityCreate"  component={CommunityCreateScreen} />
    <Stack.Screen name="CommunityMine"    component={CommunityMineScreen} />
  </Stack.Navigator>
);

const MapStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="WasteMap"      component={WasteMapScreen} />
    <Stack.Screen name="ReportDetails" component={ReportDetailsScreen} />
  </Stack.Navigator>
);

// ── Role → Profile screen ─────────────────────────────────────────────────────
const ROLE_PROFILES = {
  resident:         ResidentProfileScreen,
  community_leader: CommunityLeaderProfileScreen,
  waste_authority:  WasteAuthorityProfileScreen,
};

const makeProfileStack = (role) => {
  const ProfileMain = ROLE_PROFILES[role] || ProfileScreen;
  const ProfileStack = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain"           component={ProfileMain} />
      <Stack.Screen name="Settings"              component={SettingsScreen} />
      <Stack.Screen name="ResidentVerification"  component={ResidentVerificationScreen} />
    </Stack.Navigator>
  );
  return ProfileStack;
};

// ── Main Tab Navigator ────────────────────────────────────────────────────────
const MainNavigator = () => {
  const { user } = useAuth();
  const { darkMode, language } = useTheme();
  const text = getUiText(language);
  const insets = useSafeAreaInsets();
  const role = user?.role || "resident";
  const HomeStack    = React.useMemo(() => makeHomeStack(role), [role]);
  const ProfileStack = React.useMemo(() => makeProfileStack(role), [role]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor:   COLORS.PRIMARY,
        tabBarInactiveTintColor: darkMode ? "#BDBDBD" : COLORS.TEXT_SECONDARY,
        tabBarStyle: {
          backgroundColor: darkMode ? "#1E1E1E" : COLORS.SURFACE,
          borderTopColor:  darkMode ? "#383838" : COLORS.BORDER,
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
      <Tab.Screen name="Home"      component={HomeStack}               options={{ tabBarLabel: text.home }} />
      <Tab.Screen name="Report"    component={ReportStack}             options={{ tabBarLabel: text.report }} />
      <Tab.Screen name="Map"       component={MapStack}                options={{ tabBarLabel: text.map }} />
      <Tab.Screen name="Schedule"  component={CollectionScheduleScreen} options={{ tabBarLabel: text.schedule }} />
      <Tab.Screen name="Community" component={CommunityScreen}         options={{ tabBarLabel: text.community }} />
      <Tab.Screen name="Recycling" component={RecyclingGuideScreen}    options={{ tabBarLabel: text.recycle }} />
      <Tab.Screen name="Profile"   component={ProfileStack}            options={{ tabBarLabel: text.profile }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;


