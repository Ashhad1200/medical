import React from "react";
import POSButton from "./POSButton";

const POSModal = ({
  isOpen,
  onClose,
  title,
  children, // Content of the modal
  onConfirm,
  confirmText = "Confirm",
  confirmColor = "blue",
  cancelText = "Cancel",
  showConfirm = true,
  showCancel = true,
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-60 transition-opacity duration-300 ease-in-out"
      onClick={onClose} // Close on backdrop click
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-md w-full m-auto transform transition-all duration-300 ease-in-out scale-95 opacity-0 animate-modal-scale-in"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside modal content
      >
        <div className="p-6">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 mb-4 leading-6">
              {title}
            </h3>
          )}
          <div className="text-sm text-gray-600">{children}</div>
        </div>

        {(showConfirm || showCancel) && (
          <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            {showConfirm && (
              <POSButton
                onClick={onConfirm}
                color={confirmColor}
                disabled={isProcessing}
                className="w-full sm:ml-3 sm:w-auto"
              >
                {isProcessing ? "Processing..." : confirmText}
              </POSButton>
            )}
            {showCancel && (
              <POSButton
                onClick={onClose}
                variant="outline"
                color="gray"
                disabled={isProcessing}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
              >
                {cancelText}
              </POSButton>
            )}
          </div>
        )}
      </div>
      {/* Add CSS for animation if not already present globally */}
      <style jsx global>{`
        @keyframes modal-scale-in {
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-modal-scale-in {
          animation: modal-scale-in 0.2s forwards ease-out;
        }
      `}</style>
    </div>
  );
};

export default POSModal;
