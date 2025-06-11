import React from "react";

const POSButton = ({
  children,
  onClick,
  type = "button",
  variant = "solid", // 'solid', 'outline', 'text'
  color = "blue", // 'blue', 'red', 'gray'
  size = "md", // 'sm', 'md', 'lg'
  disabled = false,
  fullWidth = false,
  className = "",
}) => {
  let baseStyle =
    "font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 ease-in-out shadow-sm hover:shadow disabled:cursor-not-allowed disabled:opacity-60";

  let variantStyle = "";
  if (variant === "solid") {
    if (color === "blue")
      variantStyle =
        "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500";
    else if (color === "red")
      variantStyle =
        "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";
    else
      variantStyle =
        "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500"; // Default solid
  } else if (variant === "outline") {
    if (color === "blue")
      variantStyle =
        "border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500";
    else if (color === "red")
      variantStyle =
        "border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500";
    else
      variantStyle =
        "border border-gray-400 text-gray-700 hover:bg-gray-100 focus:ring-gray-500"; // Default outline
  } else {
    // text variant
    baseStyle =
      "font-medium rounded-md focus:outline-none focus:ring-1 disabled:cursor-not-allowed disabled:opacity-60 transition-colors duration-150 ease-in-out"; // Text buttons usually have simpler base
    if (color === "blue")
      variantStyle =
        "text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:ring-blue-500";
    else if (color === "red")
      variantStyle =
        "text-red-600 hover:text-red-800 hover:bg-red-50 focus:ring-red-500";
    else
      variantStyle =
        "text-gray-600 hover:text-gray-800 hover:bg-gray-100 focus:ring-gray-500"; // Default text
  }

  let sizeStyle = "";
  if (size === "sm") sizeStyle = "px-3 py-1.5 text-xs";
  else if (size === "lg") sizeStyle = "px-6 py-3 text-lg";
  else sizeStyle = "px-4 py-2 text-sm"; // md default

  const widthStyle = fullWidth ? "w-full" : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${widthStyle} ${className}`.trim()}
    >
      {children}
    </button>
  );
};

export default POSButton;
