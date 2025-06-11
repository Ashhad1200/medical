const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Medicine name is required"],
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
    },
    retailPrice: {
      type: Number,
      required: [true, "Retail price is required"],
      min: [0, "Retail price cannot be negative"],
    },
    tradePrice: {
      type: Number,
      required: [true, "Trade price is required"],
      min: [0, "Trade price cannot be negative"],
    },
    gstPerUnit: {
      type: Number,
      default: 0,
      min: [0, "GST cannot be negative"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [0, "Quantity cannot be negative"],
      index: true,
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
      index: true,
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
    reorderThreshold: {
      type: Number,
      required: true,
      default: 10,
      min: [0, "Reorder threshold cannot be negative"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for better query performance
medicineSchema.index({ name: 1, manufacturer: 1 });
medicineSchema.index({ category: 1 });
medicineSchema.index({ expiryDate: 1 });
medicineSchema.index({ quantity: 1 });

// Virtual for checking if medicine is low stock
medicineSchema.virtual("isLowStock").get(function () {
  return this.quantity <= this.reorderThreshold;
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

// Static method to find medicines by search term
medicineSchema.statics.searchMedicines = function (searchTerm, limit = 10) {
  const searchRegex = new RegExp(searchTerm, "i");
  return this.find({
    $or: [
      { name: searchRegex },
      { manufacturer: searchRegex },
      { category: searchRegex },
    ],
    quantity: { $gt: 0 },
  }).limit(limit);
};

// Static method to find low stock medicines
medicineSchema.statics.findLowStock = function () {
  return this.find({
    $expr: { $lte: ["$quantity", "$reorderThreshold"] },
  });
};

// Static method to find expired medicines
medicineSchema.statics.findExpired = function () {
  return this.find({
    expiryDate: { $lt: new Date() },
  });
};

// Static method to find medicines expiring soon
medicineSchema.statics.findExpiringSoon = function (days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  return this.find({
    expiryDate: {
      $gte: new Date(),
      $lte: futureDate,
    },
  });
};

// Method to update quantity
medicineSchema.methods.updateQuantity = function (newQuantity) {
  this.quantity = newQuantity;
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

module.exports = mongoose.model("Medicine", medicineSchema);
