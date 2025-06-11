const mongoose = require("mongoose");

// Schema for order items
const orderItemSchema = new mongoose.Schema(
  {
    medicineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Medicine",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    manufacturer: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
    },
    retailPrice: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    tradePrice: {
      type: Number,
      required: true,
      min: [0, "Trade price cannot be negative"],
    },
    discount: {
      type: Number,
      default: 0,
      min: [0, "Discount cannot be negative"],
      max: [100, "Discount cannot exceed 100%"],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    profit: {
      type: Number,
      required: true,
      min: [0, "Profit cannot be negative"],
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
      default: function () {
        // Generate order number: ORD-YYYYMMDD-XXXX
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const random = Math.floor(Math.random() * 9999)
          .toString()
          .padStart(4, "0");
        return `ORD-${year}${month}${day}-${random}`;
      },
    },
    customerName: {
      type: String,
      default: "Walk-in Customer",
      trim: true,
    },
    customerPhone: {
      type: String,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: [true, "Order must have at least one item"],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Order must have at least one item",
      },
    },
    subtotal: {
      type: Number,
      required: [true, "Subtotal is required"],
      min: [0, "Subtotal cannot be negative"],
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: [0, "Tax percent cannot be negative"],
      max: [100, "Tax percent cannot exceed 100%"],
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, "Tax amount cannot be negative"],
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, "Discount amount cannot be negative"],
    },
    total: {
      type: Number,
      required: [true, "Total is required"],
      min: [0, "Total cannot be negative"],
    },
    profit: {
      type: Number,
      required: [true, "Profit is required"],
      min: [0, "Profit cannot be negative"],
    },
    status: {
      type: String,
      enum: {
        values: ["pending", "completed", "cancelled"],
        message: "Status must be pending, completed, or cancelled",
      },
      default: "completed",
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "upi", "credit"],
      default: "cash",
    },
    notes: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdBy: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ customerName: 1 });

// Pre-save middleware to generate order number
orderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Pre-insertMany middleware to generate order numbers
orderSchema.pre("insertMany", async function (next, docs) {
  if (Array.isArray(docs)) {
    const count = await this.countDocuments();
    docs.forEach((doc, index) => {
      if (!doc.orderNumber) {
        doc.orderNumber = `ORD-${String(count + index + 1).padStart(6, "0")}`;
      }
    });
  }
  next();
});

// Virtual for order date formatting
orderSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString();
});

// Virtual for order time formatting
orderSchema.virtual("formattedTime").get(function () {
  return this.createdAt.toLocaleTimeString();
});

// Static method to find orders by date range
orderSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    createdAt: {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate("createdBy", "username fullName");
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function (status) {
  return this.find({ status }).populate("createdBy", "username fullName");
};

// Static method to get daily sales report
orderSchema.statics.getDailySalesReport = function (date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return this.aggregate([
    {
      $match: {
        createdAt: {
          $gte: startOfDay,
          $lte: endOfDay,
        },
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        totalProfit: { $sum: "$profit" },
        averageOrderValue: { $avg: "$total" },
      },
    },
  ]);
};

// Static method to get top selling medicines
orderSchema.statics.getTopSellingMedicines = function (limit = 10) {
  return this.aggregate([
    { $match: { status: "completed" } },
    { $unwind: "$items" },
    {
      $group: {
        _id: "$items.medicineId",
        name: { $first: "$items.name" },
        manufacturer: { $first: "$items.manufacturer" },
        totalQuantity: { $sum: "$items.quantity" },
        totalRevenue: { $sum: "$items.totalPrice" },
        totalProfit: { $sum: "$items.profit" },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);
};

// Method to calculate totals
orderSchema.methods.calculateTotals = function () {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => {
    return sum + (item.retailPrice * item.quantity - item.discountAmount);
  }, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxPercent) / 100;

  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discountAmount;

  // Calculate total profit
  this.profit = this.items.reduce((sum, item) => sum + item.profit, 0);

  return this;
};

// Method to add item to order
orderSchema.methods.addItem = function (itemData) {
  const item = {
    ...itemData,
    totalPrice:
      itemData.retailPrice * itemData.quantity - (itemData.discountAmount || 0),
    profit:
      (itemData.retailPrice - itemData.tradePrice) * itemData.quantity -
      (itemData.discountAmount || 0),
  };

  this.items.push(item);
  this.calculateTotals();
  return this;
};

// Method to remove item from order
orderSchema.methods.removeItem = function (itemIndex) {
  if (itemIndex >= 0 && itemIndex < this.items.length) {
    this.items.splice(itemIndex, 1);
    this.calculateTotals();
  }
  return this;
};

module.exports = mongoose.model("Order", orderSchema);
