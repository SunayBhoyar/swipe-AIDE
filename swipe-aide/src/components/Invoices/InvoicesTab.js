import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateInvoice, deleteInvoice } from '../../features/invoicesSlice'; // Adjust import path as needed

const InvoicesTab = () => {
  const dispatch = useDispatch();
  const invoices = useSelector((state) => state.invoices.invoices);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [editingInvoice, setEditingInvoice] = useState(null);

  // Prepare data with null values replaced by 'N/A'
  const processedInvoices = invoices.map(invoice => ({
    ...invoice,
    serialNumber: invoice.serialNumber || 'N/A',
    customerName: invoice.customerName || 'N/A',
    productName: invoice.productName || 'N/A',
    quantity: invoice.quantity || 'N/A',
    tax: invoice.tax || 'N/A',
    totalAmount: invoice.totalAmount || 'N/A',
    date: invoice.date || 'N/A'
  }));

  // Filtered and searched invoices
  const filteredInvoices = useMemo(() => {
    return processedInvoices.filter(invoice => 
      Object.values(invoice).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [processedInvoices, searchTerm]);

  // Handle invoice editing
  const handleEdit = (invoice) => {
    setEditingInvoice(invoice);
  };

  // Save edited invoice
  const saveEditedInvoice = () => {
    if (editingInvoice) {
      dispatch(updateInvoice({ 
        id: editingInvoice.id, 
        data: editingInvoice 
      }));
      setEditingInvoice(null);
    }
  };

  // Handle invoice deletion
  const handleDelete = (invoiceId) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      dispatch(deleteInvoice(invoiceId));
    }
  };

  // Handle input change during editing
  const handleInputChange = (e, field) => {
    setEditingInvoice(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="p-6 bg-base-100">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Invoices</h2>
        
        {/* Search Input */}
        <div className="form-control">
          <input
            type="text"
            placeholder="Search invoices..."
            className="input input-bordered input-primary w-full max-w-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Invoices Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra table-hover w-full">
          <thead>
            <tr>
              <th>Serial Number</th>
              <th>Customer Name</th>
              <th>Product Name</th>
              <th>Quantity</th>
              <th>Tax</th>
              <th>Total Amount</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length > 0 ? (
              filteredInvoices.map((invoice) => (
                <tr key={invoice.id}>
                  {editingInvoice && editingInvoice.id === invoice.id ? (
                    // Editing row
                    <>
                      {Object.keys(invoice)
                        .filter(key => key !== 'id')
                        .map((field) => (
                          <td key={field}>
                            <input
                              type="text"
                              className="input input-bordered input-xs w-full"
                              value={editingInvoice[field] || ''}
                              onChange={(e) => handleInputChange(e, field)}
                            />
                          </td>
                        ))}
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-success btn-xs"
                            onClick={saveEditedInvoice}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-error btn-xs"
                            onClick={() => setEditingInvoice(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Display row
                    <>
                      <td>{invoice.serialNumber}</td>
                      <td>{invoice.customerName}</td>
                      <td>{invoice.productName}</td>
                      <td>{invoice.quantity}</td>
                      <td>{invoice.tax}</td>
                      <td>{invoice.totalAmount}</td>
                      <td>{invoice.date}</td>
                      <td>
                        <div className="flex gap-2">
                          <button 
                            className="btn btn-primary btn-xs"
                            onClick={() => handleEdit(invoice)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-error btn-xs"
                            onClick={() => handleDelete(invoice.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center">
                  No invoices available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InvoicesTab;