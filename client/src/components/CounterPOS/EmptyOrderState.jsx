import React from "react";

const EmptyOrderState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <svg
        className="w-24 h-24 text-gray-300 mb-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth="1"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
      <h3 className="text-lg font-semibold text-gray-700 mb-1">No items yet</h3>
      <p className="text-sm text-gray-500">
        Search for medicines to add them to the order.
      </p>
    </div>
  );
};

export default EmptyOrderState;
