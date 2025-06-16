import React, { useState, useRef } from "react";

const SelectSupplierModal = ({
  show,
  onClose,
  suppliers,
  onSelect,
  onFinalize,
  orderItems,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);
  const receiptRef = useRef();

  if (!show) return null;

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.contactPerson
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      supplier.phone?.includes(searchQuery) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    const supplier = suppliers.find((s) => s._id === selectedSupplierId);
    if (supplier) {
      // Save order to history before proceeding
      saveOrderToHistory(supplier);
      onSelect(supplier);
    }
  };

  const handleFinalizeOrder = () => {
    if (!selectedSupplierId || orderItems.length === 0) {
      alert(
        "Please select a supplier and ensure you have items in your order."
      );
      return;
    }

    const supplier = suppliers.find((s) => s._id === selectedSupplierId);

    if (onFinalize) {
      onFinalize(supplier);
    }
  };

  const saveOrderToHistory = (supplier) => {
    const orderData = {
      id: generateOrderId(),
      orderId: `PO-${Date.now().toString().slice(-6)}`,
      supplierName: supplier.name,
      supplierContact: supplier.contactPerson || "N/A",
      supplierPhone: supplier.phone || "N/A",
      supplierEmail: supplier.email || "N/A",
      supplierCity: supplier.city || "N/A",
      orderDate: new Date().toISOString().split("T")[0],
      expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 7 days from now
      status: "pending",
      items: orderItems.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.tradePrice,
        total: item.quantity * item.tradePrice,
        batchNumber: item.batchNumber || "N/A",
        manufacturer: item.manufacturer || "N/A",
      })),
      subtotal: calculateOrderTotal(),
      tax: calculateOrderTotal() * 0.18,
      grandTotal: calculateOrderTotal(),
      notes: `Stock replenishment order - ${orderItems.length} items`,
    };

    // Save to localStorage for now (will be replaced with API call later)
    const existingOrders = JSON.parse(
      localStorage.getItem("supplierOrderHistory") || "[]"
    );
    existingOrders.unshift(orderData); // Add to beginning of array
    localStorage.setItem(
      "supplierOrderHistory",
      JSON.stringify(existingOrders)
    );

    console.log("Order saved to history:", orderData);
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + item.quantity * item.tradePrice;
    }, 0);
  };

  const generateOrderId = () => {
    return `PO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handlePrintReceipt = () => {
    if (!selectedSupplierId || orderItems.length === 0) {
      alert(
        "Please select a supplier and ensure you have items in your order."
      );
      return;
    }

    const supplier = suppliers.find((s) => s._id === selectedSupplierId);
    const printContent = generateReceiptHTML(supplier);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadSlip = () => {
    if (!selectedSupplierId || orderItems.length === 0) {
      alert(
        "Please select a supplier and ensure you have items in your order."
      );
      return;
    }

    const supplier = suppliers.find((s) => s._id === selectedSupplierId);
    const slipContent = generateSlipContent(supplier);

    const blob = new Blob([slipContent], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Purchase_Order_${generateOrderId()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generateReceiptHTML = (supplier) => {
    const orderId = generateOrderId();
    const total = calculateOrderTotal();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order Receipt - ${orderId}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #000;
            line-height: 1.4;
          }
          .header { 
            text-align: center; 
            border-bottom: 2px solid #000; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .header h1 { 
            font-size: 24px; 
            margin: 0 0 10px 0; 
            font-weight: bold; 
          }
          .info-section { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 30px; 
          }
          .info-box { 
            width: 45%; 
          }
          .info-box h3 { 
            font-size: 16px; 
            margin-bottom: 10px; 
            border-bottom: 1px solid #ccc; 
            padding-bottom: 5px; 
          }
          .info-item { 
            margin-bottom: 5px; 
            font-size: 14px; 
          }
          .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 30px; 
          }
          .items-table th, .items-table td { 
            border: 1px solid #000; 
            padding: 8px; 
            text-align: left; 
            font-size: 12px; 
          }
          .items-table th { 
            background-color: #f0f0f0; 
            font-weight: bold; 
          }
          .summary { 
            float: right; 
            width: 300px; 
            border: 1px solid #000; 
            padding: 15px; 
            margin-bottom: 30px; 
          }
          .summary-row { 
            display: flex; 
            justify-content: space-between; 
            margin-bottom: 8px; 
          }
          .total-row { 
            border-top: 2px solid #000; 
            padding-top: 8px; 
            font-weight: bold; 
            font-size: 16px; 
          }
          .footer { 
            clear: both; 
            text-align: center; 
            border-top: 1px solid #000; 
            padding-top: 20px; 
            margin-top: 40px; 
            font-size: 12px; 
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PURCHASE ORDER RECEIPT</h1>
          <div>Medical Store POS System</div>
          <div>Stock Replenishment Order</div>
        </div>

        <div class="info-section">
          <div class="info-box">
            <h3>Order Information</h3>
            <div class="info-item"><strong>Order ID:</strong> ${orderId}</div>
            <div class="info-item"><strong>Date:</strong> ${formatDate(
              new Date()
            )}</div>
            <div class="info-item"><strong>Type:</strong> Stock Replenishment</div>
            <div class="info-item"><strong>Status:</strong> Pending</div>
          </div>
          <div class="info-box">
            <h3>Supplier Information</h3>
            <div class="info-item"><strong>Name:</strong> ${supplier.name}</div>
            ${
              supplier.contactPerson
                ? `<div class="info-item"><strong>Contact:</strong> ${supplier.contactPerson}</div>`
                : ""
            }
            ${
              supplier.phone
                ? `<div class="info-item"><strong>Phone:</strong> ${supplier.phone}</div>`
                : ""
            }
            ${
              supplier.email
                ? `<div class="info-item"><strong>Email:</strong> ${supplier.email}</div>`
                : ""
            }
            ${
              supplier.city
                ? `<div class="info-item"><strong>City:</strong> ${supplier.city}</div>`
                : ""
            }
          </div>
        </div>

        <table class="items-table">
          <thead>
            <tr>
              <th>S.No.</th>
              <th>Medicine Name</th>
              <th>Batch No.</th>
              <th>Quantity</th>
              <th>Unit Price (Rs.)</th>
              <th>Total (Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems
              .map(
                (item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>
                  ${item.name}
                  ${
                    item.manufacturer
                      ? `<br><small>${item.manufacturer}</small>`
                      : ""
                  }
                  ${
                    item.notes
                      ? `<br><small><em>Note: ${item.notes}</em></small>`
                      : ""
                  }
                </td>
                <td>${item.batchNumber || "N/A"}</td>
                <td>${item.quantity}</td>
                <td>${item.tradePrice.toFixed(2)}</td>
                <td>${(item.quantity * item.tradePrice).toFixed(2)}</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row">
            <span>Subtotal:</span>
            <span>Rs. ${total.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Discount:</span>
            <span>Rs. 0.00</span>
          </div>
          <div class="summary-row total-row">
            <span>Grand Total:</span>
            <span>Rs. ${total.toFixed(2)}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Payment Terms:</strong> Payment due within 30 days of delivery</p>
          <p>All prices are in Pakistani Rupees (PKR) | Subject to Karachi jurisdiction</p>
          <p>Thank you for your business!</p>
          <p><small>Generated on ${formatDate(
            new Date()
          )} at ${new Date().toLocaleTimeString()}</small></p>
        </div>
      </body>
      </html>
    `;
  };

  const generateSlipContent = (supplier) => {
    const orderId = generateOrderId();
    const total = calculateOrderTotal();

    return `
PURCHASE ORDER SLIP
===================

Order ID: ${orderId}
Date: ${formatDate(new Date())}
Time: ${new Date().toLocaleTimeString()}

SUPPLIER INFORMATION
--------------------
Name: ${supplier.name}
${supplier.contactPerson ? `Contact Person: ${supplier.contactPerson}` : ""}
${supplier.phone ? `Phone: ${supplier.phone}` : ""}
${supplier.email ? `Email: ${supplier.email}` : ""}
${supplier.city ? `City: ${supplier.city}` : ""}

ORDER ITEMS
-----------
${orderItems
  .map(
    (item, index) => `
${index + 1}. ${item.name}
   Quantity: ${item.quantity} units
   Unit Price: Rs. ${item.tradePrice.toFixed(2)}
   Total: Rs. ${(item.quantity * item.tradePrice).toFixed(2)}
   ${item.batchNumber ? `Batch: ${item.batchNumber}` : ""}
   ${item.notes ? `Note: ${item.notes}` : ""}
`
  )
  .join("")}

ORDER SUMMARY
-------------
Subtotal: Rs. ${total.toFixed(2)}
Discount: Rs. 0.00
Grand Total: Rs. ${total.toFixed(2)}

PAYMENT TERMS
-------------
- Payment due within 30 days of delivery
- All prices are in Pakistani Rupees (PKR)
- Goods once sold will not be taken back
- Subject to Karachi jurisdiction

Generated by Medical Store POS System
${formatDate(new Date())} ${new Date().toLocaleTimeString()}
    `.trim();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Select Supplier
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a supplier for your purchase order
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

        <div className="flex h-[calc(90vh-120px)]">
          {/* Left Panel - Suppliers List */}
          <div className="w-2/3 border-r border-gray-200 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search suppliers by name, contact, phone, or city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Suppliers List */}
            <div className="flex-1 overflow-y-auto">
              {filteredSuppliers.length === 0 ? (
                <div className="p-8 text-center">
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
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">
                    No suppliers found
                  </h3>
                  <p className="mt-2 text-gray-500">
                    Try adjusting your search criteria.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredSuppliers.map((supplier) => (
                    <div
                      key={supplier._id}
                      onClick={() => setSelectedSupplierId(supplier._id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedSupplierId === supplier._id
                          ? "bg-blue-50 border-r-4 border-r-blue-500"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-medium text-gray-900 truncate">
                            {supplier.name}
                          </h4>
                          <div className="mt-1 space-y-1">
                            {supplier.contactPerson && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Contact:</span>{" "}
                                {supplier.contactPerson}
                              </p>
                            )}
                            {supplier.phone && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Phone:</span>{" "}
                                {supplier.phone}
                              </p>
                            )}
                            {supplier.email && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Email:</span>{" "}
                                {supplier.email}
                              </p>
                            )}
                            {supplier.city && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">City:</span>{" "}
                                {supplier.city}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="ml-4">
                          {selectedSupplierId === supplier._id && (
                            <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Order Summary */}
          <div className="w-1/3 flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Order Summary
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {orderItems.length} items • Rs.{" "}
                {calculateOrderTotal().toFixed(2)}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {item.name}
                    </h4>
                    <div className="mt-1 text-xs text-gray-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Quantity:</span>
                        <span className="font-medium">
                          {item.quantity} units
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price:</span>
                        <span className="font-medium">
                          Rs. {item.tradePrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-1">
                        <span>Total:</span>
                        <span className="font-medium">
                          Rs. {(item.quantity * item.tradePrice).toFixed(2)}
                        </span>
                      </div>
                      {item.notes && (
                        <div className="text-xs text-gray-500 italic">
                          Note: {item.notes}
                        </div>
                      )}
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
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Supplier Details */}
            {selectedSupplierId && (
              <div className="border-t border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Selected Supplier:
                </h4>
                {(() => {
                  const supplier = suppliers.find(
                    (s) => s._id === selectedSupplierId
                  );
                  return supplier ? (
                    <div className="bg-blue-50 rounded-lg p-3">
                      <h5 className="font-medium text-blue-900">
                        {supplier.name}
                      </h5>
                      <div className="mt-1 text-sm text-blue-800 space-y-1">
                        {supplier.contactPerson && (
                          <div>{supplier.contactPerson}</div>
                        )}
                        {supplier.phone && <div>{supplier.phone}</div>}
                        {supplier.email && <div>{supplier.email}</div>}
                        {supplier.address && (
                          <div className="text-xs">
                            {typeof supplier.address === "string"
                              ? supplier.address
                              : `${supplier.address.street || ""} ${
                                  supplier.address.city || ""
                                } ${supplier.address.state || ""} ${
                                  supplier.address.postalCode || ""
                                } ${supplier.address.country || ""}`.trim()}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>
            )}

            {/* Receipt Preview */}
            {selectedSupplierId && orderItems.length > 0 && (
              <div className="border-t border-gray-200 p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Receipt Preview:
                </h4>
                <div className="bg-green-50 rounded-lg p-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Items:</span>
                      <span className="font-medium">{orderItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-medium">
                        Rs. {calculateOrderTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-green-200 pt-2 text-lg font-semibold">
                      <span>Total:</span>
                      <span>Rs. {calculateOrderTotal().toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-green-200 text-center">
                    <div className="text-green-700 font-medium">
                      Ready to finalize order
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Print, download, or finalize purchase order (no tax)
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons (visible without scrolling) */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={handleDownloadSlip}
                    disabled={!selectedSupplierId || orderItems.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    📄 Download Slip
                  </button>
                  <button
                    onClick={handlePrintReceipt}
                    disabled={!selectedSupplierId || orderItems.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    🖨️ Print
                  </button>
                  <button
                    onClick={handleFinalizeOrder}
                    disabled={!selectedSupplierId || orderItems.length === 0}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    ✅ Finalize
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {selectedSupplierId ? (
              <div className="space-y-1">
                <span className="text-green-600 font-medium">
                  ✅ Ready to finalize order
                </span>
                <div className="text-xs text-gray-500">
                  {orderItems.length} items • Subtotal: Rs.{" "}
                  {calculateOrderTotal().toFixed(2)} • Total: Rs.{" "}
                  {(calculateOrderTotal() * 1.18).toFixed(2)}
                </div>
              </div>
            ) : (
              "Please select a supplier to continue"
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectSupplierModal;
