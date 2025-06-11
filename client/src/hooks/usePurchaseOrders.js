import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrderServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const purchaseOrderKeys = {
  all: ["purchaseOrders"],
  lists: () => [...purchaseOrderKeys.all, "list"],
  list: (filters) => [...purchaseOrderKeys.lists(), { filters }],
  details: () => [...purchaseOrderKeys.all, "detail"],
  detail: (id) => [...purchaseOrderKeys.details(), id],
  bySupplier: (supplierId) => [
    ...purchaseOrderKeys.all,
    "bySupplier",
    supplierId,
  ],
  byStatus: (status) => [...purchaseOrderKeys.all, "byStatus", status],
};

// ===================== QUERIES =====================

export const usePurchaseOrders = (filters = {}) => {
  return useQuery({
    queryKey: purchaseOrderKeys.list(filters),
    queryFn: () =>
      purchaseOrderServices.getAll(filters).then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  });
};

export const usePurchaseOrder = (id) => {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id),
    queryFn: () => purchaseOrderServices.getById(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const usePurchaseOrdersBySupplier = (supplierId) => {
  return useQuery({
    queryKey: purchaseOrderKeys.bySupplier(supplierId),
    queryFn: () =>
      purchaseOrderServices.getBySupplier(supplierId).then((res) => res.data),
    enabled: !!supplierId,
    staleTime: 2 * 60 * 1000,
  });
};

export const usePurchaseOrdersByStatus = (status) => {
  return useQuery({
    queryKey: purchaseOrderKeys.byStatus(status),
    queryFn: () =>
      purchaseOrderServices.getByStatus(status).then((res) => res.data),
    enabled: !!status,
    staleTime: 2 * 60 * 1000,
  });
};

// ===================== MUTATIONS =====================

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (purchaseOrderData) =>
      purchaseOrderServices.create(purchaseOrderData),
    onSuccess: (response) => {
      // Invalidate and refetch purchase orders list
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });

      // Add the new purchase order to the cache
      const newPurchaseOrder = response.data.data.purchaseOrder;
      queryClient.setQueryData(purchaseOrderKeys.detail(newPurchaseOrder.id), {
        success: true,
        data: { purchaseOrder: newPurchaseOrder },
      });

      // Invalidate supplier-specific queries
      queryClient.invalidateQueries({
        queryKey: purchaseOrderKeys.bySupplier(newPurchaseOrder.supplierId),
      });

      toast.success("Purchase order created successfully!");
      return response.data;
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to create purchase order";
      toast.error(message);
      throw error;
    },
  });
};

export const useUpdatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => purchaseOrderServices.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: purchaseOrderKeys.detail(id),
      });

      // Snapshot the previous value
      const previousPurchaseOrder = queryClient.getQueryData(
        purchaseOrderKeys.detail(id)
      );

      // Optimistically update to the new value
      if (previousPurchaseOrder) {
        queryClient.setQueryData(purchaseOrderKeys.detail(id), {
          ...previousPurchaseOrder,
          data: {
            purchaseOrder: {
              ...previousPurchaseOrder.data.purchaseOrder,
              ...data,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousPurchaseOrder };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedPurchaseOrder = response.data.data.purchaseOrder;
      queryClient.setQueryData(purchaseOrderKeys.detail(id), {
        success: true,
        data: { purchaseOrder: updatedPurchaseOrder },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });

      toast.success("Purchase order updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousPurchaseOrder) {
        queryClient.setQueryData(
          purchaseOrderKeys.detail(id),
          context.previousPurchaseOrder
        );
      }

      const message =
        error.response?.data?.message || "Failed to update purchase order";
      toast.error(message);
    },
  });
};

export const useDeletePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => purchaseOrderServices.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: purchaseOrderKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(purchaseOrderKeys.lists());

      // Optimistically remove the purchase order from lists
      queryClient.setQueriesData(
        { queryKey: purchaseOrderKeys.lists() },
        (old) => {
          if (!old?.data?.purchaseOrders) return old;
          return {
            ...old,
            data: {
              ...old.data,
              purchaseOrders: old.data.purchaseOrders.filter(
                (po) => po.id !== id
              ),
            },
          };
        }
      );

      return { previousData };
    },
    onSuccess: (response, id) => {
      // Remove the purchase order from detail cache
      queryClient.removeQueries({ queryKey: purchaseOrderKeys.detail(id) });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });

      toast.success("Purchase order deleted successfully!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: purchaseOrderKeys.lists() },
          context.previousData
        );
      }

      const message =
        error.response?.data?.message || "Failed to delete purchase order";
      toast.error(message);
    },
  });
};

// ===================== PURCHASE ORDER ACTIONS =====================

export const useReceivePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => purchaseOrderServices.receive(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: purchaseOrderKeys.detail(id),
      });

      // Snapshot the previous value
      const previousPurchaseOrder = queryClient.getQueryData(
        purchaseOrderKeys.detail(id)
      );

      // Optimistically update status to received
      if (previousPurchaseOrder) {
        queryClient.setQueryData(purchaseOrderKeys.detail(id), {
          ...previousPurchaseOrder,
          data: {
            purchaseOrder: {
              ...previousPurchaseOrder.data.purchaseOrder,
              status: "received",
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousPurchaseOrder };
    },
    onSuccess: (response, id) => {
      // Update the cache with server response
      const updatedPurchaseOrder = response.data.data.purchaseOrder;
      queryClient.setQueryData(purchaseOrderKeys.detail(id), {
        success: true,
        data: { purchaseOrder: updatedPurchaseOrder },
      });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["medicines"] }); // Inventory updated

      toast.success("Purchase order received and inventory updated!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousPurchaseOrder) {
        queryClient.setQueryData(
          purchaseOrderKeys.detail(id),
          context.previousPurchaseOrder
        );
      }

      const message =
        error.response?.data?.message || "Failed to receive purchase order";
      toast.error(message);
    },
  });
};

export const useCancelPurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => purchaseOrderServices.cancel(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: purchaseOrderKeys.detail(id),
      });

      // Snapshot the previous value
      const previousPurchaseOrder = queryClient.getQueryData(
        purchaseOrderKeys.detail(id)
      );

      // Optimistically update status to cancelled
      if (previousPurchaseOrder) {
        queryClient.setQueryData(purchaseOrderKeys.detail(id), {
          ...previousPurchaseOrder,
          data: {
            purchaseOrder: {
              ...previousPurchaseOrder.data.purchaseOrder,
              status: "cancelled",
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousPurchaseOrder };
    },
    onSuccess: (response, id) => {
      // Update the cache with server response
      const updatedPurchaseOrder = response.data.data.purchaseOrder;
      queryClient.setQueryData(purchaseOrderKeys.detail(id), {
        success: true,
        data: { purchaseOrder: updatedPurchaseOrder },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.lists() });

      toast.success("Purchase order cancelled successfully!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousPurchaseOrder) {
        queryClient.setQueryData(
          purchaseOrderKeys.detail(id),
          context.previousPurchaseOrder
        );
      }

      const message =
        error.response?.data?.message || "Failed to cancel purchase order";
      toast.error(message);
    },
  });
};

// ===================== UTILITY HOOKS =====================

export const usePurchaseOrderCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all });
  };

  const prefetchPurchaseOrder = (id) => {
    queryClient.prefetchQuery({
      queryKey: purchaseOrderKeys.detail(id),
      queryFn: () => purchaseOrderServices.getById(id).then((res) => res.data),
      staleTime: 5 * 60 * 1000,
    });
  };

  const getPurchaseOrderFromCache = (id) => {
    return queryClient.getQueryData(purchaseOrderKeys.detail(id));
  };

  return {
    invalidateAll,
    prefetchPurchaseOrder,
    getPurchaseOrderFromCache,
  };
};
