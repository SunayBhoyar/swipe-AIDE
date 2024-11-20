import * as pdfjsLib from 'pdfjs-dist';
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


function validateAndConvertData(dataString) {
    try {
        const cleanString = dataString.trim().replace(/^```json|```$/g, '');
        const parsedData = JSON.parse(cleanString);

        function validateStructure(data) {
            const expectedStructure = {
                invoice: {
                    serialNumber: "string|null",
                    customerName: "string|null",
                    productName: "string|null", 
                    quantity: "number|null",
                    tax: "number|null",
                    totalAmount: "number|null",
                    date: "string|null", 
                },
                product: {
                    name: "string|null|array",
                    quantity: "number|null|array",
                    unitPrice: "number|null|array",
                    tax: "number|null|array",
                    priceWithTax: "number|null|array",
                    discount: "number|null|array",
                },
                customer: {
                    name: "string|null",
                    phoneNumber: "number|null",
                    totalPurchaseAmount: "number|null",
                },
            };

            // Helper function to check data type
            function checkType(value, expectedType) {
                if (expectedType.includes("|")) {
                    // For multiple allowed types
                    const types = expectedType.split("|");
                    return types.some((type) => checkType(value, type));
                }
                if (expectedType === "null") return value === null;
                return typeof value === expectedType;
            }

            // Recursive validation
            function validateObject(obj, structure) {
                for (const key in structure) {
                    if (!obj.hasOwnProperty(key)) {
                        throw new Error(`Missing key: ${key}`);
                    }
                    const expectedType = structure[key];
                    const value = obj[key];
                    if (typeof expectedType === "object") {
                        // Nested object validation
                        validateObject(value, expectedType);
                    } else if (!checkType(value, expectedType)) {
                        throw new Error(`Invalid type for key: ${key}`);
                    }
                }
            }

            // Start validation
            validateObject(data, expectedStructure);
        }

        // Validate parsed data
        validateStructure(parsedData);

        // If validation passes, return the JSON object
        return parsedData;
    } catch (error) {
        console.error("Validation failed:", error.message);
        return null; // Return null if validation fails
    }
}

const convertMultiPagePdfToImages = async (pdfFile) => {
    const pdf = await pdfjsLib.getDocument(URL.createObjectURL(pdfFile)).promise;
    const images = [];
  
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      
      const imageBlob = await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        });
      });
  
      images.push(new File([imageBlob], `invoice_page_${pageNum}.png`, { type: 'image/png' }));
    }
    return images;
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
        
        if (JSONdata) {
          processedResults.push(JSONdata);
          
          // Update Redux store for each page's data
          if (JSONdata["invoice"]) dispatch(addInvoice(JSONdata["invoice"]));
          if (JSONdata["product"]) dispatch(addProduct(JSONdata["product"]));
          if (JSONdata["customer"]) dispatch(addCustomer(JSONdata["customer"]));
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