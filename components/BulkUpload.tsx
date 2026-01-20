import React, { useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Download, FileType, Info } from 'lucide-react';
import { Link } from 'react-router-dom';

const BulkUpload: React.FC = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const validateFile = (selectedFile: File): boolean => {
    // 1. Size Check (10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > MAX_SIZE) {
        alert("File too large. Maximum file size is 10MB.");
        return false;
    }

    // 2. Type/Extension Check
    const allowedExtensions = ['.csv', '.xlsx', '.xls'];
    const fileName = selectedFile.name.toLowerCase();
    const isValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));

    if (!isValidExtension) {
        alert("Invalid file type. Please upload a .csv, .xlsx, or .xls file.");
        return false;
    }

    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      } else {
        // Clear the input so the same file can be selected again if fixed/user wants to retry
        e.target.value = '';
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center space-x-4 mb-4">
        <Link to="/vendors" className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
            <ArrowLeft className="w-6 h-6 text-gray-400 group-hover:text-gray-600" />
        </Link>
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Bulk Upload Vendors</h1>
            <p className="text-gray-500">Import multiple vendors at once using a spreadsheet.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex-1">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
            {/* Left Column: Instructions */}
            <div className="flex flex-col">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-indigo-50 rounded-lg">
                        <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Import Instructions</h3>
                </div>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                    Yes, upload your vendors on this page. We support bulk ingestion of vendor data. Please ensure your spreadsheet matches the required structure below.
                </p>

                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5 flex items-start">
                    <Info className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-blue-800">Limit: 10 Vendors per Batch</h4>
                        <p className="text-xs text-blue-600 mt-1">
                            Current plan limits bulk processing to <strong>10 records</strong> at a time. If your file contains more rows, only the first 10 will be imported.
                        </p>
                    </div>
                </div>

                <div className="bg-slate-50 rounded-lg border border-slate-200 overflow-hidden mb-4">
                    <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Required Columns</span>
                        <span className="text-xs font-medium text-slate-500">Row 1 must contain headers</span>
                    </div>
                    <div className="p-3">
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li className="flex items-start">
                                <span className="w-24 font-semibold text-gray-900 flex-shrink-0">Name</span> 
                                <span>Legal company name</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-24 font-semibold text-gray-900 flex-shrink-0">Industry</span> 
                                <span>Primary business sector</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-24 font-semibold text-gray-900 flex-shrink-0">Location</span> 
                                <span>City and Country (e.g. <em>Taipei</em>)</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-24 font-semibold text-gray-900 flex-shrink-0">Description</span> 
                                <span>Summary of services</span>
                            </li>
                            <li className="flex items-start">
                                <span className="w-24 font-semibold text-gray-900 flex-shrink-0">Website</span> 
                                <span className="text-gray-500 italic">Optional</span>
                            </li>
                        </ul>
                    </div>
                </div>

                 <div className="flex items-center space-x-2 text-xs text-gray-500 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md inline-flex w-fit">
                    <FileType className="w-3.5 h-3.5" />
                    <span>Supported formats: <strong>.csv</strong> or <strong>.xlsx</strong></span>
                </div>
            </div>

            {/* Right Column: Dropzone & Actions */}
            <div className="flex flex-col h-full">
                 <div 
                    className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center transition-all duration-200 ease-in-out p-6 mb-6 ${
                        dragActive ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input 
                        type="file" 
                        id="file-upload" 
                        className="hidden" 
                        accept=".csv,.xlsx,.xls"
                        onChange={handleChange}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer w-full h-full flex flex-col items-center justify-center">
                        {file ? (
                            <div className="animate-in fade-in zoom-in duration-300">
                                <CheckCircle className="w-12 h-12 text-green-500 mb-3 mx-auto" />
                                <span className="text-lg font-bold text-gray-900 block">{file.name}</span>
                                <span className="text-sm text-gray-500 mt-1 block">{(file.size / 1024).toFixed(2)} KB • Ready to upload</span>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-indigo-50 rounded-full mb-4">
                                    <Upload className="w-8 h-8 text-indigo-600" />
                                </div>
                                <span className="text-base font-semibold text-gray-900">Click to upload or drag and drop</span>
                                <span className="text-xs text-gray-500 mt-2">Maximum file size 10MB</span>
                            </>
                        )}
                    </label>
                </div>

                <div className="flex justify-end items-center space-x-4 border-t border-gray-100 pt-4">
                    <Link to="/vendors" className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors text-sm">
                        Cancel
                    </Link>
                    <button 
                        disabled={!file}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center text-sm"
                        onClick={() => alert("File received. Parsing logic would execute here.")}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Vendors
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;