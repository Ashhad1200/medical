import React, { useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  useInventoryMedicines,
  useCreateMedicine,
  useUpdateStock,
  useDeleteMedicine,
  useBulkImport,
  useExportInventory,
  useInventoryStats,
  getStockStatus,
} from "../hooks/useInventory";

// Import components for better organization
import InventoryStats from "../components/Inventory/InventoryStats";
import InventoryFilters from "../components/Inventory/InventoryFilters";
import InventoryTable from "../components/Inventory/InventoryTable";
import AddMedicineModal from "../components/Inventory/AddMedicineModal";
import ImportModal from "../components/Inventory/ImportModal";

const InventoryPage = () => {
  // State management
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("table"); // table or grid
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [importFile, setImportFile] = useState(null);

  const [newMedicine, setNewMedicine] = useState({
    name: "",
    manufacturer: "",
    batchNumber: "",
    retailPrice: "",
    tradePrice: "",
    gstPerUnit: "",
    quantity: "",
    expiryDate: "",
    category: "",
    description: "",
    minStockLevel: 10,
  });

  // Build API filters
  const filters = useMemo(() => {
    const apiFilters = {
      sortBy,
      sortOrder,
    };

    if (searchQuery.length >= 2) {
      apiFilters.query = searchQuery;
    }

    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "low-stock":
          apiFilters.lowStock = true;
          break;
        case "expired":
          // For expired, we need to include expired medicines from backend
          // and then filter client-side to show only expired ones
          apiFilters.includeExpired = true;
          break;
        case "expiring-soon":
          apiFilters.expiringSoon = true;
          break;
        case "in-stock":
          apiFilters.inStock = true;
          apiFilters.includeExpired = false;
          break;
        default:
          break;
      }
    }

    return apiFilters;
  }, [searchQuery, filterStatus, sortBy, sortOrder]);

  // React Query hooks
  const {
    data: medicinesData,
    isLoading,
    error,
    refetch,
  } = useInventoryMedicines(filters);

  const { data: statsData, isLoading: statsLoading } = useInventoryStats();
  const createMedicineMutation = useCreateMedicine();
  const updateStockMutation = useUpdateStock();
  const deleteMedicineMutation = useDeleteMedicine();
  const bulkImportMutation = useBulkImport();
  const exportInventoryMutation = useExportInventory();

  // Extract data - handle the actual response structure
  const medicines = medicinesData?.data?.medicines || [];
  const pagination = medicinesData?.data?.pagination || {};

  // Filter data for client-side instant feedback
  const filteredMedicines = useMemo(() => {
    if (!medicines.length) return [];

    let filtered = [...medicines];

    // Apply status-based filtering
    if (filterStatus !== "all") {
      switch (filterStatus) {
        case "expired":
          // Only show medicines that are actually expired
          filtered = filtered.filter((medicine) => {
            const expiryDate = new Date(medicine.expiryDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0); // Reset to start of day for accurate comparison
            return expiryDate < today;
          });
          break;
        case "expiring-soon":
          // Show medicines expiring within 30 days
          filtered = filtered.filter((medicine) => {
            const expiryDate = new Date(medicine.expiryDate);
            const today = new Date();
            const thirtyDaysFromNow = new Date();
            thirtyDaysFromNow.setDate(today.getDate() + 30);
            return expiryDate > today && expiryDate <= thirtyDaysFromNow;
          });
          break;
        case "low-stock":
          // Show medicines with low stock
          filtered = filtered.filter((medicine) => {
            return medicine.quantity <= (medicine.minStockLevel || 10);
          });
          break;
        case "in-stock":
          // Show medicines that are in stock and not expired
          filtered = filtered.filter((medicine) => {
            const expiryDate = new Date(medicine.expiryDate);
            const today = new Date();
            return medicine.quantity > 0 && expiryDate >= today;
          });
          break;
        default:
          break;
      }
    }

    // Apply client-side search if needed
    if (searchQuery && searchQuery.length >= 2 && !filters.query) {
      const searchTerm = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (medicine) =>
          medicine.name?.toLowerCase().includes(searchTerm) ||
          medicine.manufacturer?.toLowerCase().includes(searchTerm) ||
          medicine.category?.toLowerCase().includes(searchTerm) ||
          medicine.batchNumber?.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [medicines, searchQuery, filters.query, filterStatus]);

  // Event handlers
  const handleAddMedicine = async (e) => {
    e.preventDefault();

    const medicineData = {
      ...newMedicine,
      retailPrice: parseFloat(newMedicine.retailPrice),
      tradePrice: parseFloat(newMedicine.tradePrice),
      gstPerUnit: parseFloat(newMedicine.gstPerUnit) || 0,
      quantity: parseInt(newMedicine.quantity),
      minStockLevel: parseInt(newMedicine.minStockLevel) || 10,
    };

    try {
      await createMedicineMutation.mutateAsync(medicineData);
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error("Failed to create medicine:", error);
    }
  };

  const handleUpdateQuantity = async (medicineId, newQuantity) => {
    try {
      await updateStockMutation.mutateAsync({
        id: medicineId,
        quantity: parseInt(newQuantity),
      });
    } catch (error) {
      console.error("Failed to update stock:", error);
    }
  };

  const handleDeleteMedicine = async (medicineId, medicineName) => {
    if (window.confirm(`Are you sure you want to delete "${medicineName}"?`)) {
      try {
        await deleteMedicineMutation.mutateAsync(medicineId);
      } catch (error) {
        console.error("Failed to delete medicine:", error);
      }
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload an Excel (.xlsx, .xls) or CSV file");
      return;
    }

    setImportFile(file);
  };

  const handleImportData = async () => {
    if (!importFile) {
      toast.error("Please select a file to import");
      return;
    }

    const formData = new FormData();
    formData.append("file", importFile);

    try {
      await bulkImportMutation.mutateAsync(formData);
      setShowImportModal(false);
      setImportFile(null);
    } catch (error) {
      console.error("Failed to import data:", error);
    }
  };

  const handleExportData = async () => {
    try {
      await exportInventoryMutation.mutateAsync();
    } catch (error) {
      console.error("Failed to export data:", error);
    }
  };

  const resetForm = () => {
    setNewMedicine({
      name: "",
      manufacturer: "",
      batchNumber: "",
      retailPrice: "",
      tradePrice: "",
      gstPerUnit: "",
      quantity: "",
      expiryDate: "",
      category: "",
      description: "",
      minStockLevel: 10,
    });
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg
                className="w-6 h-6 text-red-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-lg font-medium text-red-800">
                  Error Loading Inventory
                </h3>
                <p className="text-red-600 mt-1">{error.message}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Inventory Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your medicine inventory, track stock levels, and monitor
                expiry dates
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("table")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "table"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === "grid"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Grid
                </button>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                  />
                </svg>
                Import
              </button>

              <button
                onClick={handleExportData}
                disabled={exportInventoryMutation.isLoading}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                {exportInventoryMutation.isLoading ? "Exporting..." : "Export"}
              </button>

              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <svg
                  className="w-4 h-4 mr-2"
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
                Add Medicine
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <InventoryStats data={statsData} isLoading={statsLoading} />

        {/* Filters Section */}
        <InventoryFilters
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
        />

        {/* Main Content */}
        <InventoryTable
          medicines={filteredMedicines}
          isLoading={isLoading}
          viewMode={viewMode}
          editingMedicine={editingMedicine}
          setEditingMedicine={setEditingMedicine}
          onUpdateQuantity={handleUpdateQuantity}
          onDeleteMedicine={handleDeleteMedicine}
          updateStockMutation={updateStockMutation}
          deleteMedicineMutation={deleteMedicineMutation}
          pagination={pagination}
        />
      </div>

      {/* Modals */}
      <AddMedicineModal
        show={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        newMedicine={newMedicine}
        setNewMedicine={setNewMedicine}
        onSubmit={handleAddMedicine}
        isLoading={createMedicineMutation.isLoading}
      />

      <ImportModal
        show={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          setImportFile(null);
        }}
        importFile={importFile}
        onFileUpload={handleFileUpload}
        onImport={handleImportData}
        isLoading={bulkImportMutation.isLoading}
      />
    </div>
  );
};

export default InventoryPage;
