/**
 * BinGo – Development Seed Script
 *
 * Creates sample users for development and testing.
 *
 * ⚠️  DEVELOPMENT ONLY – Never run in production.
 * ⚠️  Uses obviously fake credentials.
 * ⚠️  Do NOT commit real data here.
 *
 * Usage:
 *   node src/config/seed.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const WasteLocation = require("../models/WasteLocation");

const SEED_USERS = [
  {
    name: "Dev Resident",
    email: "resident@dev.bingo",
    passwordHash: "DevResident1!",
    role: "resident",
    phone: "+1-555-0001",
    address: "1 Main Street, Sample City",
  },
  {
    name: "Dev Community Leader",
    email: "leader@dev.bingo",
    passwordHash: "DevLeader1!",
    role: "community_leader",
    phone: "+1-555-0002",
    address: "2 Community Ave, Sample City",
  },
  {
    name: "Dev Waste Authority",
    email: "authority@dev.bingo",
    passwordHash: "DevAuthority1!",
    role: "waste_authority",
    phone: "+1-555-0003",
    address: "3 Authority Road, Sample City",
  },
  {
    name: "Dev Admin",
    email: "admin@dev.bingo",
    passwordHash: "DevAdmin1!",
    role: "admin",
    phone: "+1-555-0004",
    address: "4 Admin Boulevard, Sample City",
  },
];

const SEED_LOCATIONS = [
  {
    name: "Sample Recycling Centre",
    type: "recycling_centre",
    description: "Development seed data – not a real location",
    location: { type: "Point", coordinates: [79.8612, 6.9271] },
    address: "100 Recycle Road, Colombo",
    operatingHours: "Mon-Sat 8:00 AM – 5:00 PM",
    acceptedWasteTypes: ["plastic", "glass", "paper", "metal"],
  },
  {
    name: "Sample Collection Point A",
    type: "collection_point",
    description: "Development seed data – not a real location",
    location: { type: "Point", coordinates: [79.8652, 6.9311] },
    address: "200 Collection Street, Colombo",
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas for seeding.");

    // Clear existing seed data
    await User.deleteMany({ email: { $regex: "@dev.bingo$" } });
    await WasteLocation.deleteMany({ description: /Development seed data/ });

    // Create seed users
    const createdUsers = await User.create(SEED_USERS);
    console.log(`Created ${createdUsers.length} seed users.`);

    // Create seed locations
    const createdLocations = await WasteLocation.create(SEED_LOCATIONS);
    console.log(`Created ${createdLocations.length} seed locations.`);

    console.log("\n============================");
    console.log("  Development Seed Complete");
    console.log("============================");
    console.log("Login credentials:");
    SEED_USERS.forEach((u) =>
      console.log(`  ${u.role.padEnd(18)} ${u.email}  /  ${u.passwordHash}`)
    );
    console.log("\n⚠️  These are development credentials only.");
    console.log("   Never use these in production.\n");
  } catch (error) {
    console.error("Seed failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB Atlas.");
  }
};

seed();
