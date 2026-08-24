/**
 * BinGo – Register Screen
 *
 * Multi-step registration:
 *   Step 1 – Role selection (Resident / Community Leader / Waste Authority)
 *   Step 2 – Account details (name, email, password, role-specific fields)
 *   Step 3 – Phone number + send OTP
 *
 * After step 3 the user is navigated to OtpVerification screen.
 * On successful OTP verification the backend returns a token and
 * RootNavigator automatically switches to MainNavigator.
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { register, sendOtp } from "../services/authService";
import COLORS from "../constants/colors";

// Pure JS eye icon — no native dependency
const EyeIcon = ({ visible }) => (
  <Text style={{ fontSize: 17, color: COLORS.TEXT_SECONDARY }}>
    {visible ? "🙈" : "👁"}
  </Text>
);

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  {
    key: "resident",
    label: "Resident",
    emoji: "🏠",
    description: "Report waste, track collection schedules, earn rewards.",
  },
  {
    key: "community_leader",
    label: "Community Leader",
    emoji: "👥",
    description: "Coordinate your community, manage local clean-up drives.",
  },
  {
    key: "waste_authority",
    label: "Waste Authority",
    emoji: "♻️",
    description: "Manage collection routes and respond to reports.",
  },
];

// ── Step indicator ────────────────────────────────────────────────────────────
const StepIndicator = ({ current, total }) => (
  <View style={styles.stepRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[styles.stepDot, i < current ? styles.stepDone : i === current ? styles.stepActive : styles.stepInactive]}
      />
    ))}
  </View>
);

// ── Labelled text input ───────────────────────────────────────────────────────
const Field = ({ label, error, inputRef, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      ref={inputRef}
      style={[styles.input, error && styles.inputError]}
      placeholderTextColor={COLORS.TEXT_DISABLED}
      {...props}
    />
    {error ? <Text style={styles.errorText}>{error}</Text> : null}
  </View>
);

// ── Password input with show/hide toggle ──────────────────────────────────────
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
          onPress={() => setVisible((v) => !v)}
          style={styles.eyeButton}
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
        >
          <EyeIcon visible={visible} />
        </Pressable>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const { login: storeAuth } = useAuth();

  // Step: 0 = role, 1 = details, 2 = phone
  const [step, setStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState(null);

  // Step 2 fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [communityName, setCommunityName] = useState("");

  // Step 3 fields
  const [phone, setPhone] = useState("");

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Refs for keyboard chaining
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  const addressRef = useRef(null);
  const communityRef = useRef(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateDetails = () => {
    const e = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Enter a valid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Minimum 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      e.password = "Must include uppercase, lowercase and a number";
    if (!confirmPassword) e.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword) e.confirmPassword = "Passwords do not match";
    if (selectedRole === "resident" && !address.trim())
      e.address = "Address is required for residents";
    if (selectedRole === "community_leader" && !communityName.trim())
      e.communityName = "Community name is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validatePhone = () => {
    const e = {};
    if (!phone.trim()) e.phone = "Phone number is required";
    else if (!/^[\d\s\+\-\(\)]{7,20}$/.test(phone.trim()))
      e.phone = "Enter a valid phone number";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleRoleSelect = (roleKey) => {
    setSelectedRole(roleKey);
    setStep(1);
  };

  const handleDetailsNext = () => {
    if (validateDetails()) setStep(2);
  };

  const handleRegisterAndSendOtp = async () => {
    if (!validatePhone()) return;
    setLoading(true);
    try {
      // Register the user first
      const result = await register({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
        phone: phone.trim(),
        role: selectedRole,
        address: address.trim() || null,
        communityName: communityName.trim() || null,
      });

      // Store auth so the user is logged in after OTP verification
      await storeAuth(result.user, result.token);

      // Send OTP to their phone
      await sendOtp(phone.trim());

      // Navigate to OTP verification screen
      navigation.navigate("OtpVerification", { phone: phone.trim() });
    } catch (error) {
      Alert.alert("Registration Failed", error.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 0) navigation.goBack();
    else setStep((s) => s - 1);
  };

  // ── Render helpers ──────────────────────────────────────────────────────────
  const renderRoleStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Who are you?</Text>
      <Text style={styles.sectionSubtitle}>Select your role to get started</Text>
      <View style={styles.roleList}>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.key}
            style={styles.roleCard}
            onPress={() => handleRoleSelect(role.key)}
            accessibilityRole="button"
            accessibilityLabel={`Select role: ${role.label}`}
          >
            <Text style={styles.roleEmoji}>{role.emoji}</Text>
            <View style={styles.roleTextBlock}>
              <Text style={styles.roleLabel}>{role.label}</Text>
              <Text style={styles.roleDesc}>{role.description}</Text>
            </View>
            <Text style={styles.roleArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderDetailsStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Details</Text>
      <Text style={styles.sectionSubtitle}>
        Registering as{" "}
        <Text style={styles.roleHighlight}>
          {ROLES.find((r) => r.key === selectedRole)?.label}
        </Text>
      </Text>

      <View style={styles.form}>
        <Field
          label="Full Name"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: null })); }}
          error={errors.name}
          placeholder="Your full name"
          autoComplete="name"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => emailRef.current?.focus()}
        />
        <Field
          label="Email Address"
          inputRef={emailRef}
          value={email}
          onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: null })); }}
          error={errors.email}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordField
          label="Password"
          inputRef={passwordRef}
          value={password}
          onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: null, confirmPassword: null })); }}
          error={errors.password}
          placeholder="Min. 8 chars, uppercase, number"
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        <PasswordField
          label="Confirm Password"
          inputRef={confirmPasswordRef}
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setErrors((e) => ({ ...e, confirmPassword: null })); }}
          error={errors.confirmPassword}
          placeholder="Re-enter your password"
          returnKeyType={selectedRole === "resident" ? "next" : selectedRole === "community_leader" ? "next" : "done"}
          blurOnSubmit={selectedRole !== "resident" && selectedRole !== "community_leader"}
          onSubmitEditing={() => {
            if (selectedRole === "resident") addressRef.current?.focus();
            else if (selectedRole === "community_leader") communityRef.current?.focus();
          }}
        />

        {/* Resident — address field */}
        {selectedRole === "resident" && (
          <Field
            label="Home Address"
            inputRef={addressRef}
            value={address}
            onChangeText={(t) => { setAddress(t); setErrors((e) => ({ ...e, address: null })); }}
            error={errors.address}
            placeholder="Your home address"
            autoCapitalize="words"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        )}

        {/* Community leader — community name field */}
        {selectedRole === "community_leader" && (
          <Field
            label="Community Name"
            inputRef={communityRef}
            value={communityName}
            onChangeText={(t) => { setCommunityName(t); setErrors((e) => ({ ...e, communityName: null })); }}
            error={errors.communityName}
            placeholder="e.g. Colombo 5 Residents Association"
            autoCapitalize="words"
            returnKeyType="done"
            blurOnSubmit={true}
          />
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={handleDetailsNext}
          accessibilityRole="button"
          accessibilityLabel="Continue to phone verification"
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPhoneStep = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Verify Phone</Text>
      <Text style={styles.sectionSubtitle}>
        We'll send a 6-digit code to confirm your number
      </Text>

      <View style={styles.form}>
        <Field
          label="Phone Number"
          value={phone}
          onChangeText={(t) => { setPhone(t); setErrors((e) => ({ ...e, phone: null })); }}
          error={errors.phone}
          placeholder="+94 77 123 4567"
          keyboardType="phone-pad"
          returnKeyType="done"
          blurOnSubmit={true}
          onSubmitEditing={handleRegisterAndSendOtp}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegisterAndSendOtp}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel="Create account and send OTP"
        >
          {loading ? (
            <ActivityIndicator color={COLORS.TEXT_INVERSE} />
          ) : (
            <Text style={styles.buttonText}>Create Account & Send OTP</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.phoneNote}>
          Standard SMS rates may apply. OTP valid for 10 minutes.
        </Text>
      </View>
    </View>
  );

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* Header */}
          <View style={styles.topBar}>
            <TouchableOpacity
              onPress={goBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Text style={styles.backText}>← Back</Text>
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
          {step === 2 && renderPhoneStep()}

          {/* Login link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="link"
            >
              <Text style={styles.linkText}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  backButton: { paddingVertical: 4 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },

  stepRow: { flexDirection: "row", gap: 6 },
  stepDot: { height: 6, borderRadius: 3 },
  stepActive: { width: 20, backgroundColor: COLORS.PRIMARY },
  stepDone: { width: 12, backgroundColor: COLORS.PRIMARY_LIGHT },
  stepInactive: { width: 12, backgroundColor: COLORS.BORDER },

  logo: { width: 140, height: 52, alignSelf: "center", marginVertical: 16 },

  section: { marginBottom: 8 },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.TEXT_SECONDARY,
    marginBottom: 24,
    lineHeight: 20,
  },
  roleHighlight: { color: COLORS.PRIMARY, fontWeight: "600" },

  // Role cards
  roleList: { gap: 12 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  roleEmoji: { fontSize: 32 },
  roleTextBlock: { flex: 1 },
  roleLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  roleDesc: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },
  roleArrow: { fontSize: 22, color: COLORS.PRIMARY, fontWeight: "bold" },

  // Form
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  input: {
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  inputError: { borderColor: COLORS.ERROR },
  errorText: { fontSize: 12, color: COLORS.ERROR },

  // Password with eye toggle
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.SURFACE,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    borderRadius: 10,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.TEXT_PRIMARY,
  },
  eyeButton: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },

  phoneNote: {
    fontSize: 12,
    color: COLORS.TEXT_DISABLED,
    textAlign: "center",
    marginTop: 4,
  },

  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  linkText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: "600" },
});

export default RegisterScreen;
