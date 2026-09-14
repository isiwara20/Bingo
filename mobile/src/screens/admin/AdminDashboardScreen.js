/**
 * BinGo Admin – Dashboard Screen
 * Shows key stats: total users, reports, pending reports, verified phones.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import api from "../../api/apiClient";
import COLORS from "../../constants/colors";

const StatCard = ({ emoji, label, value, color }) => (
  <View style={[styles.card, { borderLeftColor: color }]}>
    <Text style={styles.cardEmoji}>{emoji}</Text>
    <Text style={[styles.cardValue, { color }]}>{value ?? "—"}</Text>
    <Text style={styles.cardLabel}>{label}</Text>
  </View>
);

const AdminDashboardScreen = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/admin/dashboard");
      setStats(res.data.data);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Welcome, {user?.name?.split(" ")[0]} 👋</Text>
        <Text style={styles.role}>Administrator</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />}
        >
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.grid}>
            <StatCard emoji="👤" label="Total Users"    value={stats?.totalUsers}    color={COLORS.PRIMARY} />
            <StatCard emoji="📋" label="Total Reports"  value={stats?.totalReports}  color={COLORS.INFO} />
            <StatCard emoji="⏳" label="Pending"        value={stats?.pendingReports} color={COLORS.WARNING} />
            <StatCard emoji="✅" label="Resolved"       value={stats?.resolvedReports} color={COLORS.SUCCESS} />
            <StatCard emoji="📱" label="Verified Phones" value={stats?.verifiedPhones} color={COLORS.SECONDARY} />
            <StatCard emoji="🏘️" label="Communities"    value={stats?.communities}   color={COLORS.PRIMARY_DARK} />
          </View>

          <Text style={styles.sectionTitle}>User Breakdown</Text>
          <View style={styles.breakdownCard}>
            {[
              { label: "Residents",        value: stats?.residents,       color: COLORS.PRIMARY },
              { label: "Community Leaders", value: stats?.communityLeaders, color: COLORS.SECONDARY },
              { label: "Waste Authorities", value: stats?.wasteAuthorities, color: COLORS.INFO },
            ].map((item) => (
              <View key={item.label} style={styles.breakdownRow}>
                <View style={[styles.breakdownDot, { backgroundColor: item.color }]} />
                <Text style={styles.breakdownLabel}>{item.label}</Text>
                <Text style={[styles.breakdownValue, { color: item.color }]}>{item.value ?? "—"}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { backgroundColor: COLORS.PRIMARY, padding: 24, paddingBottom: 20 },
  greeting: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 2 },
  role: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  content: { padding: 20, gap: 16 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%", backgroundColor: COLORS.SURFACE, borderRadius: 12,
    padding: 16, borderLeftWidth: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardEmoji: { fontSize: 24, marginBottom: 6 },
  cardValue: { fontSize: 28, fontWeight: "bold", marginBottom: 2 },
  cardLabel: { fontSize: 12, color: COLORS.TEXT_SECONDARY },
  breakdownCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2, gap: 14,
  },
  breakdownRow: { flexDirection: "row", alignItems: "center" },
  breakdownDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  breakdownLabel: { flex: 1, fontSize: 14, color: COLORS.TEXT_PRIMARY },
  breakdownValue: { fontSize: 18, fontWeight: "bold" },
});

export default AdminDashboardScreen;
