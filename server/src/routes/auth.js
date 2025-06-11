const express = require("express");
const { body } = require("express-validator");
const authController = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// Login route
router.post(
  "/login",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  authController.login
);

// Protected routes
router.use(protect);

// Profile routes
router.get("/profile", authController.getProfile);
router.put(
  "/profile",
  [
    body("fullName").notEmpty().withMessage("Full name is required"),
    body("phone")
      .optional()
      .isMobilePhone()
      .withMessage("Valid phone required"),
  ],
  authController.updateProfile
);

router.put(
  "/change-password",
  [
    body("currentPassword")
      .notEmpty()
      .withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  authController.changePassword
);

// Admin only routes
router.post(
  "/register",
  adminOnly,
  [
    body("username")
      .isLength({ min: 3 })
      .withMessage("Username must be at least 3 characters"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .isIn(["admin", "counter", "warehouse"])
      .withMessage("Invalid role"),
    body("fullName").notEmpty().withMessage("Full name is required"),
  ],
  authController.register
);

router.get("/users", adminOnly, authController.getUsers);
router.put("/users/:id", adminOnly, authController.updateUser);

module.exports = router;
