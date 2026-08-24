/**
 * BinGo Admin – Reports Screen
 * Lists all waste reports with status badges.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/apiClient";
import COLORS from "../../constants/colors";

const STATUS_CONFIG = {
  pending:      { label: "Pending",      color: COLORS.WARNING,  bg: "#FFF3E0" },
  under_review: { label: "Under Review", color: COLORS.INFO,     bg: "#E3F2FD" },
  cleaned:      { label: "Cleaned",      color: COLORS.SUCCESS,  bg: "#E8F5E9" },
  rejected:     { label: "Rejected",     color: COLORS.ERROR,    bg: "#FFEBEE" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || { label: status, color: COLORS.TEXT_SECONDARY, bg: COLORS.BACKGROUND };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const ReportCard = ({ item }) => (
  <View style={styles.card}>
    <View style={styles.cardTop}>
      <Text style={styles.cardTitle} numberOfLines={1}>{item.title || "Untitled Report"}</Text>
      <StatusBadge status={item.status} />
    </View>
    <Text style={styles.cardDesc} numberOfLines={2}>{item.description || "No description"}</Text>
    <View style={styles.cardMeta}>
      <Text style={styles.metaText}>👤 {item.user?.name || "Unknown"}</Text>
      <Text style={styles.metaText}>📅 {new Date(item.createdAt).toLocaleDateString()}</Text>
    </View>
  </View>
);

const AdminReportsScreen = () => {
  const [reports, setReports]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async () => {
    try {
      const res = await api.get("/admin/reports");
      setReports(res.data.data || []);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to load reports.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const onRefresh = () => { setRefreshing(true); fetchReports(); };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <Text style={styles.headerCount}>{reports.length} total</Text>
      </View>
      <FlatList
        data={reports}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <ReportCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />}
        ListEmptyComponent={<Text style={styles.empty}>No reports yet.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerCount: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  card: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: COLORS.BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1, gap: 6,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  cardDesc: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },
  cardMeta: { flexDirection: "row", gap: 16, marginTop: 2 },
  metaText: { fontSize: 11, color: COLORS.TEXT_DISABLED },
  empty: { textAlign: "center", color: COLORS.TEXT_DISABLED, marginTop: 40, fontSize: 14 },
});

export default AdminReportsScreen;
