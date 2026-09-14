/**
 * BinGo – Authentication Service
 *
 * Contains business logic for user registration and login.
 * Controllers call service methods; services interact with models.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, ROLES } = require("../config/constants");

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} userId
 * @returns {string}
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Register a new user.
 *
 * Accepts role: resident | community_leader | waste_authority
 * Admin accounts are created directly in the database — not via this endpoint.
 *
 * @param {object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {string} [userData.phone]
 * @param {string} [userData.role]          - defaults to resident
 * @param {string} [userData.address]       - required for residents
 * @param {string} [userData.communityName] - required for community_leader
 * @param {{ latitude: number, longitude: number }} [userData.location]
 * @returns {{ user, token }}
 */
const registerUser = async ({
  name,
  email,
  password,
  phone,
  role,
  address,
  communityName,
  location,
}) => {
  // Check for existing email
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(
      "An account with this email already exists.",
      HTTP_STATUS.CONFLICT
    );
  }

  // Only allow public-facing roles via registration
  const allowedRoles = [ROLES.RESIDENT, ROLES.COMMUNITY_LEADER, ROLES.WASTE_AUTHORITY];
  const assignedRole = allowedRoles.includes(role) ? role : ROLES.RESIDENT;

  // Build user data
  const userData = {
    name,
    email,
    passwordHash: password, // pre-save hook hashes this
    phone: phone || null,
    role: assignedRole,
    address: address || null,
  };

  // Community leader requires a community name
  if (assignedRole === ROLES.COMMUNITY_LEADER) {
    if (!communityName || !communityName.trim()) {
      throw new AppError("Community name is required for community leaders.", HTTP_STATUS.BAD_REQUEST);
    }
    userData.communityName = communityName.trim();
  }

  // Attach GeoJSON location if provided
  if (location && location.latitude != null && location.longitude != null) {
    userData.location = {
      type: "Point",
      coordinates: [location.longitude, location.latitude],
    };
  }

  const user = await User.create(userData);
  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Authenticate a user by email and password.
 * Works for all roles including admin.
 *
 * @param {{ email, password }} credentials
 * @returns {{ user, token }}
 */
const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
  }

  if (!user.isActive) {
    throw new AppError(
      "Your account has been deactivated. Please contact support.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password.", HTTP_STATUS.UNAUTHORIZED);
  }

  const token = generateToken(user._id);
  user.passwordHash = undefined;

  return { user, token };
};

module.exports = { registerUser, loginUser, generateToken };
