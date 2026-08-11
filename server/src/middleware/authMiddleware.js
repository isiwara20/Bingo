/**
 * BinGo – Authentication & Authorization Middleware
 *
 * authenticateUser  – verifies JWT and attaches user to req
 * authorizeRoles()  – restricts access to specified roles
 */

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("../utils/asyncHandler");

/**
 * Middleware: Verify JWT token and attach authenticated user to req.user
 *
 * Expects: Authorization: Bearer <token>
 */
const authenticateUser = asyncHandler(async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    throw new AppError(
      "Access denied. No authentication token provided.",
      401
    );
  }

  // Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  // Check the user still exists and is active
  const user = await User.findById(decoded.id).select("-passwordHash");

  if (!user) {
    throw new AppError(
      "The user belonging to this token no longer exists.",
      401
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Your account has been deactivated. Please contact support.",
      401
    );
  }

  // Attach user to request
  req.user = user;
  next();
});

/**
 * Middleware factory: Restrict access to specific roles.
 *
 * Usage:
 *   router.get("/admin", authenticateUser, authorizeRoles("admin"), handler)
 *   router.get("/report", authenticateUser, authorizeRoles("admin", "waste_authority"), handler)
 *
 * @param {...string} roles - Allowed role strings
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. Required role: ${roles.join(" or ")}. Your role: ${req.user.role}`,
          403
        )
      );
    }

    next();
  };
};

module.exports = { authenticateUser, authorizeRoles };
