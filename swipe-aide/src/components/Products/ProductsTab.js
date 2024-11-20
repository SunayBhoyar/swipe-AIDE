// src/components/Products/ProductsTab.js

import React from 'react';
import { useSelector } from 'react-redux';

const ProductsTab = () => {
  const products = useSelector((state) => state.products.products);

  return (
    <div>
      <h2>Products</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Name</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Tax</th>
            <th>Price with Tax</th>
            <th>Discount (Optional)</th>
          </tr>
        </thead>
        <tbody>
          {products.length > 0 ? (
            products.map((product, index) => (
              <tr key={index}>
                <td>{product.name}</td>
                <td>{product.quantity}</td>
                <td>{product.unitPrice}</td>
                <td>{product.tax}</td>
                <td>{product.priceWithTax}</td>
                <td>{product.discount || 'N/A'}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6">No products available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default ProductsTab;
