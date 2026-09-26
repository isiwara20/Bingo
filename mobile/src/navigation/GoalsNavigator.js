import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import MyEcoGoalsScreen from "../screens/goals/MyEcoGoalsScreen";
import GoalFormScreen from "../screens/goals/GoalFormScreen";
import GoalDetailsScreen from "../screens/goals/GoalDetailsScreen";
import UpdateGoalProgressScreen from "../screens/goals/UpdateGoalProgressScreen";
const Stack = createNativeStackNavigator();
export default function GoalsNavigator() {
  return <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MyEcoGoals" component={MyEcoGoalsScreen} />
    <Stack.Screen name="CreateGoal" component={GoalFormScreen} />
    <Stack.Screen name="GoalDetails" component={GoalDetailsScreen} />
    <Stack.Screen name="EditGoal" component={GoalFormScreen} />
    <Stack.Screen name="UpdateGoalProgress" component={UpdateGoalProgressScreen} />
  </Stack.Navigator>;
}
