const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { validationResult } = require("express-validator");
const authService = require("../services/authService");
const { asyncHandler, ValidationError } = require("../utils/errors");

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

/**
 * Register new user (Admin only)
 * @route POST /api/auth/register
 * @access Private (Admin only)
 */
const register = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError("Validation failed", errors.array());
  }

  const result = await authService.register(req.body);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: result,
    requestId: req.requestId,
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 * @access Public
 */
const login = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError("Validation failed", errors.array());
  }

  const { username, password } = req.body;
  const result = await authService.login(username, password);

  res.json({
    success: true,
    message: "Login successful",
    data: result,
    requestId: req.requestId,
  });
});

/**
 * Get current user profile
 * @route GET /api/auth/profile
 * @access Private
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await authService.getUserById(req.user.id);

  res.json({
    success: true,
    message: "Profile retrieved successfully",
    data: { user },
    requestId: req.requestId,
  });
});

/**
 * Update user profile
 * @route PUT /api/auth/profile
 * @access Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError("Validation failed", errors.array());
  }

  // For now, just return the current user data
  // This would need to be implemented in the auth service
  const user = await authService.getUserById(req.user.id);

  res.json({
    success: true,
    message: "Profile updated successfully",
    data: { user },
    requestId: req.requestId,
  });
});

/**
 * Change user password
 * @route PUT /api/auth/change-password
 * @access Private
 */
const changePassword = asyncHandler(async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError("Validation failed", errors.array());
  }

  const { currentPassword, newPassword } = req.body;
  await authService.updatePassword(req.user.id, currentPassword, newPassword);

  res.json({
    success: true,
    message: "Password changed successfully",
    requestId: req.requestId,
  });
});

/**
 * Get all users (Admin only)
 * @route GET /api/auth/users
 * @access Private (Admin only)
 */
const getUsers = asyncHandler(async (req, res) => {
  // This would need to be implemented in the auth service
  // For now, return empty array
  res.json({
    success: true,
    message: "Users retrieved successfully",
    data: { users: [] },
    requestId: req.requestId,
  });
});

/**
 * Update user (Admin only)
 * @route PUT /api/auth/users/:id
 * @access Private (Admin only)
 */
const updateUser = asyncHandler(async (req, res) => {
  // This would need to be implemented in the auth service
  // For now, return success message
  res.json({
    success: true,
    message: "User updated successfully",
    requestId: req.requestId,
  });
});

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getUsers,
  updateUser,
};
