const express = require("express");
const {
  searchMedicines,
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  updateMedicineStock,
  getLowStockMedicines,
  getExpiringMedicines,
  getInventorySummary,
  deleteMedicine,
  bulkImportMedicines,
  getMedicineCategories,
} = require("../controllers/medicineController");

const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Public routes (accessible by all authenticated users)
router.get("/search", protect, searchMedicines);
router.get("/categories", protect, getMedicineCategories);

// Protected routes (require authentication)
router.use(protect);

// General medicine routes
router
  .route("/")
  .get(getMedicines)
  .post(authorize("admin", "warehouse"), createMedicine);

router
  .route("/:id")
  .get(getMedicineById)
  .put(authorize("admin", "warehouse"), updateMedicine)
  .delete(authorize("admin"), deleteMedicine);

// Stock management routes
router.patch(
  "/:id/stock",
  authorize("admin", "warehouse"),
  updateMedicineStock
);

// Inventory alerts and reports
router.get(
  "/alerts/low-stock",
  authorize("admin", "warehouse"),
  getLowStockMedicines
);
router.get(
  "/alerts/expiring",
  authorize("admin", "warehouse"),
  getExpiringMedicines
);
router.get("/summary", authorize("admin", "warehouse"), getInventorySummary);

// Bulk operations
router.post(
  "/bulk-import",
  authorize("admin", "warehouse"),
  bulkImportMedicines
);

module.exports = router;
