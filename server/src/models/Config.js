/**
 * BinGo – App Config Model
 * Stores singleton app-wide configuration (SMS credentials, etc.)
 * Only one document exists — identified by key "app".
 */

const mongoose = require("mongoose");

const configSchema = new mongoose.Schema(
  {
    key: { type: String, default: "app", unique: true },
    textlkUserId:   { type: String, default: null },
    textlkApiKey:   { type: String, default: null, select: false },
    textlkSenderId: { type: String, default: "BinGo" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Config", configSchema);
