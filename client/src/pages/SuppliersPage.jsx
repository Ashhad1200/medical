import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supplierHistory, setSupplierHistory] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [currentOrder, setCurrentOrder] = useState([]);
  const [orderData, setOrderData] = useState({
    expectedDate: "",
    notes: "",
  });

  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    gstNumber: "",
  });

  useEffect(() => {
    fetchSuppliers();
    fetchMedicines();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/suppliers", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSuppliers(data?.data?.suppliers ?? []);
      } else {
        toast.error("Failed to fetch suppliers");
      }
    } catch (error) {
      toast.error("Error fetching suppliers");
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/medicines", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMedicines(data?.data?.medicines ?? []);
      }
    } catch (error) {
      console.error("Error fetching medicines:", error);
    }
  };

  const fetchSupplierHistory = async (supplierId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/suppliers/${supplierId}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSupplierHistory(data?.data?.orders ?? []);
      } else {
        toast.error("Failed to fetch supplier history");
      }
    } catch (error) {
      toast.error("Error fetching supplier history");
    }
  };

  const handleAddSupplier = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSupplier),
      });

      if (response.ok) {
        toast.success("Supplier added successfully");
        setShowAddSupplierModal(false);
        setNewSupplier({
          name: "",
          contactPerson: "",
          phone: "",
          email: "",
          address: "",
          gstNumber: "",
        });
        fetchSuppliers();
      } else {
        const error = await response.json();
        toast.error(error?.message ?? "Failed to add supplier");
      }
    } catch (error) {
      toast.error("Error adding supplier");
    }
  };

  const handleViewHistory = (supplier) => {
    setSelectedSupplier(supplier);
    fetchSupplierHistory(supplier?._id);
    setShowHistoryModal(true);
  };

  const handleCreateOrder = (supplier) => {
    setSelectedSupplier(supplier);
    setCurrentOrder([]);
    setOrderData({
      expectedDate: "",
      notes: "",
    });
    setShowOrderModal(true);
  };

  const addMedicineToOrder = (medicine) => {
    const existingItem = currentOrder.find(
      (item) => item.medicineId === medicine?._id
    );

    if (existingItem) {
      setCurrentOrder(
        currentOrder.map((item) =>
          item.medicineId === medicine?._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCurrentOrder([
        ...currentOrder,
        {
          medicineId: medicine?._id,
          name: medicine?.name ?? "",
          manufacturer: medicine?.manufacturer ?? "",
          quantity: 1,
          tradePrice: medicine?.tradePrice ?? 0,
          notes: "",
        },
      ]);
    }
    toast.success(`${medicine?.name ?? "Medicine"} added to order`);
  };

  const updateOrderItem = (medicineId, field, value) => {
    setCurrentOrder(
      currentOrder.map((item) =>
        item.medicineId === medicineId ? { ...item, [field]: value } : item
      )
    );
  };

  const removeFromOrder = (medicineId) => {
    setCurrentOrder(
      currentOrder.filter((item) => item.medicineId !== medicineId)
    );
  };

  const calculateOrderTotal = () => {
    return currentOrder.reduce((total, item) => {
      return total + (item?.quantity ?? 0) * (item?.tradePrice ?? 0);
    }, 0);
  };

  const handleSubmitOrder = async () => {
    if (currentOrder.length === 0) {
      toast.error("Please add medicines to the order");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/purchase-orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supplierId: selectedSupplier?._id,
          items: currentOrder,
          expectedDate: orderData.expectedDate,
          notes: orderData.notes,
          total: calculateOrderTotal(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success("Purchase order created successfully");
        setShowOrderModal(false);

        // Optional: Download PDF
        if (result?.data?.orderId) {
          downloadOrderPDF(result.data.orderId);
        }
      } else {
        const error = await response.json();
        toast.error(error?.message ?? "Failed to create order");
      }
    } catch (error) {
      toast.error("Error creating order");
    }
  };

  const downloadOrderPDF = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/purchase-orders/${orderId}/pdf`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `purchase-order-${orderId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success("PDF downloaded successfully");
      }
    } catch (error) {
      toast.error("Error downloading PDF");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Suppliers Management
            </h3>
            <button
              onClick={() => setShowAddSupplierModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Add New Supplier
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {suppliers?.map((supplier) => (
                <div
                  key={supplier?._id}
                  className="bg-gray-50 rounded-lg p-6 border hover:shadow-md transition-shadow"
                >
                  <h4
                    className="text-lg font-semibold text-blue-600 cursor-pointer hover:text-blue-800 mb-2"
                    onClick={() => handleViewHistory(supplier)}
                  >
                    {supplier?.name ?? "Unknown Supplier"}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>
                      <strong>Contact:</strong>{" "}
                      {supplier?.contactPerson ?? "N/A"}
                    </p>
                    <p>
                      <strong>Phone:</strong> {supplier?.phone ?? "N/A"}
                    </p>
                    <p>
                      <strong>Email:</strong> {supplier?.email ?? "N/A"}
                    </p>
                    <p>
                      <strong>Address:</strong> {supplier?.address ?? "N/A"}
                    </p>
                    {supplier?.gstNumber && (
                      <p>
                        <strong>GST:</strong> {supplier.gstNumber}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 flex space-x-2">
                    <button
                      onClick={() => handleViewHistory(supplier)}
                      className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300"
                    >
                      View History
                    </button>
                    <button
                      onClick={() => handleCreateOrder(supplier)}
                      className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700"
                    >
                      Create Order
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Add New Supplier
            </h2>
            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Supplier Name *
                </label>
                <input
                  type="text"
                  required
                  value={newSupplier?.name ?? ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={newSupplier?.contactPerson ?? ""}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      contactPerson: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={newSupplier?.phone ?? ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, phone: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={newSupplier?.email ?? ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, email: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  value={newSupplier?.address ?? ""}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, address: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number
                </label>
                <input
                  type="text"
                  value={newSupplier?.gstNumber ?? ""}
                  onChange={(e) =>
                    setNewSupplier({
                      ...newSupplier,
                      gstNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                >
                  Add Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier History Modal */}
      {showHistoryModal && selectedSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Trade History - {selectedSupplier?.name ?? "Unknown Supplier"}
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
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

            <div className="space-y-4">
              {supplierHistory?.length > 0 ? (
                supplierHistory.map((order) => (
                  <div key={order?._id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold">
                          Order #{order?._id?.slice(-8) ?? "N/A"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          Date:{" "}
                          {order?.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : "N/A"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Status:{" "}
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              order?.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : order?.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {order?.status ?? "unknown"}
                          </span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          Rs.{order?.total?.toFixed(2) ?? "0.00"}
                        </p>
                        <button
                          onClick={() => downloadOrderPDF(order?._id)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Download PDF
                        </button>
                      </div>
                    </div>
                    <div className="text-sm">
                      <p>
                        <strong>Items:</strong> {order?.items?.length ?? 0}
                      </p>
                      {order?.notes && (
                        <p>
                          <strong>Notes:</strong> {order.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No orders found for this supplier
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showOrderModal && selectedSupplier && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-6xl mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Create Order - {selectedSupplier?.name ?? "Unknown Supplier"}
              </h2>
              <button
                onClick={() => setShowOrderModal(false)}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Available Medicines */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Available Medicines
                </h3>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {medicines?.map((medicine) => (
                    <div
                      key={medicine?._id}
                      className="border rounded-lg p-3 flex justify-between items-center"
                    >
                      <div>
                        <h4 className="font-medium">
                          {medicine?.name ?? "Unknown Medicine"}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {medicine?.manufacturer ?? "Unknown Manufacturer"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Trade Price: Rs.{medicine?.tradePrice ?? 0}
                        </p>
                      </div>
                      <button
                        onClick={() => addMedicineToOrder(medicine)}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  Order Items ({currentOrder?.length ?? 0})
                </h3>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {currentOrder?.map((item) => (
                    <div
                      key={item?.medicineId}
                      className="border rounded-lg p-3"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">
                          {item?.name ?? "Unknown Medicine"}
                        </h4>
                        <button
                          onClick={() => removeFromOrder(item?.medicineId)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs text-gray-600">
                            Quantity
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item?.quantity ?? 1}
                            onChange={(e) =>
                              updateOrderItem(
                                item?.medicineId,
                                "quantity",
                                parseInt(e.target.value) || 1
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-600">
                            Trade Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item?.tradePrice ?? 0}
                            onChange={(e) =>
                              updateOrderItem(
                                item?.medicineId,
                                "tradePrice",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <label className="block text-xs text-gray-600">
                          Notes
                        </label>
                        <input
                          type="text"
                          value={item?.notes ?? ""}
                          onChange={(e) =>
                            updateOrderItem(
                              item?.medicineId,
                              "notes",
                              e.target.value
                            )
                          }
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Optional notes"
                        />
                      </div>
                      <div className="mt-2 text-right">
                        <span className="font-semibold">
                          Rs.
                          {(
                            (item?.quantity ?? 0) * (item?.tradePrice ?? 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Order Details */}
                <div className="mt-6 space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Delivery Date
                    </label>
                    <input
                      type="date"
                      value={orderData?.expectedDate ?? ""}
                      onChange={(e) =>
                        setOrderData({
                          ...orderData,
                          expectedDate: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Order Notes
                    </label>
                    <textarea
                      value={orderData?.notes ?? ""}
                      onChange={(e) =>
                        setOrderData({ ...orderData, notes: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows="3"
                      placeholder="Additional notes for this order"
                    />
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-semibold">
                        Total Amount:
                      </span>
                      <span className="text-xl font-bold text-blue-600">
                        Rs.{calculateOrderTotal().toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={handleSubmitOrder}
                      disabled={currentOrder?.length === 0}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Purchase Order & Generate PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
