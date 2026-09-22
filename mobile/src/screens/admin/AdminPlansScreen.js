/**
 * BinGo Admin – Plan Management Screen
 * View and edit plan prices and benefits.
 */

import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { getPlans, updatePlan } from "../../services/planService";
import COLORS from "../../constants/colors";

const PLAN_ICONS = { free: "sprout", plus: "star-circle", pro: "crown" };

const PlanEditor = ({ plan, onSave }) => {
  const [price, setPrice]       = useState(String(plan.price));
  const [tagline, setTagline]   = useState(plan.tagline || "");
  const [benefits, setBenefits] = useState((plan.benefits || []).join("\n"));
  const [saving, setSaving]     = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(plan.key, {
        price: parseFloat(price) || 0,
        tagline: tagline.trim(),
        benefits: benefits.split("\n").map(b => b.trim()).filter(Boolean),
      });
      Alert.alert("Saved", `${plan.name} plan updated.`);
      setExpanded(false);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const color = plan.color || COLORS.PRIMARY;

  return (
    <View style={[s.planCard, { borderLeftColor: color }]}>
      {/* Header row */}
      <TouchableOpacity
        style={s.planHeader}
        onPress={() => setExpanded(e => !e)}
        accessibilityRole="button"
      >
        <View style={[s.planIconBox, { backgroundColor: color }]}>
          <Icon name={PLAN_ICONS[plan.key] || "star"} size={20} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.planName, { color }]}>{plan.name}</Text>
          <Text style={s.planPrice}>
            {plan.price === 0 ? "Free" : `LKR ${plan.price.toLocaleString()}/${plan.billingPeriod}`}
          </Text>
        </View>
        <Icon
          name={expanded ? "chevron-up" : "chevron-down"}
          size={22} color={COLORS.TEXT_DISABLED}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={s.editor}>
          {/* Price */}
          {plan.key !== "free" && (
            <View style={s.field}>
              <Text style={s.fieldLabel}>Price (LKR/month)</Text>
              <TextInput
                style={s.fieldInput}
                value={price}
                onChangeText={setPrice}
                keyboardType="numeric"
                placeholderTextColor={COLORS.TEXT_DISABLED}
              />
            </View>
          )}

          {/* Tagline */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Tagline</Text>
            <TextInput
              style={s.fieldInput}
              value={tagline}
              onChangeText={setTagline}
              placeholder="Short plan description"
              placeholderTextColor={COLORS.TEXT_DISABLED}
            />
          </View>

          {/* Benefits */}
          <View style={s.field}>
            <Text style={s.fieldLabel}>Benefits (one per line)</Text>
            <TextInput
              style={[s.fieldInput, s.textArea]}
              value={benefits}
              onChangeText={setBenefits}
              multiline
              numberOfLines={6}
              placeholder={"Benefit 1\nBenefit 2\nBenefit 3"}
              placeholderTextColor={COLORS.TEXT_DISABLED}
              textAlignVertical="top"
            />
          </View>

          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: color }, saving && { opacity: 0.6 }]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
                  <Icon name="content-save" size={18} color="#fff" />
                  <Text style={s.saveBtnTxt}>Save Changes</Text>
                </View>
              )
            }
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const AdminPlansScreen = () => {
  const [plans, setPlans]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getPlans();
      setPlans(data);
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to load plans.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (key, data) => {
    await updatePlan(key, data);
    await load();
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Plan Management</Text>
        <Text style={s.headerSub}>Edit plan prices and benefits</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.PRIMARY} />
        }
      >
        {plans.map(plan => (
          <PlanEditor key={plan.key} plan={plan} onSave={handleSave} />
        ))}

        <View style={s.statsBox}>
          <Text style={s.statsTitle}>Plan Stats</Text>
          <Text style={s.statsHint}>
            User plan distribution is visible in the Dashboard tab.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  header: { padding: 20, paddingBottom: 12 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },

  planCard: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.BORDER,
    overflow: "hidden",
  },
  planHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 14, gap: 12,
  },
  planIconBox: {
    width: 42, height: 42, borderRadius: 10,
    justifyContent: "center", alignItems: "center",
  },
  planName:  { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  planPrice: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },

  editor: {
    padding: 14, paddingTop: 0, gap: 12,
    borderTopWidth: 1, borderTopColor: COLORS.DIVIDER,
  },
  field: { gap: 4 },
  fieldLabel: { fontSize: 13, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  fieldInput: {
    backgroundColor: COLORS.BACKGROUND, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, color: COLORS.TEXT_PRIMARY,
  },
  textArea: { height: 110, paddingTop: 10 },

  saveBtn: {
    paddingVertical: 12, borderRadius: 8,
    alignItems: "center", marginTop: 4,
  },
  saveBtnTxt: { color: "#fff", fontSize: 14, fontWeight: "700" },

  statsBox: {
    backgroundColor: COLORS.SURFACE, borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: COLORS.BORDER,
  },
  statsTitle: { fontSize: 14, fontWeight: "700", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  statsHint:  { fontSize: 13, color: COLORS.TEXT_SECONDARY },
});

export default AdminPlansScreen;
