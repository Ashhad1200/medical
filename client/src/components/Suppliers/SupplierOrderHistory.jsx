import React, { useState, useRef } from "react";

const SupplierOrderHistory = ({ show, onClose }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDateRange, setFilterDateRange] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const printRef = useRef();

  // Load order history from localStorage (will be replaced with API calls later)
  const [orderHistory, setOrderHistory] = useState(() => {
    const savedOrders = localStorage.getItem("supplierOrderHistory");
    return savedOrders
      ? JSON.parse(savedOrders)
      : [
          {
            id: "PO-1734221353070-abc123",
            orderId: "PO-001",
            supplierName: "MediCorp Pharmaceuticals",
            supplierContact: "Ahmed Khan",
            supplierPhone: "+92-300-1234567",
            supplierEmail: "ahmed@medicorp.pk",
            supplierCity: "Karachi",
            orderDate: "2024-12-10",
            expectedDelivery: "2024-12-17",
            status: "pending",
            items: [
              {
                name: "Paracetamol 500mg",
                quantity: 100,
                unitPrice: 2.5,
                total: 250.0,
                batchNumber: "BATCH-001",
              },
              {
                name: "Amoxicillin 250mg",
                quantity: 50,
                unitPrice: 8.0,
                total: 400.0,
                batchNumber: "BATCH-002",
              },
            ],
            subtotal: 650.0,
            tax: 117.0,
            grandTotal: 767.0,
            notes: "Urgent stock replenishment",
          },
          {
            id: "PO-1734221353071-def456",
            orderId: "PO-002",
            supplierName: "HealthPlus Distributors",
            supplierContact: "Fatima Ali",
            supplierPhone: "+92-321-9876543",
            supplierEmail: "fatima@healthplus.pk",
            supplierCity: "Lahore",
            orderDate: "2024-12-08",
            expectedDelivery: "2024-12-15",
            status: "delivered",
            items: [
              {
                name: "Ibuprofen 400mg",
                quantity: 75,
                unitPrice: 3.2,
                total: 240.0,
                batchNumber: "BATCH-003",
              },
              {
                name: "Cetirizine 10mg",
                quantity: 200,
                unitPrice: 1.5,
                total: 300.0,
                batchNumber: "BATCH-004",
              },
            ],
            subtotal: 540.0,
            tax: 97.2,
            grandTotal: 637.2,
            notes: "Regular monthly order",
          },
          {
            id: "PO-1734221353072-ghi789",
            orderId: "PO-003",
            supplierName: "PharmaTech Solutions",
            supplierContact: "Muhammad Hassan",
            supplierPhone: "+92-333-5555555",
            supplierEmail: "hassan@pharmatech.pk",
            supplierCity: "Islamabad",
            orderDate: "2024-12-05",
            expectedDelivery: "2024-12-12",
            status: "cancelled",
            items: [
              {
                name: "Omeprazole 20mg",
                quantity: 60,
                unitPrice: 4.5,
                total: 270.0,
                batchNumber: "BATCH-005",
              },
            ],
            subtotal: 270.0,
            tax: 48.6,
            grandTotal: 318.6,
            notes: "Cancelled due to supplier issues",
          },
        ];
  });

  // Refresh order history when modal opens
  React.useEffect(() => {
    if (show) {
      const savedOrders = localStorage.getItem("supplierOrderHistory");
      if (savedOrders) {
        setOrderHistory(JSON.parse(savedOrders));
      }
    }
  }, [show]);

  if (!show) return null;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "processing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-PK", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const filteredOrders = orderHistory.filter((order) => {
    const matchesSearch =
      order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.supplierContact.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" || order.status === filterStatus;

    let matchesDate = true;
    if (filterDateRange !== "all") {
      const orderDate = new Date(order.orderDate);
      const today = new Date();
      const daysDiff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));

      switch (filterDateRange) {
        case "today":
          matchesDate = daysDiff === 0;
          break;
        case "week":
          matchesDate = daysDiff <= 7;
          break;
        case "month":
          matchesDate = daysDiff <= 30;
          break;
        default:
          matchesDate = true;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  const handlePrintSelected = () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to print.");
      return;
    }

    const selectedOrdersData = orderHistory.filter((order) =>
      selectedOrders.includes(order.id)
    );
    const printContent = generatePrintHTML(selectedOrdersData);

    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownloadSelected = () => {
    if (selectedOrders.length === 0) {
      alert("Please select at least one order to download.");
      return;
    }

    const selectedOrdersData = orderHistory.filter((order) =>
      selectedOrders.includes(order.id)
    );
    const csvContent = generateCSVContent(selectedOrdersData);

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Inventory_Purchase_Orders_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const generatePrintHTML = (orders) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Supplier Order History Report</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #000; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          .header h1 { font-size: 24px; margin: 0 0 10px 0; }
          .order { border: 1px solid #ccc; margin-bottom: 20px; padding: 15px; }
          .order-header { background-color: #f5f5f5; padding: 10px; margin: -15px -15px 15px -15px; }
          .order-info { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .info-section { width: 48%; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
          .items-table th { background-color: #f0f0f0; }
          .summary { text-align: right; font-weight: bold; }
          .status { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
          .status-delivered { background-color: #d1fae5; color: #065f46; }
          .status-cancelled { background-color: #fee2e2; color: #991b1b; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>INVENTORY PURCHASE ORDERS REPORT</h1>
          <div>Medical Store POS System - Admin Dashboard</div>
          <div>Inventory Stock Replenishment Orders</div>
          <div>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
          <div>Total Orders: ${orders.length}</div>
        </div>

        ${orders
          .map(
            (order) => `
          <div class="order">
            <div class="order-header">
              <h3>Purchase Order ${order.orderId} - Supplier: ${
              order.supplierName
            }</h3>
              <span class="status status-${
                order.status
              }">${order.status.toUpperCase()}</span>
            </div>
            
            <div class="order-info">
              <div class="info-section">
                <h4>Order Details</h4>
                <div><strong>Order Date:</strong> ${formatDate(
                  order.orderDate
                )}</div>
                <div><strong>Expected Delivery:</strong> ${formatDate(
                  order.expectedDelivery
                )}</div>
                <div><strong>Status:</strong> ${order.status}</div>
                ${
                  order.notes
                    ? `<div><strong>Notes:</strong> ${order.notes}</div>`
                    : ""
                }
              </div>
              <div class="info-section">
                <h4>Supplier Information</h4>
                <div><strong>Name:</strong> ${order.supplierName}</div>
                <div><strong>Contact:</strong> ${order.supplierContact}</div>
                <div><strong>Phone:</strong> ${order.supplierPhone}</div>
                <div><strong>Email:</strong> ${order.supplierEmail}</div>
                <div><strong>City:</strong> ${order.supplierCity}</div>
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
                ${order.items
                  .map(
                    (item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.name}</td>
                    <td>${item.batchNumber}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td>${item.total.toFixed(2)}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="summary">
              <div>Subtotal: Rs. ${order.subtotal.toFixed(2)}</div>
              <div>Tax (GST 18%): Rs. ${order.tax.toFixed(2)}</div>
              <div style="border-top: 1px solid #000; padding-top: 5px; margin-top: 5px;">
                <strong>Grand Total: Rs. ${order.grandTotal.toFixed(2)}</strong>
              </div>
            </div>
          </div>
        `
          )
          .join("")}
      </body>
      </html>
    `;
  };

  const generateCSVContent = (orders) => {
    let csv =
      "Order ID,Supplier Name,Contact Person,Phone,Email,City,Order Date,Expected Delivery,Status,Subtotal,Tax,Grand Total,Notes\n";

    orders.forEach((order) => {
      csv += `"${order.orderId}","${order.supplierName}","${
        order.supplierContact
      }","${order.supplierPhone}","${order.supplierEmail}","${
        order.supplierCity
      }","${order.orderDate}","${order.expectedDelivery}","${order.status}","${
        order.subtotal
      }","${order.tax}","${order.grandTotal}","${order.notes || ""}"\n`;
    });

    return csv;
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Inventory Purchase Orders
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Admin dashboard for managing inventory stock replenishment orders
              placed with suppliers
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

        {/* Filters and Search */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Orders
              </label>
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
                  placeholder="Search by order ID, supplier name, or contact..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Range
              </label>
              <select
                value={filterDateRange}
                onChange={(e) => setFilterDateRange(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={handleSelectAll}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {selectedOrders.length === filteredOrders.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
              <span className="text-sm text-gray-600">
                {selectedOrders.length} of {filteredOrders.length} selected
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownloadSelected}
                disabled={selectedOrders.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📊 Download CSV
              </button>
              <button
                onClick={handlePrintSelected}
                disabled={selectedOrders.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖨️ Print Selected
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredOrders.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No inventory orders found
              </h3>
              <p className="mt-2 text-gray-500">
                No purchase orders have been placed for inventory replenishment
                yet. Try adjusting your search criteria or filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    selectedOrders.includes(order.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => handleSelectOrder(order.id)}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">
                            Purchase Order {order.orderId}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            INVENTORY RESTOCK
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Supplier Details
                            </h4>
                            <p className="text-gray-600">
                              {order.supplierName}
                            </p>
                            <p className="text-gray-500">
                              {order.supplierContact}
                            </p>
                            <p className="text-gray-500">
                              {order.supplierPhone}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Inventory Order Info
                            </h4>
                            <p className="text-gray-600">
                              Ordered: {formatDate(order.orderDate)}
                            </p>
                            <p className="text-gray-600">
                              Expected Delivery:{" "}
                              {formatDate(order.expectedDelivery)}
                            </p>
                            <p className="text-gray-600">
                              Medicine Items: {order.items.length}
                            </p>
                          </div>

                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">
                              Order Value
                            </h4>
                            <p className="text-gray-600">
                              Subtotal: Rs. {order.subtotal.toFixed(2)}
                            </p>
                            <p className="text-gray-600">
                              Tax (GST): Rs. {order.tax.toFixed(2)}
                            </p>
                            <p className="text-lg font-semibold text-green-600">
                              Total Cost: Rs. {order.grandTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {order.notes && (
                          <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                            <p className="text-sm text-yellow-800">
                              <span className="font-medium">Admin Note:</span>{" "}
                              {order.notes}
                            </p>
                          </div>
                        )}

                        {/* Admin Action Indicators */}
                        <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500">
                          <span className="flex items-center">
                            <svg
                              className="w-3 h-3 mr-1"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Ordered by Admin
                          </span>
                          <span>•</span>
                          <span>Inventory Replenishment</span>
                          <span>•</span>
                          <span>Auto-generated from stock alerts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SupplierOrderHistory;
