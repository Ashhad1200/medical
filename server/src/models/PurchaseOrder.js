const mongoose = require("mongoose");

const purchaseOrderItemSchema = new mongoose.Schema({
  medicineId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Medicine",
    required: true,
  },
  medicineName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  unitCost: {
    type: Number,
    required: true,
    min: 0,
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0,
  },
  receivedQuantity: {
    type: Number,
    default: 0,
    min: 0,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  batchNumber: {
    type: String,
    trim: true,
  },
});

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: {
      type: String,
      unique: true,
      required: true,
    },
    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    items: [purchaseOrderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    taxPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "partial", "completed", "cancelled"],
      default: "pending",
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
    paidAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    completedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      trim: true,
    },
    invoiceDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Auto-generate PO number
purchaseOrderSchema.pre("save", async function (next) {
  if (!this.poNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const lastPO = await mongoose
      .model("PurchaseOrder")
      .findOne({
        poNumber: new RegExp(`^PO${dateStr}`),
      })
      .sort({ poNumber: -1 });

    let sequence = 1;
    if (lastPO) {
      const lastSequence = parseInt(lastPO.poNumber.slice(-4));
      sequence = lastSequence + 1;
    }

    this.poNumber = `PO${dateStr}${sequence.toString().padStart(4, "0")}`;
  }
  next();
});

// Virtual for completion percentage
purchaseOrderSchema.virtual("completionPercent").get(function () {
  if (this.items.length === 0) return 0;

  const totalOrdered = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = this.items.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0
  );

  return totalOrdered > 0
    ? ((totalReceived / totalOrdered) * 100).toFixed(2)
    : 0;
});

// Virtual for remaining amount
purchaseOrderSchema.virtual("remainingAmount").get(function () {
  return this.total - this.paidAmount;
});

// Method to update status based on received quantities
purchaseOrderSchema.methods.updateStatus = function () {
  const totalOrdered = this.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalReceived = this.items.reduce(
    (sum, item) => sum + item.receivedQuantity,
    0
  );

  if (totalReceived === 0) {
    this.status = "pending";
  } else if (totalReceived < totalOrdered) {
    this.status = "partial";
  } else if (totalReceived >= totalOrdered) {
    this.status = "completed";
    this.completedAt = new Date();
  }

  return this.save();
};

// Indexes for efficient querying
purchaseOrderSchema.index({ poNumber: 1 });
purchaseOrderSchema.index({ supplierId: 1 });
purchaseOrderSchema.index({ status: 1 });
purchaseOrderSchema.index({ createdAt: -1 });
purchaseOrderSchema.index({ expectedDeliveryDate: 1 });

module.exports = mongoose.model("PurchaseOrder", purchaseOrderSchema);
