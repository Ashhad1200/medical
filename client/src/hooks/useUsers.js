import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const userKeys = {
  all: ["users"],
  lists: () => [...userKeys.all, "list"],
  list: (filters) => [...userKeys.lists(), { filters }],
  details: () => [...userKeys.all, "detail"],
  detail: (id) => [...userKeys.details(), id],
};

// ===================== QUERIES =====================

export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () => userServices.getAll(filters).then((res) => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true,
  });
};

export const useUser = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => userServices.getById(id).then((res) => res.data),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// ===================== MUTATIONS =====================

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData) => userServices.create(userData),
    onSuccess: (response) => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      // Add the new user to the cache
      const newUser = response.data.data.user;
      queryClient.setQueryData(userKeys.detail(newUser.id), {
        success: true,
        data: { user: newUser },
      });

      toast.success("User created successfully!");
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Failed to create user";
      toast.error(message);
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => userServices.update(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update to the new value
      if (previousUser) {
        queryClient.setQueryData(userKeys.detail(id), {
          ...previousUser,
          data: {
            user: {
              ...previousUser.data.user,
              ...data,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousUser };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedUser = response.data.data.user;
      queryClient.setQueryData(userKeys.detail(id), {
        success: true,
        data: { user: updatedUser },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }

      const message = error.response?.data?.message || "Failed to update user";
      toast.error(message);
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => userServices.delete(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.lists() });

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(userKeys.lists());

      // Optimistically remove the user from lists
      queryClient.setQueriesData({ queryKey: userKeys.lists() }, (old) => {
        if (!old?.data?.users) return old;
        return {
          ...old,
          data: {
            ...old.data,
            users: old.data.users.filter((user) => user.id !== id),
          },
        };
      });

      return { previousData };
    },
    onSuccess: (response, id) => {
      // Remove the user from detail cache
      queryClient.removeQueries({ queryKey: userKeys.detail(id) });

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User deleted successfully!");
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousData) {
        queryClient.setQueriesData(
          { queryKey: userKeys.lists() },
          context.previousData
        );
      }

      const message = error.response?.data?.message || "Failed to delete user";
      toast.error(message);
    },
  });
};

// ===================== USER ROLE & STATUS ACTIONS =====================

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }) => userServices.updateRole(id, role),
    onMutate: async ({ id, role }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically update role
      if (previousUser) {
        queryClient.setQueryData(userKeys.detail(id), {
          ...previousUser,
          data: {
            user: {
              ...previousUser.data.user,
              role,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousUser };
    },
    onSuccess: (response, { id }) => {
      // Update the cache with server response
      const updatedUser = response.data.data.user;
      queryClient.setQueryData(userKeys.detail(id), {
        success: true,
        data: { user: updatedUser },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      toast.success("User role updated successfully!");
    },
    onError: (error, { id }, context) => {
      // Rollback optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }

      const message =
        error.response?.data?.message || "Failed to update user role";
      toast.error(message);
    },
  });
};

export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => userServices.toggleStatus(id),
    onMutate: async (id) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: userKeys.detail(id) });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData(userKeys.detail(id));

      // Optimistically toggle status
      if (previousUser) {
        queryClient.setQueryData(userKeys.detail(id), {
          ...previousUser,
          data: {
            user: {
              ...previousUser.data.user,
              isActive: !previousUser.data.user.isActive,
              updatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return { previousUser };
    },
    onSuccess: (response, id) => {
      // Update the cache with server response
      const updatedUser = response.data.data.user;
      queryClient.setQueryData(userKeys.detail(id), {
        success: true,
        data: { user: updatedUser },
      });

      // Invalidate lists to show updated data
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });

      const status = updatedUser.isActive ? "activated" : "deactivated";
      toast.success(`User ${status} successfully!`);
    },
    onError: (error, id, context) => {
      // Rollback optimistic update
      if (context?.previousUser) {
        queryClient.setQueryData(userKeys.detail(id), context.previousUser);
      }

      const message =
        error.response?.data?.message || "Failed to update user status";
      toast.error(message);
    },
  });
};

// ===================== UTILITY HOOKS =====================

export const useUserCache = () => {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: userKeys.all });
  };

  const prefetchUser = (id) => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(id),
      queryFn: () => userServices.getById(id).then((res) => res.data),
      staleTime: 10 * 60 * 1000,
    });
  };

  const getUserFromCache = (id) => {
    return queryClient.getQueryData(userKeys.detail(id));
  };

  return {
    invalidateAll,
    prefetchUser,
    getUserFromCache,
  };
};
