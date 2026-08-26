/**
 * BinGo – Recycling Guide Seed (Member 3 – Feature 3)
 * Run: node src/config/seedRecycling.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });
const mongoose      = require("mongoose");
const RecyclingGuide = require("../models/RecyclingGuide");

const GUIDES = [
  // ── PLASTIC ──────────────────────────────────────────────────────────
  { category: "Plastic", title: "What Is Plastic?",
    content: "Plastic is a synthetic material made from polymers. It is one of the most widely used materials in the world due to its durability and low cost. However, plastic takes 400–1000 years to break down in landfills, making proper disposal critical.",
    tips: ["Look for the recycling number (1–7) on the bottom", "Rinse containers before recycling", "Remove caps and lids", "Flatten bottles to save space"],
    canRecycle: true },
  { category: "Plastic", title: "Plastics You Can Recycle",
    content: "PET (1) and HDPE (2) plastics are widely accepted in recycling programs. These include water bottles, juice containers, milk jugs, and shampoo bottles. Clean and dry before placing in the blue bin.",
    tips: ["Water bottles ✓", "Milk jugs ✓", "Shampoo bottles ✓", "Plastic bags ✗ — take to store drop-off"],
    canRecycle: true },
  { category: "Plastic", title: "Plastics You Cannot Recycle",
    content: "Styrofoam, plastic bags, cling wrap, and polystyrene containers cannot go in your blue bin. They jam sorting machines and contaminate batches of recyclables.",
    tips: ["Styrofoam ✗", "Plastic bags ✗", "Cling wrap ✗", "Black plastic trays ✗"],
    canRecycle: false },

  // ── GLASS ────────────────────────────────────────────────────────────
  { category: "Glass", title: "Recycling Glass",
    content: "Glass is 100% recyclable and can be recycled endlessly without any loss in quality. Glass recycling saves 30% of the energy compared to making new glass from raw materials.",
    tips: ["Rinse jars and bottles", "Remove metal lids", "Don't include broken glass in kerbside recycling", "Take broken glass to a recycling centre in a sealed box"],
    canRecycle: true },
  { category: "Glass", title: "Glass You Cannot Recycle Kerbside",
    content: "Drinking glasses, window glass, mirrors, ceramics, and Pyrex have different melting points and contaminate glass recycling. Take them to a recycling centre.",
    tips: ["Wine glasses ✗ kerbside", "Mirrors ✗", "Window glass ✗", "Ceramics ✗"],
    canRecycle: false },

  // ── PAPER ────────────────────────────────────────────────────────────
  { category: "Paper", title: "Paper & Cardboard Recycling",
    content: "Paper and cardboard are among the most recyclable materials. Recycling one tonne of paper saves 17 trees, 7,000 gallons of water, and 380 gallons of oil.",
    tips: ["Flatten cardboard boxes", "Remove plastic windows from envelopes", "Keep dry — wet paper cannot be recycled", "Shredded paper in a sealed bag is ok"],
    canRecycle: true },
  { category: "Paper", title: "Paper You Cannot Recycle",
    content: "Greasy pizza boxes, paper cups (plastic-lined), tissues, paper towels, and waxed paper cannot be recycled due to contamination.",
    tips: ["Pizza boxes with grease ✗", "Paper coffee cups ✗", "Tissues ✗", "Waxed paper ✗"],
    canRecycle: false },

  // ── METAL ────────────────────────────────────────────────────────────
  { category: "Metal", title: "Aluminium & Steel Recycling",
    content: "Aluminium is the most valuable material in your recycling bin. Recycling aluminium uses 95% less energy than producing it from raw ore. Steel cans are also 100% recyclable.",
    tips: ["Rinse cans", "Crush aluminium cans to save space", "Empty aerosol cans are recyclable", "Foil trays — scrunch test: if it stays scrunched, it's recyclable"],
    canRecycle: true },

  // ── ORGANIC ──────────────────────────────────────────────────────────
  { category: "Organic", title: "Food & Garden Waste",
    content: "Organic waste makes up about 30% of household waste. Composting or sending to organic waste collection diverts it from landfill where it produces methane, a potent greenhouse gas.",
    tips: ["Fruit and vegetable scraps ✓", "Coffee grounds and tea bags ✓", "Lawn clippings ✓", "Meat and dairy — check local rules"],
    canRecycle: true },

  // ── E-WASTE ──────────────────────────────────────────────────────────
  { category: "E-Waste", title: "Electronic Waste",
    content: "E-waste contains valuable materials like gold, silver, and copper — but also toxic substances like lead and mercury. Never put electronics in general waste. Take them to an e-waste collection point.",
    tips: ["Phones and tablets → e-waste drop-off", "Batteries → dedicated battery recycling", "Wipe personal data before recycling", "Many retailers accept old electronics"],
    canRecycle: true },

  // ── HAZARDOUS ────────────────────────────────────────────────────────
  { category: "Hazardous", title: "Hazardous Household Waste",
    content: "Paint, cleaning chemicals, pesticides, motor oil, and fluorescent bulbs must go to a hazardous waste facility. These materials can contaminate soil and water supplies.",
    tips: ["Never pour chemicals down the drain", "Keep in original containers with labels", "Take to hazardous waste collection days", "Check council website for drop-off locations"],
    canRecycle: false },
];

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  await RecyclingGuide.deleteMany({});
  const docs = GUIDES.map(g => ({
    title:      g.title,
    category:   g.category,
    content:    g.content,
    tips:       g.tips,
    isPublished: true,
  }));
  await RecyclingGuide.insertMany(docs);
  console.log(`Seeded ${docs.length} recycling guides.`);
  await mongoose.disconnect();
};
run().catch(console.error);
