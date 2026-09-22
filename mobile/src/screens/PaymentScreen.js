/**
 * BinGo – DirectPay Payment Screen
 *
 * Uses the official react-native-directpay-ipg SDK.
 * Flow:
 *   1. Call server POST /payment/session  → get dataString + signature
 *   2. Pass to IPGComponent               → DirectPay handles card UI
 *   3. Receive callback                   → call POST /plans/select
 *   4. Update user in context             → RootNavigator shows dashboard
 *
 * Merchant ID : PI11698
 * Stage       : PROD
 *
 * Route params:
 *   plan      {object}   – plan being purchased
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { IPGComponent, IPGStage } from "react-native-directpay-ipg";
import { useAuth } from "../context/AuthContext";
import { selectPlan } from "../services/planService";
import api from "../api/apiClient";
import COLORS from "../constants/colors";

const PaymentScreen = ({ route, navigation }) => {
  const { plan } = route.params || {};
  const { user, updateUser } = useAuth();

  const [sessionData, setSessionData]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [processing, setProcessing]     = useState(false);
  const [error, setError]               = useState(null);

  // ── Fetch payment session from server ─────────────────────────────────────
  useEffect(() => {
    if (!plan) return;
    (async () => {
      try {
        const res = await api.post("/payment/session", { planKey: plan.key });
        setSessionData(res.data.data);
      } catch (e) {
        setError(e.message || "Could not initialise payment. Please try again.");
      } finally {
        setLoading(false);
      }
    })();
  }, [plan]);

  // ── Handle DirectPay SDK callback ─────────────────────────────────────────
  const handlePaymentCallback = async (data) => {
    console.log("[DirectPay Response]", JSON.stringify(data));

    try {
      const parsed = typeof data === "string" ? JSON.parse(data) : data;
      const statusCode = parsed?.status_code || parsed?.data?.status_code;

      if (statusCode === "00") {
        // Payment successful
        setProcessing(true);
        const result = await selectPlan(plan.key, parsed?.data?.payment_id || null);
        await updateUser({ ...user, ...result, hasSelectedPlan: true, plan: plan.key });
        // RootNavigator auto-switches to Main (no hasSelectedPlan gate)
        navigation.goBack();
      } else if (statusCode === "01" || statusCode === "02") {
        Alert.alert(
          "Payment Cancelled",
          "Your payment was cancelled. You can try again.",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      } else {
        Alert.alert(
          "Payment Failed",
          parsed?.message || "Your payment could not be processed. Please try again.",
          [{ text: "OK" }]
        );
      }
    } catch (e) {
      Alert.alert("Error", e.message || "Something went wrong after payment.");
    } finally {
      setProcessing(false);
    }
  };

  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorTxt}>No plan selected.</Text>
      </SafeAreaView>
    );
  }

  const color = plan.color || COLORS.PRIMARY;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>
            {plan.name} Plan — LKR {plan.price.toLocaleString()}
          </Text>
          <Text style={styles.headerSub}>Secured by DirectPay</Text>
        </View>
        <Icon name="shield-check" size={22} color="#4CAF50" />
      </View>

      {/* Loading session */}
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.loadingTxt}>Initialising payment…</Text>
        </View>
      )}

      {/* Error state */}
      {error && !loading && (
        <View style={styles.center}>
          <Icon name="alert-circle-outline" size={48} color={COLORS.ERROR} />
          <Text style={styles.errorTxt}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryBtn, { borderColor: color }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.retryBtnTxt, { color }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DirectPay IPG Component */}
      {!loading && !error && sessionData && (
        <IPGComponent
          stage={IPGStage.PROD}
          signature={sessionData.signature}
          dataString={sessionData.dataString}
          callback={handlePaymentCallback}
        />
      )}

      {/* Processing overlay */}
      {processing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={color} />
          <Text style={styles.processingTxt}>Activating {plan.name} plan…</Text>
        </View>
      )}

      {/* Test card info banner */}
      {!loading && !error && (
        <View style={styles.testBanner}>
          <Icon name="information-outline" size={14} color="#E65100" />
          <Text style={styles.testBannerTxt}>
            Test: 5123 4500 0000 0008 · CVC: 123 · Any future date
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 11, color: COLORS.TEXT_SECONDARY },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  loadingTxt: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  errorTxt:   { fontSize: 14, color: COLORS.ERROR, textAlign: "center" },
  retryBtn: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 10, marginTop: 8,
  },
  retryBtnTxt: { fontSize: 14, fontWeight: "600" },

  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center", alignItems: "center",
    gap: 12, zIndex: 99,
  },
  processingTxt: { fontSize: 15, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },

  testBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FFF3E0", paddingHorizontal: 16, paddingVertical: 8,
    borderTopWidth: 1, borderTopColor: "#FFE0B2",
  },
  testBannerTxt: { fontSize: 11, color: "#E65100", flex: 1 },
});

export default PaymentScreen;
