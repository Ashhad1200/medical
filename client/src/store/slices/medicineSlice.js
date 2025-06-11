import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../services/api";

// Async thunks
export const searchMedicines = createAsyncThunk(
  "medicines/search",
  async ({ query, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `/medicines/search?q=${query}&limit=${limit}`
      );
      return response.data.data.medicines;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Search failed");
    }
  }
);

export const getMedicines = createAsyncThunk(
  "medicines/getAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/medicines?${queryString}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch medicines"
      );
    }
  }
);

const initialState = {
  medicines: [],
  searchResults: [],
  pagination: null,
  isLoading: false,
  isSearching: false,
  error: null,
};

const medicineSlice = createSlice({
  name: "medicines",
  initialState,
  reducers: {
    clearSearchResults: (state) => {
      state.searchResults = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search medicines
      .addCase(searchMedicines.pending, (state) => {
        state.isSearching = true;
        state.error = null;
      })
      .addCase(searchMedicines.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload;
        state.error = null;
      })
      .addCase(searchMedicines.rejected, (state, action) => {
        state.isSearching = false;
        state.error = action.payload;
      })

      // Get all medicines
      .addCase(getMedicines.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMedicines.fulfilled, (state, action) => {
        state.isLoading = false;
        state.medicines = action.payload.medicines;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(getMedicines.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSearchResults, clearError } = medicineSlice.actions;
export default medicineSlice.reducer;
