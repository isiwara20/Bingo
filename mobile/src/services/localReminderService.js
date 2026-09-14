/**
 * BinGo – Local Reminder Service (Member 3 – Feature 2)
 *
 * Stores reminder preferences in AsyncStorage.
 * No native notification library required.
 *
 * When the app opens on a collection day, the app checks stored reminders
 * and shows an in-app alert for any that are due.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@bingo_local_reminders";

const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

// ── Check if a reminder is due today ─────────────────────────────────────
const isDueToday = (collectionDay, hour, minute) => {
  const now = new Date();
  const todayName = DAYS[now.getDay()];
  if (todayName !== collectionDay) return false;
  const dueTime = new Date();
  dueTime.setHours(hour, minute, 0, 0);
  // Due within the last 30 minutes (show reminder window)
  const diff = now - dueTime;
  return diff >= 0 && diff <= 30 * 60 * 1000;
};

// ── Save a reminder preference ────────────────────────────────────────────
export const scheduleCollectionReminder = async ({
  scheduleId,
  wasteType,
  area,
  collectionDay,
  collectionTime,
  reminderHour,
  reminderMinute,
  label,
}) => {
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || "{}");
  stored[scheduleId] = stored[scheduleId] || [];

  // Remove existing entry for same time if any
  stored[scheduleId] = stored[scheduleId].filter(
    r => !(r.hour === reminderHour && r.minute === reminderMinute)
  );

  const notifId = `bingo_${scheduleId}_${reminderHour}_${reminderMinute}`;

  stored[scheduleId].push({
    notifId,
    label,
    hour:          reminderHour,
    minute:        reminderMinute,
    collectionDay,
    collectionTime,
    wasteType,
    area,
    createdAt:     Date.now(),
  });

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  return notifId;
};

// ── Cancel a specific reminder ────────────────────────────────────────────
export const cancelReminder = async (scheduleId, notifId) => {
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || "{}");
  if (stored[scheduleId]) {
    stored[scheduleId] = stored[scheduleId].filter(r => r.notifId !== notifId);
    if (stored[scheduleId].length === 0) delete stored[scheduleId];
  }
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

// ── Cancel all reminders for a schedule ───────────────────────────────────
export const cancelAllRemindersForSchedule = async (scheduleId) => {
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || "{}");
  delete stored[scheduleId];
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
};

// ── Get reminders for a specific schedule ────────────────────────────────
export const getRemindersForSchedule = async (scheduleId) => {
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || "{}");
  return stored[scheduleId] || [];
};

// ── Get all saved reminders ───────────────────────────────────────────────
export const getAllSavedReminders = async () => {
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || "{}");
  return stored;
};

// ── Check for due reminders (call on app open / schedule screen open) ────
export const getDueReminders = async () => {
  const stored = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) || "{}");
  const due = [];
  for (const reminders of Object.values(stored)) {
    for (const r of reminders) {
      if (isDueToday(r.collectionDay, r.hour, r.minute)) {
        due.push(r);
      }
    }
  }
  return due;
};
