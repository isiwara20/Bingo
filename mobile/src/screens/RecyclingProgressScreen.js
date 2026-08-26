/**
 * BinGo – Personal Recycling Progress Screen (Member 3 – Feature 4)
 * Shows user's full recycling journey stats, achievements, and history.
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getMyProgress } from "../services/recyclingService";
import COLORS from "../constants/colors";

const LEVELS = [
  { min: 0,   max: 49,  label: "Eco Beginner",  emoji: "🌱", color: "#6B7280", next: 50  },
  { min: 50,  max: 149, label: "Eco Learner",   emoji: "📗", color: "#16A34A", next: 150 },
  { min: 150, max: 299, label: "Eco Explorer",  emoji: "🌍", color: "#2D5016", next: 300 },
  { min: 300, max: 499, label: "Eco Champion",  emoji: "🏆", color: "#D97706", next: 500 },
  { min: 500, max: Infinity, label: "Eco Master", emoji: "⭐", color: "#7C3AED", next: null },
];

const getLevel = (score) => LEVELS.find(l => score >= l.min && score <= l.max) || LEVELS[0];

const ACHIEVEMENTS = [
  { id: "first_explore",   label: "First Steps",         emoji: "👣", desc: "Explored your first category",    check: (p) => p?.categoriesExplored?.length >= 1 },
  { id: "all_categories",  label: "Category Master",      emoji: "📚", desc: "Explored all 7 categories",       check: (p) => p?.categoriesExplored?.length >= 7 },
  { id: "first_story",     label: "Storyteller",          emoji: "📖", desc: "Completed your first story",      check: (p) => p?.completedStories?.length >= 1 },
  { id: "all_stories",     label: "Story Champion",       emoji: "📚", desc: "Completed 5 stories",             check: (p) => p?.completedStories?.length >= 5 },
  { id: "detective_5",     label: "Junior Detective",     emoji: "🔍", desc: "Played 5 detective cases",        check: (p) => p?.detectiveCasesPlayed >= 5 },
  { id: "detective_ace",   label: "Detective Ace",        emoji: "🕵️", desc: "Got 10 correct answers",         check: (p) => p?.detectiveCasesCorrect >= 10 },
  { id: "score_100",       label: "Century Scorer",       emoji: "💯", desc: "Earned 100 points",              check: (p) => p?.totalScore >= 100 },
  { id: "score_500",       label: "Point Legend",         emoji: "🌟", desc: "Earned 500 points",              check: (p) => p?.totalScore >= 500 },
  { id: "saver_1",         label: "Guide Saver",          emoji: "🔖", desc: "Saved your first guide",         check: (p) => p?.savedGuides?.length >= 1 },
  { id: "saver_5",         label: "Library Builder",      emoji: "📕", desc: "Saved 5 guides to library",      check: (p) => p?.savedGuides?.length >= 5 },
];

export default function RecyclingProgressScreen({ navigation }) {
  const { user } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefresh]= useState(false);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  const load = useCallback(async () => {
    try {
      const p = await getMyProgress();
      setProgress(p);
      // Animate progress bar
      const pct = p?.totalScore ? Math.min(1, (p.totalScore % 150) / 150) : 0;
      Animated.timing(progressAnim, { toValue: pct, duration: 1000, useNativeDriver: false }).start();
    } catch {}
    finally { setLoading(false); setRefresh(false); }
  }, []);

  useEffect(() => { load(); }, []);

  if (loading) return (
    <SafeAreaView style={S.root}>
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>My Recycling Progress</Text>
      </View>
      <View style={S.loader}><ActivityIndicator size="large" color={COLORS.PRIMARY} /></View>
    </SafeAreaView>
  );

  const score  = progress?.totalScore || 0;
  const level  = getLevel(score);
  const nextPts = level.next ? level.next - score : 0;
  const pct    = level.next ? Math.min(100, ((score - level.min) / (level.next - level.min)) * 100) : 100;

  const unlocked = ACHIEVEMENTS.filter(a => a.check(progress));
  const locked   = ACHIEVEMENTS.filter(a => !a.check(progress));

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>My Recycling Progress</Text>
          <Text style={S.headerSub}>Track your eco journey</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefresh(true); load(); }} colors={[COLORS.PRIMARY]} />}
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Profile card */}
        <View style={[S.profileCard, { backgroundColor: level.color }]}>
          <View style={S.profileTop}>
            <View style={S.avatar}><Text style={S.avatarTxt}>👤</Text></View>
            <View style={S.profileInfo}>
              <Text style={S.profileName}>{user?.name || "Eco Learner"}</Text>
              <View style={S.levelBadge}>
                <Text style={S.levelEmoji}>{level.emoji}</Text>
                <Text style={S.levelLabel}>{level.label}</Text>
              </View>
            </View>
            <View style={S.scoreBox}>
              <Text style={S.scoreNum}>{score}</Text>
              <Text style={S.scoreLbl}>pts</Text>
            </View>
          </View>
          {/* XP Bar */}
          <View style={S.xpSection}>
            <View style={S.xpBarBg}>
              <Animated.View style={[S.xpBarFill, {
                width: progressAnim.interpolate({ inputRange: [0,1], outputRange: ["0%","100%"] }),
              }]} />
            </View>
            <Text style={S.xpLabel}>
              {level.next ? `${nextPts} pts to ${LEVELS[LEVELS.indexOf(level) + 1]?.label}` : "Max level reached! 🎉"}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <Text style={S.sectionLabel}>My Impact</Text>
        <View style={S.statsGrid}>
          {[
            { label: "Categories Explored",  value: progress?.categoriesExplored?.length || 0, emoji: "📚", color: "#3B82F6" },
            { label: "Guides Saved",          value: progress?.savedGuides?.length || 0,         emoji: "🔖", color: "#8B5CF6" },
            { label: "Stories Completed",     value: progress?.completedStories?.length || 0,    emoji: "📖", color: "#F59E0B" },
            { label: "Detective Cases",       value: progress?.detectiveCasesPlayed || 0,         emoji: "🔍", color: "#06B6D4" },
            { label: "Correct Answers",       value: progress?.detectiveCasesCorrect || 0,        emoji: "✓",  color: "#16A34A" },
            { label: "Total Points",          value: score,                                        emoji: "⭐", color: "#D97706" },
          ].map((s, i) => (
            <View key={i} style={[S.statCard, { borderTopColor: s.color }]}>
              <Text style={{ fontSize: 22 }}>{s.emoji}</Text>
              <Text style={[S.statNum, { color: s.color }]}>{s.value}</Text>
              <Text style={S.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Category progress */}
        <Text style={S.sectionLabel}>Categories Explored</Text>
        <View style={S.catProgressCard}>
          {["Plastic","Glass","Paper","Metal","Organic","E-Waste","Hazardous"].map((cat, i) => {
            const explored = progress?.categoriesExplored?.includes(cat);
            const catColors = ["#3B82F6","#8B5CF6","#F59E0B","#6B7280","#16A34A","#DC2626","#D97706"];
            const catEmojis = ["🧴","🍶","📄","🥫","🌿","📱","⚠️"];
            return (
              <View key={i} style={S.catProgressRow}>
                <Text style={{ fontSize: 20, width: 28 }}>{catEmojis[i]}</Text>
                <Text style={[S.catProgressName, !explored && { color: COLORS.TEXT_DISABLED }]}>{cat}</Text>
                <View style={[S.catProgressPill, { backgroundColor: explored ? catColors[i] + "20" : COLORS.BORDER }]}>
                  <Text style={[S.catProgressPillTxt, { color: explored ? catColors[i] : COLORS.TEXT_DISABLED }]}>
                    {explored ? "✓ Explored" : "Not yet"}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Achievements */}
        <Text style={S.sectionLabel}>Achievements ({unlocked.length}/{ACHIEVEMENTS.length})</Text>

        {unlocked.length > 0 && (
          <>
            <Text style={S.achievementSubLabel}>Unlocked 🎉</Text>
            <View style={S.achievementsGrid}>
              {unlocked.map((a) => (
                <View key={a.id} style={[S.achievementCard, S.achievementUnlocked]}>
                  <Text style={S.achievementEmoji}>{a.emoji}</Text>
                  <Text style={S.achievementLabel}>{a.label}</Text>
                  <Text style={S.achievementDesc}>{a.desc}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {locked.length > 0 && (
          <>
            <Text style={S.achievementSubLabel}>Locked 🔒</Text>
            <View style={S.achievementsGrid}>
              {locked.map((a) => (
                <View key={a.id} style={[S.achievementCard, S.achievementLocked]}>
                  <Text style={[S.achievementEmoji, { opacity: 0.3 }]}>{a.emoji}</Text>
                  <Text style={[S.achievementLabel, { color: COLORS.TEXT_DISABLED }]}>{a.label}</Text>
                  <Text style={S.achievementDesc}>{a.desc}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Motivational footer */}
        <View style={[S.motivCard, { backgroundColor: COLORS.PRIMARY }]}>
          <Text style={S.motivEmoji}>🌱</Text>
          <Text style={S.motivTxt}>
            {score === 0 ? "Start exploring to earn your first points!" :
             score < 50 ? "Great start! Keep exploring categories." :
             score < 150 ? "You're making a real difference!" :
             "You're an eco champion. Keep it up! 🏆"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:               { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:             { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:            { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  backIcon:           { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:          { flex: 1 },
  headerTitle:        { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:          { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  loader:             { flex: 1, justifyContent: "center", alignItems: "center" },
  // Profile card
  profileCard:        { margin: 16, borderRadius: 20, padding: 18, elevation: 4 },
  profileTop:         { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  avatar:             { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  avatarTxt:          { fontSize: 26 },
  profileInfo:        { flex: 1 },
  profileName:        { fontSize: 18, fontWeight: "800", color: "#fff" },
  levelBadge:         { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  levelEmoji:         { fontSize: 14 },
  levelLabel:         { fontSize: 12, color: "#fff", fontWeight: "700" },
  scoreBox:           { alignItems: "center" },
  scoreNum:           { fontSize: 32, fontWeight: "900", color: "#fff" },
  scoreLbl:           { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  xpSection:          { gap: 6 },
  xpBarBg:            { height: 8, backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 4, overflow: "hidden" },
  xpBarFill:          { height: "100%", backgroundColor: "#fff", borderRadius: 4 },
  xpLabel:            { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  // Stats
  sectionLabel:       { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 16, marginBottom: 10, marginTop: 6 },
  statsGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginBottom: 4 },
  statCard:           { width: "30%", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, alignItems: "center", borderTopWidth: 3, elevation: 1, flexGrow: 1 },
  statNum:            { fontSize: 22, fontWeight: "900", marginTop: 4 },
  statLbl:            { fontSize: 9, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 2 },
  // Category progress
  catProgressCard:    { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginHorizontal: 16, marginBottom: 4, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  catProgressRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER, gap: 10 },
  catProgressName:    { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  catProgressPill:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  catProgressPillTxt: { fontSize: 11, fontWeight: "700" },
  // Achievements
  achievementSubLabel:{ fontSize: 12, color: COLORS.TEXT_SECONDARY, paddingHorizontal: 16, marginBottom: 8, fontWeight: "600" },
  achievementsGrid:   { flexDirection: "row", flexWrap: "wrap", gap: 10, paddingHorizontal: 16, marginBottom: 10 },
  achievementCard:    { width: "47%", borderRadius: 14, padding: 12, alignItems: "center", gap: 4, elevation: 1, borderWidth: 1, flexGrow: 1 },
  achievementUnlocked:{ backgroundColor: "#F0FDF4", borderColor: "#BBF7D0" },
  achievementLocked:  { backgroundColor: COLORS.SURFACE, borderColor: COLORS.BORDER },
  achievementEmoji:   { fontSize: 28 },
  achievementLabel:   { fontSize: 12, fontWeight: "800", color: COLORS.TEXT_PRIMARY, textAlign: "center" },
  achievementDesc:    { fontSize: 10, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  // Motivational
  motivCard:          { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 14, padding: 14, marginHorizontal: 16, marginTop: 4 },
  motivEmoji:         { fontSize: 24 },
  motivTxt:           { flex: 1, color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
