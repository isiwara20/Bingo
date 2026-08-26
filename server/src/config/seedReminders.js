/**
 * BinGo – Reminder Seed (Member 3 – Feature 2)
 * Run: node src/config/seedReminders.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");
const User = require("../models/User");

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const authority = await User.findOne({ role: "waste_authority" });

  await Reminder.deleteMany({ area: { $regex: /^Colombo/ } });

  const reminders = [
    // System-style auto reminders (seeded as if system generated)
    {
      type: "morning_reminder",
      area: "Colombo 03",
      title: "Collection Day Today 🗑️",
      message: "General Waste collection is today. Place your grey bin on the kerb before 6:00 AM.",
      severity: "info",
      isActive: true,
      broadcastAt: new Date(),
    },
    {
      type: "one_hour_reminder",
      area: "Colombo 03",
      title: "1 Hour Until Collection ⏰",
      message: "Recycling collection starts at 7:00 AM. Blue bin must be outside now.",
      severity: "warning",
      isActive: true,
      broadcastAt: new Date(Date.now() - 30 * 60000),
    },
    {
      type: "missed_collection",
      area: "Colombo 05",
      title: "Missed Collection Alert ⚠️",
      message: "We noticed your bin may not have been placed outside for today's General Waste collection. Next collection is in 7 days.",
      severity: "warning",
      isActive: true,
      broadcastAt: new Date(Date.now() - 2 * 3600000),
    },
    // Authority-pushed alerts
    {
      type: "holiday_alert",
      area: "Colombo 03",
      title: "Holiday Schedule Change 🗓️",
      message: "Collection schedule for Vesak Poya Day (12 May) has been adjusted. General Waste collection moved to 13 May.",
      affectedDate: "12 May 2025",
      severity: "warning",
      isActive: true,
      createdBy: authority?._id || null,
      broadcastAt: new Date(Date.now() - 24 * 3600000),
    },
    {
      type: "route_change",
      area: "Colombo 07",
      title: "Route Change Notice 🛣️",
      message: "Due to road works on Station Road, the collection vehicle will approach from the Baseline Road end. Please place bins on the opposite side.",
      severity: "info",
      isActive: true,
      createdBy: authority?._id || null,
      broadcastAt: new Date(Date.now() - 3 * 3600000),
    },
    {
      type: "weather_delay",
      area: "Colombo 05",
      title: "Weather Delay — Collection Running Late 🌧️",
      message: "Heavy rainfall is causing delays in today's collection. Expected arrival time updated to 10:00 AM – 12:00 PM.",
      severity: "critical",
      isActive: true,
      createdBy: authority?._id || null,
      broadcastAt: new Date(Date.now() - 1 * 3600000),
    },
    {
      type: "holiday_alert",
      area: "Colombo 05",
      title: "Sinhala New Year — Schedule Change 🎉",
      message: "No collections on 14 April (Sinhala New Year). All collections resume on 15 April.",
      affectedDate: "14 Apr 2026",
      severity: "info",
      isActive: true,
      createdBy: authority?._id || null,
      broadcastAt: new Date(Date.now() - 48 * 3600000),
    },
  ];

  await Reminder.insertMany(reminders);
  console.log(`Seeded ${reminders.length} reminders.`);
  await mongoose.disconnect();
};

run().catch(console.error);
