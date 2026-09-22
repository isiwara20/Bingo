/**
 * BinGo – Plan Selection Screen
 *
 * Shown to residents on first login.
 * Three plans: Free, Plus (LKR 299/mo), Pro (LKR 599/mo).
 * Free → selected immediately.
 * Plus/Pro → opens DirectPay payment sheet.
 *
 * On successful selection → updateUser() → RootNavigator shows dashboard.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Animated, Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { getPlans, selectPlan } from "../services/planService";
import COLORS from "../constants/colors";

const { width: W } = Dimensions.get("window");

const PLAN_ICONS = {
  free: "sprout",
  plus: "star-circle",
  pro:  "crown",
};

// ── Benefit row ───────────────────────────────────────────────────────────────
const Benefit = ({ text, color }) => (
  <View style={s.benefit}>
    <Icon name="check-circle" size={16} color={color} />
    <Text style={s.benefitTxt}>{text}</Text>
  </View>
);

// ── Plan card ─────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, selected, onSelect }) => {
  const scale = useRef(new Animated.Value(1)).current;

  const press = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start(() => onSelect(plan));
  };

  const isFree = plan.key === "free";
  const color  = plan.color || COLORS.PRIMARY;

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        style={[
          s.card,
          selected && { borderColor: color, borderWidth: 2.5 },
          !selected && { borderColor: COLORS.BORDER },
          plan.badge && { marginTop: 12 },
        ]}
        onPress={press}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Select ${plan.name} plan`}
      >
        {/* Badge */}
        {plan.badge && (
          <View style={[s.badge, { backgroundColor: color }]}>
            <Text style={s.badgeTxt}>{plan.badge}</Text>
          </View>
        )}

        {/* Header */}
        <View style={[s.cardHeader, { backgroundColor: color + "18" }]}>
          <View style={[s.planIconBox, { backgroundColor: color }]}>
            <Icon name={PLAN_ICONS[plan.key] || "star"} size={24} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.planName, { color }]}>{plan.name}</Text>
            <Text style={s.planTagline}>{plan.tagline}</Text>
          </View>
          <View style={s.priceBlock}>
            {isFree ? (
              <Text style={[s.priceMain, { color }]}>FREE</Text>
            ) : (
              <>
                <Text style={[s.priceMain, { color }]}>
                  LKR {plan.price.toLocaleString()}
                </Text>
                <Text style={s.pricePer}>/{plan.billingPeriod}</Text>
              </>
            )}
          </View>
        </View>

        {/* Benefits */}
        <View style={s.benefitList}>
          {(plan.benefits || []).map((b, i) => (
            <Benefit key={i} text={b} color={color} />
          ))}
        </View>

        {/* Select button */}
        <TouchableOpacity
          style={[
            s.selectBtn,
            selected
              ? { backgroundColor: color }
              : { borderWidth: 1.5, borderColor: color, backgroundColor: "transparent" },
          ]}
          onPress={press}
          accessibilityRole="button"
        >
          {selected ? (
            <View style={s.selectBtnInner}>
              <Icon name="check" size={18} color="#fff" />
              <Text style={[s.selectBtnTxt, { color: "#fff" }]}>Selected</Text>
            </View>
          ) : (
            <Text style={[s.selectBtnTxt, { color }]}>
              {isFree ? "Start Free" : `Choose ${plan.name}`}
            </Text>
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const PlanSelectionScreen = ({ navigation }) => {
  const { user, updateUser } = useAuth();
  const [plans, setPlans]         = useState([]);
  const [selected, setSelected]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [confirming, setConfirming] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      try {
        const data = await getPlans();
        setPlans(data);
        Animated.timing(fadeIn, {
          toValue: 1, duration: 500, useNativeDriver: true,
        }).start();
      } catch (e) {
        Alert.alert("Error", "Could not load plans. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelect = useCallback((plan) => {
    setSelected(plan.key);
    if (plan.key !== "free") {
      // Navigate to payment screen
      navigation.navigate("Payment", {
        plan,
        onSuccess: () => handleConfirm(plan.key),
      });
    }
  }, []);

  const handleConfirm = async (planKey) => {
    const key = planKey || selected;
    if (!key) return;
    setConfirming(true);
    try {
      const result = await selectPlan(key);
      // Update user in context so RootNavigator re-evaluates
      await updateUser({ ...user, ...result, hasSelectedPlan: true, plan: key });
    } catch (e) {
      Alert.alert("Error", e.message || "Could not save plan. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={s.loading}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={s.loadingTxt}>Loading plans…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Icon name="crown" size={28} color={COLORS.SECONDARY} />
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Choose Your Plan</Text>
          <Text style={s.headerSub}>
            Welcome, {user?.name?.split(" ")[0]}! Select a plan to get started.
          </Text>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        style={{ opacity: fadeIn }}
      >
        {plans.map(plan => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={selected === plan.key}
            onSelect={handleSelect}
          />
        ))}

        {/* Confirm free plan button */}
        {selected === "free" && (
          <TouchableOpacity
            style={[s.confirmBtn, confirming && s.btnDisabled]}
            onPress={() => handleConfirm("free")}
            disabled={confirming}
            accessibilityRole="button"
          >
            {confirming
              ? <ActivityIndicator color="#fff" />
              : (
                <View style={s.confirmBtnInner}>
                  <Icon name="arrow-right-circle" size={20} color="#fff" />
                  <Text style={s.confirmBtnTxt}>Continue with Free Plan</Text>
                </View>
              )
            }
          </TouchableOpacity>
        )}

        <Text style={s.footer}>
          You can upgrade or change your plan anytime from your profile.
        </Text>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingTxt: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },

  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  scroll: { padding: 16, paddingBottom: 40, gap: 16 },

  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 16, borderWidth: 1.5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    position: "absolute", top: -1, right: 16,
    paddingHorizontal: 12, paddingVertical: 4,
    borderBottomLeftRadius: 8, borderBottomRightRadius: 8,
    zIndex: 10,
  },
  badgeTxt: { color: "#fff", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  cardHeader: {
    flexDirection: "row", alignItems: "center",
    padding: 16, gap: 12,
  },
  planIconBox: {
    width: 46, height: 46, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  planName:    { fontSize: 18, fontWeight: "800" },
  planTagline: { fontSize: 12, color: COLORS.TEXT_SECONDARY, marginTop: 1 },
  priceBlock:  { alignItems: "flex-end" },
  priceMain:   { fontSize: 18, fontWeight: "800" },
  pricePer:    { fontSize: 11, color: COLORS.TEXT_DISABLED },

  benefitList: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  benefit: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  benefitTxt: { flex: 1, fontSize: 13, color: COLORS.TEXT_PRIMARY, lineHeight: 18 },

  selectBtn: {
    margin: 16, marginTop: 8, paddingVertical: 13,
    borderRadius: 10, alignItems: "center",
  },
  selectBtnInner: { flexDirection: "row", alignItems: "center", gap: 6 },
  selectBtnTxt: { fontSize: 15, fontWeight: "700" },

  confirmBtn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15, borderRadius: 12, alignItems: "center",
    marginTop: 4,
  },
  confirmBtnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  confirmBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  btnDisabled: { opacity: 0.6 },

  footer: {
    textAlign: "center", fontSize: 12,
    color: COLORS.TEXT_DISABLED, lineHeight: 17, marginTop: 8,
  },
});

export default PlanSelectionScreen;
