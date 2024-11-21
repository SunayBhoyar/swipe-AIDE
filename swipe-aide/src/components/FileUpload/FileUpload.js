import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { processFile } from "../../services/aiService";

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [fileDescription, setFileDescription] = useState(""); // State to hold AI description
  const dispatch = useDispatch();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file before uploading.");
      return;
    }

    setUploadMessage("Uploading and processing file...");

    try {
      // Process the file and get AI-generated description
      const result = await processFile(selectedFile, dispatch);
      if (result.success) {
        setUploadMessage("File processed successfully!");
        setFileDescription(result.description || ""); // Assuming description is returned
      } else {
        setUploadMessage("File processed with some issues.");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      setUploadMessage("An error occurred while processing the file.");
    }
  };

  return (
    <div>
      <h2>Upload and Process File</h2>
      <input type="file" onChange={handleFileChange} />
      <button className="btn btn-primary" onClick={handleFileUpload}>Upload</button>
      <p>{uploadMessage}</p>
      {fileDescription && (
        <div>
          <h3>AI-Generated Description:</h3>
          <p>{fileDescription}</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
