/**
 * BinGo – Community Screen
 * Member 4 – Community Coordination
 *
 * Lists posts, events and announcements with a type filter.
 * Pull to refresh, paginated "load more" on scroll.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getCommunityPosts } from "../services/communityService";
import COLORS from "../constants/colors";

// ── Type configuration ─────────────────────────────────────────────────────
export const TYPE_CONFIG = {
  post:          { label: "Post",         emoji: "📝", color: COLORS.INFO,    bg: "#E3F2FD" },
  event:         { label: "Event",        emoji: "📅", color: COLORS.PRIMARY, bg: COLORS.PRIMARY_TINT },
  announcement:  { label: "Announcement", emoji: "📢", color: COLORS.ACCENT,  bg: "#FFF3E0" },
  cleanup_activity: { label: "Clean-up",  emoji: "🧹", color: COLORS.PRIMARY, bg: COLORS.PRIMARY_TINT },
};

const FILTERS = [
  { value: "all",          label: "All" },
  { value: "post",         label: "Posts" },
  { value: "event",        label: "Events" },
  { value: "announcement", label: "Announcements" },
];

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || { label: type, emoji: "📋", color: COLORS.TEXT_SECONDARY, bg: COLORS.SURFACE };

// ── Post Card ───────────────────────────────────────────────────────────────
export const PostCard = ({ post, onPress }) => {
  const cfg = getTypeConfig(post.type);
  const isEvent = post.type === "event";

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(post._id)}
      accessibilityRole="button"
      accessibilityLabel={`${cfg.label}: ${post.title}`}
    >
      <View style={styles.cardTopRow}>
        <View style={[styles.cardIconWrap, { backgroundColor: cfg.bg }]}>
          <Text style={styles.cardIcon}>{cfg.emoji}</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>{post.title}</Text>
          <Text style={styles.cardMeta}>
            {cfg.label} · {post.authorId?.name || "BinGo"}
          </Text>
        </View>
        {isEvent && post.isAttending ? (
          <View style={styles.goingBadge}>
            <Text style={styles.goingBadgeText}>Going ✓</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.cardContent} numberOfLines={2}>{post.content}</Text>

      {post.imageUrl ? (
        <Image source={{ uri: post.imageUrl }} style={styles.cardThumb} resizeMode="cover" />
      ) : null}

      {isEvent ? (
        <View style={styles.eventMetaRow}>
          {post.eventDate ? (
            <Text style={styles.eventMetaText}>
              📅 {new Date(post.eventDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
            </Text>
          ) : null}
          {post.location ? <Text style={styles.eventMetaText}>📍 {post.location}</Text> : null}
          <Text style={styles.eventMetaText}>👥 {post.attendeeCount ?? 0}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
};

// ── Empty State ────────────────────────────────────────────────────────────
const EmptyState = ({ activeType, search }) => {
  const label = FILTERS.find((f) => f.value === activeType)?.label || "posts";
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyEmoji}>🤝</Text>
      <Text style={styles.emptyTitle}>No {label} Yet</Text>
      <Text style={styles.emptyText}>
        {search
          ? `No results for "${search}".`
          : "Be the first to share something with your community."}
      </Text>
    </View>
  );
};

// ── Main Screen ────────────────────────────────────────────────────────────
const CommunityScreen = ({ navigation }) => {
  const [activeType, setActiveType] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async (pageNum, { replace, type, search: searchTerm }) => {
    setError(null);
    try {
      const { items: pageItems, pagination } = await getCommunityPosts({ type, search: searchTerm, page: pageNum, limit: 10 });
      setItems((prev) => (replace ? pageItems : [...prev, ...pageItems]));
      setTotalPages(pagination.totalPages);
      setPage(pageNum);
    } catch (err) {
      setError(err.message || "Failed to load community posts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    fetchPage(1, { replace: true, type: activeType, search });
  }, [activeType, search, fetchPage]);

  useFocusEffect(
    useCallback(() => {
      fetchPage(1, { replace: true, type: activeType, search });
    }, [activeType, search, fetchPage])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPage(1, { replace: true, type: activeType, search });
  };

  const onEndReached = () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    fetchPage(page + 1, { replace: false, type: activeType, search });
  };

  const goToDetails = (postId) => navigation.navigate("CommunityDetails", { postId });
  const goToCreate = () => navigation.navigate("CommunityCreate");
  const goToMine = () => navigation.navigate("CommunityMine");

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading community…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Community</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={goToMine} accessibilityRole="button">
            <Text style={styles.headerLink}>My Events</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={goToCreate} accessibilityRole="button">
            <Text style={styles.headerLink}>+ Create</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          value={searchInput}
          onChangeText={setSearchInput}
          placeholder="Search posts, events, announcements…"
          placeholderTextColor={COLORS.TEXT_DISABLED}
          returnKeyType="search"
        />
        {searchInput.length > 0 ? (
          <TouchableOpacity onPress={() => setSearchInput("")} accessibilityRole="button">
            <Text style={styles.searchClear}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
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
      </View>

      {error && items.length === 0 ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => fetchPage(1, { replace: true, type: activeType, search })}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {items.length === 0 && !error ? (
        <EmptyState activeType={activeType} search={search} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PostCard post={item} onPress={goToDetails} />}
          contentContainerStyle={styles.list}
          onEndReachedThreshold={0.4}
          onEndReached={onEndReached}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.PRIMARY]}
              tintColor={COLORS.PRIMARY}
            />
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ marginVertical: 16 }} color={COLORS.PRIMARY} /> : null
          }
        />
      )}
    </SafeAreaView>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  listTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerActions: { flexDirection: "row", gap: 16 },
  headerLink: { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 13 },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, paddingVertical: 9, fontSize: 14, color: COLORS.TEXT_PRIMARY },
  searchClear: { color: COLORS.TEXT_DISABLED, fontSize: 16, paddingLeft: 8 },

  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
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

  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardTopRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  cardIcon: { fontSize: 20 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  cardMeta: { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  cardContent: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 18, marginTop: 8 },
  cardThumb: { width: "100%", height: 140, borderRadius: 10, marginTop: 10 },

  goingBadge: {
    backgroundColor: COLORS.PRIMARY_TINT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goingBadgeText: { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 10 },

  eventMetaRow: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  eventMetaText: { fontSize: 11, color: COLORS.TEXT_DISABLED },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center", lineHeight: 20 },
});

export default CommunityScreen;
