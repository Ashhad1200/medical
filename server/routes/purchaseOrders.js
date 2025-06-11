const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const {
  getAllPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
} = require("../controllers/purchaseOrderController");

// TODO: Import purchase order controller
// const {
//   getPurchaseOrders,
//   getPurchaseOrder,
//   createPurchaseOrder,
//   updatePurchaseOrder,
//   deletePurchaseOrder,
//   receivePurchaseOrder
// } = require('../controllers/purchaseOrderController');

// Protected routes
router.use(auth);

// Get all purchase orders (admin and warehouse)
router.get("/", checkRole(["admin", "warehouse"]), getAllPurchaseOrders);

// Get single purchase order (admin and warehouse)
router.get("/:id", checkRole(["admin", "warehouse"]), getPurchaseOrder);

// Create purchase order (admin and warehouse)
router.post("/", checkRole(["admin", "warehouse"]), createPurchaseOrder);

// Update purchase order (admin and warehouse)
router.put("/:id", checkRole(["admin", "warehouse"]), updatePurchaseOrder);

// Receive purchase order and update inventory (admin and warehouse)
router.post(
  "/:id/receive",
  checkRole(["admin", "warehouse"]),
  receivePurchaseOrder
);

// Cancel purchase order (admin and warehouse)
router.post(
  "/:id/cancel",
  checkRole(["admin", "warehouse"]),
  cancelPurchaseOrder
);

module.exports = router;
