/**
 * BinGo – Schedule Form Screen (Member 3)
 * Create or edit a collection schedule.
 * Accessible by: waste_authority, admin
 */
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createSchedule, updateSchedule } from "../services/scheduleService";
import COLORS from "../constants/colors";

const WASTE_TYPES = [
  "General Waste", "Recycling", "Organic Waste", "Garden Waste", "Hazardous Waste",
];
const DAYS = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];
const FREQUENCIES = ["weekly", "biweekly", "monthly"];
const AREAS = ["Colombo 03", "Colombo 05", "Colombo 07"];

const WASTE_CONFIG = {
  "General Waste":   { emoji: "🗑️", color: "#6B7280" },
  "Recycling":       { emoji: "♻️", color: "#1D6FA4" },
  "Organic Waste":   { emoji: "🌿", color: "#2D5016" },
  "Garden Waste":    { emoji: "🌱", color: "#4A7C28" },
  "Hazardous Waste": { emoji: "⚠️", color: "#DC2626" },
};

const TIMES = [
  "05:00 AM","06:00 AM","07:00 AM","08:00 AM","09:00 AM","10:00 AM",
  "11:00 AM","12:00 PM","01:00 PM","02:00 PM",
];

export default function ScheduleFormScreen({ navigation, route }) {
  const { mode, schedule, onDone } = route.params || {};
  const isEdit = mode === "edit";

  const [form, setForm] = useState({
    area:           schedule?.area           || "Colombo 03",
    wasteType:      schedule?.wasteType      || "General Waste",
    collectionDay:  schedule?.collectionDay  || "Monday",
    collectionTime: schedule?.collectionTime || "06:00 AM",
    frequency:      schedule?.frequency      || "weekly",
    notes:          schedule?.notes          || "",
    isActive:       schedule?.isActive !== undefined ? schedule.isActive : true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const e = {};
    if (!form.area) e.area = "Area is required";
    if (!form.wasteType) e.wasteType = "Waste type is required";
    if (!form.collectionDay) e.collectionDay = "Collection day is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (isEdit) {
        await updateSchedule(schedule._id, form);
        Alert.alert("Updated", "Schedule updated successfully.", [
          { text: "OK", onPress: () => { onDone?.(); navigation.goBack(); } },
        ]);
      } else {
        await createSchedule(form);
        Alert.alert("Created", "New schedule created successfully.", [
          { text: "OK", onPress: () => { onDone?.(); navigation.goBack(); } },
        ]);
      }
    } catch (err) {
      Alert.alert("Error", err.message || "Could not save schedule.");
    } finally {
      setSaving(false);
    }
  };

  const cfg = WASTE_CONFIG[form.wasteType] || { emoji: "🗑️", color: COLORS.PRIMARY };

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={[S.header, { backgroundColor: cfg.color }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>{isEdit ? "Edit Schedule" : "New Schedule"}</Text>
          <Text style={S.headerSub}>{isEdit ? `Editing ${schedule?.wasteType}` : "Create a collection schedule"}</Text>
        </View>
        <Text style={{ fontSize: 32 }}>{cfg.emoji}</Text>
      </View>

      <ScrollView style={S.scroll} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Progress indicator */}
        <View style={S.progressBar}>
          {["Location","Type","Schedule","Details"].map((step, i) => (
            <View key={step} style={S.progressStep}>
              <View style={[S.progressDot, { backgroundColor: cfg.color }]}>
                <Text style={S.progressDotTxt}>{i + 1}</Text>
              </View>
              <Text style={S.progressLbl}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Area */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>📍 Service Area</Text>
          <View style={S.optionGrid}>
            {AREAS.map((a) => (
              <TouchableOpacity key={a}
                style={[S.optionChip, form.area === a && { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }]}
                onPress={() => set("area", a)} accessibilityRole="button">
                <Text style={[S.optionChipTxt, form.area === a && { color: "#fff", fontWeight: "700" }]}>
                  {a}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.area && <Text style={S.errTxt}>{errors.area}</Text>}
        </View>

        {/* Waste type */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>♻️ Waste Type</Text>
          <View style={S.typeGrid}>
            {WASTE_TYPES.map((t) => {
              const tc = WASTE_CONFIG[t];
              const active = form.wasteType === t;
              return (
                <TouchableOpacity key={t}
                  style={[S.typeCard, active && { borderColor: tc.color, backgroundColor: tc.color + "12" }]}
                  onPress={() => set("wasteType", t)} accessibilityRole="button">
                  <Text style={{ fontSize: 24 }}>{tc.emoji}</Text>
                  <Text style={[S.typeCardTxt, active && { color: tc.color, fontWeight: "700" }]}>
                    {t.split(" ")[0]}
                  </Text>
                  {active && <View style={[S.typeCardCheck, { backgroundColor: tc.color }]}>
                    <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>✓</Text>
                  </View>}
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.wasteType && <Text style={S.errTxt}>{errors.wasteType}</Text>}
        </View>

        {/* Day of week */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>📅 Collection Day</Text>
          <View style={S.dayGrid}>
            {DAYS.map((d) => (
              <TouchableOpacity key={d}
                style={[S.dayChip, form.collectionDay === d && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                onPress={() => set("collectionDay", d)} accessibilityRole="button">
                <Text style={[S.dayChipTxt, form.collectionDay === d && { color: "#fff", fontWeight: "700" }]}>
                  {d.slice(0, 3)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.collectionDay && <Text style={S.errTxt}>{errors.collectionDay}</Text>}
        </View>

        {/* Time */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>⏰ Collection Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}>
            {TIMES.map((t) => (
              <TouchableOpacity key={t}
                style={[S.timeChip, form.collectionTime === t && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                onPress={() => set("collectionTime", t)} accessibilityRole="button">
                <Text style={[S.timeChipTxt, form.collectionTime === t && { color: "#fff", fontWeight: "700" }]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Frequency */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>🔄 Frequency</Text>
          <View style={S.freqRow}>
            {FREQUENCIES.map((f) => (
              <TouchableOpacity key={f}
                style={[S.freqBtn, form.frequency === f && { backgroundColor: cfg.color, borderColor: cfg.color }]}
                onPress={() => set("frequency", f)} accessibilityRole="button">
                <Text style={[S.freqBtnTxt, form.frequency === f && { color: "#fff", fontWeight: "700" }]}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </Text>
                <Text style={[S.freqBtnSub, form.frequency === f && { color: "rgba(255,255,255,0.8)" }]}>
                  {f === "weekly" ? "Every week" : f === "biweekly" ? "Every 2 weeks" : "Once a month"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notes */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>📝 Notes / Instructions</Text>
          <TextInput
            style={S.textInput}
            value={form.notes}
            onChangeText={(v) => set("notes", v)}
            placeholder="e.g. Place bin outside by 6 AM. Rinse recyclables."
            placeholderTextColor={COLORS.TEXT_DISABLED}
            multiline
            numberOfLines={3}
            maxLength={500}
            accessibilityLabel="Notes"
          />
          <Text style={S.charCount}>{form.notes.length}/500</Text>
        </View>

        {/* Status toggle (edit only) */}
        {isEdit && (
          <View style={S.section}>
            <Text style={S.sectionTitle}>🔘 Status</Text>
            <View style={S.toggleRow}>
              <TouchableOpacity
                style={[S.toggleBtn, form.isActive && S.toggleBtnOn]}
                onPress={() => set("isActive", true)} accessibilityRole="button">
                <Text style={[S.toggleBtnTxt, form.isActive && S.toggleBtnTxtOn]}>● Active</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[S.toggleBtn, !form.isActive && { ...S.toggleBtnOn, backgroundColor: COLORS.ERROR, borderColor: COLORS.ERROR }]}
                onPress={() => set("isActive", false)} accessibilityRole="button">
                <Text style={[S.toggleBtnTxt, !form.isActive && S.toggleBtnTxtOn]}>○ Inactive</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Preview card */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>👁 Preview</Text>
          <View style={[S.previewCard, { borderLeftColor: cfg.color }]}>
            <View style={[S.previewStrip, { backgroundColor: cfg.color }]}>
              <Text style={{ fontSize: 24 }}>{cfg.emoji}</Text>
              <Text style={S.previewType}>{form.wasteType}</Text>
            </View>
            <View style={S.previewBody}>
              <Text style={S.previewRow}>📍 {form.area}</Text>
              <Text style={S.previewRow}>📅 Every {form.collectionDay} at {form.collectionTime}</Text>
              <Text style={S.previewRow}>🔄 {form.frequency?.charAt(0).toUpperCase() + form.frequency?.slice(1)}</Text>
              {form.notes ? <Text style={S.previewRow}>📋 {form.notes}</Text> : null}
            </View>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={[S.saveBtn, { backgroundColor: cfg.color }, saving && S.saveBtnDisabled]}
          onPress={handleSave} disabled={saving}
          accessibilityRole="button" accessibilityLabel={isEdit ? "Update schedule" : "Create schedule"}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={S.saveBtnTxt}>{isEdit ? "💾 Update Schedule" : "✅ Create Schedule"}</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={S.cancelBtn} onPress={() => navigation.goBack()}
          accessibilityRole="button">
          <Text style={S.cancelBtnTxt}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:           { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:        { padding: 6, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 8 },
  backIcon:       { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:      { flex: 1 },
  headerTitle:    { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:      { fontSize: 11, color: "rgba(255,255,255,0.75)", marginTop: 1 },
  scroll:         { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  // Progress
  progressBar:    { flexDirection: "row", justifyContent: "space-between", backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  progressStep:   { alignItems: "center", gap: 4 },
  progressDot:    { width: 24, height: 24, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  progressDotTxt: { color: "#fff", fontSize: 11, fontWeight: "800" },
  progressLbl:    { fontSize: 9, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  // Section
  section:        { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.BORDER, elevation: 1 },
  sectionTitle:   { fontSize: 12, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 },
  // Options
  optionGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  optionChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  optionChipTxt:  { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  // Waste type grid
  typeGrid:       { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeCard:       { width: "30%", alignItems: "center", padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND, position: "relative" },
  typeCardTxt:    { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 4, textAlign: "center" },
  typeCardCheck:  { position: "absolute", top: 4, right: 4, width: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  // Day grid
  dayGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip:        { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  dayChipTxt:     { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "600" },
  // Time chips
  timeChip:       { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  timeChipTxt:    { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  // Frequency
  freqRow:        { flexDirection: "row", gap: 8 },
  freqBtn:        { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND, alignItems: "center" },
  freqBtnTxt:     { fontSize: 13, color: COLORS.TEXT_PRIMARY, fontWeight: "600" },
  freqBtnSub:     { fontSize: 10, color: COLORS.TEXT_DISABLED, marginTop: 3 },
  // Notes
  textInput:      { borderWidth: 1.5, borderColor: COLORS.BORDER, borderRadius: 12, padding: 12, fontSize: 13, color: COLORS.TEXT_PRIMARY, minHeight: 80, textAlignVertical: "top", backgroundColor: COLORS.BACKGROUND },
  charCount:      { fontSize: 11, color: COLORS.TEXT_DISABLED, textAlign: "right", marginTop: 4 },
  // Toggle
  toggleRow:      { flexDirection: "row", gap: 10 },
  toggleBtn:      { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, borderColor: COLORS.BORDER, alignItems: "center" },
  toggleBtnOn:    { backgroundColor: COLORS.SUCCESS, borderColor: COLORS.SUCCESS },
  toggleBtnTxt:   { fontSize: 13, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },
  toggleBtnTxtOn: { color: "#fff", fontWeight: "700" },
  // Preview
  previewCard:    { borderRadius: 14, overflow: "hidden", borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.BORDER },
  previewStrip:   { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  previewType:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  previewBody:    { padding: 12, gap: 6 },
  previewRow:     { fontSize: 13, color: COLORS.TEXT_PRIMARY },
  // Buttons
  saveBtn:        { borderRadius: 14, paddingVertical: 15, alignItems: "center", marginBottom: 10, elevation: 3 },
  saveBtnDisabled:{ opacity: 0.6 },
  saveBtnTxt:     { color: "#fff", fontSize: 15, fontWeight: "800" },
  cancelBtn:      { paddingVertical: 12, alignItems: "center" },
  cancelBtnTxt:   { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  // Error
  errTxt:         { color: COLORS.ERROR, fontSize: 12, marginTop: 4 },
});
