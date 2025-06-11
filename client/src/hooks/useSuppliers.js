import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supplierServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const supplierKeys = {
  all: ["suppliers"],
  lists: () => [...supplierKeys.all, "list"],
  list: (filters) => [...supplierKeys.lists(), { filters }],
  details: () => [...supplierKeys.all, "detail"],
  detail: (id) => [...supplierKeys.details(), id],
  search: (term) => [...supplierKeys.all, "search", term],
};

// ===================== QUERIES =====================

export const useSuppliers = (filters = {}) => {
  return useQuery({
    queryKey: supplierKeys.list(filters),
    queryFn: () => supplierServices.getAll(filters).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

export const useSupplier = (id) => {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => supplierServices.getById(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSearchSuppliers = (searchTerm) => {
  return useQuery({
    queryKey: supplierKeys.search(searchTerm),
    queryFn: () => supplierServices.search(searchTerm).then((res) => res.data),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ===================== MUTATIONS =====================

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (supplierData) => supplierServices.create(supplierData),
    onSuccess: (response) => {
      // Invalidate and refetch suppliers list
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });

      // Add the new supplier to the cache
      const newSupplier = response.data.data.supplier;
      queryClient.setQueryData(supplierKeys.detail(newSupplier.id), {
        success: true,
        data: { supplier: newSupplier },
      });

      toast.success("Supplier created successfully!");
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to create supplier";
      toast.error(message);
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => supplierServices.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: supplierKeys.detail(id) });

      // Snapshot the previous value
      const previousSupplier = queryClient.getQueryData(
        supplierKeys.detail(id)
      );

      // Optimistically update to the new value
      if (previousSupplier) {
        queryClient.setQueryData(supplierKeys.detail(id), {
          ...previousSupplier,
          data: {
            supplier: {
              ...previousSupplier.data.supplier,
              ...data,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousSupplier };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedSupplier = response.data.data.supplier;
      queryClient.setQueryData(supplierKeys.detail(id), {
        success: true,
        data: { supplier: updatedSupplier },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });

      toast.success("Supplier updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousSupplier) {
        queryClient.setQueryData(
          supplierKeys.detail(id),
          context.previousSupplier
        );
      }

      const message =
        error.response?.data?.message || "Failed to update supplier";
      toast.error(message);
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => supplierServices.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: supplierKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(supplierKeys.lists());

      // Optimistically remove the supplier from lists
      queryClient.setQueriesData({ queryKey: supplierKeys.lists() }, (old) => {
        if (!old?.data?.suppliers) return old;
        return {
          ...old,
          data: {
            ...old.data,
            suppliers: old.data.suppliers.filter(
              (supplier) => supplier.id !== id
            ),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response, id) => {
      // Remove the supplier from detail cache
      queryClient.removeQueries({ queryKey: supplierKeys.detail(id) });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });

      const message = response.data.message || "Supplier deleted successfully!";
      toast.success(message);
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: supplierKeys.lists() },
          context.previousData
        );
      }

      const message =
        error.response?.data?.message || "Failed to delete supplier";
      toast.error(message);
    },
  });
};

// ===================== UTILITY HOOKS =====================

export const useSupplierCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: supplierKeys.all });
  };

  const prefetchSupplier = (id) => {
    queryClient.prefetchQuery({
      queryKey: supplierKeys.detail(id),
      queryFn: () => supplierServices.getById(id).then((res) => res.data),
      staleTime: 10 * 60 * 1000,
    });
  };

  const getSupplierFromCache = (id) => {
    return queryClient.getQueryData(supplierKeys.detail(id));
  };

  return {
    invalidateAll,
    prefetchSupplier,
    getSupplierFromCache,
  };
};
