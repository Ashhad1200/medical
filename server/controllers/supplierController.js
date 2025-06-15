const Supplier = require("../models/Supplier");
const PurchaseOrder = require("../models/PurchaseOrder");
const User = require("../models/User");

// Get all suppliers with enhanced filtering and pagination
const getAllSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 12,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
      status = "all",
      city = "",
      state = "",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = {};

    // Search functionality
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { contactPerson: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { "address.city": searchRegex },
        { "address.state": searchRegex },
        { gstNumber: searchRegex },
      ];
    }

    // Status filtering
    if (status === "active") {
      query.isActive = true;
    } else if (status === "inactive") {
      query.isActive = false;
    }

    // Location filtering
    if (city.trim()) {
      query["address.city"] = new RegExp(city.trim(), "i");
    }
    if (state.trim()) {
      query["address.state"] = new RegExp(state.trim(), "i");
    }

    // Sorting
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    switch (sortBy) {
      case "name":
        sort.name = sortDirection;
        break;
      case "city":
        sort["address.city"] = sortDirection;
        break;
      case "totalOrders":
        sort.totalOrders = sortDirection;
        break;
      case "lastOrderDate":
        sort.lastOrderDate = sortDirection;
        break;
      case "createdAt":
        sort.createdAt = sortDirection;
        break;
      default:
        sort.name = 1;
    }

    // Execute queries
    const [suppliers, totalCount] = await Promise.all([
      Supplier.find(query)
        .limit(parseInt(limit))
        .skip(skip)
        .sort(sort)
        .populate("createdBy", "username fullName")
        .lean(),
      Supplier.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        suppliers,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNextPage,
          hasPrevPage,
        },
        filters: {
          search,
          sortBy,
          sortOrder,
          status,
          city,
          state,
        },
      },
    });
  } catch (error) {
    console.error("Get suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get single supplier with detailed information
const getSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id)
      .populate("createdBy", "username fullName")
      .lean();

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Get recent purchase orders for this supplier
    const recentOrders = await PurchaseOrder.find({ supplier: id })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("orderNumber totalAmount status createdAt")
      .lean();

    res.json({
      success: true,
      data: {
        supplier: {
          ...supplier,
          recentOrders,
        },
      },
    });
  } catch (error) {
    console.error("Get supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching supplier",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Create supplier with enhanced validation
const createSupplier = async (req, res) => {
  try {
    const supplierData = {
      ...req.body,
      createdBy: req.user.id,
    };

    // Additional validation for required fields
    const requiredFields = ["name", "contactPerson", "email", "phone"];
    const missingFields = requiredFields.filter(
      (field) => !supplierData[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        errors: missingFields.map((field) => `${field} is required`),
      });
    }

    // Check for duplicate email or name
    const existingSupplier = await Supplier.findOne({
      $or: [
        { email: supplierData.email.toLowerCase() },
        { name: new RegExp(`^${supplierData.name}$`, "i") },
      ],
    });

    if (existingSupplier) {
      return res.status(400).json({
        success: false,
        message:
          existingSupplier.email === supplierData.email.toLowerCase()
            ? "Supplier with this email already exists"
            : "Supplier with this name already exists",
      });
    }

    const supplier = new Supplier(supplierData);
    await supplier.save();

    // Populate the created supplier
    await supplier.populate("createdBy", "username fullName");

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
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `Supplier with this ${field} already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating supplier",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Update supplier with enhanced validation
const updateSupplier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if supplier exists
    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Check for duplicate email or name (excluding current supplier)
    if (updateData.email || updateData.name) {
      const duplicateQuery = {
        _id: { $ne: id },
        $or: [],
      };

      if (updateData.email) {
        duplicateQuery.$or.push({ email: updateData.email.toLowerCase() });
      }
      if (updateData.name) {
        duplicateQuery.$or.push({
          name: new RegExp(`^${updateData.name}$`, "i"),
        });
      }

      const duplicateSupplier = await Supplier.findOne(duplicateQuery);
      if (duplicateSupplier) {
        return res.status(400).json({
          success: false,
          message:
            duplicateSupplier.email === updateData.email?.toLowerCase()
              ? "Another supplier with this email already exists"
              : "Another supplier with this name already exists",
        });
      }
    }

    const supplier = await Supplier.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("createdBy", "username fullName");

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
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Delete supplier with safety checks
const deleteSupplier = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier has any purchase orders
    const orderCount = await PurchaseOrder.countDocuments({ supplier: id });
    if (orderCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete supplier. ${orderCount} purchase order(s) are associated with this supplier.`,
      });
    }

    const supplier = await Supplier.findByIdAndDelete(id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      message: "Supplier deleted successfully",
      data: { deletedSupplier: { id: supplier._id, name: supplier.name } },
    });
  } catch (error) {
    console.error("Delete supplier error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting supplier",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Toggle supplier active status
const toggleSupplierStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const supplier = await Supplier.findById(id);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    supplier.isActive = !supplier.isActive;
    await supplier.save();

    res.json({
      success: true,
      message: `Supplier ${
        supplier.isActive ? "activated" : "deactivated"
      } successfully`,
      data: {
        supplier: {
          id: supplier._id,
          name: supplier.name,
          isActive: supplier.isActive,
        },
      },
    });
  } catch (error) {
    console.error("Toggle supplier status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating supplier status",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get supplier statistics
const getSupplierStats = async (req, res) => {
  try {
    const [
      totalSuppliers,
      activeSuppliers,
      inactiveSuppliers,
      suppliersWithOrders,
    ] = await Promise.all([
      Supplier.countDocuments(),
      Supplier.countDocuments({ isActive: true }),
      Supplier.countDocuments({ isActive: false }),
      Supplier.countDocuments({ totalOrders: { $gt: 0 } }),
    ]);

    // Get top suppliers by order count
    const topSuppliers = await Supplier.find({ totalOrders: { $gt: 0 } })
      .sort({ totalOrders: -1 })
      .limit(5)
      .select("name totalOrders lastOrderDate")
      .lean();

    // Get suppliers by city
    const suppliersByCity = await Supplier.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: "$address.city", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalSuppliers,
          activeSuppliers,
          inactiveSuppliers,
          suppliersWithOrders,
        },
        topSuppliers,
        suppliersByCity: suppliersByCity.map((item) => ({
          city: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Get supplier stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching supplier statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Search suppliers for autocomplete
const searchSuppliers = async (req, res) => {
  try {
    const { q, limit = 10, activeOnly = true } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: { suppliers: [] },
      });
    }

    let query = {};
    if (activeOnly === "true") {
      query.isActive = true;
    }

    const searchRegex = new RegExp(q.trim(), "i");
    query.$or = [
      { name: searchRegex },
      { contactPerson: searchRegex },
      { email: searchRegex },
    ];

    const suppliers = await Supplier.find(query)
      .select("name contactPerson email phone address.city isActive")
      .limit(parseInt(limit))
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: { suppliers },
    });
  } catch (error) {
    console.error("Search suppliers error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching suppliers",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get suppliers by city
const getSuppliersByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const { activeOnly = true } = req.query;

    let query = {
      "address.city": new RegExp(city, "i"),
    };

    if (activeOnly === "true") {
      query.isActive = true;
    }

    const suppliers = await Supplier.find(query)
      .select("name contactPerson email phone address isActive")
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: { suppliers, city },
    });
  } catch (error) {
    console.error("Get suppliers by city error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching suppliers by city",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
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
  getSupplierStats,
  searchSuppliers,
  getSuppliersByCity,
};
