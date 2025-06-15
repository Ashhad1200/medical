const Medicine = require("../models/Medicine");

// Get all medicines with enhanced filtering and pagination
const getAllMedicines = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      sortBy = "name",
      sortOrder = "asc",
      status = "all",
      lowStock = false,
      outOfStock = false,
      expired = false,
      expiringSoon = false,
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    let query = {};
    let sort = {};

    // Search functionality
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { name: searchRegex },
        { manufacturer: searchRegex },
        { genericName: searchRegex },
        { batchNumber: searchRegex },
      ];
    }

    // Status-based filtering
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    if (status === "lowStock" || lowStock === "true") {
      query.$and = [
        { quantity: { $gt: 0 } },
        { $expr: { $lte: ["$quantity", "$lowStockThreshold"] } },
      ];
    } else if (status === "outOfStock" || outOfStock === "true") {
      query.quantity = 0;
    } else if (status === "expired" || expired === "true") {
      query.expiryDate = { $lt: currentDate };
    } else if (status === "expiringSoon" || expiringSoon === "true") {
      query.expiryDate = {
        $gte: currentDate,
        $lte: thirtyDaysFromNow,
      };
    } else if (status === "inStock") {
      query.quantity = { $gt: 0 };
    }

    // Sorting
    const sortDirection = sortOrder === "desc" ? -1 : 1;
    switch (sortBy) {
      case "name":
        sort.name = sortDirection;
        break;
      case "quantity":
        sort.quantity = sortDirection;
        break;
      case "price":
        sort.sellingPrice = sortDirection;
        break;
      case "expiryDate":
        sort.expiryDate = sortDirection;
        break;
      case "manufacturer":
        sort.manufacturer = sortDirection;
        break;
      case "createdAt":
        sort.createdAt = sortDirection;
        break;
      default:
        sort.name = 1;
    }

    // Execute queries
    const [medicines, totalCount] = await Promise.all([
      Medicine.find(query).limit(parseInt(limit)).skip(skip).sort(sort).lean(),
      Medicine.countDocuments(query),
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    res.json({
      success: true,
      data: {
        medicines,
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
          lowStock,
          outOfStock,
          expired,
          expiringSoon,
        },
      },
    });
  } catch (error) {
    console.error("Get medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medicines",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(currentDate.getDate() + 30);

    const [
      totalMedicines,
      totalValue,
      lowStockCount,
      outOfStockCount,
      expiredCount,
      expiringSoonCount,
      inStockCount,
    ] = await Promise.all([
      Medicine.countDocuments(),
      Medicine.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: { $multiply: ["$quantity", "$sellingPrice"] } },
          },
        },
      ]),
      Medicine.countDocuments({
        $and: [
          { quantity: { $gt: 0 } },
          { $expr: { $lte: ["$quantity", "$lowStockThreshold"] } },
        ],
      }),
      Medicine.countDocuments({ quantity: 0 }),
      Medicine.countDocuments({ expiryDate: { $lt: currentDate } }),
      Medicine.countDocuments({
        expiryDate: {
          $gte: currentDate,
          $lte: thirtyDaysFromNow,
        },
      }),
      Medicine.countDocuments({ quantity: { $gt: 0 } }),
    ]);

    // Get top medicines by value
    const topMedicinesByValue = await Medicine.find({ quantity: { $gt: 0 } })
      .sort({ sellingPrice: -1 })
      .limit(5)
      .select("name sellingPrice quantity manufacturer")
      .lean();

    // Get medicines by manufacturer
    const medicinesByManufacturer = await Medicine.aggregate([
      { $match: { quantity: { $gt: 0 } } },
      { $group: { _id: "$manufacturer", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalMedicines,
          totalValue: totalValue[0]?.total || 0,
          inStockCount,
          lowStockCount,
          outOfStockCount,
          expiredCount,
          expiringSoonCount,
        },
        topMedicinesByValue,
        medicinesByManufacturer: medicinesByManufacturer.map((item) => ({
          manufacturer: item._id,
          count: item.count,
        })),
      },
    });
  } catch (error) {
    console.error("Get inventory stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching inventory statistics",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get single medicine
const getMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const medicine = await Medicine.findById(id).lean();

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      data: { medicine },
    });
  } catch (error) {
    console.error("Get medicine error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medicine",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Create medicine with enhanced validation
const createMedicine = async (req, res) => {
  try {
    const medicineData = req.body;

    // Additional validation for required fields
    const requiredFields = ["name", "manufacturer", "sellingPrice", "quantity"];
    const missingFields = requiredFields.filter(
      (field) => !medicineData[field]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        errors: missingFields.map((field) => `${field} is required`),
      });
    }

    // Check for duplicate medicine name and manufacturer combination
    const existingMedicine = await Medicine.findOne({
      name: new RegExp(`^${medicineData.name}$`, "i"),
      manufacturer: new RegExp(`^${medicineData.manufacturer}$`, "i"),
    });

    if (existingMedicine) {
      return res.status(400).json({
        success: false,
        message: "Medicine with this name and manufacturer already exists",
      });
    }

    const medicine = new Medicine(medicineData);
    await medicine.save();

    res.status(201).json({
      success: true,
      message: "Medicine created successfully",
      data: { medicine },
    });
  } catch (error) {
    console.error("Create medicine error:", error);

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
      message: "Error creating medicine",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Update medicine with enhanced validation
const updateMedicine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Check if medicine exists
    const existingMedicine = await Medicine.findById(id);
    if (!existingMedicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    // Check for duplicate name and manufacturer (excluding current medicine)
    if (updateData.name || updateData.manufacturer) {
      const duplicateQuery = {
        _id: { $ne: id },
        name: new RegExp(`^${updateData.name || existingMedicine.name}$`, "i"),
        manufacturer: new RegExp(
          `^${updateData.manufacturer || existingMedicine.manufacturer}$`,
          "i"
        ),
      };

      const duplicateMedicine = await Medicine.findOne(duplicateQuery);
      if (duplicateMedicine) {
        return res.status(400).json({
          success: false,
          message:
            "Another medicine with this name and manufacturer already exists",
        });
      }
    }

    const medicine = await Medicine.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: "Medicine updated successfully",
      data: { medicine },
    });
  } catch (error) {
    console.error("Update medicine error:", error);

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
      message: "Error updating medicine",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Delete medicine with safety checks
const deleteMedicine = async (req, res) => {
  try {
    const { id } = req.params;

    const medicine = await Medicine.findByIdAndDelete(id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Medicine deleted successfully",
      data: { deletedMedicine: { id: medicine._id, name: medicine.name } },
    });
  } catch (error) {
    console.error("Delete medicine error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting medicine",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Search medicines for autocomplete
const searchMedicines = async (req, res) => {
  try {
    const { q, limit = 10, inStockOnly = true } = req.query;

    console.log("Search request:", { q, limit, inStockOnly });

    if (!q || q.trim().length < 2) {
      return res.json({
        success: true,
        data: { medicines: [] },
      });
    }

    let query = {};
    if (inStockOnly === "true") {
      query.quantity = { $gt: 0 };
    }

    const searchRegex = new RegExp(q.trim(), "i");
    query.$or = [
      { name: searchRegex },
      { manufacturer: searchRegex },
      { genericName: searchRegex },
    ];

    const medicines = await Medicine.find(query)
      .select(
        "name manufacturer genericName sellingPrice quantity lowStockThreshold"
      )
      .limit(parseInt(limit))
      .sort({ name: 1 })
      .lean();

    console.log(`Found ${medicines.length} medicines`);

    res.json({
      success: true,
      data: { medicines },
    });
  } catch (error) {
    console.error("Search medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching medicines",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get low stock medicines
const getLowStockMedicines = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const medicines = await Medicine.find({
      $and: [
        { quantity: { $gt: 0 } },
        { $expr: { $lte: ["$quantity", "$lowStockThreshold"] } },
      ],
    })
      .limit(parseInt(limit))
      .sort({ quantity: 1 })
      .lean();

    res.json({
      success: true,
      data: { medicines, count: medicines.length },
    });
  } catch (error) {
    console.error("Get low stock medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low stock medicines",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get expired medicines
const getExpiredMedicines = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const currentDate = new Date();

    const medicines = await Medicine.find({
      expiryDate: { $lt: currentDate },
    })
      .limit(parseInt(limit))
      .sort({ expiryDate: 1 })
      .lean();

    res.json({
      success: true,
      data: { medicines, count: medicines.length },
    });
  } catch (error) {
    console.error("Get expired medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expired medicines",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Get expiring soon medicines
const getExpiringSoonMedicines = async (req, res) => {
  try {
    const { limit = 50, days = 30 } = req.query;
    const currentDate = new Date();
    const futureDate = new Date();
    futureDate.setDate(currentDate.getDate() + parseInt(days));

    const medicines = await Medicine.find({
      expiryDate: {
        $gte: currentDate,
        $lte: futureDate,
      },
    })
      .limit(parseInt(limit))
      .sort({ expiryDate: 1 })
      .lean();

    res.json({
      success: true,
      data: { medicines, count: medicines.length },
    });
  } catch (error) {
    console.error("Get expiring soon medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expiring soon medicines",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Update stock only
const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation = "set" } = req.body;

    if (typeof quantity !== "number" || quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid quantity value",
      });
    }

    const medicine = await Medicine.findById(id);
    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    let newQuantity;
    switch (operation) {
      case "add":
        newQuantity = medicine.quantity + quantity;
        break;
      case "subtract":
        newQuantity = Math.max(0, medicine.quantity - quantity);
        break;
      case "set":
      default:
        newQuantity = quantity;
        break;
    }

    medicine.quantity = newQuantity;
    await medicine.save();

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: {
        medicine: {
          id: medicine._id,
          name: medicine.name,
          quantity: medicine.quantity,
          lowStockThreshold: medicine.lowStockThreshold,
        },
      },
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating stock",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Bulk import medicines
const bulkImport = async (req, res) => {
  try {
    // This would handle CSV/Excel file upload and processing
    // For now, return a placeholder response
    res.json({
      success: true,
      message: "Bulk import functionality not yet implemented",
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({
      success: false,
      message: "Error importing medicines",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

// Export inventory
const exportInventory = async (req, res) => {
  try {
    // This would handle inventory export to CSV/Excel
    // For now, return a placeholder response
    res.json({
      success: true,
      message: "Export functionality not yet implemented",
    });
  } catch (error) {
    console.error("Export inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting inventory",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
};

module.exports = {
  getAllMedicines,
  getInventoryStats,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getLowStockMedicines,
  getExpiredMedicines,
  getExpiringSoonMedicines,
  updateStock,
  bulkImport,
  exportInventory,
};
