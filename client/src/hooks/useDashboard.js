import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardServices, orderServices } from "../services/api";

// Query Keys
export const dashboardKeys = {
  all: ["dashboard"],
  stats: () => [...dashboardKeys.all, "stats"],
  activities: () => [...dashboardKeys.all, "activities"],
  orderData: () => [...dashboardKeys.all, "orderData"],
};

// ===================== QUERIES =====================

export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: () => dashboardServices.getStats().then((res) => res.data),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchIntervalInBackground: false,
  });
};

export const useDashboardActivities = () => {
  return useQuery({
    queryKey: dashboardKeys.activities(),
    queryFn: () => dashboardServices.getActivities().then((res) => res.data),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
};

export const useDashboardOrderData = () => {
  return useQuery({
    queryKey: dashboardKeys.orderData(),
    queryFn: () => orderServices.getDashboardData().then((res) => res.data),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchIntervalInBackground: false,
  });
};

// Combined dashboard hook for convenience
export const useDashboard = () => {
  const statsQuery = useDashboardStats();
  const activitiesQuery = useDashboardActivities();
  const orderDataQuery = useDashboardOrderData();

  return {
    stats: statsQuery,
    activities: activitiesQuery,
    orderData: orderDataQuery,
    isLoading:
      statsQuery.isLoading ||
      activitiesQuery.isLoading ||
      orderDataQuery.isLoading,
    isError:
      statsQuery.isError || activitiesQuery.isError || orderDataQuery.isError,
    error: statsQuery.error || activitiesQuery.error || orderDataQuery.error,
  };
};

// ===================== UTILITY HOOKS =====================

export const useDashboardCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
  };

  const refreshStats = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.stats() });
  };

  const refreshActivities = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.activities() });
  };

  const refreshOrderData = () => {
    queryClient.invalidateQueries({ queryKey: dashboardKeys.orderData() });
  };

  return {
    invalidateAll,
    refreshStats,
    refreshActivities,
    refreshOrderData,
  };
};
