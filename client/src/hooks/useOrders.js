import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orderServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const orderKeys = {
  all: ["orders"],
  lists: () => [...orderKeys.all, "list"],
  list: (filters) => [...orderKeys.lists(), { filters }],
  details: () => [...orderKeys.all, "detail"],
  detail: (id) => [...orderKeys.details(), id],
  dashboard: () => [...orderKeys.all, "dashboard"],
  dateRange: (date) => [...orderKeys.all, "dateRange", date],
};

// ===================== QUERIES =====================

export const useOrders = (filters = {}) => {
  return useQuery({
    queryKey: orderKeys.list(filters),
    queryFn: () => orderServices.getAll(filters).then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    keepPreviousData: true,
  });
};

export const useOrder = (id) => {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => orderServices.getById(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useOrdersByDateRange = (date) => {
  return useQuery({
    queryKey: orderKeys.dateRange(date),
    queryFn: () => orderServices.getByDateRange(date).then((res) => res.data),
    enabled: !!date,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useOrderDashboard = () => {
  return useQuery({
    queryKey: orderKeys.dashboard(),
    queryFn: () => orderServices.getDashboardData().then((res) => res.data),
    staleTime: 30 * 1000, // 30 seconds for dashboard
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

// ===================== MUTATIONS =====================

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderData) => orderServices.create(orderData),
    onSuccess: (response) => {
      // Invalidate and refetch orders list
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });

      // Add the new order to the cache
      const newOrder = response.data.data.order;
      queryClient.setQueryData(orderKeys.detail(newOrder.id), {
        success: true,
        data: newOrder,
      });

      // Invalidate dashboard to update stats
      queryClient.invalidateQueries({ queryKey: orderKeys.dashboard() });

      toast.success("Order created successfully!");
      return response.data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create order";
      toast.error(message);
      throw error;
    },
  });
};

export const useUpdateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => orderServices.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.detail(id) });

      // Snapshot the previous value
      const previousOrder = queryClient.getQueryData(orderKeys.detail(id));

      // Optimistically update to the new value
      if (previousOrder) {
        queryClient.setQueryData(orderKeys.detail(id), {
          ...previousOrder,
          data: {
            ...previousOrder.data,
            ...data,
            updatedAt: new Date().toISOString(),
          },
        });
      }

      return { previousOrder };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedOrder = response.data.data.order;
      queryClient.setQueryData(orderKeys.detail(id), {
        success: true,
        data: updatedOrder,
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.dashboard() });

      toast.success("Order updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousOrder) {
        queryClient.setQueryData(orderKeys.detail(id), context.previousOrder);
      }

      const message = error.response?.data?.message || "Failed to update order";
      toast.error(message);
    },
  });
};

export const useDeleteOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => orderServices.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: orderKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(orderKeys.lists());

      // Optimistically remove the order from lists
      queryClient.setQueriesData({ queryKey: orderKeys.lists() }, (old) => {
        if (!old?.data?.orders) return old;
        return {
          ...old,
          data: {
            ...old.data,
            orders: old.data.orders.filter((order) => order.orderId !== id),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response, id) => {
      // Remove the order from detail cache
      queryClient.removeQueries({ queryKey: orderKeys.detail(id) });

      // Invalidate lists and dashboard to ensure consistency
      queryClient.invalidateQueries({ queryKey: orderKeys.lists() });
      queryClient.invalidateQueries({ queryKey: orderKeys.dashboard() });

      toast.success("Order deleted successfully!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: orderKeys.lists() },
          context.previousData
        );
      }

      const message = error.response?.data?.message || "Failed to delete order";
      toast.error(message);
    },
  });
};

// ===================== PDF DOWNLOAD =====================

export const useDownloadOrderPdf = () => {
  return useMutation({
    mutationFn: async (orderId) => {
      const response = await orderServices.getPdf(orderId);

      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `order_${orderId}.pdf`);

      // Append to html page
      document.body.appendChild(link);

      // Force download
      link.click();

      // Clean up
      link.remove();
      window.URL.revokeObjectURL(url);

      return response.data;
    },
    onSuccess: () => {
      toast.success("PDF downloaded successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to download PDF";
      toast.error(message);
    },
  });
};

// ===================== UTILITY HOOKS =====================

export const useOrderCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: orderKeys.all });
  };

  const prefetchOrder = (id) => {
    queryClient.prefetchQuery({
      queryKey: orderKeys.detail(id),
      queryFn: () => orderServices.getById(id).then((res) => res.data),
      staleTime: 5 * 60 * 1000,
    });
  };

  const getOrderFromCache = (id) => {
    return queryClient.getQueryData(orderKeys.detail(id));
  };

  const updateOrderInCache = (id, updater) => {
    queryClient.setQueryData(orderKeys.detail(id), updater);
  };

  return {
    invalidateAll,
    prefetchOrder,
    getOrderFromCache,
    updateOrderInCache,
  };
};
