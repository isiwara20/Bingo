/**
 * BinGo – Custom Reminder Screen (Member 3 – Feature 2)
 * 
 * Allows users to set custom reminders for any day/date and time.
 * Notifications work even when the app is closed.
 * 
 * This is for schedule reminder alert notifications (Member 3 responsibility).
 */
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Platform, TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PermissionsAndroid } from "react-native";
import COLORS from "../constants/colors";
import { scheduleCustomReminder, cancelCustomReminder, getCustomReminders, testNotification } from "../services/localReminderService";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 15, 30, 45];

const fmtTime = (h, m) => {
  const ampm = h >= 12 ? "PM" : "AM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  const mm = String(m).padStart(2, "0");
  return `${hh}:${mm} ${ampm}`;
};

const fmtDate = (date) => {
  return date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
};

export default function CustomReminderScreen({ navigation }) {
  const [savedReminders, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  
  // New reminder form
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [useDayOfWeek, setUseDayOfWeek] = useState(true);
  const [selectedDay, setSelectedDay] = useState(0); // Sunday
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);

  useEffect(() => {
    loadSaved();
    requestNotificationPermission();
  }, []);

  const requestNotificationPermission = async () => {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Notification Permission",
            message: "BinGo needs permission to send you custom reminders",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert(
            "Permission Required",
            "Notification permission is required to receive custom reminders."
          );
        }
      } catch (err) {
        console.warn("Notification permission error:", err);
      }
    }
  };

  const loadSaved = async () => {
    setLoading(true);
    const reminders = await getCustomReminders();
    setSaved(reminders);
    setLoading(false);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Title Required", "Please enter a title for your reminder.");
      return;
    }

    setSaving("save");
    try {
      const reminderData = {
        title: title.trim(),
        message: message.trim() || "Custom reminder",
        useDayOfWeek,
        dayOfWeek: useDayOfWeek ? DAYS[selectedDay] : null,
        date: !useDayOfWeek ? selectedDate.toISOString() : null,
        hour: selectedHour,
        minute: selectedMinute,
      };

      await scheduleCustomReminder(reminderData);
      await loadSaved();
      
      // Reset form
      setTitle("");
      setMessage("");
      setUseDayOfWeek(true);
      setSelectedDay(0);
      setSelectedDate(new Date());
      setSelectedHour(9);
      setSelectedMinute(0);

      Alert.alert("✅ Reminder Set!", `You'll be reminded at ${fmtTime(selectedHour, selectedMinute)}.`);
    } catch (e) {
      Alert.alert("Error", e.message || "Could not set reminder.");
    } finally {
      setSaving(null);
    }
  };

  const handleCancel = async (notifId) => {
    try {
      await cancelCustomReminder(notifId);
      await loadSaved();
      Alert.alert("Removed", "Reminder cancelled.");
    } catch (e) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Custom Reminders</Text>
          <Text style={S.headerSub}>Set reminders for any time</Text>
        </View>
        <Text style={{ fontSize: 30 }}>🔔</Text>
      </View>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Active reminders */}
        {loading ? (
          <ActivityIndicator color={COLORS.PRIMARY} style={{ marginTop: 20 }} />
        ) : savedReminders.length > 0 && (
          <View style={S.activeSection}>
            <Text style={S.sectionLabel}>Active Reminders</Text>
            {savedReminders.map((r, i) => (
              <View key={i} style={S.activeCard}>
                <Text style={S.activeCardIcon}>🔔</Text>
                <View style={{ flex: 1 }}>
                  <Text style={S.activeCardTitle}>{r.title}</Text>
                  <Text style={S.activeCardMessage}>{r.message}</Text>
                  <Text style={S.activeCardTime}>
                    {r.useDayOfWeek 
                      ? `Every ${r.dayOfWeek} at ${fmtTime(r.hour, r.minute)}`
                      : `${fmtDate(new Date(r.date))} at ${fmtTime(r.hour, r.minute)}`
                    }
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleCancel(r.notifId)}
                  style={S.activeCardCancel}>
                  <Text style={S.activeCardCancelTxt}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* New reminder form */}
        <Text style={S.sectionLabel}>Create New Reminder</Text>
        
        {/* Title input */}
        <View style={S.inputGroup}>
          <Text style={S.inputLabel}>Title *</Text>
          <TextInput
            style={S.input}
            placeholder="Enter reminder title..."
            placeholderTextColor={COLORS.TEXT_DISABLED}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Message input */}
        <View style={S.inputGroup}>
          <Text style={S.inputLabel}>Message (optional)</Text>
          <TextInput
            style={S.input}
            placeholder="Enter message..."
            placeholderTextColor={COLORS.TEXT_DISABLED}
            value={message}
            onChangeText={setMessage}
          />
        </View>

        {/* Day/Date toggle */}
        <View style={S.toggleRow}>
          <TouchableOpacity
            style={[S.toggleBtn, useDayOfWeek && { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => setUseDayOfWeek(true)}>
            <Text style={[S.toggleBtnTxt, useDayOfWeek && { color: "#fff" }]}>Repeat Weekly</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[S.toggleBtn, !useDayOfWeek && { backgroundColor: COLORS.PRIMARY }]}
            onPress={() => setUseDayOfWeek(false)}>
            <Text style={[S.toggleBtnTxt, !useDayOfWeek && { color: "#fff" }]}>One-Time Date</Text>
          </TouchableOpacity>
        </View>

        {/* Day of week picker */}
        {useDayOfWeek && (
          <View style={S.pickerSection}>
            <Text style={S.pickerLabel}>Day of Week</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.pickerRow}>
              {DAYS.map((day, i) => (
                <TouchableOpacity key={i}
                  style={[S.pickerChip, selectedDay === i && { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }]}
                  onPress={() => setSelectedDay(i)}>
                  <Text style={[S.pickerChipTxt, selectedDay === i && { color: "#fff", fontWeight: "700" }]}>
                    {day.substring(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Date picker (simplified) */}
        {!useDayOfWeek && (
          <View style={S.pickerSection}>
            <Text style={S.pickerLabel}>Date</Text>
            <TouchableOpacity style={S.dateBtn} onPress={() => {
              // For simplicity, just show current date
              // In production, use a proper date picker library
              Alert.alert("Date Selection", "Current date: " + fmtDate(selectedDate));
            }}>
              <Text style={S.dateBtnTxt}>{fmtDate(selectedDate)}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Time picker */}
        <View style={S.pickerSection}>
          <Text style={S.pickerLabel}>Time</Text>
          <View style={S.timeRow}>
            {/* Hour */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={S.pickerRow}>
              {HOURS.map(h => (
                <TouchableOpacity key={h}
                  style={[S.pickerChip, selectedHour === h && { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }]}
                  onPress={() => setSelectedHour(h)}>
                  <Text style={[S.pickerChipTxt, selectedHour === h && { color: "#fff", fontWeight: "700" }]}>
                    {fmtTime(h, 0).split(":")[0] + (h < 12 ? " AM" : " PM")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Minute */}
            <View style={S.minuteRow}>
              {MINUTES.map(m => (
                <TouchableOpacity key={m}
                  style={[S.pickerChip, selectedMinute === m && { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }]}
                  onPress={() => setSelectedMinute(m)}>
                  <Text style={[S.pickerChipTxt, selectedMinute === m && { color: "#fff", fontWeight: "700" }]}>
                    :{String(m).padStart(2, "0")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Preview */}
        <View style={S.previewCard}>
          <Text style={S.previewIcon}>🔔</Text>
          <Text style={S.previewTxt}>
            {title || "Reminder"} at {fmtTime(selectedHour, selectedMinute)}
            {useDayOfWeek ? ` every ${DAYS[selectedDay]}` : ` on ${fmtDate(selectedDate)}`}
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity 
          style={[S.saveBtn, saving === "save" && { opacity: 0.6 }]}
          onPress={handleSave} 
          disabled={saving === "save"}>
          {saving === "save"
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.saveBtnTxt}>✅ Set Reminder</Text>}
        </TouchableOpacity>

        {/* Note */}
        <View style={S.noteCard}>
          <Text style={S.noteIcon}>ℹ️</Text>
          <Text style={S.noteTxt}>
            Reminders work even when the app is closed. You'll receive a notification with sound at the scheduled time.
          </Text>
        </View>

        {/* Test notification button */}
        <TouchableOpacity 
          style={S.testBtn}
          onPress={() => {
            Alert.alert(
              "Test Notification",
              "A test notification will appear now with sound.",
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "OK", 
                  onPress: () => testNotification()
                }
              ]
            );
          }}>
          <Text style={S.testBtnTxt}>🔔 Test Notification Now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn: { padding: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 },
  backIcon: { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid: { flex: 1 },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub: { fontSize: 11, color: "rgba(255,255,255,0.8)", marginTop: 1 },
  scroll: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  activeSection: { marginBottom: 16 },
  sectionLabel: { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
  activeCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: COLORS.PRIMARY, elevation: 1, gap: 10 },
  activeCardIcon: { fontSize: 18 },
  activeCardTitle: { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  activeCardMessage: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  activeCardTime: { fontSize: 11, color: COLORS.PRIMARY, marginTop: 3, fontWeight: "600" },
  activeCardCancel: { padding: 6, backgroundColor: "#FEE2E2", borderRadius: 8 },
  activeCardCancelTxt: { fontSize: 12, color: COLORS.ERROR, fontWeight: "700" },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY, marginBottom: 6 },
  input: { backgroundColor: COLORS.SURFACE, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.BORDER, fontSize: 14, color: COLORS.TEXT_PRIMARY },
  toggleRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: "center" },
  toggleBtnTxt: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  pickerSection: { marginBottom: 16 },
  pickerLabel: { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY, marginBottom: 8 },
  pickerRow: { flexDirection: "row", gap: 8 },
  pickerChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  pickerChipTxt: { fontSize: 12, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  timeRow: { gap: 8 },
  minuteRow: { flexDirection: "row", gap: 8 },
  dateBtn: { backgroundColor: COLORS.SURFACE, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.BORDER, alignItems: "center" },
  dateBtnTxt: { fontSize: 14, color: COLORS.TEXT_PRIMARY, fontWeight: "600" },
  previewCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.PRIMARY },
  previewIcon: { fontSize: 16 },
  previewTxt: { flex: 1, fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  saveBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 16 },
  saveBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
  noteCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 12, padding: 12 },
  noteIcon: { fontSize: 14 },
  noteTxt: { flex: 1, fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },
  testBtn: { backgroundColor: COLORS.PRIMARY, borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 16, borderWidth: 2, borderColor: COLORS.PRIMARY },
  testBtnTxt: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
