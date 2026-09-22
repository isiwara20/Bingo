/**
 * BinGo – Register Screen
 *
 * Multi-step registration:
 *   Step 0 – Role selection (Resident / Community Leader / Waste Authority)
 *   Step 1 – Account details (role-specific fields)
 *   Step 2 – WhatsApp number → OTP sent → OTP overlay modal appears
 *
 * OTP verification happens as an overlay modal on this screen.
 * No separate navigation — the modal slides up over the form.
 *
 * Role-specific fields:
 *   resident        → Full Name, Address
 *   community_leader → Full Name, Community Name
 *   waste_authority  → Authority Name (organisation, not personal name)
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Image, Pressable, Modal,
  Animated, Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { register, sendOtp, verifyOtp } from "../services/authService";
import COLORS from "../constants/colors";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  {
    key: "resident",
    label: "Resident",
    icon: "home-account",
    color: COLORS.PRIMARY,
    bg: "#E8F5E9",
    description: "Report waste, track collection schedules, earn rewards.",
  },
  {
    key: "community_leader",
    label: "Community Leader",
    icon: "account-group",
    color: "#1565C0",
    bg: "#E3F2FD",
    description: "Coordinate your community and manage local clean-up drives.",
  },
  {
    key: "waste_authority",
    label: "Waste Authority",
    icon: "recycle",
    color: "#00695C",
    bg: "#E0F2F1",
    description: "Manage collection routes and respond to waste reports.",
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, total }) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          styles.stepDot,
          i < current  ? styles.stepDone
          : i === current ? styles.stepActive
          : styles.stepInactive,
        ]}
      />
    ))}
  </View>
);

// ── Plain text field ──────────────────────────────────────────────────────────
const Field = ({ label, hint, error, inputRef, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    <TextInput
      ref={inputRef}
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={COLORS.TEXT_DISABLED}
      {...props}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ── Password field with eye toggle ────────────────────────────────────────────
const PasswordField = ({ label, error, inputRef, value, onChangeText, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.passwordRow, error && styles.inputError]}>
        <TextInput
          ref={inputRef}
          style={styles.passwordInput}
          placeholderTextColor={COLORS.TEXT_DISABLED}
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
        <Pressable
          onPress={() => setVisible(v => !v)}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          hitSlop={10}
        >
          <Icon
            name={visible ? "eye-off-outline" : "eye-outline"}
            size={22}
            color={COLORS.TEXT_SECONDARY}
          />
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// ── OTP overlay modal ─────────────────────────────────────────────────────────
const OtpOverlay = ({
  visible,
  whatsappNumber,
  onVerified,
  onClose,
  onResend,
}) => {
  const [digits, setDigits]         = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading]       = useState(false);
  const [resending, setResending]   = useState(false);
  const [countdown, setCountdown]   = useState(RESEND_SECONDS);
  const [error, setError]           = useState(null);
  const inputRefs                   = useRef([]);
  const slideAnim                   = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets                      = useSafeAreaInsets();

  // Slide animation when visible changes
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 20,
      stiffness: 150,
    }).start();
    if (visible) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setError(null);
      setCountdown(RESEND_SECONDS);
      setTimeout(() => inputRefs.current[0]?.focus(), 400);
    }
  }, [visible]);

  // Countdown timer
  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, visible]);

  const handleDigit = (text, index) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError(null);
    if (digit && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
    if (digit && index === OTP_LENGTH - 1) {
      const full = [...next.slice(0, OTP_LENGTH - 1), digit].join("");
      if (full.length === OTP_LENGTH) doVerify(full);
    }
  };

  const handleKey = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const doVerify = async (otpStr) => {
    const otp = otpStr || digits.join("");
    if (otp.length < OTP_LENGTH) { setError("Enter all 6 digits."); return; }
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(whatsappNumber, otp);
      onVerified();
    } catch (err) {
      setError(err.message || "Invalid OTP. Try again.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const doResend = async () => {
    setResending(true);
    try {
      await onResend();
      setCountdown(RESEND_SECONDS);
      setDigits(Array(OTP_LENGTH).fill(""));
      setError(null);
      inputRefs.current[0]?.focus();
    } catch (err) {
      Alert.alert("Resend Failed", err.message || "Please try again.");
    } finally {
      setResending(false);
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Handle */}
        <View style={styles.sheetHandle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Verify WhatsApp</Text>
            <Text style={styles.sheetSubtitle}>
              OTP sent to{" "}
              <Text style={styles.sheetPhone}>{whatsappNumber}</Text>
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose} hitSlop={10}>
            <Icon name="close" size={22} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* WhatsApp branding */}
        <View style={styles.waBanner}>
          <Icon name="whatsapp" size={22} color="#25D366" />
          <Text style={styles.waBannerText}>
            Check your WhatsApp messages for the 6-digit code
          </Text>
        </View>

        {/* OTP boxes */}
        <View style={styles.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => (inputRefs.current[i] = r)}
              style={[
                styles.otpBox,
                d          && styles.otpBoxFilled,
                error      && styles.otpBoxError,
              ]}
              value={d}
              onChangeText={t => handleDigit(t, i)}
              onKeyPress={e => handleKey(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              selectTextOnFocus
              accessibilityLabel={`OTP digit ${i + 1}`}
            />
          ))}
        </View>

        {error ? <Text style={styles.otpError}>{error}</Text> : null}

        {/* Verify button */}
        <TouchableOpacity
          style={[
            styles.verifyBtn,
            (loading || digits.join("").length < OTP_LENGTH) && styles.btnDisabled,
          ]}
          onPress={() => doVerify()}
          disabled={loading || digits.join("").length < OTP_LENGTH}
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.verifyBtnText}>Verify & Continue</Text>
          }
        </TouchableOpacity>

        {/* Resend */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.resendCountdown}>
              Resend in <Text style={styles.resendTimer}>{countdown}s</Text>
            </Text>
          ) : resending ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <TouchableOpacity onPress={doResend} accessibilityRole="button">
              <Text style={styles.resendLink}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    </Modal>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const { login: storeAuth } = useAuth();

  const [step, setStep]               = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);

  // Step 1 fields
  const [name, setName]                 = useState("");
  const [authorityName, setAuthName]    = useState("");
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [confirmPw, setConfirmPw]       = useState("");
  const [address, setAddress]           = useState("");
  const [communityName, setCommunity]   = useState("");

  // Step 2 — WhatsApp
  const [whatsapp, setWhatsapp]         = useState("");

  // OTP overlay
  const [otpVisible, setOtpVisible]     = useState(false);

  const [errors, setErrors]             = useState({});
  const [loading, setLoading]           = useState(false);

  // Refs
  const emailRef    = useRef(null);
  const pwRef       = useRef(null);
  const confirmRef  = useRef(null);
  const addressRef  = useRef(null);
  const communityRef = useRef(null);
  const authRef     = useRef(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateDetails = () => {
    const e = {};
    // Authority name instead of personal name for waste_authority
    if (selectedRole === "waste_authority") {
      if (!authorityName.trim() || authorityName.trim().length < 2)
        e.authorityName = "Authority name must be at least 2 characters";
    } else {
      if (!name.trim() || name.trim().length < 2)
        e.name = "Name must be at least 2 characters";
    }
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      e.password = "Must include uppercase, lowercase and a number";
    if (!confirmPw) e.confirmPw = "Please confirm your password";
    else if (password !== confirmPw) e.confirmPw = "Passwords do not match";
    if (selectedRole === "resident" && !address.trim())
      e.address = "Address is required for residents";
    if (selectedRole === "community_leader" && !communityName.trim())
      e.communityName = "Community name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateWhatsapp = () => {
    const e = {};
    if (!whatsapp.trim()) e.whatsapp = "WhatsApp number is required";
    else if (!/^[\d\s\+\-\(\)]{7,20}$/.test(whatsapp.trim()))
      e.whatsapp = "Enter a valid WhatsApp number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const goBack = () => {
    if (step === 0) navigation.goBack();
    else setStep(s => s - 1);
  };

  const handleRoleSelect = role => { setSelectedRole(role); setStep(1); };

  const handleDetailsNext = () => { if (validateDetails()) setStep(2); };

  const handleRegisterAndSendOtp = async () => {
    if (!validateWhatsapp()) return;
    setLoading(true);
    try {
      const displayName = selectedRole === "waste_authority"
        ? authorityName.trim()
        : name.trim();

      const result = await register({
        name: displayName,
        email: email.toLowerCase().trim(),
        password,
        whatsappNumber: whatsapp.trim(),
        role: selectedRole,
        address: address.trim() || null,
        communityName: communityName.trim() || null,
        authorityName: authorityName.trim() || null,
      });

      await storeAuth(result.user, result.token);
      await sendOtp(whatsapp.trim());
      setOtpVisible(true);
    } catch (err) {
      Alert.alert("Registration Failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    setOtpVisible(false);
    // RootNavigator auto-switches to Main since token is stored
  };

  const handleResendOtp = async () => {
    await sendOtp(whatsapp.trim());
  };

  // ── Render: role step ────────────────────────────────────────────────────────
  const renderRoleStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Who are you?</Text>
      <Text style={styles.sectionSubtitle}>Select your role to get started</Text>
      <View style={styles.roleList}>
        {ROLES.map(role => (
          <TouchableOpacity
            key={role.key}
            style={[styles.roleCard, { borderLeftColor: role.color }]}
            onPress={() => handleRoleSelect(role.key)}
            accessibilityRole="button"
            accessibilityLabel={`Select role: ${role.label}`}
          >
            <View style={[styles.roleIconBox, { backgroundColor: role.bg }]}>
              <Icon name={role.icon} size={28} color={role.color} />
            </View>
            <View style={styles.roleTextBlock}>
              <Text style={[styles.roleLabel, { color: role.color }]}>{role.label}</Text>
              <Text style={styles.roleDesc}>{role.description}</Text>
            </View>
            <Icon name="chevron-right" size={22} color={COLORS.TEXT_DISABLED} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Render: details step ─────────────────────────────────────────────────────
  const renderDetailsStep = () => {
    const roleInfo = ROLES.find(r => r.key === selectedRole);
    return (
      <View style={styles.section}>
        {/* Role badge */}
        <View style={[styles.roleBadge, { backgroundColor: roleInfo?.bg }]}>
          <Icon name={roleInfo?.icon} size={16} color={roleInfo?.color} />
          <Text style={[styles.roleBadgeText, { color: roleInfo?.color }]}>
            {roleInfo?.label}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Account Details</Text>

        <View style={styles.form}>
          {/* waste_authority gets organisation name, others get personal name */}
          {selectedRole === "waste_authority" ? (
            <Field
              label="Authority / Organisation Name"
              hint="Your waste management authority or organisation name"
              inputRef={authRef}
              value={authorityName}
              onChangeText={t => { setAuthName(t); setErrors(e => ({ ...e, authorityName: null })); }}
              error={errors.authorityName}
              placeholder="e.g. Colombo Municipal Council"
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          ) : (
            <Field
              label="Full Name"
              value={name}
              onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: null })); }}
              error={errors.name}
              placeholder="Your full name"
              autoComplete="name"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}

          <Field
            label="Email Address"
            inputRef={emailRef}
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: null })); }}
            error={errors.email}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => pwRef.current?.focus()}
          />

          <PasswordField
            label="Password"
            inputRef={pwRef}
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: null, confirmPw: null })); }}
            error={errors.password}
            placeholder="Min. 8 chars, uppercase, number"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />

          <PasswordField
            label="Confirm Password"
            inputRef={confirmRef}
            value={confirmPw}
            onChangeText={t => { setConfirmPw(t); setErrors(e => ({ ...e, confirmPw: null })); }}
            error={errors.confirmPw}
            placeholder="Re-enter your password"
            returnKeyType={
              selectedRole === "resident" ? "next"
              : selectedRole === "community_leader" ? "next"
              : "done"
            }
            blurOnSubmit={selectedRole === "waste_authority"}
            onSubmitEditing={() => {
              if (selectedRole === "resident") addressRef.current?.focus();
              else if (selectedRole === "community_leader") communityRef.current?.focus();
            }}
          />

          {selectedRole === "resident" && (
            <Field
              label="Home Address"
              hint="Street address, city"
              inputRef={addressRef}
              value={address}
              onChangeText={t => { setAddress(t); setErrors(e => ({ ...e, address: null })); }}
              error={errors.address}
              placeholder="No. 12, Main Street, Colombo"
              autoCapitalize="words"
              returnKeyType="done"
              blurOnSubmit
            />
          )}

          {selectedRole === "community_leader" && (
            <Field
              label="Community Name"
              hint="Name of the community or residents' association"
              inputRef={communityRef}
              value={communityName}
              onChangeText={t => { setCommunity(t); setErrors(e => ({ ...e, communityName: null })); }}
              error={errors.communityName}
              placeholder="e.g. Colombo 5 Residents Association"
              autoCapitalize="words"
              returnKeyType="done"
              blurOnSubmit
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleDetailsNext}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── Render: WhatsApp step ────────────────────────────────────────────────────
  const renderWhatsappStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>WhatsApp Number</Text>
      <Text style={styles.sectionSubtitle}>
        We'll send a 6-digit verification code to your WhatsApp
      </Text>

      {/* WhatsApp info banner */}
      <View style={styles.waBannerLarge}>
        <Icon name="whatsapp" size={32} color="#25D366" />
        <View style={{ flex: 1 }}>
          <Text style={styles.waBannerTitle}>WhatsApp Verification</Text>
          <Text style={styles.waBannerDesc}>
            Make sure the number is active on WhatsApp before proceeding
          </Text>
        </View>
      </View>

      <View style={styles.form}>
        <Field
          label="WhatsApp Number"
          hint="Include country code, e.g. +94 77 123 4567"
          value={whatsapp}
          onChangeText={t => { setWhatsapp(t); setErrors(e => ({ ...e, whatsapp: null })); }}
          error={errors.whatsapp}
          placeholder="+94 77 123 4567"
          keyboardType="phone-pad"
          returnKeyType="done"
          blurOnSubmit
          onSubmitEditing={handleRegisterAndSendOtp}
        />

        <TouchableOpacity
          style={[styles.button, styles.waButton, loading && styles.btnDisabled]}
          onPress={handleRegisterAndSendOtp}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={styles.waButtonInner}>
              <Icon name="whatsapp" size={20} color="#fff" />
              <Text style={styles.buttonText}>Create Account & Send OTP</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.noteText}>
          OTP is valid for 10 minutes. Standard WhatsApp data rates may apply.
        </Text>
      </View>
    </View>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Top bar */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={goBack}
              style={styles.backBtn}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Icon name="arrow-left" size={22} color={COLORS.PRIMARY} />
            </TouchableOpacity>
            <StepIndicator current={step} total={3} />
          </View>

          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="BinGo logo"
          />

          {step === 0 && renderRoleStep()}
          {step === 1 && renderDetailsStep()}
          {step === 2 && renderWhatsappStep()}

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")} accessibilityRole="link">
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP overlay — renders over everything */}
      <OtpOverlay
        visible={otpVisible}
        whatsappNumber={whatsapp}
        onVerified={handleOtpVerified}
        onClose={() => setOtpVisible(false)}
        onResend={handleResendOtp}
      />
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scrollContent: { flexGrow: 1, padding: 20, paddingBottom: 40 },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 4,
  },
  backBtn: { padding: 4 },

  stepRow: { flexDirection: "row", gap: 6 },
  stepDot: { height: 6, borderRadius: 3 },
  stepActive:   { width: 22, backgroundColor: COLORS.PRIMARY },
  stepDone:     { width: 14, backgroundColor: COLORS.PRIMARY_LIGHT },
  stepInactive: { width: 14, backgroundColor: COLORS.BORDER },

  logo: { width: 140, height: 52, alignSelf: "center", marginVertical: 12 },

  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 22, fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY, marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13, color: COLORS.TEXT_SECONDARY,
    marginBottom: 20, lineHeight: 19,
  },

  // Role badge (step 1 header)
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10,
  },
  roleBadgeText: { fontSize: 12, fontWeight: "700" },

  // Role cards
  roleList: { gap: 12 },
  roleCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.SURFACE, borderRadius: 14,
    padding: 14, gap: 12, borderLeftWidth: 4,
    borderWidth: 1, borderColor: COLORS.BORDER,
    elevation: 2,
  },
  roleIconBox: {
    width: 52, height: 52, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  roleTextBlock: { flex: 1 },
  roleLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  roleDesc:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },

  // Form fields
  form: { gap: 14 },
  inputGroup: { gap: 4 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  hint:  { fontSize: 11, color: COLORS.TEXT_DISABLED },
  input: {
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.TEXT_PRIMARY,
  },
  inputError: { borderColor: COLORS.ERROR },
  errorText: { fontSize: 12, color: COLORS.ERROR },

  passwordRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 10,
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.TEXT_PRIMARY,
  },
  eyeBtn: {
    paddingHorizontal: 12, paddingVertical: 12,
    justifyContent: "center", alignItems: "center",
  },

  // WhatsApp banner (step 2)
  waBannerLarge: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#E8F5E9", borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: "#C8E6C9",
  },
  waBannerTitle: { fontSize: 14, fontWeight: "700", color: "#1B5E20" },
  waBannerDesc:  { fontSize: 12, color: "#388E3C", lineHeight: 17, marginTop: 2 },

  // Buttons
  button: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", marginTop: 6,
  },
  waButton: { backgroundColor: "#25D366" },
  waButtonInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  noteText: {
    fontSize: 11, color: COLORS.TEXT_DISABLED,
    textAlign: "center", lineHeight: 16,
  },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  linkText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: "600" },

  // ── OTP overlay ────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 12,
    elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.BORDER,
    alignSelf: "center", marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 14,
  },
  sheetTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  sheetSubtitle: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  sheetPhone: { fontWeight: "700", color: COLORS.PRIMARY },
  sheetClose: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center", alignItems: "center",
  },

  // WhatsApp banner inside modal
  waBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#E8F5E9", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 20,
  },
  waBannerText: { flex: 1, fontSize: 13, color: "#2E7D32", lineHeight: 18 },

  // OTP digit boxes
  otpRow: {
    flexDirection: "row", gap: 10,
    justifyContent: "center", marginBottom: 8,
  },
  otpBox: {
    width: 46, height: 56, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
    fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY,
  },
  otpBoxFilled: { borderColor: COLORS.PRIMARY, backgroundColor: "#E8F5E9" },
  otpBoxError:  { borderColor: COLORS.ERROR },
  otpError: {
    fontSize: 13, color: COLORS.ERROR,
    textAlign: "center", marginBottom: 8,
  },

  verifyBtn: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", marginTop: 10,
  },
  verifyBtnText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  resendRow: { alignItems: "center", marginTop: 16 },
  resendCountdown: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  resendTimer: { color: COLORS.PRIMARY, fontWeight: "600" },
  resendLink: { fontSize: 14, color: COLORS.PRIMARY, fontWeight: "600" },
});

export default RegisterScreen;
