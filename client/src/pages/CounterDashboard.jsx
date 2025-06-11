import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  searchMedicines,
  clearSearchResults,
} from "../store/slices/medicineSlice";
import {
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  setCustomerInfo,
  setPaymentMethod,
  createOrder,
} from "../store/slices/orderSlice";

// Enhanced Components
import QuickSearchBar from "../components/Counter/QuickSearchBar";
import MedicineSearchResults from "../components/Counter/MedicineSearchResults";
import ShoppingCart from "../components/Counter/ShoppingCart";
import CustomerInfoPanel from "../components/Counter/CustomerInfoPanel";
import PaymentPanel from "../components/Counter/PaymentPanel";
import QuickAccessMedicines from "../components/Counter/QuickAccessMedicines";
import DailySummary from "../components/Counter/DailySummary";
import ReceiptModal from "../components/Counter/ReceiptModal";

const CounterDashboard = () => {
  const dispatch = useDispatch();
  const { searchResults, isSearching } = useSelector(
    (state) => state.medicines
  );
  const { cart, customerInfo, paymentMethod, isCreating } = useSelector(
    (state) => state.orders
  );
  const { user } = useSelector((state) => state.auth);

  // Check if user is counter staff (hide profit info)
  const isCounterStaff = user?.role === "counter";

  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("search"); // search, cart, payment
  const [discountAmount, setDiscountAmount] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Quick access medicines (most commonly sold)
  const [quickAccessMedicines] = useState([
    { id: 1, name: "Paracetamol 650mg", price: 2.5 },
    { id: 2, name: "Crocin Advance", price: 15.0 },
    { id: 3, name: "Combiflam", price: 25.0 },
    { id: 4, name: "Cetirizine 10mg", price: 8.0 },
    { id: 5, name: "ORS Powder", price: 12.0 },
    { id: 6, name: "Digene Tablet", price: 18.0 },
  ]);

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileCart, setShowMobileCart] = useState(false);

  // Search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        dispatch(
          searchMedicines({
            query: searchQuery.trim(),
            limit: 50,
          })
        );
      } else {
        dispatch(clearSearchResults());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, dispatch]);

  // Handle responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate order totals (hide profit from counter staff)
  const orderTotals = useMemo(() => {
    const subtotal = cart.reduce((total, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      const itemDiscount = (itemTotal * (item.discountPercent || 0)) / 100;
      return total + (itemTotal - itemDiscount);
    }, 0);

    const globalDiscount = Math.min(discountAmount, subtotal);
    const grandTotal = subtotal - globalDiscount;

    let profit = 0;

    // Only calculate profit for non-counter staff
    if (!isCounterStaff) {
      profit =
        cart.reduce((total, item) => {
          const retailTotal = item.unitPrice * item.quantity;
          const tradeTotal =
            (item.tradePrice || item.unitPrice * 0.7) * item.quantity;
          const itemDiscount =
            (retailTotal * (item.discountPercent || 0)) / 100;
          return total + (retailTotal - itemDiscount - tradeTotal);
        }, 0) - globalDiscount;
    }

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      globalDiscount: Math.round(globalDiscount * 100) / 100,
      grandTotal: Math.round(grandTotal * 100) / 100,
      profit: Math.round(profit * 100) / 100,
      itemCount: cart.reduce((total, item) => total + item.quantity, 0),
    };
  }, [cart, discountAmount, isCounterStaff]);

  // Enhanced inventory validation
  const validateCartItemQuantity = (medicine, requestedQuantity) => {
    // Check if medicine has sufficient stock
    if (requestedQuantity > medicine.quantity) {
      return {
        isValid: false,
        message: `Only ${medicine.quantity} units available in stock`,
        maxQuantity: medicine.quantity,
      };
    }

    // Check if adding to existing cart item would exceed stock
    const existingCartItem = cart.find(
      (item) => item.medicineId === medicine._id
    );
    const currentCartQuantity = existingCartItem?.quantity || 0;
    const totalRequestedQuantity = currentCartQuantity + requestedQuantity;

    if (totalRequestedQuantity > medicine.quantity) {
      return {
        isValid: false,
        message: `Cannot add ${requestedQuantity} more. Already have ${currentCartQuantity} in cart. Max available: ${medicine.quantity}`,
        maxQuantity: medicine.quantity - currentCartQuantity,
      };
    }

    return { isValid: true };
  };

  // Event handlers
  const handleAddToCart = (medicine, quantity = 1, discountPercent = 0) => {
    // Validate inventory before adding
    const validation = validateCartItemQuantity(medicine, quantity);

    if (!validation.isValid) {
      toast.error(validation.message);
      return;
    }

    const cartItem = {
      medicineId: medicine._id,
      name: medicine.name,
      unitPrice: medicine.retailPrice,
      tradePrice: medicine.tradePrice,
      quantity: quantity,
      discountPercent: discountPercent,
      availableStock: medicine.quantity,
      gstPerUnit: medicine.gstPerUnit || 0,
      manufacturer: medicine.manufacturer,
      batchNumber: medicine.batchNumber,
    };

    dispatch(addToCart(cartItem));
    toast.success(`${medicine.name} added to cart`);

    // Auto switch to cart view on mobile after adding item
    if (isMobile) {
      setShowMobileCart(true);
    }
  };

  const handleUpdateCartItem = (medicineId, updates) => {
    // If updating quantity, validate against available stock
    if (updates.quantity !== undefined) {
      const cartItem = cart.find((item) => item.medicineId === medicineId);
      if (!cartItem) return;

      // Find the original medicine data to check stock
      const medicine = searchResults.find((med) => med._id === medicineId);
      if (medicine && updates.quantity > medicine.quantity) {
        toast.error(`Only ${medicine.quantity} units available in stock`);
        return;
      }

      // Ensure quantity is not negative
      if (updates.quantity < 0) {
        toast.error("Quantity cannot be negative");
        return;
      }

      // If quantity is 0, remove item instead
      if (updates.quantity === 0) {
        handleRemoveFromCart(medicineId);
        return;
      }
    }

    dispatch(updateCartItem({ medicineId, ...updates }));
  };

  const handleRemoveFromCart = (medicineId) => {
    dispatch(removeFromCart(medicineId));
    toast.success("Item removed from cart");
  };

  const handleClearCart = () => {
    if (window.confirm("Are you sure you want to clear the entire cart?")) {
      dispatch(clearCart());
      setDiscountAmount(0);
      toast.success("Cart cleared");
    }
  };

  const handleCustomerSelect = (customer) => {
    setSelectedCustomer(customer);
    dispatch(setCustomerInfo(customer));
  };

  const handleCompleteOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    // Final inventory validation before submitting order
    const invalidItems = [];
    cart.forEach((item) => {
      const medicine = searchResults.find((med) => med._id === item.medicineId);
      if (medicine && item.quantity > medicine.quantity) {
        invalidItems.push({
          name: item.name,
          requested: item.quantity,
          available: medicine.quantity,
        });
      }
    });

    if (invalidItems.length > 0) {
      const errorMessage = invalidItems
        .map(
          (item) =>
            `${item.name}: requested ${item.requested}, available ${item.available}`
        )
        .join("; ");
      toast.error(`Insufficient stock: ${errorMessage}`);
      return;
    }

    const orderData = {
      items: cart.map((item) => ({
        medicineId: item.medicineId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tradePrice: item.tradePrice || item.unitPrice * 0.7,
        discountPercent: item.discountPercent || 0,
        gstPerUnit: item.gstPerUnit || 0,
      })),
      customer: customerInfo,
      payment: {
        method: paymentMethod,
        globalDiscount: discountAmount,
      },
      totals: orderTotals,
      status: "completed",
    };

    try {
      const result = await dispatch(createOrder(orderData)).unwrap();
      toast.success("Order completed successfully!");

      // Store order data for receipt (exclude profit for counter staff)
      const receiptData = {
        orderId: result.orderId || result._id,
        items: cart,
        customer: customerInfo,
        totals: isCounterStaff
          ? { ...orderTotals, profit: undefined } // Hide profit from receipt
          : orderTotals,
        paymentMethod,
        timestamp: new Date().toISOString(),
      };

      setLastOrderData(receiptData);
      setShowReceipt(true);

      // Reset form
      dispatch(clearCart());
      setSelectedCustomer(null);
      setDiscountAmount(0);
      setActiveTab("search");
      setShowMobileCart(false);
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error(error?.message || "Failed to complete order");
    }
  };

  const handleSaveOrder = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }

    // Final inventory validation before saving order
    const invalidItems = [];
    cart.forEach((item) => {
      const medicine = searchResults.find((med) => med._id === item.medicineId);
      if (medicine && item.quantity > medicine.quantity) {
        invalidItems.push({
          name: item.name,
          requested: item.quantity,
          available: medicine.quantity,
        });
      }
    });

    if (invalidItems.length > 0) {
      const errorMessage = invalidItems
        .map(
          (item) =>
            `${item.name}: requested ${item.requested}, available ${item.available}`
        )
        .join("; ");
      toast.error(`Insufficient stock: ${errorMessage}`);
      return;
    }

    const orderData = {
      items: cart.map((item) => ({
        medicineId: item.medicineId,
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        tradePrice: item.tradePrice || item.unitPrice * 0.7,
        discountPercent: item.discountPercent || 0,
      })),
      customer: customerInfo,
      payment: {
        method: paymentMethod || "pending",
        globalDiscount: discountAmount,
      },
      totals: orderTotals,
      status: "pending",
    };

    try {
      await dispatch(createOrder(orderData)).unwrap();
      toast.success("Order saved as pending!");

      // Reset form
      dispatch(clearCart());
      setSelectedCustomer(null);
      setDiscountAmount(0);
      setActiveTab("search");
      setShowMobileCart(false);
    } catch (error) {
      console.error("Order save error:", error);
      toast.error(error?.message || "Failed to save order");
    }
  };

  // Mobile cart overlay
  if (isMobile && showMobileCart) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Mobile Cart Header */}
        <div className="bg-blue-600 text-white p-4 flex items-center justify-between">
          <button
            onClick={() => setShowMobileCart(false)}
            className="flex items-center space-x-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back to Search</span>
          </button>
          <h1 className="text-lg font-semibold">
            Cart ({orderTotals.itemCount} items)
          </h1>
        </div>

        {/* Mobile Cart Content */}
        <div className="flex-1 overflow-y-auto">
          <ShoppingCart
            cart={cart}
            onUpdateItem={handleUpdateCartItem}
            onRemoveItem={handleRemoveFromCart}
            onClearCart={handleClearCart}
            totals={orderTotals}
            discountAmount={discountAmount}
            setDiscountAmount={setDiscountAmount}
            isCounterStaff={isCounterStaff}
            isMobile={true}
          />
        </div>

        {/* Mobile Payment Actions */}
        <div className="p-4 bg-white border-t">
          <div className="flex space-x-3">
            <button
              onClick={handleSaveOrder}
              disabled={isCreating || cart.length === 0}
              className="flex-1 py-3 px-4 bg-gray-600 text-white rounded-lg disabled:opacity-50"
            >
              Save Order
            </button>
            <button
              onClick={() => setActiveTab("payment")}
              disabled={cart.length === 0}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg disabled:opacity-50"
            >
              Proceed to Pay
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Payment screen (mobile)
  if (isMobile && activeTab === "payment") {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Payment Header */}
        <div className="bg-green-600 text-white p-4 flex items-center justify-between">
          <button
            onClick={() => setActiveTab("search")}
            className="flex items-center space-x-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-lg font-semibold">Payment</h1>
        </div>

        {/* Payment Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <CustomerInfoPanel
            customer={selectedCustomer}
            onCustomerSelect={handleCustomerSelect}
          />

          <PaymentPanel
            totals={orderTotals}
            paymentMethod={paymentMethod}
            onPaymentMethodChange={(method) =>
              dispatch(setPaymentMethod(method))
            }
            onCompleteOrder={handleCompleteOrder}
            isProcessing={isCreating}
          />
        </div>
      </div>
    );
  }

  // Main desktop layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Counter Dashboard
              </h1>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-500">
                <span>•</span>
                <span>{new Date().toLocaleDateString()}</span>
                <span>•</span>
                <span>{new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            {/* Mobile cart button */}
            {isMobile && (
              <button
                onClick={() => setShowMobileCart(true)}
                className="relative p-2 bg-blue-600 text-white rounded-lg"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 5.5M7 13l2 8h8m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"
                  />
                </svg>
                {cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
            )}

            {/* Desktop actions */}
            <div className="hidden md:flex items-center space-x-4">
              {/* <DailySummary /> */}
              <button
                onClick={handleClearCart}
                disabled={cart.length === 0}
                className="px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search & Medicine Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Search */}
            <QuickSearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              isSearching={isSearching}
            />

            {/* Search Results */}
            <MedicineSearchResults
              medicines={searchResults}
              onAddToCart={handleAddToCart}
              isSearching={isSearching}
              searchQuery={searchQuery}
            />
          </div>

          {/* Right Column - Cart & Actions */}
          <div className="hidden lg:block space-y-6">
            {/* Shopping Cart */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Shopping Cart ({orderTotals.itemCount} items)
                </h2>
              </div>
              <ShoppingCart
                cart={cart}
                onUpdateItem={handleUpdateCartItem}
                onRemoveItem={handleRemoveFromCart}
                onClearCart={handleClearCart}
                totals={orderTotals}
                discountAmount={discountAmount}
                setDiscountAmount={setDiscountAmount}
                isCounterStaff={isCounterStaff}
                isMobile={false}
              />
            </div>

            {/* Customer Info */}
            <CustomerInfoPanel
              customer={selectedCustomer}
              onCustomerSelect={handleCustomerSelect}
            />

            {/* Payment */}
            <PaymentPanel
              totals={orderTotals}
              paymentMethod={paymentMethod}
              onPaymentMethodChange={(method) =>
                dispatch(setPaymentMethod(method))
              }
              onCompleteOrder={handleCompleteOrder}
              onSaveOrder={handleSaveOrder}
              isProcessing={isCreating}
            />
          </div>
        </div>
      </div>

      {/* Receipt Modal */}
      <ReceiptModal
        show={showReceipt}
        onClose={() => setShowReceipt(false)}
        orderId={lastOrderData?.orderId}
        orderData={lastOrderData}
      />
    </div>
  );
};

export default CounterDashboard;
