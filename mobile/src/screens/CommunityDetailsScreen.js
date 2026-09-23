/**
 * BinGo – Community Details Screen
 * Member 4 – Community Coordination
 *
 * Full detail view for a single post/event/announcement.
 * For events: shows date/location/attendees and a Join/Leave button.
 * For the author or a waste_authority: Edit/Delete controls.
 *
 * route.params.postId → fetch from API
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import {
  getCommunityPostById,
  joinCommunityEvent,
  leaveCommunityEvent,
  deleteCommunityPost,
} from "../services/communityService";
import { TYPE_CONFIG } from "./CommunityScreen";
import COLORS from "../constants/colors";

const getTypeConfig = (type) =>
  TYPE_CONFIG[type] || { label: type, emoji: "📋", color: COLORS.TEXT_SECONDARY, bg: COLORS.SURFACE };

const CommunityDetailsScreen = ({ route, navigation }) => {
  const { postId } = route.params || {};
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchPost = useCallback(async () => {
    if (!postId) {
      setError("Post ID not provided.");
      setLoading(false);
      return;
    }
    try {
      const data = await getCommunityPostById(postId);
      setPost(data);
    } catch (err) {
      setError(err.message || "Failed to load post details.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  const handleJoinToggle = async () => {
    setJoinLoading(true);
    setActionError(null);
    try {
      const result = post.isAttending
        ? await leaveCommunityEvent(postId)
        : await joinCommunityEvent(postId);
      setPost((prev) => ({ ...prev, ...result }));
    } catch (err) {
      setActionError(err.message || "Action failed. Please try again.");
    } finally {
      setJoinLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Post", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCommunityPost(postId);
            navigation.goBack();
          } catch (err) {
            Alert.alert("Delete Failed", err.message || "Could not delete this post.");
          }
        },
      },
    ]);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load Post</Text>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const cfg = getTypeConfig(post.type);
  const isEvent = post.type === "event";
  const authorId = post.authorId?._id || post.authorId;
  const canManage = user && (String(authorId) === String(user._id) || user.role === "waste_authority");

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          {canManage ? (
            <View style={styles.manageActions}>
              <TouchableOpacity onPress={() => navigation.navigate("CommunityCreate", { postId })}>
                <Text style={styles.manageLink}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete}>
                <Text style={[styles.manageLink, { color: COLORS.ERROR }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <View style={[styles.typeBadge, { backgroundColor: cfg.bg }]}>
          <Text style={styles.typeBadgeText}>{cfg.emoji} {cfg.label}</Text>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.author}>by {post.authorId?.name || "BinGo"}</Text>

        {post.imageUrl ? (
          <Image source={{ uri: post.imageUrl }} style={styles.photo} resizeMode="cover" />
        ) : null}

        <Text style={styles.content}>{post.content}</Text>

        {isEvent ? (
          <View style={styles.eventBox}>
            {post.eventDate ? (
              <DetailRow
                label="Date"
                value={new Date(post.eventDate).toLocaleString("en-US", {
                  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              />
            ) : null}
            {post.location ? <DetailRow label="Location" value={post.location} /> : null}
            <DetailRow label="Attendees" value={String(post.attendeeCount ?? 0)} />

            {actionError ? <Text style={styles.actionError}>{actionError}</Text> : null}

            <TouchableOpacity
              style={[styles.joinBtn, post.isAttending && styles.leaveBtn]}
              onPress={handleJoinToggle}
              disabled={joinLoading}
            >
              {joinLoading ? (
                <ActivityIndicator color={post.isAttending ? COLORS.ACCENT : COLORS.TEXT_INVERSE} />
              ) : (
                <Text style={[styles.joinBtnText, post.isAttending && styles.leaveBtnText]}>
                  {post.isAttending ? "Leave Event" : "Join Event"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const DetailRow = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  loadingText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  scroll: { padding: 16, paddingBottom: 48 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  backBtn: { marginBottom: 8 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },
  manageActions: { flexDirection: "row", gap: 16 },
  manageLink: { color: COLORS.PRIMARY, fontWeight: "700", fontSize: 14 },

  typeBadge: { alignSelf: "flex-start", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 10 },
  typeBadgeText: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_PRIMARY },

  title: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  author: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4, marginBottom: 12 },

  photo: { width: "100%", height: 200, borderRadius: 12, marginBottom: 16 },

  content: { fontSize: 15, color: COLORS.TEXT_PRIMARY, lineHeight: 22, marginBottom: 16 },

  eventBox: { backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 14, gap: 8 },
  detailRow: { marginBottom: 4 },
  detailLabel: { fontSize: 11, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  detailValue: { fontSize: 14, color: COLORS.TEXT_PRIMARY, marginTop: 2 },

  actionError: { color: COLORS.ERROR, fontSize: 12, marginTop: 4 },

  joinBtn: {
    marginTop: 8,
    backgroundColor: COLORS.ACCENT,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  joinBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold", fontSize: 15 },
  leaveBtn: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: COLORS.ACCENT },
  leaveBtnText: { color: COLORS.ACCENT },

  errorEmoji: { fontSize: 48, marginBottom: 8 },
  errorTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  errorMsg: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  retryBtn: { marginTop: 16, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold" },
});

export default CommunityDetailsScreen;
