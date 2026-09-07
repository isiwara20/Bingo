/**
 * BinGo – My Events Screen
 * Member 4 – Community Coordination
 *
 * Events the authenticated user has joined, split into Upcoming/Completed.
 */

import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { getMyCommunityEvents } from "../services/communityService";
import { PostCard } from "./CommunityScreen";
import COLORS from "../constants/colors";

const SECTIONS = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
];

const CommunityMineScreen = ({ navigation }) => {
  const [section, setSection] = useState("upcoming");
  const [upcoming, setUpcoming] = useState([]);
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMine = useCallback(async () => {
    setError(null);
    try {
      const data = await getMyCommunityEvents();
      setUpcoming(data.upcoming || []);
      setCompleted(data.completed || []);
    } catch (err) {
      setError(err.message || "Failed to load your events.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchMine(); }, [fetchMine]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchMine();
  };

  const goToDetails = (postId) => navigation.navigate("CommunityDetails", { postId });
  const items = section === "upcoming" ? upcoming : completed;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>My Events</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.tabRow}>
        {SECTIONS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.tab, section === s.value && styles.tabActive]}
            onPress={() => setSection(s.value)}
          >
            <Text style={[styles.tabText, section === s.value && styles.tabTextActive]}>{s.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={fetchMine}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {items.length === 0 && !error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyText}>
            {section === "upcoming" ? "No upcoming events you've joined." : "No completed events yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PostCard post={item} onPress={goToDetails} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} tintColor={COLORS.PRIMARY} />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
  },
  backText: { color: COLORS.PRIMARY, fontSize: 15, width: 50 },
  title: { fontSize: 18, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },

  tabRow: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tab: {
    flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 20,
    backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  tabActive: { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  tabText: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_SECONDARY },
  tabTextActive: { color: COLORS.TEXT_INVERSE },

  errorBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#FFEBEE", marginHorizontal: 16, borderRadius: 8, padding: 10, marginBottom: 8,
  },
  errorText: { color: COLORS.ERROR, fontSize: 13, flex: 1 },
  retryText: { color: COLORS.ERROR, fontWeight: "700", marginLeft: 8 },

  list: { padding: 16, paddingTop: 4, paddingBottom: 24 },

  empty: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
});

export default CommunityMineScreen;
