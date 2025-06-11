import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicineServices, inventoryServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const inventoryKeys = {
  all: ["inventory"],
  medicines: () => [...inventoryKeys.all, "medicines"],
  medicinesList: (filters) => [...inventoryKeys.medicines(), "list", filters],
  medicine: (id) => [...inventoryKeys.medicines(), "detail", id],
  lowStock: () => [...inventoryKeys.medicines(), "low-stock"],
  expired: () => [...inventoryKeys.medicines(), "expired"],
  search: (term) => [...inventoryKeys.medicines(), "search", term],
  stats: () => [...inventoryKeys.all, "stats"],
};

// ===================== QUERIES =====================

export const useInventoryMedicines = (filters = {}) => {
  return useQuery({
    queryKey: inventoryKeys.medicinesList(filters),
    queryFn: () => inventoryServices.getAll(filters).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

export const useInventoryMedicine = (id) => {
  return useQuery({
    queryKey: inventoryKeys.medicine(id),
    queryFn: () => medicineServices.getById(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLowStockMedicines = () => {
  return useQuery({
    queryKey: inventoryKeys.lowStock(),
    queryFn: () => inventoryServices.getLowStock().then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useExpiredMedicines = () => {
  return useQuery({
    queryKey: inventoryKeys.expired(),
    queryFn: () =>
      inventoryServices.getAll({ expired: true }).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchInventory = (searchTerm) => {
  return useQuery({
    queryKey: inventoryKeys.search(searchTerm),
    queryFn: () =>
      inventoryServices.getAll({ search: searchTerm }).then((res) => res.data),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useInventoryStats = () => {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: async () => {
      const [allMedicines, lowStock] = await Promise.all([
        inventoryServices
          .getAll({ includeExpired: true })
          .then((res) => res.data),
        inventoryServices.getLowStock().then((res) => res.data),
      ]);

      const medicines = allMedicines.data?.medicines || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset to start of day

      // Calculate expired medicines
      const expiredMedicines = medicines.filter((med) => {
        const expiryDate = new Date(med.expiryDate);
        return expiryDate < today;
      });

      // Calculate valid medicines (in stock and not expired)
      const validMedicines = medicines.filter(
        (med) => med.quantity > 0 && new Date(med.expiryDate) >= today
      );

      // Calculate total inventory value
      const totalValue = medicines.reduce((total, med) => {
        return total + (med.quantity || 0) * (med.tradePrice || 0);
      }, 0);

      // Count unique categories
      const categories = new Set(
        medicines
          .filter((med) => med.category)
          .map((med) => med.category.toLowerCase())
      );

      // Calculate expiring soon (within 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      const expiringSoon = medicines.filter((med) => {
        const expiryDate = new Date(med.expiryDate);
        return expiryDate > today && expiryDate <= thirtyDaysFromNow;
      }).length;

      return {
        total: medicines.length,
        lowStock: lowStock.data?.medicines?.length || 0,
        expired: expiredMedicines.length,
        inStock: validMedicines.length,
        expiringSoon,
        totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
        categoriesCount: categories.size,
        outOfStock: medicines.filter((med) => (med.quantity || 0) === 0).length,
        averageValue:
          medicines.length > 0
            ? Math.round((totalValue / medicines.length) * 100) / 100
            : 0,
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ===================== MUTATIONS =====================

export const useCreateMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (medicineData) => medicineServices.create(medicineData),
    onSuccess: (response) => {
      // Invalidate and refetch inventory lists and stats
      queryClient.invalidateQueries({ queryKey: inventoryKeys.medicines() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });

      // Add the new medicine to cache
      const newMedicine = response.data.data.medicine;
      queryClient.setQueryData(inventoryKeys.medicine(newMedicine.id), {
        success: true,
        data: { medicine: newMedicine },
      });

      toast.success("Medicine added successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to add medicine";
      toast.error(message);
    },
  });
};

export const useUpdateMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => medicineServices.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: inventoryKeys.medicine(id) });

      // Snapshot the previous value
      const previousMedicine = queryClient.getQueryData(
        inventoryKeys.medicine(id)
      );

      // Optimistically update to the new value
      if (previousMedicine) {
        queryClient.setQueryData(inventoryKeys.medicine(id), {
          ...previousMedicine,
          data: {
            medicine: {
              ...previousMedicine.data.medicine,
              ...data,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousMedicine };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedMedicine = response.data.data.medicine;
      queryClient.setQueryData(inventoryKeys.medicine(id), {
        success: true,
        data: { medicine: updatedMedicine },
      });

      // Invalidate lists and stats to show updated data
      queryClient.invalidateQueries({ queryKey: inventoryKeys.medicines() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });

      toast.success("Medicine updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousMedicine) {
        queryClient.setQueryData(
          inventoryKeys.medicine(id),
          context.previousMedicine
        );
      }

      const message =
        error.response?.data?.message || "Failed to update medicine";
      toast.error(message);
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, quantity }) =>
      inventoryServices.updateStock(id, quantity),
    onMutate: async ({ id, quantity }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: inventoryKeys.medicine(id) });

      // Snapshot the previous value
      const previousMedicine = queryClient.getQueryData(
        inventoryKeys.medicine(id)
      );

      // Optimistically update quantity
      if (previousMedicine) {
        queryClient.setQueryData(inventoryKeys.medicine(id), {
          ...previousMedicine,
          data: {
            medicine: {
              ...previousMedicine.data.medicine,
              quantity: quantity,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousMedicine };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedMedicine = response.data.data.medicine;
      queryClient.setQueryData(inventoryKeys.medicine(id), {
        success: true,
        data: { medicine: updatedMedicine },
      });

      // Invalidate lists and stats to show updated data
      queryClient.invalidateQueries({ queryKey: inventoryKeys.medicines() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });

      toast.success("Stock updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousMedicine) {
        queryClient.setQueryData(
          inventoryKeys.medicine(id),
          context.previousMedicine
        );
      }

      const message = error.response?.data?.message || "Failed to update stock";
      toast.error(message);
    },
  });
};

export const useDeleteMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => medicineServices.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: inventoryKeys.medicines() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(inventoryKeys.medicines());

      // Optimistically remove the medicine from lists
      queryClient.setQueriesData(
        { queryKey: inventoryKeys.medicines() },
        (old) => {
          if (!old?.data?.medicines) return old;
          return {
            ...old,
            data: {
              ...old.data,
              medicines: old.data.medicines.filter(
                (medicine) => medicine.id !== id
              ),
            },
          };
        }
      );

      return { previousData };
    },
    onSuccess: (response, id) => {
      // Remove the medicine from detail cache
      queryClient.removeQueries({ queryKey: inventoryKeys.medicine(id) });

      // Invalidate lists and stats to ensure consistency
      queryClient.invalidateQueries({ queryKey: inventoryKeys.medicines() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });

      toast.success("Medicine deleted successfully!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: inventoryKeys.medicines() },
          context.previousData
        );
      }

      const message =
        error.response?.data?.message || "Failed to delete medicine";
      toast.error(message);
    },
  });
};

export const useBulkImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData) => inventoryServices.bulkImport(formData),
    onSuccess: (response) => {
      // Invalidate all inventory queries and stats to refresh data
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });

      const imported = response.data.data?.imported || 0;
      toast.success(`Successfully imported ${imported} medicines!`);
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to import medicines";
      toast.error(message);
    },
  });
};

export const useExportInventory = () => {
  return useMutation({
    mutationFn: () => inventoryServices.exportData(),
    onSuccess: (response) => {
      // Create download link for the exported file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `inventory-${new Date().toISOString().split("T")[0]}.xlsx`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Inventory exported successfully!");
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to export inventory";
      toast.error(message);
    },
  });
};

// ===================== UTILITY HOOKS =====================

export const useInventoryCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
  };

  const prefetchMedicine = (id) => {
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.medicine(id),
      queryFn: () => medicineServices.getById(id).then((res) => res.data),
      staleTime: 10 * 60 * 1000,
    });
  };

  const prefetchLowStock = () => {
    queryClient.prefetchQuery({
      queryKey: inventoryKeys.lowStock(),
      queryFn: () => inventoryServices.getLowStock().then((res) => res.data),
      staleTime: 2 * 60 * 1000,
    });
  };

  return {
    invalidateAll,
    prefetchMedicine,
    prefetchLowStock,
  };
};

// Helper function to get stock status
export const getStockStatus = (medicine) => {
  const currentDate = new Date();
  const expiryDate = new Date(medicine.expiryDate);
  const isExpired = expiryDate < currentDate;
  const isLowStock = medicine.quantity <= 10;
  const isOutOfStock = medicine.quantity === 0;

  if (isExpired) {
    return { status: "expired", color: "red", text: "Expired" };
  } else if (isOutOfStock) {
    return { status: "out-of-stock", color: "red", text: "Out of Stock" };
  } else if (isLowStock) {
    return { status: "low-stock", color: "yellow", text: "Low Stock" };
  } else {
    return { status: "in-stock", color: "green", text: "In Stock" };
  }
};
