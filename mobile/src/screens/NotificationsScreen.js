/**
 * BinGo – Notifications Screen
 * Member 4 – Notifications
 *
 * Lists notifications with a type filter, unread highlighted, tap to
 * mark read, "Mark all read" header action, settings gear icon.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getNotifications, markAsRead, markAllAsRead } from "../services/notificationService";
import COLORS from "../constants/colors";

const TYPE_CONFIG = {
  report_status_update: { label: "Reports",      emoji: "📋" },
  collection_reminder:  { label: "Collection",    emoji: "🚛" },
  community_event:      { label: "Events",        emoji: "📅" },
  reward_earned:        { label: "Rewards",       emoji: "⭐" },
  announcement:         { label: "Announcements", emoji: "📢" },
  general:              { label: "General",       emoji: "🔔" },
};

const FILTERS = [
  { value: "all", label: "All" },
  ...Object.entries(TYPE_CONFIG).map(([value, cfg]) => ({ value, label: cfg.label })),
];

const getTypeConfig = (type) => TYPE_CONFIG[type] || { label: type, emoji: "🔔" };

const NotificationRow = ({ item, onPress }) => {
  const cfg = getTypeConfig(item.type);
  return (
    <TouchableOpacity
      style={[styles.row, !item.isRead && styles.rowUnread]}
      onPress={() => onPress(item)}
      accessibilityRole="button"
    >
      {!item.isRead ? <View style={styles.unreadDot} /> : <View style={styles.unreadDotSpacer} />}
      <Text style={styles.rowEmoji}>{cfg.emoji}</Text>
      <View style={styles.rowBody}>
        <Text style={[styles.rowTitle, !item.isRead && styles.rowTitleUnread]} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowMessage} numberOfLines={2}>{item.message}</Text>
        <Text style={styles.rowTime}>
          {new Date(item.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const EmptyState = () => (
  <View style={styles.empty}>
    <Text style={styles.emptyEmoji}>🔔</Text>
    <Text style={styles.emptyTitle}>No Notifications</Text>
    <Text style={styles.emptyText}>You're all caught up.</Text>
  </View>
);

const NotificationsScreen = ({ navigation }) => {
  const [activeType, setActiveType] = useState("all");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum, { replace, type }) => {
    setError(null);
    try {
      const { items: pageItems, pagination } = await getNotifications({ type, page: pageNum, limit: 20 });
      setItems((prev) => (replace ? pageItems : [...prev, ...pageItems]));
      setTotalPages(pagination.totalPages);
      setUnreadCount(pagination.unreadCount ?? 0);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchPage(1, { replace: true, type: activeType });
    }, [activeType, fetchPage])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1, { replace: true, type: activeType });
  };

  const onEndReached = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchPage(page + 1, { replace: false, type: activeType });
  };

  const handlePressItem = async (item) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
      try { await markAsRead(item._id); } catch (_) {}
    }
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try { await markAllAsRead(); } catch (_) {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading notifications…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          Notifications{unreadCount > 0 ? ` (${unreadCount})` : ""}
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => navigation.navigate("NotificationSettings")} accessibilityRole="button">
            <Text style={styles.headerLink}>⚙️</Text>
          </TouchableOpacity>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAllRead} accessibilityRole="button">
              <Text style={styles.headerLink}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterPill, activeType === f.value && styles.filterPillActive]}
            onPress={() => setActiveType(f.value)}
          >
            <Text style={[styles.filterPillText, activeType === f.value && styles.filterPillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error && items.length === 0 ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage(1, { replace: true, type: activeType })}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {items.length === 0 && !error ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <NotificationRow item={item} onPress={handlePressItem} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} tintColor={COLORS.PRIMARY} />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.PRIMARY} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerActions: { flexDirection: "row", gap: 16, alignItems: "center" },
  headerLink: { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 13 },

  filterScroll: { flexGrow: 0, maxHeight: 44 },
  filterRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8, alignItems: "center" },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
  },
  filterPillActive: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  filterPillText: { fontSize: 12, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  filterPillTextActive: { color: COLORS.TEXT_INVERSE },

  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFEBEE",
    marginHorizontal: 16,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  errorText: { color: COLORS.ERROR, fontSize: 13, flex: 1 },
  retryText: { color: COLORS.ERROR, fontWeight: "700", marginLeft: 8 },

  list: { padding: 16, paddingTop: 4, paddingBottom: 24 },

  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  rowUnread: { backgroundColor: COLORS.PRIMARY_TINT },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.ACCENT, marginTop: 6 },
  unreadDotSpacer: { width: 8 },
  rowEmoji: { fontSize: 20 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  rowTitleUnread: { fontWeight: "800" },
  rowMessage: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2, lineHeight: 18 },
  rowTime: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 4 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
});

export default NotificationsScreen;
