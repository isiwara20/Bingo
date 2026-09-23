import React from "react";
import { View, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { GoalButton, GoalProgress, GoalStatus, styles } from "./GoalUI";
import { formatAmount, formatDate, percentage, dateOnly, today } from "../../screens/goals/goalUtils";
export default function GoalCard({ goal, onPress }) {
  const complete = goal.status === "completed";
  const overdue = goal.status === "active" && dateOnly(goal.targetDate) < today();
  return <View style={styles.card}>
    <View style={styles.row}><View style={styles.iconCircle}><Icon name={complete ? "check-circle-outline" : goal.icon} size={29} color={COLORS.PRIMARY} /></View><View style={{ flex: 1, gap: 4 }}><Text style={styles.title}>{goal.title}</Text><Text style={styles.subtitle}>{goal.category}</Text></View></View>
    <View style={styles.spread}><Text style={styles.label}>{formatAmount(goal.currentProgress)} / {formatAmount(goal.targetAmount)} {goal.unit}</Text><Text style={[styles.label, { color: COLORS.PRIMARY }]}>{percentage(goal)}%</Text></View>
    <GoalProgress value={percentage(goal)} />
    <View style={styles.spread}><Text style={styles.subtitle}>{complete ? `Completed: ${formatDate(goal.completedAt)}` : `Target: ${formatDate(goal.targetDate)}`}</Text><GoalStatus status={goal.status} /></View>
    {complete && <Text style={[styles.label, { color: COLORS.PRIMARY }]}>Target achieved</Text>}
    {overdue && <Text style={styles.subtitle}>Past target date — you can keep going or adjust your goal.</Text>}
    <GoalButton title="View Details" secondary onPress={onPress} />
  </View>;
}
