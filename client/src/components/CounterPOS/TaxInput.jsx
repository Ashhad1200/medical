import React from "react";

const TaxInput = ({ taxRate, onTaxRateChange }) => {
  const handleTaxChange = (e) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value) || value < 0) {
      value = 0;
    }
    // Optionally cap max tax rate, e.g., if (value > 100) value = 100;
    onTaxRateChange(value);
  };

  return (
    <div className="mb-3">
      <label
        htmlFor="tax-rate"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Tax (%)
      </label>
      <input
        type="number"
        id="tax-rate"
        value={taxRate}
        onChange={handleTaxChange}
        placeholder="e.g., 5 for 5%"
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-200 ease-in-out"
      />
    </div>
  );
};

export default TaxInput;
