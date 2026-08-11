/**
 * BinGo – WasteReport Model
 *
 * Represents a resident's illegal dumping or waste report.
 * GPS coordinates are stored for map display and location queries.
 */

const mongoose = require("mongoose");
const { WASTE_TYPES, REPORT_STATUSES } = require("../config/constants");

const wasteReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Reporter ID is required"],
    },

    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },

    wasteType: {
      type: String,
      required: [true, "Waste type is required"],
      enum: {
        values: Object.values(WASTE_TYPES),
        message: `Waste type must be one of: ${Object.values(WASTE_TYPES).join(", ")}`,
      },
    },

    imageUrl: {
      type: String,
      default: null,
      // TODO Sprint 2+: Replace local URI handling with Cloudinary URLs
    },

    // GeoJSON Point for location-based queries
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude] – GeoJSON order
        required: [true, "Location coordinates are required"],
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 && // longitude
              coords[1] >= -90 && coords[1] <= 90     // latitude
            );
          },
          message: "Invalid coordinates. Expected [longitude, latitude].",
        },
      },
    },

    // Human-readable address (optional, from reverse geocoding)
    address: {
      type: String,
      trim: true,
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: Object.values(REPORT_STATUSES),
        message: `Status must be one of: ${Object.values(REPORT_STATUSES).join(", ")}`,
      },
      default: REPORT_STATUSES.PENDING,
    },

    // Waste authority member who reviewed the report
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    reviewNote: {
      type: String,
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

// ── Geospatial index for location queries ──────────────────────────────────
wasteReportSchema.index({ location: "2dsphere" });

// ── Compound index for reporter + status filtering ─────────────────────────
wasteReportSchema.index({ reporterId: 1, status: 1 });

// ── Index for status-based queries (admin/authority dashboards) ────────────
wasteReportSchema.index({ status: 1, createdAt: -1 });

const WasteReport = mongoose.model("WasteReport", wasteReportSchema);

module.exports = WasteReport;
