import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  invoices: [],
  error: null,
  loading: false,
};

const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    updateInvoice: (state, action) => {
      const { id, data } = action.payload;
      const index = state.invoices.findIndex(invoice => invoice.id === id);
      if (index !== -1) {
        state.invoices[index] = { ...state.invoices[index], ...data };
      }
    },
    addInvoice: (state, action) => {
      state.invoices.push(action.payload);
    },
    deleteInvoice: (state, action) => {
      const idToDelete = action.payload;
      state.invoices = state.invoices.filter(invoice => invoice.id !== idToDelete);
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { 
  setInvoices, 
  updateInvoice, 
  addInvoice, 
  deleteInvoice, 
  setError, 
  clearError, 
  setLoading 
} = invoicesSlice.actions;

export default invoicesSlice.reducer;