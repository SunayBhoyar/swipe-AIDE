import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { addInvoice } from "../features/invoicesSlice";
import { addCustomer } from "../features/customersSlice";
import { addProduct } from "../features/productsSlice";


const apiKey = process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const invoicePrompt = `
Enhanced Invoice Extraction Specification
OUTPUT FORMAT [MUST BE ONLY THIS JSON OUTPUT AND NO OTHER DATA/TEXT]
{
    "invoices": [
        {
            "serialNumber": string,    // Invoice ID/Number
            "customerName": string,    // Customer/Business name
            "productNames": [string],  // List of Product/Service names
            "totalQuantity": number,   // Total quantity across all products
            "tax": number,             // Total tax amount
            "totalAmount": number,     // Total including tax
            "date": string             // Format: YYYY-MM-DD
        }
    ],
    "products": [
        {
            "name": string,            // Product name
            "quantity": number,        // Product Quantity
            "unitPrice": number,       // Product per unit price 
            "tax": number,             // Product tax
            "priceWithTax": number,    // Product amount with tax
            "discount": number,        // Product discount
            "category": string,        // Product category (optional)
            "sku": string              // Product SKU/ID (optional)
        }
    ],
    "customers": [
        {
            "name": string,             // Customer name 
            "phoneNumber": number,      // Customer phone number  
            "totalPurchaseAmount": number, // Customer total amount purchased
            "invoiceCount": number,     // Number of invoices for this customer
            "purchaseHistory": [        // Optional purchase details
                {
                    "invoiceNumber": string,
                    "date": string,
                    "amount": number
                }
            ]
        }
    ],
    "summary": {
        "totalInvoices": number,        // Total number of invoices
        "totalProducts": number,        // Total number of unique products
        "totalCustomers": number,       // Total number of unique customers
        "grandTotal": number,           // Total amount across all invoices
        "averageInvoiceAmount": number  // Average invoice amount
    }
}
EXTRACTION RULES
1. Multi-Entity Handling

Invoices:

Support multiple invoices in a single document
Each invoice gets a unique entry in the "invoices" array
Handle consolidated reports, monthly statements, and multiple transaction documents


Products:

Create a comprehensive list of all unique products
Track products across multiple invoices
Include optional category and SKU information


Customers:

Support multiple customers in a single document
Add purchase history and invoice count for each customer
Capture comprehensive customer interaction details



2. Data Types and Processing

Null Values:

Use null for missing or unavailable fields
Maintain data integrity across multiple entries


Monetary Values:

Convert all monetary values to numbers
Remove currency symbols
Round to 2 decimal places
Handle thousand separators



3. Validation and Consistency

Serial Number Format:

Enforce consistent invoice number patterns
Validate unique identifiers
Remove special characters


Tax and Total Amount Verification:

Cross-validate tax calculations
Ensure total amounts match individual product calculations
Check for consistency across multiple invoices


Date Handling:

Standardize to YYYY-MM-DD format
Set to null if invalid or missing
Support date ranges for monthly reports



4. Advanced Features

Summary Section:

Provide an overview of the entire document
Calculate total invoices, products, and customers
Compute grand total and average invoice amount



EXAMPLE OUTPUT
jsonCopy{
    "invoices": [
        {
            "serialNumber": "INV-2024-001",
            "customerName": "Acme Corp",
            "productNames": ["Office Supplies", "Computer Monitor"],
            "totalQuantity": 10,
            "tax": 25.50,
            "totalAmount": 275.50,
            "date": "2024-03-20"
        },
        {
            "serialNumber": "INV-2024-002",
            "customerName": "Tech Solutions",
            "productNames": ["Laptop", "Software License"],
            "totalQuantity": 3,
            "tax": 50.00,
            "totalAmount": 1500.00,
            "date": "2024-03-25"
        }
    ],
    "products": [
        {
            "name": "Office Supplies",
            "quantity": 5,
            "unitPrice": 20.00,
            "tax": 10.00,
            "priceWithTax": 110.00,
            "discount": 5.00,
            "category": "Stationery",
            "sku": "OFF-SUP-001"
        },
        {
            "name": "Computer Monitor",
            "quantity": 5,
            "unitPrice": 30.00,
            "tax": 15.50,
            "priceWithTax": 165.50,
            "discount": 0,
            "category": "Electronics",
            "sku": "MON-LCD-002"
        }
    ],
    "customers": [
        {
            "name": "John Doe",
            "phoneNumber": 1234567890,
            "totalPurchaseAmount": 275.50,
            "invoiceCount": 1,
            "purchaseHistory": [
                {
                    "invoiceNumber": "INV-2024-001",
                    "date": "2024-03-20",
                    "amount": 275.50
                }
            ]
        },
        {
            "name": "Jane Smith",
            "phoneNumber": 9876543210,
            "totalPurchaseAmount": 1500.00,
            "invoiceCount": 1,
            "purchaseHistory": [
                {
                    "invoiceNumber": "INV-2024-002",
                    "date": "2024-03-25",
                    "amount": 1500.00
                }
            ]
        }
    ],
    "summary": {
        "totalInvoices": 2,
        "totalProducts": 4,
        "totalCustomers": 2,
        "grandTotal": 1775.50,
        "averageInvoiceAmount": 887.75
    }
}
PROCESSING GUIDELINES

Preserve original data context
Handle partial or incomplete information gracefully
Prioritize data accuracy and completeness
Support flexible document structures
Prepare for various financial document types
`;

/**
 * Converts a File object to base64
 * @param {File} file - The file object to convert
 * @returns {Promise<Object>} - Object containing base64 data and mime type
 */
const fileToGenerativePart = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


function validateAndConvertData(inputString) {
    // Check if input is a string
    if (typeof inputString !== 'string') {
        console.error("Input must be a string");
        return null;
    }

    try {
        // Trim the input and remove any JSON code block markers
        const cleanString = inputString.trim().replace(/^```json|```$/g, '');

        // Attempt to parse the JSON string
        let parsedData;
        try {
            parsedData = JSON.parse(cleanString);
        } catch (parseError) {
            console.error("Invalid JSON format:", parseError.message);
            return null;
        }

        // Validation function for the entire data structure
        function validateDataStructure(data) {
            // Check if all required top-level keys exist
            const requiredKeys = ['invoices', 'products', 'customers', 'summary'];
            requiredKeys.forEach(key => {
                if (!data.hasOwnProperty(key)) {
                    throw new Error(`Missing required key: ${key}`);
                }
            });

            // Validate invoices array
            if (!Array.isArray(data.invoices)) {
                throw new Error("Invoices must be an array");
            }
            data.invoices.forEach((invoice, index) => {
                try {
                    validateInvoice(invoice);
                } catch (error) {
                    throw new Error(`Invalid invoice at index ${index}: ${error.message}`);
                }
            });

            // Validate products array
            if (!Array.isArray(data.products)) {
                throw new Error("Products must be an array");
            }
            data.products.forEach((product, index) => {
                try {
                    validateProduct(product);
                } catch (error) {
                    throw new Error(`Invalid product at index ${index}: ${error.message}`);
                }
            });

            // Validate customers array
            if (!Array.isArray(data.customers)) {
                throw new Error("Customers must be an array");
            }
            data.customers.forEach((customer, index) => {
                try {
                    validateCustomer(customer);
                } catch (error) {
                    throw new Error(`Invalid customer at index ${index}: ${error.message}`);
                }
            });

            // Validate summary object
            validateSummary(data.summary);
        }

        // Validate individual invoice
        function validateInvoice(invoice) {
            const requiredFields = [
                'serialNumber', 'customerName', 'productNames', 
                'totalQuantity', 'tax', 'totalAmount', 'date'
            ];

            // Modified to allow null for some fields
            requiredFields.forEach(field => {
                if (invoice[field] === undefined) {
                    throw new Error(`Missing required invoice field: ${field}`);
                }
            });

            // Detailed type and format checking with null allowance
            if (invoice.serialNumber !== null && (typeof invoice.serialNumber !== 'string' || invoice.serialNumber.trim() === '')) {
                throw new Error('Invoice serialNumber must be a non-empty string');
            }
            if (invoice.customerName !== null && (typeof invoice.customerName !== 'string' || invoice.customerName.trim() === '')) {
                throw new Error('Invoice customerName must be a non-empty string');
            }
            if (invoice.productNames !== null) {
                if (!Array.isArray(invoice.productNames) || invoice.productNames.length === 0) {
                    throw new Error('Invoice productNames must be a non-empty array of strings');
                }
                invoice.productNames.forEach(name => {
                    if (name !== null && (typeof name !== 'string' || name.trim() === '')) {
                        throw new Error('Each product name must be a non-empty string');
                    }
                });
            }
            if (invoice.totalQuantity !== null && (typeof invoice.totalQuantity !== 'number' || invoice.totalQuantity < 0)) {
                throw new Error('Invoice totalQuantity must be a non-negative number');
            }
            if (invoice.tax !== null && (typeof invoice.tax !== 'number' || invoice.tax < 0)) {
                throw new Error('Invoice tax must be a non-negative number');
            }
            if (invoice.totalAmount !== null && (typeof invoice.totalAmount !== 'number' || invoice.totalAmount < 0)) {
                throw new Error('Invoice totalAmount must be a non-negative number');
            }
            if (invoice.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(invoice.date)) {
                throw new Error('Invoice date must be in YYYY-MM-DD format');
            }
        }

        // Validate individual product
        function validateProduct(product) {
            const requiredFields = [
                'name', 'quantity', 'unitPrice', 
                'tax', 'priceWithTax', 'discount'
            ];

            // Modified to allow null for some fields
            requiredFields.forEach(field => {
                if (product[field] === undefined) {
                    throw new Error(`Missing required product field: ${field}`);
                }
            });

            // Detailed type checking with null allowance
            if (product.name !== null && (typeof product.name !== 'string' || product.name.trim() === '')) {
                throw new Error('Product name must be a non-empty string');
            }
            if (product.quantity !== null && (typeof product.quantity !== 'number' || product.quantity < 0)) {
                throw new Error('Product quantity must be a non-negative number');
            }
            if (product.unitPrice !== null && (typeof product.unitPrice !== 'number' || product.unitPrice < 0)) {
                throw new Error('Product unitPrice must be a non-negative number');
            }
            if (product.tax !== null && (typeof product.tax !== 'number' || product.tax < 0)) {
                throw new Error('Product tax must be a non-negative number');
            }
            if (product.priceWithTax !== null && (typeof product.priceWithTax !== 'number' || product.priceWithTax < 0)) {
                throw new Error('Product priceWithTax must be a non-negative number');
            }
            if (product.discount !== null && (typeof product.discount !== 'number' || product.discount < 0)) {
                throw new Error('Product discount must be a non-negative number');
            }

            // Optional fields validation
            if (product.category !== undefined && product.category !== null) {
                if (typeof product.category !== 'string' || product.category.trim() === '') {
                    throw new Error('Product category must be a non-empty string');
                }
            }
            if (product.sku !== undefined && product.sku !== null) {
                if (typeof product.sku !== 'string' || product.sku.trim() === '') {
                    throw new Error('Product sku must be a non-empty string');
                }
            }
        }

        // Validate individual customer
        function validateCustomer(customer) {
            const requiredFields = [
                'name', 'phoneNumber', 
                'totalPurchaseAmount', 'invoiceCount'
            ];

            // Modified to allow null for some fields
            requiredFields.forEach(field => {
                if (customer[field] === undefined) {
                    throw new Error(`Missing required customer field: ${field}`);
                }
            });

            // Detailed type checking with null allowance
            if (customer.name !== null && (typeof customer.name !== 'string' || customer.name.trim() === '')) {
                throw new Error('Customer name must be a non-empty string');
            }
            if (customer.phoneNumber !== null && (typeof customer.phoneNumber !== 'number' || customer.phoneNumber <= 0)) {
                throw new Error('Customer phoneNumber must be a positive number');
            }
            if (customer.totalPurchaseAmount !== null && (typeof customer.totalPurchaseAmount !== 'number' || customer.totalPurchaseAmount < 0)) {
                throw new Error('Customer totalPurchaseAmount must be a non-negative number');
            }
            if (customer.invoiceCount !== null && (typeof customer.invoiceCount !== 'number' || customer.invoiceCount < 0)) {
                throw new Error('Customer invoiceCount must be a non-negative number');
            }

            // Optional purchase history validation
            if (customer.purchaseHistory !== undefined && customer.purchaseHistory !== null) {
                if (!Array.isArray(customer.purchaseHistory)) {
                    throw new Error('Customer purchaseHistory must be an array');
                }
                customer.purchaseHistory.forEach((purchase, index) => {
                    if (purchase.invoiceNumber !== null && (typeof purchase.invoiceNumber !== 'string' || purchase.invoiceNumber.trim() === '')) {
                        throw new Error(`Purchase invoiceNumber at index ${index} must be a non-empty string`);
                    }
                    if (purchase.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(purchase.date)) {
                        throw new Error(`Purchase date at index ${index} must be in YYYY-MM-DD format`);
                    }
                    if (purchase.amount !== null && (typeof purchase.amount !== 'number' || purchase.amount < 0)) {
                        throw new Error(`Purchase amount at index ${index} must be a non-negative number`);
                    }
                });
            }
        }

        // Validate summary object
        function validateSummary(summary) {
            const requiredFields = [
                'totalInvoices', 'totalProducts', 
                'totalCustomers', 'grandTotal', 'averageInvoiceAmount'
            ];

            // Modified to allow null for some fields
            requiredFields.forEach(field => {
                if (summary[field] === undefined) {
                    throw new Error(`Missing required summary field: ${field}`);
                }
            });

            // Detailed type checking with null allowance
            if (summary.totalInvoices !== null && (typeof summary.totalInvoices !== 'number' || summary.totalInvoices < 0)) {
                throw new Error('Summary totalInvoices must be a non-negative number');
            }
            if (summary.totalProducts !== null && (typeof summary.totalProducts !== 'number' || summary.totalProducts < 0)) {
                throw new Error('Summary totalProducts must be a non-negative number');
            }
            if (summary.totalCustomers !== null && (typeof summary.totalCustomers !== 'number' || summary.totalCustomers < 0)) {
                throw new Error('Summary totalCustomers must be a non-negative number');
            }
            if (summary.grandTotal !== null && (typeof summary.grandTotal !== 'number' || summary.grandTotal < 0)) {
                throw new Error('Summary grandTotal must be a non-negative number');
            }
            if (summary.averageInvoiceAmount !== null && (typeof summary.averageInvoiceAmount !== 'number' || summary.averageInvoiceAmount < 0)) {
                throw new Error('Summary averageInvoiceAmount must be a non-negative number');
            }
        }

        // Run validation
        validateDataStructure(parsedData);

        // If validation passes, return the parsed data
        return parsedData;
    } catch (error) {
        console.error("Validation failed:", error.message);
        return null; // Return null if validation fails
    }
}


const convertMultiPagePdfToImages = async (pdfFile) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const arrayBuffer = e.target.result;

            // Load pdf.js library
            const pdfjsLib = await import('pdfjs-dist');
            
            // Set workerSrc for pdf.js (this should work if the worker file is accessible)
            pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js";

            const images = [];
            
            try {
                // Load PDF document
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                
                // Loop through all the pages
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    
                    const viewport = page.getViewport({ scale: 2.0 }); // Adjust scale for better resolution
                    
                    // Create a canvas element for rendering the page
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.height = viewport.height;
                    canvas.width = viewport.width;
                    
                    // Render the page onto the canvas
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                    }).promise;

                    // Convert canvas to Blob and then to File
                    const imageBlob = await new Promise((resolveBlob) => {
                        canvas.toBlob((blob) => resolveBlob(blob));
                    });

                    // Push the image into the result array
                    images.push(new File([imageBlob], `pdf_page_${i}.png`, { type: 'image/png' }));
                }
                
                // Resolve the promise with the array of images
                resolve(images);
            } catch (error) {
                reject(error);
            }
        };

        // Read the PDF file as ArrayBuffer
        reader.readAsArrayBuffer(pdfFile);
    });
};


const convertXlsxToImage = async (xlsxFile) => {
    const workbook = XLSX.read(await xlsxFile.arrayBuffer());
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const htmlString = XLSX.utils.sheet_to_html(worksheet);
    
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = htmlString;
    document.body.appendChild(tempContainer);
  
    const canvas = await html2canvas(tempContainer);
    // Convert the canvas to a Blob
    canvas.toBlob((blob) => {
        if (!blob) return; // Ensure the Blob exists

        // Create a URL for the Blob
        const blobURL = URL.createObjectURL(blob);

        // Programmatically download the file
        const downloadLink = document.createElement("a");
        downloadLink.href = blobURL;
        downloadLink.download = "snapshot.png"; // Set the file name
        document.body.appendChild(downloadLink); // Append to the document
        downloadLink.click(); // Trigger the download
        document.body.removeChild(downloadLink); // Clean up the DOM

        // Revoke the object URL after use
        URL.revokeObjectURL(blobURL);
    }, "image/png"); // Specify image type
    
    document.body.removeChild(tempContainer);
  
    return await new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(new File([blob], 'invoice.png', { type: 'image/png' }));
      });
    });
  };

/**
 * Gets Invoice data of an image using Gemini Vision API
 * @param {File} imageFile - The image file object
 * @param {string} prompt - Custom prompt for the model 
 * @returns {Promise<string>} - The generated description
 */

export const getDetailsFromInvoice = async (imageFile, prompt = invoicePrompt) => {
  try {
    if (!imageFile) {
      throw new Error("No image file provided");
    }

    if (!imageFile.type.startsWith('image/')) {
      throw new Error("File must be an image");
    }

    const imagePart = await fileToGenerativePart(imageFile);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response;
  } catch (error) {
    console.error("Error getting invoice data:", error);
    throw error;
  }
};

/**
 * Process image file and update Redux store with results
 * @param {File} imageFile - The image file object
 * @param {Function} dispatch - Redux dispatch function
 * @returns {Promise<Object>} - Processing result
 */
export const processFile = async (inputFile, dispatch) => {
  try {
    let imagesToProcess = [];
    
    switch (inputFile.type) {
      case 'application/pdf':
        imagesToProcess = await convertMultiPagePdfToImages(inputFile);
        break;
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
      case 'application/vnd.ms-excel':
        imagesToProcess = [await convertXlsxToImage(inputFile)];
        break;
      case 'image/jpeg':
      case 'image/png':
      case 'image/gif':
        imagesToProcess = [inputFile];
        break;
      default:
        throw new Error('Unsupported file type');
    }

    // Process each image and aggregate results
    const processedResults = [];
    for (const imageFile of imagesToProcess) {
      // Get image invoice details from Gemini
      const invoiceDetails = await getDetailsFromInvoice(imageFile);

      if (invoiceDetails.text()) {
        const data = invoiceDetails.text();
        const JSONdata = validateAndConvertData(data);
        console.log(JSONdata);
        
        if (JSONdata) {
          processedResults.push(JSONdata);
          
          // Update Redux store for each page's data
          if (JSONdata["invoices"]){
            JSONdata["invoices"].forEach(invoice => {
              dispatch(addInvoice(invoice));
            });
          } 
          if (JSONdata["products"]){
            JSONdata["products"].forEach(product => {
              dispatch(addProduct(product));
            });
          } 
          if (JSONdata["customers"]){
            JSONdata["customers"].forEach(customer => {
              dispatch(addCustomer(customer));
            });
          }
        }
      }
    }

    // Combine results
    const combinedData = {
      invoices: processedResults.map(result => result.invoice).filter(Boolean),
      products: processedResults.map(result => result.product).filter(Boolean),
      customers: processedResults.map(result => result.customer).filter(Boolean)
    };

    return { 
      success: true, 
      data: combinedData 
    };

  } catch (error) {
    console.error("Error processing multi-page document:", error);
    return { 
      success: false, 
      error: error.message,
    };
  }
};