/**
 * BinGo – Seed Plans
 * Run: node scripts/seedPlans.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const Plan = require("../src/models/Plan");
const connectDatabase = require("../src/config/database");

const DEFAULT_PLANS = [
  {
    key: "free",
    name: "Free",
    tagline: "Get started with BinGo",
    price: 0,
    billingPeriod: "free",
    color: "#757575",
    badge: null,
    sortOrder: 0,
    benefits: [
      "Report up to 5 waste incidents per month",
      "View waste map",
      "Basic collection schedule",
      "Community board access",
      "Earn up to 100 reward points/month",
    ],
  },
  {
    key: "plus",
    name: "Plus",
    tagline: "For active community members",
    price: 299,
    billingPeriod: "month",
    color: "#1565C0",
    badge: "Popular",
    sortOrder: 1,
    benefits: [
      "Unlimited waste reports",
      "Priority report review",
      "Full recycling guide",
      "Collection schedule notifications",
      "Earn up to 500 reward points/month",
      "Community event participation",
      "Ad-free experience",
    ],
  },
  {
    key: "pro",
    name: "Pro",
    tagline: "Maximum impact for your community",
    price: 599,
    billingPeriod: "month",
    color: "#6A1B9A",
    badge: "Best Value",
    sortOrder: 2,
    benefits: [
      "Everything in Plus",
      "Real-time collection tracking",
      "Direct authority messaging",
      "Earn unlimited reward points",
      "Monthly community impact report",
      "Priority customer support",
      "Early access to new features",
      "1 free monthly collection booking",
    ],
  },
];

const seed = async () => {
  await connectDatabase();

  for (const planData of DEFAULT_PLANS) {
    await Plan.findOneAndUpdate(
      { key: planData.key },
      planData,
      { upsert: true, new: true }
    );
    console.log(`✓ Plan seeded: ${planData.name} (LKR ${planData.price})`);
  }

  console.log("\nAll plans seeded successfully.");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
