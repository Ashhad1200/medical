const mongoose = require("mongoose");

// Schema for purchase order items
const purchaseOrderItemSchema = new mongoose.Schema(
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
    unitPrice: {
      type: Number,
      required: true,
      min: [0, "Unit price cannot be negative"],
    },
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    receivedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Received quantity cannot be negative"],
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "Supplier is required"],
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    items: {
      type: [purchaseOrderItemSchema],
      required: [true, "Purchase order must have at least one item"],
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "Purchase order must have at least one item",
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
    status: {
      type: String,
      enum: {
        values: [
          "pending",
          "ordered",
          "partially_received",
          "received",
          "cancelled",
        ],
        message:
          "Status must be pending, ordered, partially_received, received, or cancelled",
      },
      default: "pending",
      index: true,
    },
    orderDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expectedDeliveryDate: {
      type: Date,
    },
    actualDeliveryDate: {
      type: Date,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "partial", "paid"],
      default: "pending",
    },
    paymentDueDate: {
      type: Date,
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
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
purchaseOrderSchema.index({ orderNumber: 1 });
purchaseOrderSchema.index({ supplierId: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ orderDate: -1 });
purchaseOrderSchema.index({ createdBy: 1 });

// Pre-save middleware to generate order number
purchaseOrderSchema.pre("save", async function (next) {
  if (this.isNew && !this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `PO-${String(count + 1).padStart(6, "0")}`;
  }
  next();
});

// Virtual for order progress percentage
purchaseOrderSchema.virtual("progressPercentage").get(function () {
  if (this.items.length === 0) return 0;

  const totalQuantity = this.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );
  const receivedQuantity = this.items.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0
  );

  return Math.round((receivedQuantity / totalQuantity) * 100);
});

// Virtual for checking if order is overdue
purchaseOrderSchema.virtual("isOverdue").get(function () {
  if (!this.expectedDeliveryDate) return false;
  return this.expectedDeliveryDate < new Date() && this.status !== "received";
});

// Virtual for days since order
purchaseOrderSchema.virtual("daysSinceOrder").get(function () {
  const today = new Date();
  const orderDate = new Date(this.orderDate);
  const diffTime = Math.abs(today - orderDate);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Static method to find orders by supplier
purchaseOrderSchema.statics.findBySupplier = function (supplierId) {
  return this.find({ supplierId }).populate("supplierId", "name contactPerson");
};

// Static method to find orders by status
purchaseOrderSchema.statics.findByStatus = function (status) {
  return this.find({ status }).populate("supplierId", "name contactPerson");
};

// Static method to find overdue orders
purchaseOrderSchema.statics.findOverdue = function () {
  return this.find({
    expectedDeliveryDate: { $lt: new Date() },
    status: { $nin: ["received", "cancelled"] },
  }).populate("supplierId", "name contactPerson");
};

// Static method to find orders by date range
purchaseOrderSchema.statics.findByDateRange = function (startDate, endDate) {
  return this.find({
    orderDate: {
      $gte: startDate,
      $lte: endDate,
    },
  }).populate("supplierId", "name contactPerson");
};

// Method to calculate totals
purchaseOrderSchema.methods.calculateTotals = function () {
  // Calculate subtotal from items
  this.subtotal = this.items.reduce((sum, item) => sum + item.totalPrice, 0);

  // Calculate tax amount
  this.taxAmount = (this.subtotal * this.taxPercent) / 100;

  // Calculate total
  this.total = this.subtotal + this.taxAmount - this.discountAmount;

  return this;
};

// Method to add item to purchase order
purchaseOrderSchema.methods.addItem = function (itemData) {
  const item = {
    ...itemData,
    totalPrice: itemData.unitPrice * itemData.quantity,
  };

  this.items.push(item);
  this.calculateTotals();
  return this;
};

// Method to receive items
purchaseOrderSchema.methods.receiveItems = function (itemUpdates, receivedBy) {
  let fullyReceived = true;

  // Update received quantities
  itemUpdates.forEach((update) => {
    const item = this.items.id(update.itemId);
    if (item) {
      item.receivedQuantity = Math.min(update.receivedQuantity, item.quantity);
      if (item.receivedQuantity < item.quantity) {
        fullyReceived = false;
      }
    }
  });

  // Update status based on received quantities
  const hasPartialReceived = this.items.some(
    (item) => item.receivedQuantity > 0
  );

  if (fullyReceived && hasPartialReceived) {
    this.status = "received";
    this.actualDeliveryDate = new Date();
  } else if (hasPartialReceived) {
    this.status = "partially_received";
  }

  if (receivedBy) {
    this.receivedBy = receivedBy;
  }

  return this.save();
};

// Method to cancel order
purchaseOrderSchema.methods.cancel = function (reason) {
  this.status = "cancelled";
  if (reason) {
    this.notes = this.notes
      ? `${this.notes}\nCancelled: ${reason}`
      : `Cancelled: ${reason}`;
  }
  return this.save();
};

// Method to mark as ordered
purchaseOrderSchema.methods.markAsOrdered = function () {
  this.status = "ordered";
  return this.save();
};

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
