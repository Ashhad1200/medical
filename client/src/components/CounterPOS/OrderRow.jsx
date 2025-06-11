import React, { useState, useEffect } from "react";
import QuantityInput from "./QuantityInput"; // Reusing the quantity input

const OrderRow = ({ item, onUpdateQuantity, onRemoveItem }) => {
  const [quantity, setQuantity] = useState(item.quantity);

  useEffect(() => {
    setQuantity(item.quantity);
  }, [item.quantity]);

  const handleQuantityChange = (newQuantity) => {
    setQuantity(newQuantity);
    onUpdateQuantity(item.id, newQuantity);
  };

  const subtotal = item.unitPrice * quantity * (1 - (item.discount || 0) / 100);

  return (
    <div className="bg-gray-50 p-3 rounded-md shadow-sm border border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
      <div className="flex-grow min-w-0">
        <p
          className="text-sm font-medium text-gray-800 truncate"
          title={item.name}
        >
          {item.name}
        </p>
        <p className="text-xs text-gray-500">
          Rs.{item.unitPrice.toFixed(2)} each{" "}
          {item.discount > 0 ? `(${item.discount}% off)` : ""}
        </p>
      </div>

      <div className="flex items-center space-x-3 w-full sm:w-auto">
        <QuantityInput
          quantity={quantity}
          onQuantityChange={handleQuantityChange}
          maxStock={item.stock + item.quantity} // Max stock should allow current quantity in cart
          idPrefix={`qty-order-${item.id}`}
        />
        <p className="text-sm font-semibold text-gray-900 w-20 text-right">
          Rs.{subtotal.toFixed(2)}
        </p>
        <button
          onClick={() => onRemoveItem(item.id)}
          className="text-red-500 hover:text-red-700 p-1.5 rounded-md hover:bg-red-100 transition-colors duration-150 ease-in-out"
          aria-label="Remove item"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default OrderRow;
