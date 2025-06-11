const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");

// TODO: Import inventory controller
// const {
//   getInventory,
//   getInventoryItem,
//   updateInventory,
//   getLowStockItems,
//   getExpiringItems
// } = require('../controllers/inventoryController');

// Protected routes - only admin and warehouse roles
router.use(auth);
router.use(checkRole(["admin", "warehouse"]));

// GET /api/inventory
router.get("/", (req, res) => {
  res.json({ message: "Get all inventory items" });
});

// GET /api/inventory/:id
router.get("/:id", (req, res) => {
  res.json({ message: "Get inventory item by ID" });
});

// PUT /api/inventory/:id
router.put("/:id", (req, res) => {
  res.json({ message: "Update inventory item" });
});

// GET /api/inventory/low-stock
router.get("/low-stock", (req, res) => {
  res.json({ message: "Get low stock items" });
});

// GET /api/inventory/expiring
router.get("/expiring", (req, res) => {
  res.json({ message: "Get expiring items" });
});

module.exports = router;
