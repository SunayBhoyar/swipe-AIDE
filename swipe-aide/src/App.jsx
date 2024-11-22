import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import InvoicesTab from './components/Invoices/InvoicesTab';
import ProductsTab from './components/Products/ProductsTab';
import CustomersTab from './components/Customers/CustomersTab';
import FileUpload from './components/FileUpload/FileUpload';
import "./App.css"

const App = () => {
  return (
    <div data-theme="cupcake" className="min-h-screen">
      <Router>
        <div className="navbar bg-base-100 shadowxw-lg">
          <div className="navbar-start">
            <div className="dropdown">
              <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
                </svg>
              </div>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <NavLink 
                    to="/invoices" 
                    className={({ isActive }) => 
                      isActive ? "bg-primary text-primary-content" : ""
                    }
                  >
                    Invoices
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/products" 
                    className={({ isActive }) => 
                      isActive ? "bg-primary text-primary-content" : ""
                    }
                  >
                    Products
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/customers" 
                    className={({ isActive }) => 
                      isActive ? "bg-primary text-primary-content" : ""
                    }
                  >
                    Customers
                  </NavLink>
                </li>
                <li>
                  <NavLink 
                    to="/upload" 
                    className={({ isActive }) => 
                      isActive ? "bg-primary text-primary-content" : ""
                    }
                  >
                    Upload
                  </NavLink>
                </li>
              </ul>
            </div>
            <div className="btn btn-ghost text-xl">SWIPE-AIDE</div>
          </div>
          <div className="navbar-center hidden lg:flex">
            <ul className="menu menu-horizontal px-1">
              <li>
                <NavLink 
                  to="/invoices" 
                  className={({ isActive }) => 
                    isActive ? "bg-primary text-primary-content" : ""
                  }
                >
                  Invoices
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/products" 
                  className={({ isActive }) => 
                    isActive ? "bg-primary text-primary-content" : ""
                  }
                >
                  Products
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/customers" 
                  className={({ isActive }) => 
                    isActive ? "bg-primary text-primary-content" : ""
                  }
                >
                  Customers
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/upload" 
                  className={({ isActive }) => 
                    isActive ? "bg-primary text-primary-content" : ""
                  }
                >
                  Upload
                </NavLink>
              </li>
            </ul>
          </div>
          <div className="navbar-end">
            <div className="btn btn-ghost btn-circle">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/invoices" element={<InvoicesTab />} />
            <Route path="/products" element={<ProductsTab />} />
            <Route path="/customers" element={<CustomersTab />} />
            <Route path="/upload" element={<FileUpload />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
};

export default App;