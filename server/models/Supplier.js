const mongoose = require("mongoose");

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
      unique: true,
      index: true,
    },
    contactPerson: {
      type: String,
      required: [true, "Contact person is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    address: {
      street: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
      },
      city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
      },
      state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [true, "Postal code is required"],
        trim: true,
      },
      country: {
        type: String,
        default: "India",
        trim: true,
      },
    },
    gstNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    panNumber: {
      type: String,
      trim: true,
      uppercase: true,
    },
    paymentTerms: {
      type: String,
      enum: ["immediate", "net_30", "net_60", "net_90"],
      default: "net_30",
    },
    creditLimit: {
      type: Number,
      default: 0,
      min: [0, "Credit limit cannot be negative"],
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1"],
      max: [5, "Rating cannot exceed 5"],
    },
    lastOrderDate: {
      type: Date,
    },
    totalOrders: {
      type: Number,
      default: 0,
      min: [0, "Total orders cannot be negative"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
supplierSchema.index({ name: 1 });
supplierSchema.index({ email: 1 });
supplierSchema.index({ isActive: 1 });
supplierSchema.index({ "address.city": 1 });
supplierSchema.index({ "address.state": 1 });

// Virtual for full address
supplierSchema.virtual("fullAddress").get(function () {
  const { street, city, state, postalCode, country } = this.address;
  return `${street}, ${city}, ${state} ${postalCode}, ${country}`;
});

// Virtual for available credit
supplierSchema.virtual("availableCredit").get(function () {
  return this.creditLimit - this.currentBalance;
});

// Virtual for credit utilization percentage
supplierSchema.virtual("creditUtilization").get(function () {
  if (this.creditLimit === 0) return 0;
  return Math.round((this.currentBalance / this.creditLimit) * 100);
});

// Static method to find active suppliers
supplierSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

// Static method to find suppliers by city
supplierSchema.statics.findByCity = function (city) {
  return this.find({
    "address.city": new RegExp(city, "i"),
    isActive: true,
  });
};

// Static method to find suppliers by state
supplierSchema.statics.findByState = function (state) {
  return this.find({
    "address.state": new RegExp(state, "i"),
    isActive: true,
  });
};

// Static method to search suppliers
supplierSchema.statics.searchSuppliers = function (searchTerm) {
  const searchRegex = new RegExp(searchTerm, "i");
  return this.find({
    $or: [
      { name: searchRegex },
      { contactPerson: searchRegex },
      { email: searchRegex },
      { "address.city": searchRegex },
    ],
    isActive: true,
  });
};

// Method to update balance
supplierSchema.methods.updateBalance = function (amount) {
  this.currentBalance += amount;
  return this.save();
};

// Method to record new order
supplierSchema.methods.recordOrder = function () {
  this.totalOrders += 1;
  this.lastOrderDate = new Date();
  return this.save();
};

// Method to check if supplier has available credit
supplierSchema.methods.hasAvailableCredit = function (amount) {
  return this.availableCredit >= amount;
};

// Method to activate/deactivate supplier
supplierSchema.methods.toggleActive = function () {
  this.isActive = !this.isActive;
  return this.save();
};

// Method to update rating
supplierSchema.methods.updateRating = function (newRating) {
  if (newRating >= 1 && newRating <= 5) {
    this.rating = newRating;
    return this.save();
  }
  throw new Error("Rating must be between 1 and 5");
};

module.exports = mongoose.model("Supplier", supplierSchema);
