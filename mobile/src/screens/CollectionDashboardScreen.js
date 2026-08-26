/**
 * BinGo – Collection Information Dashboard (Member 3 – Feature 2)
 * Accessible by: resident only
 *
 * Two sections:
 *   1. MY REMINDERS – user's local device reminders (morning/1hr/missed)
 *      with on/off toggles per type
 *   2. AUTHORITY ALERTS – holiday/route/weather alerts pushed by authority
 *      read-only, user can toggle visibility per type
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Switch, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import COLORS from "../constants/colors";
import { getSchedules } from "../services/scheduleService";
import { getReminders } from "../services/reminderService";
import { getAllSavedReminders, cancelReminder } from "../services/localReminderService";

const DAYS   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const AREAS  = ["Colombo 03", "Colombo 05", "Colombo 07"];

// Authority alert types only
const AUTHORITY_ALERT_CONFIG = {
  holiday_alert: { emoji: "🗓️", color: "#8B5CF6", label: "Holiday Alert",  bg: "#F5F3FF" },
  route_change:  { emoji: "🛣️", color: "#06B6D4", label: "Route Change",   bg: "#ECFEFF" },
  weather_delay: { emoji: "🌧️", color: "#6366F1", label: "Weather Delay",  bg: "#EEF2FF" },
};

// User reminder types
const USER_REMINDER_CONFIG = {
  morning_reminder:  { emoji: "🌅", color: "#F59E0B", label: "Morning Reminder",  desc: "Remind me on collection morning" },
  one_hour_reminder: { emoji: "⏰", color: "#3B82F6", label: "1 Hour Before",     desc: "Remind me 1 hour before collection" },
  missed_collection: { emoji: "⚠️", color: "#EF4444", label: "Missed Collection", desc: "Alert if I might have missed the bin" },
};

const getAC = (t) => AUTHORITY_ALERT_CONFIG[t] || { emoji: "🔔", color: COLORS.PRIMARY, label: t, bg: COLORS.PRIMARY_TINT };

const WASTE_CONFIG = {
  "General Waste":   { emoji: "🗑️", color: "#6B7280", binLabel: "Grey Bin"  },
  "Recycling":       { emoji: "♻️", color: "#1D6FA4", binLabel: "Blue Bin"  },
  "Organic Waste":   { emoji: "🌿", color: "#2D5016", binLabel: "Green Bin" },
  "Garden Waste":    { emoji: "🌱", color: "#4A7C28", binLabel: "Green Bin" },
  "Hazardous Waste": { emoji: "⚠️", color: "#DC2626", binLabel: "Red Bin"   },
};
const getWC = (t) => WASTE_CONFIG[t] || { emoji: "🗑️", color: COLORS.PRIMARY, binLabel: "Bin" };

const SETTINGS_KEY = "@bingo_alert_visibility";
const DEFAULT_VISIBILITY = { holiday_alert: true, route_change: true, weather_delay: true };

const getNextDate = (dayName) => {
  const today = new Date();
  const target = DAYS.indexOf(dayName);
  if (target === -1) return null;
  let diff = target - today.getDay();
  if (diff <= 0) diff += 7;
  const d = new Date(today); d.setDate(today.getDate() + diff);
  return d;
};

const fmtDate = (date) => {
  if (!date) return "";
  return `${DAYS[date.getDay()].slice(0,3)}, ${date.getDate()} ${MONTHS[date.getMonth()].slice(0,3)}`;
};

const timeAgo = (date) => {
  const mins = Math.round((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const fmtTime = (h, m) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${String(m).padStart(2,"0")} ${ampm}`;
};

export default function CollectionDashboardScreen({ navigation }) {
  const [area, setArea]                 = useState("Colombo 03");
  const [schedules, setSchedules]       = useState([]);
  const [authorityAlerts, setAlerts]    = useState([]);
  const [localReminders, setLocal]      = useState({});
  const [visibility, setVisibility]     = useState(DEFAULT_VISIBILITY);
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);

  const load = useCallback(async (a) => {
    try {
      const [s, r, local] = await Promise.all([
        getSchedules(a),
        getReminders(a),
        getAllSavedReminders(),
      ]);
      setSchedules(s);
      // Only show authority-pushed types
      setAlerts(r.filter(r => ["holiday_alert","route_change","weather_delay"].includes(r.type)));
      setLocal(local);
    } catch { /* fail silently */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(SETTINGS_KEY);
      if (stored) setVisibility(JSON.parse(stored));
    } catch {}
  }, []);

  useEffect(() => { load(area); loadSettings(); }, [area]);

  const onRefresh = () => { setRefreshing(true); load(area); };

  const toggleVisibility = async (key) => {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  };

  // Flatten all local reminders across all schedules
  const allLocalReminders = Object.entries(localReminders).flatMap(([schedId, reminders]) =>
    reminders.map(r => ({ ...r, schedId }))
  );

  // Next collection
  const nextCollection = schedules
    .map(s => ({ ...s, nd: getNextDate(s.collectionDay) }))
    .filter(s => s.nd)
    .sort((a, b) => a.nd - b.nd)[0];

  // Today's schedule
  const todayName = DAYS[new Date().getDay()];
  const todaySchedules = schedules.filter(s => s.collectionDay === todayName);

  // Visible authority alerts
  const visibleAlerts = authorityAlerts.filter(r => visibility[r.type] !== false);
  const criticalAlerts = visibleAlerts.filter(r => r.severity === "critical");

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>My Reminders & Alerts</Text>
          <Text style={S.headerSub}>{area}</Text>
        </View>
      </View>

      {/* Area picker */}
      <View style={S.areaBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.areaBarContent}>
          {AREAS.map(a => (
            <TouchableOpacity key={a} style={[S.areaChip, area === a && S.areaChipOn]}
              onPress={() => setArea(a)} accessibilityRole="button">
              <Text style={[S.areaChipTxt, area === a && S.areaChipTxtOn]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Critical banner */}
      {criticalAlerts.length > 0 && (
        <View style={S.criticalBanner}>
          <Text style={{ fontSize: 18 }}>🚨</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.criticalTitle}>{criticalAlerts[0].title}</Text>
            <Text style={S.criticalMsg} numberOfLines={1}>{criticalAlerts[0].message}</Text>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}
        contentContainerStyle={{ paddingBottom: 28 }}>

        {loading ? (
          <View style={S.loader}>
            <ActivityIndicator size="large" color={COLORS.PRIMARY} />
            <Text style={S.loaderTxt}>Loading...</Text>
          </View>
        ) : (
          <>
            {/* ── SECTION 1: MY REMINDERS ─────────────────────────────── */}
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>🔔 My Reminders</Text>
              <Text style={S.sectionSub}>Set on your device — ring even when app is closed</Text>
            </View>

            {/* Active local reminders list */}
            {allLocalReminders.length === 0 ? (
              <View style={S.emptyCard}>
                <Text style={{ fontSize: 32 }}>🔕</Text>
                <Text style={S.emptyTitle}>No reminders set</Text>
                <Text style={S.emptySub}>Go to Schedule → tap a collection → Set Reminder</Text>
                <TouchableOpacity style={S.emptyBtn} onPress={() => navigation.navigate("Schedule")}
                  accessibilityRole="button">
                  <Text style={S.emptyBtnTxt}>Go to Schedule →</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={S.remindersCard}>
                <Text style={S.remindersCardTitle}>Active Reminders</Text>
                {allLocalReminders.map((r, i) => {
                  const scheduleForId = schedules.find(s => s._id === r.schedId);
                  const cfg = scheduleForId ? getWC(scheduleForId.wasteType) : { color: COLORS.PRIMARY, emoji: "🗑️" };
                  return (
                    <View key={i} style={[S.localReminderRow, i > 0 && S.localReminderBorder]}>
                      <View style={[S.localReminderDot, { backgroundColor: cfg.color }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={S.localReminderLabel}>{r.label}</Text>
                        <Text style={S.localReminderTime}>
                          {fmtTime(r.hour, r.minute)} · {scheduleForId?.collectionDay || "weekly"}
                        </Text>
                      </View>
                      <TouchableOpacity style={S.cancelBtn}
                        onPress={() => {
                          Alert.alert("Cancel Reminder", "Remove this reminder?", [
                            { text: "Keep", style: "cancel" },
                            { text: "Remove", style: "destructive",
                              onPress: async () => {
                                await cancelReminder(r.schedId, r.notifId);
                                load(area);
                              }
                            },
                          ]);
                        }} accessibilityRole="button">
                        <Text style={S.cancelBtnTxt}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Reminder type info cards */}
            <Text style={S.subSectionLabel}>What you can set per collection</Text>
            <View style={S.typeCards}>
              {Object.entries(USER_REMINDER_CONFIG).map(([key, cfg]) => (
                <View key={key} style={S.typeCard}>
                  <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={S.typeCardLabel}>{cfg.label}</Text>
                    <Text style={S.typeCardDesc}>{cfg.desc}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Next collection — shortcut to set reminder */}
            {nextCollection && (
              <TouchableOpacity style={S.nextCard}
                onPress={() => navigation.navigate("SetReminder", { schedule: nextCollection })}
                accessibilityRole="button">
                <Text style={{ fontSize: 26 }}>{getWC(nextCollection.wasteType).emoji}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={S.nextType}>Next: {nextCollection.wasteType}</Text>
                  <Text style={S.nextDate}>{fmtDate(nextCollection.nd)} · {nextCollection.collectionTime || "06:00 AM"}</Text>
                </View>
                <View style={S.nextActionBtn}>
                  <Text style={S.nextActionBtnTxt}>🔔 Set</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* ── SECTION 2: AUTHORITY ALERTS ─────────────────────────── */}
            <View style={S.sectionHeader}>
              <Text style={S.sectionTitle}>📢 Authority Alerts</Text>
              <Text style={S.sectionSub}>Pushed by Waste Authority — holiday, route & weather updates</Text>
            </View>

            {/* Visibility toggles */}
            <View style={S.toggleCard}>
              <Text style={S.toggleCardTitle}>Show/Hide Alert Types</Text>
              {Object.entries(AUTHORITY_ALERT_CONFIG).map(([key, cfg]) => (
                <View key={key} style={S.toggleRow}>
                  <View style={[S.toggleIcon, { backgroundColor: cfg.bg }]}>
                    <Text style={{ fontSize: 15 }}>{cfg.emoji}</Text>
                  </View>
                  <Text style={S.toggleLabel}>{cfg.label}</Text>
                  <Switch
                    value={visibility[key] !== false}
                    onValueChange={() => toggleVisibility(key)}
                    trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY + "60" }}
                    thumbColor={visibility[key] !== false ? COLORS.PRIMARY : COLORS.TEXT_DISABLED}
                    accessibilityLabel={`Toggle ${cfg.label}`}
                  />
                </View>
              ))}
            </View>

            {/* Authority alerts list */}
            {visibleAlerts.length === 0 ? (
              <View style={S.emptyCard}>
                <Text style={{ fontSize: 32 }}>✅</Text>
                <Text style={S.emptyTitle}>No active alerts</Text>
                <Text style={S.emptySub}>No holiday, route or weather alerts for your area.</Text>
              </View>
            ) : visibleAlerts.map((r, i) => {
              const cfg = getAC(r.type);
              return (
                <View key={r._id || i} style={[S.alertCard, { borderLeftColor: cfg.color, backgroundColor: cfg.bg }]}>
                  <View style={S.alertTop}>
                    <View style={[S.alertIcon, { backgroundColor: cfg.color + "22" }]}>
                      <Text style={{ fontSize: 18 }}>{cfg.emoji}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.alertTitle}>{r.title}</Text>
                      <Text style={S.alertMeta}>{cfg.label} · {timeAgo(r.broadcastAt)}</Text>
                    </View>
                    {r.severity === "critical" && (
                      <View style={S.sevPill}><Text style={S.sevPillTxt}>🚨 CRITICAL</Text></View>
                    )}
                    {r.severity === "warning" && (
                      <View style={[S.sevPill, { backgroundColor: "#FEF3C7" }]}>
                        <Text style={[S.sevPillTxt, { color: "#92400E" }]}>⚠️ WARNING</Text>
                      </View>
                    )}
                  </View>
                  <Text style={S.alertMsg}>{r.message}</Text>
                  {r.affectedDate && (
                    <View style={S.alertDateRow}>
                      <Text style={S.alertDateIcon}>📅</Text>
                      <Text style={S.alertDateTxt}>Affected: {r.affectedDate}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:             { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:           { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:          { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  backIcon:         { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:        { flex: 1 },
  headerTitle:      { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:        { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  areaBar:          { backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  areaBarContent:   { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: "row", alignItems: "center" },
  areaChip:         { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  areaChipOn:       { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  areaChipTxt:      { fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "600", lineHeight: 20 },
  areaChipTxtOn:    { color: "#fff", fontWeight: "700" },
  criticalBanner:   { flexDirection: "row", alignItems: "center", backgroundColor: "#FEF2F2", borderBottomWidth: 2, borderBottomColor: "#EF4444", paddingHorizontal: 14, paddingVertical: 9, gap: 10 },
  criticalTitle:    { fontSize: 12, fontWeight: "800", color: "#991B1B" },
  criticalMsg:      { fontSize: 11, color: "#7F1D1D", marginTop: 1 },
  loader:           { alignItems: "center", paddingTop: 60, gap: 12 },
  loaderTxt:        { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  sectionHeader:    { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 6 },
  sectionTitle:     { fontSize: 15, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  sectionSub:       { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  subSectionLabel:  { fontSize: 11, fontWeight: "700", color: COLORS.TEXT_SECONDARY, paddingHorizontal: 16, marginTop: 12, marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 },
  emptyCard:        { alignItems: "center", padding: 28, backgroundColor: COLORS.SURFACE, borderRadius: 14, marginHorizontal: 16, borderWidth: 1, borderColor: COLORS.BORDER, marginBottom: 12 },
  emptyTitle:       { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 8 },
  emptySub:         { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 4, textAlign: "center" },
  emptyBtn:         { marginTop: 12, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  emptyBtnTxt:      { color: "#fff", fontWeight: "700", fontSize: 12 },
  // Local reminders
  remindersCard:    { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  remindersCardTitle:{ fontSize: 12, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, padding: 12, paddingBottom: 8 },
  localReminderRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  localReminderBorder:{ borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  localReminderDot: { width: 8, height: 8, borderRadius: 4 },
  localReminderLabel:{ fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  localReminderTime:{ fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  cancelBtn:        { padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 },
  cancelBtnTxt:     { fontSize: 11, color: COLORS.ERROR, fontWeight: "700" },
  // Type info cards
  typeCards:        { paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  typeCard:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, gap: 10, borderWidth: 1, borderColor: COLORS.BORDER },
  typeCardLabel:    { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  typeCardDesc:     { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  // Next collection shortcut
  nextCard:         { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 14, padding: 14, marginHorizontal: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  nextType:         { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  nextDate:         { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  nextActionBtn:    { backgroundColor: COLORS.PRIMARY, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  nextActionBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 12 },
  // Toggle card
  toggleCard:       { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginHorizontal: 16, marginBottom: 12, padding: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  toggleCardTitle:  { fontSize: 12, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  toggleRow:        { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER, gap: 10 },
  toggleIcon:       { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  toggleLabel:      { flex: 1, fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  // Alert cards
  alertCard:        { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 14, borderLeftWidth: 4 },
  alertTop:         { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  alertIcon:        { width: 38, height: 38, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  alertTitle:       { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  alertMeta:        { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  alertMsg:         { fontSize: 12, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },
  alertDateRow:     { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  alertDateIcon:    { fontSize: 12 },
  alertDateTxt:     { fontSize: 11, color: COLORS.TEXT_SECONDARY },
  sevPill:          { backgroundColor: "#FEE2E2", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  sevPillTxt:       { fontSize: 9, fontWeight: "800", color: "#991B1B" },
});
