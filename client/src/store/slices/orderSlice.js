import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Async thunks
export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, { rejectWithValue }) => {
    try {
      const response = await api.post("/orders", orderData);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

export const getOrders = createAsyncThunk(
  "orders/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/orders?${queryString}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch orders"
      );
    }
  }
);

export const getOrderById = createAsyncThunk(
  "orders/getById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data.data.order;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch order"
      );
    }
  }
);

const initialState = {
  orders: [],
  currentOrder: null,
  cart: [],
  pagination: null,
  summary: null,
  isLoading: false,
  isCreating: false,
  error: null,
  taxPercent: 0,
  customerInfo: {
    name: "",
    phone: "",
    address: "",
  },
  paymentMethod: "cash",
};

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    // Cart management
    addToCart: (state, action) => {
      const cartItem = action.payload;
      const existingItem = state.cart.find(
        (item) => item.medicineId === cartItem.medicineId
      );

      if (existingItem) {
        existingItem.quantity += cartItem.quantity;
        if (cartItem.discountPercent !== undefined) {
          existingItem.discountPercent = cartItem.discountPercent;
        }
      } else {
        state.cart.push({
          medicineId: cartItem.medicineId,
          name: cartItem.name,
          unitPrice: cartItem.unitPrice,
          tradePrice: cartItem.tradePrice || cartItem.unitPrice * 0.7,
          quantity: cartItem.quantity,
          discountPercent: cartItem.discountPercent || 0,
          availableStock: cartItem.availableStock,
          gstPerUnit: cartItem.gstPerUnit || 0,
          manufacturer: cartItem.manufacturer || "Unknown",
          batchNumber: cartItem.batchNumber || "N/A",
        });
      }
    },

    updateCartItem: (state, action) => {
      const { medicineId, quantity, discountPercent } = action.payload;
      const item = state.cart.find((item) => item.medicineId === medicineId);

      if (item) {
        if (quantity !== undefined) item.quantity = quantity;
        if (discountPercent !== undefined)
          item.discountPercent = discountPercent;
      }
    },

    removeFromCart: (state, action) => {
      const medicineId = action.payload;
      state.cart = state.cart.filter((item) => item.medicineId !== medicineId);
    },

    clearCart: (state) => {
      state.cart = [];
      state.customerInfo = { name: "", phone: "", address: "" };
      state.paymentMethod = "cash";
      state.taxPercent = 0;
    },

    setTaxPercent: (state, action) => {
      state.taxPercent = action.payload;
    },

    setCustomerInfo: (state, action) => {
      state.customerInfo = { ...state.customerInfo, ...action.payload };
    },

    setPaymentMethod: (state, action) => {
      state.paymentMethod = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create order
      .addCase(createOrder.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.isCreating = false;
        state.orders.unshift(action.payload);
        // Clear cart after successful order
        state.cart = [];
        state.customerInfo = { name: "", phone: "", address: "" };
        state.paymentMethod = "cash";
        state.taxPercent = 0;
        state.error = null;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.isCreating = false;
        state.error = action.payload;
      })

      // Get orders
      .addCase(getOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.summary = action.payload.summary;
        state.error = null;
      })
      .addCase(getOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Get order by ID
      .addCase(getOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(getOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  setTaxPercent,
  setCustomerInfo,
  setPaymentMethod,
  clearError,
} = orderSlice.actions;

export default orderSlice.reducer;
