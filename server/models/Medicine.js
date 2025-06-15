const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
      trim: true,
      index: true,
    },
    genericName: {
      type: String,
      trim: true,
      index: true,
    },
    manufacturer: {
      type: String,
      required: [true, "Manufacturer is required"],
      trim: true,
      index: true,
    },
    batchNumber: {
      type: String,
      trim: true,
      index: true,
    },
    sellingPrice: {
      type: Number,
      required: [true, "Selling price is required"],
      min: [0, "Selling price cannot be negative"],
    },
    costPrice: {
      type: Number,
      required: [true, "Cost price is required"],
      min: [0, "Cost price cannot be negative"],
    },
    // Legacy fields for backward compatibility
    retailPrice: {
      type: Number,
      min: [0, "Retail price cannot be negative"],
    },
    tradePrice: {
      type: Number,
      min: [0, "Trade price cannot be negative"],
    },
    gstPerUnit: {
      type: Number,
      default: 0,
      min: [0, "GST cannot be negative"],
    },
    gstRate: {
      type: Number,
      default: 0,
      min: [0, "GST rate cannot be negative"],
      max: [100, "GST rate cannot exceed 100%"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      index: true,
    },
    unit: {
      type: String,
      default: "pieces",
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      index: true,
    },
    manufacturingDate: {
      type: Date,
    },
    category: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      default: 10,
      min: [0, "Low stock threshold cannot be negative"],
    },
    // Legacy field for backward compatibility
    reorderThreshold: {
      type: Number,
      min: [0, "Reorder threshold cannot be negative"],
    },
    location: {
      type: String,
      trim: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound indexes for better query performance
medicineSchema.index({ name: 1, manufacturer: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ quantity: 1 });
medicineSchema.index({ isActive: 1 });
medicineSchema.index({ createdAt: -1 });

// Virtual for checking if medicine is low stock
medicineSchema.virtual("isLowStock").get(function () {
  const threshold = this.lowStockThreshold || this.reorderThreshold || 10;
  return this.quantity > 0 && this.quantity <= threshold;
});

// Virtual for checking if medicine is out of stock
medicineSchema.virtual("isOutOfStock").get(function () {
  return this.quantity === 0;
});

// Virtual for checking if medicine is expired
medicineSchema.virtual("isExpired").get(function () {
  return this.expiryDate < new Date();
});

// Virtual for checking if medicine is expiring soon (within 30 days)
medicineSchema.virtual("isExpiringSoon").get(function () {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  return this.expiryDate <= thirtyDaysFromNow && this.expiryDate > new Date();
});

// Virtual for stock status
medicineSchema.virtual("stockStatus").get(function () {
  if (this.quantity === 0) return "Out of Stock";
  if (this.isLowStock) return "Low Stock";
  if (this.isExpired) return "Expired";
  if (this.isExpiringSoon) return "Expiring Soon";
  return "In Stock";
});

// Virtual for profit margin
medicineSchema.virtual("profitMargin").get(function () {
  const cost = this.costPrice || this.tradePrice || 0;
  const selling = this.sellingPrice || this.retailPrice || 0;
  if (cost === 0) return 0;
  return Math.round(((selling - cost) / cost) * 100);
});

// Virtual for total value
medicineSchema.virtual("totalValue").get(function () {
  const price = this.sellingPrice || this.retailPrice || 0;
  return this.quantity * price;
});

// Static method to find medicines by search term
medicineSchema.statics.searchMedicines = function (searchTerm, limit = 10) {
  const searchRegex = new RegExp(searchTerm, "i");
  return this.find({
    $or: [
      { name: searchRegex },
      { genericName: searchRegex },
      { manufacturer: searchRegex },
      { category: searchRegex },
      { batchNumber: searchRegex },
    ],
    quantity: { $gt: 0 },
    isActive: true,
  }).limit(limit);
};

// Static method to find low stock medicines
medicineSchema.statics.findLowStock = function () {
  return this.find({
    $and: [
      { quantity: { $gt: 0 } },
      { $expr: { $lte: ["$quantity", "$lowStockThreshold"] } },
      { isActive: true },
    ],
  });
};

// Static method to find out of stock medicines
medicineSchema.statics.findOutOfStock = function () {
  return this.find({
    quantity: 0,
    isActive: true,
  });
};

// Static method to find expired medicines
medicineSchema.statics.findExpired = function () {
  return this.find({
    expiryDate: { $lt: new Date() },
    isActive: true,
  });
};

// Static method to find medicines expiring soon
medicineSchema.statics.findExpiringSoon = function (days = 30) {
  const currentDate = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    expiryDate: {
      $gte: currentDate,
      $lte: futureDate,
    },
    isActive: true,
  });
};

// Method to update quantity
medicineSchema.methods.updateQuantity = function (newQuantity) {
  this.quantity = Math.max(0, newQuantity);
  return this.save();
};

// Method to reduce quantity (for orders)
medicineSchema.methods.reduceQuantity = function (amount) {
  if (this.quantity < amount) {
    throw new Error("Insufficient stock");
  }
  this.quantity -= amount;
  return this.save();
};

// Method to add quantity (for restocking)
medicineSchema.methods.addQuantity = function (amount) {
  this.quantity += amount;
  return this.save();
};

// Pre-save middleware to sync legacy fields
medicineSchema.pre("save", function (next) {
  // Sync selling price with retail price for backward compatibility
  if (this.sellingPrice && !this.retailPrice) {
    this.retailPrice = this.sellingPrice;
  } else if (this.retailPrice && !this.sellingPrice) {
    this.sellingPrice = this.retailPrice;
  }

  // Sync cost price with trade price for backward compatibility
  if (this.costPrice && !this.tradePrice) {
    this.tradePrice = this.costPrice;
  } else if (this.tradePrice && !this.costPrice) {
    this.costPrice = this.tradePrice;
  }

  // Sync low stock threshold with reorder threshold
  if (this.lowStockThreshold && !this.reorderThreshold) {
    this.reorderThreshold = this.lowStockThreshold;
  } else if (this.reorderThreshold && !this.lowStockThreshold) {
    this.lowStockThreshold = this.reorderThreshold;
  }

  next();
});

module.exports = mongoose.model("Medicine", medicineSchema);
