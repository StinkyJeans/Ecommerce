"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import ProductImage from "@/app/components/ProductImage";
import { getFirstImageUrl } from "@/lib/supabase/storage";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { cartFunctions, orderFunctions, shippingFunctions } from "@/lib/supabase/api";
import { Trash, ChevronRight, Timer, Truck, CreditCard, Lock, CheckCircle, Minus, Plus, ArrowRight, Edit, Close, User, Phone, Home, LocationPin, Globe, Check } from "griddy-icons";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import ThemeToggle from "@/app/components/ThemeToggle";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { username, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);

  useLoadingFavicon(authLoading || loading || placingOrder, "Checkout");

  useEffect(() => {
    if (!authLoading && !username) {
      router.push("/");
      return;
    }
    if (username) {
      fetchCartItems();
      fetchAddresses();
    }
  }, [username, authLoading, router]);

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = addresses.find(addr => addr.is_default) || addresses[0];
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      }
    }
  }, [addresses]);

  const fetchCartItems = async () => {
    try {
      const itemsParam = searchParams.get("items");
      if (!itemsParam) {
        router.push("/cart/viewCart");
        return;
      }

      const itemIds = JSON.parse(decodeURIComponent(itemsParam));
      const data = await cartFunctions.getCart();

      const selectedItems = (data.cart || []).filter(item => itemIds.includes(item.id));
      setCartItems(selectedItems);
    } catch (error) {
      setErrorMessage("Failed to load cart items");
      router.push("/cart/viewCart");
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      const data = await shippingFunctions.getAddresses();
      if (data.success) {
        setAddresses(data.addresses || []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.06; // 6% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setErrorMessage("Please select a shipping address");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    setPlacingOrder(true);
    setErrorMessage("");

    try {
      const data = await orderFunctions.checkout({
        username,
        items: cartItems.map(item => ({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name || item.productName,
          price: item.price,
          quantity: item.quantity,
          seller_username: item.seller_username || 'Unknown',
          id_url: item.id_url || item.idUrl
        })),
        shipping_address_id: selectedAddress.id,
        payment_method: paymentMethod,
        delivery_option: "standard"
      });

      if (data.success) {
        router.push("/account?tab=orders");
      } else {
        setErrorMessage(data.message || "Failed to place order");
        setTimeout(() => setErrorMessage(""), 3000);
      }
    } catch (error) {
      const errorMessage = error.response?.message || error.message || "Something went wrong. Please try again.";
      setErrorMessage(errorMessage);
      setTimeout(() => setErrorMessage(""), 3000);
    } finally {
      setPlacingOrder(false);
    }
  };

  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    // TODO: Implement quantity update
    console.log("Update quantity:", itemId, newQuantity);
  };

  const removeItem = async (itemId) => {
    // TODO: Implement remove item
    console.log("Remove item:", itemId);
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-orange-500 dark:border-orange-400 rounded-full loading-spinner-animated" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#1a1a1a]">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Totally Normal</span>
              <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
              <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Store</span>
            </div>
            <div className="flex items-center gap-6">
              <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Shop</button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Categories</button>
              <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Deals</button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl border-none focus:ring-2 focus:ring-orange-500 outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                />
                <ChevronRight size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
              <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Breadcrumbs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <nav className="text-sm text-gray-500 dark:text-gray-400">
            <span>Cart</span>
            <span className="mx-2">/</span>
            <span>Information</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-gray-100 font-semibold">Checkout</span>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {errorMessage && (
          <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
            <p className="text-red-800 dark:text-red-300 font-semibold">{errorMessage}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shopping Cart Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Shopping Cart</h1>
                <span className="text-gray-600 dark:text-gray-400">{cartItems.length} Items</span>
              </div>

              <div className="border-b border-gray-200 dark:border-gray-700 mb-4 pb-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  <div className="col-span-6">Product</div>
                  <div className="col-span-3 text-center">Quantity</div>
                  <div className="col-span-3 text-right">Total</div>
                </div>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700 flex-shrink-0">
                      <ProductImage
                        src={getFirstImageUrl(item.id_url || item.idUrl)}
                        alt={item.product_name || item.productName}
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {item.product_name || item.productName}
                      </h3>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      >
                        REMOVE
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) - 1)}
                        className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-l-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Minus size={14} className="text-xs" />
                      </button>
                      <input
                        type="number"
                        value={item.quantity || 1}
                        readOnly
                        className="w-12 h-8 border-y border-gray-300 dark:border-gray-600 text-center text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                      />
                      <button
                        onClick={() => updateQuantity(item.id, (item.quantity || 1) + 1)}
                        className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-r-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <Plus size={14} className="text-xs" />
                      </button>
                    </div>
                    <div className="w-24 text-right">
                      <p className="font-bold text-gray-900 dark:text-gray-100">
                        ₱{formatPrice(parseFloat(item.price || 0) * (item.quantity || 1))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Information */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Truck size={20} className="text-orange-500" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Shipping Information</h2>
                </div>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="px-4 py-2 text-sm font-medium text-[#FFBF00] hover:text-[#e6ac00] hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Edit size={16} className="text-sm" />
                  Edit
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                  <input
                    type="text"
                    value={selectedAddress?.full_name || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                  <input
                    type="text"
                    value={selectedAddress?.phone_number || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address Line 1</label>
                  <input
                    type="text"
                    value={selectedAddress?.address_line1 || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Address Line 2 (Optional)</label>
                  <input
                    type="text"
                    value={selectedAddress?.address_line2 || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">City</label>
                    <input
                      type="text"
                      value={selectedAddress?.city || ""}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Province</label>
                    <input
                      type="text"
                      value={selectedAddress?.province || ""}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={selectedAddress?.postal_code || ""}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Country</label>
                    <input
                      type="text"
                      value={selectedAddress?.country || ""}
                      readOnly
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard size={20} className="text-orange-500" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payment Method</h2>
              </div>

              <div className="space-y-4">
                {/* Credit Card Option */}
                <div className={`p-4 rounded-xl border-2 ${paymentMethod === "card" ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === "card" ? "bg-orange-500 border-orange-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {paymentMethod === "card" && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">Credit Card</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">All major cards accepted</p>
                    </div>
                    <CreditCard size={20} className="text-2xl text-gray-400" />
                  </div>
                  {paymentMethod === "card" && (
                    <div className="space-y-3 pl-8">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Card Number</label>
                        <div className="relative">
                          <CreditCard size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="0000 0000 0000 0000"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">MM/YY</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">CVV</label>
                          <input
                            type="text"
                            placeholder="***"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* PayPal Option */}
                <div className={`p-4 rounded-xl border ${paymentMethod === "paypal" ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 ${paymentMethod === "paypal" ? "bg-orange-500 border-orange-500" : "border-gray-300 dark:border-gray-600"}`}>
                      {paymentMethod === "paypal" && <div className="w-full h-full rounded-full bg-white scale-50"></div>}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">PayPal</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Pay with your PayPal account</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-200 dark:border-gray-700 sticky top-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">₱{formatPrice(subtotal.toFixed(2))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Shipping</span>
                  <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Estimated Tax</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">₱{formatPrice(tax.toFixed(2))}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Total</span>
                  <span className="text-2xl font-bold text-orange-500">₱{formatPrice(total.toFixed(2))}</span>
                </div>
              </div>

              {/* Promo Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="NORMAL10"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                  <button className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors">
                    Apply
                  </button>
                </div>
              </div>

              {/* Complete Purchase Button */}
              <button
                onClick={handlePlaceOrder}
                disabled={placingOrder || !selectedAddress || cartItems.length === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {placingOrder ? (
                  <>
                    <Timer size={24} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Complete Purchase
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Secure Checkout */}
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4 flex items-center justify-center gap-2">
                <Lock size={16} className="text-sm" />
                SECURE CHECKOUT POWERED BY NORMALPAY
              </p>

              {/* Normal Guarantee */}
              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle size={20} className="text-green-600 dark:text-green-400 text-xl mt-1" />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Normal Guarantee</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      We offer a 30-day return policy on all items. If you're not completely satisfied, return your purchase for a full refund.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddressModal(false)}
        >
          <div
            className="bg-white dark:bg-[#2C2C2C] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-[#E0E0E0] dark:border-[#404040]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#E0E0E0] dark:border-[#404040] flex items-center justify-between">
              <h3 className="text-xl font-bold text-[#2C2C2C] dark:text-[#e5e5e5]">Select Shipping Address</h3>
              <button
                onClick={() => setShowAddressModal(false)}
                className="text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-[#e5e5e5] transition-colors"
              >
                <Close size={24} className="text-xl" />
              </button>
            </div>

            {/* Address List */}
            <div className="flex-1 overflow-y-auto p-6">
              {addresses.length === 0 ? (
                <div className="text-center py-12">
                  <LocationPin size={48} className="text-5xl text-[#666666] dark:text-[#a3a3a3] mb-4" />
                  <p className="text-[#666666] dark:text-[#a3a3a3] text-lg font-semibold mb-2">No addresses found</p>
                  <p className="text-[#666666] dark:text-[#a3a3a3] text-sm mb-6">Please add an address in your account settings</p>
                  <button
                    onClick={() => {
                      setShowAddressModal(false);
                      router.push("/account?tab=addresses");
                    }}
                    className="px-6 py-3 bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-xl font-semibold transition-colors"
                  >
                    Go to Addresses
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((address) => (
                    <div
                      key={address.id}
                      onClick={() => {
                        setSelectedAddress(address);
                        setShowAddressModal(false);
                      }}
                      className={`p-5 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedAddress?.id === address.id
                          ? "border-[#FFBF00] bg-amber-50 dark:bg-amber-900/20"
                          : "border-[#E0E0E0] dark:border-[#404040] hover:border-[#FFBF00] bg-white dark:bg-[#1a1a1a]"
                      }`}
                    >
                      {address.is_default && (
                        <div className="mb-3 inline-flex items-center gap-2 px-3 py-1 bg-[#4CAF50] text-white text-xs font-semibold rounded-full">
                          <Check size={14} className="text-xs" />
                          <span>Default</span>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-start gap-2">
                          <User size={16} className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#666666] dark:text-[#a3a3a3] uppercase mb-1">Name</p>
                            <p className="font-bold text-[#2C2C2C] dark:text-[#e5e5e5] break-words">{address.full_name}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Phone size={16} className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#666666] dark:text-[#a3a3a3] uppercase mb-1">Phone</p>
                            <p className="text-[#2C2C2C] dark:text-[#e5e5e5] break-words">{address.phone_number}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Home size={16} className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-[#666666] dark:text-[#a3a3a3] uppercase mb-1">Address</p>
                            <p className="text-[#2C2C2C] dark:text-[#e5e5e5] break-words">{address.address_line1}</p>
                            {address.address_line2 && (
                              <p className="text-[#666666] dark:text-[#a3a3a3] break-words">{address.address_line2}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <LocationPin size={48} className="text-[#666666] dark:text-[#a3a3a3] text-sm mt-1 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[#2C2C2C] dark:text-[#e5e5e5] break-words">
                              {address.city}, {address.province} {address.postal_code}
                            </p>
                            <p className="text-[#666666] dark:text-[#a3a3a3] break-words">{address.country}</p>
                          </div>
                        </div>
                      </div>
                      {selectedAddress?.id === address.id && (
                        <div className="mt-3 pt-3 border-t border-[#E0E0E0] dark:border-[#404040] flex items-center gap-2 text-[#FFBF00]">
                          <CheckCircle size={20} className="text-sm" />
                          <span className="text-sm font-medium">Selected</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {addresses.length > 0 && (
              <div className="px-6 py-4 border-t border-[#E0E0E0] dark:border-[#404040] flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddressModal(false);
                    router.push("/account?tab=addresses");
                  }}
                  className="px-4 py-2 text-sm font-medium text-[#666666] dark:text-[#a3a3a3] hover:text-[#2C2C2C] dark:hover:text-[#e5e5e5] transition-colors"
                >
                  Manage Addresses
                </button>
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="px-6 py-2 bg-[#FFBF00] hover:bg-[#e6ac00] text-white rounded-lg font-semibold transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-6 text-sm text-gray-600 dark:text-gray-400">
              <button className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Privacy Policy</button>
              <button className="hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Terms of Service</button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">© 2024 Totally Normal Store, Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-[#1a1a1a]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 border-4 border-t-transparent border-orange-500 dark:border-orange-400 rounded-full loading-spinner-animated" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Loading checkout...</p>
        </div>
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
