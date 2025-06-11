const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const User = require("../models/User");

// Get all suppliers
const getAllSuppliers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, isActive } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query = {
        $or: [
          { name: searchRegex },
          { contactPerson: searchRegex },
          { email: searchRegex },
          { "address.city": searchRegex },
        ],
      };
    }

    if (isActive !== undefined) {
      query.isActive = isActive === "true";
    }

    const totalCount = await Supplier.countDocuments(query);
    const suppliers = await Supplier.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ name: 1 })
      .populate("createdBy", "username fullName");

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          hasNextPage: parseInt(page) * parseInt(limit) < totalCount,
          hasPrevPage: parseInt(page) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers",
      error: error.message,
    });
  }
};

// Get single supplier
const getSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id).populate(
      "createdBy",
      "username fullName"
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: { supplier },
    });
  } catch (error) {
    console.error("Get supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching supplier",
    });
  }
};

// Create supplier
const createSupplier = async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      createdBy: req.user.id,
    };

    const supplier = new Supplier(supplierData);
    await supplier.save();

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: { supplier },
    });
  } catch (error) {
    console.error("Create supplier error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Supplier with this name or email already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating supplier",
    });
  }
};

// Update supplier
const updateSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: { supplier },
    });
  } catch (error) {
    console.error("Update supplier error:", error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating supplier",
    });
  }
};

// Delete supplier
const deleteSupplier = async (req, res) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting supplier",
    });
  }
};

// Toggle supplier active status
const toggleSupplierStatus = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    await supplier.toggleActive();

    res.json({
      success: true,
      message: `Supplier ${
        supplier.isActive ? "activated" : "deactivated"
      } successfully`,
      data: { supplier },
    });
  } catch (error) {
    console.error("Toggle supplier status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating supplier status",
    });
  }
};

// Search suppliers
const searchSuppliers = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q) {
      return res.json({
        success: true,
        data: { suppliers: [] },
      });
    }

    const suppliers = await Supplier.searchSuppliers(q).limit(parseInt(limit));

    res.json({
      success: true,
      data: { suppliers },
    });
  } catch (error) {
    console.error("Search suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching suppliers",
    });
  }
};

// Get suppliers by city
const getSuppliersByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const suppliers = await Supplier.findByCity(city);

    res.json({
      success: true,
      data: { suppliers },
    });
  } catch (error) {
    console.error("Get suppliers by city error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers by city",
    });
  }
};

module.exports = {
  getAllSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  toggleSupplierStatus,
  searchSuppliers,
  getSuppliersByCity,
};
