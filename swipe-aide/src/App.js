import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import InvoicesTab from './components/Invoices/InvoicesTab';
import ProductsTab from './components/Products/ProductsTab';
import CustomersTab from './components/Customers/CustomersTab';
import FileUpload from './components/FileUpload/FileUpload';

const App = () => {
  return (
    <Router>
      <nav>
        <NavLink to="/invoices">Invoices</NavLink>
        <NavLink to="/products">Products</NavLink>
        <NavLink to="/customers">Customers</NavLink>
        <NavLink to="/upload">Upload</NavLink> {/* Link for the upload route */}
      </nav>

      <Routes>
        <Route path="/invoices" element={<InvoicesTab />} />
        <Route path="/products" element={<ProductsTab />} />
        <Route path="/customers" element={<CustomersTab />} />
        <Route path="/upload" element={<FileUpload />} /> {/* File upload route */}
      </Routes>
    </Router>
  );
};

export default App;
