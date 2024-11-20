import React from 'react';
import { useSelector } from 'react-redux';

// InvoicesTab component for displaying invoice data
const InvoicesTab = () => {
  // Get the invoices data from the Redux store
  const invoices = useSelector((state) => state.invoices.invoices);

  return (
    <div className="invoices-tab">
      <h2>Invoices</h2>
      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Serial Number</th>
            <th>Customer Name</th>
            <th>Product Name</th>
            <th>Quantity</th>
            <th>Tax</th>
            <th>Total Amount</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {invoices.length > 0 ? (
            invoices.map((invoice, index) => (
              <tr key={index}>
                <td>{invoice.serialNumber}</td>
                <td>{invoice.customerName}</td>
                <td>{invoice.productName}</td>
                <td>{invoice.quantity}</td>
                <td>{invoice.tax}</td>
                <td>{invoice.totalAmount}</td>
                <td>{invoice.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7">No invoices available</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default InvoicesTab;
