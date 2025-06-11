const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");

// TODO: Import user controller
// const {
//   getUsers,
//   getUser,
//   createUser,
//   updateUser,
//   deleteUser,
//   updateUserStatus
// } = require('../controllers/userController');

// Protected routes - only admin role
router.use(auth);
router.use(checkRole(["admin"]));

// GET /api/users
router.get("/", (req, res) => {
  res.json({ message: "Get all users" });
});

// GET /api/users/:id
router.get("/:id", (req, res) => {
  res.json({ message: "Get user by ID" });
});

// POST /api/users
router.post("/", (req, res) => {
  res.json({ message: "Create user" });
});

// PUT /api/users/:id
router.put("/:id", (req, res) => {
  res.json({ message: "Update user" });
});

// DELETE /api/users/:id
router.delete("/:id", (req, res) => {
  res.json({ message: "Delete user" });
});

// PATCH /api/users/:id/status
router.patch("/:id/status", (req, res) => {
  res.json({ message: "Update user status" });
});

module.exports = router;
