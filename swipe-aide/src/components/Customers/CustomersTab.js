// src/components/Customers/CustomersTab.js

import React from 'react';
import { useSelector } from 'react-redux';

const CustomersTab = () => {
  const customers = useSelector((state) => state.customers.customers);

  return (
    <div>
      <h2>Customers</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Customer Name</th>
            <th>Phone Number</th>
            <th>Total Purchase Amount</th>
          </tr>
        </thead>
        <tbody>
          {customers.length > 0 ? (
            customers.map((customer, index) => (
              <tr key={index}>
                <td>{customer.name}</td>
                <td>{customer.phoneNumber}</td>
                <td>{customer.totalPurchaseAmount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3">No customers available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersTab;
