/**
 * BinGo – Schedule Management Screen (Member 3)
 * Accessible by: waste_authority, admin
 * Admin: full CRUD  |  Waste Authority: create + update only
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { getSchedules, deleteSchedule } from "../services/scheduleService";
import COLORS from "../constants/colors";

const WASTE_CONFIG = {
  "General Waste":   { emoji: "🗑️", color: "#6B7280" },
  "Recycling":       { emoji: "♻️", color: "#1D6FA4" },
  "Organic Waste":   { emoji: "🌿", color: "#2D5016" },
  "Garden Waste":    { emoji: "🌱", color: "#4A7C28" },
  "Hazardous Waste": { emoji: "⚠️", color: "#DC2626" },
};
const getWC = (t) => WASTE_CONFIG[t] || { emoji: "🗑️", color: COLORS.PRIMARY };

const FREQ_COLORS = {
  weekly:    { bg: "#DCFCE7", text: "#166534" },
  biweekly:  { bg: "#DBEAFE", text: "#1E40AF" },
  monthly:   { bg: "#FEF3C7", text: "#92400E" },
};

const AREAS = ["All Areas", "Colombo 03", "Colombo 05", "Colombo 07"];

export default function ScheduleManagementScreen({ navigation }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const canManage = ["admin", "waste_authority"].includes(user?.role);

  const [schedules, setSchedules]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterArea, setFilterArea] = useState("All Areas");
  const [filterType, setFilterType] = useState("All");
  const [deleting, setDeleting]     = useState(null);

  const load = useCallback(async () => {
    try {
      const area = filterArea === "All Areas" ? "" : filterArea;
      setSchedules(await getSchedules(area));
    } catch {
      Alert.alert("Error", "Could not load schedules.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterArea]);

  useEffect(() => { setLoading(true); load(); }, [filterArea]);

  const onRefresh = () => { setRefreshing(true); load(); };

  const handleDelete = (item) => {
    if (!isAdmin) return;
    Alert.alert(
      "Delete Schedule",
      `Remove ${item.wasteType} collection for ${item.area}?\n\nThis cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            setDeleting(item._id);
            try {
              await deleteSchedule(item._id);
              setSchedules(prev => prev.filter(s => s._id !== item._id));
              Alert.alert("Deleted", "Schedule removed successfully.");
            } catch {
              Alert.alert("Error", "Could not delete schedule.");
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  const handleEdit = (item) => {
    navigation.navigate("ScheduleForm", { mode: "edit", schedule: item, onDone: load });
  };

  const handleCreate = () => {
    navigation.navigate("ScheduleForm", { mode: "create", onDone: load });
  };

  // Filter by type on client side
  const allTypes = ["All", ...new Set(schedules.map(s => s.wasteType))];
  const displayed = filterType === "All"
    ? schedules
    : schedules.filter(s => s.wasteType === filterType);

  // Stats
  const activeCount  = schedules.filter(s => s.isActive).length;
  const areaCount    = new Set(schedules.map(s => s.area)).size;
  const weeklyCount  = schedules.filter(s => s.frequency === "weekly").length;

  return (
    <SafeAreaView style={S.root}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.backBtn}
          accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={S.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={S.headerMid}>
          <Text style={S.headerTitle}>Schedule Management</Text>
          <Text style={S.headerSub}>{isAdmin ? "Admin" : "Waste Authority"} · Full Access</Text>
        </View>
        {canManage && (
          <TouchableOpacity style={S.addBtn} onPress={handleCreate}
            accessibilityRole="button" accessibilityLabel="Add new schedule">
            <Text style={S.addBtnTxt}>＋ Add</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Role badge */}
      <View style={[S.roleBanner, { backgroundColor: isAdmin ? "#FEF3C7" : "#E0F2FE" }]}>
        <Text style={S.roleBannerIcon}>{isAdmin ? "👑" : "🏛️"}</Text>
        <Text style={[S.roleBannerTxt, { color: isAdmin ? "#92400E" : "#075985" }]}>
          {isAdmin
            ? "Admin access — you can create, edit and delete schedules"
            : "Waste Authority access — you can create and edit schedules"}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.PRIMARY]} />}>

        {/* Stats row */}
        <View style={S.statsRow}>
          <View style={[S.statCard, { borderTopColor: COLORS.PRIMARY }]}>
            <Text style={S.statNum}>{activeCount}</Text>
            <Text style={S.statLbl}>Active</Text>
          </View>
          <View style={[S.statCard, { borderTopColor: COLORS.INFO }]}>
            <Text style={[S.statNum, { color: COLORS.INFO }]}>{areaCount}</Text>
            <Text style={S.statLbl}>Areas</Text>
          </View>
          <View style={[S.statCard, { borderTopColor: COLORS.SUCCESS }]}>
            <Text style={[S.statNum, { color: COLORS.SUCCESS }]}>{weeklyCount}</Text>
            <Text style={S.statLbl}>Weekly</Text>
          </View>
          <View style={[S.statCard, { borderTopColor: COLORS.ACCENT }]}>
            <Text style={[S.statNum, { color: COLORS.ACCENT }]}>{schedules.length}</Text>
            <Text style={S.statLbl}>Total</Text>
          </View>
        </View>

        {/* Area filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={S.filterBar} contentContainerStyle={S.filterBarContent}>
          {AREAS.map((a) => (
            <TouchableOpacity key={a} style={[S.chip, filterArea === a && S.chipOn]}
              onPress={() => setFilterArea(a)}>
              <Text style={[S.chipTxt, filterArea === a && S.chipTxtOn]}>
                {a === "All Areas" ? "🗺 All Areas" : `📍 ${a}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Type filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={S.filterBar} contentContainerStyle={S.filterBarContent}>
          {allTypes.map((t) => (
            <TouchableOpacity key={t} style={[S.chip, filterType === t && S.chipOn]}
              onPress={() => setFilterType(t)}>
              <Text style={[S.chipTxt, filterType === t && S.chipTxtOn]}>
                {t === "All" ? "All Types" : `${getWC(t).emoji} ${t.split(" ")[0]}`}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* List */}
        <View style={S.listWrap}>
          {loading ? (
            <View style={S.loader}>
              <ActivityIndicator size="large" color={COLORS.PRIMARY} />
              <Text style={S.loaderTxt}>Loading schedules...</Text>
            </View>
          ) : displayed.length === 0 ? (
            <View style={S.emptyCard}>
              <Text style={{ fontSize: 40 }}>📋</Text>
              <Text style={S.emptyTitle}>No schedules found</Text>
              <Text style={S.emptySub}>Tap "+ Add" to create the first schedule for this area.</Text>
              <TouchableOpacity style={S.emptyBtn} onPress={handleCreate}>
                <Text style={S.emptyBtnTxt}>Create Schedule</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayed.map((item) => {
              const cfg  = getWC(item.wasteType);
              const freq = FREQ_COLORS[item.frequency] || FREQ_COLORS.weekly;
              const isDeleting = deleting === item._id;
              return (
                <View key={item._id} style={[S.card, { borderLeftColor: cfg.color }, !item.isActive && S.cardInactive]}>
                  {/* Card header */}
                  <View style={S.cardTop}>
                    <View style={[S.cardIcon, { backgroundColor: cfg.color + "18" }]}>
                      <Text style={{ fontSize: 22 }}>{cfg.emoji}</Text>
                    </View>
                    <View style={S.cardMid}>
                      <Text style={S.cardType}>{item.wasteType}</Text>
                      <Text style={S.cardArea}>📍 {item.area}</Text>
                    </View>
                    <View style={[S.freqBadge, { backgroundColor: freq.bg }]}>
                      <Text style={[S.freqBadgeTxt, { color: freq.text }]}>
                        {item.frequency}
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={S.cardDetails}>
                    <View style={S.detailRow}>
                      <Text style={S.detailIcon}>📅</Text>
                      <Text style={S.detailLbl}>Collection Day</Text>
                      <Text style={S.detailVal}>{item.collectionDay}</Text>
                    </View>
                    <View style={S.detailRow}>
                      <Text style={S.detailIcon}>⏰</Text>
                      <Text style={S.detailLbl}>Time</Text>
                      <Text style={S.detailVal}>{item.collectionTime || "06:00 AM"}</Text>
                    </View>
                    {item.notes && (
                      <View style={S.detailRow}>
                        <Text style={S.detailIcon}>📋</Text>
                        <Text style={S.detailLbl}>Notes</Text>
                        <Text style={[S.detailVal, { flex: 1 }]}>{item.notes}</Text>
                      </View>
                    )}
                    <View style={S.detailRow}>
                      <Text style={S.detailIcon}>🔘</Text>
                      <Text style={S.detailLbl}>Status</Text>
                      <View style={[S.statusPill, { backgroundColor: item.isActive ? "#DCFCE7" : "#FEE2E2" }]}>
                        <Text style={[S.statusPillTxt, { color: item.isActive ? "#166534" : "#991B1B" }]}>
                          {item.isActive ? "● Active" : "● Inactive"}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={S.cardActions}>
                    <TouchableOpacity style={S.editBtn} onPress={() => handleEdit(item)}
                      accessibilityRole="button" accessibilityLabel={`Edit ${item.wasteType}`}>
                      <Text style={S.editBtnTxt}>✏️ Edit</Text>
                    </TouchableOpacity>
                    {isAdmin && (
                      <TouchableOpacity
                        style={[S.deleteBtn, isDeleting && S.deleteBtnDisabled]}
                        onPress={() => handleDelete(item)}
                        disabled={isDeleting}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${item.wasteType}`}>
                        {isDeleting
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <Text style={S.deleteBtnTxt}>🗑️ Delete</Text>}
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
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
  addBtn:          { backgroundColor: COLORS.ACCENT, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  addBtnTxt:       { color: "#fff", fontWeight: "800", fontSize: 13 },
  roleBanner:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 9, gap: 8, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  roleBannerIcon:  { fontSize: 16 },
  roleBannerTxt:   { fontSize: 12, fontWeight: "600", flex: 1 },
  statsRow:        { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingTop: 14, marginBottom: 4 },
  statCard:        { flex: 1, backgroundColor: COLORS.SURFACE, borderRadius: 12, padding: 10, alignItems: "center", borderTopWidth: 3, elevation: 1 },
  statNum:         { fontSize: 20, fontWeight: "800", color: COLORS.PRIMARY },
  statLbl:         { fontSize: 10, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  filterBar:       { maxHeight: 44, paddingTop: 8 },
  filterBarContent:{ paddingHorizontal: 16, gap: 8, flexDirection: "row" },
  chip:            { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: COLORS.BORDER, backgroundColor: COLORS.SURFACE },
  chipOn:          { backgroundColor: COLORS.PRIMARY, borderColor: COLORS.PRIMARY },
  chipTxt:         { fontSize: 12, color: COLORS.TEXT_SECONDARY, fontWeight: "500" },
  chipTxtOn:       { color: "#fff", fontWeight: "700" },
  listWrap:        { paddingHorizontal: 16, paddingTop: 12 },
  loader:          { alignItems: "center", paddingTop: 60, gap: 12 },
  loaderTxt:       { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  emptyCard:       { alignItems: "center", padding: 36, backgroundColor: COLORS.SURFACE, borderRadius: 16, borderWidth: 1, borderColor: COLORS.BORDER },
  emptyTitle:      { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginTop: 10 },
  emptySub:        { fontSize: 13, color: COLORS.TEXT_SECONDARY, textAlign: "center", marginTop: 6, lineHeight: 18 },
  emptyBtn:        { marginTop: 16, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 },
  emptyBtnTxt:     { color: "#fff", fontWeight: "700", fontSize: 13 },
  card:            { backgroundColor: COLORS.SURFACE, borderRadius: 16, marginBottom: 12, borderLeftWidth: 4, elevation: 3, borderWidth: 1, borderColor: COLORS.BORDER, overflow: "hidden" },
  cardInactive:    { opacity: 0.6 },
  cardTop:         { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  cardIcon:        { width: 48, height: 48, borderRadius: 14, justifyContent: "center", alignItems: "center" },
  cardMid:         { flex: 1 },
  cardType:        { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  cardArea:        { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  freqBadge:       { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  freqBadgeTxt:    { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  cardDetails:     { paddingHorizontal: 14, paddingBottom: 10, gap: 6, borderTopWidth: 1, borderTopColor: COLORS.DIVIDER, paddingTop: 10 },
  detailRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  detailIcon:      { fontSize: 13, width: 18 },
  detailLbl:       { fontSize: 12, color: COLORS.TEXT_SECONDARY, width: 100 },
  detailVal:       { fontSize: 12, color: COLORS.TEXT_PRIMARY, fontWeight: "600" },
  statusPill:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusPillTxt:   { fontSize: 11, fontWeight: "700" },
  cardActions:     { flexDirection: "row", borderTopWidth: 1, borderTopColor: COLORS.DIVIDER },
  editBtn:         { flex: 1, paddingVertical: 12, alignItems: "center", borderRightWidth: 1, borderRightColor: COLORS.DIVIDER },
  editBtnTxt:      { fontSize: 13, fontWeight: "700", color: COLORS.PRIMARY },
  deleteBtn:       { flex: 1, paddingVertical: 12, alignItems: "center", backgroundColor: "#FEF2F2" },
  deleteBtnDisabled:{ opacity: 0.5 },
  deleteBtnTxt:    { fontSize: 13, fontWeight: "700", color: COLORS.ERROR },
});
