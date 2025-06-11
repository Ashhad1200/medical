const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const PDFDocument = require("pdfkit");
const config = require("../config/env");

// Create new order
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const {
      items,
      taxPercent = 0,
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      notes,
    } = req.body;

    // Validate and calculate order totals
    let subtotal = 0;
    let profit = 0;
    const orderItems = [];

    for (const item of items) {
      const medicine = await Medicine.findById(item.medicineId).session(
        session
      );

      if (!medicine) {
        throw new Error(`Medicine not found: ${item.medicineId}`);
      }

      if (medicine.quantity < item.quantity) {
        throw new Error(
          `Insufficient stock for ${medicine.name}. Available: ${medicine.quantity}, Requested: ${item.quantity}`
        );
      }

      // Calculate item totals
      const unitPrice = medicine.retailPrice;
      const discountAmount =
        (unitPrice * item.quantity * (item.discountPercent || 0)) / 100;
      const gstAmount = medicine.gstPerUnit * item.quantity;
      const itemTotal = unitPrice * item.quantity - discountAmount + gstAmount;

      orderItems.push({
        medicineId: medicine._id,
        medicineName: medicine.name,
        quantity: item.quantity,
        unitPrice,
        tradePrice: medicine.tradePrice,
        discountPercent: item.discountPercent || 0,
        discountAmount,
        gstAmount,
        itemTotal,
      });

      subtotal += itemTotal;
      profit += (unitPrice - medicine.tradePrice) * item.quantity;

      // Update medicine quantity
      medicine.quantity -= item.quantity;
      await medicine.save({ session });
    }

    // Calculate tax and total
    const taxAmount = (subtotal * taxPercent) / 100;
    const total = subtotal + taxAmount;

    // Create order
    const order = new Order({
      items: orderItems,
      subtotal,
      taxPercent,
      taxAmount,
      total,
      profit,
      customerName,
      customerPhone,
      customerAddress,
      paymentMethod,
      notes,
      createdBy: req.user._id,
    });

    await order.save({ session });
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order },
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Get orders with date filtering (10 AM to 2 AM)
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      date,
      status,
      createdBy,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (createdBy) {
      query.createdBy = createdBy;
    }

    // Date filtering: orders between 10 AM to 2 AM
    if (date) {
      const selectedDate = new Date(date);

      // Start: 10:00 AM of selected date
      const startTime = new Date(selectedDate);
      startTime.setHours(10, 0, 0, 0);

      // End: 2:00 AM of next day
      const endTime = new Date(selectedDate);
      endTime.setDate(endTime.getDate() + 1);
      endTime.setHours(2, 0, 0, 0);

      query.createdAt = {
        $gte: startTime,
        $lt: endTime,
      };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const orders = await Order.find(query)
      .populate("createdBy", "username fullName")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    // Calculate aggregated data for the filtered orders
    const aggregation = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
          averageOrderValue: { $avg: "$total" },
        },
      },
    ]);

    const summary = aggregation[0] || {
      totalOrders: 0,
      totalSales: 0,
      totalProfit: 0,
      averageOrderValue: 0,
    };

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate("createdBy", "username fullName")
      .populate("items.medicineId", "name manufacturer");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting order",
      error: error.message,
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    order.status = status;
    if (status === "completed") {
      order.completedAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};

// Delete order (soft delete by changing status to cancelled)
const deleteOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const order = await Order.findById(id).session(session);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.status === "completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete completed order",
      });
    }

    // Restore medicine quantities
    for (const item of order.items) {
      const medicine = await Medicine.findById(item.medicineId).session(
        session
      );
      if (medicine) {
        medicine.quantity += item.quantity;
        await medicine.save({ session });
      }
    }

    // Update order status to cancelled
    order.status = "cancelled";
    await order.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: "Order cancelled successfully",
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({
      success: false,
      message: "Error cancelling order",
      error: error.message,
    });
  } finally {
    session.endSession();
  }
};

// Get order summary for a specific date range
const getOrderSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let matchQuery = {};
    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const summary = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalSales: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
          averageOrderValue: { $avg: "$total" },
          completedOrders: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
          },
        },
      },
    ]);

    // Daily breakdown
    const dailyBreakdown = await Order.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" },
          },
          date: {
            $first: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
          },
          orders: { $sum: 1 },
          sales: { $sum: "$total" },
          profit: { $sum: "$profit" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    res.json({
      success: true,
      data: {
        summary: summary[0] || {
          totalOrders: 0,
          totalSales: 0,
          totalProfit: 0,
          averageOrderValue: 0,
          completedOrders: 0,
          pendingOrders: 0,
          cancelledOrders: 0,
        },
        dailyBreakdown,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error getting order summary",
      error: error.message,
    });
  }
};

// Generate PDF receipt for order
const generateOrderReceipt = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate("createdBy", "username fullName")
      .populate("items.medicineId", "name manufacturer");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${order._id}.pdf`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc.fontSize(20).font("Helvetica-Bold").text(config.company.name, 50, 50);
    doc.fontSize(10).font("Helvetica").text(config.company.address, 50, 75);
    doc.text(config.company.phone, 50, 90);
    doc.text(config.company.email, 50, 105);

    // Receipt title
    doc.fontSize(16).font("Helvetica-Bold").text("SALES RECEIPT", 400, 50);

    // Order details
    doc.fontSize(10).font("Helvetica");
    doc.text(`Receipt #: ${order._id}`, 400, 75);
    doc.text(`Date: ${order.createdAt.toLocaleDateString("en-IN")}`, 400, 90);
    doc.text(`Time: ${order.createdAt.toLocaleTimeString("en-IN")}`, 400, 105);
    doc.text(`Cashier: ${order.createdBy?.fullName || "N/A"}`, 400, 120);

    // Customer info (if provided)
    if (order.customerName || order.customerPhone) {
      doc.text("Customer Information:", 50, 140);
      if (order.customerName) doc.text(`Name: ${order.customerName}`, 50, 155);
      if (order.customerPhone)
        doc.text(`Phone: ${order.customerPhone}`, 50, 170);
    }

    // Line separator
    doc.moveTo(50, 200).lineTo(550, 200).stroke();

    // Items header
    let currentY = 220;
    doc.fontSize(10).font("Helvetica-Bold");
    doc.text("Item", 50, currentY);
    doc.text("Qty", 350, currentY);
    doc.text("Price", 400, currentY);
    doc.text("Discount", 450, currentY);
    doc.text("Total", 500, currentY);

    currentY += 20;
    doc
      .moveTo(50, currentY - 5)
      .lineTo(550, currentY - 5)
      .stroke();

    // Items
    doc.fontSize(9).font("Helvetica");
    for (const item of order.items) {
      const itemTotal = item.unitPrice * item.quantity - item.discountAmount;

      doc.text(item.medicineName, 50, currentY, { width: 280 });
      doc.text(item.quantity.toString(), 350, currentY);
      doc.text(`₹${item.unitPrice.toFixed(2)}`, 400, currentY);
      doc.text(`${item.discountPercent}%`, 450, currentY);
      doc.text(`₹${itemTotal.toFixed(2)}`, 500, currentY);

      currentY += 15;
    }

    // Totals section
    currentY += 20;
    doc
      .moveTo(350, currentY - 10)
      .lineTo(550, currentY - 10)
      .stroke();

    doc.fontSize(10);
    doc.text("Subtotal:", 400, currentY);
    doc.text(`₹${order.subtotal.toFixed(2)}`, 500, currentY);
    currentY += 15;

    if (order.taxAmount > 0) {
      doc.text(`Tax (${order.taxPercent}%):`, 400, currentY);
      doc.text(`₹${order.taxAmount.toFixed(2)}`, 500, currentY);
      currentY += 15;
    }

    doc.font("Helvetica-Bold");
    doc.text("Grand Total:", 400, currentY);
    doc.text(`₹${order.total.toFixed(2)}`, 500, currentY);
    currentY += 15;

    doc.font("Helvetica");
    doc.text(`Payment: ${order.paymentMethod || "Cash"}`, 400, currentY);

    // Footer
    currentY += 40;
    doc
      .fontSize(8)
      .text("Thank you for your business!", 50, currentY, { align: "center" });
    doc.text("Please keep this receipt for your records.", 50, currentY + 15, {
      align: "center",
    });

    // Finalize PDF
    doc.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error generating receipt",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  getOrderSummary,
  generateOrderReceipt,
};
