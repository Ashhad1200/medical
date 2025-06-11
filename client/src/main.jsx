import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Clear localStorage on development if there are issues
if (process.env.NODE_ENV === "development") {
  // Check for corrupted tokens and clear if necessary
  const token = localStorage.getItem("token");
  if (token) {
    try {
      // Simple check if token looks valid (JWT format)
      const parts = token.split(".");
      if (parts.length !== 3) {
        console.warn("Invalid token format found, clearing localStorage");
        localStorage.clear();
      }
    } catch (error) {
      console.warn("Error checking token, clearing localStorage");
      localStorage.clear();
    }
  }
}

// Add global error handler
window.addEventListener("error", (e) => {
  console.error("Global error:", e.error);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

console.log("Starting Medical Store POS System...");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
