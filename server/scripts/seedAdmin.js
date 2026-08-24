/**
 * BinGo – Admin Seed Script
 *
 * Creates a default admin account in the database.
 * Run once: node scripts/seedAdmin.js
 *
 * Change the credentials below before running in production.
 */

require("dotenv").config({ path: require("path").join(__dirname, "../.env") });

const mongoose = require("mongoose");
const User = require("../src/models/User");
const connectDatabase = require("../src/config/database");

const ADMIN = {
  name: "BinGo Admin",
  email: "admin@bingo.lk",
  password: "Admin@2026",
  role: "admin",
  phone: null,
  isActive: true,
};

const seed = async () => {
  await connectDatabase();

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log("Admin already exists:", ADMIN.email);
    process.exit(0);
  }

  await User.create({
    name: ADMIN.name,
    email: ADMIN.email,
    passwordHash: ADMIN.password, // pre-save hook hashes this
    role: ADMIN.role,
    phone: ADMIN.phone,
    isActive: ADMIN.isActive,
  });

  console.log("====================================");
  console.log("  Admin account created");
  console.log("  Email   :", ADMIN.email);
  console.log("  Password:", ADMIN.password);
  console.log("====================================");
  process.exit(0);
};

seed().catch((err) => {
  console.error("Seed failed:", err.message);
  process.exit(1);
});
