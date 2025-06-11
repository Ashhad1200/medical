import React, { useState, useEffect } from "react";

const ShoppingCart = ({
  cart,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  totals,
  discountAmount,
  setDiscountAmount,
  isMobile = false,
  isCounterStaff = false,
}) => {
  const [editingItem, setEditingItem] = useState(null);
  const [discountPercent, setDiscountPercent] = useState(0);

  // Calculate the current discount percentage based on discount amount
  useEffect(() => {
    if (totals.subtotal > 0 && discountAmount > 0) {
      const currentPercent = Math.round(
        (discountAmount / totals.subtotal) * 100
      );
      setDiscountPercent(currentPercent);
    } else {
      setDiscountPercent(0);
    }
  }, [discountAmount, totals.subtotal]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("PKR", "Rs.");
  };

  const handleQuantityChange = (medicineId, newQuantity) => {
    const item = cart.find((item) => item.medicineId === medicineId);
    if (newQuantity > item.availableStock) {
      alert(`Only ${item.availableStock} units available in stock`);
      return;
    }
    onUpdateItem(medicineId, { quantity: parseInt(newQuantity) });
  };

  const handleDiscountChange = (medicineId, discountPercent) => {
    onUpdateItem(medicineId, {
      discountPercent: parseFloat(discountPercent) || 0,
    });
  };

  if (cart.length === 0) {
    return (
      <div className="p-6 text-center">
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
            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 5.5M7 13l2 8h8m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Cart is empty
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Search and add medicines to start creating an order
        </p>
      </div>
    );
  }

  return (
    <div
      className={`${
        !isMobile ? "max-h-[calc(100vh-200px)] overflow-y-auto" : ""
      }`}
    >
      {/* Cart Items */}
      <div className="divide-y divide-gray-200">
        {cart.map((item) => (
          <div key={item.medicineId} className="p-4">
            <div className="flex items-start space-x-3">
              {/* Medicine Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {item.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {item.manufacturer} • Batch: {item.batchNumber}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-gray-500">Price:</span>
                  <span className="text-sm font-semibold text-green-600">
                    {formatCurrency(item.unitPrice)}
                  </span>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={() => onRemoveItem(item.medicineId)}
                className="text-red-600 hover:text-red-800 p-1"
                title="Remove item"
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

            {/* Quantity and Discount Controls */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              {/* Quantity */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Quantity
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.medicineId, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={item.availableStock}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.medicineId, e.target.value)
                    }
                    className="w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={() =>
                      handleQuantityChange(item.medicineId, item.quantity + 1)
                    }
                    disabled={item.quantity >= item.availableStock}
                    className="w-6 h-6 rounded border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                  >
                    +
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Stock: {item.availableStock}
                </p>
              </div>

              {/* Discount */}
              <div>
                <label className="block text-xs text-gray-700 mb-1">
                  Discount %
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={item.discountPercent || 0}
                  onChange={(e) =>
                    handleDiscountChange(item.medicineId, e.target.value)
                  }
                  className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Item Total */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Item Total:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(
                    item.unitPrice * item.quantity -
                      (item.unitPrice *
                        item.quantity *
                        (item.discountPercent || 0)) /
                        100
                  )}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Discount Controls */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Order Adjustments
        </h3>

        {/* Global Discount Dropdown */}
        <div>
          <label className="block text-xs text-gray-700 mb-1">Discount %</label>
          <select
            value={discountPercent}
            onChange={(e) => {
              const selectedPercent = parseFloat(e.target.value);
              setDiscountPercent(selectedPercent);
              const discountValue = (totals.subtotal * selectedPercent) / 100;
              setDiscountAmount(discountValue);
            }}
            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="0">0% - No Discount</option>
            <option value="7">7% - Regular Discount</option>
            <option value="10">10% - Good Customer</option>
            <option value="12">12% - Premium Discount</option>
          </select>
        </div>
      </div>

      {/* Order Summary */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Order Summary
        </h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Subtotal:</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>

          {totals.globalDiscount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Discount:</span>
              <span>-{formatCurrency(totals.globalDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between pt-2 border-t border-gray-200 font-semibold text-lg">
            <span>Total:</span>
            <span className="text-green-600">
              {formatCurrency(totals.grandTotal)}
            </span>
          </div>

          {/* Hide profit information from counter staff */}
          {!isCounterStaff && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Estimated Profit:</span>
              <span className="text-blue-600">
                {formatCurrency(totals.profit)}
              </span>
            </div>
          )}
        </div>

        {/* Clear Cart Button */}
        {!isMobile && (
          <button
            onClick={onClearCart}
            className="w-full mt-4 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-sm"
          >
            Clear Cart
          </button>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
