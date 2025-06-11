import React from "react";

const QuickAccessMedicines = ({ medicines, onAddToCart }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("PKR", "Rs.");
  };

  const handleQuickAdd = (medicine) => {
    // For quick access, we'll simulate a medicine object
    // In a real app, you'd fetch the full medicine details
    const medicineData = {
      _id: medicine.id,
      name: medicine.name,
      retailPrice: medicine.price,
      tradePrice: medicine.price * 0.7, // Assuming 30% margin
      quantity: 100, // Simulated stock
      gstPerUnit: medicine.price * 0.12, // 12% GST
      manufacturer: "Quick Access",
      batchNumber: "QA001",
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    };

    onAddToCart(medicineData, 1);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Quick Access Medicines
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Commonly sold medicines for quick selection
        </p>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {medicines.map((medicine) => (
            <button
              key={medicine.id}
              onClick={() => handleQuickAdd(medicine)}
              className="group relative bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-lg p-4 text-center transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* Medicine Icon */}
              <div className="flex justify-center mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center group-hover:bg-blue-700 transition-colors">
                  <svg
                    className="w-5 h-5 text-white"
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
                </div>
              </div>

              {/* Medicine Name */}
              <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                {medicine.name}
              </h3>

              {/* Price */}
              <p className="text-xs text-green-600 font-medium">
                {formatCurrency(medicine.price)}
              </p>

              {/* Hover Effect */}
              <div className="absolute inset-0 rounded-lg border-2 border-transparent group-hover:border-blue-300 transition-colors"></div>
            </button>
          ))}
        </div>

        {/* Quick Add Instructions */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center text-sm text-gray-600">
            <svg
              className="w-4 h-4 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Click any medicine above to quickly add 1 unit to cart</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickAccessMedicines;
