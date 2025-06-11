import React from "react";
import { getStockStatus } from "../../hooks/useInventory";

const LoadingSkeleton = () => (
  <div className="animate-pulse">
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <div className="w-8 h-8 bg-gray-200 rounded"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/6"></div>
          </div>
          <div className="w-20 h-4 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
          <div className="w-24 h-4 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-16">
    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg
        className="w-12 h-12 text-gray-400"
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
    </div>
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No medicines found
    </h3>
    <p className="text-gray-500 mb-6">
      No medicines match your current filters. Try adjusting your search
      criteria.
    </p>
    <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
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
      Add Medicine
    </button>
  </div>
);

const StatusBadge = ({ status }) => {
  const statusConfig = {
    "in-stock": {
      bg: "bg-green-100",
      text: "text-green-800",
      label: "In Stock",
    },
    "low-stock": {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Low Stock",
    },
    "out-of-stock": {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Out of Stock",
    },
    expired: {
      bg: "bg-red-100",
      text: "text-red-800",
      label: "Expired",
    },
  };

  const config = statusConfig[status] || statusConfig["in-stock"];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};

const TableRow = ({
  medicine,
  editingMedicine,
  setEditingMedicine,
  onUpdateQuantity,
  onDeleteMedicine,
  updateStockMutation,
}) => {
  const stockStatus = getStockStatus(medicine);
  const isExpired = new Date(medicine.expiryDate) <= new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(medicine.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  const handleQuantitySubmit = (e) => {
    e.preventDefault();
    const newQuantity = parseInt(e.target.value);
    if (
      newQuantity !== medicine.quantity &&
      !isNaN(newQuantity) &&
      newQuantity >= 0
    ) {
      onUpdateQuantity(medicine._id, newQuantity);
    }
    setEditingMedicine(null);
  };

  const profitMargin =
    medicine.retailPrice > 0
      ? (
          ((medicine.retailPrice - medicine.tradePrice) / medicine.tradePrice) *
          100
        ).toFixed(1)
      : 0;

  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Medicine Details */}
      <td className="px-6 py-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold ${
                isExpired
                  ? "bg-red-500"
                  : stockStatus.status === "low-stock"
                  ? "bg-yellow-500"
                  : "bg-blue-500"
              }`}
            >
              {medicine.name.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-medium text-gray-900 truncate"
              title={medicine.name}
            >
              {medicine.name}
            </p>
            <p
              className="text-sm text-gray-500 truncate"
              title={medicine.manufacturer}
            >
              {medicine.manufacturer}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                {medicine.category || "General"}
              </span>
              <span className="text-xs text-gray-500">
                Batch: {medicine.batchNumber}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Pricing */}
      <td className="px-6 py-4">
        <div className="text-right space-y-1">
          <div className="text-base font-semibold text-gray-900">
            Rs.{medicine.retailPrice?.toFixed(2) || "0.00"}
          </div>
          <div className="text-sm text-gray-500">
            Trade: Rs.{medicine.tradePrice?.toFixed(2) || "0.00"}
          </div>
          <div className="text-xs text-green-600 font-medium">
            +{profitMargin}% margin
          </div>
        </div>
      </td>

      {/* Stock Management */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          {editingMedicine === medicine._id ? (
            <input
              type="number"
              min="0"
              defaultValue={medicine.quantity}
              onBlur={handleQuantitySubmit}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleQuantitySubmit(e);
                }
              }}
              className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setEditingMedicine(medicine._id)}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
              title="Click to edit quantity"
            >
              {medicine.quantity || 0}
            </button>
          )}

          {updateStockMutation.isLoading && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-6 py-4">
        <StatusBadge status={stockStatus.status} />
      </td>

      {/* Expiry Information */}
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-sm text-gray-900">
            {new Date(medicine.expiryDate).toLocaleDateString()}
          </div>
          <div
            className={`text-xs ${
              isExpired
                ? "text-red-600"
                : daysUntilExpiry <= 30
                ? "text-yellow-600"
                : "text-gray-500"
            }`}
          >
            {isExpired
              ? "Expired"
              : daysUntilExpiry <= 30
              ? `${daysUntilExpiry} days left`
              : "Valid"}
          </div>
        </div>
      </td>

      {/* Total Value */}
      <td className="px-6 py-4">
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">
            Rs.
            {((medicine.quantity || 0) * (medicine.tradePrice || 0)).toFixed(2)}
          </div>
          <div className="text-xs text-gray-500">Trade value</div>
        </div>
      </td>

      {/* Actions */}
      <td className="px-6 py-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setEditingMedicine(medicine._id)}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit quantity"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>

          <button
            onClick={() => onDeleteMedicine(medicine._id, medicine.name)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete medicine"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </td>
    </tr>
  );
};

const InventoryTable = ({
  medicines,
  isLoading,
  viewMode,
  editingMedicine,
  setEditingMedicine,
  onUpdateQuantity,
  onDeleteMedicine,
  updateStockMutation,
  deleteMedicineMutation,
  pagination,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (!medicines?.length) {
    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Medicines ({pagination?.totalItems || medicines.length})
          </h3>
          <div className="text-sm text-gray-500">
            {viewMode === "table" ? "Table View" : "Grid View"}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Medicine Details
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Pricing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Expiry
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {medicines.map((medicine) => (
              <TableRow
                key={medicine._id}
                medicine={medicine}
                editingMedicine={editingMedicine}
                setEditingMedicine={setEditingMedicine}
                onUpdateQuantity={onUpdateQuantity}
                onDeleteMedicine={onDeleteMedicine}
                updateStockMutation={updateStockMutation}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing{" "}
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to{" "}
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded">
                {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTable;
