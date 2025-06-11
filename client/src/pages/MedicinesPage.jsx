import React from "react";

const MedicinesPage = () => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Medicines</h2>
      <p className="text-gray-600">
        Medicine management interface coming soon...
      </p>
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Add Medicine</h3>
            <p className="text-sm text-gray-600 mt-2">
              Add new medicines to inventory
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Search & Filter</h3>
            <p className="text-sm text-gray-600 mt-2">
              Find medicines with advanced search
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Batch Management</h3>
            <p className="text-sm text-gray-600 mt-2">
              Track batches and expiry dates
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicinesPage;
