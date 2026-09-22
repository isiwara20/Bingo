/**
 * BinGo – Forgot Password Screen
 *
 * 3-step password reset flow:
 *   Step 0 – Enter email
 *   Step 1 – Enter 6-digit WhatsApp OTP
 *   Step 2 – Set new password
 *   Success – Animated confirmation → auto-navigate to Login
 *
 * Matches the design language of LoginScreen and RegisterScreen.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Image, Animated, Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  requestPasswordReset,
  verifyPasswordReset,
  completePasswordReset,
} from "../services/authService";
import COLORS from "../constants/colors";

const OTP_LENGTH = 6;
const RESEND_WAIT = 60;

// ── Password strength ─────────────────────────────────────────────────────────
const PW_RULES = [
  { key: "len",   label: "At least 8 characters",     test: v => v.length >= 8 },
  { key: "upper", label: "One uppercase letter",       test: v => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter",       test: v => /[a-z]/.test(v) },
  { key: "num",   label: "One number",                 test: v => /[0-9]/.test(v) },
];

const PasswordStrength = ({ value }) => {
  if (!value) return null;
  const passed = PW_RULES.filter(r => r.test(value)).length;
  const colors = ["#F44336", "#FF9800", "#FFC107", "#4CAF50"];
  const labels = ["Weak", "Fair", "Good", "Strong"];
  return (
    <View style={ps.container}>
      <View style={ps.barRow}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[ps.bar, { backgroundColor: i < passed ? colors[passed - 1] : COLORS.BORDER }]} />
        ))}
        <Text style={[ps.label, { color: colors[passed - 1] || COLORS.TEXT_DISABLED }]}>
          {passed > 0 ? labels[passed - 1] : ""}
        </Text>
      </View>
      <View style={ps.rules}>
        {PW_RULES.map(r => {
          const ok = r.test(value);
          return (
            <View key={r.key} style={ps.ruleRow}>
              <Icon name={ok ? "check-circle" : "circle-outline"} size={13} color={ok ? COLORS.SUCCESS : COLORS.TEXT_DISABLED} />
              <Text style={[ps.ruleTxt, ok && { color: COLORS.SUCCESS }]}>{r.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};
const ps = StyleSheet.create({
  container: { gap: 8, marginTop: 6 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  bar: { flex: 1, height: 5, borderRadius: 3 },
  label: { fontSize: 11, fontWeight: "700", marginLeft: 6, minWidth: 48 },
  rules: { gap: 4 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ruleTxt: { fontSize: 11, color: COLORS.TEXT_DISABLED },
});

// ── Password field with eye toggle ────────────────────────────────────────────
const PasswordField = ({ label, value, onChangeText, error, inputRef, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.pwRow, error && s.inputError]}>
        <TextInput
          ref={inputRef}
          style={s.pwInput}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={!visible}
          placeholderTextColor={COLORS.TEXT_DISABLED}
          {...props}
        />
        <Pressable
          onPress={() => setVisible(v => !v)}
          style={s.eyeBtn}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <Icon name={visible ? "eye-off-outline" : "eye-outline"} size={22} color={COLORS.TEXT_SECONDARY} />
        </Pressable>
      </View>
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
};

// ── Step indicator ────────────────────────────────────────────────────────────
const STEP_LABELS = ["Email", "Verify", "Password"];

const StepIndicator = ({ current }) => (
  <View style={s.stepRow}>
    {STEP_LABELS.map((label, i) => (
      <React.Fragment key={label}>
        <View style={s.stepItem}>
          <View style={[s.stepCircle, i <= current && s.stepCircleActive]}>
            {i < current
              ? <Icon name="check" size={14} color="#fff" />
              : <Text style={[s.stepNum, i <= current && s.stepNumActive]}>{i + 1}</Text>
            }
          </View>
          <Text style={[s.stepLabel, i === current && s.stepLabelActive]}>{label}</Text>
        </View>
        {i < STEP_LABELS.length - 1 && (
          <View style={[s.stepLine, i < current && s.stepLineDone]} />
        )}
      </React.Fragment>
    ))}
  </View>
);

// ── Success screen ────────────────────────────────────────────────────────────
const SuccessView = ({ navigation }) => {
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const slideY  = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale,   { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.timing(slideY,  { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => navigation.reset({ index: 0, routes: [{ name: "Login" }] }), 3500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Animated.View style={[s.successContainer, { opacity }]}>
      <Animated.View style={[s.successCircle, { transform: [{ scale }] }]}>
        <Icon name="lock-check" size={52} color={COLORS.PRIMARY} />
      </Animated.View>
      <Animated.View style={{ transform: [{ translateY: slideY }], alignItems: "center", gap: 8 }}>
        <Text style={s.successTitle}>Password Reset!</Text>
        <Text style={s.successSub}>
          Your password has been updated successfully.{"\n"}Sign in with your new password.
        </Text>
      </Animated.View>

      {/* Steps */}
      <View style={s.successSteps}>
        {[
          { icon: "email-check-outline",  label: "Email verified" },
          { icon: "whatsapp",             label: "WhatsApp code confirmed" },
          { icon: "shield-check",         label: "Password saved securely" },
        ].map((item, i) => (
          <View key={i} style={s.successStep}>
            <View style={s.successStepIcon}>
              <Icon name={item.icon} size={18} color={COLORS.PRIMARY} />
            </View>
            <Text style={s.successStepLabel}>{item.label}</Text>
            <Icon name="check-circle" size={16} color={COLORS.SUCCESS} />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={s.successSignInBtn}
        onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}
        accessibilityRole="button"
      >
        <Text style={s.successSignInTxt}>Sign In Now</Text>
        <Icon name="arrow-right" size={20} color="#fff" />
      </TouchableOpacity>
      <Text style={s.autoRedirect}>Redirecting automatically in a few seconds…</Text>
    </Animated.View>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep]         = useState(0);
  const [email, setEmail]       = useState("");
  const [otp, setOtp]           = useState(Array(OTP_LENGTH).fill(""));
  const [resetToken, setToken]  = useState(null);
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirm] = useState("");
  const [errors, setErrors]     = useState({});
  const [busy, setBusy]         = useState(false);
  const [notice, setNotice]     = useState("");
  const [countdown, setCountdown] = useState(0);
  const [success, setSuccess]   = useState(false);

  const otpRefs   = useRef([]);
  const confirmRef = useRef(null);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const clearErrors = (key) => setErrors(e => ({ ...e, [key]: null }));

  // ── OTP digit handlers ──────────────────────────────────────────────────
  const handleOtpDigit = (text, idx) => {
    const d = text.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = d;
    setOtp(next);
    clearErrors("otp");
    if (d && idx < OTP_LENGTH - 1) otpRefs.current[idx + 1]?.focus();
  };
  const handleOtpKey = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setBusy(true);
    setErrors({});
    setNotice("");
    try {
      if (step === 0) {
        if (!email.trim() || !/\S+@\S+\.\S+/.test(email))
          return setErrors({ email: "Enter a valid email address." });
        await requestPasswordReset(email.trim().toLowerCase());
        setNotice("If this email has a registered account, a 6-digit code has been sent to its WhatsApp number.");
        setStep(1);
        setCountdown(RESEND_WAIT);

      } else if (step === 1) {
        const otpStr = otp.join("");
        if (otpStr.length < OTP_LENGTH)
          return setErrors({ otp: "Enter all 6 digits." });
        const data = await verifyPasswordReset(email.trim().toLowerCase(), otpStr);
        setToken(data.resetToken);
        setStep(2);

      } else {
        const pwOk = PW_RULES.every(r => r.test(password));
        if (!pwOk) return setErrors({ password: "Password does not meet requirements." });
        if (password !== confirmPw) return setErrors({ confirmPw: "Passwords do not match." });
        await completePasswordReset(resetToken, password);
        setSuccess(true);
      }
    } catch (e) {
      const msg = e.errors?.[0]?.message || e.message || "Something went wrong. Please try again.";
      if (step === 0) setErrors({ email: msg });
      else if (step === 1) setErrors({ otp: msg });
      else setErrors({ password: msg });
    } finally {
      setBusy(false);
    }
  };

  const handleResend = async () => {
    setBusy(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setOtp(Array(OTP_LENGTH).fill(""));
      setCountdown(RESEND_WAIT);
      setNotice("A new code has been sent to your WhatsApp.");
      otpRefs.current[0]?.focus();
    } catch (e) {
      setErrors({ otp: e.message || "Resend failed. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.container}>
      {/* Sticky top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          onPress={() => step > 0 ? setStep(p => p - 1) : navigation.goBack()}
          style={s.backBtn}
          disabled={busy}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="arrow-left" size={22} color={COLORS.PRIMARY} />
        </TouchableOpacity>
        <Image
          source={require("../../assets/logo.png")}
          style={s.logo}
          resizeMode="contain"
          accessibilityLabel="BinGo logo"
        />
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {success ? (
            <SuccessView navigation={navigation} />
          ) : (
            <>
              {/* Step indicator */}
              <StepIndicator current={step} />

              {/* Hero */}
              <View style={s.hero}>
                <View style={s.heroIcon}>
                  <Icon
                    name={step === 0 ? "email-outline" : step === 1 ? "whatsapp" : "lock-reset"}
                    size={30}
                    color={COLORS.PRIMARY}
                  />
                </View>
                <Text style={s.heroTitle}>
                  {step === 0 ? "Reset Password"
                    : step === 1 ? "Check WhatsApp"
                    : "New Password"}
                </Text>
                <Text style={s.heroSub}>
                  {step === 0
                    ? "Enter your account email and we'll send a verification code to your WhatsApp."
                    : step === 1
                    ? `Enter the 6-digit code sent to the WhatsApp number linked to ${email.trim()}.`
                    : "Choose a strong password you haven't used before."}
                </Text>
              </View>

              {/* Form */}
              <View style={s.form}>

                {/* Step 0 — Email */}
                {step === 0 && (
                  <View style={s.inputGroup}>
                    <Text style={s.label}>Email Address</Text>
                    <View style={[s.inputRow, errors.email && s.inputError]}>
                      <Icon name="email-outline" size={20} color={COLORS.TEXT_SECONDARY} />
                      <TextInput
                        style={s.inputFlex}
                        value={email}
                        onChangeText={t => { setEmail(t); clearErrors("email"); }}
                        placeholder="you@example.com"
                        placeholderTextColor={COLORS.TEXT_DISABLED}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        returnKeyType="done"
                        blurOnSubmit
                        onSubmitEditing={handleSubmit}
                        editable={!busy}
                      />
                    </View>
                    {errors.email && <Text style={s.errorText}>{errors.email}</Text>}
                  </View>
                )}

                {/* Step 1 — OTP */}
                {step === 1 && (
                  <View style={s.inputGroup}>
                    {/* WA banner */}
                    <View style={s.waBanner}>
                      <Icon name="whatsapp" size={20} color="#25D366" />
                      <Text style={s.waBannerTxt}>
                        Code sent to the WhatsApp linked to your account
                      </Text>
                    </View>
                    <Text style={s.label}>Verification Code</Text>
                    <View style={s.otpRow}>
                      {otp.map((d, i) => (
                        <TextInput
                          key={i}
                          ref={r => (otpRefs.current[i] = r)}
                          style={[
                            s.otpBox,
                            d && s.otpFilled,
                            errors.otp && s.otpError,
                          ]}
                          value={d}
                          onChangeText={t => handleOtpDigit(t, i)}
                          onKeyPress={e => handleOtpKey(e, i)}
                          keyboardType="number-pad"
                          maxLength={1}
                          textAlign="center"
                          selectTextOnFocus
                          editable={!busy}
                          accessibilityLabel={`OTP digit ${i + 1}`}
                        />
                      ))}
                    </View>
                    {errors.otp && <Text style={s.errorText}>{errors.otp}</Text>}
                  </View>
                )}

                {/* Step 2 — New password */}
                {step === 2 && (
                  <>
                    <PasswordField
                      label="New Password"
                      value={password}
                      onChangeText={t => { setPassword(t); clearErrors("password"); }}
                      error={errors.password}
                      placeholder="Enter new password"
                      autoCapitalize="none"
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => confirmRef.current?.focus()}
                      editable={!busy}
                    />
                    <PasswordStrength value={password} />
                    <PasswordField
                      label="Confirm New Password"
                      inputRef={confirmRef}
                      value={confirmPw}
                      onChangeText={t => { setConfirm(t); clearErrors("confirmPw"); }}
                      error={errors.confirmPw}
                      placeholder="Re-enter new password"
                      autoCapitalize="none"
                      returnKeyType="done"
                      blurOnSubmit
                      onSubmitEditing={handleSubmit}
                      editable={!busy}
                    />
                  </>
                )}

                {/* Notice (step 0 success message) */}
                {notice ? (
                  <View style={s.noticeBanner}>
                    <Icon name="information-outline" size={18} color={COLORS.PRIMARY} />
                    <Text style={s.noticeTxt}>{notice}</Text>
                  </View>
                ) : null}

                {/* Submit button */}
                <TouchableOpacity
                  style={[s.btn, busy && s.btnDisabled]}
                  onPress={handleSubmit}
                  disabled={busy}
                  accessibilityRole="button"
                >
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={s.btnInner}>
                      <Text style={s.btnTxt}>
                        {step === 0 ? "Send WhatsApp Code"
                          : step === 1 ? "Verify Code"
                          : "Reset Password"}
                      </Text>
                      <Icon name="arrow-right" size={20} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Resend (step 1) */}
                {step === 1 && (
                  <View style={s.resendRow}>
                    {countdown > 0 ? (
                      <Text style={s.countdownTxt}>
                        Resend in <Text style={s.countdownNum}>{countdown}s</Text>
                      </Text>
                    ) : (
                      <TouchableOpacity
                        onPress={handleResend}
                        disabled={busy}
                        accessibilityRole="button"
                      >
                        <Text style={s.linkTxt}>Didn't receive a code? Resend</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* Use different email (step 1) */}
                {step === 1 && (
                  <TouchableOpacity
                    onPress={() => { setStep(0); setOtp(Array(OTP_LENGTH).fill("")); setErrors({}); setNotice(""); }}
                    disabled={busy}
                    style={s.resendRow}
                    accessibilityRole="button"
                  >
                    <Text style={s.linkTxtMuted}>Use a different email</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Security note */}
              <View style={s.securityNote}>
                <Icon name="shield-check-outline" size={16} color={COLORS.TEXT_DISABLED} />
                <Text style={s.securityTxt}>
                  {step === 0
                    ? "No access to your WhatsApp? Contact your BinGo administrator."
                    : "Never share your verification code with anyone."}
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: COLORS.SURFACE,
    justifyContent: "center", alignItems: "center",
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  logo: { width: 110, height: 42 },

  scroll: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  // Step indicator
  stepRow: {
    flexDirection: "row", alignItems: "center",
    marginBottom: 24, marginTop: 4,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepLine: {
    flex: 1, height: 2, backgroundColor: COLORS.BORDER, marginHorizontal: 4,
  },
  stepLineDone: { backgroundColor: COLORS.PRIMARY },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.BORDER,
    justifyContent: "center", alignItems: "center",
  },
  stepCircleActive: { backgroundColor: COLORS.PRIMARY },
  stepNum:  { fontSize: 12, fontWeight: "700", color: COLORS.TEXT_SECONDARY },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 10, color: COLORS.TEXT_DISABLED, fontWeight: "500" },
  stepLabelActive: { color: COLORS.PRIMARY, fontWeight: "700" },

  // Hero
  hero: { alignItems: "center", marginBottom: 28, gap: 10 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  heroTitle: { fontSize: 24, fontWeight: "800", color: COLORS.TEXT_PRIMARY },
  heroSub: {
    fontSize: 13, color: COLORS.TEXT_SECONDARY,
    textAlign: "center", lineHeight: 19,
  },

  // Form
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputFlex: {
    flex: 1, paddingVertical: 13,
    fontSize: 15, color: COLORS.TEXT_PRIMARY,
  },
  inputError: { borderColor: COLORS.ERROR },
  errorText: { fontSize: 12, color: COLORS.ERROR },

  pwRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 10,
  },
  pwInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: COLORS.TEXT_PRIMARY,
  },
  eyeBtn: {
    paddingHorizontal: 12, paddingVertical: 12,
    justifyContent: "center", alignItems: "center",
  },

  // WA banner
  waBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#E8F5E9", borderRadius: 10,
    padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: "#C8E6C9",
  },
  waBannerTxt: { flex: 1, fontSize: 13, color: "#2E7D32", lineHeight: 18 },

  // OTP
  otpRow: {
    flexDirection: "row", gap: 8,
    justifyContent: "space-between",
  },
  otpBox: {
    width: 44, height: 54, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
    fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY,
  },
  otpFilled: { borderColor: COLORS.PRIMARY, backgroundColor: "#E8F5E9" },
  otpError:  { borderColor: COLORS.ERROR },

  // Notice
  noticeBanner: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#E8F5E9", borderRadius: 10,
    padding: 12, borderWidth: 1, borderColor: "#C8E6C9",
  },
  noticeTxt: { flex: 1, fontSize: 13, color: COLORS.PRIMARY_DARK, lineHeight: 18 },

  // Button
  btn: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15, borderRadius: 12, alignItems: "center",
    marginTop: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  // Resend row
  resendRow: { alignItems: "center", paddingVertical: 2 },
  countdownTxt: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  countdownNum: { color: COLORS.PRIMARY, fontWeight: "700" },
  linkTxt: { fontSize: 13, color: COLORS.PRIMARY, fontWeight: "600" },
  linkTxtMuted: { fontSize: 13, color: COLORS.TEXT_SECONDARY },

  // Security note
  securityNote: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    marginTop: 20, paddingHorizontal: 4,
  },
  securityTxt: { flex: 1, fontSize: 11, color: COLORS.TEXT_DISABLED, lineHeight: 17 },

  // ── Success view ──────────────────────────────────────────────────────────
  successContainer: {
    flex: 1, alignItems: "center",
    paddingTop: 16, gap: 20,
  },
  successCircle: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "#C8E6C9",
  },
  successTitle: {
    fontSize: 28, fontWeight: "800",
    color: COLORS.TEXT_PRIMARY, textAlign: "center",
  },
  successSub: {
    fontSize: 14, color: COLORS.TEXT_SECONDARY,
    textAlign: "center", lineHeight: 20,
  },
  successSteps: {
    width: "100%", backgroundColor: COLORS.SURFACE,
    borderRadius: 14, padding: 16, gap: 12,
    borderWidth: 1, borderColor: COLORS.BORDER,
  },
  successStep: {
    flexDirection: "row", alignItems: "center", gap: 10,
  },
  successStepIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "#E8F5E9",
    justifyContent: "center", alignItems: "center",
  },
  successStepLabel: {
    flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY,
  },
  autoRedirect: {
    fontSize: 12, color: COLORS.TEXT_DISABLED, textAlign: "center",
  },
  successSignInBtn: {
    width: "100%",
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  successSignInTxt: {
    color: "#fff", fontSize: 16, fontWeight: "bold",
  },
});
