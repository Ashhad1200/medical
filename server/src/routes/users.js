const express = require("express");
const { protect, adminOnly } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication and admin privileges
router.use(protect);
router.use(adminOnly);

// Get all users
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Users endpoint - coming soon",
    data: { users: [] },
    requestId: req.requestId,
  });
});

module.exports = router;
