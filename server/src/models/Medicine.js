const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      index: true,
    },
    retailPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    tradePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    gstPerUnit: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    batchNumber: {
      type: String,
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for checking if medicine is expired
medicineSchema.virtual("isExpired").get(function () {
  return this.expiryDate < new Date();
});

// Virtual for profit margin per unit
medicineSchema.virtual("profitMargin").get(function () {
  return this.retailPrice - this.tradePrice;
});

// Index for text search
medicineSchema.index({
  name: "text",
  manufacturer: "text",
  description: "text",
});

// Pre-save middleware to validate expiry date
medicineSchema.pre("save", function (next) {
  if (this.expiryDate <= new Date()) {
    next(new Error("Expiry date must be in the future"));
  }
  if (this.retailPrice < this.tradePrice) {
    next(new Error("Retail price cannot be less than trade price"));
  }
  next();
});

module.exports = mongoose.model("Medicine", medicineSchema);
