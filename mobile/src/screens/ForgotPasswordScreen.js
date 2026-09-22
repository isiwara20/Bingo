import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  KeyboardAvoidingView, Platform, Image, Animated, ActivityIndicator,
  AccessibilityInfo, Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { requestPasswordReset, verifyPasswordReset, completePasswordReset } from "../services/authService";

const GREEN = "#185B43";
const LABELS = ["Your email", "Verify code", "New password"];
const TITLES = ["Let’s get you\nback in.", "Check your\nWhatsApp.", "A fresh start.\nA new password."];
const ICONS = ["email-outline", "whatsapp", "lock-reset"];

const Field = ({ label, icon, children, ...props }) => (
  <View style={s.fieldGroup}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.inputWrap}><Icon name={icon} size={21} color="#72877B" /><TextInput style={s.input} placeholderTextColor="#9AA79F" accessibilityLabel={label} {...props} />{children}</View>
  </View>
);

function ResetSuccess({ navigation }) {
  const values = useRef([new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)]).current;
  const scale = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    let disposed = false;
    let animation;
    AccessibilityInfo.isReduceMotionEnabled().then(reduced => {
      if (disposed) return;
      if (reduced) { values.forEach(v => v.setValue(1)); scale.setValue(1); return; }
      animation = Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 5, useNativeDriver: true }),
        Animated.stagger(450, values.map(value => Animated.timing(value, { toValue: 1, duration: 400, useNativeDriver: true }))),
      ]);
      animation.start();
    }).catch(() => { if (!disposed) { values.forEach(v => v.setValue(1)); scale.setValue(1); } });
    const timer = setTimeout(() => navigation.reset({ index: 0, routes: [{ name: "Login" }] }), 4500);
    return () => { disposed = true; clearTimeout(timer); animation?.stop(); };
  }, [navigation, scale, values]);
  return (
    <View style={s.success}>
      <Animated.View style={[s.successCircle, { transform: [{ scale }] }]}><Icon name="check-decagram" size={66} color={GREEN} /></Animated.View>
      <Text style={s.eyebrow}>YOU’RE ALL SET</Text>
      <Text style={[s.title, s.centerText]} accessibilityRole="header">Password reset.</Text>
      <Text style={[s.description, s.centerText]} accessibilityLiveRegion="polite">Your new password is ready. Let’s get you signed in again.</Text>
      <View style={s.successSteps}>{["WhatsApp code verified", "New password saved securely", "Ready to sign in"].map((label, i) => <Animated.View key={label} style={[s.successRow, { opacity: values[i], transform: [{ translateY: values[i].interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}><Icon name="check-circle" size={22} color={GREEN} /><Text style={s.successLabel}>{label}</Text></Animated.View>)}</View>
      <TouchableOpacity style={s.primary} accessibilityRole="button" onPress={() => navigation.reset({ index: 0, routes: [{ name: "Login" }] })}><Text style={s.primaryText}>Back to sign in</Text><Icon name="arrow-right" size={21} color="white" /></TouchableOpacity>
      <Text style={s.helper}>Taking you to sign in automatically…</Text>
    </View>
  );
}

export default function ForgotPasswordScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [success, setSuccess] = useState(false);
  const pending = useRef(false);
  const mounted = useRef(true);
  const resendAt = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = setInterval(() => setCooldown(Math.max(0, Math.ceil((resendAt.current - Date.now()) / 1000))), 1000);
    return () => clearInterval(timer);
  }, [cooldown > 0]);

  const strong = password.length >= 8 && password.length <= 72 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
  const startOver = () => { setStep(0); setToken(null); setOtp(""); setPassword(""); setConfirm(""); setError(""); setNotice(""); };
  const run = async action => {
    if (pending.current) return;
    pending.current = true; setBusy(true); setError(""); setNotice(""); Keyboard.dismiss();
    try { await action(); }
    catch (e) { if (mounted.current) setError(e.errors?.[0]?.message || e.message || "Something went wrong. Please try again."); }
    finally { pending.current = false; if (mounted.current) setBusy(false); }
  };
  const sendCode = () => run(async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new Error("Enter a valid email address.");
    await requestPasswordReset(email.trim().toLowerCase());
    if (!mounted.current) return;
    setStep(1); setOtp(""); resendAt.current = Date.now() + 60000; setCooldown(60);
    setNotice("If this email matches an active account, we’ve sent a code to its registered WhatsApp number.");
  });
  const submit = () => {
    if (step === 0) { sendCode(); return; }
    run(async () => {
      if (step === 1) {
        if (!/^\d{6}$/.test(otp)) throw new Error("Enter the 6-digit code from WhatsApp.");
        const data = await verifyPasswordReset(email.trim().toLowerCase(), otp);
        if (mounted.current) { setToken(data.resetToken); setOtp(""); setStep(2); }
      } else {
        if (!strong) throw new Error("Use 8–72 characters with uppercase, lowercase and a number.");
        if (password !== confirm) throw new Error("Your passwords don’t match.");
        await completePasswordReset(token, password);
        if (mounted.current) { setPassword(""); setConfirm(""); setToken(null); setSuccess(true); }
      }
    });
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View style={s.topBar}>
            <TouchableOpacity style={s.back} disabled={busy} accessibilityRole="button" accessibilityLabel="Back to sign in" onPress={() => navigation.navigate("Login")}><Icon name="arrow-left" size={23} color={GREEN} /></TouchableOpacity>
            <Image source={require("../../assets/logo.png")} style={s.logo} resizeMode="contain" accessibilityLabel="BinGo logo" />
            <View style={s.backSpacer} />
          </View>
          {success ? <ResetSuccess navigation={navigation} /> : <>
            <View style={s.steps}>{LABELS.map((label, i) => <View style={s.step} key={label}><View style={[s.stepCircle, i <= step && s.stepCircleActive]}>{i < step ? <Icon name="check" size={15} color="white" /> : <Text style={[s.stepNumber, i <= step && s.white]}>{i + 1}</Text>}</View><Text style={[s.stepLabel, i === step && s.stepLabelActive]}>{label}</Text></View>)}</View>
            <View style={s.heroIcon}><Icon name={ICONS[step]} size={33} color={GREEN} /></View>
            <Text style={s.eyebrow}>ACCOUNT RECOVERY · 0{step + 1} / 03</Text>
            <Text style={s.title} accessibilityRole="header">{TITLES[step]}</Text>
            <Text style={s.description}>{step === 0 ? "Enter your account email. We’ll send a verification code to the WhatsApp number you registered with BinGo." : step === 1 ? `Enter the 6-digit code for ${email.trim()}. The code is valid for 10 minutes.` : "Choose a strong password you haven’t used before. Your other signed-in sessions will be signed out."}</Text>
            <View style={s.form}>
              {step === 0 && <Field label="Email address" icon="email-outline" value={email} onChangeText={setEmail} placeholder="you@example.com" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" textContentType="emailAddress" editable={!busy} returnKeyType="done" onSubmitEditing={submit} />}
              {step === 1 && <Field label="Verification code" icon="shield-key-outline" value={otp} onChangeText={text => setOtp(text.replace(/\D/g, "").slice(0, 6))} placeholder="000000" keyboardType="number-pad" maxLength={6} autoComplete="sms-otp" textContentType="oneTimeCode" editable={!busy} />}
              {step === 2 && <>
                <Field label="New password" icon="lock-outline" value={password} onChangeText={setPassword} placeholder="Enter a new password" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" editable={!busy} maxLength={72}>
                  <TouchableOpacity style={s.eye} onPress={() => setShowPassword(!showPassword)} accessibilityRole="button" accessibilityLabel={showPassword ? "Hide passwords" : "Show passwords"}><Icon name={showPassword ? "eye-off-outline" : "eye-outline"} size={21} color="#72877B" /></TouchableOpacity>
                </Field>
                <View style={s.rules}>{[[password.length >= 8, "At least 8 characters"], [/[A-Z]/.test(password) && /[a-z]/.test(password), "Uppercase & lowercase"], [/\d/.test(password), "At least one number"]].map(([met, label]) => <View key={label} style={s.rule}><Icon name={met ? "check-circle" : "circle-outline"} size={14} color={met ? GREEN : "#9AA79F"} /><Text style={[s.ruleText, met && { color: GREEN }]}>{label}</Text></View>)}</View>
                <Field label="Confirm password" icon="lock-check-outline" value={confirm} onChangeText={setConfirm} placeholder="Re-enter your password" secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} textContentType="newPassword" editable={!busy} maxLength={72} onSubmitEditing={submit} />
              </>}
              {!!notice && <View style={s.notice}><Icon name="whatsapp" size={20} color={GREEN} /><Text style={s.noticeText} accessibilityLiveRegion="polite">{notice}</Text></View>}
              {!!error && <View style={s.errorBox}><Icon name="alert-circle-outline" size={20} color="#B43C35" /><Text style={s.errorText} accessibilityRole="alert">{error}</Text></View>}
              <TouchableOpacity style={[s.primary, busy && s.disabled]} disabled={busy} accessibilityRole="button" accessibilityState={{ disabled: busy, busy }} onPress={submit}>{busy ? <ActivityIndicator color="white" /> : <><Text style={s.primaryText}>{["Send WhatsApp code", "Verify code", "Reset password"][step]}</Text><Icon name="arrow-right" size={21} color="white" /></>}</TouchableOpacity>
              {step === 1 && <TouchableOpacity disabled={busy || cooldown > 0} style={s.textButton} accessibilityRole="button" onPress={sendCode}><Text style={[s.link, (busy || cooldown > 0) && s.muted]}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn’t get a code? Resend"}</Text></TouchableOpacity>}
              {step > 0 && <TouchableOpacity disabled={busy} onPress={startOver} style={s.textButton} accessibilityRole="button"><Text style={s.link}>{step === 1 ? "Use a different email" : "Start again with a new code"}</Text></TouchableOpacity>}
            </View>
            <View style={s.securityNote}><Icon name="shield-check-outline" size={18} color="#72877B" /><Text style={s.securityText}>{step === 0 ? "No access to your registered WhatsApp? Contact your BinGo administrator for help." : "Keep your verification code private. BinGo will never ask you to share it."}</Text></View>
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 }, container: { flex: 1, backgroundColor: "#FAFBF7" }, scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 28 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, marginBottom: 26 }, logo: { width: 112, height: 44 }, back: { width: 44, height: 44, borderRadius: 15, backgroundColor: "#EDF2EA", alignItems: "center", justifyContent: "center" }, backSpacer: { width: 44 },
  steps: { flexDirection: "row", paddingBottom: 28 }, step: { flex: 1, alignItems: "center", gap: 7 }, stepCircle: { width: 27, height: 27, borderRadius: 14, backgroundColor: "#E7ECE5", alignItems: "center", justifyContent: "center" }, stepCircleActive: { backgroundColor: GREEN }, stepNumber: { color: "#849186", fontSize: 12, fontWeight: "700" }, white: { color: "white" }, stepLabel: { color: "#87938A", fontSize: 10 }, stepLabelActive: { color: GREEN, fontWeight: "700" },
  heroIcon: { width: 68, height: 68, borderRadius: 23, backgroundColor: "#E8F0E5", alignItems: "center", justifyContent: "center", marginBottom: 24 }, eyebrow: { fontSize: 10, letterSpacing: 1.6, color: GREEN, fontWeight: "800", marginBottom: 12 }, title: { color: "#173F2E", fontWeight: "800", fontSize: 34, lineHeight: 41, letterSpacing: -1, marginBottom: 14 }, description: { color: "#6B7B71", fontSize: 14, lineHeight: 23 },
  form: { marginTop: 27 }, fieldGroup: { marginBottom: 18 }, fieldLabel: { fontSize: 12, fontWeight: "700", color: "#304D3D", marginBottom: 8 }, inputWrap: { borderWidth: 1, borderColor: "#DCE5DA", backgroundColor: "white", borderRadius: 14, paddingLeft: 15, flexDirection: "row", alignItems: "center", gap: 10 }, input: { flex: 1, color: "#243D30", minHeight: 56, fontSize: 15, paddingVertical: 13, paddingRight: 12 }, eye: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center" },
  primary: { minHeight: 56, padding: 17, backgroundColor: GREEN, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, primaryText: { color: "white", fontSize: 15, fontWeight: "700" }, disabled: { opacity: 0.6 }, textButton: { minHeight: 44, alignItems: "center", justifyContent: "center", marginTop: 4 }, link: { color: GREEN, fontWeight: "600", fontSize: 12 }, muted: { color: "#87938A" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 9, padding: 13, borderRadius: 12, backgroundColor: "#EAF2E8", marginBottom: 18 }, noticeText: { flex: 1, color: GREEN, fontSize: 12, lineHeight: 19 }, errorBox: { flexDirection: "row", gap: 9, backgroundColor: "#FBECE9", padding: 13, borderRadius: 12, marginBottom: 18 }, errorText: { flex: 1, color: "#B43C35", fontSize: 12, lineHeight: 19 },
  rules: { gap: 7, marginTop: -6, marginBottom: 20 }, rule: { flexDirection: "row", gap: 6, alignItems: "center" }, ruleText: { fontSize: 11, color: "#87938A" }, securityNote: { flexDirection: "row", gap: 9, marginTop: 24, paddingHorizontal: 5 }, securityText: { flex: 1, fontSize: 11, lineHeight: 18, color: "#7D8C81" },
  success: { flex: 1, justifyContent: "center", paddingBottom: 25 }, successCircle: { alignSelf: "center", backgroundColor: "#E5F0E1", width: 116, height: 116, borderRadius: 58, justifyContent: "center", alignItems: "center", marginBottom: 30 }, centerText: { textAlign: "center" }, successSteps: { backgroundColor: "white", borderWidth: 1, borderColor: "#E1E8DC", borderRadius: 20, padding: 22, gap: 22, marginVertical: 28 }, successRow: { flexDirection: "row", gap: 12, alignItems: "center" }, successLabel: { color: "#304D3D", fontSize: 13, fontWeight: "600" }, helper: { color: "#87938A", fontSize: 11, textAlign: "center", marginTop: 18 },
});
