import React, { useRef, useEffect } from "react";

const OrderReceiptModal = ({
  show,
  onClose,
  orderData,
  supplier,
  items,
  total,
  onPrintComplete,
  autoPrint = false,
}) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const originalContents = document.body.innerHTML;

    // Create print styles
    const printStyles = `
      <style>
        @media print {
          body { 
            font-family: Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            color: #000;
          }
          .print-container { 
            max-width: 800px; 
            margin: 0 auto; 
          }
          .no-print { 
            display: none !important; 
          }
          .print-header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .print-section {
            margin-bottom: 25px;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          .print-table th,
          .print-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          .print-table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }
          .print-total {
            text-align: right;
            font-size: 18px;
            font-weight: bold;
            margin-top: 20px;
            border-top: 2px solid #000;
            padding-top: 10px;
          }
          .print-footer {
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 20px;
            text-align: center;
            font-size: 12px;
          }
        }
      </style>
    `;

    document.body.innerHTML = printStyles + printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload(); // Reload to restore the original page
  };

  useEffect(() => {
    if (autoPrint && show) {
      setTimeout(() => {
        handlePrint();
        if (onPrintComplete) onPrintComplete();
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, show]);

  if (!show) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateOrderId = () => {
    return (
      orderData.orderId ||
      orderData.purchaseOrder?.orderNumber ||
      `PO-${Date.now()}`
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 no-print">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Purchase Order Receipt
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Review and print your purchase order
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Receipt Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef} className="print-container">
            {/* Header */}
            <div className="print-header text-center border-b-2 border-gray-800 pb-6 mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                PURCHASE ORDER
              </h1>
              <div className="text-lg text-gray-700">
                <div className="font-semibold">Medical Store POS System</div>
                <div className="text-sm mt-1">Stock Replenishment Order</div>
              </div>
            </div>

            {/* Order Info */}
            <div className="print-section grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Order Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">Order ID:</span>
                    <span>{generateOrderId()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Order Date:</span>
                    <span>{formatDate(new Date())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Order Type:</span>
                    <span>Stock Replenishment</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <span className="text-yellow-600 font-medium">Pending</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Supplier Information
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>
                    <div className="text-gray-700">{supplier?.name}</div>
                  </div>
                  {supplier?.contactPerson && (
                    <div>
                      <span className="font-medium">Contact Person:</span>
                      <div className="text-gray-700">
                        {supplier.contactPerson}
                      </div>
                    </div>
                  )}
                  {supplier?.phone && (
                    <div>
                      <span className="font-medium">Phone:</span>
                      <div className="text-gray-700">{supplier.phone}</div>
                    </div>
                  )}
                  {supplier?.email && (
                    <div>
                      <span className="font-medium">Email:</span>
                      <div className="text-gray-700">{supplier.email}</div>
                    </div>
                  )}
                  {supplier?.address && (
                    <div>
                      <span className="font-medium">Address:</span>
                      <div className="text-gray-700">
                        {typeof supplier.address === "string"
                          ? supplier.address
                          : supplier.address
                          ? `${supplier.address.street || ""} ${
                              supplier.address.city || ""
                            } ${supplier.address.state || ""} ${
                              supplier.address.postalCode || ""
                            } ${supplier.address.country || ""}`.trim()
                          : "N/A"}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="print-section mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Items
              </h3>
              <div className="overflow-x-auto">
                <table className="print-table w-full border-collapse border border-gray-800">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-800 px-4 py-3 text-left font-semibold">
                        S.No.
                      </th>
                      <th className="border border-gray-800 px-4 py-3 text-left font-semibold">
                        Medicine Name
                      </th>
                      <th className="border border-gray-800 px-4 py-3 text-left font-semibold">
                        Manufacturer
                      </th>
                      <th className="border border-gray-800 px-4 py-3 text-left font-semibold">
                        Batch No.
                      </th>
                      <th className="border border-gray-800 px-4 py-3 text-center font-semibold">
                        Quantity
                      </th>
                      <th className="border border-gray-800 px-4 py-3 text-right font-semibold">
                        Unit Price
                      </th>
                      <th className="border border-gray-800 px-4 py-3 text-right font-semibold">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index} className="border-b border-gray-300">
                        <td className="border border-gray-800 px-4 py-3 text-center">
                          {index + 1}
                        </td>
                        <td className="border border-gray-800 px-4 py-3">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div>Quantity: {item.quantity} units</div>
                            <div>
                              Unit Price: Rs. {item.tradePrice.toFixed(2)}
                            </div>
                            <div className="font-medium">
                              Total: Rs.{" "}
                              {(item.quantity * item.tradePrice).toFixed(2)}
                            </div>
                            {item.expiryDate && (
                              <div className="text-xs text-gray-500">
                                Expiry:{" "}
                                {new Date(item.expiryDate).toLocaleDateString()}
                              </div>
                            )}
                            {item.batchNumber && (
                              <div className="text-xs text-gray-500">
                                Batch: {item.batchNumber}
                              </div>
                            )}
                            {item.notes && (
                              <div className="text-xs text-gray-500 italic">
                                Note: {item.notes}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-800 px-4 py-3">
                          {item.manufacturer}
                        </td>
                        <td className="border border-gray-800 px-4 py-3">
                          {item.batchNumber || "N/A"}
                        </td>
                        <td className="border border-gray-800 px-4 py-3 text-center font-medium">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-800 px-4 py-3 text-right">
                          Rs. {item.tradePrice.toFixed(2)}
                        </td>
                        <td className="border border-gray-800 px-4 py-3 text-right font-medium">
                          Rs. {(item.quantity * item.tradePrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t-2 border-gray-300 pt-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Order Summary
              </h3>

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-blue-50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {items.length}
                  </div>
                  <div className="text-sm text-gray-600">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {items.reduce((sum, item) => sum + item.quantity, 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Quantity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    Rs. {total.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Subtotal</div>
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="space-y-2">
                {/* Subtotal */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">
                    Subtotal ({items.length} items):
                  </span>
                  <span className="font-medium">Rs. {total.toFixed(2)}</span>
                </div>

                {/* Tax */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Tax (GST 18%):</span>
                  <span className="font-medium">
                    Rs. {(total * 0.18).toFixed(2)}
                  </span>
                </div>

                {/* Discount */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Discount:</span>
                  <span className="font-medium text-green-600">- Rs. 0.00</span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Shipping & Handling:</span>
                  <span className="font-medium">Rs. 0.00</span>
                </div>
              </div>

              {/* Grand Total */}
              <div className="border-t-2 border-gray-800 mt-4 pt-4 bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">
                    Grand Total:
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    Rs. {(total * 1.18).toFixed(2)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1 text-right">
                  (Including all taxes and charges)
                </div>
              </div>
            </div>

            {/* Payment Terms */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">
                Payment Terms & Conditions
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Payment due within 30 days of delivery</li>
                <li>• All prices are in Pakistani Rupees (PKR)</li>
                <li>• Goods once sold will not be taken back</li>
                <li>• Subject to Karachi jurisdiction</li>
              </ul>
            </div>

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                Thank you for your business!
              </p>
              <p className="text-xs text-gray-400 mt-1">
                This is a computer generated purchase order.
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 no-print">
          <div className="text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="text-green-600 font-medium">
                ✓ Order created successfully
              </span>
              <div className="text-xs text-gray-500">
                Order ID: {generateOrderId()}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(generateOrderId());
                alert("Order ID copied to clipboard!");
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              📋 Copy Order ID
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              🖨️ Print Receipt
            </button>
            <button
              onClick={() => {
                handlePrint();
                setTimeout(() => {
                  if (onPrintComplete) onPrintComplete();
                }, 1000);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              🖨️ Print & New Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReceiptModal;
