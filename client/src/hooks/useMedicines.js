import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicineServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const medicineKeys = {
  all: ["medicines"],
  lists: () => [...medicineKeys.all, "list"],
  list: (filters) => [...medicineKeys.lists(), { filters }],
  details: () => [...medicineKeys.all, "detail"],
  detail: (id) => [...medicineKeys.details(), id],
  search: (term) => [...medicineKeys.all, "search", term],
};

// ===================== QUERIES =====================

export const useMedicines = (filters = {}) => {
  return useQuery({
    queryKey: medicineKeys.list(filters),
    queryFn: () => medicineServices.getAll(filters).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

export const useMedicine = (id) => {
  return useQuery({
    queryKey: medicineKeys.detail(id),
    queryFn: () => medicineServices.getById(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useSearchMedicines = (searchTerm) => {
  return useQuery({
    queryKey: medicineKeys.search(searchTerm),
    queryFn: () => medicineServices.search(searchTerm).then((res) => res.data),
    enabled: !!searchTerm && searchTerm.length >= 2,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

// ===================== MUTATIONS =====================

export const useCreateMedicine = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (medicineData) => medicineServices.create(medicineData),
    onSuccess: (response) => {
      // Invalidate and refetch medicines list
      queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });

      // Add the new medicine to the cache
      const newMedicine = response.data.data.medicine;
      queryClient.setQueryData(medicineKeys.detail(newMedicine.id), {
        success: true,
        data: { medicine: newMedicine },
      });

      toast.success("Medicine created successfully!");
    },
    onError: (error) => {
      const message =
        error.response?.data?.message || "Failed to create medicine";
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
      await queryClient.cancelQueries({ queryKey: medicineKeys.detail(id) });

      // Snapshot the previous value
      const previousMedicine = queryClient.getQueryData(
        medicineKeys.detail(id)
      );

      // Optimistically update to the new value
      if (previousMedicine) {
        queryClient.setQueryData(medicineKeys.detail(id), {
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
      queryClient.setQueryData(medicineKeys.detail(id), {
        success: true,
        data: { medicine: updatedMedicine },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });

      toast.success("Medicine updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousMedicine) {
        queryClient.setQueryData(
          medicineKeys.detail(id),
          context.previousMedicine
        );
      }

      const message =
        error.response?.data?.message || "Failed to update medicine";
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
      await queryClient.cancelQueries({ queryKey: medicineKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(medicineKeys.lists());

      // Optimistically remove the medicine from lists
      queryClient.setQueriesData({ queryKey: medicineKeys.lists() }, (old) => {
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
      });

      return { previousData };
    },
    onSuccess: (response, id) => {
      // Remove the medicine from detail cache
      queryClient.removeQueries({ queryKey: medicineKeys.detail(id) });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });

      toast.success("Medicine deleted successfully!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: medicineKeys.lists() },
          context.previousData
        );
      }

      const message =
        error.response?.data?.message || "Failed to delete medicine";
      toast.error(message);
    },
  });
};

// ===================== UTILITY HOOKS =====================

export const useMedicineCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: medicineKeys.all });
  };

  const prefetchMedicine = (id) => {
    queryClient.prefetchQuery({
      queryKey: medicineKeys.detail(id),
      queryFn: () => medicineServices.getById(id).then((res) => res.data),
      staleTime: 10 * 60 * 1000,
    });
  };

  const getMedicineFromCache = (id) => {
    return queryClient.getQueryData(medicineKeys.detail(id));
  };

  return {
    invalidateAll,
    prefetchMedicine,
    getMedicineFromCache,
  };
};
