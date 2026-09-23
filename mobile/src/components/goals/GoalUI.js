import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";

export const GoalButton = ({ title, onPress, secondary, danger, busy, disabled, icon, style }) => (
  <TouchableOpacity onPress={onPress} disabled={disabled || busy} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: !!(disabled || busy), busy: !!busy }} style={[styles.button, secondary && styles.secondary, danger && { backgroundColor: COLORS.ERROR }, (disabled || busy) && { opacity: 0.55 }, style]}>
    {busy ? <ActivityIndicator color={secondary ? COLORS.PRIMARY : COLORS.TEXT_INVERSE} /> : <>{icon && <Icon name={icon} size={20} color={secondary ? COLORS.PRIMARY : COLORS.TEXT_INVERSE} />}<Text style={[styles.buttonText, secondary && { color: COLORS.PRIMARY }]}>{title}</Text></>}
  </TouchableOpacity>
);
export const GoalHeader = ({ title, subtitle, navigation, right, disabled }) => (
  <View style={styles.header}>
    <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()} disabled={disabled} accessibilityRole="button" accessibilityLabel="Go back"><Icon name="arrow-left" color={COLORS.TEXT_PRIMARY} size={24} /></TouchableOpacity>
    <View style={{ flex: 1 }}><Text style={styles.headerTitle} accessibilityRole="header">{title}</Text>{subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}</View>
    {right}
  </View>
);
export const GoalProgress = ({ value, large }) => {
  const progress = Math.min(100, Math.max(0, value || 0));
  return <View style={[styles.track, large && { height: 14 }]} accessibilityRole="progressbar" accessibilityLabel="Goal progress" accessibilityValue={{ min: 0, max: 100, now: progress }}><View style={[styles.fill, { width: `${progress}%` }]} /></View>;
};
export const GoalError = ({ message, retry }) => !message ? null : (
  <View style={styles.errorBox}><Text style={styles.errorText} accessibilityRole="alert">{message}</Text>{retry && <GoalButton title="Try again" secondary onPress={retry} />}</View>
);
export const GoalLoading = () => <View style={styles.empty}><ActivityIndicator color={COLORS.PRIMARY} size="large" /><Text style={styles.body}>Loading your goals…</Text></View>;
export const GoalEmpty = ({ title, message, action, actionTitle = "Create First Goal" }) => (
  <View style={styles.empty}><View style={styles.iconCircle}><Icon name="sprout" size={36} color={COLORS.PRIMARY} /></View><Text style={styles.title}>{title}</Text><Text style={[styles.body, { textAlign: "center" }]}>{message}</Text>{action && <GoalButton title={actionTitle} onPress={action} />}</View>
);
export const GoalField = ({ label, error, ...props }) => <View style={{ gap: 7 }}><Text style={styles.label}>{label}</Text><TextInput style={[styles.input, props.multiline && { minHeight: 96, textAlignVertical: "top" }, error && { borderColor: COLORS.ERROR }]} placeholderTextColor={COLORS.TEXT_SECONDARY} accessibilityLabel={label} {...props} />{!!error && <Text style={styles.errorText} accessibilityRole="alert">{error}</Text>}</View>;
export const GoalChoices = ({ label, values, value, onChange, disabled, error }) => <View style={{ gap: 8 }}><Text style={styles.label}>{label}</Text><View style={styles.choices}>{values.map(option => <TouchableOpacity key={option} style={[styles.choice, value === option && styles.choiceActive]} disabled={disabled} onPress={() => onChange(option)} accessibilityRole="radio" accessibilityState={{ selected: value === option }} accessibilityLabel={`${label}: ${option}`}><Text style={[styles.choiceText, value === option && { color: COLORS.PRIMARY_DARK, fontWeight: "700" }]}>{option}</Text></TouchableOpacity>)}</View>{!!error && <Text style={styles.errorText}>{error}</Text>}</View>;
export const GoalStat = ({ label, value }) => <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
export const GoalStatus = ({ status }) => <View style={[styles.status, status === "cancelled" && { backgroundColor: COLORS.BACKGROUND }]}><Text style={[styles.statusText, status === "cancelled" && { color: COLORS.TEXT_SECONDARY }]}>{status === "completed" ? "✓ Completed" : status === "cancelled" ? "Cancelled" : "Active"}</Text></View>;

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.BACKGROUND }, content: { padding: 16, paddingBottom: 32, gap: 16 },
  header: { paddingHorizontal: 8, paddingVertical: 12, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.SURFACE, borderBottomWidth: 1, borderBottomColor: COLORS.BORDER },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_PRIMARY }, subtitle: { fontSize: 12, lineHeight: 18, color: COLORS.TEXT_SECONDARY, marginTop: 3 },
  iconButton: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: COLORS.SURFACE, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.BORDER, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 }, spread: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" },
  title: { fontSize: 17, fontWeight: "700", color: COLORS.TEXT_PRIMARY }, body: { fontSize: 14, lineHeight: 22, color: COLORS.TEXT_SECONDARY }, label: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  button: { minHeight: 48, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.PRIMARY, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  buttonText: { color: COLORS.TEXT_INVERSE, fontSize: 14, fontWeight: "700", textAlign: "center" }, secondary: { backgroundColor: COLORS.SURFACE, borderWidth: 1, borderColor: COLORS.PRIMARY },
  input: { minHeight: 50, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 12, color: COLORS.TEXT_PRIMARY, backgroundColor: COLORS.SURFACE, fontSize: 15 },
  track: { height: 8, borderRadius: 8, backgroundColor: "#E8F5E9", overflow: "hidden", width: "100%" }, fill: { height: "100%", borderRadius: 8, backgroundColor: COLORS.PRIMARY },
  empty: { padding: 24, gap: 16, alignItems: "center" }, iconCircle: { width: 64, height: 64, borderRadius: 20, backgroundColor: "#E8F5E9", alignItems: "center", justifyContent: "center" },
  choices: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, choice: { minHeight: 44, borderWidth: 1, borderColor: COLORS.BORDER, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 12, backgroundColor: COLORS.SURFACE, justifyContent: "center" }, choiceActive: { borderColor: COLORS.PRIMARY, backgroundColor: "#E8F5E9" }, choiceText: { color: COLORS.TEXT_SECONDARY, fontSize: 13 },
  errorBox: { padding: 14, borderRadius: 12, backgroundColor: "#FFEBEE", gap: 12 }, errorText: { color: "#B71C1C", fontSize: 13, lineHeight: 20 },
  stat: { flex: 1, minWidth: 75, alignItems: "center", gap: 4 }, statValue: { color: COLORS.PRIMARY, fontSize: 24, fontWeight: "800" }, statLabel: { color: COLORS.TEXT_SECONDARY, fontSize: 11, textAlign: "center" },
  status: { alignSelf: "flex-start", backgroundColor: "#E8F5E9", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 }, statusText: { color: COLORS.PRIMARY_DARK, fontWeight: "600", fontSize: 11 },
});
