/**
 * BinGo – Register Screen
 *
 * US-01: As a resident, I want to register so that I can access BinGo.
 *
 * TODO (Member 1): Add phone field, profile image upload in Sprint 2.
 */

import React, { useState } from "react";
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
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { register } from "../services/authService";
import COLORS from "../constants/colors";

const RegisterScreen = ({ navigation }) => {
  const { login: storeAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!name.trim() || name.trim().length < 2)
      newErrors.name = "Name must be at least 2 characters";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Enter a valid email";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password))
      newErrors.password =
        "Password must contain uppercase, lowercase, and a number";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await register({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password,
      });
      await storeAuth(result.user, result.token);
    } catch (error) {
      Alert.alert(
        "Registration Failed",
        error.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChangeText, errorKey, ...props }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, errors[errorKey] && styles.inputError]}
        value={value}
        onChangeText={(t) => {
          onChangeText(t);
          setErrors((e) => ({ ...e, [errorKey]: null }));
        }}
        {...props}
      />
      {errors[errorKey] && (
        <Text style={styles.errorText}>{errors[errorKey]}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Image
              source={require("../../assets/logo.png")}
              style={styles.logo}
              resizeMode="contain"
              accessibilityLabel="BinGo logo"
            />
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Join BinGo and help keep your neighbourhood clean
            </Text>
          </View>

          <View style={styles.form}>
            <Field
              label="Full Name"
              value={name}
              onChangeText={setName}
              errorKey="name"
              placeholder="Your full name"
              autoComplete="name"
              accessibilityLabel="Full Name"
            />
            <Field
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              errorKey="email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email Address"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              errorKey="password"
              placeholder="Min. 8 chars, uppercase, number"
              secureTextEntry
              accessibilityLabel="Password"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel="Create account"
            >
              {loading ? (
                <ActivityIndicator color={COLORS.TEXT_INVERSE} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>
          </View>

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
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  backButton: { marginBottom: 16 },
  backText: { color: COLORS.PRIMARY, fontSize: 16 },
  header: { marginBottom: 32, alignItems: "center" },
  logo: { width: 160, height: 60, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "bold", color: COLORS.TEXT_PRIMARY, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.TEXT_SECONDARY, lineHeight: 22, textAlign: "center" },
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
  button: {
    backgroundColor: COLORS.PRIMARY,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: COLORS.TEXT_INVERSE, fontSize: 16, fontWeight: "bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: COLORS.TEXT_SECONDARY, fontSize: 14 },
  linkText: { color: COLORS.PRIMARY, fontSize: 14, fontWeight: "600" },
});

export default RegisterScreen;
