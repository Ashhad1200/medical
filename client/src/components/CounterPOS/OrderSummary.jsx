import React from "react";
import OrderList from "./OrderList";
import TaxInput from "./TaxInput";
import TotalFooter from "./TotalFooter";
import EmptyOrderState from "./EmptyOrderState";

const OrderSummary = ({
  currentOrder,
  onUpdateQuantity,
  onRemoveItem,
  taxRate,
  onTaxRateChange,
  onCompleteOrder,
  onDownloadPDF,
  onResetOrder,
  isOpen, // For tablet/mobile drawer state
  onToggle, // To close tablet/mobile drawer
  isMobileView,
  isTabletView,
  className, // Allow passing additional classes
}) => {
  const subtotal = currentOrder.reduce((sum, item) => {
    const itemPrice = item.unitPrice * item.quantity;
    const discountAmount = itemPrice * (item.discount / 100);
    return sum + (itemPrice - discountAmount);
  }, 0);

  const taxAmount = subtotal * (taxRate / 100);
  const grandTotal = subtotal + taxAmount;

  const CloseButton = () => (
    <button
      onClick={onToggle} // This should close the drawer/panel
      className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition-colors p-1 bg-gray-100 rounded-full hover:bg-gray-200"
      aria-label="Close Order Summary"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="w-6 h-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18 18 6M6 6l12 12"
        />
      </svg>
    </button>
  );

  return (
    <div
      className={`bg-white flex flex-col h-full shadow-lg ${className || ""}`}
    >
      {(isMobileView || isTabletView) && isOpen && <CloseButton />}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">
          Order Summary
          <span className="text-sm font-normal text-gray-500 ml-2">
            #{(currentOrder.length > 0 && currentOrder[0]?.orderId) || "N/A"} -
            In Progress
          </span>
        </h2>
      </div>

      {currentOrder.length === 0 ? (
        <EmptyOrderState />
      ) : (
        <>
          <OrderList
            currentOrder={currentOrder}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
          <div className="p-4 mt-auto border-t border-gray-200">
            <TaxInput taxRate={taxRate} onTaxRateChange={onTaxRateChange} />
          </div>
        </>
      )}

      <TotalFooter
        subtotal={subtotal}
        taxAmount={taxAmount}
        grandTotal={grandTotal}
        onCompleteOrder={onCompleteOrder}
        onDownloadPDF={onDownloadPDF}
        onResetOrder={onResetOrder}
        disabled={currentOrder.length === 0}
      />
    </div>
  );
};

export default OrderSummary;
