const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  getSupplierStats,
  searchSuppliers,
  getSuppliersByCity,
} = require("../controllers/supplierController");

// Protected routes
router.use(auth);

// Search suppliers (must be before /:id route)
router.get("/search", checkRole(["admin", "warehouse", "counter"]), searchSuppliers);

// Get supplier statistics
router.get("/stats", checkRole(["admin", "warehouse"]), getSupplierStats);

// Get suppliers by city
router.get("/city/:city", checkRole(["admin", "warehouse"]), getSuppliersByCity);

// Get all suppliers (admin and warehouse)
router.get("/", checkRole(["admin", "warehouse"]), getAllSuppliers);

// Get single supplier (admin and warehouse)
router.get("/:id", checkRole(["admin", "warehouse"]), getSupplier);

// Create supplier (admin and warehouse)
router.post("/", checkRole(["admin", "warehouse"]), createSupplier);

// Update supplier (admin and warehouse)
router.put("/:id", checkRole(["admin", "warehouse"]), updateSupplier);

// Toggle supplier status (admin and warehouse)
router.patch("/:id/toggle-status", checkRole(["admin", "warehouse"]), toggleSupplierStatus);

// Delete supplier (admin only)
router.delete("/:id", checkRole(["admin"]), deleteSupplier);

module.exports = router;
