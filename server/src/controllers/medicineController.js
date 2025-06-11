const medicineService = require("../services/medicineService");
const { asyncHandler } = require("../utils/errors");
const { sanitizeSearchParams } = require("../utils/queryHelpers");

/**
 * Search medicines with advanced filtering and pagination
 * @route GET /api/medicines/search
 * @access Public
 */
const searchMedicines = asyncHandler(async (req, res) => {
  const searchParams = sanitizeSearchParams(req.query);
  const result = await medicineService.searchMedicines(searchParams);

  res.json({
    success: true,
    message: "Medicines retrieved successfully",
    data: result.medicines,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});

/**
 * Get all medicines with pagination
 * @route GET /api/medicines
 * @access Private
 */
const getMedicines = asyncHandler(async (req, res) => {
  const searchParams = sanitizeSearchParams(req.query);
  const result = await medicineService.searchMedicines(searchParams);

  res.json({
    success: true,
    message: "Medicines retrieved successfully",
    data: result.medicines,
    pagination: result.pagination,
    requestId: req.requestId,
  });
});

/**
 * Get medicine by ID
 * @route GET /api/medicines/:id
 * @access Private
 */
const getMedicineById = asyncHandler(async (req, res) => {
  const medicine = await medicineService.getMedicineById(req.params.id);

  res.json({
    success: true,
    message: "Medicine retrieved successfully",
    data: medicine,
    requestId: req.requestId,
  });
});

/**
 * Create new medicine
 * @route POST /api/medicines
 * @access Private (Admin/Warehouse)
 */
const createMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.createMedicine(req.body);

  res.status(201).json({
    success: true,
    message: "Medicine created successfully",
    data: medicine,
    requestId: req.requestId,
  });
});

/**
 * Update medicine
 * @route PUT /api/medicines/:id
 * @access Private (Admin/Warehouse)
 */
const updateMedicine = asyncHandler(async (req, res) => {
  const medicine = await medicineService.updateMedicine(
    req.params.id,
    req.body
  );

  res.json({
    success: true,
    message: "Medicine updated successfully",
    data: medicine,
    requestId: req.requestId,
  });
});

/**
 * Update medicine stock
 * @route PATCH /api/medicines/:id/stock
 * @access Private (Admin/Warehouse)
 */
const updateMedicineStock = asyncHandler(async (req, res) => {
  const { quantityChange, reason } = req.body;
  const medicine = await medicineService.updateStock(
    req.params.id,
    quantityChange,
    reason
  );

  res.json({
    success: true,
    message: "Medicine stock updated successfully",
    data: medicine,
    requestId: req.requestId,
  });
});

/**
 * Get low stock medicines
 * @route GET /api/medicines/alerts/low-stock
 * @access Private (Admin/Warehouse)
 */
const getLowStockMedicines = asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 10;
  const medicines = await medicineService.getLowStockMedicines(threshold);

  res.json({
    success: true,
    message: "Low stock medicines retrieved successfully",
    data: medicines,
    count: medicines.length,
    requestId: req.requestId,
  });
});

/**
 * Get expiring medicines
 * @route GET /api/medicines/alerts/expiring
 * @access Private (Admin/Warehouse)
 */
const getExpiringMedicines = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days) || 30;
  const medicines = await medicineService.getExpiringMedicines(days);

  res.json({
    success: true,
    message: "Expiring medicines retrieved successfully",
    data: medicines,
    count: medicines.length,
    requestId: req.requestId,
  });
});

/**
 * Get inventory summary
 * @route GET /api/medicines/summary
 * @access Private (Admin/Warehouse)
 */
const getInventorySummary = asyncHandler(async (req, res) => {
  const summary = await medicineService.getInventorySummary();

  res.json({
    success: true,
    message: "Inventory summary retrieved successfully",
    data: summary,
    requestId: req.requestId,
  });
});

/**
 * Delete medicine (soft delete)
 * @route DELETE /api/medicines/:id
 * @access Private (Admin only)
 */
const deleteMedicine = asyncHandler(async (req, res) => {
  await medicineService.deleteMedicine(req.params.id);

  res.json({
    success: true,
    message: "Medicine deleted successfully",
    requestId: req.requestId,
  });
});

/**
 * Bulk import medicines
 * @route POST /api/medicines/bulk-import
 * @access Private (Admin/Warehouse)
 */
const bulkImportMedicines = asyncHandler(async (req, res) => {
  const { medicines } = req.body;

  if (!Array.isArray(medicines) || medicines.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please provide an array of medicines to import",
      requestId: req.requestId,
    });
  }

  const results = {
    created: [],
    updated: [],
    errors: [],
  };

  for (const medicineData of medicines) {
    try {
      const medicine = await medicineService.createMedicine(medicineData);
      results.created.push(medicine);
    } catch (error) {
      results.errors.push({
        data: medicineData,
        error: error.message,
      });
    }
  }

  res.json({
    success: true,
    message: "Bulk import completed",
    data: results,
    summary: {
      total: medicines.length,
      created: results.created.length,
      errors: results.errors.length,
    },
    requestId: req.requestId,
  });
});

/**
 * Get medicine categories
 * @route GET /api/medicines/categories
 * @access Private
 */
const getMedicineCategories = asyncHandler(async (req, res) => {
  const summary = await medicineService.getInventorySummary();

  res.json({
    success: true,
    message: "Medicine categories retrieved successfully",
    data: summary.categories,
    count: summary.categoriesCount,
    requestId: req.requestId,
  });
});

module.exports = {
  searchMedicines,
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  updateMedicineStock,
  getLowStockMedicines,
  getExpiringMedicines,
  getInventorySummary,
  deleteMedicine,
  bulkImportMedicines,
  getMedicineCategories,
};
