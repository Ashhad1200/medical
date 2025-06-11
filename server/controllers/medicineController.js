const Medicine = require("../models/Medicine");

// Get all medicines
const getAllMedicines = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, term } = req.query;
    const skip = (page - 1) * limit;

    let query = {};

    // Enhanced search functionality using 'term' for general search
    const searchQuery = term || search;
    if (searchQuery) {
      const searchRegex = new RegExp(searchQuery, "i"); // Case-insensitive search
      query = {
        $or: [
          { name: searchRegex },
          { manufacturer: searchRegex },
          { category: searchRegex },
        ],
      };
    }

    if (category && !term) {
      // If specific category filter is provided and not overridden by general term search
      query.category = new RegExp(category, "i");
    }

    const totalCount = await Medicine.countDocuments(query);
    const medicines = await Medicine.find(query)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        medicines,
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
    console.error("Get medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching medicines",
      error: error.message,
    });
  }
};

// Get single medicine
const getMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);

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
    });
  }
};

// Create medicine
const createMedicine = async (req, res) => {
  try {
    const medicine = new Medicine(req.body);
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
    });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

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
    });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findByIdAndDelete(req.params.id);

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Medicine deleted successfully",
    });
  } catch (error) {
    console.error("Delete medicine error:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting medicine",
    });
  }
};

// Search medicines (for autocomplete/search functionality)
const searchMedicines = async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    console.log("Search request:", { q, limit }); // Debug log

    if (!q) {
      return res.json({
        success: true,
        data: { medicines: [] },
      });
    }

    // Direct search instead of using static method to debug
    const searchRegex = new RegExp(q, "i");
    const medicines = await Medicine.find({
      $or: [
        { name: searchRegex },
        { manufacturer: searchRegex },
        { category: searchRegex },
      ],
      quantity: { $gt: 0 },
    }).limit(parseInt(limit));

    console.log("Search results:", medicines.length); // Debug log

    res.json({
      success: true,
      data: { medicines },
    });
  } catch (error) {
    console.error("Search medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error searching medicines",
      error: error.message,
    });
  }
};

// Get low stock medicines
const getLowStockMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findLowStock();

    res.json({
      success: true,
      data: { medicines },
    });
  } catch (error) {
    console.error("Get low stock medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching low stock medicines",
    });
  }
};

// Get expired medicines
const getExpiredMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.findExpired();

    res.json({
      success: true,
      data: { medicines },
    });
  } catch (error) {
    console.error("Get expired medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expired medicines",
    });
  }
};

// Get medicines expiring soon
const getExpiringSoonMedicines = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const medicines = await Medicine.findExpiringSoon(parseInt(days));

    res.json({
      success: true,
      data: { medicines },
    });
  } catch (error) {
    console.error("Get expiring soon medicines error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching expiring soon medicines",
    });
  }
};

// Update stock only
const updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    const medicine = await Medicine.findByIdAndUpdate(
      req.params.id,
      { quantity: parseInt(quantity) },
      { new: true, runValidators: true }
    );

    if (!medicine) {
      return res.status(404).json({
        success: false,
        message: "Medicine not found",
      });
    }

    res.json({
      success: true,
      message: "Stock updated successfully",
      data: { medicine },
    });
  } catch (error) {
    console.error("Update stock error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating stock",
    });
  }
};

// Bulk import medicines
const bulkImport = async (req, res) => {
  try {
    // This would typically handle file upload and parsing
    // For now, we'll return a placeholder response
    res.json({
      success: true,
      message: "Bulk import functionality not implemented yet",
      data: { imported: 0 },
    });
  } catch (error) {
    console.error("Bulk import error:", error);
    res.status(500).json({
      success: false,
      message: "Error importing medicines",
    });
  }
};

// Export inventory
const exportInventory = async (req, res) => {
  try {
    const medicines = await Medicine.find({ isActive: true }).sort({ name: 1 });

    // Create CSV content
    const csvHeader =
      "Name,Manufacturer,Batch Number,Retail Price,Trade Price,GST Per Unit,Quantity,Expiry Date,Category,Description\n";
    const csvRows = medicines
      .map((medicine) => {
        return [
          medicine.name,
          medicine.manufacturer,
          medicine.batchNumber,
          medicine.retailPrice,
          medicine.tradePrice,
          medicine.gstPerUnit,
          medicine.quantity,
          medicine.expiryDate.toISOString().split("T")[0],
          medicine.category || "",
          medicine.description || "",
        ]
          .map((field) => `"${field}"`)
          .join(",");
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="inventory-export.csv"'
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Export inventory error:", error);
    res.status(500).json({
      success: false,
      message: "Error exporting inventory",
    });
  }
};

module.exports = {
  getAllMedicines,
  getMedicine,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  updateStock,
  bulkImport,
  exportInventory,
  searchMedicines,
  getLowStockMedicines,
  getExpiredMedicines,
  getExpiringSoonMedicines,
};
