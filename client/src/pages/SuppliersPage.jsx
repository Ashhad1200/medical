import React, { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  medicineServices,
  supplierServices,
  purchaseOrderServices,
} from "../services/api";

// Import components
import OutOfStockTable from "../components/Suppliers/OutOfStockTable";
import StockFilters from "../components/Suppliers/StockFilters";
import AddQuantityModal from "../components/Suppliers/AddQuantityModal";
import SelectSupplierModal from "../components/Suppliers/SelectSupplierModal";
import OrderReceiptModal from "../components/Suppliers/OrderReceiptModal";
import SupplierOrderHistory from "../components/Suppliers/SupplierOrderHistory";
import AddSupplierModal from "../components/Suppliers/AddSupplierModal";
import { useCreateSupplier } from "../hooks/useSuppliers";

const SuppliersPage = () => {
  // State management
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [stockFilter, setStockFilter] = useState("out-of-stock"); // out-of-stock, low-stock, all

  // Cart for purchase order
  const [orderCart, setOrderCart] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [orderData, setOrderData] = useState({
    expectedDate: "",
    notes: "",
  });

  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    website: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const createSupplierMutation = useCreateSupplier();

  // Build API filters for medicines
  const filters = useMemo(() => {
    const apiFilters = {
      sortBy,
      sortOrder,
      page: currentPage,
      limit: itemsPerPage,
      includeExpired: false, // Don't include expired items
    };

    if (searchQuery.length >= 2) {
      apiFilters.search = searchQuery;
    }

    // Filter by stock status
    switch (stockFilter) {
      case "out-of-stock":
        apiFilters.outOfStock = true;
        break;
      case "low-stock":
        apiFilters.lowStock = true;
        break;
      case "all":
        // Show all items that need restocking (out of stock + low stock)
        apiFilters.needsRestocking = true;
        break;
      default:
        apiFilters.outOfStock = true;
    }

    return apiFilters;
  }, [searchQuery, sortBy, sortOrder, currentPage, itemsPerPage, stockFilter]);

  // React Query hooks
  const queryClient = useQueryClient();

  const {
    data: medicinesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["medicines", filters],
    queryFn: () => medicineServices.getAll(filters).then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes for stock data
    keepPreviousData: true,
  });

  // Fetch suppliers for selection
  const { data: suppliersData } = useQuery({
    queryKey: ["suppliers", { limit: 100 }],
    queryFn: () =>
      supplierServices.getAll({ limit: 100 }).then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });

  // Create purchase order mutation
  const createOrderMutation = useMutation({
    mutationFn: (orderData) => purchaseOrderServices.create(orderData),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["medicines"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast.success("Purchase order created successfully!");

      // Success is handled in handleCreateOrder function
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create order";
      toast.error(message);
      console.error("Purchase order creation error:", error);
    },
  });

  // Extract data
  const medicines = medicinesData?.data?.medicines || [];
  const pagination = medicinesData?.data?.pagination || {};
  const suppliers = suppliersData?.data?.suppliers || [];

  // Event handlers
  const handleAddQuantity = (medicine) => {
    setSelectedMedicine(medicine);
    setShowQuantityModal(true);
  };

  const handleQuantitySubmit = (quantity, notes, expiryDate, batchNumber) => {
    const existingItem = orderCart.find(
      (item) => item.medicineId === selectedMedicine._id
    );

    if (existingItem) {
      setOrderCart(
        orderCart.map((item) =>
          item.medicineId === selectedMedicine._id
            ? {
                ...item,
                quantity: quantity,
                notes: notes,
                expiryDate: expiryDate,
                batchNumber: batchNumber,
              }
            : item
        )
      );
      toast.success(`Updated quantity for ${selectedMedicine.name}`);
    } else {
      const newItem = {
        medicineId: selectedMedicine._id,
        name: selectedMedicine.name,
        manufacturer: selectedMedicine.manufacturer,
        batchNumber: batchNumber || selectedMedicine.batchNumber,
        quantity: quantity,
        tradePrice: selectedMedicine.tradePrice || 0,
        notes: notes,
        expiryDate: expiryDate,
        currentStock: selectedMedicine.quantity,
        minStockLevel: selectedMedicine.minStockLevel || 10,
      };
      setOrderCart([...orderCart, newItem]);
      toast.success(`Added ${selectedMedicine.name} to order`);
    }

    setShowQuantityModal(false);
    setSelectedMedicine(null);
  };

  const handleRemoveFromCart = (medicineId) => {
    setOrderCart(orderCart.filter((item) => item.medicineId !== medicineId));
    toast.success("Item removed from order");
  };

  const handleProceedToSupplier = () => {
    if (orderCart.length === 0) {
      toast.error("Please add items to your order first");
      return;
    }
    setShowSupplierModal(true);
  };

  // Finalize order -> create PO in backend
  const finalizePurchaseOrder = async (supplier) => {
    try {
      const orderPayload = {
        supplierId: supplier._id,
        items: orderCart.map((item) => ({
          medicineId: item.medicineId,
          name: item.name,
          manufacturer: item.manufacturer,
          quantity: item.quantity,
          unitPrice: item.tradePrice,
          batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
          expiryDate:
            item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          notes: item.notes || "",
        })),
        expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `Stock order via UI (${orderCart.length} items)`,
        taxPercent: 0,
        discountAmount: 0,
      };

      const response = await createOrderMutation.mutateAsync(orderPayload);

      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });

      setSelectedSupplier(supplier);
      setOrderData({ purchaseOrder: response.data.data.purchaseOrder });
      setShowReceiptModal(true);
      setShowSupplierModal(false);
      handleClearCart();
    } catch (error) {
      console.error("Purchase order creation error:", error);
    }
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(false);
  };

  const calculateOrderTotal = () => {
    return orderCart.reduce((total, item) => {
      return total + item.quantity * item.tradePrice;
    }, 0);
  };

  const handleCreateOrder = async () => {
    if (!selectedSupplier) {
      toast.error("Please select a supplier");
      return;
    }

    if (orderCart.length === 0) {
      toast.error("Please add items to your order");
      return;
    }

    // Transform frontend data to match backend API structure
    const orderPayload = {
      supplierId: selectedSupplier._id,
      items: orderCart.map((item) => ({
        medicineId: item.medicineId,
        name: item.name,
        manufacturer: item.manufacturer,
        quantity: item.quantity,
        unitPrice: item.tradePrice, // Map tradePrice to unitPrice
        batchNumber: item.batchNumber || `BATCH-${Date.now()}`,
        expiryDate:
          item.expiryDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now
        notes: item.notes || "",
      })),
      expectedDeliveryDate:
        orderData.expectedDate ||
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      notes: orderData.notes || "",
      taxPercent: 0, // Default tax
      discountAmount: 0, // Default discount
    };

    try {
      const response = await createOrderMutation.mutateAsync(orderPayload);

      // Extract order ID from response
      const orderId =
        response.data?.data?.purchaseOrder?.orderNumber ||
        response.data?.data?.purchaseOrder?._id;

      // Update order data with the response
      setOrderData((prev) => ({
        ...prev,
        orderId: orderId,
        purchaseOrder: response.data?.data?.purchaseOrder,
      }));

      // Show receipt modal
      setShowReceiptModal(true);
    } catch (error) {
      console.error("Order creation error:", error);
      // Error is already handled by the mutation
    }
  };

  const handleClearCart = () => {
    setOrderCart([]);
    setSelectedSupplier(null);
    setOrderData({ expectedDate: "", notes: "" });
    toast.success("Order cleared");
  };

  // Pagination handlers
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset page when filters change
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleSortChange = (field, order) => {
    setSortBy(field);
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleStockFilterChange = (filter) => {
    setStockFilter(filter);
    setCurrentPage(1);
  };

  const handleAddSupplierSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSupplierMutation.mutateAsync({
        ...newSupplier,
        address: {
          street: newSupplier.address,
          city: newSupplier.city,
          state: newSupplier.state,
          country: "India",
          postalCode: newSupplier.pincode,
        },
      });
      setShowAddSupplierModal(false);
      setNewSupplier({
        name: "",
        contactPerson: "",
        phone: "",
        email: "",
        website: "",
        gstNumber: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });
    } catch (error) {
      // toast handled in hook
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">
            Error loading stock data
          </div>
          <button
            onClick={() => refetch()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Stock Replenishment
              </h1>
              <div className="flex items-center space-x-4 mt-2">
                <p className="text-gray-600">
                  {stockFilter === "out-of-stock"
                    ? "Showing items with zero stock"
                    : stockFilter === "low-stock"
                    ? "Showing items below minimum level"
                    : "Showing all items needing restock"}
                </p>
                {pagination?.total && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {pagination.total} items found
                  </span>
                )}
              </div>
            </div>

            {/* Order Summary & Actions */}
            <div className="flex items-center space-x-4">
              {/* Add Supplier Button */}
              <button
                onClick={() => setShowAddSupplierModal(true)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <span>➕ Add Supplier</span>
              </button>

              {orderCart.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm">
                      <span className="font-medium text-blue-900">
                        {orderCart.length} items
                      </span>
                      <span className="text-blue-700 ml-2">
                        Rs. {calculateOrderTotal().toFixed(2)}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleClearCart}
                        className="text-sm px-3 py-1 text-red-600 bg-red-50 rounded hover:bg-red-100"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleProceedToSupplier}
                        className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Select Supplier
                      </button>
                    </div>
                  </div>

                  {selectedSupplier && (
                    <div className="mt-2 pt-2 border-t border-blue-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">
                          Supplier:{" "}
                          <span className="font-medium">
                            {selectedSupplier.name}
                          </span>
                        </span>
                        <button
                          onClick={handleCreateOrder}
                          disabled={createOrderMutation.isLoading}
                          className="text-sm px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {createOrderMutation.isLoading
                            ? "Creating..."
                            : "Create Order"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <StockFilters
          searchQuery={searchQuery}
          setSearchQuery={handleSearchChange}
          sortBy={sortBy}
          setSortBy={(field) => handleSortChange(field, sortOrder)}
          sortOrder={sortOrder}
          setSortOrder={(order) => handleSortChange(sortBy, order)}
          stockFilter={stockFilter}
          setStockFilter={handleStockFilterChange}
        />

        {/* Main Content */}
        <OutOfStockTable
          medicines={medicines}
          isLoading={isLoading}
          onAddQuantity={handleAddQuantity}
          orderCart={orderCart}
          onRemoveFromCart={handleRemoveFromCart}
          pagination={pagination}
          onPageChange={handlePageChange}
          onNextPage={handleNextPage}
          onPrevPage={handlePrevPage}
          stockFilter={stockFilter}
        />
      </div>

      {/* Modals */}
      <AddQuantityModal
        show={showQuantityModal}
        onClose={() => {
          setShowQuantityModal(false);
          setSelectedMedicine(null);
        }}
        medicine={selectedMedicine}
        onSubmit={handleQuantitySubmit}
        existingItem={orderCart.find(
          (item) => item.medicineId === selectedMedicine?._id
        )}
      />

      <SelectSupplierModal
        show={showSupplierModal}
        onClose={() => setShowSupplierModal(false)}
        suppliers={suppliers}
        onSelect={handleSupplierSelect}
        onFinalize={finalizePurchaseOrder}
        orderItems={orderCart}
      />

      <OrderReceiptModal
        show={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        orderData={orderData}
        supplier={selectedSupplier}
        items={orderCart}
        total={calculateOrderTotal()}
        autoPrint={true}
      />

      <SupplierOrderHistory
        show={showOrderHistory}
        onClose={() => setShowOrderHistory(false)}
      />

      <AddSupplierModal
        show={showAddSupplierModal}
        onClose={() => setShowAddSupplierModal(false)}
        newSupplier={newSupplier}
        setNewSupplier={setNewSupplier}
        onSubmit={handleAddSupplierSubmit}
        isLoading={createSupplierMutation.isLoading}
      />
    </div>
  );
};

export default SuppliersPage;
