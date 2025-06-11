const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const {
  getAllMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  bulkImport,
  exportInventory,
  searchMedicines,
  getLowStockMedicines,
  getExpiredMedicines,
  getExpiringSoonMedicines,
} = require("../controllers/medicineController");
const multer = require("multer");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Protected routes
router.use(auth);

// Test route
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Medicine routes are working" });
});

// Search medicines route (must be before /:id route)
router.get("/search", searchMedicines);

// Get all medicines
router.get("/", getAllMedicines);

// Get low stock medicines
router.get("/low-stock", getLowStockMedicines);

// Get expired medicines
router.get("/expired", getExpiredMedicines);

// Get expiring soon medicines
router.get("/expiring-soon", getExpiringSoonMedicines);

// Export inventory
router.get("/export", checkRole(["admin", "warehouse"]), exportInventory);

// Bulk import medicines
router.post(
  "/bulk-import",
  checkRole(["admin", "warehouse"]),
  upload.single("file"),
  bulkImport
);

// Get single medicine
router.get("/:id", getMedicine);

// Create medicine (admin and warehouse only)
router.post("/", checkRole(["admin", "warehouse"]), createMedicine);

// Update medicine (admin and warehouse only)
router.put("/:id", checkRole(["admin", "warehouse"]), updateMedicine);

// Update stock only
router.patch(
  "/:id/stock",
  checkRole(["admin", "warehouse", "counter"]),
  updateStock
);

// Delete medicine (admin only)
router.delete("/:id", checkRole(["admin"]), deleteMedicine);

module.exports = router;
