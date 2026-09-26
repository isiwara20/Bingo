import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { GoalButton, styles as shared } from "./GoalUI";
import { formatDate, today, validDate } from "../../screens/goals/goalUtils";

export default function GoalDateField({ label, value, onChange, disabled, error }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(today().slice(0, 7));
  const [year, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1));
  const count = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const cells = [...Array(first.getUTCDay()).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];
  const move = offset => { const d = new Date(Date.UTC(year, m - 1 + offset, 1)); setMonth(d.toISOString().slice(0, 7)); };
  return <View style={{ gap: 7 }}>
    <Text style={shared.label}>{label}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} accessibilityValue={{ text: value }} disabled={disabled} style={[shared.input, shared.spread, error && { borderColor: COLORS.ERROR }]} onPress={() => { setMonth((validDate(value) ? value : today()).slice(0, 7)); setOpen(true); }}><Text style={shared.body}>{formatDate(value)}</Text><Icon name="calendar-month-outline" size={22} color={COLORS.PRIMARY} /></TouchableOpacity>
    {!!error && <Text style={shared.errorText}>{error}</Text>}
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={s.overlay}><View style={s.sheet} accessibilityViewIsModal>
        <Text style={shared.title}>{label}</Text>
        <View style={shared.spread}><TouchableOpacity style={shared.iconButton} accessibilityRole="button" accessibilityLabel="Previous month" onPress={() => move(-1)}><Icon name="chevron-left" size={24} color={COLORS.PRIMARY} /></TouchableOpacity><Text style={shared.label}>{first.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" })}</Text><TouchableOpacity style={shared.iconButton} accessibilityRole="button" accessibilityLabel="Next month" onPress={() => move(1)}><Icon name="chevron-right" size={24} color={COLORS.PRIMARY} /></TouchableOpacity></View>
        <View style={s.grid}>{["S", "M", "T", "W", "T", "F", "S"].map((day, i) => <Text key={i} style={s.weekDay}>{day}</Text>)}{cells.map((day, i) => {
          const date = `${month}-${String(day).padStart(2, "0")}`;
          return <TouchableOpacity key={i} disabled={!day} style={[s.day, value === date && s.selected]} accessibilityRole="button" accessibilityLabel={day ? formatDate(date) : undefined} accessibilityState={{ selected: value === date }} onPress={() => { onChange(date); setOpen(false); }}><Text style={{ color: value === date ? COLORS.TEXT_INVERSE : COLORS.TEXT_PRIMARY }}>{day || ""}</Text></TouchableOpacity>;
        })}</View>
        <GoalButton title="Close calendar" secondary onPress={() => setOpen(false)} />
      </View></View>
    </Modal>
  </View>;
}
const s = StyleSheet.create({ overlay: { flex: 1, backgroundColor: COLORS.OVERLAY, justifyContent: "center", padding: 12 }, sheet: { backgroundColor: COLORS.SURFACE, borderRadius: 18, padding: 12, gap: 12, width: "100%", maxWidth: 440, alignSelf: "center" }, grid: { flexDirection: "row", flexWrap: "wrap" }, weekDay: { width: "14.2857%", textAlign: "center", color: COLORS.TEXT_SECONDARY, fontSize: 12, paddingVertical: 8 }, day: { width: "14.2857%", minHeight: 48, alignItems: "center", justifyContent: "center", borderRadius: 24 }, selected: { backgroundColor: COLORS.PRIMARY } });
