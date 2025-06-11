import React from "react";
import { toast } from "react-hot-toast";

const ReceiptModal = ({ show, onClose, orderId, orderData }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 2,
    })
      .format(amount)
      .replace("PKR", "Rs.");
  };

  const handlePrint = () => {
    const printContent = document.getElementById("receipt-content");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${orderId}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin: 5px 0; }
            .total { border-top: 1px solid #ccc; padding-top: 10px; margin-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  const handleDownload = () => {
    if (!orderData) {
      toast.error("No order data available for download");
      return;
    }

    // Create a simple text receipt
    const receiptText = generateReceiptText();

    // Create and download as text file
    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `receipt-${orderId || "order"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("Receipt downloaded successfully!");
  };

  const downloadPDF = async () => {
    if (!orderId || orderId === "undefined") {
      toast.error("Invalid order ID for PDF download");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/orders/${orderId}/receipt`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/pdf")) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `receipt-${orderId}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          toast.success("PDF receipt downloaded successfully!");
        } else {
          toast.error("Failed to generate PDF receipt");
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to download PDF receipt");
      }
    } catch (error) {
      toast.error("Error downloading PDF receipt");
      console.error("PDF download error:", error);
    }
  };

  const generateReceiptText = () => {
    const currentDate = new Date(orderData?.timestamp || new Date());
    let text = "";

    text += "========================================\n";
    text += "              MedStore Plus             \n";
    text += "        Your Trusted Medical Store     \n";
    text += "========================================\n";
    text += "123 Medical Street, Health City\n";
    text += "Phone: +92-300-1234567\n";
    text += "License: MED-2024-001\n";
    text += "========================================\n\n";

    text += `Receipt #: ${orderId || "N/A"}\n`;
    text += `Date: ${currentDate.toLocaleDateString()}\n`;
    text += `Time: ${currentDate.toLocaleTimeString()}\n`;

    if (orderData?.customer?.name) {
      text += `Customer: ${orderData.customer.name}\n`;
    }
    if (orderData?.customer?.phone) {
      text += `Phone: ${orderData.customer.phone}\n`;
    }

    text += "\n========================================\n";
    text += "                 ITEMS                  \n";
    text += "========================================\n";

    orderData?.items?.forEach((item, index) => {
      text += `${index + 1}. ${item.name}\n`;
      text += `   Qty: ${item.quantity} × ${formatCurrency(item.unitPrice)}`;
      if (item.discountPercent > 0) {
        text += ` (${item.discountPercent}% off)`;
      }
      text += "\n";
      const itemTotal =
        item.unitPrice * item.quantity -
        (item.unitPrice * item.quantity * (item.discountPercent || 0)) / 100;
      text += `   Total: ${formatCurrency(itemTotal)}\n\n`;
    });

    text += "========================================\n";
    text += `Subtotal:        ${formatCurrency(
      orderData?.totals?.subtotal || 0
    )}\n`;

    if (orderData?.totals?.globalDiscount > 0) {
      text += `Discount:       -${formatCurrency(
        orderData.totals.globalDiscount
      )}\n`;
    }

    text += `Tax:             ${formatCurrency(
      orderData?.totals?.taxAmount || 0
    )}\n`;
    text += "----------------------------------------\n";
    text += `TOTAL:           ${formatCurrency(
      orderData?.totals?.grandTotal || 0
    )}\n`;
    text += "========================================\n\n";

    text += `Payment Method: ${orderData?.paymentMethod || "Cash"}\n\n`;

    text += "========================================\n";
    text += "       Thank you for your business!    \n";
    text += "     For queries, call: +92-300-1234567\n";
    text += "   Email: support@medstoreplus.com     \n";
    text += "                                       \n";
    text += "Please check medicines before leaving  \n";
    text += "            the store                  \n";
    text += "========================================\n";

    return text;
  };

  if (!show) return null;

  const currentDate = new Date(orderData?.timestamp || new Date());
  const receiptNumber = orderId || `RCP-${Date.now()}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Receipt</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
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
        <div className="p-6" id="receipt-content">
          {/* Store Header */}
          <div className="text-center mb-6 border-b border-gray-200 pb-4">
            <h1 className="text-xl font-bold text-gray-900">MedStore Plus</h1>
            <p className="text-sm text-gray-600">Your Trusted Medical Store</p>
            <p className="text-xs text-gray-500 mt-1">
              123 Medical Street, Health City
              <br />
              Phone: +92-300-1234567
              <br />
              License: MED-2024-001
            </p>
          </div>

          {/* Receipt Details */}
          <div className="mb-4 text-sm">
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Receipt #:</span>
              <span className="font-medium">{receiptNumber}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Date:</span>
              <span>{currentDate.toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between mb-1">
              <span className="text-gray-600">Time:</span>
              <span>{currentDate.toLocaleTimeString()}</span>
            </div>
            {orderData?.customer?.name && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Customer:</span>
                <span>{orderData.customer.name}</span>
              </div>
            )}
            {orderData?.customer?.phone && (
              <div className="flex justify-between mb-1">
                <span className="text-gray-600">Phone:</span>
                <span>{orderData.customer.phone}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="border-t border-b border-gray-200 py-4 mb-4">
            <h3 className="font-medium text-gray-900 mb-3">Items Purchased</h3>
            <div className="space-y-2">
              {orderData?.items?.map((item, index) => (
                <div key={index} className="text-sm">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-600">
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                        {item.discountPercent > 0 && (
                          <span className="text-red-600 ml-1">
                            ({item.discountPercent}% off)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {formatCurrency(
                          item.unitPrice * item.quantity -
                            (item.unitPrice *
                              item.quantity *
                              (item.discountPercent || 0)) /
                              100
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span>{formatCurrency(orderData?.totals?.subtotal || 0)}</span>
            </div>

            {orderData?.totals?.globalDiscount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-{formatCurrency(orderData.totals.globalDiscount)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span>{formatCurrency(orderData?.totals?.taxAmount || 0)}</span>
            </div>

            <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-lg">
              <span>Total:</span>
              <span>{formatCurrency(orderData?.totals?.grandTotal || 0)}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Payment Method:</span>
              <span className="capitalize">
                {orderData?.paymentMethod || "Cash"}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t border-gray-200 pt-4">
            <p className="mb-2">Thank you for your business!</p>
            <p>For queries, call: +92-300-1234567</p>
            <p>Email: support@medstoreplus.com</p>
            <p className="mt-2 font-medium">
              Please check medicines before leaving the store
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Print Receipt
            </button>

            <button
              onClick={downloadPDF}
              className="flex items-center justify-center px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Download PDF
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center justify-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <svg
                className="w-4 h-4 mr-2"
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
              Download Text
            </button>

            <button
              onClick={onClose}
              className="px-3 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
