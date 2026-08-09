/**
 * BinGo – WasteLocation Model
 *
 * Represents fixed waste-related locations such as:
 * - Recycling centres
 * - Collection points
 * - Bin locations
 *
 * Separate from WasteReport (which is user-submitted).
 * This data is typically managed by waste_authority or admin.
 */

const mongoose = require("mongoose");

const LOCATION_TYPES = ["recycling_centre", "collection_point", "bin", "other"];

const wasteLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Location name is required"],
      trim: true,
    },

    type: {
      type: String,
      required: [true, "Location type is required"],
      enum: {
        values: LOCATION_TYPES,
        message: `Type must be one of: ${LOCATION_TYPES.join(", ")}`,
      },
    },

    description: {
      type: String,
      trim: true,
      default: null,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: [true, "Coordinates are required"],
      },
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },

    operatingHours: {
      type: String,
      default: null,
    },

    acceptedWasteTypes: {
      type: [String],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    managedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

wasteLocationSchema.index({ location: "2dsphere" });
wasteLocationSchema.index({ type: 1, isActive: 1 });

const WasteLocation = mongoose.model("WasteLocation", wasteLocationSchema);

module.exports = WasteLocation;
