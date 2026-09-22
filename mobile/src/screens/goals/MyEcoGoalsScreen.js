import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { getGoals, getGoalSummary, getGoalOptions } from "../../services/goalService";
import { useGoalResource, useGoalAction } from "../../hooks/useGoals";
import { GoalHeader, GoalButton, GoalError, GoalEmpty, GoalLoading, GoalStat, GoalProgress, styles } from "../../components/goals/GoalUI";
import GoalCard from "../../components/goals/GoalCard";
import { formatAmount } from "./goalUtils";

export default function MyEcoGoalsScreen({ navigation, route }) {
  const [status, setStatus] = useState(route.params?.status || "active");
  const [showCancelled, setShowCancelled] = useState(false);
  useEffect(() => { if (route.params?.status) setStatus(route.params.status); }, [route.params?.status, route.params?.feedback]);
  const load = useCallback(async () => {
    const [list, summary, options] = await Promise.all([getGoals(status), getGoalSummary(), getGoalOptions()]);
    return { ...list, summary, options };
  }, [status]);
  const { data, setData, loading, error, reload } = useGoalResource(load);
  const action = useGoalAction();
  const current = data?.status === status ? data : null;
  const create = () => navigation.navigate("CreateGoal");
  const loadMore = () => action.run(async () => {
    const page = await getGoals(status, current.page + 1);
    setData(old => old?.status === page.status ? { ...old, ...page, goals: [...old.goals, ...page.goals] } : old);
  });
  const month = data?.summary.month;
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <GoalHeader title="My Eco Goals" subtitle="Small actions create a greener future" navigation={navigation} />
    <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={loading && !!data} onRefresh={reload} tintColor={COLORS.PRIMARY} />}>
      {!!route.params?.feedback && <View style={[styles.card, { borderColor: COLORS.PRIMARY }]}><Text style={[styles.label, { color: COLORS.PRIMARY }]} accessibilityLiveRegion="polite">{route.params.feedback}</Text>{route.params.createdGoalId && <GoalButton title="View new goal" secondary onPress={() => navigation.navigate("GoalDetails", { goalId: route.params.createdGoalId })} />}<TouchableOpacity style={{ minHeight: 44, justifyContent: "center" }} accessibilityRole="button" accessibilityLabel="Dismiss message" onPress={() => navigation.setParams({ feedback: null, createdGoalId: null })}><Text style={styles.subtitle}>Dismiss</Text></TouchableOpacity></View>}
      <GoalError message={error} retry={reload} />
      {data && <View style={styles.card}><View style={styles.row}><GoalStat label="Active Goals" value={data.summary.activeGoals} /><GoalStat label="Completed" value={data.summary.completedGoals} /><GoalStat label="Overall Progress" value={`${data.summary.overallProgress}%`} /></View><GoalProgress value={data.summary.overallProgress} /><Text style={styles.subtitle}>Average progress across your active and completed goals.</Text></View>}
      <GoalButton title="Create Goal" icon="plus" onPress={create} />
      <View style={styles.row}>{["active", "completed"].map(tab => <TouchableOpacity key={tab} style={[styles.choice, { flex: 1, alignItems: "center" }, status === tab && styles.choiceActive]} onPress={() => setStatus(tab)} accessibilityRole="tab" accessibilityState={{ selected: status === tab }} accessibilityLabel={`${tab === "active" ? "Active" : "Completed"} goals`}><Text style={styles.label}>{tab === "active" ? "Active" : "Completed"}</Text></TouchableOpacity>)}</View>
      {(data?.summary.cancelledGoals > 0 || showCancelled) && <TouchableOpacity style={{ minHeight: 44, justifyContent: "center" }} accessibilityRole="button" onPress={() => { setShowCancelled(true); setStatus("cancelled"); }}><Text style={[styles.label, { color: COLORS.PRIMARY }]}>View cancelled goals ({data?.summary.cancelledGoals || 0})</Text></TouchableOpacity>}
      {status === "cancelled" && <Text style={styles.title}>Cancelled Goals</Text>}
      {loading && !current ? <GoalLoading /> : current && !current.goals.length ? <GoalEmpty title={status === "active" ? "No sustainability goals yet" : status === "completed" ? "No completed goals yet" : "No cancelled goals"} message={status === "active" ? "Create your first personal goal and start building greener habits." : status === "completed" ? "Keep working toward your current goals!" : "Goals you cancel will appear here for reference."} action={status === "active" ? create : undefined} /> : current?.goals.map(goal => <GoalCard key={goal._id} goal={goal} onPress={() => navigation.navigate("GoalDetails", { goalId: goal._id })} />)}
      <GoalError message={action.error} />
      {current && current.page < current.totalPages && <GoalButton title="Load more goals" secondary busy={action.busy} onPress={loadMore} />}
      {month && <View style={styles.card}>
        <Text style={styles.title}>My Sustainability Progress</Text><Text style={[styles.label, { color: COLORS.PRIMARY }]}>This Month</Text>
        <View style={[styles.row, { flexWrap: "wrap" }]}><GoalStat label="Goals Completed" value={month.completedGoals} /><GoalStat label="In Progress" value={month.activeGoals} /></View>
        <View style={styles.row}><GoalStat label="Total Eco Actions" value={formatAmount(month.totalEcoActions)} /><GoalStat label="Completion Rate" value={`${month.completionRate}%`} /></View>
        <GoalProgress value={month.completionRate} />
        <Text style={styles.subtitle}>Eco actions count progress recorded in Actions. Other units stay separate:</Text>
        <View style={styles.choices}>{Object.entries(month.amountsByUnit).filter(([unit]) => unit !== "Actions").map(([unit, amount]) => <Text key={unit} style={styles.choiceText}>{formatAmount(amount)} {unit} · </Text>)}</View>
        <Text style={styles.subtitle}>Monthly rate: goals completed this month ÷ (completed this month + goals currently in progress). Calendar months use UTC.</Text>
      </View>}
      {data?.options && <><Text style={styles.title}>Suggested for You</Text><Text style={styles.body}>A starting point for your next greener habit. Make the target your own.</Text>{data.options.suggestions.map(template => <TouchableOpacity key={template.title} style={[styles.card, styles.row]} accessibilityRole="button" accessibilityLabel={`Create ${template.title}`} onPress={() => navigation.navigate("CreateGoal", { template })}><View style={styles.iconCircle}><Icon name={template.icon} size={28} color={COLORS.PRIMARY} /></View><View style={{ flex: 1 }}><Text style={styles.label}>{template.title}</Text><Text style={styles.subtitle}>{template.category} · {template.period}</Text></View><Icon name="chevron-right" size={23} color={COLORS.PRIMARY} /></TouchableOpacity>)}</>}
    </ScrollView>
  </SafeAreaView>;
}
