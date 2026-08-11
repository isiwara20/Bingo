/**
 * BinGo – Development Seed Script
 * Updated by Member 2 to include map locations for waste map development.
 *
 * ⚠️  DEVELOPMENT ONLY – Never run in production.
 * ⚠️  Uses obviously fake credentials.
 *
 * Usage:
 *   node src/config/seed.js
 */

require("dotenv").config({ path: require("path").join(__dirname, "../../.env") });

const mongoose = require("mongoose");
const User = require("../models/User");
const WasteLocation = require("../models/WasteLocation");
const WasteReport = require("../models/WasteReport");

const SEED_USERS = [
  {
    name: "Dev Resident",
    email: "resident@devbingo.com",
    passwordHash: "DevResident1!",
    role: "resident",
    phone: "+1-555-0001",
    address: "1 Main Street, Colombo",
  },
  {
    name: "Dev Community Leader",
    email: "leader@devbingo.com",
    passwordHash: "DevLeader1!",
    role: "community_leader",
    phone: "+1-555-0002",
    address: "2 Community Ave, Colombo",
  },
  {
    name: "Dev Waste Authority",
    email: "authority@devbingo.com",
    passwordHash: "DevAuthority1!",
    role: "waste_authority",
    phone: "+1-555-0003",
    address: "3 Authority Road, Colombo",
  },
  {
    name: "Dev Admin",
    email: "admin@devbingo.com",
    passwordHash: "DevAdmin1!",
    role: "admin",
    phone: "+1-555-0004",
    address: "4 Admin Boulevard, Colombo",
  },
];

// ── Waste Locations (recycling centres + collection points) ────────────────
// MOCK DATA – coordinates are near Colombo, Sri Lanka
// Replace with real data when available
const SEED_LOCATIONS = [
  {
    name: "Borella Recycling Centre",
    type: "recycling_centre",
    description: "MOCK DATA – not a real location",
    location: { type: "Point", coordinates: [79.8790, 6.9210] },
    address: "Borella, Colombo 08",
    operatingHours: "Mon-Sat 8:00 AM – 5:00 PM",
    acceptedWasteTypes: ["plastic", "glass", "paper", "metal"],
    isActive: true,
  },
  {
    name: "Wellawatte Recycling Centre",
    type: "recycling_centre",
    description: "MOCK DATA – not a real location",
    location: { type: "Point", coordinates: [79.8570, 6.8810] },
    address: "Wellawatte, Colombo 06",
    operatingHours: "Mon-Fri 8:00 AM – 4:00 PM",
    acceptedWasteTypes: ["plastic", "paper", "electronic"],
    isActive: true,
  },
  {
    name: "Kirulapone Collection Point",
    type: "collection_point",
    description: "MOCK DATA – not a real location",
    location: { type: "Point", coordinates: [79.8730, 6.8930] },
    address: "Kirulapone, Colombo 05",
    isActive: true,
  },
  {
    name: "Narahenpita Collection Point",
    type: "collection_point",
    description: "MOCK DATA – not a real location",
    location: { type: "Point", coordinates: [79.8840, 6.9000] },
    address: "Narahenpita, Colombo 05",
    isActive: true,
  },
  {
    name: "Rajagiriya Collection Point",
    type: "collection_point",
    description: "MOCK DATA – not a real location",
    location: { type: "Point", coordinates: [79.9070, 6.9060] },
    address: "Rajagiriya, Colombo",
    isActive: true,
  },
  {
    name: "Dehiwala Recycling Centre",
    type: "recycling_centre",
    description: "MOCK DATA – not a real location",
    location: { type: "Point", coordinates: [79.8660, 6.8570] },
    address: "Dehiwala, Colombo",
    operatingHours: "Mon-Sat 9:00 AM – 4:00 PM",
    acceptedWasteTypes: ["glass", "metal", "electronic", "hazardous"],
    isActive: true,
  },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB Atlas for seeding.");

    // Clear existing seed data
    await User.deleteMany({ email: { $regex: "@devbingo\\.com$" } });
    await WasteLocation.deleteMany({ description: /MOCK DATA/ });
    await WasteReport.deleteMany({ description: /SEED REPORT/ });

    // Create seed users
    const createdUsers = await User.create(SEED_USERS);
    console.log(`Created ${createdUsers.length} seed users.`);

    // Create seed locations
    const createdLocations = await WasteLocation.create(SEED_LOCATIONS);
    console.log(`Created ${createdLocations.length} seed locations.`);

    // Create a few sample reports (for map marker testing)
    const resident = createdUsers.find((u) => u.role === "resident");
    if (resident) {
      const sampleReports = [
        {
          reporterId: resident._id,
          description: "SEED REPORT – Large pile of plastic waste near roadside",
          wasteType: "plastic",
          location: { type: "Point", coordinates: [79.8650, 6.9100] },
          address: "Near Bambalapitiya, Colombo 04",
          status: "pending",
        },
        {
          reporterId: resident._id,
          description: "SEED REPORT – Mixed waste dumped beside canal",
          wasteType: "mixed",
          location: { type: "Point", coordinates: [79.8720, 6.9250] },
          address: "Maradana, Colombo 10",
          status: "under_review",
        },
        {
          reporterId: resident._id,
          description: "SEED REPORT – Electronic waste abandoned in open lot",
          wasteType: "electronic",
          location: { type: "Point", coordinates: [79.8810, 6.9150] },
          address: "Borella, Colombo 08",
          status: "pending",
        },
      ];
      await WasteReport.create(sampleReports);
      console.log(`Created ${sampleReports.length} seed reports.`);
    }

    console.log("\n============================");
    console.log("  Development Seed Complete");
    console.log("============================");
    console.log("Login credentials:");
    SEED_USERS.forEach((u) =>
      console.log(`  ${u.role.padEnd(18)} ${u.email}  /  ${u.passwordHash}`)
    );
    console.log("\n⚠️  MOCK DATA only. Not real locations.");
    console.log("   Never use these credentials in production.\n");
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB Atlas.");
  }
};

seed();
