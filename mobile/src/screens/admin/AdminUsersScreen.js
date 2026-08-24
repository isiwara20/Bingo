/**
 * BinGo Admin – Users Screen
 * Lists all registered users with role badges and status.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, FlatList, TextInput,
  RefreshControl, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/apiClient";
import COLORS from "../../constants/colors";

const ROLE_CONFIG = {
  admin:             { label: "Admin",           color: "#7C3AED", bg: "#EDE9FE" },
  resident:          { label: "Resident",         color: COLORS.PRIMARY, bg: "#E8F5E9" },
  community_leader:  { label: "Community",        color: COLORS.SECONDARY_DARK, bg: "#FFF3E0" },
  waste_authority:   { label: "Authority",        color: COLORS.INFO, bg: "#E3F2FD" },
};

const RoleBadge = ({ role }) => {
  const cfg = ROLE_CONFIG[role] || { label: role, color: COLORS.TEXT_SECONDARY, bg: COLORS.BACKGROUND };
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
};

const UserCard = ({ item }) => (
  <View style={styles.userCard}>
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{item.name?.[0]?.toUpperCase() || "?"}</Text>
    </View>
    <View style={styles.userInfo}>
      <View style={styles.userTopRow}>
        <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
        <RoleBadge role={item.role} />
      </View>
      <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
      <View style={styles.userMeta}>
        <Text style={styles.metaText}>
          {item.phoneVerified ? "📱 Verified" : "📱 Unverified"}
        </Text>
        {item.communityName && (
          <Text style={styles.metaText} numberOfLines={1}>🏘 {item.communityName}</Text>
        )}
      </View>
    </View>
  </View>
);

const AdminUsersScreen = () => {
  const [users, setUsers]       = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get("/admin/users");
      const data = res.data.data || [];
      setUsers(data);
      setFiltered(data);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to load users.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) { setFiltered(users); return; }
    const q = text.toLowerCase();
    setFiltered(users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    ));
  };

  const onRefresh = () => { setRefreshing(true); fetchUsers(); };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerCount}>{users.length} total</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name, email or role…"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          value={search}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <UserCard item={item} />}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.PRIMARY} />}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerCount: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  searchContainer: { paddingHorizontal: 20, paddingBottom: 12 },
  searchInput: {
    backgroundColor: COLORS.SURFACE, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 14, color: COLORS.TEXT_PRIMARY,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  list: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  userCard: {
    flexDirection: "row", backgroundColor: COLORS.SURFACE, borderRadius: 12,
    padding: 14, gap: 12, borderWidth: 1, borderColor: COLORS.BORDER,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 1,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.PRIMARY,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { color: "#fff", fontWeight: "bold", fontSize: 18 },
  userInfo: { flex: 1 },
  userTopRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  userName: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  userEmail: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginBottom: 4 },
  userMeta: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  metaText: { fontSize: 11, color: COLORS.TEXT_DISABLED },
  empty: { textAlign: "center", color: COLORS.TEXT_DISABLED, marginTop: 40, fontSize: 14 },
});

export default AdminUsersScreen;
