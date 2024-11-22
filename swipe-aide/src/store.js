import { configureStore } from '@reduxjs/toolkit';
import customersReducer from './features/customersSlice';
import invoicesReducer from './features/invoicesSlice';
import productsReducer from './features/productsSlice';

export const store = configureStore({
  reducer: {
    customers: customersReducer,
    invoices: invoicesReducer,
    products: productsReducer,
  },
});

export default store ;