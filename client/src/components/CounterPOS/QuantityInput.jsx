import React from "react";

const QuantityInput = ({
  quantity,
  onQuantityChange,
  maxStock,
  disabled = false,
  idPrefix = "qty",
}) => {
  const handleIncrement = () => {
    if (quantity < maxStock) {
      onQuantityChange(quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      // Or 1 if you don't want to allow 0
      onQuantityChange(quantity - 1);
    }
  };

  const handleChange = (e) => {
    let value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      value = 0; // Or 1, or keep current based on desired behavior for invalid input
    } else if (value < 0) {
      value = 0;
    } else if (value > maxStock) {
      value = maxStock;
    }
    onQuantityChange(value);
  };

  return (
    <div className="flex flex-col">
      <label
        htmlFor={`${idPrefix}-quantity`}
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Quantity
      </label>
      <div className="flex items-center">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || quantity <= 0}
          className="px-2.5 py-1.5 border border-gray-300 rounded-l-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          aria-label="Decrement quantity"
        >
          -
        </button>
        <input
          type="number"
          id={`${idPrefix}-quantity`}
          value={quantity}
          onChange={handleChange}
          min="0"
          max={maxStock}
          disabled={disabled}
          className="w-14 text-center border-t border-b border-gray-300 py-1.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 disabled:bg-gray-50"
        />
        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || quantity >= maxStock}
          className="px-2.5 py-1.5 border border-gray-300 rounded-r-md text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
          aria-label="Increment quantity"
        >
          +
        </button>
      </div>
    </div>
  );
};

export default QuantityInput;
