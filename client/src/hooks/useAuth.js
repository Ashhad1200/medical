import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  getCurrentUser,
  setInitialized,
  setCredentials,
  logoutUser,
  startInitialization,
} from "../store/slices/authSlice";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authServices } from "../services/api";
import toast from "react-hot-toast";

// Query Keys
export const authKeys = {
  all: ["auth"],
  user: () => [...authKeys.all, "user"],
  profile: () => [...authKeys.all, "profile"],
};

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isLoading, isAuthenticated, error, initialized } =
    useSelector((state) => state.auth);

  useEffect(() => {
    // Initialize auth state on app startup
    const initializeAuth = async () => {
      if (initialized) return; // Already initialized

      const storedToken = localStorage.getItem("token");

      if (storedToken && !user) {
        // We have a token but no user data - fetch user profile
        try {
          dispatch(startInitialization());
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          console.error("Failed to initialize auth:", error);
          // Token might be invalid, remove it
          localStorage.removeItem("token");
          dispatch(setInitialized());
        }
      } else if (!storedToken) {
        // No token, mark as initialized
        dispatch(setInitialized());
      } else if (storedToken && user) {
        // Have both token and user, mark as initialized
        dispatch(setInitialized());
      }
    };

    initializeAuth();
  }, [dispatch, user, initialized]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated,
    error,
    initialized,
  };
};

// ===================== MUTATIONS =====================

export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (credentials) => authServices.login(credentials),
    onSuccess: (response) => {
      const { token, user } = response.data.data;

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Update Redux state
      dispatch(setCredentials({ user, token }));

      // Cache user data
      queryClient.setQueryData(authKeys.user(), user);
      queryClient.setQueryData(authKeys.profile(), user);

      toast.success(`Welcome, ${user.fullName}!`);

      return response.data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Login failed";
      toast.error(message);
      throw error;
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: (userData) => authServices.register(userData),
    onSuccess: (response) => {
      const { token, user } = response.data.data;

      // Store token in localStorage
      localStorage.setItem("token", token);

      // Update Redux state
      dispatch(setCredentials({ user, token }));

      // Cache user data
      queryClient.setQueryData(authKeys.user(), user);
      queryClient.setQueryData(authKeys.profile(), user);

      toast.success("Registration successful!");

      return response.data;
    },
    onError: (error) => {
      const message = error.response?.data?.message || "Registration failed";
      toast.error(message);
      throw error;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async () => {
      // Use Redux thunk to handle logout
      await dispatch(logoutUser()).unwrap();

      // Clear all cached data
      queryClient.clear();

      return true;
    },
    onSuccess: () => {
      toast.success("Logged out successfully!");
    },
    onError: (error) => {
      console.error("Logout error:", error);
      // Even if logout fails, clear local state
      localStorage.removeItem("token");
      queryClient.clear();
    },
  });
};

// ===================== QUERIES =====================

export const useCurrentUser = () => {
  const token = localStorage.getItem("token");

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authServices.getProfile().then((res) => res.data),
    enabled: !!token,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors (unauthorized)
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    onError: (error) => {
      if (error?.response?.status === 401) {
        // Token is invalid, clear it
        localStorage.removeItem("token");
        console.warn("Invalid token detected, clearing authentication");
      }
    },
  });
};

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => authServices.getProfile().then((res) => res.data),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    initialData: user ? { data: { user } } : undefined,
  });
};

// ===================== UTILITY HOOKS =====================

export const useAuthCache = () => {
  const queryClient = useQueryClient();

  const clearAuthCache = () => {
    queryClient.removeQueries({ queryKey: authKeys.all });
  };

  const updateUserCache = (userData) => {
    queryClient.setQueryData(authKeys.user(), userData);
    queryClient.setQueryData(authKeys.profile(), userData);
  };

  const getUserFromCache = () => {
    return queryClient.getQueryData(authKeys.user());
  };

  const invalidateAuth = () => {
    queryClient.invalidateQueries({ queryKey: authKeys.all });
  };

  return {
    clearAuthCache,
    updateUserCache,
    getUserFromCache,
    invalidateAuth,
  };
};

// ===================== ROLE-BASED UTILITIES =====================

export const useRole = () => {
  const { user } = useAuth();

  const isAdmin = user?.role === "admin";
  const isCounter = user?.role === "counter";
  const isWarehouse = user?.role === "warehouse";

  const hasPermission = (permission) => {
    if (!user) return false;

    // Admin has all permissions
    if (user.role === "admin") return true;

    // Role-based permissions
    const rolePermissions = {
      counter: [
        "orders:create",
        "orders:read",
        "medicines:read",
        "customers:all",
        "dashboard:view",
      ],
      warehouse: [
        "inventory:all",
        "suppliers:all",
        "purchase-orders:all",
        "medicines:write",
      ],
    };

    return rolePermissions[user.role]?.includes(permission) || false;
  };

  return {
    user,
    isAdmin,
    isCounter,
    isWarehouse,
    hasPermission,
    role: user?.role,
  };
};
