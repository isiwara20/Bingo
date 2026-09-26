import React from "react";
import { View, Text } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { getGoalSummary } from "../../services/goalService";
import { useGoalResource } from "../../hooks/useGoals";
import { GoalButton, GoalProgress, GoalStat, GoalError, styles } from "./GoalUI";

export default function GoalSummaryCard({ navigation, profile = false }) {
  const { data, loading, error, reload } = useGoalResource(getGoalSummary);
  return <View style={[styles.card, { width: "100%", marginVertical: 12, borderLeftWidth: profile ? 1 : 4, borderLeftColor: profile ? COLORS.BORDER : COLORS.PRIMARY }]}>
    <View style={styles.row}><Icon name="sprout" size={27} color={COLORS.PRIMARY} /><Text style={styles.title}>{profile ? "Sustainability Progress" : "My Eco Goals"}</Text></View>
    {error ? <GoalError message="Your goal summary could not load." retry={reload} /> : !data ? <Text style={styles.body}>{loading ? "Loading your progress…" : "Start a greener habit today."}</Text> : <>
      {profile ? <View style={styles.row}><GoalStat label="Completed" value={data.completedGoals} /><GoalStat label="Active Goals" value={data.activeGoals} /><GoalStat label="Completion Rate" value={`${data.completionRate}%`} /></View> : <View style={styles.spread}><Text style={styles.body}>{data.activeGoals} Active Goals</Text><Text style={styles.label}>{data.overallProgress}% Overall Progress</Text></View>}
      <GoalProgress value={profile ? data.completionRate : data.overallProgress} />
    </>}
    <GoalButton title={profile ? "View My Goals" : "View Goals"} secondary onPress={() => navigation.navigate("EcoGoals")} />
  </View>;
}
