const express = require("express");
const { body } = require("express-validator");
const orderController = require("../controllers/orderController");
const { protect, adminOrCounter, adminOnly } = require("../middleware/auth");

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get orders with filtering (admin can see all, counter sees own)
router.get("/", adminOrCounter, orderController.getOrders);

// Get order by ID
router.get("/:id", adminOrCounter, orderController.getOrderById);

// Generate PDF receipt for order
router.get(
  "/:id/receipt",
  adminOrCounter,
  orderController.generateOrderReceipt
);

// Get order summary/statistics
router.get("/summary/stats", adminOnly, orderController.getOrderSummary);

// Create new order
router.post(
  "/",
  adminOrCounter,
  [
    body("items")
      .isArray({ min: 1 })
      .withMessage("Order must have at least one item"),
    body("items.*.medicineId")
      .notEmpty()
      .withMessage("Medicine ID is required"),
    body("items.*.quantity")
      .isInt({ min: 1 })
      .withMessage("Valid quantity is required"),
    body("items.*.discountPercent")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Discount must be between 0 and 100"),
    body("taxPercent")
      .optional()
      .isFloat({ min: 0, max: 100 })
      .withMessage("Tax must be between 0 and 100"),
    body("customerName")
      .optional()
      .trim()
      .isLength({ min: 2 })
      .withMessage("Customer name must be at least 2 characters"),
    body("customerPhone")
      .optional()
      .isMobilePhone()
      .withMessage("Valid phone number required"),
    body("paymentMethod")
      .optional()
      .isIn(["cash", "card", "upi", "credit"])
      .withMessage("Invalid payment method"),
  ],
  orderController.createOrder
);

// Update order status
router.patch(
  "/:id/status",
  adminOrCounter,
  [
    body("status")
      .isIn(["pending", "completed", "cancelled"])
      .withMessage("Invalid status"),
  ],
  orderController.updateOrderStatus
);

// Delete/cancel order
router.delete("/:id", adminOrCounter, orderController.deleteOrder);

module.exports = router;
