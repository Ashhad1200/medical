import axios from "axios";

// Use the environment variable if available, otherwise use the proxy path in dev mode
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ===================== AUTH SERVICES =====================
export const authServices = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
};

// ===================== MEDICINE SERVICES =====================
export const medicineServices = {
  getAll: (params = {}) => api.get("/medicines", { params }),
  getById: (id) => api.get(`/medicines/${id}`),
  create: (data) => api.post("/medicines", data),
  update: (id, data) => api.put(`/medicines/${id}`, data),
  delete: (id) => api.delete(`/medicines/${id}`),
  search: (term) => api.get("/medicines", { params: { term } }),
};

// ===================== ORDER SERVICES =====================
export const orderServices = {
  getAll: (params = {}) => api.get("/orders", { params }),
  getById: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post("/orders", data),
  update: (id, data) => api.put(`/orders/${id}`, data),
  delete: (id) => api.delete(`/orders/${id}`),
  getDashboardData: () => api.get("/orders/dashboard"),
  getPdf: (id) => api.get(`/orders/${id}/pdf`, { responseType: "blob" }),
  getByDateRange: (date) => api.get("/orders", { params: { date } }),
};

// ===================== SUPPLIER SERVICES =====================
export const supplierServices = {
  getAll: (params = {}) => api.get("/suppliers", { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
  search: (search) => api.get("/suppliers", { params: { search } }),
};

// ===================== PURCHASE ORDER SERVICES =====================
export const purchaseOrderServices = {
  getAll: (params = {}) => api.get("/purchase-orders", { params }),
  getById: (id) => api.get(`/purchase-orders/${id}`),
  create: (data) => api.post("/purchase-orders", data),
  update: (id, data) => api.put(`/purchase-orders/${id}`, data),
  delete: (id) => api.delete(`/purchase-orders/${id}`),
  receive: (id) => api.post(`/purchase-orders/${id}/receive`),
  cancel: (id) => api.post(`/purchase-orders/${id}/cancel`),
  getBySupplier: (supplierId) =>
    api.get("/purchase-orders", { params: { supplierId } }),
  getByStatus: (status) => api.get("/purchase-orders", { params: { status } }),
};

// ===================== USER SERVICES =====================
export const userServices = {
  getAll: (params = {}) => api.get("/users", { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post("/users", data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
};

// ===================== DASHBOARD SERVICES =====================
export const dashboardServices = {
  getStats: () => api.get("/dashboard/stats"),
  getActivities: () => api.get("/dashboard/activities"),
  getOrderData: () => api.get("/orders/dashboard"),
};

// ===================== INVENTORY SERVICES =====================
export const inventoryServices = {
  getAll: (params = {}) => api.get("/medicines", { params }),
  getLowStock: () => api.get("/medicines/low-stock"),
  getExpired: () => api.get("/medicines/expired"),
  updateStock: (id, quantity) =>
    api.patch(`/medicines/${id}/stock`, { quantity }),
  bulkImport: (formData) =>
    api.post("/medicines/bulk-import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }),
  exportData: () => api.get("/medicines/export", { responseType: "blob" }),
};

export default api;
