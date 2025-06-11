import React from "react";

const OrderSummary = ({
  subtotal,
  taxAmount,
  grandTotal,
  profit,
  onDownloadReceipt,
  onSaveOrder,
  onCompleteOrder,
  isProcessing,
}) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Order Summary
      </h3>

      {/* Pricing Breakdown */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center py-2">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium">Rs.{subtotal.toFixed(2)}</span>
        </div>

        {taxAmount > 0 && (
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600">Tax:</span>
            <span className="font-medium">Rs.{taxAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Grand Total:
            </span>
            <span className="text-xl font-bold text-green-600">
              Rs.{grandTotal.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-blue-800">
              Expected Profit:
            </span>
            <span className="text-lg font-bold text-blue-600">
              Rs.{profit.toFixed(2)}
            </span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Based on retail vs trade price difference
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {/* Download Receipt Button */}
        <button
          onClick={onDownloadReceipt}
          disabled={isProcessing}
          className="w-full px-4 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            Download Receipt (PDF)
          </div>
        </button>

        {/* Save Order Button */}
        <button
          onClick={onSaveOrder}
          disabled={isProcessing}
          className="w-full px-4 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            {isProcessing ? "Saving..." : "Save Order (Draft)"}
          </div>
        </button>

        {/* Complete Order Button */}
        <button
          onClick={onCompleteOrder}
          disabled={isProcessing}
          className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center justify-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {isProcessing ? "Processing..." : "Complete Order"}
          </div>
        </button>
      </div>

      {/* Additional Information */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Order Options:
        </h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>
            • <strong>Save Order:</strong> Save as draft for later completion
          </li>
          <li>
            • <strong>Complete Order:</strong> Finalize sale and update
            inventory
          </li>
          <li>
            • <strong>Download Receipt:</strong> Generate PDF receipt for
            customer
          </li>
        </ul>
      </div>

      {/* Payment Methods */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Payment Methods:
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-blue-800">Cash</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-blue-800">Card</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-xs text-blue-800">UPI</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-xs text-blue-800">Credit</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="text-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
          <div className="text-sm font-medium text-blue-800">Profit Margin</div>
          <div className="text-lg font-bold text-blue-600">
            {subtotal > 0 ? ((profit / subtotal) * 100).toFixed(1) : 0}%
          </div>
        </div>
        <div className="text-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
          <div className="text-sm font-medium text-green-800">
            Total Savings
          </div>
          <div className="text-lg font-bold text-green-600">
            Rs.{(grandTotal - subtotal + taxAmount).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
