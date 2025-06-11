import React from "react";

const ResetLink = ({ onClick, disabled = false, children, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-sm text-gray-600 hover:text-red-600 focus:outline-none focus:underline disabled:text-gray-400 disabled:cursor-not-allowed disabled:no-underline transition-colors duration-150 ease-in-out ${className}`.trim()}
    >
      {children}
    </button>
  );
};

export default ResetLink;
