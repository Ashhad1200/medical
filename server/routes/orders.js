const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { auth, checkRole } = require("../middleware/auth");
const {
  getAllOrders,
  getOrder,
  createOrder,
  getDashboardData,
  getOrderPdf,
} = require("../controllers/orderController");

// Middleware to validate order ID
const validateOrderId = (req, res, next) => {
  const { id } = req.params;

  if (
    !id ||
    id === "undefined" ||
    id === "null" ||
    !mongoose.Types.ObjectId.isValid(id)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid order ID format",
    });
  }

  next();
};

// Protected routes
router.use(auth);

// Get dashboard data (admin only)
router.get("/dashboard", checkRole(["admin"]), getDashboardData);

// Get all orders (admin or counter)
router.get("/", checkRole(["admin", "counter"]), getAllOrders);

// Get single order (admin or counter) - with ID validation
router.get("/:id", checkRole(["admin", "counter"]), validateOrderId, getOrder);

// Get order PDF (admin or counter) - with ID validation
router.get(
  "/:id/receipt",
  checkRole(["admin", "counter"]),
  validateOrderId,
  getOrderPdf
);

// Create order (counter and admin)
router.post("/", checkRole(["admin", "counter"]), createOrder);

module.exports = router;
