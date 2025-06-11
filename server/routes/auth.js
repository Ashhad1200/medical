const express = require("express");
const router = express.Router();
const { auth } = require("../middleware/auth");
const {
  register,
  login,
  getProfile,
  updateProfile,
} = require("../controllers/authController");

// Public routes
// GET /api/auth/status - Check if auth service is available
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/refresh
router.post("/refresh", (req, res) => {
  res.json({
    success: false,
    message: "Refresh token functionality not implemented yet",
  });
});

// Protected routes
router.use(auth);

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "User logged out successfully",
  });
});

// GET /api/auth/profile
router.get("/profile", getProfile);

// PUT /api/auth/profile
router.put("/profile", updateProfile);

// PUT /api/auth/change-password
router.put("/change-password", (req, res) => {
  res.json({
    success: false,
    message: "Change password functionality not implemented yet",
  });
});

module.exports = router;
