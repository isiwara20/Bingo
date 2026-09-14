/**
 * BinGo – Alert Management Screen (Member 3 – Feature 2)
 * Accessible by: waste_authority, admin
 * Create/edit/deactivate route change, weather delay, holiday alerts
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl, TextInput, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getAllReminders, createReminder, updateReminder, deleteReminder } from "../services/reminderService";
import COLORS from "../constants/colors";

const AUTHORITY_TYPES = ["route_change", "weather_delay", "holiday_alert"];
const ALL_TYPES       = ["morning_reminder","one_hour_reminder","missed_collection","route_change","weather_delay","holiday_alert"];
const AREAS           = ["Colombo 03", "Colombo 05", "Colombo 07"];
const SEVERITIES      = ["info", "warning", "critical"];

const REMINDER_CONFIG = {
  morning_reminder:  { emoji: "🌅", color: "#F59E0B", label: "Morning Reminder"   },
  one_hour_reminder: { emoji: "⏰", color: "#3B82F6", label: "1-Hour Reminder"    },
  missed_collection: { emoji: "⚠️", color: "#EF4444", label: "Missed Collection"  },
  holiday_alert:     { emoji: "🗓️", color: "#8B5CF6", label: "Holiday Alert"      },
  route_change:      { emoji: "🛣️", color: "#06B6D4", label: "Route Change"       },
  weather_delay:     { emoji: "🌧️", color: "#6366F1", label: "Weather Delay"      },
};
const getRC = (t) => REMINDER_CONFIG[t] || { emoji: "🔔", color: COLORS.PRIMARY, label: t };

const SEV_COLORS = {
  info:     { bg: "#EFF6FF", text: "#1E40AF" },
  warning:  { bg: "#FEF3C7", text: "#92400E" },
  critical: { bg: "#FEF2F2", text: "#991B1B" },
};

const timeAgo = (date) => {
  const mins = Math.round((Date.now() - new Date(date)) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

const EMPTY_FORM = {
  type: "route_change",
  area: "Colombo 03",
  title: "",
  message: "",
  affectedDate: "",
  severity: "info",
  isActive: true,
};

export default function AlertManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [reminders, setReminders]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterArea, setFilterArea] = useState("All Areas");
  const [filterType, setFilterType] = useState("All");
  const [showModal, setShowModal]   = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);

  const load = useCallback(async () => {
    try {
      const area = filterArea === "All Areas" ? "" : filterArea;
      const type = filterType === "All" ? "" : filterType;
      setReminders(await getAllReminders(area, type));
    } catch { Alert.alert("Error", "Could not load alerts."); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filterArea, filterType]);

  useEffect(() => { setLoading(true); load(); }, [filterArea, filterType]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      type:         item.type,
      area:         item.area,
      title:        item.title,
      message:      item.message,
      affectedDate: item.affectedDate || "",
      severity:     item.severity,
      isActive:     item.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert("Error", "Title is required."); return; }
    if (!form.message.trim()) { Alert.alert("Error", "Message is required."); return; }
    setSaving(true);
    try {
      if (editItem) {
        await updateReminder(editItem._id, form);
      } else {
        await createReminder(form);
      }
      setShowModal(false);
      load();
    } catch (e) {
      Alert.alert("Error", e.message || "Could not save alert.");
    } finally { setSaving(false); }
  };

  const handleDelete = (item) => {
    if (!isAdmin) return;
    Alert.alert(
      "Deactivate Alert",
      `Delete "${item.title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeleting(item._id);
            try { await deleteReminder(item._id); load(); }
            catch { Alert.alert("Error", "Could not deactivate."); }
            finally { setDeleting(null); }
          },
        },
      ]
    );
  };

  // Stats
  const activeCount   = reminders.filter(r => r.isActive).length;
  const criticalCount = reminders.filter(r => r.severity === "critical" && r.isActive).length;
  const todayCount    = reminders.filter(r => {
    const d = new Date(r.broadcastAt);
    const n = new Date();
    return d.getDate() === n.getDate() && d.getMonth() === n.getMonth();
  }).length;

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}>
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Alert Management</Text>
          <Text style={S.headerSub}>{isAdmin ? "Admin" : "Waste Authority"}</Text>
        </View>
        <TouchableOpacity style={S.addBtn} onPress={openCreate}
          accessibilityRole="button" accessibilityLabel="Create new alert">
          <Text style={S.addBtnTxt}>＋ Alert</Text>
        </TouchableOpacity>
      </View>

      {/* Role banner */}
      <View style={[S.roleBanner, { backgroundColor: isAdmin ? "#FEF3C7" : "#E0F2FE" }]}>
        <Text style={S.roleBannerIcon}>{isAdmin ? "👑" : "🏛️"}</Text>
        <Text style={[S.roleBannerTxt, { color: isAdmin ? "#92400E" : "#075985" }]}>
          {isAdmin ? "Admin — full alert control" : "Waste Authority — broadcast route, weather & holiday alerts"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}>

        {/* Stats */}
        <View style={S.statsRow}>
          <View style={[S.statCard, { borderTopColor: COLORS.SUCCESS }]}>
            <Text style={S.statNum}>{activeCount}</Text>
            <Text style={S.statLbl}>Active</Text>
          </View>
          <View style={[S.statCard, { borderTopColor: COLORS.ERROR }]}>
            <Text style={[S.statNum, { color: COLORS.ERROR }]}>{criticalCount}</Text>
            <Text style={S.statLbl}>Critical</Text>
          </View>
          <View style={[S.statCard, { borderTopColor: COLORS.INFO }]}>
            <Text style={[S.statNum, { color: COLORS.INFO }]}>{todayCount}</Text>
            <Text style={S.statLbl}>Today</Text>
          </View>
          <View style={[S.statCard, { borderTopColor: COLORS.ACCENT }]}>
            <Text style={[S.statNum, { color: COLORS.ACCENT }]}>{reminders.length}</Text>
            <Text style={S.statLbl}>Total</Text>
          </View>
        </View>

        {/* Area filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={S.filterBar} contentContainerStyle={S.filterBarContent}>
          {["All Areas", ...AREAS].map(a => (
            <TouchableOpacity key={a} style={[S.chip, filterArea === a && S.chipOn]}
              onPress={() => setFilterArea(a)} accessibilityRole="button">
              <Text style={[S.chipTxt, filterArea === a && S.chipTxtOn]}>
                {a === "All Areas" ? "🗺 All Areas" : `📍 ${a}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={S.filterBar} contentContainerStyle={S.filterBarContent}>
          {["All", ...ALL_TYPES].map(t => (
            <TouchableOpacity key={t} style={[S.chip, filterType === t && S.chipOn]}
              onPress={() => setFilterType(t)} accessibilityRole="button">
              <Text style={[S.chipTxt, filterType === t && S.chipTxtOn]}>
                {t === "All" ? "All Types" : `${getRC(t).emoji} ${getRC(t).label}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View style={S.listWrap}>
          {loading ? (
            <View style={S.loader}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={S.loaderTxt}>Loading alerts...</Text>
            </View>
          ) : reminders.length === 0 ? (
            <View style={S.emptyCard}>
              <Text style={{ fontSize: 40 }}>🔔</Text>
              <Text style={S.emptyTitle}>No alerts found</Text>
              <Text style={S.emptySub}>Tap "+ Alert" to broadcast a new alert.</Text>
              <TouchableOpacity style={S.emptyBtn} onPress={openCreate}>
                <Text style={S.emptyBtnTxt}>Create Alert</Text>
              </TouchableOpacity>
            </View>
          ) : reminders.map((item) => {
            const cfg = getRC(item.type);
            const sev = SEV_COLORS[item.severity] || SEV_COLORS.info;
            const isDel = deleting === item._id;
            return (
              <View key={item._id} style={[S.card, { borderLeftColor: cfg.color }, !item.isActive && S.cardInactive]}>
                <View style={S.cardTop}>
                  <View style={[S.cardIcon, { backgroundColor: cfg.color + "18" }]}>
                    <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                  </View>
                  <View style={S.cardMid}>
                    <Text style={S.cardTitle}>{item.title}</Text>
                    <Text style={S.cardArea}>📍 {item.area} · {timeAgo(item.broadcastAt)}</Text>
                  </View>
                  <View style={[S.sevBadge, { backgroundColor: sev.bg }]}>
                    <Text style={[S.sevBadgeTxt, { color: sev.text }]}>{item.severity}</Text>
                  </View>
                </View>
                <Text style={S.cardMsg}>{item.message}</Text>
                {item.affectedDate && (
                  <Text style={S.cardDate}>📅 Affected: {item.affectedDate}</Text>
                )}
                <View style={S.cardMeta}>
                  <View style={[S.typePill, { backgroundColor: cfg.color + "18" }]}>
                    <Text style={[S.typePillTxt, { color: cfg.color }]}>{cfg.label}</Text>
                  </View>
                  <View style={[S.statusPill, { backgroundColor: item.isActive ? "#DCFCE7" : "#FEE2E2" }]}>
                    <Text style={[S.statusPillTxt, { color: item.isActive ? "#166534" : "#991B1B" }]}>
                      {item.isActive ? "● Active" : "○ Inactive"}
                    </Text>
                  </View>
                </View>
                <View style={S.cardActions}>
                  <TouchableOpacity style={S.editBtn} onPress={() => openEdit(item)}
                    accessibilityRole="button">
                    <Text style={S.editBtnTxt}>✏️ Edit</Text>
                  </TouchableOpacity>
                  {isAdmin && (
                    <TouchableOpacity style={[S.deleteBtn, isDel && { opacity: 0.5 }]}
                      onPress={() => handleDelete(item)} disabled={isDel}
                      accessibilityRole="button">
                      {isDel
                        ? <ActivityIndicator size="small" color={COLORS.ERROR} />
                        : <Text style={S.deleteBtnTxt}>🗑️ Delete</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={S.modalOverlay}>
          <View style={S.modalCard}>
            <View style={S.modalHeader}>
              <Text style={S.modalTitle}>{editItem ? "Edit Alert" : "Broadcast Alert"}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} style={S.modalClose}
                accessibilityRole="button">
                <Text style={S.modalCloseTxt}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Type selector */}
              <Text style={S.fieldLabel}>Alert Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
                {(isAdmin ? ALL_TYPES : AUTHORITY_TYPES).map(t => {
                  const c = getRC(t);
                  const on = form.type === t;
                  return (
                    <TouchableOpacity key={t}
                      style={[S.typeChip, on && { backgroundColor: c.color, borderColor: c.color }]}
                      onPress={() => setForm(f => ({ ...f, type: t }))} accessibilityRole="button">
                      <Text style={{ fontSize: 14 }}>{c.emoji}</Text>
                      <Text style={[S.typeChipTxt, on && { color: "#fff", fontWeight: "700" }]}>
                        {c.label.split(" ")[0]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Area */}
              <Text style={S.fieldLabel}>Area</Text>
              <View style={S.optRow}>
                {AREAS.map(a => (
                  <TouchableOpacity key={a}
                    style={[S.optChip, form.area === a && S.optChipOn]}
                    onPress={() => setForm(f => ({ ...f, area: a }))} accessibilityRole="button">
                    <Text style={[S.optChipTxt, form.area === a && S.optChipTxtOn]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Severity */}
              <Text style={S.fieldLabel}>Severity</Text>
              <View style={S.optRow}>
                {SEVERITIES.map(sv => {
                  const sc = SEV_COLORS[sv];
                  const on = form.severity === sv;
                  return (
                    <TouchableOpacity key={sv}
                      style={[S.optChip, on && { backgroundColor: sc.bg, borderColor: sc.text }]}
                      onPress={() => setForm(f => ({ ...f, severity: sv }))} accessibilityRole="button">
                      <Text style={[S.optChipTxt, on && { color: sc.text, fontWeight: "700" }]}>
                        {sv.charAt(0).toUpperCase() + sv.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Title */}
              <Text style={S.fieldLabel}>Title *</Text>
              <TextInput style={S.input}
                value={form.title}
                onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder="e.g. Route Change Notice"
                placeholderTextColor={COLORS.TEXT_DISABLED}
                maxLength={100}
                accessibilityLabel="Alert title"
              />
              <Text style={S.charCount}>{form.title.length}/100</Text>

              {/* Message */}
              <Text style={S.fieldLabel}>Message *</Text>
              <TextInput style={[S.input, { minHeight: 80, textAlignVertical: "top" }]}
                value={form.message}
                onChangeText={v => setForm(f => ({ ...f, message: v }))}
                placeholder="Detailed alert message for residents..."
                placeholderTextColor={COLORS.TEXT_DISABLED}
                multiline
                numberOfLines={4}
                maxLength={500}
                accessibilityLabel="Alert message"
              />
              <Text style={S.charCount}>{form.message.length}/500</Text>

              {/* Affected Date (holiday only) */}
              {(form.type === "holiday_alert") && (
                <>
                  <Text style={S.fieldLabel}>Affected Date</Text>
                  <TextInput style={S.input}
                    value={form.affectedDate}
                    onChangeText={v => setForm(f => ({ ...f, affectedDate: v }))}
                    placeholder="e.g. 14 Apr 2026"
                    placeholderTextColor={COLORS.TEXT_DISABLED}
                    accessibilityLabel="Affected date"
                  />
                </>
              )}

              {/* Preview */}
              {form.title.length > 0 && (
                <View style={[S.preview, { borderLeftColor: getRC(form.type).color }]}>
                  <Text style={S.previewLabel}>Preview</Text>
                  <Text style={S.previewTitle}>{getRC(form.type).emoji} {form.title}</Text>
                  <Text style={S.previewMsg}>{form.message}</Text>
                </View>
              )}

              <TouchableOpacity style={[S.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave} disabled={saving}
                accessibilityRole="button">
                {saving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={S.saveBtnTxt}>{editItem ? "💾 Update Alert" : "📢 Broadcast Alert"}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:            { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header:          { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.HEADER_BG, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  backBtn:         { padding: 6, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 8 },
  backIcon:        { fontSize: 18, color: "#fff", fontWeight: "700" },
  headerMid:       { flex: 1 },
  headerTitle:     { fontSize: 17, fontWeight: "700", color: "#fff" },
  headerSub:       { fontSize: 11, color: COLORS.PRIMARY_TINT, marginTop: 1 },
  addBtn:          { backgroundColor: COLORS.ACCENT, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  addBtnTxt:       { color: "#fff", fontWeight: "800", fontSize: 12 },
  roleBanner:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  roleBannerIcon:  { fontSize: 16 },
  roleBannerTxt:   { fontSize: 12, fontWeight: "600", flex: 1 },
  statsRow:        { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 14, marginBottom: 4 },
  statCard:        { flex: 1, backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 10, alignItems: "center", borderTopWidth: 3, elevation: 1 },
  statNum:         { fontSize: 20, fontWeight: "800", color: COLORS.PRIMARY },
  statLbl:         { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  filterBar:       { maxHeight: 52, paddingTop: 8 },
  filterBarContent:{ paddingHorizontal: 16, gap: 8, flexDirection: "row", alignItems: "center" },
  chip:            { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE },
  chipOn:          { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  chipTxt:         { fontSize: 11, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  chipTxtOn:       { color: "#fff", fontWeight: "700" },
  listWrap:        { paddingHorizontal: 16, paddingTop: 12 },
  loader:          { alignItems: "center", paddingTop: 50, gap: 12 },
  loaderTxt:       { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  emptyCard:       { alignItems: "center", padding: 32, backgroundColor: COLORS.SURFACE, borderRadius: 14, borderWidth: 1, borderColor: COLORS.BORDER },
  emptyTitle:      { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 10 },
  emptySub:        { fontSize: 12, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 4 },
  emptyBtn:        { marginTop: 14, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 },
  emptyBtnTxt:     { color: "#fff", fontWeight: "700", fontSize: 13 },
  card:            { backgroundColor: COLORS.SURFACE, borderRadius: 14, marginBottom: 12, borderLeftWidth: 4, elevation: 2, borderWidth: 1, borderColor: COLORS.BORDER },
  cardInactive:    { opacity: 0.55 },
  cardTop:         { flexDirection: "row", alignItems: "flex-start", padding: 12, gap: 10 },
  cardIcon:        { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  cardMid:         { flex: 1 },
  cardTitle:       { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  cardArea:        { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  sevBadge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  sevBadgeTxt:     { fontSize: 10, fontWeight: "700", textTransform: "capitalize" },
  cardMsg:         { fontSize: 12, color: COLORS.TEXT_PRIMARY, paddingHorizontal: 12, marginBottom: 6, lineHeight: 17 },
  cardDate:        { fontSize: 11, color: COLORS.TEXT_SECONDARY, paddingHorizontal: 12, marginBottom: 8 },
  cardMeta:        { flexDirection: "row", gap: 8, paddingHorizontal: 12, paddingBottom: 10 },
  typePill:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  typePillTxt:     { fontSize: 10, fontWeight: "600" },
  statusPill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillTxt:   { fontSize: 10, fontWeight: "700" },
  cardActions:     { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  editBtn:         { flex: 1, paddingVertical: 11, alignItems: "center", borderRightWidth: 1, borderRightColor: COLORS.DIVIDER },
  editBtnTxt:      { fontSize: 13, fontWeight: "700", color: COLORS.PRIMARY },
  deleteBtn:       { flex: 1, paddingVertical: 11, alignItems: "center", backgroundColor: "#FEF2F2" },
  deleteBtnTxt:    { fontSize: 13, fontWeight: "700", color: COLORS.ERROR },
  // Modal
  modalOverlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalCard:       { backgroundColor: COLORS.SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%", paddingBottom: 36 },
  modalHeader:     { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  modalTitle:      { flex: 1, fontSize: 17, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  modalClose:      { padding: 6 },
  modalCloseTxt:   { fontSize: 16, color: COLORS.TEXT_SECONDARY },
  fieldLabel:      { fontSize: 11, fontWeight: "800", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8, marginTop: 12 },
  typeChip:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, gap: 5 },
  typeChipTxt:     { fontSize: 12, color: COLORS.TEXT_SECONDARY },
  optRow:          { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optChip:         { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: COLORS.BORDER, backgroundColor: COLORS.BACKGROUND },
  optChipOn:       { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  optChipTxt:      { fontSize: 12, color: COLORS.TEXT_PRIMARY, fontWeight: "500" },
  optChipTxtOn:    { color: "#fff", fontWeight: "700" },
  input:           { borderWidth: 1.5, borderColor: COLORS.BORDER, borderRadius: 12, padding: 12, fontSize: 13, color: COLORS.TEXT_PRIMARY, backgroundColor: COLORS.BACKGROUND, marginBottom: 2 },
  charCount:       { fontSize: 10, color: COLORS.TEXT_DISABLED, textAlign: "right", marginBottom: 4 },
  preview:         { backgroundColor: COLORS.PRIMARY_TINT, borderRadius: 12, padding: 12, borderLeftWidth: 3, marginTop: 12, marginBottom: 4 },
  previewLabel:    { fontSize: 10, fontWeight: "700", color: COLORS.TEXT_SECONDARY, textTransform: "uppercase", marginBottom: 6 },
  previewTitle:    { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  previewMsg:      { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },
  saveBtn:         { backgroundColor: COLORS.PRIMARY, borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  saveBtnTxt:      { color: "#fff", fontSize: 14, fontWeight: "800" },
});
