import React, { useState } from "react";

const MedicineSearchRow = ({ medicine, onAddToCart, isInCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [discountPercent, setDiscountPercent] = useState(0);

  const isExpired = new Date(medicine.expiryDate) <= new Date();
  const isOutOfStock = medicine.quantity === 0;
  const isLowStock = medicine.quantity <= 10;

  const calculateFinalPrice = () => {
    const basePrice = medicine.retailPrice * quantity;
    const discountAmount = (basePrice * discountPercent) / 100;
    return basePrice - discountAmount;
  };

  const handleAddToCart = () => {
    if (quantity > medicine.quantity) {
      alert(`Only ${medicine.quantity} units available in stock`);
      return;
    }
    onAddToCart(medicine, quantity, discountPercent);
    setQuantity(1);
    setDiscountPercent(0);
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    if (value <= medicine.quantity) {
      setQuantity(value);
    }
  };

  return (
    <div
      className={`border rounded-lg p-4 transition-colors ${
        isInCart
          ? "bg-green-50 border-green-200"
          : "bg-white border-gray-200 hover:bg-gray-50"
      } ${isExpired || isOutOfStock ? "opacity-60" : ""}`}
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Medicine Info - 4 columns */}
        <div className="md:col-span-4">
          <h4 className="font-semibold text-gray-900 text-lg">
            {medicine.name}
          </h4>
          <p className="text-sm text-gray-600">{medicine.manufacturer}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
              Batch: {medicine.batchNumber}
            </span>
            {isLowStock && !isOutOfStock && (
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                Low Stock
              </span>
            )}
            {isExpired && (
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                Expired
              </span>
            )}
          </div>
        </div>

        {/* Quantity Input - 2 columns */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
          </label>
          <input
            type="number"
            min="1"
            max={medicine.quantity}
            value={quantity}
            onChange={handleQuantityChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isExpired || isOutOfStock}
          />
        </div>

        {/* Available Stock - 1 column */}
        <div className="md:col-span-1 text-center">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available
          </label>
          <span
            className={`text-lg font-semibold ${
              isOutOfStock
                ? "text-red-600"
                : isLowStock
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {medicine.quantity}
          </span>
        </div>

        {/* Discount Dropdown - 2 columns */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount (%)
          </label>
          <select
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            disabled={isExpired || isOutOfStock}
          >
            <option value={0}>No Discount</option>
            <option value={5}>5%</option>
            <option value={10}>10%</option>
            <option value={15}>15%</option>
            <option value={20}>20%</option>
            <option value={25}>25%</option>
            <option value={30}>30%</option>
          </select>
        </div>

        {/* Price Display - 2 columns */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price
          </label>
          <div className="space-y-1">
            <div className="text-lg font-bold text-green-600">
              Rs.{calculateFinalPrice().toFixed(2)}
            </div>
            {discountPercent > 0 && (
              <div className="text-xs text-gray-500">
                <span className="line-through">
                  Rs.{(medicine.retailPrice * quantity).toFixed(2)}
                </span>
                <span className="text-red-600 ml-1">
                  ({discountPercent}% off)
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500">
              Unit: Rs.{medicine.retailPrice.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Add Button - 1 column */}
        <div className="md:col-span-1">
          <button
            onClick={handleAddToCart}
            disabled={isExpired || isOutOfStock || isInCart}
            className={`w-full h-12 rounded-lg font-medium transition-colors ${
              isInCart
                ? "bg-green-100 text-green-800 cursor-not-allowed"
                : isExpired || isOutOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
            }`}
          >
            {isInCart ? (
              <span className="flex items-center justify-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Added
              </span>
            ) : isExpired ? (
              "Expired"
            ) : isOutOfStock ? (
              "Out of Stock"
            ) : (
              <span className="flex items-center justify-center">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Expiry Date - Full width below */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Expires: {new Date(medicine.expiryDate).toLocaleDateString("en-IN")}
          </span>
          <span className="text-gray-600">
            GST: Rs.{(medicine.gstPerUnit || 0).toFixed(2)} per unit
          </span>
        </div>
      </div>
    </div>
  );
};

export default MedicineSearchRow;
