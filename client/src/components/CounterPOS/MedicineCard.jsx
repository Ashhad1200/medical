import React, { useState } from "react";
import QuantityInput from "./QuantityInput";
import DiscountSelect from "./DiscountSelect";
import AddToOrderButton from "./AddToOrderButton";

const MedicineCard = ({ medicine, onAddToOrder }) => {
  const [quantity, setQuantity] = useState(1);
  const [discount, setDiscount] = useState(0); // Default 0% discount

  const handleAdd = () => {
    if (quantity > 0 && medicine.stock > 0) {
      onAddToOrder(medicine, quantity, discount);
      // Optionally reset quantity for this card, or parent can manage this state
      // setQuantity(1);
    }
  };

  const isLowStock = medicine.stock < 10 && medicine.stock > 0;
  const isOutOfStock = medicine.stock === 0;

  return (
    <div
      className={`bg-white rounded-lg shadow p-4 border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-in-out 
                  ${isOutOfStock ? "opacity-60 cursor-not-allowed" : ""}
                  ${
                    isLowStock
                      ? "border-l-4 border-red-500"
                      : "border-l-4 border-transparent"
                  }`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="mb-3 sm:mb-0">
          <h3
            className="text-lg font-semibold text-gray-900 truncate"
            title={medicine.name}
          >
            {medicine.name}
          </h3>
          <p className="text-sm text-gray-500">
            {medicine.category || "General"}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {isOutOfStock && (
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
              Out of Stock
            </span>
          )}
          {isLowStock && (
            <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-1 rounded-full">
              Low Stock
            </span>
          )}
          {!isOutOfStock && !isLowStock && (
            <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
              Stock: {medicine.stock}
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
        <div className="flex-grow">
          <label
            htmlFor={`price-${medicine.id}`}
            className="block text-xs font-medium text-gray-700 mb-1"
          >
            Unit Price
          </label>
          <p
            id={`price-${medicine.id}`}
            className="text-sm text-gray-800 font-medium"
          >
            Rs.{medicine.unitPrice.toFixed(2)}
          </p>
        </div>

        <QuantityInput
          quantity={quantity}
          onQuantityChange={setQuantity}
          maxStock={medicine.stock}
          disabled={isOutOfStock}
          idPrefix={`qty-card-${medicine.id}`}
        />

        <DiscountSelect
          discount={discount}
          onDiscountChange={setDiscount}
          disabled={isOutOfStock}
          idPrefix={`disc-card-${medicine.id}`}
        />

        <AddToOrderButton
          onClick={handleAdd}
          disabled={isOutOfStock || quantity === 0 || quantity > medicine.stock}
        />
      </div>
    </div>
  );
};

export default MedicineCard;
