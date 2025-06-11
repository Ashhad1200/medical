import React from "react";

const OrderTable = ({ items, onUpdateItem, onRemoveItem }) => {
  const handleQuantityChange = (medicineId, newQuantity) => {
    if (newQuantity < 1) return;

    const item = items.find((item) => item.medicineId === medicineId);
    if (newQuantity > item.availableStock) {
      alert(`Only ${item.availableStock} units available in stock`);
      return;
    }

    onUpdateItem(medicineId, { quantity: newQuantity });
  };

  const handleDiscountChange = (medicineId, discountPercent) => {
    if (discountPercent < 0 || discountPercent > 100) return;
    onUpdateItem(medicineId, { discountPercent });
  };

  const calculateItemTotal = (item) => {
    const baseTotal = item.unitPrice * item.quantity;
    const discountAmount = (baseTotal * (item.discountPercent || 0)) / 100;
    return baseTotal - discountAmount;
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
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
            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No items in order
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Add medicines from search to create an order.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Medicine
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Discount (%)
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subtotal
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {items.map((item) => (
            <tr key={item.medicineId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {item.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Available: {item.availableStock} units
                  </div>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  Rs.{item.unitPrice.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500">
                  Trade: Rs.{item.tradePrice.toFixed(2)}
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(item.medicineId, item.quantity - 1)
                    }
                    className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center"
                    disabled={item.quantity <= 1}
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
                        d="M20 12H4"
                      />
                    </svg>
                  </button>

                  <input
                    type="number"
                    min="1"
                    max={item.availableStock}
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(
                        item.medicineId,
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-16 px-2 py-1 text-center border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />

                  <button
                    onClick={() =>
                      handleQuantityChange(item.medicineId, item.quantity + 1)
                    }
                    className="w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 flex items-center justify-center"
                    disabled={item.quantity >= item.availableStock}
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
                        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                      />
                    </svg>
                  </button>
                </div>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={item.discountPercent || 0}
                  onChange={(e) =>
                    handleDiscountChange(
                      item.medicineId,
                      parseFloat(e.target.value)
                    )
                  }
                  className="px-3 py-1 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                  <option value={25}>25%</option>
                  <option value={30}>30%</option>
                  <option value={50}>50%</option>
                </select>
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900">
                  Rs.{calculateItemTotal(item).toFixed(2)}
                </div>
                {item.discountPercent > 0 && (
                  <div className="text-xs text-gray-500">
                    <span className="line-through">
                      Rs.{(item.unitPrice * item.quantity).toFixed(2)}
                    </span>
                    <span className="text-red-600 ml-1">
                      (-Rs.
                      {(
                        (item.unitPrice *
                          item.quantity *
                          item.discountPercent) /
                        100
                      ).toFixed(2)}
                      )
                    </span>
                  </div>
                )}
              </td>

              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onRemoveItem(item.medicineId)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-colors"
                  title="Remove from order"
                >
                  <svg
                    className="w-5 h-5"
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Summary Row */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Total Items: {items.reduce((sum, item) => sum + item.quantity, 0)}{" "}
            units
          </span>
          <span className="text-lg font-semibold text-gray-900">
            Subtotal: Rs.
            {items
              .reduce((sum, item) => sum + calculateItemTotal(item), 0)
              .toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default OrderTable;
