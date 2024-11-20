import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { processFile } from '../../services/aiService';

const FileUpload = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const dispatch = useDispatch();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setUploadMessage('Please select a file before uploading.');
      return;
    }

    setUploadMessage('Uploading and processing file...');

    try {
      // Call the AI service function to process the file and dispatch the result
      const data = await processFile(selectedFile, dispatch);
      if (data.success) {
        setUploadMessage('File processed successfully!');
      } else {
        setUploadMessage('File processed with some issues.');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      setUploadMessage('An error occurred while processing the file.');
    }
  };

  return (
    <div>
      <h2>Upload and Process File</h2>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
      <p>{uploadMessage}</p>
    </div>
  );
};

export default FileUpload;
