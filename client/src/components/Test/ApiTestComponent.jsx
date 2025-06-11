import React, { useState } from "react";
import {
  useMedicines,
  useCreateMedicine,
  useUpdateMedicine,
  useDeleteMedicine,
} from "../../hooks/useMedicines";
import {
  useOrders,
  useCreateOrder,
  useOrderDashboard,
} from "../../hooks/useOrders";
import { useSuppliers, useCreateSupplier } from "../../hooks/useSuppliers";
import {
  usePurchaseOrders,
  useCreatePurchaseOrder,
  useReceivePurchaseOrder,
} from "../../hooks/usePurchaseOrders";
import { useDashboard } from "../../hooks/useDashboard";
import toast from "react-hot-toast";

const ApiTestComponent = () => {
  const [testResults, setTestResults] = useState({});

  // Hook instances
  const { data: medicines, isLoading: medicinesLoading } = useMedicines();
  const { data: orders, isLoading: ordersLoading } = useOrders();
  const { data: suppliers, isLoading: suppliersLoading } = useSuppliers();
  const { data: purchaseOrders, isLoading: poLoading } = usePurchaseOrders();
  const { orderData, isLoading: dashboardLoading } = useDashboard();

  // Mutation hooks
  const createMedicine = useCreateMedicine();
  const updateMedicine = useUpdateMedicine();
  const deleteMedicine = useDeleteMedicine();
  const createOrder = useCreateOrder();
  const createSupplier = useCreateSupplier();
  const createPurchaseOrder = useCreatePurchaseOrder();
  const receivePurchaseOrder = useReceivePurchaseOrder();

  const addTestResult = (test, result, error = null) => {
    setTestResults((prev) => ({
      ...prev,
      [test]: { result, error, timestamp: new Date().toISOString() },
    }));
  };

  const testMedicineOperations = async () => {
    try {
      // Test Create Medicine
      const newMedicine = {
        name: "Test Medicine API",
        manufacturer: "Test Pharma",
        batchNumber: "TEST001",
        retailPrice: 15.5,
        tradePrice: 10.0,
        gstPerUnit: 1.5,
        quantity: 50,
        expiryDate: new Date("2026-12-31"),
        category: "Test Category",
        description: "Test medicine for API verification",
        reorderThreshold: 10,
      };

      const createResult = await createMedicine.mutateAsync(newMedicine);
      addTestResult("createMedicine", "SUCCESS", null);

      if (createResult?.data?.medicine?.id) {
        const medicineId = createResult.data.medicine.id;

        // Test Update Medicine
        const updateData = { quantity: 75, retailPrice: 16.0 };
        await updateMedicine.mutateAsync({ id: medicineId, data: updateData });
        addTestResult("updateMedicine", "SUCCESS", null);

        // Wait a bit before delete
        setTimeout(async () => {
          try {
            await deleteMedicine.mutateAsync(medicineId);
            addTestResult("deleteMedicine", "SUCCESS", null);
          } catch (error) {
            addTestResult("deleteMedicine", "FAILED", error.message);
          }
        }, 2000);
      }
    } catch (error) {
      addTestResult("medicineOperations", "FAILED", error.message);
    }
  };

  const testOrderOperations = async () => {
    try {
      if (!medicines?.data?.medicines?.length) {
        addTestResult(
          "createOrder",
          "FAILED",
          "No medicines available for order"
        );
        return;
      }

      const firstMedicine = medicines.data.medicines[0];

      const newOrder = {
        customerName: "API Test Customer",
        items: [
          {
            medicineId: firstMedicine.id,
            qty: 2,
            discountPct: 5,
          },
        ],
        taxPercent: 10,
      };

      await createOrder.mutateAsync(newOrder);
      addTestResult("createOrder", "SUCCESS", null);
    } catch (error) {
      addTestResult("createOrder", "FAILED", error.message);
    }
  };

  const testSupplierOperations = async () => {
    try {
      const newSupplier = {
        name: "Test Supplier API",
        contactName: "John Test",
        phone: "+1-555-TEST",
        email: "test@supplier.com",
        address: "123 Test Street, Test City",
        notes: "Test supplier for API verification",
      };

      await createSupplier.mutateAsync(newSupplier);
      addTestResult("createSupplier", "SUCCESS", null);
    } catch (error) {
      addTestResult("createSupplier", "FAILED", error.message);
    }
  };

  const testPurchaseOrderOperations = async () => {
    try {
      if (
        !suppliers?.data?.suppliers?.length ||
        !medicines?.data?.medicines?.length
      ) {
        addTestResult(
          "createPurchaseOrder",
          "FAILED",
          "No suppliers or medicines available"
        );
        return;
      }

      const firstSupplier = suppliers.data.suppliers[0];
      const firstMedicine = medicines.data.medicines[0];

      const newPurchaseOrder = {
        supplierId: firstSupplier.id,
        items: [
          {
            medicineId: firstMedicine.id,
            name: firstMedicine.name,
            manufacturer: firstMedicine.manufacturer,
            quantity: 25,
            tradePrice: firstMedicine.tradePrice,
            notes: "Test purchase order item",
          },
        ],
        expectedDate: new Date("2025-07-01"),
        notes: "Test purchase order for API verification",
      };

      const result = await createPurchaseOrder.mutateAsync(newPurchaseOrder);
      addTestResult("createPurchaseOrder", "SUCCESS", null);

      if (result?.data?.purchaseOrder?.id) {
        // Test receiving purchase order
        setTimeout(async () => {
          try {
            await receivePurchaseOrder.mutateAsync(
              result.data.purchaseOrder.id
            );
            addTestResult("receivePurchaseOrder", "SUCCESS", null);
          } catch (error) {
            addTestResult("receivePurchaseOrder", "FAILED", error.message);
          }
        }, 3000);
      }
    } catch (error) {
      addTestResult("purchaseOrderOperations", "FAILED", error.message);
    }
  };

  const runAllTests = () => {
    setTestResults({});
    toast.success("Starting API tests...");

    testMedicineOperations();
    testOrderOperations();
    testSupplierOperations();
    testPurchaseOrderOperations();
  };

  const getStatusColor = (result) => {
    if (!result) return "text-gray-500";
    return result.result === "SUCCESS" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        React Query API Test Dashboard
      </h2>

      {/* Test Controls */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Run All CRUD Tests
        </button>
      </div>

      {/* Data Loading Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Medicines</h3>
          <p
            className={medicinesLoading ? "text-yellow-600" : "text-green-600"}
          >
            {medicinesLoading
              ? "Loading..."
              : `${medicines?.data?.medicines?.length || 0} loaded`}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Orders</h3>
          <p className={ordersLoading ? "text-yellow-600" : "text-green-600"}>
            {ordersLoading
              ? "Loading..."
              : `${orders?.data?.orders?.length || 0} loaded`}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Suppliers</h3>
          <p
            className={suppliersLoading ? "text-yellow-600" : "text-green-600"}
          >
            {suppliersLoading
              ? "Loading..."
              : `${suppliers?.data?.suppliers?.length || 0} loaded`}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Purchase Orders</h3>
          <p className={poLoading ? "text-yellow-600" : "text-green-600"}>
            {poLoading
              ? "Loading..."
              : `${purchaseOrders?.data?.purchaseOrders?.length || 0} loaded`}
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700">Dashboard</h3>
          <p
            className={dashboardLoading ? "text-yellow-600" : "text-green-600"}
          >
            {dashboardLoading ? "Loading..." : "Data loaded"}
          </p>
        </div>
      </div>

      {/* Test Results */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Test Results
        </h3>
        {Object.keys(testResults).length === 0 ? (
          <p className="text-gray-500">
            No tests run yet. Click "Run All CRUD Tests" to start.
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="flex justify-between items-center">
                <span className="font-medium">{test}:</span>
                <span className={getStatusColor(result)}>
                  {result.result}
                  {result.error && (
                    <span className="text-xs ml-2 text-gray-500">
                      ({result.error})
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dashboard Preview */}
      {orderData?.data && (
        <div className="mt-6 bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Live Dashboard Data
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {orderData.data.totalOrders}
              </p>
              <p className="text-sm text-gray-600">Total Orders</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                ${orderData.data.totalRevenue}
              </p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                ${orderData.data.totalProfit}
              </p>
              <p className="text-sm text-gray-600">Total Profit</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {orderData.data.lowStockMedicines}
              </p>
              <p className="text-sm text-gray-600">Low Stock Items</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiTestComponent;
