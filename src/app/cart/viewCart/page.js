"use client";

import { useEffect, useState, useMemo } from "react";
import ProductImage from "@/app/components/ProductImage";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { formatPrice } from "@/lib/formatPrice";
import { cartFunctions } from "@/lib/supabase/api";
import { useLoadingFavicon } from "@/app/hooks/useLoadingFavicon";
import { useCart } from "@/app/hooks/useCart";
import ThemeToggle from "@/app/components/ThemeToggle";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import { Trash, Plus, Minus, ShoppingBag, AlertCircle, Timer, ArrowRight } from "griddy-icons";

export default function ViewCart() {
  const [removingId, setRemovingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [clearingCart, setClearingCart] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const { username } = useAuth();
  const { cartItems, loading, invalidateCart, isError } = useCart(username);
  useEffect(() => {
    if (isError) setErrorMessage("Failed to load cart");
  }, [isError]);

  useLoadingFavicon(loading, "Shopping Cart");

  useEffect(() => {
    if (!username) {
      router.push("/");
    }
  }, [username, router]);

  const handleQuantityChange = async (itemId, action) => {
    setUpdatingId(itemId);
    setErrorMessage("");

    try {
      const data = await cartFunctions.updateCartQuantity(itemId, action, username);

      if (data.success) {
        invalidateCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setErrorMessage(data.message || "Failed to update quantity");
      }
    } catch (error) {
      setErrorMessage(error.response?.message || error.message || "Failed to update quantity");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId) => {
    setRemovingId(itemId);
    setErrorMessage("");

    try {
      const data = await cartFunctions.removeFromCart(itemId, username);

      if (data.success) {
        invalidateCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setErrorMessage(data.message || "Failed to remove item");
      }
    } catch (error) {
      setErrorMessage(`Error: ${error.message || "Failed to remove item"}`);
    } finally {
      setRemovingId(null);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => {
      return total + parseFloat(item.price || 0) * (item.quantity || 1);
    }, 0);
  };

  const calculateTax = () => {
    return calculateSubtotal() * 0.06;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      setErrorMessage("Your cart is empty");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }

    const itemIds = cartItems.map(item => item.id);
    router.push(`/checkout?items=${encodeURIComponent(JSON.stringify(itemIds))}`);
  };

  const handleClearCart = async () => {
    if (cartItems.length === 0) return;
    setClearingCart(true);
    setErrorMessage("");
    try {
      const data = await cartFunctions.clearCart();
      if (data?.success) {
        invalidateCart();
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        setErrorMessage(data?.message || "Failed to clear cart");
      }
    } catch (e) {
      setErrorMessage(e?.message || "Failed to clear cart");
    } finally {
      setClearingCart(false);
    }
  };

  const subtotal = calculateSubtotal();
  const tax = calculateTax();
  const total = calculateTotal();

  return (
    <>
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push("/dashboard")}>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Totally Normal</span>
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Store</span>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Shop</button>
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Categories</button>
                <button className="text-gray-700 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400 transition-colors">Deals</button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Breadcrumbs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-8 py-3">
            <nav className="text-sm text-gray-500 dark:text-gray-400">
              <span className="hover:text-orange-500 dark:hover:text-orange-400 cursor-pointer" onClick={() => router.push("/dashboard")}>Home</span>
              <span className="mx-2">/</span>
              <span className="text-gray-900 dark:text-gray-100 font-semibold">Cart</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 py-8">
          {errorMessage && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
              <p className="text-red-800 dark:text-red-300 font-semibold">{errorMessage}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="md" color="orange" />
                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading your cart...</p>
              </div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={52} className="text-5xl text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                Your cart is empty
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Looks like you haven't added any items to your cart yet. Start shopping to fill it up!
              </p>
              <button
                onClick={() => router.push("/dashboard")}
                className="px-8 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-xl font-semibold transition-all shadow-md hover:shadow-lg"
              >
                Start Shopping
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Cart Items */}
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Your Shopping Cart</h1>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600 dark:text-gray-400">{cartItems.length} Items</span>
                      <button
                        type="button"
                        onClick={handleClearCart}
                        disabled={clearingCart}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                      >
                        {clearingCart ? "Clearing…" : "Clear cart"}
                      </button>
                    </div>
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
                            src={item.id_url || item.idUrl}
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
                            onClick={() => handleRemove(item.id)}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                          >
                            REMOVE
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(item.id, "decrease")}
                            disabled={updatingId === item.id}
                            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-l-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
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
                            onClick={() => handleQuantityChange(item.id, "increase")}
                            disabled={updatingId === item.id}
                            className="w-8 h-8 border border-gray-300 dark:border-gray-600 rounded-r-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                          >
                            {updatingId === item.id ? (
                              <Timer size={14} className="text-xs animate-spin" />
                            ) : (
                              <Plus size={14} className="text-xs" />
                            )}
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

                  <button
                    onClick={handleCheckout}
                    disabled={cartItems.length === 0}
                    className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete Purchase
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
    </>
  );
}
