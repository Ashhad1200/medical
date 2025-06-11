import React from "react";

const DiscountSelect = ({
  discount,
  onDiscountChange,
  disabled = false,
  idPrefix = "disc",
}) => {
  const discountOptions = [
    { value: 0, label: "No Discount" },
    { value: 5, label: "5%" },
    { value: 10, label: "10%" },
    { value: 15, label: "15%" },
    { value: 20, label: "20%" },
    { value: 25, label: "25%" },
    { value: 30, label: "30%" },
  ];

  const handleChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    onDiscountChange(value);
  };

  return (
    <div className="flex flex-col">
      <label
        htmlFor={`${idPrefix}-discount`}
        className="block text-xs font-medium text-gray-700 mb-1"
      >
        Discount
      </label>
      <select
        id={`${idPrefix}-discount`}
        value={discount}
        onChange={handleChange}
        disabled={disabled}
        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-70 disabled:bg-gray-50 disabled:cursor-not-allowed transition-colors duration-150 ease-in-out"
      >
        {discountOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default DiscountSelect;
