import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";
import { useAuth } from "./hooks/useAuth";

// Components
import LoginPage from "./pages/LoginPage";
import DashboardLayout from "./components/Layout/DashboardLayout";
import CounterDashboard from "./pages/CounterDashboard";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailPage from "./pages/OrderDetailPage";
import MedicinesPage from "./pages/MedicinesPage";
import AdminDashboard from "./pages/AdminDashboard";
import InventoryPage from "./pages/InventoryPage";
import SuppliersPage from "./pages/SuppliersPage";
import UsersPage from "./pages/UsersPage";
import LoadingSpinner from "./components/UI/LoadingSpinner";

// Test Component (Development only)
import ApiTestComponent from "./components/Test/ApiTestComponent";

// Startup Screen Component
const StartupScreen = ({ onContinue }) => {
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    // Test API connection
    const apiUrl = import.meta.env.VITE_API_URL || "/api";
    fetch(`${apiUrl}/auth/status`)
      .then((response) => {
        if (response.status === 401) {
          setApiStatus("connected");
        } else if (response.ok) {
          setApiStatus("connected");
        } else {
          setApiStatus("error: " + response.status);
        }
      })
      .catch((error) => {
        setApiStatus("disconnected");
        console.error("API connection failed:", error);
      });
  }, []);

  const clearAndRestart = () => {
    localStorage.clear();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="h-8 w-8 text-white"
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
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Moiz Medical Store
          </h1>
          <p className="text-gray-600">Starting application...</p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Backend API:</span>
            <span
              className={`text-sm px-2 py-1 rounded ${
                apiStatus === "connected"
                  ? "bg-green-100 text-green-800"
                  : apiStatus === "checking"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {apiStatus}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Frontend:</span>
            <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-800">
              Ready
            </span>
          </div>

          <div className="pt-4 space-y-2">
            <button
              onClick={onContinue}
              disabled={apiStatus !== "connected"}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Application
            </button>

            <button
              onClick={clearAndRestart}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200"
            >
              Clear Data & Restart
            </button>
          </div>

          <div className="pt-4 text-xs text-gray-500 space-y-1">
            <p>
              <strong>Demo Credentials:</strong>
            </p>
            <p>Admin: admin / admin123</p>
            <p>Counter: counter / counter123</p>
            <p>Warehouse: warehouse / warehouse123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { user, isLoading, initialized } = useAuth();

  // Show loading while authentication is being initialized
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Authenticating..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

// App Routes Component
const AppRoutes = () => {
  const { user, isLoading, initialized } = useAuth();

  // Show loading screen while checking authentication
  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner text="Initializing application..." />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />}
      />

      {/* Development Test Route */}
      {process.env.NODE_ENV === "development" && (
        <Route
          path="/api-test"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-100 py-8">
                <ApiTestComponent />
              </div>
            </ProtectedRoute>
          }
        />
      )}

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard Routes based on Role */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            user?.role === "admin" ? <AdminDashboard /> : <CounterDashboard />
          }
        />

        {/* Orders Routes - Admin only (counter staff should not see order history) */}
        <Route
          path="orders"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Medicine Routes - Accessible by all roles */}
        <Route
          path="medicines"
          element={
            <ProtectedRoute requiredRoles={["counter", "warehouse", "admin"]}>
              <MedicinesPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory Routes - Accessible by warehouse and admin */}
        <Route
          path="inventory"
          element={
            <ProtectedRoute requiredRoles={["warehouse", "admin"]}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        {/* Supplier Routes - Accessible by warehouse and admin */}
        <Route
          path="suppliers"
          element={
            <ProtectedRoute requiredRoles={["warehouse", "admin"]}>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Only Routes */}
        <Route
          path="users"
          element={
            <ProtectedRoute requiredRoles={["admin"]}>
              <UsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback Routes */}
      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Access Denied
              </h1>
              <p className="text-gray-600 mb-4">
                You don't have permission to access this page.
              </p>
              <p className="text-sm text-gray-500">
                Current role: {user?.role || "Not logged in"}
              </p>
            </div>
          </div>
        }
      />

      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                <svg
                  className="h-6 w-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                404 - Page Not Found
              </h1>
              <p className="text-gray-600 mb-4">
                The page you're looking for doesn't exist.
              </p>
              <button
                onClick={() => window.history.back()}
                className="text-blue-600 hover:text-blue-800"
              >
                Go back
              </button>
            </div>
          </div>
        }
      />
    </Routes>
  );
};

// Main App Component
const App = () => {
  const [showStartup, setShowStartup] = useState(
    process.env.NODE_ENV === "development"
  );

  if (showStartup) {
    return <StartupScreen onContinue={() => setShowStartup(false)} />;
  }

  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "#363636",
                  color: "#fff",
                },
              }}
            />
            <ReactQueryDevtools initialIsOpen={false} />
          </div>
        </Router>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
