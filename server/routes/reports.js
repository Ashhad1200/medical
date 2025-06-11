const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");

// TODO: Import report controller
// const {
//   getSalesReport,
//   getInventoryReport,
//   getProfitReport,
//   getSupplierReport
// } = require('../controllers/reportController');

// Protected routes - only admin role
router.use(auth);
router.use(checkRole(["admin"]));

// GET /api/reports/sales
router.get("/sales", (req, res) => {
  res.json({ message: "Get sales report" });
});

// GET /api/reports/inventory
router.get("/inventory", (req, res) => {
  res.json({ message: "Get inventory report" });
});

// GET /api/reports/profit
router.get("/profit", (req, res) => {
  res.json({ message: "Get profit report" });
});

// GET /api/reports/suppliers
router.get("/suppliers", (req, res) => {
  res.json({ message: "Get supplier report" });
});

module.exports = router;
