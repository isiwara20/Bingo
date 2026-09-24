/**
 * BinGo – Local Reminder Service
 * Handles local notifications for waste collection reminders.
 * Member 3 responsibility.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import PushNotification from "react-native-push-notification";
import { Platform } from "react-native";

const STORAGE_KEY = "@bingo_local_reminders";
const CUSTOM_REMINDERS_KEY = "@bingo_custom_reminders";

// Initialize push notifications
export const initializeNotifications = () => {
  console.log("Initializing push notifications...");
  PushNotification.configure({
    onRegister: function (token) {
      console.log("TOKEN:", token.token);
    },
    onNotification: function (notification) {
      console.log("NOTIFICATION:", notification);
    },
    onRegistrationError: function (err) {
      console.error("NOTIFICATION REGISTRATION ERROR:", err);
    },
    permissions: {
      alert: true,
      badge: true,
      sound: true,
    },
    popInitialNotification: true,
    requestPermissions: Platform.OS === "ios",
  });

  // Create Android notification channel
  if (Platform.OS === "android") {
    PushNotification.createChannel(
      {
        channelId: "bingo-reminders",
        channelName: "BinGo Reminders",
        channelDescription: "Waste collection reminders",
        playSound: true,
        soundName: "default",
        importance: 5, // High importance
        vibrate: true,
      },
      (created) => {
        console.log(`createChannel returned '${created}'`);
        if (created) {
          console.log("Notification channel created successfully");
        } else {
          console.log("Notification channel already exists");
        }
      }
    );
  }
};

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

  // Calculate next occurrence of the reminder day
  const now = new Date();
  const dayIndex = DAYS.indexOf(collectionDay);
  const currentDayIndex = now.getDay();
  
  let daysUntil = dayIndex - currentDayIndex;
  if (daysUntil <= 0) daysUntil += 7; // If today or past, go to next week
  
  const reminderDate = new Date(now);
  reminderDate.setDate(now.getDate() + daysUntil);
  reminderDate.setHours(reminderHour, reminderMinute, 0, 0);

  console.log("Scheduling collection reminder with setTimeout:", {
    notifId,
    wasteType,
    reminderDate: reminderDate.toString(),
    dayIndex,
    hour: reminderHour,
    minute: reminderMinute,
  });

  // Use setTimeout for first occurrence, then reschedule weekly
  const delayMs = reminderDate.getTime() - now.getTime();
  
  const fireWeeklyReminder = () => {
    PushNotification.localNotification({
      title: `🗑️ ${wasteType} Collection`,
      message: `Collection today at ${collectionTime} in ${area}`,
      channelId: "bingo-reminders",
      soundName: "default",
      playSound: true,
      vibrate: true,
      vibration: 300,
    });
    // Reschedule for next week (7 days = 604800000 ms)
    setTimeout(fireWeeklyReminder, 604800000);
  };
  
  setTimeout(fireWeeklyReminder, delayMs);

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
  // Cancel native notification
  PushNotification.cancelLocalNotification(notifId);
  
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
  
  // Cancel all native notifications for this schedule
  if (stored[scheduleId]) {
    stored[scheduleId].forEach(r => {
      PushNotification.cancelLocalNotification(r.notifId);
    });
  }
  
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

// ── Schedule a custom reminder (any day/date and time) ───────────────────────
export const scheduleCustomReminder = async ({
  title,
  message,
  useDayOfWeek,
  dayOfWeek,
  date,
  hour,
  minute,
}) => {
  const stored = JSON.parse((await AsyncStorage.getItem(CUSTOM_REMINDERS_KEY)) || "[]");
  
  const notifId = `bingo_custom_${Date.now()}`;
  
  let reminderDate;
  
  if (useDayOfWeek) {
    // Weekly repeating reminder
    const dayIndex = DAYS.indexOf(dayOfWeek);
    const now = new Date();
    const currentDayIndex = now.getDay();
    
    let daysUntil = dayIndex - currentDayIndex;
    if (daysUntil <= 0) daysUntil += 7;
    
    reminderDate = new Date(now);
    reminderDate.setDate(now.getDate() + daysUntil);
    reminderDate.setHours(hour, minute, 0, 0);
    
    // If the calculated time is in the past for today, move to next week
    if (reminderDate <= now) {
      reminderDate.setDate(reminderDate.getDate() + 7);
    }
    
    console.log("Scheduling weekly reminder with setTimeout:", {
      notifId,
      title,
      message,
      reminderDate: reminderDate.toString(),
      reminderDateISO: reminderDate.toISOString(),
      dayIndex,
      hour,
      minute,
      daysUntil,
    });
    
    // Use setTimeout for first occurrence, then reschedule weekly
    const delayMs = reminderDate.getTime() - now.getTime();
    
    const fireWeeklyReminder = () => {
      PushNotification.localNotification({
        title,
        message,
        channelId: "bingo-reminders",
        soundName: "default",
        playSound: true,
        vibrate: true,
        vibration: 300,
      });
      // Reschedule for next week (7 days = 604800000 ms)
      setTimeout(fireWeeklyReminder, 604800000);
    };
    
    setTimeout(fireWeeklyReminder, delayMs);
  } else {
    // One-time reminder
    reminderDate = new Date(date);
    reminderDate.setHours(hour, minute, 0, 0);
    
    // Only schedule if date is in the future
    if (reminderDate <= new Date()) {
      throw new Error("Reminder time must be in the future");
    }
    
    console.log("Scheduling one-time reminder with setTimeout:", {
      notifId,
      title,
      message,
      reminderDate: reminderDate.toString(),
      reminderDateISO: reminderDate.toISOString(),
      hour,
      minute,
    });
    
    // Use setTimeout instead of localNotificationSchedule
    const delayMs = reminderDate.getTime() - Date.now();
    setTimeout(() => {
      PushNotification.localNotification({
        title,
        message,
        channelId: "bingo-reminders",
        soundName: "default",
        playSound: true,
        vibrate: true,
        vibration: 300,
      });
    }, delayMs);
  }
  
  stored.push({
    notifId,
    title,
    message,
    useDayOfWeek,
    dayOfWeek,
    date,
    hour,
    minute,
    createdAt: Date.now(),
  });
  
  await AsyncStorage.setItem(CUSTOM_REMINDERS_KEY, JSON.stringify(stored));
  console.log("Reminder saved to storage:", notifId);
  return notifId;
};

// ── Test notification (fires immediately) ───────────────────────────────────
export const testNotification = () => {
  console.log("Firing test notification");
  PushNotification.localNotification({
    title: "🔔 Test Notification",
    message: "This is a test notification from BinGo",
    channelId: "bingo-reminders",
    soundName: "default",
    playSound: true,
    vibrate: true,
    vibration: 300,
  });
};

// ── Test scheduled notification with timeout (workaround) ──────────────────
export const testScheduledNotification = async ({ title, message, delaySeconds }) => {
  console.log(`Scheduling test notification in ${delaySeconds} seconds`);
  setTimeout(() => {
    PushNotification.localNotification({
      title,
      message,
      channelId: "bingo-reminders",
      soundName: "default",
      playSound: true,
      vibrate: true,
      vibration: 300,
    });
  }, delaySeconds * 1000);
};

// ── Cancel a custom reminder ────────────────────────────────────────────────
export const cancelCustomReminder = async (notifId) => {
  PushNotification.cancelLocalNotification(notifId);
  
  const stored = JSON.parse((await AsyncStorage.getItem(CUSTOM_REMINDERS_KEY)) || "[]");
  const updated = stored.filter(r => r.notifId !== notifId);
  await AsyncStorage.setItem(CUSTOM_REMINDERS_KEY, JSON.stringify(updated));
};

// ── Get all custom reminders ────────────────────────────────────────────────
export const getCustomReminders = async () => {
  const stored = JSON.parse((await AsyncStorage.getItem(CUSTOM_REMINDERS_KEY)) || "[]");
  return stored;
};
