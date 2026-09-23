/**
 * BinGo – User Model
 *
 * Represents all application users regardless of role.
 * Roles determine feature access via RBAC middleware.
 *
 * Security notes:
 * - Password is NEVER stored as plain text.
 * - The passwordHash field is excluded from queries by default.
 * - Use the comparePassword() instance method for authentication.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { ROLES } = require("../config/constants");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email address",
      ],
    },

    passwordHash: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Never returned in queries unless explicitly requested
    },

    sessionVersion: { type: Number, default: 0 },
    passwordReset: {
      type: new mongoose.Schema({
        otpHash: String,
        expiresAt: Date,
        sentAt: Date,
        attempts: { type: Number, default: 0 },
        tokenHash: String,
        tokenExpiresAt: Date,
      }, { _id: false }),
      select: false,
      default: undefined,
    },

    phone: {
      type: String,
      trim: true,
      default: null,
    },

    whatsappNumber: {
      type: String,
      trim: true,
      default: null,
    },

    whatsappVerified: {
      type: Boolean,
      default: false,
    },

    authorityName: {
      type: String,
      trim: true,
      default: null,
    },

    phoneVerified: {
      type: Boolean,
      default: false,
    },

    otpCode: {
      type: String,
      select: false,
      default: null,
    },

    otpExpiry: {
      type: Date,
      select: false,
      default: null,
    },

    address: {
      type: String,
      trim: true,
      default: null,
    },

    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
    },

    communityName: {
      type: String,
      trim: true,
      default: null,
    },

    profileImage: {
      type: String,
      default: null,
    },

    role: {
      type: String,
      enum: {
        values: Object.values(ROLES),
        message: `Role must be one of: ${Object.values(ROLES).join(", ")}`,
      },
      default: ROLES.RESIDENT,
    },

    rewardPoints: {
      type: Number,
      default: 0,
      min: [0, "Reward points cannot be negative"],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Plan (residents only) ─────────────────────────────────────────────
    plan: {
      type: String,
      enum: ["free", "plus", "pro"],
      default: null,
    },

    hasSelectedPlan: {
      type: Boolean,
      default: false,
    },

    planActivatedAt: {
      type: Date,
      default: null,
    },

    // ── Profile verification (residents only) ─────────────────────────────
    profileVerified: {
      type: Boolean,
      default: false,
    },

    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected"],
      default: "unverified",
    },

    residenceImage: {
      type: String, // base64 or URL
      default: null,
    },

    faceImage: {
      type: String, // base64 or URL
      default: null,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verificationRejectedReason: {
      type: String,
      default: null,
    },

    verificationLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: undefined,
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: undefined,
      },
      address: { type: String, default: null },
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
    toJSON: {
      // Remove sensitive fields when converting to JSON
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.passwordReset;
        delete ret.otpCode;
        delete ret.otpExpiry;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// ── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });
userSchema.index({ location: "2dsphere" }, { sparse: true });

// ── Pre-save hook – hash password before saving ────────────────────────────
userSchema.pre("save", async function (next) {
  // Only hash if the password has been modified
  if (!this.isModified("passwordHash")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.passwordHash = await bcrypt.hash(this.passwordHash, saltRounds);
  next();
});

// ── Instance method – compare plain password with stored hash ──────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  return bcrypt.compare(plainPassword, this.passwordHash);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
