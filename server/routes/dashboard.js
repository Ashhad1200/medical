const express = require("express");
const router = express.Router();
const { auth, checkRole } = require("../middleware/auth");
const User = require("../models/User");
const Order = require("../models/Order");
const Medicine = require("../models/Medicine");

// Protected routes
router.use(auth);

// Get comprehensive dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Parallel data fetching for better performance
    const [
      totalUsers,
      totalOrders,
      totalMedicines,
      todayOrders,
      lowStockMedicines,
      monthlyStats,
      usersByRole,
      systemStatus,
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Medicine.countDocuments({ isActive: true }),
      Order.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
        status: "completed",
      }),
      Medicine.countDocuments({
        isActive: true,
        $expr: { $lte: ["$quantity", { $ifNull: ["$minStockLevel", 10] }] },
      }),
      getMonthlyStats(),
      getUsersByRole(),
      getSystemStatus(),
    ]);

    // Calculate today's revenue and profit
    const todayRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfDay, $lte: endOfDay },
          status: "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalProfit: { $sum: "$profit" },
        },
      },
    ]);

    const stats = {
      totalUsers,
      totalOrders,
      totalMedicines,
      todayOrders,
      todayRevenue: todayRevenue[0]?.totalRevenue || 0,
      todayProfit: todayRevenue[0]?.totalProfit || 0,
      lowStockItems: lowStockMedicines,
      totalSuppliers: 0, // Placeholder for when supplier model is implemented
      pendingOrders: 0, // Placeholder for pending purchase orders
      monthlyStats,
      usersByRole,
      systemStatus,
    };

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard statistics",
      error: error.message,
    });
  }
});

// Get recent activities (enhanced)
router.get("/activities", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent orders, user registrations, and system events
    const [recentOrders, recentUsers] = await Promise.all([
      Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("createdBy", "username fullName")
        .select("orderNumber total status createdAt customer"),
      User.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("username fullName role createdAt"),
    ]);

    // Format activities
    const activities = [];

    // Add order activities
    recentOrders.forEach((order) => {
      activities.push({
        id: `order_${order._id}`,
        type: "order",
        description: `Order #${order.orderNumber} ${
          order.status
        } - Rs.${order.total.toFixed(2)}`,
        timestamp: order.createdAt,
        user: order.createdBy?.fullName || "Unknown",
        details: {
          orderId: order._id,
          amount: order.total,
          status: order.status,
          customer: order.customer?.name || "Walk-in Customer",
        },
      });
    });

    // Add user registration activities
    recentUsers.forEach((user) => {
      activities.push({
        id: `user_${user._id}`,
        type: "user",
        description: `New ${user.role} user registered: ${user.fullName}`,
        timestamp: user.createdAt,
        user: "System",
        details: {
          userId: user._id,
          username: user.username,
          role: user.role,
        },
      });
    });

    // Add system activities
    activities.push({
      id: `system_${Date.now()}`,
      type: "system",
      description: "Dashboard statistics updated successfully",
      timestamp: new Date(),
      user: "System",
      details: {
        action: "stats_update",
      },
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    res.json({
      success: true,
      data: { activities: sortedActivities },
    });
  } catch (error) {
    console.error("Dashboard activities error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard activities",
      error: error.message,
    });
  }
});

// Get sales analytics for charts
router.get("/analytics", checkRole(["admin"]), async (req, res) => {
  try {
    const { period = "7days", groupBy = "day" } = req.query;

    let startDate = new Date();
    switch (period) {
      case "30days":
        startDate.setDate(startDate.getDate() - 30);
        break;
      case "7days":
      default:
        startDate.setDate(startDate.getDate() - 7);
        break;
    }

    // Daily sales breakdown
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: "completed",
        },
      },
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
          totalSales: { $sum: "$total" },
          totalOrders: { $sum: 1 },
          totalProfit: { $sum: "$profit" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Top selling medicines
    const topMedicines = await Order.aggregate([
      { $match: { status: "completed" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.medicineId",
          name: { $first: "$items.name" },
          manufacturer: { $first: "$items.manufacturer" },
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: { $sum: "$items.totalPrice" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    // Order status distribution
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$total" },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        salesData,
        topMedicines,
        orderStatusStats,
      },
    });
  } catch (error) {
    console.error("Dashboard analytics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard analytics",
      error: error.message,
    });
  }
});

// Get real-time metrics (for auto-refresh)
router.get("/metrics", async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);

    // Get real-time metrics
    const [todayOrders, activeSessions, systemLoad] = await Promise.all([
      Order.countDocuments({
        createdAt: { $gte: startOfDay },
        status: "completed",
      }),
      User.countDocuments({
        isActive: true,
        lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      getSystemLoad(),
    ]);

    res.json({
      success: true,
      data: {
        todayOrders,
        activeSessions,
        systemLoad,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard metrics error:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching dashboard metrics",
      error: error.message,
    });
  }
});

// Helper functions
async function getMonthlyStats() {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const monthlyData = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfMonth },
        status: "completed",
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$total" },
        totalProfit: { $sum: "$profit" },
        averageOrderValue: { $avg: "$total" },
      },
    },
  ]);

  return (
    monthlyData[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      totalProfit: 0,
      averageOrderValue: 0,
    }
  );
}

async function getUsersByRole() {
  const userStats = await User.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);

  return userStats.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});
}

async function getSystemStatus() {
  // Basic system health check
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    status: "healthy",
    uptime: Math.floor(uptime),
    memoryUsage: {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    },
    lastCheck: new Date().toISOString(),
  };
}

async function getSystemLoad() {
  const totalMemory = process.memoryUsage();
  const cpuUsage = process.cpuUsage();

  return {
    memoryUsage: Math.round(
      (totalMemory.heapUsed / totalMemory.heapTotal) * 100
    ),
    cpuUsage: Math.round(Math.random() * 20 + 10), // Placeholder
    diskUsage: Math.round(Math.random() * 30 + 20), // Placeholder
    activeConnections: Math.floor(Math.random() * 50 + 10), // Placeholder
  };
}

module.exports = router;
