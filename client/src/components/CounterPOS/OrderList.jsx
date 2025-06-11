import React from "react";
import OrderRow from "./OrderRow";

const OrderList = ({ currentOrder, onUpdateQuantity, onRemoveItem }) => {
  return (
    <div className="flex-grow overflow-y-auto p-4 space-y-3">
      {currentOrder.map((item) => (
        <OrderRow
          key={item.id}
          item={item}
          onUpdateQuantity={onUpdateQuantity}
          onRemoveItem={onRemoveItem}
        />
      ))}
    </div>
  );
};

export default OrderList;
