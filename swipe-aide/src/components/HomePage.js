import React from 'react';

function HomePage() {
  return (
    <div className="text-center">
      {/* Banner */}
      <div className="bg-blue-500 text-white py-10">
        <h1 className="text-4xl font-bold">Welcome to Swipe AIDE</h1>
        <p className="text-lg mt-2">A streamlined tool for managing invoices, products, and customers efficiently.</p>
      </div>

      {/* Project Information */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold">About the Project</h2>
        <p className="mt-4 mx-auto max-w-2xl text-gray-700">
          Swipe AIDE is designed to simplify your business operations by providing an easy-to-use platform for managing invoices, products, and customer data. 
          Seamlessly upload files, track data, and improve productivity.
        </p>
      </div>

      {/* How to Use Section */}
      <div className="mt-8 bg-gray-100 p-6 rounded-md shadow-md mx-auto max-w-3xl">
        <h2 className="text-2xl font-semibold mb-4">How to Use Swipe AIDE</h2>
        <ol className="text-left list-decimal list-inside text-gray-700">
          <li className="mb-3">
            Navigate to the <b>Upload</b> tab using the navigation bar at the top.
          </li>
          <li className="mb-3">
            Add your files to the queue by clicking the <b>Choose Files</b> button.
          </li>
          <li className="mb-3">
            Once your files are added, click <b>Upload</b> to begin processing.
          </li>
          <li className="mb-3">
            After processing is complete, the data will be automatically populated in the respective tabs:
            <ul className="list-disc list-inside ml-6 mt-2">
              <li><b>Invoices</b> tab for invoice-related data.</li>
              <li><b>Customers</b> tab for customer-related data.</li>
              <li><b>Products</b> tab for product-related data.</li>
            </ul>
          </li>
        </ol>
      </div>

      {/* GitHub Link */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold">Explore the Source Code</h3>
        <p className="mt-2">
          Check out the complete project on GitHub:
        </p>
        <a 
          href="https://github.com/SunayBhoyar/Swipe_AIDE/tree/main" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          GitHub Repository
        </a>
      </div>

      {/* Footer */}
      <footer className="mt-10 text-sm text-gray-600">
        © 2024 Swipe AIDE. All Rights Reserved.
      </footer>
    </div>
  );
}

export default HomePage;
