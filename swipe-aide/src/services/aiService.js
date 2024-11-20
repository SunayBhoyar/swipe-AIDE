import { GoogleGenerativeAI } from "@google/generative-ai";
import { addInvoice } from "../features/invoicesSlice";
import { updateCustomer } from "../features/customersSlice";
import { updateProduct } from "../features/productsSlice";
import axios from "axios";

const apiKey = process.env.REACT_APP_GOOGLE_GENAI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

const invoicePrompt = `
Analyze the provided invoice image and extract data according to these specifications:

REQUIRED OUTPUT FORMAT:
{
    "invoice": {
        "serialNumber": string,    // Invoice ID/Number
        "customerName": string,    // Customer/Business name
        "productName": string,     // Product/Service name
        "quantity": number,        // Total quantity
        "tax": number,             // Tax amount
        "totalAmount": number,     // Total including tax
        "date": string             // Format: YYYY-MM-DD
    },
    "product": {
        "name": string,            // Product name
        "quantity": number,        // Product Quantity
        "unitPrice": number,       // Product per unit price 
        "tax": number,             // Product tax
        "priceWithTax": number,    // Product amount with tax
        "discount": number         // Product discount       
    },
    "customer": {
        "name": string,             // Customer name 
        "phoneNumber": number,      // Customer phone number  
        "totalPurchaseAmount"       // Customer total amount purchased 
    }
}

EXTRACTION RULES:
   1. Data Types:
        - Null Values: Use null for missing fields.
        - Monetary Values: Convert all monetary values to numbers, removing currency symbols (e.g., "$10.50" → 10.50).
        - Rounding: Round all monetary values to 2 decimal places for consistency.
        - Date Format: Ensure dates are in the format YYYY-MM-DD. If missing or invalid, use null.
    2. Text Processing:
        - Special Characters: Remove special characters from text fields, such as punctuation marks (e.g., periods, slashes, etc.).
        - Preserve Case: Preserve the original case for names and descriptions (e.g., "Acme Corp" should not be transformed into "ACME CORP").
        - Whitespaces: Strip leading and trailing whitespaces from text fields to ensure clean data.
3. Numerical Processing:
        - Correct Data Types: Convert all numbers to the appropriate data types:
        - Quantity: Must be an integer (e.g., "5" → 5).
        - Prices and Amounts: Should be floats (e.g., "100.50" → 100.50).
        - Thousand Separators: Remove thousand separators (e.g., "1,000" → 1000).
4. Product Handling:
        - Visible Product Details: Extract all visible product details, such as:
                Name
                Quantity
                Unit Price
                Description
                Category
        - SKU/ID: If a SKU or product ID is available, it must be included.
        - Categories: If present, note product categories (e.g., "Stationery" or "Electronics").
5. Validation Requirements:
        - Serial Number Format: Ensure the invoice serial number follows the defined format (e.g., INV-2024-001). Do not allow special characters like slashes or incorrect patterns.
        - Tax Calculation Verification: Verify that the tax value is consistent with the product's price and tax rates, if possible.
        - Total Amount Validation: Ensure the total amount correctly reflects the sum of individual product prices, taxes, and discounts (if applicable).
        - Date Format Compliance: Ensure all date fields are in the YYYY-MM-DD format. If the date is invalid or missing, it should be set to null.

EXAMPLES:
Good output:
{
    "invoice": {
        "serialNumber": "INV-2024-001",
        "customerName": "Acme Corp",
        "productName": "Office Supplies",
        "quantity": 5,
        "tax": 10.50,
        "totalAmount": 110.50,
        "date": "2024-03-20"
    },
    "product": {
        "name": "Office Supplies",
        "quantity": 5,
        "unitPrice": 20.00,
        "tax": 10.00,
        "priceWithTax": 110.00,
        "discount": 5.00
    },
    "customer": {
        "name": "John Doe",
        "phoneNumber": 1234567890,
        "totalPurchaseAmount": 110.50
    }
}

Bad output (avoid):
{
    "invoice": {
        "serialNumber": "INV/2024/001",  // Contains special characters
        "customerName": "ACME CORP.",     // Unnecessary period
        "productName": "Office Supplies",
        "quantity": "5",                  // Should be integer, not string
        "tax": "$10.50",                  // Should be number without currency
        "totalAmount": "110.50",          // Should be a float, not a string
        "date": "20/03/2024"              // Wrong date format (Should be YYYY-MM-DD)
    },
    "product": {
        "name": "Office Supplies",
        "quantity": 5,
        "unitPrice": "20.00",             // Should be a float, not a string
        "tax": "$10.00",                  // Should be number without currency
        "priceWithTax": "110.00",         // Should be a float, not a string
        "discount": "$5.00"               // Should be number without currency
    },
    "customer": {
        "name": "john doe",               // Name should be properly capitalized
        "phoneNumber": "123-456-7890",     // Should be a number, not a string with special characters
        "totalPurchaseAmount": "110.50"    // Should be a number, not a string
    }
}
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
      // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
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

/**
 * Gets description of an image using Gemini Vision API
 * @param {File} imageFile - The image file object
 * @param {string} prompt - Custom prompt for the model (optional)
 * @returns {Promise<string>} - The generated description
 */

export const getImageDescription = async (imageFile, prompt = invoicePrompt) => {
  try {
    if (!imageFile) {
      throw new Error("No image file provided");
    }

    // Validate file type
    if (!imageFile.type.startsWith('image/')) {
      throw new Error("File must be an image");
    }

    const imagePart = await fileToGenerativePart(imageFile);
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error getting image description:", error);
    throw error;
  }
};

/**
 * Process image file and update Redux store with results
 * @param {File} imageFile - The image file object
 * @param {Function} dispatch - Redux dispatch function
 * @returns {Promise<Object>} - Processing result
 */
export const processFile = async (imageFile, dispatch) => {
  try {
    // Get image description from Gemini
    const description = await getImageDescription(imageFile);
    console.log("AI-Generated Description:", description);

    // Prepare form data for backend
    const formData = new FormData();
    formData.append("file", imageFile);
    formData.append("description", description);

    // Send to backend
    const response = await axios.post("/api/process-file", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data) {
      const { invoices, products, customers } = response.data;

      // Update Redux store
      if (invoices) dispatch(addInvoice(invoices));
      if (products) dispatch(updateProduct(products));
      if (customers) dispatch(updateCustomer(customers));

      return { 
        success: true, 
        description,
        data: response.data 
      };
    }

    return { 
      success: false, 
      description 
    };

  } catch (error) {
    console.error("Error processing image:", error);

    // Fallback mock data
    const mockData = {
      invoices: {
        serialNumber: "INV001",
        customerName: "John Doe",
        productName: "Product A",
        quantity: 2,
        tax: 10,
        totalAmount: 110,
        date: "2024-11-20",
      },
      products: [
        { productName: "Product A", price: 50 },
        { productName: "Product B", price: 75 },
      ],
      customers: [
        { name: "John Doe", email: "john@example.com" },
        { name: "Jane Smith", email: "jane@example.com" },
      ],
    };

    // Update Redux store with mock data
    dispatch(addInvoice(mockData.invoices));
    dispatch(updateProduct(mockData.products));
    dispatch(updateCustomer(mockData.customers));

    return { 
      success: false, 
      error: error.message,
      mockData: true 
    };
  }
};

