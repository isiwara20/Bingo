/**
 * BinGo – Notification Settings Screen
 * Member 4 – Notifications
 *
 * Category and delivery-method toggles. Saves on each switch flip.
 * Delivery toggles are storage-only — no real push/email delivery yet.
 */

import React, { useState, useEffect } from "react";
import { View, Text, Switch, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getNotificationSettings, updateNotificationSettings } from "../services/notificationService";
import COLORS from "../constants/colors";

const CATEGORY_FIELDS = [
  { key: "collectionReminders",  label: "Collection Reminders",  desc: "Pickup schedule alerts" },
  { key: "communityEvents",      label: "Community Events",      desc: "New events and clean-ups" },
  { key: "rewardUpdates",        label: "Reward Updates",        desc: "Points earned and badges" },
  { key: "reportUpdates",        label: "Report Updates",        desc: "Status changes on your reports" },
  { key: "generalAnnouncements", label: "General Announcements", desc: "Community-wide announcements" },
];

const DELIVERY_FIELDS = [
  { key: "push",  label: "Push Notifications" },
  { key: "email", label: "Email Notifications" },
];

const SettingRow = ({ label, desc, value, onChange, disabled }) => (
  <View style={styles.row}>
    <View style={styles.rowText}>
      <Text style={styles.rowLabel}>{label}</Text>
      {desc ? <Text style={styles.rowDesc}>{desc}</Text> : null}
    </View>
    <Switch
      value={!!value}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: COLORS.BORDER, true: COLORS.PRIMARY_TINT }}
      thumbColor={value ? COLORS.PRIMARY : "#f4f3f4"}
    />
  </View>
);

const NotificationSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getNotificationSettings();
        setSettings(data);
      } catch (err) {
        setError(err.message || "Failed to load settings.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleToggle = async (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavingKey(key);
    try {
      await updateNotificationSettings({ [key]: value });
    } catch (err) {
      // revert on failure
      setSettings((prev) => ({ ...prev, [key]: !value }));
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorMsg}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.retryBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} accessibilityRole="button">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Notification Settings</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.body}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.card}>
          {CATEGORY_FIELDS.map((f, i) => (
            <View key={f.key} style={i < CATEGORY_FIELDS.length - 1 ? styles.divider : null}>
              <SettingRow
                label={f.label}
                desc={f.desc}
                value={settings[f.key]}
                onChange={(v) => handleToggle(f.key, v)}
                disabled={savingKey === f.key}
              />
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Delivery Methods</Text>
        <View style={styles.card}>
          {DELIVERY_FIELDS.map((f, i) => (
            <View key={f.key} style={i < DELIVERY_FIELDS.length - 1 ? styles.divider : null}>
              <SettingRow
                label={f.label}
                value={settings[f.key]}
                onChange={(v) => handleToggle(f.key, v)}
                disabled={savingKey === f.key}
              />
            </View>
          ))}
        </View>
        <Text style={styles.hint}>
          Push and email delivery aren't wired up to real notifications yet — these preferences are saved for when they are.
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.BACKGROUND },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12 },
  errorMsg: { fontSize: 14, color: COLORS.TEXT_SECONDARY, textAlign: "center" },
  retryBtn: { marginTop: 8, backgroundColor: COLORS.PRIMARY, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  retryBtnText: { color: COLORS.TEXT_INVERSE, fontWeight: "bold" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  backText: { color: COLORS.PRIMARY, fontSize: 15, width: 50 },
  title: { fontSize: 17, fontWeight: "bold", color: COLORS.TEXT_PRIMARY },

  body: { padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: COLORS.TEXT_SECONDARY, marginBottom: 8, marginTop: 12, textTransform: "uppercase" },

  card: {
    backgroundColor: COLORS.SURFACE,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: "hidden",
  },
  divider: { borderBottomWidth: 1, borderBottomColor: COLORS.DIVIDER },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowText: { flex: 1, marginRight: 12 },
  rowLabel: { fontSize: 14, fontWeight: "600", color: COLORS.TEXT_PRIMARY },
  rowDesc: { fontSize: 11, color: COLORS.TEXT_SECONDARY, marginTop: 2 },

  hint: { fontSize: 11, color: COLORS.TEXT_DISABLED, marginTop: 16, lineHeight: 16 },
});

export default NotificationSettingsScreen;
