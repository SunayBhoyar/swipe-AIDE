import React, { useState, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { processFile } from "../../services/aiService";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processingQueueRef = useRef([]);
  const dispatch = useDispatch();

  // Add new files to the queue
  const handleFileChange = (event) => {
    const newFiles = Array.from(event.target.files).map(file => ({
      id: Date.now() + Math.random(),
      file,
      status: 'pending',
      progress: 0,
      description: '',
      addedAt: Date.now()
    }));
    setFiles(prev => [...prev, ...newFiles]);
    
    // Add new files to processing queue
    processingQueueRef.current = [...processingQueueRef.current, ...newFiles.map(f => f.id)];
  };

  const processNextInQueue = useCallback(async () => {
    if (processingQueueRef.current.length === 0) {
      setIsProcessing(false);
      return;
    }

    setIsProcessing(true);
    const fileId = processingQueueRef.current[0];
    const fileIndex = files.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      processingQueueRef.current.shift();
      processNextInQueue();
      return;
    }

    // Update status to processing
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing' } : f
    ));

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileId ? { ...f, progress: Math.min(f.progress + 10, 90) } : f
        ));
      }, 500);

      const result = await processFile(files[fileIndex].file, dispatch);
      
      clearInterval(progressInterval);

      setFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: result.success ? 'completed' : 'error',
          progress: 100,
          description: result.description || ''
        } : f
      ));

    } catch (error) {
      console.error("Error processing file:", error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error', progress: 100 } : f
      ));
    }

    // Remove from queue and process next
    processingQueueRef.current.shift();
    setTimeout(processNextInQueue, 500);
  }, [files, dispatch]);

  const startProcessing = () => {
    if (!isProcessing && processingQueueRef.current.length > 0) {
      processNextInQueue();
    }
  };

  const removeFile = (fileId) => {
    if (processingQueueRef.current[0] === fileId) {
      alert("Cannot remove a file that is currently processing");
      return;
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
    processingQueueRef.current = processingQueueRef.current.filter(id => id !== fileId);
  };

  const clearCompleted = () => {
    const completedIds = files
      .filter(f => f.status === 'completed' || f.status === 'error')
      .map(f => f.id);
      
    setFiles(prev => prev.filter(f => !completedIds.includes(f.id)));
    processingQueueRef.current = processingQueueRef.current.filter(id => !completedIds.includes(id));
  };

  const pendingCount = files.filter(f => f.status === 'pending').length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between items-center mb-6">
            <h2 className="card-title text-2xl">File Processing Queue</h2>
            <button 
              className="btn btn-sm btn-ghost"
              onClick={clearCompleted}
              disabled={!files.some(f => f.status === 'completed' || f.status === 'error')}
            >
              Clear Completed
            </button>
          </div>
          
          <div className="form-control w-full max-w-xs mb-4">
            <label className="label">
              <span className="label-text">Add files to queue</span>
            </label>
            <input 
              type="file" 
              multiple
              onChange={handleFileChange}
              className="file-input file-input-bordered file-input-primary w-full max-w-xs"
            />
          </div>

          {/* Upload Button */}
          <div className="mb-6">
            <button 
              className="btn btn-primary"
              onClick={startProcessing}
              disabled={isProcessing || pendingCount === 0}
            >
              {isProcessing ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Processing Queue...
                </>
              ) : pendingCount > 0 ? (
                `Process ${pendingCount} File${pendingCount > 1 ? 's' : ''}`
              ) : (
                'No Files to Process'
              )}
            </button>
          </div>

          <div className="divider">Queue Status</div>

          <div className="space-y-4">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="card bg-base-200">
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {fileObj.status === 'processing' && (
                        <span className="loading loading-spinner loading-sm"></span>
                      )}
                      <span className="font-medium">{fileObj.file.name}</span>
                    </div>
                    {fileObj.status !== 'processing' && (
                      <button 
                        className="btn btn-sm btn-circle btn-ghost"
                        onClick={() => removeFile(fileObj.id)}
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="w-full my-2">
                    <progress 
                      className={`progress w-full ${
                        fileObj.status === 'completed' ? 'progress-success' :
                        fileObj.status === 'error' ? 'progress-error' :
                        'progress-primary'
                      }`}
                      value={fileObj.progress} 
                      max="100"
                    ></progress>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {fileObj.status === 'pending' && (
                        <span className="badge badge-ghost">In Queue</span>
                      )}
                      {fileObj.status === 'processing' && (
                        <span className="badge badge-primary">Processing</span>
                      )}
                      {fileObj.status === 'completed' && (
                        <span className="badge badge-success">Completed</span>
                      )}
                      {fileObj.status === 'error' && (
                        <span className="badge badge-error">Error</span>
                      )}
                    </div>
                    <span className="text-sm opacity-70">
                      Added {new Date(fileObj.addedAt).toLocaleTimeString()}
                    </span>
                  </div>

                  {fileObj.description && (
                    <div className="mt-2 bg-base-100 p-3 rounded-lg">
                      <h4 className="font-medium text-sm opacity-70">AI Description:</h4>
                      <p className="text-sm mt-1">{fileObj.description}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {files.length === 0 && (
              <div className="text-center py-8 text-base-content/70">
                <p>No files in queue. Add files to begin processing.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;