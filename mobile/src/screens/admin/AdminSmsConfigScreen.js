/**
 * BinGo Admin – SMS Configuration Screen
 * Configure text.lk credentials and sender ID.
 * Settings are saved to the backend and used by the OTP service.
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Pressable,
  KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../api/apiClient";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import COLORS from "../../constants/colors";

const EyeIcon = ({ visible }) => (
  <Icon
    name={visible ? "eye-off-outline" : "eye-outline"}
    size={22}
    color={COLORS.TEXT_SECONDARY}
  />
);

const Field = ({ label, hint, error, secret, inputRef, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={[styles.inputRow, error && styles.inputError]}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholderTextColor={COLORS.TEXT_DISABLED}
          secureTextEntry={secret && !show}
          {...props}
        />
        {secret && (
          <Pressable onPress={() => setShow(v => !v)} style={styles.eyeBtn} hitSlop={10}>
            <EyeIcon visible={show} />
          </Pressable>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const AdminSmsConfigScreen = () => {
  const [userId,   setUserId]   = useState("");
  const [apiKey,   setApiKey]   = useState("");
  const [senderId, setSenderId] = useState("BinGo");
  const [testPhone, setTestPhone] = useState("");
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [errors,   setErrors]   = useState({});
  const [saved,    setSaved]    = useState(false);

  const apiKeyRef   = useRef(null);
  const senderRef   = useRef(null);
  const testRef     = useRef(null);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get("/admin/config");
      const cfg = res.data.data || {};
      setUserId(cfg.textlkUserId || "");
      setApiKey(cfg.textlkApiKey || "");
      setSenderId(cfg.textlkSenderId || "BinGo");
    } catch (e) {
      // If no config yet, start fresh
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  const validate = () => {
    const e = {};
    if (!userId.trim()) e.userId = "User ID is required";
    if (!apiKey.trim()) e.apiKey = "API Key is required";
    if (!senderId.trim()) e.senderId = "Sender ID is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaved(false);
    try {
      await api.post("/admin/config", {
        textlkUserId:   userId.trim(),
        textlkApiKey:   apiKey.trim(),
        textlkSenderId: senderId.trim(),
      });
      setSaved(true);
      Alert.alert("Saved", "SMS configuration updated successfully.");
    } catch (e) {
      Alert.alert("Error", e.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testPhone.trim()) {
      Alert.alert("Test SMS", "Enter a phone number to send a test OTP.");
      return;
    }
    setTesting(true);
    try {
      await api.post("/auth/send-otp", { phone: testPhone.trim() });
      Alert.alert("Test Sent", `A test OTP was sent to ${testPhone}. Check the server console if credentials are not yet configured.`);
    } catch (e) {
      Alert.alert("Test Failed", e.message || "Could not send test SMS.");
    } finally {
      setTesting(false);
    }
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.PRIMARY} style={{ marginTop: 60 }} />
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">

          <Text style={styles.pageTitle}>SMS Configuration</Text>
          <Text style={styles.pageSubtitle}>
            Configure your text.lk API credentials. These are used to send OTP verification codes to users.
          </Text>

          {/* text.lk link info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>📌 text.lk Setup</Text>
            <Text style={styles.infoText}>
              1. Register at text.lk{"\n"}
              2. Go to API Settings → copy your User ID and API Key{"\n"}
              3. Create a Sender ID (e.g. "BinGo") in the portal{"\n"}
              4. Enter them below and save
            </Text>
          </View>

          <Field
            label="User ID"
            hint="Found in your text.lk account settings"
            value={userId}
            onChangeText={t => { setUserId(t); setErrors(e => ({ ...e, userId: null })); }}
            error={errors.userId}
            placeholder="e.g. 12345"
            keyboardType="numeric"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => apiKeyRef.current?.focus()}
          />

          <Field
            label="API Key"
            hint="Your secret text.lk API key"
            secret
            inputRef={apiKeyRef}
            value={apiKey}
            onChangeText={t => { setApiKey(t); setErrors(e => ({ ...e, apiKey: null })); }}
            error={errors.apiKey}
            placeholder="Paste your API key here"
            autoCapitalize="none"
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => senderRef.current?.focus()}
          />

          <Field
            label="Sender ID"
            hint="Approved sender name shown on recipient's phone (max 11 chars)"
            inputRef={senderRef}
            value={senderId}
            onChangeText={t => { setSenderId(t); setErrors(e => ({ ...e, senderId: null })); }}
            error={errors.senderId}
            placeholder="e.g. BinGo"
            autoCapitalize="characters"
            maxLength={11}
            returnKeyType="done"
            blurOnSubmit
          />

          <TouchableOpacity
            style={[styles.saveButton, saving && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving}
            accessibilityRole="button"
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.saveButtonText}>{saved ? "✓ Saved" : "Save Configuration"}</Text>
            }
          </TouchableOpacity>

          {/* Test SMS section */}
          <View style={styles.divider} />
          <Text style={styles.sectionTitle}>Test SMS</Text>
          <Text style={styles.pageSubtitle}>Send a test OTP to verify your configuration is working.</Text>

          <Field
            label="Test Phone Number"
            inputRef={testRef}
            value={testPhone}
            onChangeText={setTestPhone}
            placeholder="+94 77 123 4567"
            keyboardType="phone-pad"
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={handleTest}
          />

          <TouchableOpacity
            style={[styles.testButton, testing && styles.buttonDisabled]}
            onPress={handleTest}
            disabled={testing}
            accessibilityRole="button"
          >
            {testing
              ? <ActivityIndicator color={COLORS.PRIMARY} />
              : <Text style={styles.testButtonText}>Send Test OTP</Text>
            }
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },
  pageSubtitle: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 18 },
  infoBox: {
    backgroundColor: "#E8F5E9", borderRadius: 12, padding: 14,
    borderLeftWidth: 4, borderLeftColor: COLORS.PRIMARY,
  },
  infoTitle: { fontWeight: "700", color: COLORS.PRIMARY_DARK, marginBottom: 6 },
  infoText: { fontSize: 13, color: COLORS.TEXT_SECONDARY, lineHeight: 20 },
  inputGroup: { gap: 4 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  hint: { fontSize: 12, color: COLORS.TEXT_DISABLED },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: COLORS.SURFACE, borderWidth: 1,
    borderColor: COLORS.BORDER, borderRadius: 10,
  },
  input: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.TEXT_PRIMARY },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 12, justifyContent: "center", alignItems: "center" },
  inputError: { borderColor: COLORS.ERROR },
  errorText: { fontSize: 12, color: COLORS.ERROR },
  saveButton: {
    backgroundColor: COLORS.PRIMARY, paddingVertical: 15,
    borderRadius: 12, alignItems: "center", marginTop: 4,
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  buttonDisabled: { opacity: 0.6 },
  divider: { height: 1, backgroundColor: COLORS.DIVIDER, marginVertical: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.TEXT_PRIMARY },
  testButton: {
    borderWidth: 1.5, borderColor: COLORS.PRIMARY, paddingVertical: 14,
    borderRadius: 12, alignItems: "center",
  },
  testButtonText: { color: COLORS.PRIMARY, fontSize: 15, fontWeight: "600" },
});

export default AdminSmsConfigScreen;
