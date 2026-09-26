import React, { useCallback, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { getGoal, updateGoalProgress } from "../../services/goalService";
import { useGoalResource, useGoalAction } from "../../hooks/useGoals";
import { GoalHeader, GoalButton, GoalField, GoalError, GoalLoading, GoalProgress, styles } from "../../components/goals/GoalUI";
import { formatAmount, percentage, newRequestId } from "./goalUtils";

export default function UpdateGoalProgressScreen({ navigation, route }) {
  const { goalId } = route.params;
  const load = useCallback(() => getGoal(goalId), [goalId]);
  const { data: goal, loading, error, reload } = useGoalResource(load);
  const action = useGoalAction();
  const [amount, setAmount] = useState(null);
  const [note, setNote] = useState("");
  const request = useRef(null);
  const remaining = goal ? Math.max(0, Math.round((goal.targetAmount - goal.currentProgress) * 100) / 100) : 0;
  const value = amount === null ? String(Math.min(1, remaining)) : amount;
  const number = Number(value);
  const setValue = next => { setAmount(next); request.current = null; };
  const preview = goal ? Math.min(goal.targetAmount, goal.currentProgress + (Number.isFinite(number) && number > 0 ? number : 0)) : 0;
  const save = () => action.run(async () => {
    if (!Number.isFinite(number) || number <= 0 || number > remaining || Math.abs(number * 100 - Math.round(number * 100)) > 0.000001) throw new Error(`Enter an amount between 0.01 and ${formatAmount(remaining)}, with at most two decimals.`);
    // Retain the key on network failure so retrying cannot double-count progress.
    if (!request.current) request.current = newRequestId();
    const result = await updateGoalProgress(goalId, { amountAdded: number, note: note.trim(), requestId: request.current });
    navigation.navigate("GoalDetails", { goalId, feedback: result.goal.status === "completed" ? "Goal completed! Great work toward a cleaner environment." : "Progress updated successfully!" });
  });
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <GoalHeader title="Update Progress" subtitle="Every small action makes a difference" navigation={navigation} disabled={action.busy} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <GoalError message={error} retry={reload} /><GoalError message={action.error} />
      {loading && !goal ? <GoalLoading /> : goal && <>
        <View style={styles.card}><Text style={styles.title}>{goal.title}</Text><Text style={styles.body}>Current: {formatAmount(goal.currentProgress)} / {formatAmount(goal.targetAmount)} {goal.unit}</Text><GoalProgress value={percentage(goal)} /></View>
        {goal.status !== "active" ? <View style={styles.card}><Text style={styles.body}>This goal is {goal.status}. Progress updates are only available for active goals.</Text><GoalButton title="Back to Goal" secondary onPress={() => navigation.goBack()} /></View> : <>
          <View style={styles.card}>
            <Text style={styles.title}>Progress to Add</Text>
            <View style={styles.row}>
              <TouchableOpacity style={[styles.iconButton, styles.choice]} accessibilityRole="button" accessibilityLabel="Decrease progress" disabled={action.busy || number <= 0.01} onPress={() => setValue(String(Math.max(0.01, Math.round(((Number.isFinite(number) ? number : 1) - 1) * 100) / 100)))}><Icon name="minus" size={24} color={COLORS.PRIMARY} /></TouchableOpacity>
              <View style={{ flex: 1 }}><GoalField label={`Amount (${goal.unit})`} value={value} onChangeText={setValue} keyboardType="decimal-pad" maxLength={10} editable={!action.busy} /></View>
              <TouchableOpacity style={[styles.iconButton, styles.choice]} accessibilityRole="button" accessibilityLabel="Increase progress" disabled={action.busy || number >= remaining} onPress={() => setValue(String(Math.min(remaining, Math.round(((Number.isFinite(number) ? number : 0) + 1) * 100) / 100)))}><Icon name="plus" size={24} color={COLORS.PRIMARY} /></TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>{formatAmount(remaining)} {goal.unit} remaining. Decimal amounts are welcome.</Text>
            <GoalField label="Optional Note" value={note} onChangeText={text => { setNote(text); request.current = null; }} placeholder="e.g. Used my reusable bottle today" multiline maxLength={500} editable={!action.busy} />
            <Text style={styles.label}>After this update: {formatAmount(preview)} / {formatAmount(goal.targetAmount)} {goal.unit}</Text><GoalProgress value={percentage({ ...goal, currentProgress: preview })} large />
          </View>
          <GoalButton title="Save Progress" busy={action.busy} onPress={save} /><GoalButton title="Cancel" secondary disabled={action.busy} onPress={() => navigation.goBack()} />
        </>}
      </>}
    </ScrollView></KeyboardAvoidingView>
  </SafeAreaView>;
}
