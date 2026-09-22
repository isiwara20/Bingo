/**
 * BinGo – Community Leader Profile Screen
 */

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../../context/AuthContext";
import { logout as logoutApi } from "../../services/authService";
import COLORS from "../../constants/colors";

const InfoRow = ({ icon, label, value, color }) => (
  <View style={s.infoRow}>
    <View style={[s.infoIcon, color && { backgroundColor: color + "18" }]}>
      <Icon name={icon} size={18} color={color || COLORS.INFO} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value || "—"}</Text>
    </View>
  </View>
);

const CommunityLeaderProfileScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          setLoggingOut(true);
          try { await logoutApi(); } catch (_) {}
          await logout();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={s.headerCard}>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{user?.name?.[0]?.toUpperCase() || "C"}</Text>
          </View>
          <Text style={s.name}>{user?.name || "Community Leader"}</Text>
          <Text style={s.email}>{user?.email}</Text>
          <View style={s.roleBadge}>
            <Icon name="account-group" size={14} color="#fff" />
            <Text style={s.roleTxt}>Community Leader</Text>
          </View>
        </View>

        {/* Community card */}
        <View style={s.communityCard}>
          <View style={s.communityIconBox}>
            <Icon name="home-group" size={32} color="#1565C0" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.communityName}>{user?.communityName || "Your Community"}</Text>
            <Text style={s.communitySub}>Active community</Text>
          </View>
          <View style={s.communityBadge}>
            <Text style={s.communityBadgeTxt}>Active</Text>
          </View>
        </View>

        {/* Profile details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Profile Details</Text>
          <View style={s.infoCard}>
            <InfoRow icon="account-outline"    label="Full Name"        value={user?.name}            color="#1565C0" />
            <View style={s.divider} />
            <InfoRow icon="email-outline"      label="Email"            value={user?.email}           color="#1565C0" />
            <View style={s.divider} />
            <InfoRow icon="whatsapp"           label="WhatsApp"         value={user?.whatsappNumber}  color="#25D366" />
            <View style={s.divider} />
            <InfoRow icon="home-group"         label="Community"        value={user?.communityName}   color="#1565C0" />
            <View style={s.divider} />
            <InfoRow icon="calendar-outline"   label="Member Since"     value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} color="#1565C0" />
          </View>
        </View>

        {/* Quick actions */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <View style={s.actionCard}>
            {[
              { icon: "account-group-outline", label: "Community Board",     screen: "Community" },
              { icon: "map-outline",           label: "Waste Map",           screen: "Map" },
              { icon: "calendar-check-outline",label: "Collection Schedule", screen: "Schedule" },
              { icon: "recycle",               label: "Recycling Guide",     screen: "Recycling" },
              { icon: "bell-outline",          label: "Notifications",       screen: "Notifications" },
              { icon: "cog-outline",           label: "Settings",            screen: "Settings" },
            ].map((item, i, arr) => (
              <React.Fragment key={item.label}>
                <TouchableOpacity
                  style={s.actionRow}
                  onPress={() => navigation.navigate(item.screen)}
                  accessibilityRole="button"
                >
                  <View style={[s.actionIcon, { backgroundColor: "#E3F2FD" }]}>
                    <Icon name={item.icon} size={20} color="#1565C0" />
                  </View>
                  <Text style={s.actionLabel}>{item.label}</Text>
                  <Icon name="chevron-right" size={18} color={COLORS.TEXT_DISABLED} />
                </TouchableOpacity>
                {i < arr.length - 1 && <View style={s.divider} />}
              </React.Fragment>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={[s.logoutBtn, loggingOut && { opacity: 0.6 }]}
          onPress={handleLogout}
          disabled={loggingOut}
          accessibilityRole="button"
        >
          <Icon name="logout" size={20} color={COLORS.ERROR} />
          <Text style={s.logoutTxt}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll:    { padding: 16, paddingBottom: 40, gap: 12 },

  headerCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 20,
    alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: COLORS.BORDER, elevation: 2,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#1565C0",
    justifyContent: "center", alignItems: "center", marginBottom: 4,
  },
  avatarTxt: { fontSize: 32, fontWeight: "bold", color: "#fff" },
  name:  { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  email: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#1565C0", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  roleTxt: { color: "#fff", fontSize: 12, fontWeight: "700" },

  communityCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#E3F2FD", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#BBDEFB",
  },
  communityIconBox: {
    width: 56, height: 56, borderRadius: 14,
    backgroundColor: "#fff",
    justifyContent: "center", alignItems: "center",
  },
  communityName: { fontSize: 16, fontWeight: "700", color: "#1565C0" },
  communitySub:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  communityBadge: {
    backgroundColor: "#1565C0", borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  communityBadgeTxt: { color: "#fff", fontSize: 10, fontWeight: "700" },

  section:      { gap: 8 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_DISABLED, textTransform: "uppercase", letterSpacing: 0.8 },
  infoCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  infoRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  infoIcon: {
    width: 34, height: 34, borderRadius: 8,
    backgroundColor: "#E3F2FD",
    justifyContent: "center", alignItems: "center",
  },
  infoLabel: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginBottom: 1 },
  infoValue: { fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  divider:   { height: 1, backgroundColor: COLORS.DIVIDER, marginLeft: 60 },

  actionCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden",
  },
  actionRow:  { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  actionIcon: {
    width: 34, height: 34, borderRadius: 8,
    justifyContent: "center", alignItems: "center",
  },
  actionLabel: { flex: 1, fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },

  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1.5, borderColor: COLORS.ERROR, borderRadius: 12,
    paddingVertical: 14, marginTop: 4,
  },
  logoutTxt: { color: COLORS.ERROR, fontSize: 15, fontWeight: "600" },
});

export default CommunityLeaderProfileScreen;
