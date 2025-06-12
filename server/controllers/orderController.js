const mongoose = require("mongoose");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");
const User = require("../models/User");
const PDFDocument = require("pdfkit");

// Create new order
const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      items, // Expected from frontend: [{ medicineId, name, quantity, unitPrice, tradePrice, discountPercent, gstPerUnit }]
      customer,
      payment,
      totals,
      status = "completed",
    } = req.body;
    const createdBy = req.user._id;

    console.log("Order creation request:", JSON.stringify(req.body, null, 2));

    if (!items || !Array.isArray(items) || items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Order items are required and must be an array.",
      });
    }

    let calculatedSubtotal = 0;
    let calculatedTotalProfit = 0;
    const orderItemsDetails = [];
    const inventoryErrors = [];

    for (const item of items) {
      if (!item.medicineId || !item.quantity || item.quantity <= 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: "Each item must have a valid medicineId and quantity > 0.",
        });
      }

      const medicine = await Medicine.findById(item.medicineId).session(
        session
      );

      if (!medicine) {
        inventoryErrors.push(`Medicine with ID ${item.medicineId} not found`);
        continue;
      }

      // Enhanced inventory validation
      if (medicine.quantity < item.quantity) {
        inventoryErrors.push(
          `${medicine.name}: requested ${item.quantity}, available ${medicine.quantity}`
        );
        continue;
      }

      // Check if medicine is expired
      if (medicine.expiryDate && new Date(medicine.expiryDate) < new Date()) {
        inventoryErrors.push(`${medicine.name} has expired`);
        continue;
      }

      const unitPrice = parseFloat(item.unitPrice || medicine.retailPrice);
      const tradePrice = parseFloat(item.tradePrice || medicine.tradePrice);
      const discountPercentage = parseFloat(item.discountPercent || 0);
      const quantity = parseInt(item.quantity, 10);

      // Validate price integrity
      if (unitPrice < 0 || tradePrice < 0) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid price for ${medicine.name}`,
        });
      }

      // Validate discount percentage
      if (discountPercentage < 0 || discountPercentage > 100) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid discount percentage for ${medicine.name}`,
        });
      }

      const itemSubtotalBeforeDiscount = unitPrice * quantity;
      const itemDiscountAmount =
        (itemSubtotalBeforeDiscount * discountPercentage) / 100;
      const itemSubtotalAfterDiscount =
        itemSubtotalBeforeDiscount - itemDiscountAmount;

      // GST per unit is on the medicine, so total GST for the item quantity
      const itemGstAmount =
        parseFloat(item.gstPerUnit || medicine.gstPerUnit || 0) * quantity;
      const itemTotal = itemSubtotalAfterDiscount + itemGstAmount;

      calculatedSubtotal += itemTotal;

      // Fix profit calculation: (selling price - cost price) * quantity
      // Ensure profit calculation is per unit first, then multiply by quantity
      const profitPerUnit = Math.max(
        0,
        unitPrice - itemDiscountAmount / quantity - tradePrice
      );
      const itemProfit = profitPerUnit * quantity;
      calculatedTotalProfit += itemProfit;

      orderItemsDetails.push({
        medicineId: medicine._id,
        name: medicine.name,
        manufacturer: medicine.manufacturer || "Unknown",
        quantity: quantity,
        retailPrice: unitPrice,
        tradePrice: tradePrice,
        discount: discountPercentage,
        discountAmount: itemDiscountAmount,
        totalPrice: itemTotal,
        profit: Math.max(0, itemProfit), // Ensure non-negative profit
      });
    }

    // If there are inventory errors, rollback and return errors
    if (inventoryErrors.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: "Insufficient inventory",
        errors: inventoryErrors,
      });
    }

    // Now update medicine quantities after all validations pass
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const medicine = await Medicine.findById(item.medicineId).session(
        session
      );

      // Final check before updating (in case of concurrent orders)
      if (medicine.quantity < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${medicine.name} (concurrent order conflict)`,
        });
      }

      medicine.quantity -= item.quantity;
      await medicine.save({ session });
    }

    // Use totals from frontend if provided, otherwise calculate
    const taxPercent = parseFloat(payment?.taxPercent || 0);
    const globalDiscount = parseFloat(payment?.globalDiscount || 0);
    const finalSubtotal = totals?.subtotal || calculatedSubtotal;
    const finalTaxAmount =
      totals?.taxAmount || (finalSubtotal * taxPercent) / 100;
    const finalTotal =
      totals?.grandTotal || finalSubtotal + finalTaxAmount - globalDiscount;

    // Ensure all numeric values are properly formatted and non-negative
    const order = new Order({
      customerName: customer?.name || "Walk-in Customer",
      customerPhone: customer?.phone || "",
      items: orderItemsDetails,
      subtotal: Math.max(0, finalSubtotal),
      taxPercent: Math.max(0, taxPercent),
      taxAmount: Math.max(0, finalTaxAmount),
      discountAmount: Math.max(0, globalDiscount),
      total: Math.max(0, finalTotal),
      profit: Math.max(0, calculatedTotalProfit), // Ensure non-negative profit
      status: status,
      paymentMethod: payment?.method || "cash",
      createdBy,
    });

    console.log(
      "Order data before save:",
      JSON.stringify(order.toObject(), null, 2)
    );

    // Additional validation before save
    if (!order.createdBy) {
      throw new Error("createdBy field is required but missing");
    }
    if (!order.items || order.items.length === 0) {
      throw new Error("Order must have at least one item");
    }
    for (const item of order.items) {
      if (!item.manufacturer) {
        console.warn(`Missing manufacturer for item: ${item.name}`);
        item.manufacturer = "Unknown";
      }
    }

    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: { order, orderId: order._id },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Create order error:", error);
    console.error("Error stack:", error.stack);
    console.error("Error name:", error.name);
    if (error.name === "ValidationError") {
      console.error("Validation errors:", error.errors);
    }
    res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, date, status, from, to } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = {};

    if (status) {
      query.status = status;
    }

    // Date filtering: orders between 10 AM of selected date to 2 AM of the next day
    if (date) {
      const selectedDate = new Date(date);

      const startTime = new Date(selectedDate);
      startTime.setHours(10, 0, 0, 0); // 10:00:00 AM on selectedDate

      const endTime = new Date(selectedDate);
      endTime.setDate(endTime.getDate() + 1); // Move to next day
      endTime.setHours(2, 0, 0, 0); // 02:00:00 AM on next day

      query.createdAt = {
        $gte: startTime,
        $lt: endTime,
      };
    } else if (from && to) {
      query.createdAt = {
        $gte: new Date(from),
        $lte: new Date(to),
      };
    }

    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .limit(parseInt(limit, 10))
      .skip(skip)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username fullName");

    // Calculate summary for the current query (same date/filter range)
    const allOrdersInRange = await Order.find(query);
    const summary = {
      totalOrders: allOrdersInRange.length,
      totalSales: allOrdersInRange.reduce(
        (sum, order) => sum + (order.total || 0),
        0
      ),
      totalProfit: allOrdersInRange.reduce(
        (sum, order) => sum + (order.profit || 0),
        0
      ),
    };

    res.json({
      success: true,
      data: {
        orders: orders.map((order) => ({
          _id: order._id,
          orderNumber: order.orderNumber,
          createdAt: order.createdAt,
          total: order.total,
          profit: order.profit,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          status: order.status,
          items: order.items,
          creator: order.createdBy,
        })),
        summary,
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
    console.error("Get orders error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching orders",
      error: error.message,
    });
  }
};

// Get single order
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findById(id).populate(
      "createdBy",
      "username fullName"
    );

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
    console.error("Get order error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate ObjectId format
    if (!id || id === "undefined" || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    res.json({
      success: true,
      message: "Order status updated successfully",
      data: { order },
    });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating order status",
      error: error.message,
    });
  }
};

// Get dashboard data
const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Today's sales
    const todaysSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
        },
      },
    ]);

    // This month's sales
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthSales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth, $lte: endOfDay },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
        },
      },
    ]);

    // Low stock medicines
    const lowStockMedicines = await Medicine.findLowStock();

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "username fullName");

    res.json({
      success: true,
      data: {
        todaysSales: todaysSales[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
        },
        monthSales: monthSales[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          totalProfit: 0,
        },
        lowStockMedicines,
        recentOrders,
      },
    });
  } catch (error) {
    console.error("Get dashboard data error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard data",
    });
  }
};

// Get sales report
const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;

    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    let groupFormat;
    switch (groupBy) {
      case "month":
        groupFormat = {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        };
        break;
      case "week":
        groupFormat = {
          $dateToString: { format: "%Y-W%U", date: "$createdAt" },
        };
        break;
      default:
        groupFormat = {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        };
    }

    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          status: "completed",
        },
      },
      {
        $group: {
          _id: groupFormat,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
          averageOrderValue: { $avg: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: { salesData },
    });
  } catch (error) {
    console.error("Get sales report error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching sales report",
    });
  }
};

// Get order PDF
const getOrderPdf = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "createdBy",
      "username fullName"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Create a new PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=receipt-${order.orderNumber || order._id}.pdf`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // Header - Company Info
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("Moiz Medical Store Receipt", 50, 50);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text("123 Medical Street, Healthcare City", 50, 80);
    doc.text("Phone: +1-234-567-8900 | Email: info@medicalstore.com", 50, 95);

    // Draw line separator
    doc.moveTo(50, 120).lineTo(550, 120).stroke();

    // Order Information
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.fontSize(14).font("Helvetica-Bold").text("ORDER DETAILS", 50, 140);
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(
        `Order Number: ${order.orderNumber || order._id.toString().slice(-8)}`,
        50,
        165
      )
      .text(`Date: ${orderDate}`, 50, 180)
      .text(`Customer: ${order.customerName || "Walk-in Customer"}`, 50, 195)
      .text(`Phone: ${order.customerPhone || "N/A"}`, 50, 210)
      .text(
        `Served by: ${
          order.createdBy?.fullName || order.createdBy?.username || "Staff"
        }`,
        50,
        225
      );

    // Items table header
    let yPosition = 260;
    doc.fontSize(12).font("Helvetica-Bold").text("ITEMS", 50, yPosition);

    yPosition += 20;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Item", 50, yPosition)
      .text("Qty", 250, yPosition)
      .text("Rate", 300, yPosition)
      .text("Discount", 350, yPosition)
      .text("Total", 450, yPosition);

    // Draw line under header
    yPosition += 15;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

    // Items
    yPosition += 10;
    doc.font("Helvetica");
    order.items.forEach((item, index) => {
      if (yPosition > 700) {
        // Start new page if needed
        doc.addPage();
        yPosition = 50;
      }

      const itemName = item.name || "Unknown Medicine";
      const quantity = item.quantity || 0;
      const rate = (item.retailPrice || 0).toFixed(2);
      const discount = `${item.discount || 0}%`;
      const total = (item.totalPrice || 0).toFixed(2);

      doc
        .text(itemName.substring(0, 25), 50, yPosition)
        .text(quantity.toString(), 250, yPosition)
        .text(`Rs.${rate}`, 300, yPosition)
        .text(discount, 350, yPosition)
        .text(`Rs.${total}`, 450, yPosition);

      yPosition += 20;
    });

    // Summary section
    yPosition += 20;
    doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();
    yPosition += 20;

    const subtotal = (order.subtotal || 0).toFixed(2);
    const taxAmount = (order.taxAmount || 0).toFixed(2);
    const taxPercent = order.taxPercent || 0;
    const discountAmount = (order.discountAmount || 0).toFixed(2);
    const total = (order.total || 0).toFixed(2);

    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Subtotal:`, 350, yPosition)
      .text(`Rs.${subtotal}`, 450, yPosition);

    yPosition += 15;
    if (parseFloat(taxAmount) > 0) {
      doc
        .text(`Tax (${taxPercent}%):`, 350, yPosition)
        .text(`Rs.${taxAmount}`, 450, yPosition);
      yPosition += 15;
    }

    if (parseFloat(discountAmount) > 0) {
      doc
        .text(`Discount:`, 350, yPosition)
        .text(`-Rs.${discountAmount}`, 450, yPosition);
      yPosition += 15;
    }

    // Grand total
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text(`GRAND TOTAL:`, 350, yPosition)
      .text(`Rs.${total}`, 450, yPosition);

    // Payment method
    yPosition += 30;
    doc
      .fontSize(10)
      .font("Helvetica")
      .text(`Payment Method: ${order.paymentMethod || "Cash"}`, 50, yPosition);

    // Footer
    yPosition += 40;
    doc
      .fontSize(8)
      .font("Helvetica")
      .text("Thank you for your business!", 50, yPosition)
      .text("This is a computer-generated receipt.", 50, yPosition + 15)
      .text(`Generated on: ${new Date().toLocaleString()}`, 50, yPosition + 30);

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Get order PDF error:", error);
    res.status(500).json({
      success: false,
      message: "Error generating order PDF",
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  getDashboardData,
  getSalesReport,
  getOrderPdf,
};
