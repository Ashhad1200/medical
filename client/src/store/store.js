import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice";
import medicineSlice from "./slices/medicineSlice";
import orderSlice from "./slices/orderSlice";

export const store = configureStore({
  reducer: {
    auth: authSlice,
    medicines: medicineSlice,
    orders: orderSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST"],
      },
    }),
});
