/**
 * BinGo – Schedule Seed (Member 3)
 * Run: node src/config/seedSchedule.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose = require("mongoose");
const CollectionSchedule = require("../models/CollectionSchedule");

const SCHEDULES = [
  { area: "Colombo 03", wasteType: "General Waste",   collectionDay: "Monday",    collectionTime: "06:00 AM", frequency: "weekly",   notes: "Place bin outside by 6 AM" },
  { area: "Colombo 03", wasteType: "Recycling",       collectionDay: "Thursday",  collectionTime: "07:00 AM", frequency: "weekly",   notes: "Blue bin — plastic, glass, paper" },
  { area: "Colombo 03", wasteType: "Organic Waste",   collectionDay: "Saturday",  collectionTime: "07:00 AM", frequency: "weekly",   notes: "Green bin — food and garden waste" },
  { area: "Colombo 03", wasteType: "Hazardous Waste", collectionDay: "Wednesday", collectionTime: "09:00 AM", frequency: "monthly",  notes: "Special disposal — batteries, chemicals" },
  { area: "Colombo 05", wasteType: "General Waste",   collectionDay: "Tuesday",   collectionTime: "06:00 AM", frequency: "weekly",   notes: "Place bin outside by 6 AM" },
  { area: "Colombo 05", wasteType: "Recycling",       collectionDay: "Friday",    collectionTime: "07:00 AM", frequency: "weekly",   notes: "Blue bin collection" },
  { area: "Colombo 05", wasteType: "Organic Waste",   collectionDay: "Sunday",    collectionTime: "08:00 AM", frequency: "weekly",   notes: "Green bin — food scraps welcome" },
  { area: "Colombo 07", wasteType: "General Waste",   collectionDay: "Wednesday", collectionTime: "06:00 AM", frequency: "weekly",   notes: "Place bin outside by 6 AM" },
  { area: "Colombo 07", wasteType: "Recycling",       collectionDay: "Saturday",  collectionTime: "07:00 AM", frequency: "biweekly", notes: "Blue bin — every two weeks" },
  { area: "Colombo 07", wasteType: "Garden Waste",    collectionDay: "Monday",    collectionTime: "08:00 AM", frequency: "biweekly", notes: "Bundled garden waste only" },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await CollectionSchedule.deleteMany({ area: { $regex: /^Colombo/ } });
  await CollectionSchedule.insertMany(SCHEDULES.map(s => ({ ...s, isActive: true })));
  console.log(`Seeded ${SCHEDULES.length} schedules.`);
  await mongoose.disconnect();
};

run().catch(console.error);
