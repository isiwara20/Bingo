/**
 * BinGo – DirectPay Payment Screen
 *
 * Uses react-native-webview to load DirectPay's hosted payment page.
 * The server generates the payload (base64) + HmacSHA256 signature.
 * Creates a gateway session and opens its returned checkout link.
 *
 * Merchant: PI11698  Stage: PROD
 *
 * Route params:
 *   plan {object} – plan being purchased
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { selectPlan } from "../services/planService";
import api from "../api/apiClient";
import COLORS from "../constants/colors";
import { createDirectPaySession } from "../services/directPaySession";


const PaymentScreen = ({ route, navigation }) => {
  const { plan } = route.params || {};
  const { user, updateUser } = useAuth();

  const [sessionData, setSessionData] = useState(null);
  const [checkoutUrl, setCheckoutUrl] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [processing, setProcessing]   = useState(false);
  const [error, setError]             = useState(null);
  const webRef = useRef(null);

  // ── Get session from server ──────────────────────────────────────────────
  useEffect(() => {
    if (!plan) {
      setError("No plan selected. Go back and select a plan.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await api.post("/payment/session", { planKey: plan.key });
        const session = res.data.data;
        const link = await createDirectPaySession(session);
        setSessionData(session);
        setCheckoutUrl(link);
      } catch (e) {
        setError(e.message || "Could not initialise payment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [plan]);

  // ── Handle navigation changes from WebView ──────────────────────────────
  // DirectPay redirects to response_url on completion
  const handleNavChange = async (navState) => {
    const url = navState.url || "";

    // Payment success — response_url returns to our server callback
    // Server callback URL: http://localhost:5000/api/v1/payment/callback
    // We detect success when DirectPay redirects to the callback URL
    if (url.includes("/payment/callback") && /[?&]status_code=00(?:&|$)/.test(url)) {
      setProcessing(true);
      try {
        const result = await selectPlan(plan.key);
        await updateUser({ ...user, ...result, hasSelectedPlan: true, plan: plan.key });
        navigation.goBack();
      } catch (e) {
        Alert.alert("Error", e.message || "Plan activation failed.");
        setProcessing(false);
      }
      return;
    }

    // Payment cancelled or failed
    if (
      url.includes("status_code=01") ||
      url.includes("status_code=02") ||
      url.includes("cancel") ||
      url.includes("failed")
    ) {
      Alert.alert(
        "Payment Unsuccessful",
        "Your payment was not completed. You can try again.",
        [{ text: "Go Back", onPress: () => navigation.goBack() }]
      );
    }
  };

  const color = plan?.color || COLORS.PRIMARY;

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          disabled={processing}
        >
          <Icon name="arrow-left" size={22} color={COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>
            {plan?.name} Plan · LKR {plan?.price?.toLocaleString()}
          </Text>
          <Text style={s.headerSub}>🔒 Secured by DirectPay</Text>
        </View>
        <Icon name="shield-lock" size={22} color="#4CAF50" />
      </View>

      {/* Initialising */}
      {loading && (
        <View style={s.center}>
          <ActivityIndicator size="large" color={color} />
          <Text style={s.loadingTxt}>Initialising secure payment…</Text>
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={s.center}>
          <Icon name="alert-circle-outline" size={52} color={COLORS.ERROR} />
          <Text style={s.errorTxt}>{error}</Text>
          <TouchableOpacity
            style={[s.retryBtn, { borderColor: color }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[s.retryBtnTxt, { color }]}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* WebView payment */}
      {!loading && !error && sessionData && (
        <WebView
          ref={webRef}
          source={{ uri: checkoutUrl }}
          onError={() => setError("Could not connect to DirectPay. Check your internet connection and try again.")}
          onHttpError={() => setError("DirectPay could not load the payment page. Please try again later.")}
          onNavigationStateChange={handleNavChange}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState
          renderLoading={() => (
            <View style={s.center}>
              <ActivityIndicator size="large" color={color} />
            </View>
          )}
        />
      )}

      {/* Processing overlay */}
      {processing && (
        <View style={s.overlay}>
          <ActivityIndicator size="large" color={color} />
          <Text style={s.processingTxt}>Activating {plan?.name} plan…</Text>
        </View>
      )}

      {/* Test info */}
      {!loading && !error && sessionData?.stage === "DEV" && (
        <View style={s.testBanner}>
          <Icon name="information-outline" size={13} color="#E65100" />
          <Text style={s.testTxt}>
            Test card: 5123 4500 0000 0008  ·  CVC: 123  ·  Any future date
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
    backgroundColor: COLORS.SURFACE,
    borderBottomWidth: 1, borderBottomColor: COLORS.BORDER,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 15, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  headerSub:   { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 1 },

  center: {
    flex: 1, justifyContent: "center",
    alignItems: "center", gap: 14, padding: 32,
  },
  loadingTxt: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  errorTxt:   { fontSize: 14, color: COLORS.ERROR, textAlign: "center", lineHeight: 20 },
  retryBtn: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 24, paddingVertical: 10,
  },
  retryBtnTxt: { fontSize: 14, fontWeight: "600" },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.93)",
    justifyContent: "center", alignItems: "center",
    gap: 14, zIndex: 99,
  },
  processingTxt: { fontSize: 15, color: COLORS.TEXT_SECONDARY, fontWeight: "600" },

  testBanner: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 14, paddingVertical: 7,
    borderTopWidth: 1, borderTopColor: "#FFE0B2",
  },
  testTxt: { fontSize: 11, color: "#E65100", flex: 1 },
});

export default PaymentScreen;
