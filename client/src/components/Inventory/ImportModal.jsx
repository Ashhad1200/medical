import React from "react";

const ImportModal = ({
  show,
  onClose,
  importFile,
  onFileUpload,
  onImport,
  isLoading,
}) => {
  if (!show) return null;

  const downloadSampleTemplate = () => {
    const csvContent = `Name,Manufacturer,Batch Number,Retail Price,Trade Price,GST Per Unit,Quantity,Expiry Date,Category,Description
Paracetamol 500mg,ABC Pharma,PARA001,25.00,20.00,1.25,100,2025-12-31,Pain Relief,Pain and fever relief medication
Amoxicillin 250mg,XYZ Medical,AMOX001,50.00,40.00,2.50,200,2025-06-15,Antibiotic,Broad-spectrum antibiotic
Cetirizine 10mg,ABC Pharma,CETI001,15.00,12.00,0.75,150,2025-08-20,Antihistamine,Allergy relief medication`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "medicine-import-template.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const fileTypes = [
    { ext: ".xlsx", desc: "Excel Workbook" },
    { ext: ".xls", desc: "Excel 97-2003 Workbook" },
    { ext: ".csv", desc: "Comma Separated Values" },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Import Medicines
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Upload a file to add multiple medicines at once
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  Import Instructions
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Download the sample template to see the required format
                    </li>
                    <li>
                      Fill in your medicine data following the same column
                      structure
                    </li>
                    <li>
                      Ensure all required fields are filled (Name, Manufacturer,
                      Retail Price, etc.)
                    </li>
                    <li>Use YYYY-MM-DD format for expiry dates</li>
                    <li>Retail price must be greater than trade price</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Template Download */}
          <div className="text-center">
            <button
              onClick={downloadSampleTemplate}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Sample Template
            </button>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Select File to Import
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={onFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <svg
                  className="w-12 h-12 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m3 3V10"
                  />
                </svg>
                <span className="text-lg font-medium text-gray-700 mb-2">
                  Click to upload or drag and drop
                </span>
                <span className="text-sm text-gray-500">
                  Supported formats:{" "}
                  {fileTypes.map((type) => type.ext).join(", ")}
                </span>
              </label>
            </div>

            {/* Supported File Types */}
            <div className="grid grid-cols-3 gap-3">
              {fileTypes.map((type, index) => (
                <div
                  key={index}
                  className="text-center p-3 bg-gray-50 rounded-lg"
                >
                  <div className="text-xs font-medium text-gray-900">
                    {type.ext.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{type.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected File Display */}
          {importFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-green-800">
                    File Selected
                  </p>
                  <p className="text-sm text-green-700">{importFile.name}</p>
                  <p className="text-xs text-green-600 mt-1">
                    Size: {(importFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                <button
                  onClick={() => onFileUpload({ target: { files: [] } })}
                  className="flex-shrink-0 p-1 text-green-600 hover:text-green-800"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Validation Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important Notes
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>
                      Duplicate medicines (same name + manufacturer) will be
                      skipped
                    </li>
                    <li>Invalid data rows will be reported after import</li>
                    <li>
                      Successfully imported medicines will be added to inventory
                    </li>
                    <li>The import process cannot be undone</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onImport}
              disabled={!importFile || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Importing...
                </div>
              ) : (
                "Import Medicines"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
