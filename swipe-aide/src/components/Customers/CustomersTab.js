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

  // Filtered and sorted customers
  const filteredCustomers = useMemo(() => {
    let result = customers;

    // Search filter
    if (searchTerm) {
      result = result.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phoneNumber.includes(searchTerm)
      );
    }

    // Sorting
    if (sortConfig.key) {
      result.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
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
      name: customer.name,
      phoneNumber: customer.phoneNumber,
      totalPurchaseAmount: customer.totalPurchaseAmount
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
      ...updateForm
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
                  <td>{customer.name}</td>
                  <td>{customer.phoneNumber}</td>
                  <td>${customer.totalPurchaseAmount.toFixed(2)}</td>
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
              Are you sure you want to delete the customer {selectedCustomer.name}?
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