import React, { useState, useEffect } from "react";

const AddQuantityModal = ({
  show,
  onClose,
  medicine,
  onSubmit,
  existingItem,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const [suggestedQuantity, setSuggestedQuantity] = useState(1);
  const [expiryDate, setExpiryDate] = useState("");
  const [batchNumber, setBatchNumber] = useState("");

  useEffect(() => {
    if (medicine && show) {
      // Calculate suggested quantity based on current stock and min level
      const currentStock = medicine.quantity || 0;
      const minStock = medicine.minStockLevel || 10;
      const suggested = Math.max(minStock - currentStock, 1);
      setSuggestedQuantity(suggested);

      // If editing existing item, use its values
      if (existingItem) {
        setQuantity(existingItem.quantity);
        setNotes(existingItem.notes || "");
        setExpiryDate(
          existingItem.expiryDate
            ? new Date(existingItem.expiryDate).toISOString().split("T")[0]
            : ""
        );
        setBatchNumber(existingItem.batchNumber || "");
      } else {
        setQuantity(suggested);
        setNotes("");
        // Default expiry date to 1 year from now
        const defaultExpiry = new Date();
        defaultExpiry.setFullYear(defaultExpiry.getFullYear() + 1);
        setExpiryDate(defaultExpiry.toISOString().split("T")[0]);
        setBatchNumber(medicine.batchNumber || `BATCH-${Date.now()}`);
      }
    }
  }, [medicine, show, existingItem]);

  if (!show || !medicine) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (quantity <= 0) {
      alert("Please enter a valid quantity");
      return;
    }
    if (!expiryDate) {
      alert("Please select an expiry date");
      return;
    }
    onSubmit(quantity, notes, expiryDate, batchNumber);
  };

  const handleQuickSelect = (qty) => {
    setQuantity(qty);
  };

  const currentStock = medicine.quantity || 0;
  const minStock = medicine.minStockLevel || 10;
  const stockDeficit = Math.max(minStock - currentStock, 0);

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {existingItem ? "Edit Quantity" : "Add Quantity"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
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
        </div>

        {/* Medicine Info */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <h3 className="font-medium text-gray-900">{medicine.name}</h3>
          <div className="mt-2 grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Manufacturer:</span>
              <br />
              {medicine.manufacturer}
            </div>
            <div>
              <span className="font-medium">Batch:</span>
              <br />
              {medicine.batchNumber}
            </div>
            <div>
              <span className="font-medium">Current Stock:</span>
              <br />
              <span
                className={
                  currentStock === 0
                    ? "text-red-600 font-medium"
                    : "text-gray-900"
                }
              >
                {currentStock} units
              </span>
            </div>
            <div>
              <span className="font-medium">Min Level:</span>
              <br />
              {minStock} units
            </div>
            <div>
              <span className="font-medium">Trade Price:</span>
              <br />
              Rs. {medicine.tradePrice?.toFixed(2) || "0.00"}
            </div>
            <div>
              <span className="font-medium">Stock Deficit:</span>
              <br />
              <span className="text-red-600 font-medium">
                {stockDeficit} units
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quick Select Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Quick Select Quantities:
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickSelect(stockDeficit)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  quantity === stockDeficit
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {stockDeficit}
                <div className="text-xs text-gray-500">Deficit</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(minStock)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  quantity === minStock
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {minStock}
                <div className="text-xs text-gray-500">Min Level</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(minStock * 2)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  quantity === minStock * 2
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {minStock * 2}
                <div className="text-xs text-gray-500">2x Min</div>
              </button>
              <button
                type="button"
                onClick={() => handleQuickSelect(100)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  quantity === 100
                    ? "bg-blue-100 border-blue-300 text-blue-700"
                    : "bg-gray-50 border-gray-300 text-gray-700 hover:bg-gray-100"
                }`}
              >
                100
                <div className="text-xs text-gray-500">Bulk</div>
              </button>
            </div>
          </div>

          {/* Manual Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Order *
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter quantity"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">units</span>
              </div>
            </div>
            {quantity > 0 && (
              <p className="mt-1 text-sm text-gray-600">
                Total cost: Rs.
                {(quantity * (medicine.tradePrice || 0)).toFixed(2)}
              </p>
            )}
          </div>

          {/* Batch Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Batch Number *
            </label>
            <input
              type="text"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter batch number"
              required
            />
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date *
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any special instructions or notes for this item..."
            />
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">
              💡 Recommendations:
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                • Order at least {stockDeficit} units to meet minimum stock
                level
              </li>
              <li>
                • Consider ordering {minStock * 2} units for 2-month supply
              </li>
              {medicine.expiryDate && (
                <li>
                  • Check expiry date:{" "}
                  {new Date(medicine.expiryDate).toLocaleDateString()}
                </li>
              )}
            </ul>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {existingItem ? "Update Quantity" : "Add to Order"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuantityModal;
