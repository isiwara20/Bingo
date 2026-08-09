/**
 * BinGo – MongoDB Atlas Connection
 *
 * Uses Mongoose to manage the database connection.
 * Connection string is loaded from environment variables.
 */

const mongoose = require("mongoose");

/**
 * Connects to MongoDB Atlas.
 * Resolves when the connection is established.
 * Rejects (and triggers process exit via server.js) on failure.
 */
const connectDatabase = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error(
      "MONGODB_URI is not defined in environment variables. " +
        "Please check your .env file."
    );
  }

  try {
    const connection = await mongoose.connect(uri, {
      // These options ensure stable connections on MongoDB Atlas
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      `MongoDB Atlas connected: ${connection.connection.host}`
    );

    // Handle post-connection events
    mongoose.connection.on("error", (error) => {
      console.error("MongoDB connection error:", error);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Attempting to reconnect...");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected.");
    });

    return connection;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

module.exports = connectDatabase;
