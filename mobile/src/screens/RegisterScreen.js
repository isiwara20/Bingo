/**
 * BinGo – Register Screen
 *
 * Step 0 – Role selection (Resident / Community Leader / Waste Authority)
 * Step 1 – Account details (role-specific fields)
 * Step 2 – WhatsApp number entry
 * Step 3 – OTP overlay (bottom sheet, stays on screen)
 * Step 4 – Success screen (animated checkmark → redirects to Login)
 *
 * Role-specific fields:
 *   resident         → Full Name, Home Address
 *   community_leader → Full Name, Community Name
 *   waste_authority  → Authority / Organisation Name
 */

import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, Alert, Image, Pressable, Animated,
  Dimensions, Modal, Keyboard,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { useAuth } from "../context/AuthContext";
import { register, sendOtp, verifyOtp } from "../services/authService";
import COLORS from "../constants/colors";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

// ─────────────────────────────────────────────────────────────────────────────
// Role data
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Small shared components
// ─────────────────────────────────────────────────────────────────────────────
const StepIndicator = ({ current, total }) => (
  <View style={s.stepRow}>
    {Array.from({ length: total }).map((_, i) => (
      <View
        key={i}
        style={[
          s.stepDot,
          i < current ? s.stepDone : i === current ? s.stepActive : s.stepInactive,
        ]}
      />
    ))}
  </View>
);

const Field = ({ label, hint, error, inputRef, ...props }) => (
  <View style={s.inputGroup}>
    <Text style={s.label}>{label}</Text>
    {hint ? <Text style={s.hint}>{hint}</Text> : null}
    <TextInput
      ref={inputRef}
      style={[s.input, error && s.inputError]}
      placeholderTextColor={COLORS.TEXT_DISABLED}
      {...props}
    />
    {error ? <Text style={s.errorText}>{error}</Text> : null}
  </View>
);

const PasswordField = ({ label, error, inputRef, value, onChangeText, ...props }) => {
  const [visible, setVisible] = useState(false);
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.pwRow, error && s.inputError]}>
        <TextInput
          ref={inputRef}
          style={s.pwInput}
          placeholderTextColor={COLORS.TEXT_DISABLED}
          secureTextEntry={!visible}
          value={value}
          onChangeText={onChangeText}
          {...props}
        />
        <Pressable
          onPress={() => setVisible(v => !v)}
          style={s.eyeBtn}
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
      {error ? <Text style={s.errorText}>{error}</Text> : null}
    </View>
  );
};

// ── Password strength indicator ───────────────────────────────────────────────
const PW_RULES = [
  { key: "len",   label: "At least 8 characters",          test: v => v.length >= 8 },
  { key: "upper", label: "One uppercase letter (A–Z)",      test: v => /[A-Z]/.test(v) },
  { key: "lower", label: "One lowercase letter (a–z)",      test: v => /[a-z]/.test(v) },
  { key: "num",   label: "One number (0–9)",                test: v => /[0-9]/.test(v) },
  { key: "sym",   label: "One special character (!@#…)",    test: v => /[^A-Za-z0-9]/.test(v) },
];

const getStrength = (pw) => {
  const passed = PW_RULES.filter(r => r.test(pw)).length;
  if (passed <= 1) return { level: 0, label: "Very Weak",  color: "#F44336" };
  if (passed === 2) return { level: 1, label: "Weak",       color: "#FF9800" };
  if (passed === 3) return { level: 2, label: "Fair",       color: "#FFC107" };
  if (passed === 4) return { level: 3, label: "Strong",     color: "#4CAF50" };
  return              { level: 4, label: "Very Strong", color: "#2E7D32" };
};

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const { level, label, color } = getStrength(password);
  return (
    <View style={ps.container}>
      {/* Strength bar */}
      <View style={ps.barRow}>
        {[0, 1, 2, 3, 4].map(i => (
          <View
            key={i}
            style={[
              ps.barSegment,
              { backgroundColor: i <= level ? color : "#E0E0E0" },
            ]}
          />
        ))}
        <Text style={[ps.barLabel, { color }]}>{label}</Text>
      </View>
      {/* Rules checklist */}
      <View style={ps.rules}>
        {PW_RULES.map(rule => {
          const ok = rule.test(password);
          return (
            <View key={rule.key} style={ps.ruleRow}>
              <Icon
                name={ok ? "check-circle" : "circle-outline"}
                size={14}
                color={ok ? "#4CAF50" : "#BDBDBD"}
              />
              <Text style={[ps.ruleText, ok && ps.ruleOk]}>
                {rule.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const ps = StyleSheet.create({
  container: { marginTop: 6, gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  barSegment: { flex: 1, height: 5, borderRadius: 3 },
  barLabel: { fontSize: 12, fontWeight: "700", marginLeft: 6, minWidth: 72 },
  rules: { gap: 4 },
  ruleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  ruleText: { fontSize: 12, color: "#BDBDBD" },
  ruleOk:   { color: "#4CAF50" },
});
const STEPS = [
  { icon: "account-check",      label: "Account Created",       color: "#4CAF50" },
  { icon: "phone-check",        label: "Phone Verified",        color: "#2196F3" },
  { icon: "shield-check",       label: "Identity Confirmed",    color: "#9C27B0" },
  { icon: "check-circle",       label: "All Set! Welcome 🎉",   color: "#FF9800" },
];

const SuccessOverlay = ({ visible, roleName, onDone }) => {
  const bgOpacity   = useRef(new Animated.Value(0)).current;
  const checkScale  = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(40)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const [currentStep, setCurrentStep] = useState(-1);
  const [done, setDone]               = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset
      bgOpacity.setValue(0);
      checkScale.setValue(0);
      checkOpacity.setValue(0);
      titleY.setValue(40);
      titleOpacity.setValue(0);
      setCurrentStep(-1);
      setDone(false);
      return;
    }

    // Step 1: fade in background
    Animated.timing(bgOpacity, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start(() => {
      // Step 2: pop in checkmark
      Animated.parallel([
        Animated.spring(checkScale, {
          toValue: 1, friction: 5, tension: 100, useNativeDriver: true,
        }),
        Animated.timing(checkOpacity, {
          toValue: 1, duration: 200, useNativeDriver: true,
        }),
      ]).start(() => {
        // Step 3: slide up title
        Animated.parallel([
          Animated.timing(titleY, {
            toValue: 0, duration: 300, useNativeDriver: true,
          }),
          Animated.timing(titleOpacity, {
            toValue: 1, duration: 300, useNativeDriver: true,
          }),
        ]).start(() => {
          // Step 4: animate through progress steps
          let step = 0;
          const nextStep = () => {
            if (step < STEPS.length) {
              setCurrentStep(step);
              step++;
              setTimeout(nextStep, 600);
            } else {
              setDone(true);
              setTimeout(onDone, 1200);
            }
          };
          setTimeout(nextStep, 300);
        });
      });
    });
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[s.successOverlay, { opacity: bgOpacity }]}>
      {/* Checkmark circle */}
      <Animated.View
        style={[
          s.successCircle,
          {
            transform: [{ scale: checkScale }],
            opacity: checkOpacity,
          },
        ]}
      >
        <Icon name="check-bold" size={56} color="#fff" />
      </Animated.View>

      {/* Title */}
      <Animated.View
        style={{
          transform: [{ translateY: titleY }],
          opacity: titleOpacity,
          alignItems: "center",
        }}
      >
        <Text style={s.successTitle}>Account Created!</Text>
        <Text style={s.successSub}>
          Welcome to BinGo as a{"\n"}
          <Text style={s.successRole}>{roleName}</Text>
        </Text>
      </Animated.View>

      {/* Progress steps */}
      <View style={s.stepsContainer}>
        {STEPS.map((step, i) => {
          const isActive   = i <= currentStep;
          const isCurrent  = i === currentStep;
          return (
            <Animated.View
              key={i}
              style={[
                s.stepRow2,
                {
                  opacity: isActive ? 1 : 0.25,
                  transform: [{ scale: isCurrent ? 1.05 : 1 }],
                },
              ]}
            >
              <View style={[s.stepIconBox, { backgroundColor: isActive ? step.color : "#ccc" }]}>
                <Icon name={step.icon} size={18} color="#fff" />
              </View>
              <Text style={[s.stepLabel, { color: isActive ? "#fff" : "rgba(255,255,255,0.4)" }]}>
                {step.label}
              </Text>
              {isActive && (
                <Icon name="check" size={16} color={step.color} style={s.stepCheck} />
              )}
            </Animated.View>
          );
        })}
      </View>

      {done && (
        <Text style={s.successHint}>Redirecting to sign in…</Text>
      )}
    </Animated.View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// OTP bottom-sheet overlay
// ─────────────────────────────────────────────────────────────────────────────
const OtpOverlay = ({
  visible,
  whatsappNumber,
  onVerified,
  onClose,
  onResend,
  onChangeNumber,
}) => {
  const insets  = useSafeAreaInsets();
  const slideY  = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const keyboardShift = useRef(new Animated.Value(0)).current;
  const [digits, setDigits]       = useState(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading]     = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [error, setError]         = useState(null);
  const inputRefs = useRef([]);

  // Slide in/out
  useEffect(() => {
    Animated.spring(slideY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      damping: 18,
      stiffness: 120,
      mass: 0.9,
    }).start(() => {
      if (visible) {
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      }
    });
    if (visible) {
      setDigits(Array(OTP_LENGTH).fill(""));
      setError(null);
      setCountdown(RESEND_SECONDS);
    }
  }, [visible]);

  // Keyboard shift — move sheet up when keyboard appears
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      Animated.timing(keyboardShift, {
        toValue: -e.endCoordinates.height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      Animated.timing(keyboardShift, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  // Countdown
  useEffect(() => {
    if (!visible || countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, visible]);

  const handleDigit = (text, idx) => {
    const d = text.replace(/[^0-9]/g, "").slice(-1);
    const next = [...digits];
    next[idx] = d;
    setDigits(next);
    setError(null);
    if (d && idx < OTP_LENGTH - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
    if (d && idx === OTP_LENGTH - 1) {
      const full = next.join("");
      if (full.length === OTP_LENGTH) doVerify(full);
    }
  };

  const handleKey = (e, idx) => {
    if (e.nativeEvent.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const doVerify = async (code) => {
    const otp = code || digits.join("");
    if (otp.length < OTP_LENGTH) { setError("Please enter all 6 digits."); return; }
    setLoading(true);
    setError(null);
    try {
      await verifyOtp(whatsappNumber, otp);
      onVerified();
    } catch (err) {
      setError(err.message || "Invalid OTP. Please try again.");
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
      Alert.alert("OTP Sent", `A new code was sent to ${whatsappNumber}`);
    } catch (err) {
      Alert.alert("Failed to Resend", err.message || "Please try again.");
    } finally {
      setResending(false);
    }
  };

  const filledCount = digits.filter(d => d !== "").length;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {/* Backdrop */}
      <Pressable style={s.backdrop} onPress={onClose} />

      {/* Sheet */}
      <Animated.View
        style={[
          s.sheet,
          {
            paddingBottom: insets.bottom + 16,
            transform: [
              { translateY: slideY },
              { translateY: keyboardShift },
            ],
          },
        ]}
      >
        {/* Drag handle */}
        <View style={s.handle} />

        {/* Header */}
        <View style={s.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.sheetTitle}>Enter OTP</Text>
            <Text style={s.sheetSub}>
              Code sent via WhatsApp to{" "}
              <Text style={s.sheetNum}>{whatsappNumber}</Text>
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={s.closeBtn}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Icon name="close" size={20} color={COLORS.TEXT_SECONDARY} />
          </TouchableOpacity>
        </View>

        {/* WA banner */}
        <View style={s.waBanner}>
          <Icon name="whatsapp" size={20} color="#25D366" />
          <Text style={s.waBannerTxt}>
            Check your WhatsApp for the 6-digit code
          </Text>
        </View>

        {/* OTP boxes */}
        <View style={s.otpRow}>
          {digits.map((d, i) => (
            <TextInput
              key={i}
              ref={r => (inputRefs.current[i] = r)}
              style={[
                s.otpBox,
                d     && s.otpFilled,
                error && s.otpError,
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

        {error ? <Text style={s.otpErrTxt}>{error}</Text> : null}

        {/* Verify button */}
        <TouchableOpacity
          style={[
            s.verifyBtn,
            (loading || filledCount < OTP_LENGTH) && s.btnDisabled,
          ]}
          onPress={() => doVerify()}
          disabled={loading || filledCount < OTP_LENGTH}
          accessibilityRole="button"
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Icon name="check-circle-outline" size={20} color="#fff" />
                <Text style={s.verifyBtnTxt}>Verify & Create Account</Text>
              </View>
            )
          }
        </TouchableOpacity>

        {/* Actions row */}
        <View style={s.actionsRow}>
          {/* Resend */}
          <View style={s.actionItem}>
            {countdown > 0 ? (
              <Text style={s.countdownTxt}>
                Resend in <Text style={s.countdownNum}>{countdown}s</Text>
              </Text>
            ) : resending ? (
              <ActivityIndicator size="small" color={COLORS.PRIMARY} />
            ) : (
              <TouchableOpacity
                onPress={doResend}
                style={s.actionBtn}
                accessibilityRole="button"
              >
                <Icon name="refresh" size={16} color={COLORS.PRIMARY} />
                <Text style={s.actionBtnTxt}>Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.actionDivider} />

          {/* Change number */}
          <TouchableOpacity
            style={s.actionItem}
            onPress={onChangeNumber}
            accessibilityRole="button"
          >
            <View style={s.actionBtn}>
              <Icon name="pencil-outline" size={16} color="#1565C0" />
              <Text style={[s.actionBtnTxt, { color: "#1565C0" }]}>
                Change Number
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Register Screen
// ─────────────────────────────────────────────────────────────────────────────
const RegisterScreen = ({ navigation }) => {
  const { login: storeAuth, logout } = useAuth();

  const [step, setStep]             = useState(0);
  const [selectedRole, setRole]     = useState(null);

  // Step 1 fields
  const [name, setName]             = useState("");
  const [authName, setAuthName]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPw, setConfirmPw]   = useState("");
  const [address, setAddress]       = useState("");
  const [community, setCommunity]   = useState("");

  // Step 2 fields
  const [whatsapp, setWhatsapp]     = useState("");

  // UI state
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(false);
  const [otpVisible, setOtpVisible] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const emailRef     = useRef(null);
  const pwRef        = useRef(null);
  const confirmRef   = useRef(null);
  const addressRef   = useRef(null);
  const communityRef = useRef(null);
  const authRef      = useRef(null);
  const pendingAuthRef = useRef(null);

  // ── Validation ──────────────────────────────────────────────────────────────
  const validateDetails = () => {
    const e = {};
    if (selectedRole === "waste_authority") {
      if (!authName.trim() || authName.trim().length < 2)
        e.authName = "Authority name must be at least 2 characters";
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
      e.address = "Address is required";
    if (selectedRole === "community_leader" && !community.trim())
      e.community = "Community name is required";
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

  // Store registration result temporarily — only commit to auth after OTP verified

  const handleRegisterAndSendOtp = async () => {
    if (!validateWhatsapp()) return;
    setLoading(true);
    try {
      const displayName = selectedRole === "waste_authority"
        ? authName.trim() : name.trim();

      const result = await register({
        name: displayName,
        email: email.toLowerCase().trim(),
        password,
        whatsappNumber: whatsapp.trim(),
        role: selectedRole,
        address: address.trim() || null,
        communityName: community.trim() || null,
        authorityName: authName.trim() || null,
      });

      // Do NOT call storeAuth here — that makes isLoggedIn=true
      // which causes RootNavigator to switch to dashboard immediately
      pendingAuthRef.current = result;

      await sendOtp(whatsapp.trim());
      setOtpVisible(true);
    } catch (err) {
      Alert.alert("Registration Failed", err.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = () => {
    // Close OTP sheet — show success animation FIRST
    // Do NOT call storeAuth yet — that triggers RootNavigator to go to dashboard
    setOtpVisible(false);
    setSuccessVisible(true);
  };

  const handleSuccessDone = async () => {
    setSuccessVisible(false);
    // NOW store auth and navigate to Login (not dashboard)
    // We use navigation.replace so back button can't return here
    if (pendingAuthRef.current) {
      // Store briefly then immediately clear so isLoggedIn doesn't trigger dashboard
      // We just need the navigate to happen
      pendingAuthRef.current = null;
    }
    navigation.replace("Login");
  };

  const handleResend = async () => {
    await sendOtp(whatsapp.trim());
  };

  const handleChangeNumber = () => {
    setOtpVisible(false);
    // Clears the whatsapp field so user can re-enter
    setWhatsapp("");
  };

  // ── Role step ────────────────────────────────────────────────────────────────
  const renderRoleStep = () => (
    <View style={s.section}>
      <Text style={s.title}>Who are you?</Text>
      <Text style={s.subtitle}>Select your role to get started</Text>
      <View style={s.roleList}>
        {ROLES.map(role => (
          <TouchableOpacity
            key={role.key}
            style={[s.roleCard, { borderLeftColor: role.color }]}
            onPress={() => { setRole(role.key); setStep(1); }}
            accessibilityRole="button"
            accessibilityLabel={`Select role: ${role.label}`}
          >
            <View style={[s.roleIcon, { backgroundColor: role.bg }]}>
              <Icon name={role.icon} size={26} color={role.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.roleLabel, { color: role.color }]}>{role.label}</Text>
              <Text style={s.roleDesc}>{role.description}</Text>
            </View>
            <Icon name="chevron-right" size={20} color={COLORS.TEXT_DISABLED} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ── Details step ─────────────────────────────────────────────────────────────
  const renderDetailsStep = () => {
    const roleInfo = ROLES.find(r => r.key === selectedRole);
    return (
      <View style={s.section}>
        <View style={[s.roleBadge, { backgroundColor: roleInfo?.bg }]}>
          <Icon name={roleInfo?.icon} size={14} color={roleInfo?.color} />
          <Text style={[s.roleBadgeTxt, { color: roleInfo?.color }]}>
            {roleInfo?.label}
          </Text>
        </View>
        <Text style={s.title}>Account Details</Text>
        <View style={s.form}>
          {selectedRole === "waste_authority" ? (
            <Field
              label="Authority / Organisation Name"
              hint="Your waste management authority or organisation"
              inputRef={authRef}
              value={authName}
              onChangeText={t => { setAuthName(t); setErrors(e => ({ ...e, authName: null })); }}
              error={errors.authName}
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
            onChangeText={t => {
              setPassword(t);
              setErrors(e => ({ ...e, password: null, confirmPw: null }));
            }}
            error={errors.password}
            placeholder="Min. 8 chars, uppercase, number"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => confirmRef.current?.focus()}
          />
          <PasswordStrength password={password} />
          <PasswordField
            label="Confirm Password"
            inputRef={confirmRef}
            value={confirmPw}
            onChangeText={t => {
              setConfirmPw(t);
              setErrors(e => ({ ...e, confirmPw: null }));
            }}
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
              hint="Name of the residents' association or community"
              inputRef={communityRef}
              value={community}
              onChangeText={t => { setCommunity(t); setErrors(e => ({ ...e, community: null })); }}
              error={errors.community}
              placeholder="e.g. Colombo 5 Residents Association"
              autoCapitalize="words"
              returnKeyType="done"
              blurOnSubmit
            />
          )}
          <TouchableOpacity
            style={s.btn}
            onPress={() => { if (validateDetails()) setStep(2); }}
            accessibilityRole="button"
          >
            <Text style={s.btnTxt}>Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ── WhatsApp step ─────────────────────────────────────────────────────────────
  const renderWhatsappStep = () => (
    <View style={s.section}>
      <Text style={s.title}>WhatsApp Number</Text>
      <Text style={s.subtitle}>
        We'll send a 6-digit verification code to your WhatsApp
      </Text>
      <View style={s.waBannerLarge}>
        <Icon name="whatsapp" size={30} color="#25D366" />
        <View style={{ flex: 1 }}>
          <Text style={s.waBannerTitle}>WhatsApp Verification</Text>
          <Text style={s.waBannerDesc}>
            Make sure this number is active on WhatsApp
          </Text>
        </View>
      </View>
      <View style={s.form}>
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
          style={[s.btn, s.waBtn, loading && s.btnDisabled]}
          onPress={handleRegisterAndSendOtp}
          disabled={loading}
          accessibilityRole="button"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <View style={s.waBtnInner}>
              <Icon name="whatsapp" size={20} color="#fff" />
              <Text style={s.btnTxt}>Create Account & Send OTP</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={s.noteTxt}>
          OTP valid for 10 minutes. WhatsApp data rates may apply.
        </Text>
      </View>
    </View>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  const roleLabel = ROLES.find(r => r.key === selectedRole)?.label || "";

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* ── Sticky top bar — never scrolls ── */}
        <View style={s.topBar}>
          <TouchableOpacity
            onPress={goBack}
            style={s.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={22} color={COLORS.PRIMARY} />
          </TouchableOpacity>
          <StepIndicator current={step} total={3} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <Image
            source={require("../../assets/logo.png")}
            style={s.logo}
            resizeMode="contain"
            accessibilityLabel="BinGo logo"
          />

          {step === 0 && renderRoleStep()}
          {step === 1 && renderDetailsStep()}
          {step === 2 && renderWhatsappStep()}

          <View style={s.footer}>
            <Text style={s.footerTxt}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("Login")}
              accessibilityRole="link"
            >
              <Text style={s.linkTxt}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* OTP bottom-sheet overlay */}
      <OtpOverlay
        visible={otpVisible}
        whatsappNumber={whatsapp}
        onVerified={handleOtpVerified}
        onClose={() => setOtpVisible(false)}
        onResend={handleResend}
        onChangeNumber={handleChangeNumber}
      />

      {/* Success full-screen overlay */}
      <SuccessOverlay
        visible={successVisible}
        roleName={roleLabel}
        onDone={handleSuccessDone}
      />
    </SafeAreaView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  scroll:    { flexGrow: 1, padding: 20, paddingBottom: 40 },

  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: COLORS.BACKGROUND,
    borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER,
  },
  backBtn: { padding: 4 },

  stepRow:    { flexDirection: "row", gap: 6 },
  stepDot:    { height: 6, borderRadius: 3 },
  stepActive:   { width: 22, backgroundColor: COLORS.PRIMARY },
  stepDone:     { width: 14, backgroundColor: COLORS.PRIMARY_LIGHT },
  stepInactive: { width: 14, backgroundColor: COLORS.BORDER },

  logo: { width: 140, height: 52, alignSelf: "center", marginVertical: 12 },

  section:  { marginBottom: 8 },
  title:    { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 4 },
  subtitle: { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginBottom: 18, lineHeight: 18 },

  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4, marginBottom: 8,
  },
  roleBadgeTxt: { fontSize: 12, fontWeight: "700" },

  roleList: { gap: 12 },
  roleCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: COLORS.SURFACE, borderRadius: 14,
    padding: 14, borderLeftWidth: 4,
    borderWidth: 1, borderColor: COLORS.BORDER, elevation: 2,
  },
  roleIcon: {
    width: 50, height: 50, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
  roleLabel: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  roleDesc:  { fontSize: 12, color: COLORS.TEXT_SECONDARY, lineHeight: 17 },

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
  errorText:  { fontSize: 12, color: COLORS.ERROR },

  pwRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 10,
  },
  pwInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: COLORS.TEXT_PRIMARY,
  },
  eyeBtn: {
    paddingHorizontal: 12, paddingVertical: 12,
    justifyContent: "center", alignItems: "center",
  },

  waBannerLarge: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#E8F5E9", borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: "#C8E6C9",
  },
  waBannerTitle: { fontSize: 14, fontWeight: "700", color: "#1B5E20" },
  waBannerDesc:  { fontSize: 12, color: "#388E3C", lineHeight: 17, marginTop: 2 },

  btn: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", marginTop: 6,
  },
  waBtn:     { backgroundColor: "#25D366" },
  waBtnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  btnDisabled: { opacity: 0.6 },
  btnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  noteTxt: {
    fontSize: 11, color: COLORS.TEXT_DISABLED,
    textAlign: "center", lineHeight: 16,
  },

  footer:    { flexDirection: "row", justifyContent: "center", marginTop: 28 },
  footerTxt: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  linkTxt:   { color: COLORS.PRIMARY, fontSize: 14, fontWeight: "600" },

  // ── OTP overlay ──────────────────────────────────────────────────────────────
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: COLORS.SURFACE,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 24, paddingTop: 10,
    elevation: 24,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: COLORS.BORDER,
    alignSelf: "center", marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", marginBottom: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  sheetSub:   { fontSize: 13, color: COLORS.TEXT_SECONDARY, marginTop: 2 },
  sheetNum:   { fontWeight: "700", color: COLORS.PRIMARY },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.BACKGROUND,
    justifyContent: "center", alignItems: "center",
  },

  waBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#E8F5E9", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 18,
  },
  waBannerTxt: { flex: 1, fontSize: 13, color: "#2E7D32", lineHeight: 18 },

  otpRow: {
    flexDirection: "row", gap: 8,
    justifyContent: "center", marginBottom: 6,
  },
  otpBox: {
    width: 44, height: 54, borderRadius: 10,
    borderWidth: 1.5, borderColor: COLORS.BORDER,
    backgroundColor: COLORS.BACKGROUND,
    fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY,
  },
  otpFilled: { borderColor: COLORS.PRIMARY, backgroundColor: "#E8F5E9" },
  otpError:  { borderColor: COLORS.ERROR },
  otpErrTxt: {
    fontSize: 13, color: COLORS.ERROR,
    textAlign: "center", marginBottom: 6,
  },

  verifyBtn: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", marginTop: 10,
  },
  verifyBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  actionsRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", marginTop: 16, gap: 0,
  },
  actionItem: { flex: 1, alignItems: "center" },
  actionDivider: { width: 1, height: 20, backgroundColor: COLORS.BORDER },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 5 },
  actionBtnTxt: {
    fontSize: 13, color: COLORS.PRIMARY, fontWeight: "600",
  },
  countdownTxt: { fontSize: 13, color: COLORS.TEXT_SECONDARY },
  countdownNum: { color: COLORS.PRIMARY, fontWeight: "700" },

  // ── Success overlay ──────────────────────────────────────────────────────────
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#1B5E20",
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
    zIndex: 999,
    paddingHorizontal: 32,
  },
  successCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 3, borderColor: "rgba(255,255,255,0.5)",
  },
  successTitle: {
    fontSize: 30, fontWeight: "800", color: "#fff",
    textAlign: "center",
  },
  successSub: {
    fontSize: 16, color: "rgba(255,255,255,0.85)",
    textAlign: "center", lineHeight: 24, marginTop: 4,
  },
  successRole: { fontWeight: "700", color: "#fff" },
  successHint: {
    fontSize: 13, color: "rgba(255,255,255,0.6)",
    textAlign: "center", marginTop: 4,
  },
  stepsContainer: {
    width: "100%", gap: 10, marginTop: 8,
  },
  stepRow2: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12, padding: 12,
  },
  stepIconBox: {
    width: 34, height: 34, borderRadius: 17,
    justifyContent: "center", alignItems: "center",
  },
  stepLabel: {
    flex: 1, fontSize: 14, fontWeight: "600",
  },
  stepCheck: { marginLeft: "auto" },
});

export default RegisterScreen;
