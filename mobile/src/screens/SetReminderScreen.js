/**
 * BinGo – Set Reminder Screen (Member 3 – Feature 2)
 * Accessible by: resident
 * User picks reminder time(s) for a specific collection schedule.
 * Fires a local notification with sound at the chosen time.
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import COLORS from "../constants/colors";
import {
  scheduleCollectionReminder,
  cancelReminder,
  cancelAllRemindersForSchedule,
  getRemindersForSchedule,
} from "../services/localReminderService";

const WASTE_CONFIG = {
  "General Waste":   { emoji: "🗑️", color: "#6B7280" },
  "Recycling":       { emoji: "♻️", color: "#1D6FA4" },
  "Organic Waste":   { emoji: "🌿", color: "#2D5016" },
  "Garden Waste":    { emoji: "🌱", color: "#4A7C28" },
  "Hazardous Waste": { emoji: "⚠️", color: "#DC2626" },
};
const getWC = (t) => WASTE_CONFIG[t] || { emoji: "🗑️", color: COLORS.PRIMARY };

// Preset reminder times relative to collection
const PRESET_TIMES = [
  { label: "Night Before",  sublabel: "9:00 PM previous evening", hour: 21, minute: 0  },
  { label: "Morning",       sublabel: "6:00 AM on collection day", hour: 6,  minute: 0  },
  { label: "1 Hour Before", sublabel: "1 hour before collection",  hour: -1, minute: 0, relative: true },
  { label: "30 Min Before", sublabel: "30 minutes before",         hour: -1, minute: -30, relative: true },
];

// Custom time picker options
const HOURS   = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const fmtTime = (h, m) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh   = h % 12 === 0 ? 12 : h % 12;
  const mm   = String(m).padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
};

export default function SetReminderScreen({ navigation, route }) {
  const { schedule } = route.params || {};
  const cfg = getWC(schedule?.wasteType);

  const [savedReminders, setSaved]  = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [customHour, setCustomHour] = useState(7);
  const [customMin, setCustomMin]   = useState(0);
  const [showCustom, setShowCustom] = useState(false);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = async () => {
    setLoading(true);
    const reminders = await getRemindersForSchedule(schedule._id);
    setSaved(reminders);
    setLoading(false);
  };

  const isSet = (hour, minute) =>
    savedReminders.some(r => r.hour === hour && r.minute === minute);

  const handlePreset = async (preset) => {
    if (!schedule) return;

    let hour   = preset.hour;
    let minute = preset.minute;

    // Relative time: subtract from collection time
    if (preset.relative && schedule.collectionTime) {
      const match = schedule.collectionTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let h = parseInt(match[1]);
        const m = parseInt(match[2]);
        if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
        if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
        // Subtract
        let totalMins = h * 60 + m + preset.minute; // preset.minute is negative for "before"
        if (totalMins < 0) totalMins += 24 * 60;
        hour   = Math.floor(totalMins / 60) % 24;
        minute = totalMins % 60;
      }
    }

    if (isSet(hour, minute)) {
      // Already set — cancel it
      const existing = savedReminders.find(r => r.hour === hour && r.minute === minute);
      if (!existing) return;
      setCancelling(`${hour}_${minute}`);
      try {
        await cancelReminder(schedule._id, existing.notifId);
        await loadSaved();
        Alert.alert("Removed", `"${preset.label}" reminder cancelled.`);
      } catch (e) {
        Alert.alert("Error", e.message);
      } finally { setCancelling(null); }
      return;
    }

    setSaving(`${hour}_${minute}`);
    try {
      await scheduleCollectionReminder({
        scheduleId:    schedule._id,
        wasteType:     schedule.wasteType,
        area:          schedule.area,
        collectionDay: schedule.collectionDay,
        collectionTime: schedule.collectionTime || "06:00 AM",
        reminderHour:  hour,
        reminderMinute: minute,
        label:         preset.label,
      });
      await loadSaved();
      Alert.alert(
        "✅ Reminder Set!",
        `You'll be reminded at ${fmtTime(hour, minute)} every ${schedule.collectionDay}.`
      );
    } catch (e) {
      Alert.alert("Error", e.message || "Could not set reminder. Check notification permissions.");
    } finally { setSaving(null); }
  };

  const handleCustom = async () => {
    if (isSet(customHour, customMin)) {
      Alert.alert("Already Set", `A reminder at ${fmtTime(customHour, customMin)} is already active.`);
      return;
    }
    setSaving("custom");
    try {
      await scheduleCollectionReminder({
        scheduleId:    schedule._id,
        wasteType:     schedule.wasteType,
        area:          schedule.area,
        collectionDay: schedule.collectionDay,
        collectionTime: schedule.collectionTime || "06:00 AM",
        reminderHour:  customHour,
        reminderMinute: customMin,
        label:         `Custom (${fmtTime(customHour, customMin)})`,
      });
      await loadSaved();
      setShowCustom(false);
      Alert.alert(
        "✅ Reminder Set!",
        `Custom reminder at ${fmtTime(customHour, customMin)} every ${schedule.collectionDay}.`
      );
    } catch (e) {
      Alert.alert("Error", e.message || "Could not set reminder.");
    } finally { setSaving(null); }
  };

  const handleCancelAll = () => {
    if (savedReminders.length === 0) return;
    Alert.alert(
      "Cancel All Reminders",
      `Remove all ${savedReminders.length} reminder(s) for ${schedule.wasteType}?`,
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove All", style: "destructive",
          onPress: async () => {
            await cancelAllRemindersForSchedule(schedule._id);
            await loadSaved();
          },
        },
      ]
    );
  };

  if (!schedule) return null;

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: cfg.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Set Reminder</Text>
          <Text style={S.headerSub}>{schedule.wasteType} · {schedule.collectionDay}</Text>
        </View>
        <Text style={{ fontSize: 30 }}>{cfg.emoji}</Text>
      </View>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Schedule info card */}
        <View style={[S.infoCard, { borderLeftColor: cfg.color }]}>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📅</Text>
            <Text style={S.infoTxt}>Collection every <Text style={S.infoBold}>{schedule.collectionDay}</Text></Text>
          </View>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>⏰</Text>
            <Text style={S.infoTxt}>Collection at <Text style={S.infoBold}>{schedule.collectionTime || "06:00 AM"}</Text></Text>
          </View>
          <View style={S.infoRow}>
            <Text style={S.infoIcon}>📍</Text>
            <Text style={S.infoTxt}>{schedule.area}</Text>
          </View>
        </View>

        {/* Active reminders */}
        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 20 }} />
        ) : savedReminders.length > 0 && (
          <View style={S.activeSection}>
            <View style={S.activeSectionHeader}>
              <Text style={S.sectionLabel}>Active Reminders</Text>
              <TouchableOpacity onPress={handleCancelAll} accessibilityRole="button">
                <Text style={S.cancelAllTxt}>Cancel All</Text>
              </TouchableOpacity>
            </View>
            {savedReminders.map((r, i) => (
              <View key={i} style={[S.activeCard, { borderLeftColor: cfg.color }]}>
                <Text style={S.activeCardIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={S.activeCardLabel}>{r.label}</Text>
                  <Text style={S.activeCardTime}>{fmtTime(r.hour, r.minute)} every {schedule.collectionDay}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => cancelReminder(schedule._id, r.notifId).then(loadSaved)}
                  style={S.activeCardCancel} accessibilityRole="button">
                  <Text style={S.activeCardCancelTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Preset times */}
        <Text style={S.sectionLabel}>Quick Reminders</Text>
        <Text style={S.sectionSub}>Tap to set — tap again to remove</Text>
        {PRESET_TIMES.map((preset, i) => {
          let h = preset.hour, m = preset.minute;
          if (preset.relative && schedule.collectionTime) {
            const match = schedule.collectionTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
            if (match) {
              let ch = parseInt(match[1]);
              const cm = parseInt(match[2]);
              if (match[3].toUpperCase() === "PM" && ch !== 12) ch += 12;
              if (match[3].toUpperCase() === "AM" && ch === 12) ch = 0;
              let totalMins = ch * 60 + cm + preset.minute;
              if (totalMins < 0) totalMins += 24 * 60;
              h = Math.floor(totalMins / 60) % 24;
              m = totalMins % 60;
            }
          }
          const set     = isSet(h, m);
          const loading = saving === `${h}_${m}` || cancelling === `${h}_${m}`;
          return (
            <TouchableOpacity key={i}
              style={[S.presetCard, set && { borderColor: cfg.color, backgroundColor: cfg.color + "10" }]}
              onPress={() => handlePreset(preset)} disabled={!!saving || !!cancelling}
              accessibilityRole="button" accessibilityLabel={preset.label}>
              <View style={[S.presetLeft, { backgroundColor: set ? cfg.color : COLORS.BORDER }]}>
                <Text style={S.presetLeftTxt}>{set ? "✓" : "🔔"}</Text>
              </View>
              <View style={S.presetMid}>
                <Text style={[S.presetLabel, set && { color: cfg.color }]}>{preset.label}</Text>
                <Text style={S.presetSublabel}>{preset.sublabel}</Text>
                <Text style={[S.presetTime, { color: cfg.color }]}>{fmtTime(h, m)}</Text>
              </View>
              {loading
                ? <ActivityIndicator size="small" color={cfg.color} />
                : <View style={[S.presetToggle, { borderColor: cfg.color }]}>
                    <Text style={[S.presetToggleTxt, { color: set ? cfg.color : COLORS.TEXT_DISABLED }]}>
                      {set ? "ON" : "OFF"}
                    </Text>
                  </View>}
            </TouchableOpacity>
          );
        })}

        {/* Custom time */}
        <TouchableOpacity style={S.customToggleBtn} onPress={() => setShowCustom(v => !v)}
          accessibilityRole="button">
          <Text style={S.customToggleTxt}>
            {showCustom ? "▲ Hide custom time" : "⚙️ Set custom time"}
          </Text>
        </TouchableOpacity>

        {showCustom && (
          <View style={S.customCard}>
            <Text style={S.customTitle}>Choose Your Time</Text>
            {/* Hour picker */}
            <Text style={S.pickerLabel}>Hour</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.pickerRow}>
              {HOURS.map(h => (
                <TouchableOpacity key={h}
                  style={[S.pickerChip, customHour === h && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setCustomHour(h)} accessibilityRole="button">
                  <Text style={[S.pickerChipTxt, customHour === h && { color: "#fff", fontWeight: "700" }]}>
                    {fmtTime(h, 0).split(":")[0] + (h < 12 ? " AM" : " PM")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Minute picker */}
            <Text style={S.pickerLabel}>Minute</Text>
            <View style={S.pickerRow}>
              {MINUTES.map(m => (
                <TouchableOpacity key={m}
                  style={[S.pickerChip, customMin === m && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                  onPress={() => setCustomMin(m)} accessibilityRole="button">
                  <Text style={[S.pickerChipTxt, customMin === m && { color: "#fff", fontWeight: "700" }]}>
                    :{String(m).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {/* Preview */}
            <View style={[S.customPreview, { backgroundColor: cfg.color + "12", borderColor: cfg.color }]}>
              <Text style={S.customPreviewIcon}>🔔</Text>
              <Text style={[S.customPreviewTxt, { color: cfg.color }]}>
                Remind me at {fmtTime(customHour, customMin)} every {schedule.collectionDay}
              </Text>
            </View>
            <TouchableOpacity style={[S.customSaveBtn, { backgroundColor: cfg.color }, saving === "custom" && { opacity: 0.6 }]}
              onPress={handleCustom} disabled={saving === "custom"}
              accessibilityRole="button">
              {saving === "custom"
                ? <ActivityIndicator color="#fff" />
                : <Text style={S.customSaveBtnTxt}>✅ Set Custom Reminder</Text>}
            </TouchableOpacity>
          </View>
        )}

        {/* Note */}
        <View style={S.noteCard}>
          <Text style={S.noteIcon}>ℹ️</Text>
          <Text style={S.noteTxt}>
            Reminders repeat every {schedule.collectionDay} until you cancel them.
            They work even when the app is closed.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:              { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:           { padding: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 },
  backIcon:          { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:         { flex: 1 },
  headerTitle:       { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:         { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  scroll:            { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  infoCard:          { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 16, borderLeftWidth: 4, elevation: 1, gap: 8 },
  infoRow:           { flexDirection: "row", alignItems: "center", gap: 8 },
  infoIcon:          { fontSize: 14 },
  infoTxt:           { fontSize: 13, color: COLORS.TEXT_PRIMARY },
  infoBold:          { fontWeight: "700" },
  activeSection:     { marginBottom: 16 },
  activeSectionHeader:{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cancelAllTxt:      { fontSize: 12, color: COLORS.ERROR, fontWeight: "600" },
  activeCard:        { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, elevation: 1, gap: 10 },
  activeCardIcon:    { fontSize: 18 },
  activeCardLabel:   { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  activeCardTime:    { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  activeCardCancel:  { padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 },
  activeCardCancelTxt:{ fontSize: 12, color: COLORS.ERROR, fontWeight: "700" },
  sectionLabel:      { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  sectionSub:        { fontSize: 11, color: COLORS.TEXT_DISABLED, marginBottom: 12 },
  presetCard:        { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1.5, borderColor: COLORS.BORDER, gap: 12, elevation: 1 },
  presetLeft:        { width: 38, height: 38, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  presetLeftTxt:     { fontSize: 16, color: "#fff" },
  presetMid:         { flex: 1 },
  presetLabel:       { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  presetSublabel:    { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  presetTime:        { fontSize: 12, fontWeight: "600", marginTop: 3 },
  presetToggle:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1.5 },
  presetToggleTxt:   { fontSize: 11, fontWeight: "800" },
  customToggleBtn:   { alignItems: "center", paddingVertical: 12, marginBottom: 4 },
  customToggleTxt:   { fontSize: 13, color: COLORS.PRIMARY, fontWeight: "600" },
  customCard:        { backgroundColor: COLORS.SURFACE, borderRadius: 16, padding: 16, marginBottom: 14, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER },
  customTitle:       { fontSize: 14, fontWeight: "800", color: COLORS.TEXT_PRIMARY, marginBottom: 12 },
  pickerLabel:       { fontSize: 11, fontWeight: "700", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
  pickerRow:         { flexDirection: "row", gap: 8, marginBottom: 14 },
  pickerChip:        { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  pickerChipTxt:     { fontSize: 12, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  customPreview:     { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  customPreviewIcon: { fontSize: 16 },
  customPreviewTxt:  { fontSize: 13, fontWeight: "600", flex: 1 },
  customSaveBtn:     { borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  customSaveBtnTxt:  { color: "#fff", fontSize: 14, fontWeight: "800" },
  noteCard:          { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 12, padding: 12, marginTop: 4 },
  noteIcon:          { fontSize: 14 },
  noteTxt:           { flex: 1, fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },
});
