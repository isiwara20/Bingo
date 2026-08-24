/**
 * BinGo – Server Entry Point
 *
 * This file is intentionally minimal.
 * Application setup is handled in src/app.js.
 * Database connection is handled in src/config/database.js.
 */

require("dotenv").config();

const app = require("./src/app");
const connectDatabase = require("./src/config/database");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Connect to MongoDB Atlas, then start the server
connectDatabase()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log("===========================================");
      console.log(`  BinGo API Server`);
      console.log(`  Environment : ${NODE_ENV}`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  Local       : http://localhost:${PORT}/api/v1/health`);
      console.log(`  Network     : http://192.168.1.8:${PORT}/api/v1/health`);
      console.log("===========================================");
    });
  })
  .catch((error) => {
    console.error("Failed to connect to database. Server not started.", error);
    process.exit(1);
  });
