import React from "react";
import MedicineCard from "./MedicineCard";

const MedicineList = ({ medicines, onAddToOrder }) => {
  if (!medicines || medicines.length === 0) {
    return (
      <div className="text-center py-10">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 10a.01.01 0 01.01-.01M10 10a.01.01 0 00-.01-.01M14 10a.01.01 0 01.01-.01M14 10a.01.01 0 00-.01-.01M10 14a.01.01 0 01.01-.01M10 14a.01.01 0 00-.01-.01M14 14a.01.01 0 01.01-.01M14 14a.01.01 0 00-.01-.01"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          No medicines found
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your search or filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {medicines.map((medicine) => (
        <MedicineCard
          key={medicine.id}
          medicine={medicine}
          onAddToOrder={onAddToOrder}
        />
      ))}
    </div>
  );
};

export default MedicineList;
