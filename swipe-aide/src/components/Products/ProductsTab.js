import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProduct, updateProduct } from '../../features/productsSlice';

const ProductsTab = () => {
  const dispatch = useDispatch();
  const products = useSelector((state) => state.products.products);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit state
  const [editingProduct, setEditingProduct] = useState(null);

  // Search and filter function
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle product deletion
  const handleDeleteProduct = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProduct(productId));
    }
  };

  // Start editing a product
  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
  };

  // Handle input change in edit mode
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save edited product
  const handleSaveProduct = () => {
    if (editingProduct) {
      dispatch(updateProduct(editingProduct));
      setEditingProduct(null);
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingProduct(null);
  };

  // Helper function to format null/undefined values
  const formatValue = (value) => {
    return value === null || value === undefined ? 'N/A' : value;
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Products</h2>
      
      {/* Search Input */}
      <div className="form-control mb-4">
        <input 
          type="text" 
          placeholder="Search products..." 
          className="input input-bordered w-full max-w-xs"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>Name</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Tax</th>
              <th>Price with Tax</th>
              <th>Discount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <tr key={product.id}>
                  {editingProduct && editingProduct.id === product.id ? (
                    // Editing Mode
                    <>
                      <td>
                        <input
                          type="text"
                          name="name"
                          value={editingProduct.name || ''}
                          onChange={handleEditChange}
                          className="input input-bordered input-xs w-full"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="quantity"
                          value={editingProduct.quantity || ''}
                          onChange={handleEditChange}
                          className="input input-bordered input-xs w-full"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="unitPrice"
                          value={editingProduct.unitPrice || ''}
                          onChange={handleEditChange}
                          className="input input-bordered input-xs w-full"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="tax"
                          value={editingProduct.tax || ''}
                          onChange={handleEditChange}
                          className="input input-bordered input-xs w-full"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="priceWithTax"
                          value={editingProduct.priceWithTax || ''}
                          onChange={handleEditChange}
                          className="input input-bordered input-xs w-full"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          name="discount"
                          value={editingProduct.discount || ''}
                          onChange={handleEditChange}
                          className="input input-bordered input-xs w-full"
                        />
                      </td>
                      <td>
                        <div className="flex space-x-2">
                          <button 
                            className="btn btn-success btn-xs"
                            onClick={handleSaveProduct}
                          >
                            Save
                          </button>
                          <button 
                            className="btn btn-ghost btn-xs"
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View Mode
                    <>
                      <td>{formatValue(product.name)}</td>
                      <td>{formatValue(product.quantity)}</td>
                      <td>{formatValue(product.unitPrice)}</td>
                      <td>{formatValue(product.tax)}</td>
                      <td>{formatValue(product.priceWithTax)}</td>
                      <td>{formatValue(product.discount)}</td>
                      <td>
                        <div className="flex space-x-2">
                          <button 
                            className="btn btn-info btn-xs"
                            onClick={() => handleEditProduct(product)}
                          >
                            Edit
                          </button>
                          <button 
                            className="btn btn-error btn-xs"
                            onClick={() => handleDeleteProduct(product.id)}
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
                <td colSpan="7" className="text-center">No products available</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductsTab;