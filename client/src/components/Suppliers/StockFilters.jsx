import React from "react";

const StockFilters = ({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  stockFilter,
  setStockFilter,
}) => {
  const sortOptions = [
    { value: "name", label: "Medicine Name" },
    { value: "manufacturer", label: "Manufacturer" },
    { value: "quantity", label: "Current Stock" },
    { value: "minStockLevel", label: "Min Stock Level" },
    { value: "tradePrice", label: "Trade Price" },
    { value: "expiryDate", label: "Expiry Date" },
  ];

  const stockFilterOptions = [
    {
      value: "out-of-stock",
      label: "Out of Stock",
      shortLabel: "Out of Stock",
      color: "bg-red-100 text-red-800 border-red-200",
      activeColor: "bg-red-500 text-white border-red-600",
      icon: "⚠️",
      description: "Items with zero stock",
    },
    {
      value: "low-stock",
      label: "Low Stock",
      shortLabel: "Low Stock",
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      activeColor: "bg-yellow-500 text-white border-yellow-600",
      icon: "⚡",
      description: "Items below minimum level",
    },
    {
      value: "all",
      label: "All Items Needing Restock",
      shortLabel: "All Restock",
      color: "bg-blue-100 text-blue-800 border-blue-200",
      activeColor: "bg-blue-500 text-white border-blue-600",
      icon: "📦",
      description: "All items requiring attention",
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Primary Stock Filter Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Stock Status Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stockFilterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setStockFilter(option.value)}
              className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left hover:shadow-md ${
                stockFilter === option.value
                  ? option.activeColor + " shadow-lg transform scale-105"
                  : option.color + " hover:bg-opacity-80"
              }`}
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{option.icon}</span>
                <div className="flex-1">
                  <div
                    className={`font-semibold text-sm ${
                      stockFilter === option.value ? "text-white" : ""
                    }`}
                  >
                    {option.shortLabel}
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      stockFilter === option.value
                        ? "text-white text-opacity-90"
                        : "text-gray-600"
                    }`}
                  >
                    {option.description}
                  </div>
                </div>
                {stockFilter === option.value && (
                  <div className="absolute top-2 right-2">
                    <svg
                      className="w-5 h-5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Filters Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
          {/* Search */}
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Medicines
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search by name, manufacturer, or batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-50 rounded-r-lg"
                >
                  <svg
                    className="h-5 w-5 text-gray-400 hover:text-gray-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex items-end space-x-3">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-2">
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-[140px]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
            >
              <svg
                className={`h-5 w-5 text-gray-600 transition-transform ${
                  sortOrder === "desc" ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Active Filters Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            Active filters:
          </span>

          {/* Stock Filter Badge */}
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
              stockFilterOptions.find((opt) => opt.value === stockFilter)
                ?.color || "bg-gray-100 text-gray-800 border-gray-200"
            }`}
          >
            <span className="mr-1">
              {
                stockFilterOptions.find((opt) => opt.value === stockFilter)
                  ?.icon
              }
            </span>
            {
              stockFilterOptions.find((opt) => opt.value === stockFilter)
                ?.shortLabel
            }
          </span>

          {/* Search Filter Badge */}
          {searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              "{searchQuery}"
              <button
                onClick={() => setSearchQuery("")}
                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-blue-600 hover:bg-blue-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 8 8">
                  <path d="M1.41 0l-1.41 1.41.72.72 1.78 1.81-1.78 1.81-.72.72 1.41 1.41.72-.72 1.81-1.78 1.81 1.78.72.72 1.41-1.41-.72-.72-1.78-1.81 1.78-1.81.72-.72-1.41-1.41-.72.72-1.81 1.78-1.81-1.78-.72-.72z" />
                </svg>
              </button>
            </span>
          )}

          {/* Sort Filter Badge */}
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <svg
              className={`w-4 h-4 mr-1 transition-transform ${
                sortOrder === "desc" ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12"
              />
            </svg>
            {sortOptions.find((opt) => opt.value === sortBy)?.label} (
            {sortOrder === "asc" ? "A-Z" : "Z-A"})
          </span>

          {/* Clear All Filters */}
          {(searchQuery || stockFilter !== "out-of-stock") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStockFilter("out-of-stock");
                setSortBy("name");
                setSortOrder("asc");
              }}
              className="inline-flex items-center px-3 py-1 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-full hover:bg-red-100 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockFilters;
