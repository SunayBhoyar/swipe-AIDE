import { createSlice } from '@reduxjs/toolkit';

// Initial state for invoices
const initialState = {
  invoices: [],               // Array to hold invoices data
  error: null,                 // To track any errors
  loading: false,              // To track loading state
};

// Invoices slice for Redux state management
const invoicesSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    // Set invoices after data extraction
    setInvoices: (state, action) => {
      state.invoices = action.payload;
    },
    
    // Update an existing invoice by ID
    updateInvoice: (state, action) => {
      const { id, data } = action.payload;
      const index = state.invoices.findIndex(invoice => invoice.id === id);
      if (index !== -1) {
        state.invoices[index] = { ...state.invoices[index], ...data };
      }
    },
    
    // Add a new invoice
    addInvoice: (state, action) => {
      state.invoices.push(action.payload);
    },

    // Delete an invoice by ID
    deleteInvoice: (state, action) => {
      const idToDelete = action.payload;
      state.invoices = state.invoices.filter(invoice => invoice.id !== idToDelete);
    },

    // Set error message for validation or processing errors
    setError: (state, action) => {
      state.error = action.payload;
    },

    // Clear error state
    clearError: (state) => {
      state.error = null;
    },

    // Set loading state
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

// Action exports
export const { 
  setInvoices, 
  updateInvoice, 
  addInvoice, 
  deleteInvoice, 
  setError, 
  clearError, 
  setLoading 
} = invoicesSlice.actions;

// Reducer export
export default invoicesSlice.reducer;

