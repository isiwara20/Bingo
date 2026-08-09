/**
 * BinGo – Authentication Service
 *
 * Contains business logic for user registration and login.
 * Controllers call service methods; services interact with models.
 *
 * This separation keeps controllers thin and services testable.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { HTTP_STATUS, ROLES } = require("../config/constants");

/**
 * Generate a signed JWT for a given user ID.
 *
 * @param {string} userId - MongoDB ObjectId as string
 * @returns {string} Signed JWT
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Register a new user.
 *
 * @param {object} userData - { name, email, password, phone }
 * @returns {{ user, token }}
 */
const registerUser = async ({ name, email, password, phone }) => {
  // Check for existing email
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(
      "An account with this email already exists.",
      HTTP_STATUS.CONFLICT
    );
  }

  // Create user – password hashing happens in the pre-save hook on User model
  const user = await User.create({
    name,
    email,
    passwordHash: password, // pre-save hook will hash this
    phone: phone || null,
    role: ROLES.RESIDENT, // new registrations are always residents
  });

  const token = generateToken(user._id);

  return { user, token };
};

/**
 * Authenticate a user by email and password.
 *
 * @param {object} credentials - { email, password }
 * @returns {{ user, token }}
 */
const loginUser = async ({ email, password }) => {
  // Retrieve user with passwordHash (excluded by default via select: false)
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    // Use a generic message to avoid email enumeration
    throw new AppError(
      "Invalid email or password.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Your account has been deactivated. Please contact support.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new AppError(
      "Invalid email or password.",
      HTTP_STATUS.UNAUTHORIZED
    );
  }

  const token = generateToken(user._id);

  // Remove passwordHash from the response object
  user.passwordHash = undefined;

  return { user, token };
};

module.exports = { registerUser, loginUser, generateToken };
