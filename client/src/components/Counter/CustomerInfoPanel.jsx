import React, { useState } from "react";

const CustomerInfoPanel = ({ customer, onCustomerSelect }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [customerData, setCustomerData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
  });

  const handleInputChange = (field, value) => {
    setCustomerData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    onCustomerSelect(customerData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCustomerData({
      name: customer?.name || "",
      phone: customer?.phone || "",
      email: customer?.email || "",
      address: customer?.address || "",
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Customer Information
          </h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {customer?.name ? "Edit" : "Add"}
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {!isEditing ? (
          // Display Mode
          customer?.name ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <p className="text-sm font-medium text-gray-900">
                  {customer.name}
                </p>
              </div>
              {customer.phone && (
                <div>
                  <label className="text-xs text-gray-500">Phone</label>
                  <p className="text-sm text-gray-900">{customer.phone}</p>
                </div>
              )}
              {customer.email && (
                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{customer.email}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <label className="text-xs text-gray-500">Address</label>
                  <p className="text-sm text-gray-900">{customer.address}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <svg
                className="mx-auto h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p className="text-sm text-gray-500 mt-2">No customer selected</p>
              <p className="text-xs text-gray-400">Customer info is optional</p>
            </div>
          )
        ) : (
          // Edit Mode
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={customerData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email (Optional)
              </label>
              <input
                type="email"
                value={customerData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (Optional)
              </label>
              <textarea
                value={customerData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                placeholder="Enter customer address"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Quick Customer Suggestions */}
        {!customer?.name && !isEditing && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-2">Quick options:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onCustomerSelect({ name: "Walk-in Customer" })}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                Walk-in Customer
              </button>
              <button
                onClick={() => onCustomerSelect({ name: "Cash Customer" })}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200"
              >
                Cash Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInfoPanel;
