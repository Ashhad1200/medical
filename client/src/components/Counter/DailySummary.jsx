import React, { useState } from "react";
import { useSelector } from "react-redux";

const DailySummary = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Get user role to hide profit from counter staff
  const { user } = useSelector((state) => state.auth);
  const isCounterStaff = user?.role === "counter";

  // Mock data - in real app, this would come from API
  const todayStats = {
    totalSales: 25400.0,
    totalOrders: 47,
    totalProfit: 7620.0,
    cashSales: 18900.0,
    cardSales: 4200.0,
    upiSales: 2300.0,
    avgOrderValue: 540.43,
    topSellingMedicine: "Paracetamol 650mg",
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("PKR", "Rs.");
  };

  return (
    <div className="relative">
      {/* Summary Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <span className="hidden sm:block">Today's Sales</span>
        <span className="font-semibold">
          {formatCurrency(todayStats.totalSales)}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>

          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Daily Sales Summary
              </h3>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div className="p-4 space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xs text-green-600 font-medium">
                    Total Sales
                  </p>
                  <p className="text-lg font-bold text-green-700">
                    {formatCurrency(todayStats.totalSales)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium">
                    Total Orders
                  </p>
                  <p className="text-lg font-bold text-blue-700">
                    {todayStats.totalOrders}
                  </p>
                </div>
              </div>

              {/* Profit */}
              {!isCounterStaff && (
                <div className="bg-purple-50 rounded-lg p-3">
                  <p className="text-xs text-purple-600 font-medium">
                    Today's Profit
                  </p>
                  <p className="text-xl font-bold text-purple-700">
                    {formatCurrency(todayStats.totalProfit)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Avg. Order: {formatCurrency(todayStats.avgOrderValue)}
                  </p>
                </div>
              )}

              {/* Payment Breakdown */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Payment Methods
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">Cash</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(todayStats.cashSales)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">Card</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(todayStats.cardSales)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-600">UPI/Digital</span>
                    </div>
                    <span className="text-sm font-medium">
                      {formatCurrency(todayStats.upiSales)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Selling */}
              <div className="border-t pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  Top Selling Today
                </p>
                <p className="text-sm text-blue-600">
                  {todayStats.topSellingMedicine}
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium">
                View Detailed Report →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DailySummary;
