import React, { useState } from "react";

const MedicineSearchResults = ({
  medicines,
  onAddToCart,
  isSearching,
  searchQuery,
}) => {
  const [quantities, setQuantities] = useState({});

  const handleQuantityChange = (medicineId, quantity) => {
    setQuantities((prev) => ({
      ...prev,
      [medicineId]: parseInt(quantity) || 1,
    }));
  };

  const handleAddToCart = (medicine) => {
    const quantity = quantities[medicine._id] || 1;
    onAddToCart(medicine, quantity);

    // Reset quantity after adding
    setQuantities((prev) => ({
      ...prev,
      [medicine._id]: 1,
    }));
  };

  const getStockStatus = (medicine) => {
    const isExpired = new Date(medicine.expiryDate) < new Date();
    const isOutOfStock = medicine.quantity === 0;
    const isLowStock = medicine.quantity <= (medicine.minStockLevel || 10);

    if (isExpired) {
      return { status: "expired", color: "red", text: "Expired" };
    } else if (isOutOfStock) {
      return { status: "out-of-stock", color: "red", text: "Out of Stock" };
    } else if (isLowStock) {
      return { status: "low-stock", color: "yellow", text: "Low Stock" };
    } else {
      return { status: "in-stock", color: "green", text: "In Stock" };
    }
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

  if (isSearching) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Searching medicines...</span>
        </div>
      </div>
    );
  }

  if (searchQuery.length >= 2 && medicines.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
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
            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No medicines found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          No medicines match your search for "{searchQuery}". Try adjusting your
          search terms.
        </p>
      </div>
    );
  }

  if (searchQuery.length < 2) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
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
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Start searching
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Type at least 2 characters to search for medicines
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          Search Results ({medicines.length} found)
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {medicines.map((medicine) => {
          const stockStatus = getStockStatus(medicine);
          const currentQuantity = quantities[medicine._id] || 1;
          const maxQuantity = Math.min(medicine.quantity, 999);

          return (
            <div
              key={medicine._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {/* Medicine Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                    {medicine.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {medicine.manufacturer}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    stockStatus.color === "green"
                      ? "bg-green-100 text-green-800"
                      : stockStatus.color === "yellow"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {stockStatus.text}
                </span>
              </div>

              {/* Medicine Details */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Price:</span>
                  <span className="ml-1 font-semibold text-green-600">
                    {formatCurrency(medicine.retailPrice)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Stock:</span>
                  <span className="ml-1 font-semibold">
                    {medicine.quantity} units
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Batch:</span>
                  <span className="ml-1">{medicine.batchNumber}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expiry:</span>
                  <span className="ml-1">
                    {new Date(medicine.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Add to Cart Section */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <label className="text-sm text-gray-700">Qty:</label>
                  <input
                    type="number"
                    min="1"
                    max={maxQuantity}
                    value={currentQuantity}
                    onChange={(e) =>
                      handleQuantityChange(medicine._id, e.target.value)
                    }
                    className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm focus:ring-blue-500 focus:border-blue-500"
                    disabled={medicine.quantity === 0}
                  />
                </div>

                <button
                  onClick={() => handleAddToCart(medicine)}
                  disabled={
                    medicine.quantity === 0 ||
                    currentQuantity > medicine.quantity
                  }
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  Add to Cart
                </button>
              </div>

              {/* Quick Info */}
              {medicine.category && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                    {medicine.category}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MedicineSearchResults;
