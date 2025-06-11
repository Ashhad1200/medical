import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2";
import { format, subDays, eachDayOfInterval } from "date-fns";
import api from "../../services/api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsCharts = ({ timeRange = "7days" }) => {
  const [analyticsData, setAnalyticsData] = useState({
    salesData: [],
    topMedicines: [],
    orderStatusStats: [],
    loading: true,
  });

  const [activeChart, setActiveChart] = useState("sales");

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get(
        `/dashboard/analytics?period=${timeRange}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Analytics API Response:", response.data);

      const data = response.data.data;

      // Generate fallback data if no data exists
      const salesData =
        data.salesData && data.salesData.length > 0
          ? data.salesData
          : generateFallbackSalesData();

      const topMedicines =
        data.topMedicines && data.topMedicines.length > 0
          ? data.topMedicines
          : [];

      const orderStatusStats =
        data.orderStatusStats && data.orderStatusStats.length > 0
          ? data.orderStatusStats
          : [{ _id: "No orders", count: 1 }];

      setAnalyticsData({
        salesData,
        topMedicines,
        orderStatusStats,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      // Set fallback data on error
      setAnalyticsData({
        salesData: generateFallbackSalesData(),
        topMedicines: [],
        orderStatusStats: [{ _id: "No orders", count: 1 }],
        loading: false,
      });
    }
  };

  // Generate fallback sales data for demonstration
  const generateFallbackSalesData = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split("T")[0],
        totalSales: 0,
        totalProfit: 0,
        totalOrders: 0,
      });
    }
    return days;
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Date",
        },
      },
      y: {
        display: true,
        title: {
          display: true,
          text: "Amount (Rs.)",
        },
        beginAtZero: true,
      },
    },
    interaction: {
      mode: "nearest",
      axis: "x",
      intersect: false,
    },
  };

  // Sales trend chart data
  const salesChartData = {
    labels: (analyticsData.salesData || []).map((item) =>
      format(new Date(item.date), "MMM dd")
    ),
    datasets: [
      {
        label: "Daily Sales (Rs.)",
        data: (analyticsData.salesData || []).map(
          (item) => item.totalSales || 0
        ),
        borderColor: "rgb(59, 130, 246)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(59, 130, 246)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
      {
        label: "Daily Profit (Rs.)",
        data: (analyticsData.salesData || []).map(
          (item) => item.totalProfit || 0
        ),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.1)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "rgb(34, 197, 94)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        pointRadius: 5,
      },
    ],
  };

  // Orders bar chart data
  const ordersChartData = {
    labels: (analyticsData.salesData || []).map((item) =>
      format(new Date(item.date), "MMM dd")
    ),
    datasets: [
      {
        label: "Daily Orders",
        data: (analyticsData.salesData || []).map(
          (item) => item.totalOrders || 0
        ),
        backgroundColor: "rgba(168, 85, 247, 0.8)",
        borderColor: "rgb(168, 85, 247)",
        borderWidth: 2,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  // Top medicines bar chart
  const topMedicinesData = {
    labels: (analyticsData.topMedicines || [])
      .slice(0, 5)
      .map((item) =>
        (item.name || "Unknown").length > 15
          ? (item.name || "Unknown").substring(0, 15) + "..."
          : item.name || "Unknown"
      ),
    datasets: [
      {
        label: "Quantity Sold",
        data: (analyticsData.topMedicines || [])
          .slice(0, 5)
          .map((item) => item.totalQuantity || 0),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 205, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
        ],
        borderColor: [
          "rgb(255, 99, 132)",
          "rgb(54, 162, 235)",
          "rgb(255, 205, 86)",
          "rgb(75, 192, 192)",
          "rgb(153, 102, 255)",
        ],
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  // Order status doughnut chart
  const orderStatusData = {
    labels: (analyticsData.orderStatusStats || []).map(
      (item) =>
        (item._id || "Unknown").charAt(0).toUpperCase() +
        (item._id || "Unknown").slice(1)
    ),
    datasets: [
      {
        data: (analyticsData.orderStatusStats || []).map(
          (item) => item.count || 0
        ),
        backgroundColor: [
          "rgba(34, 197, 94, 0.8)",
          "rgba(251, 191, 36, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(59, 130, 246, 0.8)",
        ],
        borderColor: [
          "rgb(34, 197, 94)",
          "rgb(251, 191, 36)",
          "rgb(239, 68, 68)",
          "rgb(59, 130, 246)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartTabs = [
    { id: "sales", label: "Sales Trend", icon: "📈" },
    { id: "orders", label: "Orders", icon: "📊" },
    { id: "medicines", label: "Top Medicines", icon: "💊" },
    { id: "status", label: "Order Status", icon: "🎯" },
  ];

  if (analyticsData.loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  console.log("Chart data state:", {
    salesData: analyticsData.salesData,
    topMedicines: analyticsData.topMedicines,
    orderStatusStats: analyticsData.orderStatusStats,
  });

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      {/* Chart Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6 py-4" aria-label="Tabs">
          {chartTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveChart(tab.id)}
              className={`${
                activeChart === tab.id
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Chart Content */}
      <div className="p-6">
        <div className="h-80">
          {activeChart === "sales" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Sales & Profit Trend
              </h3>
              <Line data={salesChartData} options={chartOptions} />
            </div>
          )}

          {activeChart === "orders" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Daily Orders
              </h3>
              <Bar
                data={ordersChartData}
                options={{
                  ...chartOptions,
                  scales: {
                    ...chartOptions.scales,
                    y: {
                      ...chartOptions.scales.y,
                      title: {
                        display: true,
                        text: "Number of Orders",
                      },
                    },
                  },
                }}
              />
            </div>
          )}

          {activeChart === "medicines" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Top Selling Medicines
              </h3>
              {(analyticsData.topMedicines || []).length > 0 ? (
                <Bar
                  data={topMedicinesData}
                  options={{
                    ...chartOptions,
                    indexAxis: "y",
                    scales: {
                      x: {
                        display: true,
                        title: {
                          display: true,
                          text: "Quantity Sold",
                        },
                        beginAtZero: true,
                      },
                      y: {
                        display: true,
                        title: {
                          display: true,
                          text: "Medicines",
                        },
                      },
                    },
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">💊</div>
                  <p className="text-gray-500">
                    No medicine sales data available
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Create some orders to see top selling medicines
                  </p>
                </div>
              )}
            </div>
          )}

          {activeChart === "status" && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Status Distribution
              </h3>
              <div className="flex justify-center">
                <div className="w-64 h-64">
                  <Doughnut
                    data={orderStatusData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: "bottom",
                        },
                      },
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chart Summary */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                Rs.
                {(analyticsData.salesData || [])
                  .reduce((sum, item) => sum + (item.totalSales || 0), 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                Rs.
                {(analyticsData.salesData || [])
                  .reduce((sum, item) => sum + (item.totalProfit || 0), 0)
                  .toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Profit</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(analyticsData.salesData || []).reduce(
                  (sum, item) => sum + (item.totalOrders || 0),
                  0
                )}
              </div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                Rs.
                {(() => {
                  const salesData = analyticsData.salesData || [];
                  const totalSales = salesData.reduce(
                    (sum, item) => sum + (item.totalSales || 0),
                    0
                  );
                  const totalOrders = salesData.reduce(
                    (sum, item) => sum + (item.totalOrders || 0),
                    0
                  );
                  return totalOrders > 0
                    ? (totalSales / totalOrders).toFixed(2)
                    : "0.00";
                })()}
              </div>
              <div className="text-sm text-gray-600">Avg Order Value</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsCharts;
