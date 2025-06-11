const mongoose = require("mongoose");
const PurchaseOrder = require("../models/PurchaseOrder");
const Supplier = require("../models/Supplier");
const Medicine = require("../models/Medicine");
const User = require("../models/User");

// Get all purchase orders
const getAllPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, supplierId } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = {};

    if (status) {
      query.status = status;
    }

    if (supplierId) {
      query.supplierId = supplierId;
    }

    const totalCount = await PurchaseOrder.countDocuments(query);
    const purchaseOrders = await PurchaseOrder.find(query)
      .limit(parseInt(limit, 10))
      .skip(skip)
      .sort({ createdAt: -1 })
      .populate("supplierId", "name contactPerson")
      .populate("createdBy", "username fullName");

    res.json({
      success: true,
      data: {
        purchaseOrders,
        pagination: {
          currentPage: parseInt(page, 10),
          totalPages: Math.ceil(totalCount / parseInt(limit, 10)),
          totalItems: totalCount,
          hasNextPage: parseInt(page, 10) * parseInt(limit, 10) < totalCount,
          hasPrevPage: parseInt(page, 10) > 1,
        },
      },
    });
  } catch (error) {
    console.error("Get purchase orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching purchase orders",
      error: error.message,
    });
  }
};

// Get single purchase order
const getPurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id)
      .populate("supplierId")
      .populate("createdBy", "username fullName")
      .populate("receivedBy", "username fullName");

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    res.json({
      success: true,
      data: { purchaseOrder },
    });
  } catch (error) {
    console.error("Get purchase order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching purchase order",
      error: error.message,
    });
  }
};

// Create purchase order
const createPurchaseOrder = async (req, res) => {
  try {
    const {
      supplierId,
      items,
      expectedDeliveryDate,
      notes,
      taxPercent = 0,
      discountAmount = 0,
    } = req.body;

    // Validate supplier exists
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    // Validate and process items
    const processedItems = [];
    let subtotal = 0;

    for (const item of items) {
      // Validate medicine exists
      const medicine = await Medicine.findById(item.medicineId);
      if (!medicine) {
        return res.status(404).json({
          success: false,
          message: `Medicine with ID ${item.medicineId} not found`,
        });
      }

      const processedItem = {
        medicineId: item.medicineId,
        name: medicine.name,
        manufacturer: medicine.manufacturer,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        expiryDate: item.expiryDate,
        batchNumber: item.batchNumber,
        notes: item.notes,
      };

      processedItems.push(processedItem);
      subtotal += processedItem.totalPrice;
    }

    // Calculate totals
    const taxAmount = (subtotal * parseFloat(taxPercent)) / 100;
    const total = subtotal + taxAmount - parseFloat(discountAmount);

    const purchaseOrder = new PurchaseOrder({
      supplierId,
      supplierName: supplier.name,
      items: processedItems,
      subtotal,
      taxPercent: parseFloat(taxPercent),
      taxAmount,
      discountAmount: parseFloat(discountAmount),
      total,
      expectedDeliveryDate,
      notes,
      createdBy: req.user.id,
    });

    await purchaseOrder.save();

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      data: { purchaseOrder },
    });
  } catch (error) {
    console.error("Create purchase order error:", error);

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
      message: "Error creating purchase order",
      error: error.message,
    });
  }
};

// Update purchase order
const updatePurchaseOrder = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    // Don't allow updates to received or cancelled orders
    if (purchaseOrder.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Cannot update a purchase order that is not pending",
      });
    }

    // If items are being updated, recalculate totals
    if (req.body.items) {
      purchaseOrder.items = req.body.items;
      purchaseOrder.calculateTotals();
    }

    // Update other fields
    Object.keys(req.body).forEach((key) => {
      if (key !== "items" && purchaseOrder[key] !== undefined) {
        purchaseOrder[key] = req.body[key];
      }
    });

    await purchaseOrder.save();

    res.json({
      success: true,
      message: "Purchase order updated successfully",
      data: { purchaseOrder },
    });
  } catch (error) {
    console.error("Update purchase order error:", error);

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
      message: "Error updating purchase order",
      error: error.message,
    });
  }
};

// Mark purchase order as received and update inventory
const receivePurchaseOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { itemUpdates } = req.body; // Array of { itemId, receivedQuantity, batchNumber, expiryDate }

    const purchaseOrder = await PurchaseOrder.findById(req.params.id).session(
      session
    );

    if (!purchaseOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (
      purchaseOrder.status === "received" ||
      purchaseOrder.status === "cancelled"
    ) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Purchase order is already received or cancelled",
      });
    }

    // Update inventory for received items
    for (const update of itemUpdates) {
      const orderItem = purchaseOrder.items.find(
        (item) => item._id.toString() === update.itemId
      );

      if (orderItem && update.receivedQuantity > 0) {
        // Find and update the medicine inventory
        const medicine = await Medicine.findById(orderItem.medicineId).session(
          session
        );

        if (medicine) {
          medicine.quantity += update.receivedQuantity;

          // Update batch number and expiry date if provided
          if (update.batchNumber) {
            medicine.batchNumber = update.batchNumber;
          }
          if (update.expiryDate) {
            medicine.expiryDate = new Date(update.expiryDate);
          }

          await medicine.save({ session });
        }
      }
    }

    // Update purchase order with received quantities
    await purchaseOrder.receiveItems(itemUpdates, req.user.id);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Purchase order received successfully",
      data: { purchaseOrder },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Receive purchase order error:", error);
    res.status(500).json({
      success: false,
      message: "Error receiving purchase order",
      error: error.message,
    });
  }
};

// Cancel purchase order
const cancelPurchaseOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (purchaseOrder.status === "received") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a received purchase order",
      });
    }

    await purchaseOrder.cancel(reason);

    res.json({
      success: true,
      message: "Purchase order cancelled successfully",
      data: { purchaseOrder },
    });
  } catch (error) {
    console.error("Cancel purchase order error:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling purchase order",
      error: error.message,
    });
  }
};

// Mark purchase order as ordered
const markAsOrdered = async (req, res) => {
  try {
    const purchaseOrder = await PurchaseOrder.findById(req.params.id);

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    if (purchaseOrder.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Can only mark pending orders as ordered",
      });
    }

    await purchaseOrder.markAsOrdered();

    res.json({
      success: true,
      message: "Purchase order marked as ordered successfully",
      data: { purchaseOrder },
    });
  } catch (error) {
    console.error("Mark as ordered error:", error);
    res.status(500).json({
      success: false,
      message: "Error marking purchase order as ordered",
      error: error.message,
    });
  }
};

// Get overdue purchase orders
const getOverduePurchaseOrders = async (req, res) => {
  try {
    const overduePurchaseOrders = await PurchaseOrder.findOverdue();

    res.json({
      success: true,
      data: { purchaseOrders: overduePurchaseOrders },
    });
  } catch (error) {
    console.error("Get overdue purchase orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching overdue purchase orders",
      error: error.message,
    });
  }
};

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  updatePurchaseOrder,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  markAsOrdered,
  getOverduePurchaseOrders,
};
