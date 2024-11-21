import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  updateCustomer, 
  deleteCustomer 
} from "../../features/customersSlice";

const CustomersTab = () => {
  const dispatch = useDispatch();
  const customers = useSelector((state) => state.customers.customers);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  
  // Modal state for update and delete
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Form state for updating customer
  const [updateForm, setUpdateForm] = useState({
    name: '',
    phoneNumber: '',
    totalPurchaseAmount: ''
  });

  // Utility function to safely format and handle null values
  const safeFormat = (value, type = 'string') => {
    // If value is null or undefined, return 'NA'
    if (value === null || value === undefined) {
      return 'NA';
    }

    // Handle specific types
    switch (type) {
      case 'number':
        return typeof value === 'number' ? value.toFixed(2) : 'NA';
      case 'string':
      default:
        return String(value);
    }
  };

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = customers.map(customer => ({
      ...customer,
      displayName: safeFormat(customer.name),
      displayPhoneNumber: safeFormat(customer.phoneNumber),
      displayTotalPurchaseAmount: safeFormat(customer.totalPurchaseAmount, 'number')
    }));

    // Search filter
    if (searchTerm) {
      result = result.filter(customer => 
        customer.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.displayPhoneNumber.includes(searchTerm)
      );
    }

    // Sorting
    if (sortConfig.key) {
      const displayKey = `display${sortConfig.key.charAt(0).toUpperCase() + sortConfig.key.slice(1)}`;
      result.sort((a, b) => {
        // Handle 'NA' values in sorting
        if (a[displayKey] === 'NA' && b[displayKey] === 'NA') return 0;
        if (a[displayKey] === 'NA') return 1;
        if (b[displayKey] === 'NA') return -1;

        // Normal sorting
        if (a[displayKey] < b[displayKey]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[displayKey] > b[displayKey]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }

    return result;
  }, [customers, searchTerm, sortConfig]);

  // Open update modal
  const handleUpdateClick = (customer) => {
    setSelectedCustomer(customer);
    setUpdateForm({
      name: safeFormat(customer.name),
      phoneNumber: safeFormat(customer.phoneNumber),
      totalPurchaseAmount: safeFormat(customer.totalPurchaseAmount, 'number')
    });
    setIsUpdateModalOpen(true);
  };

  // Handle update form changes
  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Submit update
  const handleUpdateSubmit = (e) => {
    e.preventDefault();
    dispatch(updateCustomer({
      ...selectedCustomer,
      name: updateForm.name === 'NA' ? null : updateForm.name,
      phoneNumber: updateForm.phoneNumber === 'NA' ? null : updateForm.phoneNumber,
      totalPurchaseAmount: updateForm.totalPurchaseAmount === 'NA' ? null : parseFloat(updateForm.totalPurchaseAmount)
    }));
    setIsUpdateModalOpen(false);
  };

  // Open delete confirmation modal
  const handleDeleteClick = (customer) => {
    setSelectedCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = () => {
    dispatch(deleteCustomer(selectedCustomer.id));
    setIsDeleteModalOpen(false);
  };

  // Sorting handler
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
    }));
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Customers Management</h2>
      
      {/* Search and Filter */}
      <div className="flex justify-between mb-4">
        <input 
          type="text" 
          placeholder="Search customers..." 
          className="input input-bordered w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th 
                onClick={() => handleSort('name')}
                className="cursor-pointer hover:bg-gray-100"
              >
                Customer Name 
                {sortConfig.key === 'name' && 
                  (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
              </th>
              <th 
                onClick={() => handleSort('phoneNumber')}
                className="cursor-pointer hover:bg-gray-100"
              >
                Phone Number
                {sortConfig.key === 'phoneNumber' && 
                  (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
              </th>
              <th 
                onClick={() => handleSort('totalPurchaseAmount')}
                className="cursor-pointer hover:bg-gray-100"
              >
                Total Purchase Amount
                {sortConfig.key === 'totalPurchaseAmount' && 
                  (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map((customer, index) => (
                <tr key={customer.id || index}>
                  <td>{customer.displayName}</td>
                  <td>{customer.displayPhoneNumber}</td>
                  <td>{customer.displayTotalPurchaseAmount}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleUpdateClick(customer)}
                      >
                        Update
                      </button>
                      <button 
                        className="btn btn-sm btn-error"
                        onClick={() => handleDeleteClick(customer)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center">No customers found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Update Modal */}
      {isUpdateModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Update Customer</h3>
            <form onSubmit={handleUpdateSubmit}>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Customer Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={updateForm.name}
                  onChange={handleUpdateChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Phone Number</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={updateForm.phoneNumber}
                  onChange={handleUpdateChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Total Purchase Amount</span>
                </label>
                <input
                  type="number"
                  name="totalPurchaseAmount"
                  value={updateForm.totalPurchaseAmount}
                  onChange={handleUpdateChange}
                  className="input input-bordered w-full"
                  required
                />
              </div>
              <div className="modal-action">
                <button 
                  type="button" 
                  className="btn btn-ghost"
                  onClick={() => setIsUpdateModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirm Delete</h3>
            <p className="py-4">
              Are you sure you want to delete the customer {safeFormat(selectedCustomer.name)}?
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-ghost"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomersTab;