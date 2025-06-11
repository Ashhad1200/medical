const Medicine = require("../models/Medicine");
const { AppError, NotFoundError, ValidationError } = require("../utils/errors");
const {
  buildSearchQuery,
  buildSortQuery,
  buildPaginationOptions,
} = require("../utils/queryHelpers");

class MedicineService {
  /**
   * Search medicines with advanced filtering
   * @param {Object} searchParams - Search parameters
   * @returns {Object} Search results with pagination
   */
  async searchMedicines(searchParams) {
    try {
      const {
        query = "",
        category = "",
        manufacturer = "",
        minPrice = 0,
        maxPrice = Number.MAX_VALUE,
        inStock = true,
        includeExpired = false,
        sortBy = "name",
        sortOrder = "asc",
        page = 1,
        limit = 20,
      } = searchParams;

      // Build search query
      const searchQuery = {
        isActive: true,
        ...(inStock && { quantity: { $gt: 0 } }),
        ...(category && { category: new RegExp(category, "i") }),
        ...(manufacturer && { manufacturer: new RegExp(manufacturer, "i") }),
        retailPrice: { $gte: minPrice, $lte: maxPrice },
      };

      // Add text search if query provided
      if (query.trim()) {
        searchQuery.$or = [
          { name: new RegExp(query, "i") },
          { manufacturer: new RegExp(query, "i") },
          { description: new RegExp(query, "i") },
          { batchNumber: new RegExp(query, "i") },
        ];
      }

      // Handle expired medicines
      if (!includeExpired) {
        searchQuery.expiryDate = { $gt: new Date() };
      }

      // Build sort options
      const sortOptions = {};
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

      // Calculate pagination
      const skip = (page - 1) * limit;

      // Execute search with pagination
      const [medicines, totalCount] = await Promise.all([
        Medicine.find(searchQuery)
          .sort(sortOptions)
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Medicine.countDocuments(searchQuery),
      ]);

      // Add computed fields
      const enhancedMedicines = medicines.map((medicine) => ({
        ...medicine,
        isExpired: new Date(medicine.expiryDate) <= new Date(),
        isLowStock: medicine.quantity <= (medicine.minStockLevel || 10),
        profitMargin: (
          ((medicine.retailPrice - medicine.tradePrice) / medicine.tradePrice) *
          100
        ).toFixed(2),
        totalValue: (medicine.quantity * medicine.tradePrice).toFixed(2),
      }));

      return {
        medicines: enhancedMedicines,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / limit),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      throw new AppError("Medicine search failed", 500);
    }
  }

  /**
   * Get medicine by ID with detailed information
   * @param {string} medicineId - Medicine ID
   * @returns {Object} Medicine details
   */
  async getMedicineById(medicineId) {
    try {
      const medicine = await Medicine.findById(medicineId).lean();

      if (!medicine) {
        throw new NotFoundError("Medicine not found");
      }

      // Add computed fields
      const enhancedMedicine = {
        ...medicine,
        isExpired: new Date(medicine.expiryDate) <= new Date(),
        isLowStock: medicine.quantity <= (medicine.minStockLevel || 10),
        profitMargin: (
          ((medicine.retailPrice - medicine.tradePrice) / medicine.tradePrice) *
          100
        ).toFixed(2),
        totalValue: (medicine.quantity * medicine.tradePrice).toFixed(2),
        daysUntilExpiry: Math.ceil(
          (new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        ),
      };

      return enhancedMedicine;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to get medicine details", 500);
    }
  }

  /**
   * Create new medicine
   * @param {Object} medicineData - Medicine data
   * @returns {Object} Created medicine
   */
  async createMedicine(medicineData) {
    try {
      // Validate required fields
      const requiredFields = [
        "name",
        "retailPrice",
        "tradePrice",
        "quantity",
        "expiryDate",
        "manufacturer",
      ];
      const missingFields = requiredFields.filter(
        (field) => !medicineData[field]
      );

      if (missingFields.length > 0) {
        throw new ValidationError(
          `Missing required fields: ${missingFields.join(", ")}`
        );
      }

      // Check for duplicate medicine
      const existingMedicine = await Medicine.findOne({
        name: new RegExp(`^${medicineData.name}$`, "i"),
        manufacturer: new RegExp(`^${medicineData.manufacturer}$`, "i"),
        isActive: true,
      });

      if (existingMedicine) {
        throw new AppError(
          "Medicine with this name and manufacturer already exists",
          409
        );
      }

      // Validate business rules
      if (medicineData.retailPrice <= medicineData.tradePrice) {
        throw new ValidationError(
          "Retail price must be greater than trade price"
        );
      }

      if (new Date(medicineData.expiryDate) <= new Date()) {
        throw new ValidationError("Expiry date must be in the future");
      }

      // Calculate GST if not provided
      if (!medicineData.gstPerUnit) {
        medicineData.gstPerUnit = (medicineData.retailPrice * 0.15).toFixed(2); // 15% GST
      }

      const medicine = new Medicine(medicineData);
      await medicine.save();

      return await this.getMedicineById(medicine._id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to create medicine", 500);
    }
  }

  /**
   * Update medicine
   * @param {string} medicineId - Medicine ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated medicine
   */
  async updateMedicine(medicineId, updateData) {
    try {
      const medicine = await Medicine.findById(medicineId);

      if (!medicine) {
        throw new NotFoundError("Medicine not found");
      }

      // Validate business rules if prices are being updated
      if (updateData.retailPrice || updateData.tradePrice) {
        const retailPrice = updateData.retailPrice || medicine.retailPrice;
        const tradePrice = updateData.tradePrice || medicine.tradePrice;

        if (retailPrice <= tradePrice) {
          throw new ValidationError(
            "Retail price must be greater than trade price"
          );
        }
      }

      // Validate expiry date
      if (
        updateData.expiryDate &&
        new Date(updateData.expiryDate) <= new Date()
      ) {
        throw new ValidationError("Expiry date must be in the future");
      }

      // Update GST if retail price changes
      if (updateData.retailPrice && !updateData.gstPerUnit) {
        updateData.gstPerUnit = (updateData.retailPrice * 0.15).toFixed(2);
      }

      const updatedMedicine = await Medicine.findByIdAndUpdate(
        medicineId,
        { ...updateData, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      return await this.getMedicineById(updatedMedicine._id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update medicine", 500);
    }
  }

  /**
   * Update medicine stock
   * @param {string} medicineId - Medicine ID
   * @param {number} quantityChange - Quantity change (positive for addition, negative for reduction)
   * @param {string} reason - Reason for stock change
   * @returns {Object} Updated medicine
   */
  async updateStock(medicineId, quantityChange, reason = "Manual adjustment") {
    try {
      const medicine = await Medicine.findById(medicineId);

      if (!medicine) {
        throw new NotFoundError("Medicine not found");
      }

      const newQuantity = medicine.quantity + quantityChange;

      if (newQuantity < 0) {
        throw new ValidationError("Insufficient stock quantity");
      }

      medicine.quantity = newQuantity;
      medicine.updatedAt = new Date();

      // Add to stock history
      if (!medicine.stockHistory) {
        medicine.stockHistory = [];
      }

      medicine.stockHistory.push({
        date: new Date(),
        quantityChange,
        previousQuantity: medicine.quantity - quantityChange,
        newQuantity: medicine.quantity,
        reason,
      });

      await medicine.save();

      return await this.getMedicineById(medicine._id);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to update stock", 500);
    }
  }

  /**
   * Get low stock medicines
   * @param {number} threshold - Stock threshold
   * @returns {Array} Low stock medicines
   */
  async getLowStockMedicines(threshold = 10) {
    try {
      const lowStockMedicines = await Medicine.find({
        isActive: true,
        $expr: {
          $lte: ["$quantity", { $ifNull: ["$minStockLevel", threshold] }],
        },
      })
        .sort({ quantity: 1 })
        .lean();

      return lowStockMedicines.map((medicine) => ({
        ...medicine,
        isExpired: new Date(medicine.expiryDate) <= new Date(),
        daysUntilExpiry: Math.ceil(
          (new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        ),
      }));
    } catch (error) {
      throw new AppError("Failed to get low stock medicines", 500);
    }
  }

  /**
   * Get expiring medicines
   * @param {number} days - Days until expiry
   * @returns {Array} Expiring medicines
   */
  async getExpiringMedicines(days = 30) {
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);

      const expiringMedicines = await Medicine.find({
        isActive: true,
        expiryDate: { $lte: expiryDate, $gt: new Date() },
      })
        .sort({ expiryDate: 1 })
        .lean();

      return expiringMedicines.map((medicine) => ({
        ...medicine,
        daysUntilExpiry: Math.ceil(
          (new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
        ),
      }));
    } catch (error) {
      throw new AppError("Failed to get expiring medicines", 500);
    }
  }

  /**
   * Get inventory summary
   * @returns {Object} Inventory statistics
   */
  async getInventorySummary() {
    try {
      const [
        totalMedicines,
        activeMedicines,
        expiredMedicines,
        lowStockMedicines,
        totalValue,
        categories,
      ] = await Promise.all([
        Medicine.countDocuments(),
        Medicine.countDocuments({ isActive: true }),
        Medicine.countDocuments({
          isActive: true,
          expiryDate: { $lte: new Date() },
        }),
        Medicine.countDocuments({
          isActive: true,
          $expr: { $lte: ["$quantity", { $ifNull: ["$minStockLevel", 10] }] },
        }),
        Medicine.aggregate([
          { $match: { isActive: true } },
          {
            $group: {
              _id: null,
              totalValue: { $sum: { $multiply: ["$quantity", "$tradePrice"] } },
            },
          },
        ]),
        Medicine.distinct("category", { isActive: true }),
      ]);

      return {
        totalMedicines,
        activeMedicines,
        expiredMedicines,
        lowStockMedicines,
        totalValue: totalValue[0]?.totalValue || 0,
        categoriesCount: categories.length,
        categories,
      };
    } catch (error) {
      throw new AppError("Failed to get inventory summary", 500);
    }
  }

  /**
   * Soft delete medicine
   * @param {string} medicineId - Medicine ID
   * @returns {boolean} Deletion status
   */
  async deleteMedicine(medicineId) {
    try {
      const medicine = await Medicine.findById(medicineId);

      if (!medicine) {
        throw new NotFoundError("Medicine not found");
      }

      medicine.isActive = false;
      medicine.updatedAt = new Date();
      await medicine.save();

      return true;
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError("Failed to delete medicine", 500);
    }
  }
}

module.exports = new MedicineService();
