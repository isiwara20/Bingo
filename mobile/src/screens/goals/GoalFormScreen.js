import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";
import { getGoalOptions, getGoal, createGoal, editGoal } from "../../services/goalService";
import { useGoalResource, useGoalAction } from "../../hooks/useGoals";
import { GoalHeader, GoalButton, GoalField, GoalChoices, GoalLoading, GoalError, styles } from "../../components/goals/GoalUI";
import GoalDateField from "../../components/goals/GoalDateField";
import { dateOnly, today, endForPeriod, validateGoal } from "./goalUtils";

export default function GoalFormScreen({ navigation, route }) {
  const goalId = route.params?.goalId;
  const editing = !!goalId;
  const template = route.params?.template;
  const scroll = useRef(null);
  const initialized = useRef(false);
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const action = useGoalAction();
  const load = useCallback(async () => {
    const [options, goal] = await Promise.all([getGoalOptions(), editing ? getGoal(goalId) : Promise.resolve(null)]);
    return { options, goal };
  }, [editing, goalId]);
  const { data, loading, error, reload } = useGoalResource(load);
  useEffect(() => {
    if (!data || initialized.current) return;
    const source = data.goal || template || {};
    const startDate = dateOnly(source.startDate) || today();
    const period = source.period || "Monthly";
    setValues({ title: source.title || "", description: source.description || "", category: source.category || "", targetAmount: source.targetAmount ? String(source.targetAmount) : "", unit: source.unit || "Actions", period, startDate, targetDate: dateOnly(source.targetDate) || endForPeriod(startDate, period), icon: source.icon || "sprout" });
    initialized.current = true;
  }, [data, template]);
  const change = (field, value) => {
    setValues(old => {
      const next = { ...old, [field]: value };
      if (!editing && (field === "period" || field === "startDate") && next.period !== "Custom") next.targetDate = endForPeriod(next.startDate, next.period);
      if (field === "targetDate") next.period = "Custom";
      return next;
    });
    setErrors(old => ({ ...old, [field]: null }));
  };
  const save = () => {
    const invalid = validateGoal(values); setErrors(invalid);
    if (Object.keys(invalid).length) { action.setError("Please check the highlighted fields."); scroll.current?.scrollTo({ y: 0, animated: true }); return; }
    action.run(async () => {
      const input = { ...values, title: values.title.trim(), description: values.description.trim(), targetAmount: Number(values.targetAmount) };
      if (editing) {
        delete input.startDate; delete input.period;
        await editGoal(goalId, input);
        navigation.navigate("GoalDetails", { goalId, feedback: "Goal updated successfully." });
      } else {
        const goal = await createGoal(input);
        navigation.navigate("MyEcoGoals", { status: "active", feedback: "Goal created successfully!", createdGoalId: goal._id });
      }
    });
  };
  return <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
    <GoalHeader title={editing ? "Edit Goal" : "Create Sustainability Goal"} subtitle={editing ? "Keep your goal working for you" : "One personal goal. One positive change."} navigation={navigation} disabled={action.busy} />
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView ref={scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <GoalError message={error} retry={reload} /><GoalError message={action.error} />
        {(loading && !values) ? <GoalLoading /> : values && data && <>
          <View style={styles.card}>
            <GoalField label="Goal Name *" value={values.title} onChangeText={text => change("title", text)} placeholder="e.g. Reduce Plastic Usage" maxLength={100} error={errors.title} editable={!action.busy} />
            <GoalChoices label="Goal Category *" values={data.options.categories} value={values.category} onChange={value => change("category", value)} error={errors.category} disabled={action.busy} />
            <GoalField label="Description (optional)" value={values.description} onChangeText={text => change("description", text)} placeholder="What would you like to achieve?" multiline maxLength={1000} editable={!action.busy} />
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Set your target</Text>
            <GoalField label="Target Amount *" value={values.targetAmount} onChangeText={text => change("targetAmount", text)} placeholder="e.g. 20" keyboardType="decimal-pad" maxLength={10} error={errors.targetAmount} editable={!action.busy} />
            <GoalChoices label="Unit *" values={data.options.units} value={values.unit} onChange={value => change("unit", value)} error={errors.unit} disabled={action.busy} />
            {editing && data.goal.currentProgress > 0 && <Text style={styles.subtitle}>Changing the unit relabels your current progress; history keeps its original units. Raising the target can make a completed goal active again.</Text>}
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Your timeline</Text>
            {!editing && <GoalChoices label="Goal Period *" values={data.options.periods} value={values.period} onChange={value => change("period", value)} disabled={action.busy} />}
            <GoalDateField label="Start Date *" value={values.startDate} onChange={value => change("startDate", value)} disabled={editing || action.busy} error={errors.startDate} />
            <GoalDateField label="Target Date *" value={values.targetDate} onChange={value => change("targetDate", value)} disabled={action.busy} error={errors.targetDate} />
            <Text style={styles.subtitle}>{editing ? "Your start date stays the same. Changing the target date sets a custom period." : "Weekly and Monthly suggest an end date. Pick another date to use a custom period."}</Text>
          </View>
          <View style={styles.card}><Text style={styles.title}>Choose an icon</Text><View style={styles.choices}>{data.options.icons.map(icon => <TouchableOpacity key={icon} style={[styles.iconButton, styles.choice, values.icon === icon && styles.choiceActive]} accessibilityRole="radio" accessibilityLabel={`Goal icon: ${icon.replace(/-outline$/, "").replace(/-/g, " ")}`} accessibilityState={{ selected: values.icon === icon }} disabled={action.busy} onPress={() => change("icon", icon)}><Icon name={icon} size={25} color={COLORS.PRIMARY} /></TouchableOpacity>)}</View></View>
          <Text style={styles.subtitle}>* Required fields</Text>
          <GoalButton title={editing ? "Save Changes" : "Create Goal"} onPress={save} busy={action.busy} />
          <GoalButton title="Cancel" secondary onPress={() => navigation.goBack()} disabled={action.busy} />
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}
