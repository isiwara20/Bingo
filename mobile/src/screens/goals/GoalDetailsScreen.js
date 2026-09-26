import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { getGoal, getGoalHistory, cancelGoal, deleteGoal } from "../../services/goalService";
import { useGoalResource, useGoalAction } from "../../hooks/useGoals";
import { GoalHeader, GoalButton, GoalError, GoalLoading, GoalProgress, GoalStatus, styles } from "../../components/goals/GoalUI";
import { percentage, formatDate, formatAmount } from "./goalUtils";

export default function GoalDetailsScreen({ navigation, route }) {
  const { goalId } = route.params;
  const [menu, setMenu] = useState(false);
  const load = useCallback(async () => {
    const [goal, history] = await Promise.all([getGoal(goalId), getGoalHistory(goalId)]);
    return { goal, history };
  }, [goalId]);
  const { data, setData, loading, error, reload } = useGoalResource(load);
  const action = useGoalAction();
  const goal = data?.goal;
  const edit = () => { setMenu(false); navigation.navigate("EditGoal", { goalId }); };
  const destructive = type => {
    setMenu(false);
    Alert.alert(type === "delete" ? "Delete this goal?" : "Cancel this goal?", type === "delete" ? "This permanently removes the goal and its progress history. This cannot be undone." : "Your progress history will be kept, but you won’t be able to add more progress to this goal.", [
      { text: "Keep Goal", style: "cancel" },
      { text: type === "delete" ? "Delete Goal" : "Cancel Goal", style: "destructive", onPress: () => action.run(async () => {
        if (type === "delete") await deleteGoal(goalId); else await cancelGoal(goalId);
        navigation.navigate("MyEcoGoals", { status: type === "delete" ? "active" : "cancelled", feedback: type === "delete" ? "Goal deleted." : "Goal cancelled. Your history has been kept.", createdGoalId: null });
      }) },
    ]);
  };
  const more = () => action.run(async () => {
    const page = await getGoalHistory(goalId, data.history.page + 1);
    setData(old => ({ ...old, history: { ...page, entries: [...old.history.entries, ...page.entries] } }));
  });
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <GoalHeader title="Goal Details" navigation={navigation} disabled={action.busy} right={goal && <TouchableOpacity style={styles.iconButton} accessibilityRole="button" accessibilityLabel="Goal options" disabled={action.busy} onPress={() => setMenu(true)}><Icon name="dots-vertical" size={25} color={COLORS.TEXT_PRIMARY} /></TouchableOpacity>} />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} />}>
      <GoalError message={error} retry={reload} /><GoalError message={action.error} />
      {!!route.params.feedback && <Text style={[styles.card, styles.label, { color: COLORS.PRIMARY }]} accessibilityLiveRegion="polite">{route.params.feedback}</Text>}
      {loading && !data ? <GoalLoading /> : goal && <>
        <View style={styles.card}>
          <View style={styles.spread}><View style={styles.iconCircle}><Icon name={goal.icon} size={34} color={COLORS.PRIMARY} /></View><GoalStatus status={goal.status} /></View>
          <Text style={[styles.title, { fontSize: 24 }]}>{goal.title}</Text><Text style={[styles.label, { color: COLORS.PRIMARY }]}>{goal.category}</Text><Text style={styles.body}>{goal.description || "No description added."}</Text>
          <View style={{ alignItems: "center", paddingVertical: 18, gap: 6 }}><Text style={{ fontSize: 46, fontWeight: "800", color: COLORS.PRIMARY }}>{percentage(goal)}%</Text><Text style={styles.label}>{formatAmount(goal.currentProgress)} / {formatAmount(goal.targetAmount)} {goal.unit}</Text><Text style={styles.subtitle}>Completed</Text></View>
          <GoalProgress value={percentage(goal)} large />
          <Text style={styles.body}>Started: {formatDate(goal.startDate)}</Text><Text style={styles.body}>Target: {formatDate(goal.targetDate)}</Text><Text style={styles.body}>Goal period: {goal.period}</Text>
          {goal.completedAt && <Text style={[styles.label, { color: COLORS.PRIMARY }]}>Target achieved · {formatDate(goal.completedAt)}</Text>}
          {goal.status === "active" && <GoalButton title="Update Progress" icon="plus" onPress={() => navigation.navigate("UpdateGoalProgress", { goalId })} disabled={action.busy} />}
          <GoalButton title="Edit Goal" secondary onPress={edit} disabled={action.busy} />
        </View>
        <Text style={styles.title}>Progress History</Text>
        {!data.history.entries.length ? <View style={styles.card}><Text style={styles.body}>No progress updates yet. Your small steps will appear here.</Text></View> : data.history.entries.map(entry => <View key={entry._id} style={styles.card}>
          <View style={styles.spread}><Text style={styles.label}>{new Date(entry.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</Text><Text style={[styles.label, { color: COLORS.PRIMARY }]}>+{formatAmount(entry.amountAdded)} {entry.unit}</Text></View>
          <Text style={styles.body}>Progress: {formatAmount(entry.progressAfterUpdate)} / {formatAmount(entry.targetAtUpdate)} {entry.unit}</Text>
          {!!entry.note && <Text style={styles.body}>{entry.note}</Text>}
        </View>)}
        {data.history.page < data.history.totalPages && <GoalButton title="Load more history" secondary busy={action.busy} onPress={more} />}
      </>}
    </ScrollView>
    <Modal transparent visible={menu} animationType="fade" onRequestClose={() => setMenu(false)}>
      <View style={{ flex: 1, backgroundColor: COLORS.OVERLAY, justifyContent: "center", padding: 24 }}><View style={styles.card} accessibilityViewIsModal>
        <Text style={styles.title}>Goal options</Text><GoalButton title="Edit Goal" secondary onPress={edit} />
        {goal?.status === "active" && <GoalButton title="Cancel Goal" secondary onPress={() => destructive("cancel")} />}
        <GoalButton title="Delete Goal" danger onPress={() => destructive("delete")} /><GoalButton title="Close" secondary onPress={() => setMenu(false)} />
      </View></View>
    </Modal>
  </SafeAreaView>;
}
