import React from "react";
import { useParams } from "react-router-dom";

const OrderDetailPage = () => {
  const { id } = useParams();

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Order Details #{id}
      </h2>
      <p className="text-gray-600">Order details interface coming soon...</p>
      <div className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Order Information</h3>
            <p className="text-sm text-gray-600 mt-2">
              Customer and order details
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Items</h3>
            <p className="text-sm text-gray-600 mt-2">
              Ordered medicines and quantities
            </p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900">Payment</h3>
            <p className="text-sm text-gray-600 mt-2">
              Payment details and status
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
