/**
 * BinGo – OTP Verification Screen
 *
 * Shown after registration to verify the user's phone number.
 * Accepts a 6-digit OTP sent via text.lk SMS.
 *
 * On success: phone is marked verified and user proceeds to the app.
 * On failure: shows an error and lets the user retry or resend.
 *
 * Route params:
 *   phone {string} – phone number the OTP was sent to
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { sendOtp, verifyOtp } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import COLORS from "../constants/colors";

const OTP_LENGTH = 6;
const RESEND_COUNTDOWN = 60; // seconds

const OtpVerificationScreen = ({ route, navigation }) => {
  const { phone } = route.params || {};
  const { updateUser } = useAuth();

  // 6 individual digit inputs
  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(""));
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_COUNTDOWN);
  const [error, setError] = useState(null);

  // ── Countdown timer ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── Digit input handlers ────────────────────────────────────────────────────
  const handleDigitChange = (text, index) => {
    // Accept only one digit
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError(null);

    // Auto-advance to next field
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    if (digit && index === OTP_LENGTH - 1) {
      const fullOtp = [...newDigits.slice(0, OTP_LENGTH - 1), digit].join("");
      if (fullOtp.length === OTP_LENGTH) handleVerify(fullOtp);
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // ── Verify ──────────────────────────────────────────────────────────────────
  const handleVerify = async (otpOverride) => {
    const otp = otpOverride || digits.join("");
    if (otp.length < OTP_LENGTH) {
      setError("Please enter all 6 digits.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await verifyOtp(phone, otp);
      // Phone is now verified — update user in context if needed
      // RootNavigator will keep user on Main since they're already logged in
      Alert.alert(
        "Phone Verified!",
        "Your phone number has been verified successfully.",
        [{ text: "Continue", onPress: () => navigation.replace("Main") }]
      );
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
      // Clear digits so user can re-enter
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ── Resend ──────────────────────────────────────────────────────────────────
  const handleResend = async () => {
    setResendLoading(true);
    setError(null);
    try {
      await sendOtp(phone);
      setCountdown(RESEND_COUNTDOWN);
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      Alert.alert("OTP Sent", `A new code has been sent to ${phone}`);
    } catch (err) {
      Alert.alert("Failed to Resend", err.message || "Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="BinGo logo"
        />

        <Text style={styles.title}>Verify Your Phone</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to
        </Text>
        <Text style={styles.phone}>{phone}</Text>

        {/* OTP digit boxes */}
        <View style={styles.otpRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => (inputRefs.current[i] = ref)}
              style={[
                styles.otpBox,
                digit ? styles.otpBoxFilled : null,
                error ? styles.otpBoxError : null,
              ]}
              value={digit}
              onChangeText={(t) => handleDigitChange(t, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              accessibilityLabel={`OTP digit ${i + 1}`}
            />
          ))}
        </View>

        {/* Error message */}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Verify button */}
        <TouchableOpacity
          style={[styles.button, (loading || digits.join("").length < OTP_LENGTH) && styles.buttonDisabled]}
          onPress={() => handleVerify()}
          disabled={loading || digits.join("").length < OTP_LENGTH}
          accessibilityRole="button"
          accessibilityLabel="Verify OTP"
        >
          {loading ? (
            <ActivityIndicator color={COLORS.TEXT_INVERSE} />
          ) : (
            <Text style={styles.buttonText}>Verify</Text>
          )}
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>
              Resend code in{" "}
              <Text style={styles.resendTimer}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendLoading}
              accessibilityRole="button"
              accessibilityLabel="Resend OTP"
            >
              {resendLoading ? (
                <ActivityIndicator size="small" color={COLORS.PRIMARY} />
              ) : (
                <Text style={styles.resendLink}>Resend Code</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  backButton: { paddingHorizontal: 24, paddingVertical: 12 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 16,
  },

  logo: { width: 140, height: 52, marginBottom: 32 },

  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.TEXT_SECONDARY,
    textAlign: "center",
  },
  phone: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.PRIMARY,
    marginTop: 4,
    marginBottom: 36,
  },

  // OTP boxes
  otpRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  otpBox: {
    width: 46,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.BORDER,
    backgroundColor: COLORS.SURFACE,
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
  },
  otpBoxFilled: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: "#E8F5E9",
  },
  otpBoxError: {
    borderColor: COLORS.ERROR,
  },

  errorText: {
    fontSize: 13,
    color: COLORS.ERROR,
    marginBottom: 8,
    textAlign: "center",
  },

  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    width: "100%",
    marginTop: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },

  resendRow: { marginTop: 24, alignItems: "center" },
  resendCountdown: { fontSize: 14, color: COLORS.TEXT_SECONDARY },
  resendTimer: { color: COLORS.PRIMARY, fontWeight: "600" },
  resendLink: { fontSize: 14, color: COLORS.PRIMARY, fontWeight: "600" },
});

export default OtpVerificationScreen;
