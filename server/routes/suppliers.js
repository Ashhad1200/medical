const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require("../controllers/supplierController");

// Protected routes
router.use(auth);

// Get all suppliers (admin and warehouse)
router.get("/", checkRole(["admin", "warehouse"]), getAllSuppliers);

// Get single supplier (admin and warehouse)
router.get("/:id", checkRole(["admin", "warehouse"]), getSupplier);

// Create supplier (admin and warehouse)
router.post("/", checkRole(["admin", "warehouse"]), createSupplier);

// Update supplier (admin and warehouse)
router.put("/:id", checkRole(["admin", "warehouse"]), updateSupplier);

// Delete supplier (admin only)
router.delete("/:id", checkRole(["admin"]), deleteSupplier);

module.exports = router;
