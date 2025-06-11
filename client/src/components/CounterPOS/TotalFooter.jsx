import React from "react";
import POSButton from "./POSButton";
import ResetLink from "./ResetLink";

const TotalFooter = ({
  subtotal,
  taxAmount,
  grandTotal,
  onCompleteOrder,
  onDownloadPDF,
  onResetOrder,
  disabled = false,
}) => {
  return (
    <div className="p-4 border-t border-gray-200 bg-gray-50 sticky bottom-0">
      <div className="space-y-1 mb-4 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal:</span>
          <span className="font-medium text-gray-800">
            Rs.{subtotal.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Tax:</span>
          <span className="font-medium text-gray-800">
            Rs.{taxAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-300">
          <span className="text-lg font-semibold text-gray-900">
            Grand Total:
          </span>
          <span className="text-xl font-bold text-blue-600">
            Rs.{grandTotal.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        <POSButton
          onClick={onCompleteOrder}
          disabled={disabled}
          fullWidth
          aria-label="Save and Complete Order"
        >
          Save & Complete
        </POSButton>
        <div className="flex space-x-2">
          <POSButton
            onClick={onDownloadPDF}
            disabled={disabled}
            variant="outline"
            fullWidth
            aria-label="Download PDF Receipt"
          >
            Download PDF
          </POSButton>
          <ResetLink
            onClick={onResetOrder}
            disabled={disabled}
            className="w-full text-center"
          >
            Reset Order
          </ResetLink>
        </div>
      </div>
    </div>
  );
};

export default TotalFooter;
