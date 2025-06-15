import React from "react";

const OutOfStockTable = ({
  medicines,
  isLoading,
  onAddQuantity,
  orderCart,
  onRemoveFromCart,
  pagination,
  onPageChange,
  onNextPage,
  onPrevPage,
  stockFilter,
}) => {
  // Loading skeleton
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(10)].map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg border p-4 animate-pulse"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/5"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-24"></div>
          </div>
        </div>
      ))}
    </div>
  );

  // Empty state
  const EmptyState = () => (
    <div className="bg-white rounded-lg border p-12 text-center">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">
        {stockFilter === "out-of-stock"
          ? "No out-of-stock items found"
          : stockFilter === "low-stock"
          ? "No low-stock items found"
          : "No items needing restock found"}
      </h3>
      <p className="mt-2 text-gray-500">
        {stockFilter === "out-of-stock"
          ? "All medicines are currently in stock."
          : "All medicines have adequate stock levels."}
      </p>
    </div>
  );

  // Get stock status info
  const getStockStatus = (medicine) => {
    const quantity = medicine.quantity || 0;
    const minStock = medicine.minStockLevel || 10;

    if (quantity === 0) {
      return {
        status: "Out of Stock",
        color: "bg-red-100 text-red-800",
        icon: "⚠️",
      };
    } else if (quantity <= minStock) {
      return {
        status: "Low Stock",
        color: "bg-yellow-100 text-yellow-800",
        icon: "⚡",
      };
    } else {
      return {
        status: "In Stock",
        color: "bg-green-100 text-green-800",
        icon: "✅",
      };
    }
  };

  // Check if item is in cart
  const isInCart = (medicineId) => {
    return orderCart.some((item) => item.medicineId === medicineId);
  };

  const getCartItem = (medicineId) => {
    return orderCart.find((item) => item.medicineId === medicineId);
  };

  // Pagination component
  const Pagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const { currentPage, totalPages, hasNextPage, hasPrevPage } = pagination;
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-b-lg">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={onPrevPage}
            disabled={!hasPrevPage}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            onClick={onNextPage}
            disabled={!hasNextPage}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing{" "}
              <span className="font-medium">
                {(currentPage - 1) * (pagination.limit || 20) + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium">
                {Math.min(
                  currentPage * (pagination.limit || 20),
                  pagination.total || 0
                )}
              </span>{" "}
              of <span className="font-medium">{pagination.total || 0}</span>{" "}
              results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={onPrevPage}
                disabled={!hasPrevPage}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {startPage > 1 && (
                <>
                  <button
                    onClick={() => onPageChange(1)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    1
                  </button>
                  {startPage > 2 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                </>
              )}

              {pageNumbers.map((page) => (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              {endPage < totalPages && (
                <>
                  {endPage < totalPages - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      ...
                    </span>
                  )}
                  <button
                    onClick={() => onPageChange(totalPages)}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>
                </>
              )}

              <button
                onClick={onNextPage}
                disabled={!hasNextPage}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!medicines || medicines.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-3">
              <h3 className="text-lg font-medium text-gray-900">
                {stockFilter === "out-of-stock"
                  ? "⚠️ Out of Stock Items"
                  : stockFilter === "low-stock"
                  ? "⚡ Low Stock Items"
                  : "📦 Items Needing Restock"}
              </h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  stockFilter === "out-of-stock"
                    ? "bg-red-100 text-red-800"
                    : stockFilter === "low-stock"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-blue-100 text-blue-800"
                }`}
              >
                {stockFilter === "out-of-stock"
                  ? "Zero Stock"
                  : stockFilter === "low-stock"
                  ? "Below Minimum"
                  : "Needs Attention"}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Click on items to add quantities for purchase order
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">
              Priority:
              <span
                className={`ml-1 font-medium ${
                  stockFilter === "out-of-stock"
                    ? "text-red-600"
                    : stockFilter === "low-stock"
                    ? "text-yellow-600"
                    : "text-blue-600"
                }`}
              >
                {stockFilter === "out-of-stock"
                  ? "URGENT"
                  : stockFilter === "low-stock"
                  ? "HIGH"
                  : "MEDIUM"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items List */}
      <div className="divide-y divide-gray-200">
        {medicines.map((medicine) => {
          const stockStatus = getStockStatus(medicine);
          const cartItem = getCartItem(medicine._id);
          const inCart = isInCart(medicine._id);

          return (
            <div
              key={medicine._id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                inCart ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 truncate">
                        {medicine.name}
                      </h4>
                      <div className="mt-1 flex items-center space-x-4 text-sm text-gray-600">
                        <span>
                          <span className="font-medium">Manufacturer:</span>{" "}
                          {medicine.manufacturer}
                        </span>
                        <span>
                          <span className="font-medium">Batch:</span>{" "}
                          {medicine.batchNumber}
                        </span>
                        <span>
                          <span className="font-medium">Trade Price:</span> Rs.
                          {medicine.tradePrice?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockStatus.color}`}
                        >
                          {stockStatus.icon} {stockStatus.status}
                        </span>
                        <span className="text-sm text-gray-600">
                          Current:{" "}
                          <span className="font-medium">
                            {medicine.quantity || 0}
                          </span>
                        </span>
                        <span className="text-sm text-gray-600">
                          Min Level:{" "}
                          <span className="font-medium">
                            {medicine.minStockLevel || 10}
                          </span>
                        </span>
                        {medicine.expiryDate && (
                          <span className="text-sm text-gray-600">
                            Expires:{" "}
                            <span className="font-medium">
                              {new Date(
                                medicine.expiryDate
                              ).toLocaleDateString()}
                            </span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {inCart && (
                    <div className="text-sm text-blue-700 bg-blue-100 px-3 py-1 rounded-lg">
                      <span className="font-medium">In Cart:</span>{" "}
                      {cartItem.quantity} units
                    </div>
                  )}

                  <div className="flex space-x-2">
                    {inCart ? (
                      <>
                        <button
                          onClick={() => onAddQuantity(medicine)}
                          className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Edit Quantity
                        </button>
                        <button
                          onClick={() => onRemoveFromCart(medicine._id)}
                          className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Remove
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => onAddQuantity(medicine)}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Add Quantity
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default OutOfStockTable;
